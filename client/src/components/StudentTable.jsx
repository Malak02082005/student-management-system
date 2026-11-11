
export default function StudentTable({ students, onView, onEdit, onDelete }) {
  if (students.length === 0) {
    return <p className="empty">No students found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Roll No</th><th>Name</th><th>Course</th><th>Year</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td>{s.rollNumber}</td>
              <td>{s.firstName} {s.lastName}</td>
              <td>{s.course}</td>
              <td>Year {s.year}</td>
              <td className="cell-actions">
                <button className="btn btn-sm btn-light" onClick={() => onView(s)}>View</button>
                <button className="btn btn-sm btn-light" onClick={() => onEdit(s)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(s)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}