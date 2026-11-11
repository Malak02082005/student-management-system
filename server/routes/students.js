const express = require('express');
const Student = require('../models/Student');

const router = express.Router();

// Accept only known fields, so clients can't set _id, createdAt, etc.
const pickFields = ({ name, email, rollNumber, course, year, phone }) =>
  ({ name, email, rollNumber, course, year, phone });

// READ all  →  GET /api/students
router.get('/', async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json(students);
});

// READ one  →  GET /api/students/:id
router.get('/:id', async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

// CREATE  →  POST /api/students
router.post('/', async (req, res) => {
  const student = await Student.create(pickFields(req.body));
  res.status(201).json(student);
});

// UPDATE  →  PUT /api/students/:id
router.put('/:id', async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, pickFields(req.body), {
    returnDocument: 'after', // return the updated document
    runValidators: true,     // apply the schema rules on update too
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

// DELETE  →  DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ message: 'Student deleted' });
});

module.exports = router;
