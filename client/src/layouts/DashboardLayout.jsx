import { useState } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import Sidebar from '../components/Sidebar';
import { MenuIcon } from '../components/Icons';
import { initials } from '../utils';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// Sidebar + top bar around every logged-in page. The page itself renders in <Outlet />.
export default function DashboardLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  // "Mary Ann Smith" → first "Mary", last "Smith" (middle names are skipped)
  const nameParts = user.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.at(-1) : '';

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <p className="topbar-greeting">
            {greeting()}, <strong>{firstName}</strong>
          </p>
          <div className="user-chip">
            <span className="avatar">{initials(firstName, lastName)}</span>
            <span className="user-chip-text">
              <span className="user-chip-name">{user.name}</span>
              <span className="user-chip-email">{user.email}</span>
            </span>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
