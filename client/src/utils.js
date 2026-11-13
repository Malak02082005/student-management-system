// "Ahmed", "Hassan" → "AH"
export const initials = (first = '', last = '') => `${first[0] || ''}${last[0] || ''}`.toUpperCase();

export const fullName = (s) => `${s.firstName} ${s.lastName}`;

// Link to a student's profile page, e.g. /students/64b7f0c2a1b2c3d4e5f60718
export const profilePath = (id) => `/students/${id}`;

// Courses the student is taking now (in their current year) vs. ones they finished
export const currentCourses = (s) => (s.courses || []).filter((c) => c.status === 'registered');
export const completedCourses = (s) => (s.courses || []).filter((c) => c.status === 'completed');

export const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' });
