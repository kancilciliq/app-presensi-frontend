import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

const CetakKartu = () => {
  const [siswa, setSiswa] = useState([]);
  const [kelasFilter, setKelasFilter] = useState('Semua');
  const [kelasList, setKelasList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/siswa');
        setSiswa(res.data);
        const uniqueKelas = [...new Set(res.data.map((s) => s.kelas))];
        setKelasList(uniqueKelas);
      } catch (err) {
        console.error('Gagal mengambil data siswa:', err);
      }
    };
    fetchData();
  }, []);

  const filteredSiswa = kelasFilter === 'Semua'
    ? siswa
    : siswa.filter((s) => s.kelas === kelasFilter);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Menu Pengaturan Cetak (Sembunyi saat di-print) */}
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#e684ff', padding: '15px', borderRadius: '8px' }}>
        <h2 style={{ margin: 0 }}>Cetak Kartu QR Code Siswa</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label><strong>Filter Kelas:</strong> </label>
          <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
            <option value="Semua">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Cetak {filteredSiswa.length} Kartu
          </button>
        </div>
      </div>

      {/* Grid Kartu Presensi */}
      <div className="card-container">
        {filteredSiswa.map((item) => (
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

      {/* Styling untuk Layar dan Cetak A4 */}
      <style>{`
        .card-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }
        .card-item {
          border: 2px solid #333;
          border-radius: 8px;
          padding: 12px;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          box-sizing: border-box;
        }
        .card-header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        .card-header h3 {
          margin: 0;
          font-size: 13px;
          letter-spacing: 0.5px;
        }
        .card-header p {
          margin: 2px 0 0 0;
          font-size: 9px;
          color: #555;
          font-weight: bold;
        }
        .card-body {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bio-box p {
          margin: 3px 0;
          font-size: 12px;
        }
        .bio-box p.nama {
          font-size: 13px;
          color: #007bff;
        }

        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #fff; }
          .card-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .card-item {
            box-shadow: none;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default CetakKartu;