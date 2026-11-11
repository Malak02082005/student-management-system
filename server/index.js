require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const studentRoutes = require('./routes/students');
const { COURSES_BY_YEAR } = require('./data/courses');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON request bodies

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/courses', (req, res) => res.json(COURSES_BY_YEAR));
app.use('/api/students', studentRoutes);

// Unknown routes
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler: turns errors into clean JSON responses
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid student ID' });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `A student with this ${field} already exists` });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
