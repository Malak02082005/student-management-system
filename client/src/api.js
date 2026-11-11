const BASE = '/api/students';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const getCourses = () => request('/api/courses');
export const getStudents = () => request(BASE);
export const createStudent = (student) =>
  request(BASE, { method: 'POST', body: JSON.stringify(student) });
export const updateStudent = (id, student) =>
  request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(student) });
export const deleteStudent = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });
