/* Navigasi samping (kiri). Di laptop selalu tampak, di HP geser masuk lewat tombol menu. */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { menuUntuk, NAMA_PERAN } from '../auth/akses';
import logo from '../assets/logo.png';
import Icon from './Icon';

const kelasLink = ({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`;

export default function Sidebar({ user, terbuka, onTutup, onGantiPassword, onKeluar }) {
  const { pathname } = useLocation();
  // Dropdown yang dibuka manual oleh pengguna: { [label]: true/false }
  const [manual, setManual] = useState({});

  return (
    <aside className={`sidebar no-print ${terbuka ? 'is-open' : ''}`} aria-label="Menu utama">
      <div className="sidebar__brand">
        <img src={logo} alt="Logo" className="sidebar__logo" />
        <div>
          <div className="sidebar__title">App Presensi</div>
          <div className="sidebar__school">MTs Miftahul Ulum Sidomulyo</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {menuUntuk(user.role).map((m) => {
          if (!m.children) {
            return (
              <NavLink key={m.path} to={m.path} end={m.path === '/'} className={kelasLink} onClick={onTutup}>
                <Icon name={m.icon} /> <span>{m.label}</span>
              </NavLink>
            );
          }

          const adaAktif = m.children.some((c) => pathname.startsWith(c.path));
          const buka = manual[m.label] ?? adaAktif; // otomatis terbuka jika halaman anak sedang aktif
          return (
            <div key={m.label} className={`sidebar__group ${buka ? 'is-open' : ''} ${adaAktif ? 'has-active' : ''}`}>
              <button
                type="button"
                className="sidebar__group-btn"
                aria-expanded={buka}
                onClick={() => setManual((s) => ({ ...s, [m.label]: !buka }))}
              >
                <Icon name={m.icon} /> <span>{m.label}</span>
                <Icon name="chevron" size={18} className="icon-chevron" />
              </button>
              <div className="sidebar__sub">
                {m.children.map((c) => (
                  <NavLink key={c.path} to={c.path} className={kelasLink} onClick={onTutup}>
                    <Icon name={c.icon} size={18} /> <span>{c.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <strong>{user.nama}</strong>
          <span className={`badge badge--${user.role}`}>{NAMA_PERAN[user.role]}{user.kelas ? ` ${user.kelas}` : ''}</span>
        </div>
        <div className="sidebar__actions">
          <button type="button" className="btn btn--sm btn--light" onClick={onGantiPassword}><Icon name="key" size={16} /> Password</button>
          <button type="button" className="btn btn--sm btn--light" onClick={onKeluar}><Icon name="logout" size={16} /> Keluar</button>
        </div>
      </div>
    </aside>
  );
}
