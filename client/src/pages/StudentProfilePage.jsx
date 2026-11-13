import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { addCourse, changeCourse, getCourses, getStudent, promoteStudent, removeCourse } from '../api';
import { ArrowLeftIcon, BookIcon, CheckIcon, PlusIcon } from '../components/Icons';
import useFlash from '../hooks/useFlash';
import { completedCourses, currentCourses, formatDate, fullName, initials } from '../utils';

// Students added before phone numbers were required may not have them yet
const orMissing = (value) => value || <span className="text-warn">Not added yet</span>;

// One student, their current courses and the courses they completed: /students/:id
export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useFlash();

  // Inline forms in the courses card
  const [adding, setAdding] = useState(false);
  const [newCourse, setNewCourse] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editCourse, setEditCourse] = useState('');

  useEffect(() => {
    Promise.all([getStudent(id), getCourses()])
      .then(([s, courses]) => {
        setStudent(s);
        setCatalog(courses);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const back = (
    <Link to="/students" className="back-link">
      <ArrowLeftIcon size={16} /> All students
    </Link>
  );

  if (loading) return <>{back}<div className="card"><p className="empty">Loading...</p></div></>;
  if (loadError) return <>{back}<div className="error">{loadError}</div></>;

  const name = fullName(student);
  const current = currentCourses(student);
  const completed = completedCourses(student);
  const yearCourses = catalog[student.major]?.[student.year] || [];
  const takenNames = student.courses.map((c) => c.name); // registered or completed
  const available = yearCourses.filter((c) => !takenNames.includes(c));
  const isFinalYear = student.year >= 4;

  // Completed courses grouped by year, most recent year first
  const completedYears = [...new Set(completed.map((c) => c.year))].sort((a, b) => b - a);

  // Runs one API call that returns the updated student
  const run = async (action, successMessage) => {
    setBusy(true);
    setActionError('');
    try {
      setStudent(await action());
      setFlash(successMessage);
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCourse) return;
    if (await run(() => addCourse(student._id, newCourse), `Registered in ${newCourse}`)) {
      setAdding(false);
      setNewCourse('');
    }
  };

  const handleChange = async (e, course) => {
    e.preventDefault();
    if (editCourse === course.name) return setEditingId(null);
    if (await run(() => changeCourse(student._id, course._id, editCourse), `Changed to ${editCourse}`)) {
      setEditingId(null);
    }
  };

  const handleRemove = (course) => {
    if (!window.confirm(`Remove ${name} from ${course.name}?`)) return;
    run(() => removeCourse(student._id, course._id), `Removed from ${course.name}`);
  };

  const handlePromote = () => {
    const next = student.year + 1;
    const note = current.length
      ? `\n\nTheir ${current.length} current course${current.length === 1 ? '' : 's'} will be marked as completed.`
      : '';
    if (!window.confirm(`Move ${name} to Year ${next}?${note}`)) return;
    setEditingId(null);
    setAdding(false);
    run(() => promoteStudent(student._id), `Moved to Year ${next}`);
  };

  return (
    <>
      {back}
      <div className="page-header">
        <div>
          <h1>{name}</h1>
          <p>Roll No {student.rollNumber} · {student.major} · Year {student.year}</p>
        </div>
      </div>

      {flash && <div className="success">{flash}</div>}
      {actionError && <div className="error">{actionError}</div>}

      <div className="profile-grid">
        {/* ----- who the student is ----- */}
        <section className="card profile-card">
          <span className="avatar avatar-lg">{initials(student.firstName, student.lastName)}</span>
          <h2>{name}</h2>
          <p className="muted">{student.email}</p>
          <dl className="details">
            <dt>Roll Number</dt><dd>{student.rollNumber}</dd>
            <dt>Phone</dt><dd>{orMissing(student.phone)}</dd>
            <dt>Guardian phone</dt><dd>{orMissing(student.guardianPhone)}</dd>
            <dt>Major</dt><dd>{student.major}</dd>
            <dt>Year</dt><dd>Year {student.year}</dd>
            <dt>Student since</dt><dd>{formatDate(student.createdAt)}</dd>
          </dl>

          <div className="profile-actions">
            <Link to={`/students/${student._id}/edit`} className="btn btn-light btn-block">Edit profile</Link>
            {isFinalYear ? (
              <p className="muted">Year 4 is the final year.</p>
            ) : (
              <button type="button" className="btn btn-primary btn-block" onClick={handlePromote} disabled={busy}>
                Move to Year {student.year + 1}
              </button>
            )}
          </div>
        </section>

        <div className="profile-courses">
          {/* ----- current courses ----- */}
          <section className="card">
            <div className="card-header">
              <h2>
                Current Courses <span className="count-pill">{current.length}</span>
              </h2>
              {available.length > 0 && !adding && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
                  <PlusIcon size={16} /> Add course
                </button>
              )}
            </div>

            {yearCourses.length > 0 && (
              <div className="course-progress">
                <div className="course-row">
                  <span>Year {student.year} courses</span>
                  <span className="muted">{current.length} of {yearCourses.length} registered</span>
                </div>
                <div className="progress">
                  <span style={{ width: `${Math.round((current.length / yearCourses.length) * 100)}%` }} />
                </div>
              </div>
            )}

            {adding && (
              <form className="inline-course-form" onSubmit={handleAdd}>
                <select className="filter-select" value={newCourse} onChange={(e) => setNewCourse(e.target.value)} required>
                  <option value="" disabled>Choose a Year {student.year} course</option>
                  {available.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" disabled={busy || !newCourse}>Add</button>
                <button type="button" className="btn btn-light btn-sm" onClick={() => { setAdding(false); setNewCourse(''); }}>
                  Cancel
                </button>
              </form>
            )}

            {current.length === 0 ? (
              <p className="empty empty-sm">
                Not registered in any Year {student.year} courses yet.
              </p>
            ) : (
              <ul className="registration-list">
                {current.map((c) => (
                  <li key={c._id}>
                    <span className="registration-icon"><BookIcon size={18} /></span>
                    {editingId === c._id ? (
                      <form className="inline-course-form registration-edit" onSubmit={(e) => handleChange(e, c)}>
                        <select className="filter-select" value={editCourse} onChange={(e) => setEditCourse(e.target.value)}>
                          {[c.name, ...available].map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" disabled={busy}>Save</button>
                        <button type="button" className="btn btn-light btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <div className="registration-info">
                          <span className="student-name">{c.name}</span>
                          <span className="student-sub">Registered {formatDate(c.createdAt)}</span>
                        </div>
                        <div className="registration-actions">
                          {available.length > 0 && (
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => { setEditingId(c._id); setEditCourse(c.name); }}
                              disabled={busy}
                            >
                              Edit
                            </button>
                          )}
                          <button className="btn btn-sm btn-danger" onClick={() => handleRemove(c)} disabled={busy}>
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ----- completed courses (from earlier years) ----- */}
          {completed.length > 0 && (
            <section className="card">
              <div className="card-header">
                <h2>
                  Completed Courses <span className="count-pill">{completed.length}</span>
                </h2>
              </div>
              {completedYears.map((year) => (
                <div key={year} className="completed-year">
                  <p className="completed-year-label">Year {year}</p>
                  <ul className="registration-list">
                    {completed.filter((c) => c.year === year).map((c) => (
                      <li key={c._id}>
                        <span className="registration-icon registration-icon-done"><CheckIcon size={18} /></span>
                        <div className="registration-info">
                          <span className="student-name">{c.name}</span>
                          <span className="student-sub">Completed {formatDate(c.completedAt)}</span>
                        </div>
                        <span className="pill pill-green">Completed</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
