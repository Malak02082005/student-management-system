import { useState } from 'react';

const emptyForm = {
  firstName: '', lastName: '', email: '', rollNumber: '', year: '', course: '', phone: '',
};

// Same email rule as the backend: text@text.domain (domain at least 2 letters)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function StudentForm({ student, coursesByYear, onSave, onCancel }) {
  const [form, setForm] = useState(
    student
      ? {
          firstName: student.firstName, lastName: student.lastName, email: student.email,
          rollNumber: student.rollNumber, year: String(student.year), course: student.course,
          phone: student.phone || '',
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Checked on every render, so the message appears/disappears instantly while typing
  const emailError =
    form.email && !EMAIL_REGEX.test(form.email.trim())
      ? 'Please enter a valid email, e.g. name@example.com'
      : '';

  // Courses available for the chosen year (empty until a year is picked)
  const courseOptions = coursesByYear[form.year] || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Changing the year clears the course if it isn't offered in the new year
  const handleYearChange = (e) => {
    const year = e.target.value;
    setForm((prev) => ({
      ...prev,
      year,
      course: (coursesByYear[year] || []).includes(prev.course) ? prev.course : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) return;
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, year: Number(form.year) });
      if (!student) setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{student ? 'Edit Student' : 'Add New Student'}</h2>
      {error && <div className="error">{error}</div>}

      <div className="row">
        <label>First Name
          <input name="firstName" value={form.firstName} onChange={handleChange} required />
        </label>
        <label>Last Name
          <input name="lastName" value={form.lastName} onChange={handleChange} required />
        </label>
      </div>

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

      <div className="row">
        <label>Roll Number
          <input name="rollNumber" value={form.rollNumber} onChange={handleChange} required />
        </label>
        <label>Year
          <select name="year" value={form.year} onChange={handleYearChange} required>
            <option value="" disabled>Select year</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </label>
      </div>

      <label>Course
        <select
          name="course"
          value={form.course}
          onChange={handleChange}
          disabled={!form.year}
          required
        >
          <option value="" disabled>
            {form.year ? 'Select a course' : 'Select a year first'}
          </option>
          {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label>Phone (optional)
        <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
      </label>

      <div className="actions">
        <button className="btn btn-primary" disabled={saving || !!emailError}>
          {saving ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
        </button>
        {student && (
          <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
