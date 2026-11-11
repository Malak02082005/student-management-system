// Courses offered in each academic year.
// Edit these lists to change what appears in the "Course" dropdown.
const COURSES_BY_YEAR = {
  1: [
    'General Engineering (Foundation)',
    'Computer Science',
    'Business Administration',
    'Mathematics',
  ],
  2: [
    'Computer Science',
    'Computer Engineering',
    'Mechatronics Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Business Administration',
  ],
  3: [
    'Software Engineering',
    'Artificial Intelligence',
    'Computer Engineering',
    'Mechatronics Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Business Administration',
  ],
  4: [
    'Software Engineering',
    'Artificial Intelligence',
    'Cybersecurity',
    'Computer Engineering',
    'Mechatronics Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Business Administration',
  ],
};

// true if `course` is offered in `year`
const isValidCourse = (year, course) => (COURSES_BY_YEAR[year] || []).includes(course);

module.exports = { COURSES_BY_YEAR, isValidCourse };
