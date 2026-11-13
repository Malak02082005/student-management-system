import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createStudent, getCourses, getStudent, updateStudent } from '../api';
import StudentForm from '../components/StudentForm';
import { currentCourses, fullName, profilePath } from '../utils';

// One page, two uses:
//   /students/new        → add a new student
//   /students/:id/edit   → edit a student's profile
// Courses are added, changed and removed on the student's profile page.
export default function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [catalog, setCatalog] = useState({});
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCourses(), isEdit ? getStudent(id) : null])
      .then(([courses, existing]) => {
        setCatalog(courses);
        setStudent(existing);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // After saving, show the student's profile (new students too, so courses can be added next)
  const handleSave = async (data) => {
    const saved = isEdit ? await updateStudent(id, data) : await createStudent(data);
    navigate(profilePath(saved._id), { state: { flash: isEdit ? 'Profile updated' : 'Student added' } });
  };

  const title = isEdit ? 'Edit Profile' : 'Add Student';
  let subtitle = 'Fill in the details to register a new student.';
  if (isEdit) subtitle = student ? `Update ${fullName(student)}’s details.` : '';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="form-page">
        {error && <div className="error">{error}</div>}
        {loading && <div className="card"><p className="empty">Loading...</p></div>}
        {!loading && (!isEdit || student) && (
          <StudentForm
            key={student?._id ?? 'new'} // fresh form values when a different student is loaded
            student={student}
            catalog={catalog}
            lockEnrollment={Boolean(student && currentCourses(student).length > 0)}
            onSave={handleSave}
            onCancel={() => navigate(isEdit ? profilePath(id) : '/students')}
          />
        )}
      </div>
    </>
  );
}
