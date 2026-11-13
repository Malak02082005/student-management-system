const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// LOG IN  →  POST /api/auth/login   body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // String(...) makes sure nobody can send an object here to trick the query
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  // Same message for "no such user" and "wrong password", so attackers can't
  // find out which emails have accounts
  if (!user || !(await user.checkPassword(String(password)))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user });
});

// WHO AM I  →  GET /api/auth/me   (used to restore the session on page refresh)
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
