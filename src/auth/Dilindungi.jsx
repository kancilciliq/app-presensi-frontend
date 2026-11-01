import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { boleh, halamanAwal } from './akses';

// Bungkus halaman: belum login -> /login, peran tidak berhak -> halaman awal perannya.
export default function Dilindungi({ path, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!boleh(user.role, path)) return <Navigate to={halamanAwal(user.role)} replace />;
  return children;
}
