import { useEffect, useState } from 'react';
import { getCourses, getStudents, createStudent, updateStudent, deleteStudent } from './api';
import StudentForm from './components/StudentForm';
import StudentTable from './components/StudentTable';
import StudentDetails from './components/StudentDetails';

export default function App() {
  const [students, setStudents] = useState([]);
  const [coursesByYear, setCoursesByYear] = useState({}); // { 1: [...], 2: [...], ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // student being edited
  const [viewing, setViewing] = useState(null); // student shown in the popup
  const [search, setSearch] = useState('');

  // Load students and the course list once when the page opens
  useEffect(() => {
    Promise.all([getStudents(), getCourses()])
      .then(([studentList, courses]) => {
        setStudents(studentList);
        setCoursesByYear(courses);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data) => {
    if (editing) {
      const updated = await updateStudent(editing._id, data);
      setStudents((list) => list.map((s) => (s._id === updated._id ? updated : s)));
      setEditing(null);
    } else {
      const created = await createStudent(data);
      setStudents((list) => [created, ...list]);
    }
  };

  const handleDelete = async (student) => {
    const fullName = `${student.firstName} ${student.lastName}`;
    if (!window.confirm(`Delete ${fullName}? This cannot be undone.`)) return;
    try {
      await deleteStudent(student._id);
      setStudents((list) => list.filter((s) => s._id !== student._id));
      if (editing?._id === student._id) setEditing(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const q = search.toLowerCase();
  const filtered = students.filter((s) =>
    [`${s.firstName} ${s.lastName}`, s.email, s.rollNumber, s.course].some((v) =>
      (v || '').toLowerCase().includes(q)
    )
  );

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Student Management System</h1>
          <p>Add, view, update and delete student records</p>
        </div>
        <span className="badge">{students.length} Students</span>
      </header>

      <main className="layout">
        {/* key forces a fresh form when switching between add and edit */}
        <StudentForm
          key={editing?._id ?? 'new'}
          student={editing}
          coursesByYear={coursesByYear}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />

        <section className="card">
          <div className="toolbar">
            <h2>All Students</h2>
            <input
              className="search"
              placeholder="Search by name, email, roll no, course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {error && <div className="error">{error}</div>}
          {loading ? (
            <p className="empty">Loading...</p>
          ) : (
            <StudentTable
              students={filtered}
              onView={setViewing}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>

      {viewing && <StudentDetails student={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
