// Creates a worker account (or resets the password if the email already exists).
//
// Usage (from the server folder):
//   npm run create-worker -- "Full Name" email@example.com "password123"
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: npm run create-worker -- "Full Name" email@example.com "password123"');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    existing.name = name;
    existing.password = password; // re-hashed by the pre-save hook
    await existing.save();
    console.log(`Updated worker: ${existing.name} <${existing.email}> (password reset)`);
  } else {
    const user = await User.create({ name, email, password });
    console.log(`Created worker: ${user.name} <${user.email}>`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  const message = err.name === 'ValidationError'
    ? Object.values(err.errors).map((e) => e.message).join(', ')
    : err.message;
  console.error('Could not create worker:', message);
  await mongoose.disconnect();
  process.exit(1);
});
