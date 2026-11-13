import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import * as api from '../api';

// The login only lives in memory, so the app always starts logged out (on the login page)
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // If any request comes back 401 (e.g. the 8-hour token expired), drop the user → login page
    api.setUnauthorizedHandler(() => setUser(null));
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
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
