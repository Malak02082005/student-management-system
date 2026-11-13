import { Link } from 'react-router';
import { fullName, initials, profilePath } from '../utils';

// One row per student. Their courses are on the profile page ("View").
export default function StudentTable({ students, onDelete }) {
  if (students.length === 0) {
    return <p className="empty">No students found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Year</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td>
                <div className="student-cell">
                  <span className="avatar" aria-hidden="true">{initials(s.firstName, s.lastName)}</span>
                  <Link to={profilePath(s._id)} className="student-name student-link">
                    {fullName(s)}
                  </Link>
                </div>
              </td>
              <td className="cell-muted">{s.email}</td>
              <td><span className="pill pill-green">Year {s.year}</span></td>
              <td className="cell-actions">
                <Link to={profilePath(s._id)} className="btn btn-sm btn-light">View</Link>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(s)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
