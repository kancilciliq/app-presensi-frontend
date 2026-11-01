import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { judulHalaman } from './auth/akses';
import Dilindungi from './auth/Dilindungi';
import ToastProvider from './toast/ToastProvider';
import Icon from './components/Icon';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import GantiPassword from './components/GantiPassword';
import ManajemenPengguna from './components/ManajemenPengguna';
import DataSiswa from './components/DataSiswa';
import ScanPresensi from './components/ScanPresensi';
import DashboardRekap from './components/DashboardRekap';
import CetakKartu from './components/CetakKartu';
import PengaturanJam from './components/PengaturanJam';
import MataPelajaran from './components/MataPelajaran';
import PresensiMapel from './components/PresensiMapel';
import DaftarMapel from './components/DaftarMapel';
import TugasMengajar from './components/TugasMengajar';
import RekapMapel from './components/RekapMapel';

// Kerangka halaman setelah login: sidebar kiri + area konten
function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [gantiPassword, setGantiPassword] = useState(false);
  const [menuTerbuka, setMenuTerbuka] = useState(false); // sidebar di HP

  if (!user) return <Navigate to="/login" replace />;

  const tutupMenu = () => setMenuTerbuka(false);

  return (
    <div className="app">
      <Sidebar
        user={user}
        terbuka={menuTerbuka}
        onTutup={tutupMenu}
        onGantiPassword={() => { tutupMenu(); setGantiPassword(true); }}
        onKeluar={logout}
      />
      <div className={`sidebar-backdrop no-print ${menuTerbuka ? 'is-open' : ''}`} onClick={tutupMenu} />

      <div className="app-body">
        <header className="topbar no-print">
          <button type="button" className="topbar__btn" aria-label="Buka menu" onClick={() => setMenuTerbuka(true)}>
            <Icon name="menu" size={22} />
          </button>
          <span className="topbar__title">{judulHalaman(pathname)}</span>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {gantiPassword && <GantiPassword onClose={() => setGantiPassword(false)} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dilindungi path="/"><DataSiswa /></Dilindungi>} />
            <Route path="/scan" element={<Dilindungi path="/scan"><ScanPresensi /></Dilindungi>} />
            <Route path="/rekap" element={<Dilindungi path="/rekap"><DashboardRekap /></Dilindungi>} />
            <Route path="/cetak-kartu" element={<Dilindungi path="/cetak-kartu"><CetakKartu /></Dilindungi>} />
            <Route path="/pengaturan" element={<Dilindungi path="/pengaturan"><PengaturanJam /></Dilindungi>} />
            <Route path="/pengguna" element={<Dilindungi path="/pengguna"><ManajemenPengguna /></Dilindungi>} />
            <Route path="/mapel" element={<Dilindungi path="/mapel"><MataPelajaran /></Dilindungi>} />
            <Route path="/mapel/:id" element={<Dilindungi path="/mapel"><PresensiMapel /></Dilindungi>} />
            <Route path="/kelola-mapel" element={<Navigate to="/kelola-mapel/daftar" replace />} />
            <Route path="/kelola-mapel/daftar" element={<Dilindungi path="/kelola-mapel/daftar"><DaftarMapel /></Dilindungi>} />
            <Route path="/kelola-mapel/tugas" element={<Dilindungi path="/kelola-mapel/tugas"><TugasMengajar /></Dilindungi>} />
            <Route path="/rekap-mapel" element={<Dilindungi path="/rekap-mapel"><RekapMapel /></Dilindungi>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
