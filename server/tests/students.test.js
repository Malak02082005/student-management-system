const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { startDb, stopDb, clearDb, createWorker } = require('./helpers');
const app = require('../app');

let token;

before(startDb);
after(stopDb);
beforeEach(async () => {
  await clearDb();
  ({ token } = await createWorker());
});

// Small helpers so every request carries the login token
const api = {
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post: (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
  put: (url, body) => request(app).put(url).set('Authorization', `Bearer ${token}`).send(body),
  delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
};

// A valid student: Computer Science, Year 1 (no courses yet)
const sara = {
  firstName: 'Sara',
  lastName: 'Ali',
  email: 'sara.ali@example.com',
  rollNumber: 'R-100',
  major: 'Computer Science',
  year: 1,
  phone: '0100000000',
  guardianPhone: '+20 122 333 4444',
};
const omar = {
  firstName: 'Omar',
  lastName: 'Hassan',
  email: 'omar@example.com',
  rollNumber: 'R-200',
  major: 'Business Administration',
  year: 2,
  phone: '0155555555',
  guardianPhone: '0156666666',
};

const createSara = async (extra = {}) => (await api.post('/api/students', { ...sara, ...extra })).body;
const courseNames = (student) => student.courses.map((c) => c.name);

describe('GET /api/courses', () => {
  it('returns the course catalog per major and year', async () => {
    const res = await api.get('/api/courses');
    assert.equal(res.status, 200);
    assert.ok(res.body['Computer Science']['1'].includes('Calculus I'));
  });
});

describe('Create a student (POST /api/students)', () => {
  it('creates a student with no courses and tidies up the email', async () => {
    const res = await api.post('/api/students', { ...sara, email: '  Sara.Ali@Example.com ' });
    assert.equal(res.status, 201);
    assert.ok(res.body._id);
    assert.equal(res.body.email, 'sara.ali@example.com');
    assert.deepEqual(res.body.courses, []);
  });

  it('can register the student in a first course straight away', async () => {
    const res = await api.post('/api/students', { ...sara, course: 'Calculus I' });
    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body.courses, [{ name: 'Calculus I', year: 1, status: 'registered' }]);
  });

  it('ignores fields the client is not allowed to set', async () => {
    const res = await api.post('/api/students', {
      ...sara, createdAt: '2000-01-01', courses: [{ name: 'Robotics', year: 1, status: 'completed' }],
    });
    assert.equal(res.status, 201);
    assert.notEqual(new Date(res.body.createdAt).getFullYear(), 2000);
    assert.deepEqual(res.body.courses, []);
  });

  it('reports missing required fields', async () => {
    const res = await api.post('/api/students', { firstName: 'Sara' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Last name is required/);
  });

  it('rejects an invalid email', async () => {
    const res = await api.post('/api/students', { ...sara, email: 'sara@example' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Email is invalid/);
  });

  it('requires the student’s phone and the guardian’s phone', async () => {
    const { phone, guardianPhone, ...noPhones } = sara;
    const res = await api.post('/api/students', noPhones);
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Phone number is required/);
    assert.match(res.body.message, /Guardian phone number is required/);
  });

  it('rejects invalid phone numbers', async () => {
    const tooShort = await api.post('/api/students', { ...sara, phone: '12345' });
    assert.equal(tooShort.status, 400);
    assert.match(tooShort.body.message, /Phone number is invalid/);

    const letters = await api.post('/api/students', { ...sara, guardianPhone: 'call me' });
    assert.equal(letters.status, 400);
    assert.match(letters.body.message, /Guardian phone number is invalid/);
  });

  it('rejects a first course that is not offered for the major and year', async () => {
    const res = await api.post('/api/students', { ...sara, course: 'Robotics' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /not offered/);
  });

  it('does not allow two students with the same roll number or email', async () => {
    await createSara();
    const sameRoll = await api.post('/api/students', { ...omar, rollNumber: sara.rollNumber });
    assert.equal(sameRoll.status, 409);
    assert.match(sameRoll.body.message, /roll number/);

    const sameEmail = await api.post('/api/students', { ...omar, email: sara.email });
    assert.equal(sameEmail.status, 409);
    assert.match(sameEmail.body.message, /email/);
  });
});

describe('Read students (GET /api/students)', () => {
  it('lists all students, newest first', async () => {
    await createSara();
    await api.post('/api/students', omar);
    const res = await api.get('/api/students');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((s) => s.rollNumber), ['R-200', 'R-100']);
  });

  it('gets one student by id', async () => {
    const created = await createSara();
    const res = await api.get(`/api/students/${created._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.firstName, 'Sara');
  });

  it('returns 404 for an unknown id and 400 for a malformed one', async () => {
    assert.equal((await api.get('/api/students/64b7f0c2a1b2c3d4e5f60718')).status, 404);
    assert.equal((await api.get('/api/students/not-an-id')).status, 400);
  });
});

describe('Update a student’s profile (PUT /api/students/:id)', () => {
  it('updates the details', async () => {
    const created = await createSara({ course: 'Calculus I' });
    const res = await api.put(`/api/students/${created._id}`, {
      ...sara, firstName: 'Sarah', phone: '0111111111', guardianPhone: '0122222222',
    });
    assert.equal(res.status, 200);
    assert.partialDeepStrictEqual(res.body, { firstName: 'Sarah', phone: '0111111111', guardianPhone: '0122222222' });
    assert.deepEqual(courseNames(res.body), ['Calculus I']); // courses are kept
  });

  it('can change the major and year while the student has no current courses', async () => {
    const created = await createSara();
    const res = await api.put(`/api/students/${created._id}`, { ...sara, major: 'Civil Engineering', year: 3 });
    assert.equal(res.status, 200);
    assert.equal(res.body.year, 3);
  });

  it('blocks changing the major or year while the student has current courses', async () => {
    const created = await createSara({ course: 'Calculus I' });
    const res = await api.put(`/api/students/${created._id}`, { ...sara, year: 2 });
    assert.equal(res.status, 409);
    assert.match(res.body.message, /before changing the major or year/);
  });

  it('blocks using another student’s email', async () => {
    const created = await createSara();
    await api.post('/api/students', omar);
    const res = await api.put(`/api/students/${created._id}`, { ...sara, email: omar.email });
    assert.equal(res.status, 409);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await api.put('/api/students/64b7f0c2a1b2c3d4e5f60718', sara);
    assert.equal(res.status, 404);
  });
});

describe('A student’s courses (/api/students/:id/courses)', () => {
  it('registers a student in several courses', async () => {
    const { _id } = await createSara();
    await api.post(`/api/students/${_id}/courses`, { course: 'Calculus I' });
    const res = await api.post(`/api/students/${_id}/courses`, { course: 'Discrete Mathematics' });
    assert.equal(res.status, 201);
    assert.deepEqual(courseNames(res.body), ['Calculus I', 'Discrete Mathematics']);
  });

  it('does not allow the same course twice', async () => {
    const { _id } = await createSara({ course: 'Calculus I' });
    const res = await api.post(`/api/students/${_id}/courses`, { course: 'Calculus I' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /already registered in Calculus I/);
  });

  it('only allows courses from the student’s major and current year', async () => {
    const { _id } = await createSara();
    const res = await api.post(`/api/students/${_id}/courses`, { course: 'Data Structures' }); // Year 2
    assert.equal(res.status, 400);
    assert.match(res.body.message, /not offered for Computer Science in Year 1/);
  });

  it('changes a registered course to another one', async () => {
    const created = await createSara({ course: 'Calculus I' });
    const courseId = created.courses[0]._id;
    const res = await api.put(`/api/students/${created._id}/courses/${courseId}`, { course: 'Discrete Mathematics' });
    assert.equal(res.status, 200);
    assert.deepEqual(courseNames(res.body), ['Discrete Mathematics']);
  });

  it('removes a course but keeps the student', async () => {
    const created = await createSara({ course: 'Calculus I' });
    const res = await api.delete(`/api/students/${created._id}/courses/${created.courses[0]._id}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.courses, []);
    assert.equal((await api.get(`/api/students/${created._id}`)).status, 200);
  });

  it('returns 404 for an unknown course registration', async () => {
    const { _id } = await createSara();
    const res = await api.delete(`/api/students/${_id}/courses/64b7f0c2a1b2c3d4e5f60718`);
    assert.equal(res.status, 404);
  });
});

describe('Move up a year (POST /api/students/:id/promote)', () => {
  it('moves the student to the next year and marks their courses completed', async () => {
    const { _id } = await createSara({ course: 'Calculus I' });
    await api.post(`/api/students/${_id}/courses`, { course: 'Discrete Mathematics' });

    const res = await api.post(`/api/students/${_id}/promote`);
    assert.equal(res.status, 200);
    assert.equal(res.body.year, 2);
    assert.ok(res.body.courses.every((c) => c.status === 'completed' && c.year === 1 && c.completedAt));

    // They can now register in Year 2 courses, but not retake a completed one
    const next = await api.post(`/api/students/${_id}/courses`, { course: 'Data Structures' });
    assert.equal(next.status, 201);
    assert.partialDeepStrictEqual(next.body.courses.at(-1), { name: 'Data Structures', year: 2, status: 'registered' });
  });

  it('allows moving up with no courses', async () => {
    const { _id } = await createSara();
    const res = await api.post(`/api/students/${_id}/promote`);
    assert.equal(res.status, 200);
    assert.equal(res.body.year, 2);
  });

  it('does not let completed courses be changed', async () => {
    const { _id, courses } = await createSara({ course: 'Calculus I' });
    await api.post(`/api/students/${_id}/promote`);
    const res = await api.put(`/api/students/${_id}/courses/${courses[0]._id}`, { course: 'Data Structures' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Completed courses/);
  });

  it('stops at Year 4', async () => {
    const { _id } = await createSara({ year: 4 });
    const res = await api.post(`/api/students/${_id}/promote`);
    assert.equal(res.status, 400);
    assert.match(res.body.message, /final year/);
  });
});

describe('Delete a student (DELETE /api/students/:id)', () => {
  it('deletes the student, then reports them as not found', async () => {
    const created = await createSara({ course: 'Calculus I' });

    const res = await api.delete(`/api/students/${created._id}`);
    assert.equal(res.status, 200);
    assert.equal((await api.get(`/api/students/${created._id}`)).status, 404);
    assert.equal((await api.delete(`/api/students/${created._id}`)).status, 404);
  });
});
