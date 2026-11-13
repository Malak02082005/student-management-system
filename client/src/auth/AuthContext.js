import { createContext, useContext } from 'react';

// Holds { user, login, logout } for the whole app
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
