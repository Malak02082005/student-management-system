const express = require('express');
const Student = require('../models/Student');
const { isValidCourse } = require('../data/courses');

const router = express.Router();

// Accept only known fields, so clients can't set _id, createdAt, courses, etc.
const pickDetails = ({
  firstName, lastName, email, rollNumber, phone, guardianPhone, major, year,
} = {}) => ({ firstName, lastName, email, rollNumber, phone, guardianPhone, major, year });

const clean = (value) => (value == null ? '' : String(value).trim());
const currentCourses = (student) => student.courses.filter((c) => c.status === 'registered');

// Loads the student from :id, or answers 404
async function findStudent(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) res.status(404).json({ message: 'Student not found' });
  return student;
}

// Can this student register in `course` right now? Returns an error message, or null.
// Courses must be offered for their major in their current year, and can't be taken twice.
function courseProblem(student, course, { ignoreId } = {}) {
  if (!course) return 'Course is required';
  if (!isValidCourse(student.major, student.year, course)) {
    return `"${course}" is not offered for ${student.major} in Year ${student.year}`;
  }
  const existing = student.courses.find((c) => c.name === course && !c._id.equals(ignoreId));
  if (existing?.status === 'completed') return `${student.firstName} has already completed ${course}`;
  if (existing) return `${student.firstName} is already registered in ${course}`;
  return null;
}

// Course changes only touch the courses, so only they are validated. This keeps working for
// students added before phone numbers were required, until their profile is updated.
const saveCourses = (student) => student.save({ validateModifiedOnly: true });

// ---------------- Students ----------------

// READ all  →  GET /api/students   (newest first; _id breaks ties within the same millisecond)
router.get('/', async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1, _id: -1 });
  res.json(students);
});

// READ one  →  GET /api/students/:id
router.get('/:id', async (req, res) => {
  const student = await findStudent(req, res);
  if (student) res.json(student);
});

// CREATE  →  POST /api/students
// Body: the student's details, plus an optional first `course`.
router.post('/', async (req, res) => {
  const student = new Student(pickDetails(req.body));
  const course = clean(req.body.course);
  if (course) {
    // Check the details first, so a missing major/year is reported as such
    await student.validate();
    const problem = courseProblem(student, course);
    if (problem) return res.status(400).json({ message: problem });
    student.courses.push({ name: course, year: student.year });
  }
  await student.save();
  res.status(201).json(student);
});

// UPDATE details  →  PUT /api/students/:id   ("Edit profile")
// Major and year decide which courses are allowed, so they can't change while the student
// has current courses (moving up a year is done with /promote).
router.put('/:id', async (req, res) => {
  const student = await findStudent(req, res);
  if (!student) return;

  const data = pickDetails(req.body);
  const enrollmentChanged = clean(data.major) !== student.major || Number(data.year) !== student.year;
  if (enrollmentChanged && currentCourses(student).length > 0) {
    return res.status(409).json({
      message: `${student.firstName} is registered in courses for ${student.major}, Year ${student.year}. `
        + 'Remove those courses (or move them up a year) before changing the major or year.',
    });
  }

  student.set(data);
  await student.save(); // load → change → save, so every schema rule runs
  res.json(student);
});

// DELETE  →  DELETE /api/students/:id   (the student and all of their courses)
router.delete('/:id', async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ message: 'Student deleted' });
});

// MOVE UP A YEAR  →  POST /api/students/:id/promote
// Every current course is marked completed, and the student moves to the next year.
router.post('/:id/promote', async (req, res) => {
  const student = await findStudent(req, res);
  if (!student) return;
  if (student.year >= 4) {
    return res.status(400).json({ message: `${student.firstName} is already in the final year` });
  }

  const now = new Date();
  for (const course of currentCourses(student)) {
    course.status = 'completed';
    course.completedAt = now;
  }
  student.year += 1;
  await student.save({ validateModifiedOnly: true });
  res.json(student);
});

// ---------------- One student's courses ----------------

// REGISTER  →  POST /api/students/:id/courses   { course }
router.post('/:id/courses', async (req, res) => {
  const student = await findStudent(req, res);
  if (!student) return;

  const course = clean(req.body.course);
  const problem = courseProblem(student, course);
  if (problem) return res.status(400).json({ message: problem });

  student.courses.push({ name: course, year: student.year });
  await saveCourses(student);
  res.status(201).json(student);
});

// CHANGE  →  PUT /api/students/:id/courses/:courseId   { course }
router.put('/:id/courses/:courseId', async (req, res) => {
  const student = await findStudent(req, res);
  if (!student) return;

  const registration = student.courses.id(req.params.courseId);
  if (!registration) return res.status(404).json({ message: 'Course registration not found' });
  if (registration.status === 'completed') {
    return res.status(400).json({ message: 'Completed courses can’t be changed' });
  }

  const course = clean(req.body.course);
  const problem = courseProblem(student, course, { ignoreId: registration._id });
  if (problem) return res.status(400).json({ message: problem });

  registration.name = course;
  await saveCourses(student);
  res.json(student);
});

// REMOVE  →  DELETE /api/students/:id/courses/:courseId
router.delete('/:id/courses/:courseId', async (req, res) => {
  const student = await findStudent(req, res);
  if (!student) return;

  const registration = student.courses.id(req.params.courseId);
  if (!registration) return res.status(404).json({ message: 'Course registration not found' });

  registration.deleteOne();
  await saveCourses(student);
  res.json(student);
});

module.exports = router;
