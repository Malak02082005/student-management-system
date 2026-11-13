import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getCourses, getStudents } from '../api';
import { ArrowUpRightIcon, PlusIcon } from '../components/Icons';
import { currentCourses, fullName, initials, profilePath } from '../utils';

export default function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalogMajors, setCatalogMajors] = useState([]);
  const [chartMajor, setChartMajor] = useState(''); // '' = all majors

  useEffect(() => {
    getStudents()
      .then(setStudents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // The catalog lists every major, including ones with no students yet.
    // If it fails, the chart still works with the majors found in the student list.
    getCourses()
      .then((catalog) => setCatalogMajors(Object.keys(catalog)))
      .catch(() => {});
  }, []);

  // ----- numbers for the cards (all calculated from the student list) -----
  const total = students.length;
  // Courses being taken right now (completed courses from earlier years aren't counted)
  const registrations = students.reduce((sum, s) => sum + currentCourses(s).length, 0);
  const activeMajors = new Set(students.map((s) => s.major).filter(Boolean)).size;

  const allMajors = [...new Set([...catalogMajors, ...students.map((s) => s.major).filter(Boolean)])].sort();
  const chartStudents = chartMajor ? students.filter((s) => s.major === chartMajor) : students;
  const perYear = [1, 2, 3, 4].map((y) => chartStudents.filter((s) => s.year === y).length);
  const maxPerYear = Math.max(...perYear, 1);

  const majorCounts = [...new Set(students.map((s) => s.major).filter(Boolean))]
    .map((m) => [m, students.filter((s) => s.major === m).length])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recent = students.slice(0, 5); // the API returns newest first
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of your student records.</p>
        </div>
        <Link to="/students/new" className="btn btn-primary">
          <PlusIcon size={18} /> Add Student
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="dash-grid">
        {/* ----- stat cards ----- */}
        <div className="stat-row">
          <div className="card stat-card stat-card-primary">
            <div className="stat-top">
              <span>Total Students</span>
              <Link to="/students" className="stat-arrow" aria-label="View all students">
                <ArrowUpRightIcon size={16} />
              </Link>
            </div>
            <strong className="stat-value">{loading ? '–' : total}</strong>
            <span className="stat-note">Registered in the system</span>
          </div>

          <div className="card stat-card">
            <div className="stat-top"><span>Current Course Registrations</span></div>
            <strong className="stat-value">{loading ? '–' : registrations}</strong>
            <span className="stat-note">
              <span className="pill pill-green">
                {total ? (registrations / total).toFixed(1) : 0}
              </span>
              courses per student
            </span>
          </div>

          <div className="card stat-card">
            <div className="stat-top"><span>Active Majors</span></div>
            <strong className="stat-value">{loading ? '–' : activeMajors}</strong>
            <span className="stat-note">Majors with at least one student</span>
          </div>
        </div>

        {/* ----- students per major per year (pill bar chart) ----- */}
        <div className="card span-2">
          <div className="card-header chart-header">
            <h2>Students per Major per Year</h2>
            <select
              className="filter-select"
              value={chartMajor}
              onChange={(e) => setChartMajor(e.target.value)}
              aria-label="Major shown in the chart"
            >
              <option value="">All majors</option>
              {allMajors.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="bars">
            {perYear.map((count, i) => {
              const tone = count === 0 ? 'empty' : count === maxPerYear ? 'max' : i % 2 ? 'mid' : 'light';
              return (
                <Link
                  to={`/students?year=${i + 1}${chartMajor ? `&major=${encodeURIComponent(chartMajor)}` : ''}`}
                  className="bar-col"
                  key={i}
                  title={`View Year ${i + 1} ${chartMajor ? `${chartMajor} ` : ''}students`}
                >
                  <div className="bar-track">
                    <div
                      className={`bar bar-${tone}`}
                      style={{ height: count === 0 ? '100%' : `${Math.max(22, (count / maxPerYear) * 100)}%` }}
                    >
                      {count > 0 && <span className="bar-value">{count}</span>}
                    </div>
                  </div>
                  <span className="bar-label">Year {i + 1}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ----- students by major ----- */}
        <div className="card span-2">
          <h2>Students by Major</h2>
          {majorCounts.length === 0 ? (
            <p className="empty">No students yet.</p>
          ) : (
            <ul className="course-list">
              {majorCounts.map(([major, count]) => (
                <li key={major}>
                  <Link to={`/students?major=${encodeURIComponent(major)}`} className="course-link">
                    <div className="course-row">
                      <span>{major}</span>
                      <span className="muted">{count} {count === 1 ? 'student' : 'students'}</span>
                    </div>
                    <div className="progress"><span style={{ width: `${pct(count)}%` }} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ----- recently added ----- */}
        <div className="card span-3">
          <div className="card-header">
            <h2>Recently Added</h2>
            <Link to="/students" className="btn btn-light btn-sm">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="empty">No students yet.</p>
          ) : (
            <ul className="people-list">
              {recent.map((s) => (
                <li key={s._id}>
                  <span className="avatar">{initials(s.firstName, s.lastName)}</span>
                  <div className="people-info">
                    <Link to={profilePath(s._id)} className="student-name student-link">
                      {fullName(s)}
                    </Link>
                    <span className="student-sub">
                      {s.major} · {currentCourses(s).length || 'No'} current course{currentCourses(s).length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <span className="pill pill-green">Year {s.year}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ----- quick action card ----- */}
        <div className="card cta-card">
          <h2>New student?</h2>
          <p>Register a student in less than a minute.</p>
          <Link to="/students/new" className="btn btn-white">
            <PlusIcon size={18} /> Add Student
          </Link>
        </div>
      </div>
    </>
  );
}
