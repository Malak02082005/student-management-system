import { createContext, useContext } from 'react';

// Holds { user, checking, login, logout } for the whole app
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
