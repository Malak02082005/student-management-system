import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentFormPage from './pages/StudentFormPage';
import StudentProfilePage from './pages/StudentProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Every page inside here needs a logged-in worker and shows the sidebar */}
          <Route
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new" element={<StudentFormPage key="new" />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
            <Route path="/students/:id/edit" element={<StudentFormPage key="edit" />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
