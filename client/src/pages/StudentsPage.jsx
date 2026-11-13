import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { deleteStudent, getCourses, getStudents } from '../api';
import StudentTable from '../components/StudentTable';
import { PlusIcon } from '../components/Icons';
import useFlash from '../hooks/useFlash';
import { currentCourses, fullName } from '../utils';

const YEARS = [1, 2, 3, 4];
const unique = (list) => [...new Set(list)].sort();

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [catalog, setCatalog] = useState({}); // { major: { year: [courses] } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // success message, e.g. "Student added" (passed from the Add/Edit page)
  const [flash, setFlash] = useFlash();

  // The filters live in the URL (e.g. /students?year=2&major=Computer%20Science&course=Data%20Structures)
  // so the dashboard can link straight to a filtered list, and a refresh keeps the filter.
  const [searchParams, setSearchParams] = useSearchParams();
  const year = searchParams.get('year') || '';
  const major = searchParams.get('major') || '';
  const course = searchParams.get('course') || '';

  useEffect(() => {
    Promise.all([getStudents(), getCourses()])
      .then(([studentList, courses]) => {
        setStudents(studentList);
        setCatalog(courses);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ----- filter options -----
  const majors = Object.keys(catalog);

  // Courses that exist for a major/year combination (an empty value means "any")
  const coursesFor = (m, y) =>
    unique(
      (m ? [m] : majors).flatMap((maj) =>
        (y ? [y] : YEARS).flatMap((yr) => catalog[maj]?.[yr] || [])
      )
    );
  const courseOptions = coursesFor(major, year);

  const updateFilters = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setSearchParams(next, { replace: true });
  };

  // When year or major changes, keep the chosen course only if it still fits
  const changeYearOrMajor = (changes) => {
    const nextYear = changes.year ?? year;
    const nextMajor = changes.major ?? major;
    const keepCourse = !course || coursesFor(nextMajor, nextYear).includes(course);
    updateFilters({ ...changes, course: keepCourse ? course : '' });
  };

  // The course filter matches the courses a student is taking now (not completed ones)
  const matches = (s, f) =>
    (!f.year || s.year === Number(f.year)) &&
    (!f.major || s.major === f.major) &&
    (!f.course || currentCourses(s).some((c) => c.name === f.course));
  // Counts next to each option, given the filters chosen before it (major → year → course)
  const count = (f) => students.filter((s) => matches(s, f)).length;

  const q = search.toLowerCase();
  const rows = students.filter(
    (s) =>
      matches(s, { year, major, course }) &&
      [fullName(s), s.email, s.rollNumber, s.major, ...currentCourses(s).map((c) => c.name)]
        .some((v) => (v || '').toLowerCase().includes(q))
  );
  const hasFilters = Boolean(year || major || course || search);

  const title = [major, year && `Year ${year}`].filter(Boolean).join(' · ') || 'All Students';

  // Deletes the student completely, including all of their courses.
  // A single course can be removed from the profile page.
  const handleDelete = async (student) => {
    const n = student.courses.length;
    const extra = n ? ` and their ${n} course record${n === 1 ? '' : 's'}` : '';
    if (!window.confirm(`Delete ${fullName(student)}${extra}? This cannot be undone.`)) return;
    try {
      await deleteStudent(student._id);
      setStudents((list) => list.filter((s) => s._id !== student._id));
      setFlash('Student deleted');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>Filter by major, then year, then course. Open a student to see and manage their courses.</p>
        </div>
        <Link to="/students/new" className="btn btn-primary">
          <PlusIcon size={18} /> Add Student
        </Link>
      </div>

      {flash && <div className="success">{flash}</div>}

      <section className="card">
        <div className="toolbar">
          <h2>
            {title}
            <span className="count-pill" title="Number of students">{rows.length}</span>
          </h2>
          <input
            className="search"
            placeholder="Search by name, email, roll no, course, major..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ----- filters, in order: 1 major → 2 year → 3 course ----- */}
        <div className="filters">
          <label className="filter-step">
            <span className="filter-label">1. Major</span>
            <select
              className="filter-select"
              value={major}
              onChange={(e) => changeYearOrMajor({ major: e.target.value })}
            >
              <option value="">All majors ({count({})})</option>
              {majors.map((m) => (
                <option key={m} value={m}>
                  {m} ({count({ major: m })})
                </option>
              ))}
            </select>
          </label>

          <div className="filter-step">
            <span className="filter-label" id="year-filter-label">2. Year</span>
            <div className="tabs" role="tablist" aria-labelledby="year-filter-label">
              <button
                type="button"
                role="tab"
                aria-selected={!year}
                className={`tab ${!year ? 'active' : ''}`}
                onClick={() => changeYearOrMajor({ year: '' })}
              >
                All <span className="tab-count">{count({ major })}</span>
              </button>
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  role="tab"
                  aria-selected={year === String(y)}
                  className={`tab ${year === String(y) ? 'active' : ''}`}
                  onClick={() => changeYearOrMajor({ year: String(y) })}
                >
                  Year {y} <span className="tab-count">{count({ year: y, major })}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="filter-step">
            <span className="filter-label">3. Course</span>
            <select
              className="filter-select"
              value={course}
              onChange={(e) => updateFilters({ course: e.target.value })}
            >
              <option value="">All courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c} ({count({ year, major, course: c })})
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              className="link-btn filter-clear"
              onClick={() => {
                setSearch('');
                updateFilters({ year: '', major: '', course: '' });
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {error && <div className="error">{error}</div>}
        {loading ? (
          <p className="empty">Loading...</p>
        ) : rows.length === 0 && students.length > 0 ? (
          <p className="empty">No students match these filters.</p>
        ) : (
          <StudentTable students={rows} onDelete={handleDelete} />
        )}
      </section>
    </>
  );
}
