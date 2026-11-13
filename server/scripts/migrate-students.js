// One-time upgrade of the database to "one document per student".
//
// Before: every course registration was its own document (a student in 3 courses = 3 documents
//         sharing the same roll number), and a student couldn't exist without a course.
// After:  one document per student, with their courses in a `courses` list.
//
// Usage (from the server folder):  npm run migrate
// A backup of the old documents is written to server/backups/ first. Running it again is safe:
// documents that are already in the new format are left alone.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Student = require('../models/Student');

const firstFilled = (docs, field) => docs.map((d) => d[field]).find((v) => v) || undefined;

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in server/.env');
  await mongoose.connect(process.env.MONGO_URI);
  const collection = mongoose.connection.db.collection('students');

  // Old-format documents have a top-level `course` and no `courses` list
  const oldDocs = await collection.find({ courses: { $exists: false } }).sort({ createdAt: 1 }).toArray();
  if (oldDocs.length === 0) {
    console.log('Nothing to migrate: all students are already in the new format.');
    await Student.syncIndexes();
    return;
  }

  // 1. Back up the old documents
  const backupDir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `students-before-migration-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(oldDocs, null, 2));
  console.log(`Backed up ${oldDocs.length} old documents to ${backupFile}`);

  // 2. Group the registrations by roll number → one student each
  const groups = new Map();
  for (const doc of oldDocs) {
    if (!groups.has(doc.rollNumber)) groups.set(doc.rollNumber, []);
    groups.get(doc.rollNumber).push(doc);
  }

  const students = [...groups.values()].map((docs) => {
    const newest = docs[docs.length - 1]; // the most recently added record has the latest details
    return {
      _id: docs[0]._id, // keep the oldest record's id
      firstName: newest.firstName,
      lastName: newest.lastName,
      email: newest.email,
      rollNumber: newest.rollNumber,
      phone: firstFilled([...docs].reverse(), 'phone'),
      guardianPhone: firstFilled([...docs].reverse(), 'guardianPhone'),
      major: newest.major,
      year: newest.year,
      courses: docs
        .filter((d) => d.course)
        .map((d) => ({
          _id: new mongoose.Types.ObjectId(),
          name: d.course,
          year: d.year,
          status: 'registered',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
      createdAt: docs[0].createdAt,
      updatedAt: newest.updatedAt,
    };
  });

  // 3. Replace the old documents. The old unique indexes (roll number + course, email + course)
  //    are removed first; syncIndexes then builds the new ones (unique roll number, unique email).
  for (const name of ['rollNumber_1_course_1', 'email_1_course_1']) {
    await collection.dropIndex(name).catch(() => {}); // fine if it doesn't exist
  }
  await collection.deleteMany({ _id: { $in: oldDocs.map((d) => d._id) } });
  await collection.insertMany(students);
  await Student.syncIndexes();

  console.log(`Migrated ${oldDocs.length} course registrations into ${students.length} students:`);
  for (const s of students) {
    console.log(`  ${s.rollNumber}  ${s.firstName} ${s.lastName}  (${s.courses.length} courses)`);
  }
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
