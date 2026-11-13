import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import * as api from '../api';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // While true we're still checking a saved token, so don't redirect to /login yet
  const [checking, setChecking] = useState(() => Boolean(api.getToken()));

  useEffect(() => {
    // If any request comes back 401, drop the user → app shows the login page
    api.setUnauthorizedHandler(() => setUser(null));

    // Restore the session after a page refresh
    if (!api.getToken()) return;
    api
      .getMe()
      .then(setUser)
      .catch(() => api.clearToken())
      .finally(() => setChecking(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    api.setToken(token);
    setUser(user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
