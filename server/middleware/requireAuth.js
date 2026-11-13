const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Lets a request through only if it carries a valid login token:
//   Authorization: Bearer <token>
// The logged-in worker is then available as req.user
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Please log in to continue' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Your session has expired, please log in again' });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ message: 'This account no longer exists' });
  }

  req.user = user;
  next();
}

module.exports = requireAuth;
