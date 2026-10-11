import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // [DIUBAH] seluruh style kini ada di App.css (tidak ada inline style lagi)
import DataSiswa from './components/DataSiswa';
import ScanPresensi from './components/ScanPresensi';
import DashboardRekap from './components/DashboardRekap';
import CetakKartu from './components/CetakKartu';
import PengaturanJam from './components/PengaturanJam'; // [BARU]

function App() {
  return (
    <Router>
      {/* [DIUBAH] style={{...}} diganti className="app" */}
      <div className="app">
        {/* Navigation Bar */}
        <nav className="navbar no-print">
          <Link to="/" className="navbar__link">Data Siswa</Link>
          <Link to="/scan" className="navbar__link">Scan Presensi</Link>
          <Link to="/rekap" className="navbar__link">Rekap & Laporan</Link>
          <Link to="/cetak-kartu" className="navbar__link">Cetak Kartu QR</Link>
          {/* [BARU] Menu pengaturan jam masuk & pulang */}
          <Link to="/pengaturan" className="navbar__link">Pengaturan Jam</Link>
        </nav>

        {/* Content Routes */}
        <Routes>
          <Route path="/" element={<DataSiswa />} />
          <Route path="/scan" element={<ScanPresensi />} />
          <Route path="/rekap" element={<DashboardRekap />} />
          <Route path="/cetak-kartu" element={<CetakKartu />} />
          {/* [BARU] */}
          <Route path="/pengaturan" element={<PengaturanJam />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
