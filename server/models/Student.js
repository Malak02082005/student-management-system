const mongoose = require('mongoose');
const { isValidMajor } = require('../data/courses');

// Same email rule as the frontend: text@text.domain (domain at least 2 letters)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Same phone rule as the frontend: digits, spaces, dashes, brackets and an optional leading +,
// with 7 to 15 digits in total (e.g. "+20 100 123 4567" or "0100-1234567")
const isValidPhone = (value) => {
  const digits = String(value).replace(/\D/g, '');
  return /^\+?[\d\s\-()]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
};
const phoneField = (label) => ({
  type: String,
  required: [true, `${label} is required`],
  trim: true,
  validate: { validator: isValidPhone, message: `${label} is invalid` },
});

// One course the student is (or was) taking.
//   registered → being taken now (always in the student's current year)
//   completed  → finished; set automatically when the student moves up a year
// createdAt (from timestamps) is the date they registered.
const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Course is required'], trim: true },
    year: { type: Number, required: true, min: 1, max: 4 },
    status: { type: String, enum: ['registered', 'completed'], default: 'registered' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// One document per student. A student can have no courses at all.
const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Email is invalid'],
    },
    rollNumber: { type: String, required: [true, 'Roll number is required'], trim: true },
    phone: phoneField('Phone number'),
    guardianPhone: phoneField('Guardian phone number'),
    major: {
      type: String,
      required: [true, 'Major is required'],
      trim: true,
      validate: {
        validator: isValidMajor,
        message: (props) => `"${props.value}" is not a valid major`,
      },
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be between 1 and 4'],
      max: [4, 'Year must be between 1 and 4'],
    },
    courses: { type: [courseSchema], default: [] },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// No two students can share a roll number or an email
studentSchema.index({ rollNumber: 1 }, { unique: true });
studentSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
