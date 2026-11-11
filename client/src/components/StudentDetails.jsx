export default function StudentDetails({ student, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2>{student.firstName} {student.lastName}</h2>
        <dl className="details">
          <dt>First Name</dt><dd>{student.firstName}</dd>
          <dt>Last Name</dt><dd>{student.lastName}</dd>
          <dt>Roll Number</dt><dd>{student.rollNumber}</dd>
          <dt>Email</dt><dd>{student.email}</dd>
          <dt>Course</dt><dd>{student.course}</dd>
          <dt>Year</dt><dd>Year {student.year}</dd>
          <dt>Phone</dt><dd>{student.phone || '—'}</dd>
          <dt>Added</dt><dd>{new Date(student.createdAt).toLocaleString()}</dd>
          <dt>Last Updated</dt><dd>{new Date(student.updatedAt).toLocaleString()}</dd>
        </dl>
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
