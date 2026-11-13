import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

// A short success message ("Student added") that one page hands to the next:
//   navigate('/students', { state: { flash: 'Student added' } })
// The receiving page shows it, removes it from browser history (so a refresh won't
// show it again) and hides it after 3 seconds.
export default function useFlash() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState(location.state?.flash || '');

  useEffect(() => {
    if (location.state?.flash) {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(''), 3000);
    return () => clearTimeout(timer);
  }, [flash]);

  return [flash, setFlash];
}
