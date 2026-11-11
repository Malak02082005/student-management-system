const mongoose = require('mongoose');
const { isValidCourse } = require('../data/courses');

// Same email rule as the frontend: text@text.domain (domain at least 2 letters)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Email is invalid'],
    },
    rollNumber: { type: String, required: [true, 'Roll number is required'], unique: true, trim: true },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be between 1 and 4'],
      max: [4, 'Year must be between 1 and 4'],
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      validate: {
        // `this` is the student document, so we can check the course against its year
        validator: function (value) {
          return isValidCourse(this.year, value);
        },
        message: (props) => `"${props.value}" is not offered in the selected year`,
      },
    },
    phone: { type: String, trim: true },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Student', studentSchema);
