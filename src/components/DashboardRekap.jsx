import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const DashboardRekap = () => {
  const [rekapList, setRekapList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [filter, setFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    kelas: 'Semua'
  });

  // Fetch daftar kelas unik dari backend
  useEffect(() => {
    axios.get('http://localhost:3001/api/siswa')
      .then((res) => {
        const uniqueKelas = [...new Set(res.data.map((item) => item.kelas))];
        setKelasList(uniqueKelas);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch data rekap sesuai filter
  const fetchRekap = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/presensi/rekap', {
        params: filter
      });
      setRekapList(res.data);
    } catch (err) {
      console.error('Gagal mengambil data rekap:', err);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, [filter]);

  // Statistik Ringkasan
  const totalHadir = rekapList.length;
  const tepatWaktu = rekapList.filter((item) => item.status === 'Tepat Waktu').length;
  const terlambat = rekapList.filter((item) => item.status === 'Terlambat').length;

  // Handler Export Excel
  const handleExportExcel = () => {
    const dataFormatted = rekapList.map((item, index) => ({
      No: index + 1,
      Waktu: new Date(item.waktu_masuk).toLocaleString('id-ID'),
      NIS: item.nis,
      Nama: item.nama,
      Kelas: item.kelas,
      Status: item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Presensi');
    XLSX.writeFile(workbook, `Rekap_Presensi_${filter.startDate}_sd_${filter.endDate}.xlsx`);
  };

  // Handler Cetak Laporan (Window Print)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#111111', backgroundColor: '#ffff' }}>
      <h2 className="no-print" style={{ color: '#111111' }}>Dashboard Rekapitulasi Presensi</h2>

      {/* Filter Section */}
      <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
        <div>
          <label>Dari Tanggal: </label>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
          />
        </div>
        <div>
          <label>Sampai Tanggal: </label>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
          />
        </div>
        <div>
          <label>Kelas: </label>
          <select value={filter.kelas} onChange={(e) => setFilter({ ...filter, kelas: e.target.value })}>
            <option value="Semua">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <button onClick={handleExportExcel} style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
           Export Excel
        </button>
        <button onClick={handlePrint} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
          Cetak / PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, backgroundColor: '#0482ff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4>Total Kehadiran</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>{totalHadir}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center', color: '#155724' }}>
          <h4>Tepat Waktu</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>{tepatWaktu}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center', color: '#721c24' }}>
          <h4>Terlambat</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>{terlambat}</p>
        </div>
      </div>

      {/* Table Data */}
      <h3>Detail Data Presensi</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>No</th>
            <th>Waktu Masuk</th>
            <th>NISN</th>
            <th>Nama Siswa</th>
            <th>Kelas</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rekapList.map((item, index) => (
            <tr key={item.id || index}>
              <td style={{ textAlign: 'center' }}>{index + 1}</td>
              <td style={{ textAlign: 'center' }}>{new Date(item.waktu_masuk).toLocaleString('id-ID')}</td>
              <td style={{ textAlign: 'center' }}>{item.nis}</td>
              <td>{item.nama}</td>
              <td style={{ textAlign: 'center' }}>{item.kelas}</td>
              <td style={{ textAlign: 'center', color: item.status === 'Terlambat' ? 'red' : 'green', fontWeight: 'bold' }}>
                {item.status}
              </td>
            </tr>
          ))}
          {rekapList.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>Data tidak ditemukan pada periode filter ini.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Print CSS styling */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12pt; }
          table { width: 100%; border-collapse: collapse; }
        }
      `}</style>
    </div>
  );
};

export default DashboardRekap;