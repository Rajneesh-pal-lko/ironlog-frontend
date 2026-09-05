import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../data/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ironlog_token');
    if (token) {
      api.auth.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('ironlog_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { user, token } = await api.auth.login({ email, password });
    localStorage.setItem('ironlog_token', token);
    setUser(user);
    return user;
  }

  async function signup(name, email, password) {
    const { user, token } = await api.auth.signup({ name, email, password });
    localStorage.setItem('ironlog_token', token);
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem('ironlog_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
