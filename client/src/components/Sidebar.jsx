import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { DashboardIcon, LogoIcon, LogoutIcon, UserPlusIcon, UsersIcon, CloseIcon } from './Icons';

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  // /students/new is "Add Student"; every other /students page (list, profile, edit) is "Students"
  const addStudentActive = pathname === '/students/new';
  const studentsActive = pathname.startsWith('/students') && !addStudentActive;

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span className="brand-logo"><LogoIcon size={22} /></span>
        <span className="brand-text">
          <strong>Student</strong>
          <small>Management System</small>
        </span>
        <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu">
          <CloseIcon size={18} />
        </button>
      </div>

      <p className="nav-label">Menu</p>
      <nav className="nav">
        <NavLink to="/dashboard" className="nav-item" onClick={onClose}>
          <DashboardIcon /> Dashboard
        </NavLink>
        <NavLink
          to="/students"
          className={() => `nav-item ${studentsActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <UsersIcon /> Students
        </NavLink>
        <NavLink
          to="/students/new"
          className={() => `nav-item ${addStudentActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <UserPlusIcon /> Add Student
        </NavLink>
      </nav>

      <p className="nav-label">General</p>
      <nav className="nav">
        <button type="button" className="nav-item" onClick={logout}>
          <LogoutIcon /> Logout
        </button>
      </nav>
    </aside>
  );
}
