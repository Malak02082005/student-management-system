import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

// Wrap pages that need a logged-in worker. Not logged in → go to /login.
export default function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <div className="splash">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
