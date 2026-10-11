/* =====================================================================
   CetakKartu.jsx
   Legenda: [BARU] = baru | [DIUBAH] = diubah | [DIHAPUS] = dibuang
   ===================================================================== */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import Pagination from './Pagination';              // [BARU]
import usePagination from '../hooks/usePagination'; // [BARU]
import './CetakKartu.css';                          // [DIUBAH] style pindah ke CSS

const API_URL = import.meta.env.VITE_API_URL;

// [DIUBAH] 8 kartu = 1 lembar A4 (2 kolom x 4 baris), sebelumnya 16. Satu "halaman" pagination = satu lembar.
const CARDS_PER_SHEET = 8;

const CetakKartu = () => {
  const [siswa, setSiswa] = useState([]);
  const [kelasFilter, setKelasFilter] = useState('Semua');
  const [kelasList, setKelasList] = useState([]);
  const [printMode, setPrintMode] = useState('all'); // [BARU] 'all' | 'current'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/siswa`);
        setSiswa(res.data);
        const uniqueKelas = [...new Set(res.data.map((s) => s.kelas))];
        setKelasList(uniqueKelas);
      } catch (err) {
        console.error('Gagal mengambil data siswa:', err);
      }
    };
    fetchData();
  }, []);

  // [BARU] Setelah dialog cetak ditutup, kembalikan mode ke "semua"
  useEffect(() => {
    const reset = () => setPrintMode('all');
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, []);

  const filteredSiswa = kelasFilter === 'Semua'
    ? siswa
    : siswa.filter((s) => s.kelas === kelasFilter);

  // [BARU] Pagination (ukuran halaman tetap = 1 lembar A4)
  const pagination = usePagination(filteredSiswa, CARDS_PER_SHEET);

  // Dipecah per lembar; semua lembar tetap dirender agar bisa dicetak sekaligus
  const pages = Array.from({ length: Math.ceil(filteredSiswa.length / CARDS_PER_SHEET) }, (_, pageIndex) =>
    filteredSiswa.slice(pageIndex * CARDS_PER_SHEET, pageIndex * CARDS_PER_SHEET + CARDS_PER_SHEET)
  );

  // [BARU] Ganti filter -> kembali ke halaman 1
  const handleFilterChange = (value) => {
    setKelasFilter(value);
    pagination.setPage(1);
  };

  // [BARU] Atur mode cetak lalu buka dialog print
  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100); // beri waktu React memasang class mode
  };

  return (
    <div className={`page print-root ${printMode === 'current' ? 'print-current' : ''}`}>
      {/* Menu Pengaturan Cetak (Sembunyi saat di-print) */}
      <div className="toolbar toolbar--panel no-print">
        <h2 className="toolbar__title">Cetak Kartu QR Code Siswa</h2>
        <div className="toolbar__right">
          <label><strong>Filter Kelas:</strong></label>
          <select
            className="form__input"
            value={kelasFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="Semua">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {/* [DIUBAH] 1 tombol cetak -> 2 pilihan */}
          <button
            type="button"
            className="btn btn--success"
            onClick={() => handlePrint('current')}
            disabled={filteredSiswa.length === 0}
          >
            Cetak Halaman Ini
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => handlePrint('all')}
            disabled={filteredSiswa.length === 0}
          >
            Cetak {filteredSiswa.length} Kartu
          </button>
        </div>
      </div>

      {/* Grid Kartu Presensi */}
      <div className="card-pages">
        {pages.map((page, pageIndex) => (
          // [DIUBAH] class is-current menandai lembar yang sedang dibuka
          <div
            className={`card-page ${pageIndex + 1 === pagination.page ? 'is-current' : ''}`}
            key={pageIndex}
          >
            {page.map((item) => (
              <div key={item.nis} className="card-item">
                <div className="card-header">
                  <h3>KARTU PRESENSI SISWA</h3>
                  <p>MTS MIFTAHUL ULUM SIDOMULYO</p>
                </div>
                <div className="card-body">
                  <div className="qr-box">
                    <QRCodeCanvas value={item.nis} size={100} />
                  </div>
                  <div className="bio-box">
                    <p className="nama"><strong>{item.nama}</strong></p>
                    <p>NISN: {item.nis}</p>
                    <p>Kelas: {item.kelas}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {filteredSiswa.length === 0 && (
          <p className="card-empty">Belum ada data siswa untuk dicetak.</p>
        )}
      </div>

      {/* [BARU] Navigasi halaman (tanpa pilihan baris, karena 1 halaman = 1 lembar A4) */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
      />

      {/* [DIHAPUS] <style>{`...`}</style> -> pindah ke CetakKartu.css */}
    </div>
  );
};

export default CetakKartu;
