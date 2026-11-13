// ---------- Login token ----------
// Kept in sessionStorage: a page refresh keeps you logged in, but the login only lasts while the
// tab is open. Opening the app in a new tab or after closing the browser starts at the login page.
const TOKEN_KEY = 'sms_token';
localStorage.removeItem(TOKEN_KEY); // older versions kept the token here; clear any leftover

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

// Called when the server says our token is no longer valid (expired / deleted account)
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// ---------- Where the backend lives ----------
// Locally this stays empty: Vite forwards /api/... to http://localhost:5000 (see vite.config.js).
// In production, set VITE_API_URL to the deployed backend, e.g. https://your-api.onrender.com
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// ---------- Shared request helper ----------
async function request(url, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    clearToken();
    onUnauthorized?.();
  }
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---------- Auth ----------
export const login = (email, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/api/auth/me');

// ---------- Students & courses ----------
const BASE = '/api/students';

export const getCourses = () => request('/api/courses');
export const getStudents = () => request(BASE);
export const getStudent = (id) => request(`${BASE}/${id}`);
export const createStudent = (student) =>
  request(BASE, { method: 'POST', body: JSON.stringify(student) });
export const updateStudent = (id, student) =>
  request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(student) });
export const deleteStudent = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });
// Move up a year: current courses become "completed"
export const promoteStudent = (id) => request(`${BASE}/${id}/promote`, { method: 'POST' });

// One student's courses (each call returns the updated student)
export const addCourse = (id, course) =>
  request(`${BASE}/${id}/courses`, { method: 'POST', body: JSON.stringify({ course }) });
export const changeCourse = (id, courseId, course) =>
  request(`${BASE}/${id}/courses/${courseId}`, { method: 'PUT', body: JSON.stringify({ course }) });
export const removeCourse = (id, courseId) =>
  request(`${BASE}/${id}/courses/${courseId}`, { method: 'DELETE' });
