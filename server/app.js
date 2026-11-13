// The Express app (routes + middleware), without starting the server or connecting
// to the database. index.js starts it for real; the tests import it directly.
const express = require('express');
const cors = require('cors');
const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/requireAuth');
const { CATALOG } = require('./data/courses');

const app = express();

// In production, only the deployed frontend may call the API
// (CLIENT_URL can be a comma-separated list). Locally every origin is allowed.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, '')) // "https://x.app/" → "https://x.app"
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json()); // parse JSON request bodies

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

// Everything below requires a logged-in worker
// { major: { year: [courses] } }
app.get('/api/courses', requireAuth, (req, res) => res.json(CATALOG));
app.use('/api/students', requireAuth, studentRoutes);

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
    return res.status(400).json({ message: 'Invalid ID' });
  }
  if (err.code === 11000) {
    // Roll number or email already used by another student (see the indexes in models/Student.js)
    const labels = { rollNumber: 'roll number', email: 'email' };
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      message: `Another student already has this ${labels[field] || field || 'value'}`,
    });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

module.exports = app;
