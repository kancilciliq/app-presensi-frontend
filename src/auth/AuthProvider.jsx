import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { clearToken, getToken, setToken } from './token';

const API_URL = import.meta.env.VITE_API_URL;

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [siap, setSiap] = useState(() => !getToken()); // tanpa token: langsung siap (belum login)

  // Pulihkan sesi saat halaman dibuka / di-refresh
  useEffect(() => {
    if (!getToken()) return;
    axios.get(`${API_URL}/auth/me`)
      .then((res) => setUser(res.data.user))
      .catch(() => clearToken())
      .finally(() => setSiap(true));
  }, []);

  // Dipicu interceptor saat server menjawab 401 (sesi habis / akun dinonaktifkan)
  useEffect(() => {
    const keluar = () => setUser(null);
    window.addEventListener('auth:logout', keluar);
    return () => window.removeEventListener('auth:logout', keluar);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { username, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  if (!siap) return <div className="auth-memuat">Memuat...</div>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
