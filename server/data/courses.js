// Course catalog: every major has its own list of courses for each academic year.
//   CATALOG[major][year] = [courses]
// Edit these lists to change what appears in the "Major" and "Course" dropdowns.
const CATALOG = {
  'Computer Science': {
    1: ['Introduction to Programming', 'Discrete Mathematics', 'Calculus I', 'Computer Fundamentals'],
    2: ['Data Structures', 'Object-Oriented Programming', 'Computer Architecture', 'Linear Algebra'],
    3: ['Algorithms', 'Operating Systems', 'Database Systems', 'Software Engineering'],
    4: ['Artificial Intelligence', 'Computer Networks', 'Cybersecurity', 'Graduation Project'],
  },
  'Computer Engineering': {
    1: ['Introduction to Programming', 'Calculus I', 'Physics I', 'Engineering Drawing'],
    2: ['Digital Logic Design', 'Electric Circuits', 'Data Structures', 'Signals and Systems'],
    3: ['Microprocessors', 'Computer Architecture', 'Operating Systems', 'Embedded Systems'],
    4: ['Computer Networks', 'VLSI Design', 'Real-Time Systems', 'Graduation Project'],
  },
  'Mechatronics Engineering': {
    1: ['Calculus I', 'Physics I', 'Engineering Mechanics', 'Engineering Drawing'],
    2: ['Electric Circuits', 'Thermodynamics', 'Mechanics of Materials', 'Introduction to Programming'],
    3: ['Control Systems', 'Sensors and Actuators', 'Microcontrollers', 'Machine Design'],
    4: ['Robotics', 'Automation and PLC', 'Mechatronic System Design', 'Graduation Project'],
  },
  'Electrical Engineering': {
    1: ['Calculus I', 'Physics I', 'Introduction to Programming', 'Engineering Drawing'],
    2: ['Electric Circuits', 'Electronics I', 'Signals and Systems', 'Electromagnetics'],
    3: ['Power Systems', 'Electrical Machines', 'Control Systems', 'Communication Systems'],
    4: ['Power Electronics', 'Renewable Energy', 'High Voltage Engineering', 'Graduation Project'],
  },
  'Civil Engineering': {
    1: ['Calculus I', 'Physics I', 'Engineering Mechanics', 'Engineering Drawing'],
    2: ['Surveying', 'Mechanics of Materials', 'Fluid Mechanics', 'Construction Materials'],
    3: ['Structural Analysis', 'Soil Mechanics', 'Reinforced Concrete', 'Transportation Engineering'],
    4: ['Steel Structures', 'Foundation Engineering', 'Project Management', 'Graduation Project'],
  },
  'Business Administration': {
    1: ['Principles of Management', 'Microeconomics', 'Financial Accounting', 'Business Communication'],
    2: ['Macroeconomics', 'Marketing Principles', 'Business Statistics', 'Organizational Behavior'],
    3: ['Financial Management', 'Human Resource Management', 'Operations Management', 'Business Law'],
    4: ['Strategic Management', 'Entrepreneurship', 'International Business', 'Graduation Project'],
  },
};

const MAJORS = Object.keys(CATALOG);

const isValidMajor = (major) => MAJORS.includes(major);

// true if `course` is offered to `major` students in `year`
const isValidCourse = (major, year, course) => (CATALOG[major]?.[year] || []).includes(course);

module.exports = { CATALOG, MAJORS, isValidMajor, isValidCourse };
