import { useState } from 'react';

const emptyForm = {
  firstName: '', lastName: '', email: '', rollNumber: '', phone: '', guardianPhone: '',
  major: '', year: '', course: '',
};

// Same rules as the backend
// Email: text@text.domain (domain at least 2 letters)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Phone: digits, spaces, dashes, brackets and an optional leading +, with 7 to 15 digits
const isValidPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  return /^\+?[\d\s\-()]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
};
const phoneError = (value) =>
  value.trim() && !isValidPhone(value.trim()) ? 'Please enter a valid phone number, e.g. +20 100 123 4567' : '';

// Turns a saved student into form values
const toForm = (s) => ({
  firstName: s.firstName, lastName: s.lastName, email: s.email, rollNumber: s.rollNumber,
  phone: s.phone || '', guardianPhone: s.guardianPhone || '',
  major: s.major || '', year: String(s.year), course: '',
});

// One form, two uses:
//   add a student   (no `student`)  → details, major, year and an optional first course
//   edit profile    (`student`)     → details, major and year (courses are managed on the profile)
//
// Props:
//   catalog        { major: { year: [courses] } }  (loaded from GET /api/courses)
//   lockEnrollment true when major and year can't change (the student has current courses)
export default function StudentForm({ student, catalog, lockEnrollment = false, onSave, onCancel }) {
  const isEdit = Boolean(student);
  const [form, setForm] = useState(() => (student ? toForm(student) : emptyForm));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Checked on every render, so the messages appear/disappear instantly while typing
  const emailError =
    form.email && !EMAIL_REGEX.test(form.email.trim())
      ? 'Please enter a valid email, e.g. name@example.com'
      : '';
  const phoneMsg = phoneError(form.phone);
  const guardianPhoneMsg = phoneError(form.guardianPhone);
  const hasFieldErrors = Boolean(emailError || phoneMsg || guardianPhoneMsg);

  const majors = Object.keys(catalog);
  // Courses for the chosen major + year (empty until both are picked)
  const coursesFor = (major, year) => catalog[major]?.[year] || [];
  const courseOptions = coursesFor(form.major, form.year);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Changing the major or year clears the course if it isn't offered for the new combination
  const handleMajorOrYearChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (!coursesFor(next.major, next.year).includes(next.course)) next.course = '';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasFieldErrors) return;
    setSaving(true);
    setError('');
    try {
      const { course, ...details } = form;
      // The first course is optional and only sent when adding a new student
      await onSave({ ...details, year: Number(form.year), ...(!isEdit && course ? { course } : {}) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  let coursePlaceholder = 'No course for now';
  if (!form.major) coursePlaceholder = 'Select a major first';
  else if (!form.year) coursePlaceholder = 'Select a year first';

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Student Information</h2>
      {error && <div className="error">{error}</div>}

      <div className="row">
        <label>First Name
          <input name="firstName" value={form.firstName} onChange={handleChange} required />
        </label>
        <label>Last Name
          <input name="lastName" value={form.lastName} onChange={handleChange} required />
        </label>
      </div>

      <div className="row">
        <label>Email
          <input
            type="text"
            inputMode="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={emailError ? 'invalid' : ''}
            required
          />
          {emailError && <span className="field-error">{emailError}</span>}
        </label>
        <label>Roll Number
          <input name="rollNumber" value={form.rollNumber} onChange={handleChange} required />
        </label>
      </div>

      <div className="row">
        <label>Phone
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={phoneMsg ? 'invalid' : ''}
            required
          />
          {phoneMsg && <span className="field-error">{phoneMsg}</span>}
        </label>
        <label>Guardian Phone
          <input
            type="tel"
            name="guardianPhone"
            value={form.guardianPhone}
            onChange={handleChange}
            className={guardianPhoneMsg ? 'invalid' : ''}
            required
          />
          {guardianPhoneMsg && <span className="field-error">{guardianPhoneMsg}</span>}
        </label>
      </div>

      <div className="form-section-label">Enrollment</div>

      <div className="row">
        <label>Major
          <select name="major" value={form.major} onChange={handleMajorOrYearChange} disabled={lockEnrollment} required>
            <option value="" disabled>Select major</option>
            {majors.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>Year
          <select name="year" value={form.year} onChange={handleMajorOrYearChange} disabled={lockEnrollment} required>
            <option value="" disabled>Select year</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </label>
      </div>
      {lockEnrollment && (
        <p className="form-hint">
          Major and year can’t change while the student has current courses. To move them up a year,
          use “Move to next year” on their profile.
        </p>
      )}

      {!isEdit && (
        <>
          <label>First Course (optional)
            <select name="course" value={form.course} onChange={handleChange} disabled={!form.major || !form.year}>
              <option value="">{coursePlaceholder}</option>
              {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <p className="form-hint">You can add more courses later from the student’s profile.</p>
        </>
      )}

      <div className="actions">
        <button className="btn btn-primary" disabled={saving || hasFieldErrors}>
          {saving ? 'Saving...' : isEdit ? 'Save Profile' : 'Add Student'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
