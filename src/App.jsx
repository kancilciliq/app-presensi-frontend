import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DataSiswa from './components/DataSiswa';
import ScanPresensi from './components/ScanPresensi';
import DashboardRekap from './components/DashboardRekap';
import CetakKartu from './components/CetakKartu';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'sans-serif', backgroundColor: '#ffff', color: '#111111' }}>
        {/* Navigation Bar */}
        <nav className="no-print" style={{ backgroundColor: '#f6f3f3', padding: '15px', marginBottom: '20px' }}>
          <Link to="/" style={{ color: '#111111', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>
            Data Siswa
          </Link>
          <Link to="/scan" style={{ color: '#111111', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>
            Scan Presensi
          </Link>
          <Link to="/rekap" style={{ color: '#111111', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>
            Rekap & Laporan
          </Link>
          <Link to="/cetak-kartu" style={{ color: '#111111', textDecoration: 'none', fontWeight: 'bold' }}>
            Cetak Kartu QR
          </Link>
        </nav>

        {/* Content Routes */}
        <Routes>
          <Route path="/" element={<DataSiswa />} />
          <Route path="/scan" element={<ScanPresensi />} />
          <Route path="/rekap" element={<DashboardRekap />} />
          <Route path="/cetak-kartu" element={<CetakKartu />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;