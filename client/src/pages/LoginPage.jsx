import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { EyeIcon, EyeOffIcon, LogoIcon } from '../components/Icons';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in → go to the page they originally wanted (or the dashboard)
  if (user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left: green brand panel (hidden on small screens) */}
      <section className="login-hero">
        <div className="brand brand-light">
          <span className="brand-logo"><LogoIcon size={22} /></span>
          <span className="brand-text">
            <strong>Student</strong>
            <small>Management System</small>
          </span>
        </div>

        <div className="login-hero-copy">
          <h2>All your student records, in one place.</h2>
          <p>Add, view, update and manage students with a fast, simple dashboard built for staff.</p>
        </div>

        {/* decorative pill bars, echoing the dashboard chart */}
        <div className="login-bars" aria-hidden="true">
          {[45, 70, 55, 90, 40, 65, 80].map((h, i) => (
            <span key={i} className={i % 3 === 1 ? 'striped' : ''} style={{ height: `${h}%` }} />
          ))}
        </div>
      </section>

      {/* Right: login form */}
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="brand login-mobile-brand">
            <span className="brand-logo"><LogoIcon size={22} /></span>
            <span className="brand-text">
              <strong>Student</strong>
              <small>Management System</small>
            </span>
          </div>

          <h1>Welcome back</h1>
          <p className="muted">Log in with your staff account to continue.</p>

          {error && <div className="error">{error}</div>}

          <label className="field">Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              autoComplete="username"
              autoFocus
              required
            />
          </label>

          <label className="field">Password
            <span className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </span>
          </label>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p className="login-note">Don't have an account? Ask your administrator to create one.</p>
        </form>
      </section>
    </div>
  );
}
