/* [BARU] Halaman login */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { halamanAwal } from '../auth/akses';
import logo from '../assets/logo.png';

export default function Login() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && halamanAwal(user.role) !== '/login') return <Navigate to={halamanAwal(user.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.response?.data?.message || 'Tidak dapat terhubung ke server');
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <img src={logo} alt="Logo sekolah" className="login__logo" />
        <h1 className="login__title">App Presensi</h1>
        <p className="login__sub">MTs Miftahul Ulum Sidomulyo</p>

        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="form__error" role="alert">{error}</div>}
          <label className="form__label">
            Username
            <input className="form__input" value={username} onChange={(e) => setUsername(e.target.value)}
              autoComplete="username" autoCapitalize="none" autoFocus required />
          </label>
          <label className="form__label">
            Password
            <input className="form__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required />
          </label>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
