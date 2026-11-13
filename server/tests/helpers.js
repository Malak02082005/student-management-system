// Shared test setup: an in-memory MongoDB (your real database is never touched)
// plus a logged-in worker to call the protected routes with.
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret';

const User = require('../models/User');
const Student = require('../models/Student');

let mongo;

async function startDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Student.init(); // build the unique indexes before the duplicate tests run
}

async function stopDb() {
  await mongoose.disconnect();
  await mongo.stop();
}

async function clearDb() {
  await Promise.all([User.deleteMany({}), Student.deleteMany({})]);
}

// Creates a worker account and returns it with a valid login token
async function createWorker({ name = 'Test Worker', email = 'worker@school.edu', password = 'password123' } = {}) {
  const user = await User.create({ name, email, password });
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token, password };
}

module.exports = { startDb, stopDb, clearDb, createWorker };
