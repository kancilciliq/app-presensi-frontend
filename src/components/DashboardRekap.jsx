/* =====================================================================
   DashboardRekap.jsx
   Legenda: [BARU] = baru | [DIUBAH] = diubah | [DIHAPUS] = dibuang
   ===================================================================== */
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Pagination from './Pagination';              // [BARU]
import usePagination from '../hooks/usePagination'; // [BARU]
import './DashboardRekap.css';                      // [DIUBAH] style pindah ke CSS

const API_URL = import.meta.env.VITE_API_URL;

const DashboardRekap = () => {
  const [rekapList, setRekapList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [filter, setFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    kelas: 'Semua'
  });

  // [BARU] Pagination tabel rekap
  const pagination = usePagination(rekapList, 10);

  // [BARU] Ubah filter sekaligus kembali ke halaman 1
  const updateFilter = (patch) => {
    setFilter((prev) => ({ ...prev, ...patch }));
    pagination.setPage(1);
  };

  // Fetch daftar kelas unik dari backend
  useEffect(() => {
    axios.get(`${API_URL}/siswa`)
      .then((res) => {
        const uniqueKelas = [...new Set(res.data.map((item) => item.kelas))];
        setKelasList(uniqueKelas);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch data rekap sesuai filter
  const fetchRekap = async () => {
    try {
      const res = await axios.get(`${API_URL}/presensi/rekap`, {
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

  // Statistik Ringkasan (dihitung dari SEMUA data, bukan hanya halaman aktif)
  const totalHadir = rekapList.length;
  const tepatWaktu = rekapList.filter((item) => item.status === 'Tepat Waktu').length;
  const terlambat = rekapList.filter((item) => item.status === 'Terlambat').length;

  // Handler Export Excel (mengekspor SEMUA data)
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
    <div className="page">
      <h2 className="no-print">Dashboard Rekapitulasi Presensi</h2>

      {/* Filter Section */}
      <div className="rekap-filter no-print">
        <div>
          <label>Dari Tanggal: </label>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => updateFilter({ startDate: e.target.value })}
          />
        </div>
        <div>
          <label>Sampai Tanggal: </label>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => updateFilter({ endDate: e.target.value })}
          />
        </div>
        <div>
          <label>Kelas: </label>
          <select value={filter.kelas} onChange={(e) => updateFilter({ kelas: e.target.value })}>
            <option value="Semua">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn--success" onClick={handleExportExcel}>
          Export Excel
        </button>
        <button type="button" className="btn btn--primary" onClick={handlePrint}>
          Cetak / PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary">
        <div className="summary__card summary__card--total">
          <h4>Total Kehadiran</h4>
          <p className="summary__value">{totalHadir}</p>
        </div>
        <div className="summary__card summary__card--ontime">
          <h4>Tepat Waktu</h4>
          <p className="summary__value">{tepatWaktu}</p>
        </div>
        <div className="summary__card summary__card--late">
          <h4>Terlambat</h4>
          <p className="summary__value">{terlambat}</p>
        </div>
      </div>

      {/* Table Data */}
      <h3>Detail Data Presensi</h3>
      <table className="table">
        <thead>
          <tr>
            <th>No</th>
            <th>Waktu Masuk</th>
            <th>NISN</th>
            <th>Nama Siswa</th>
            <th>Kelas</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {/* [DIUBAH] Semua baris dirender; baris di luar halaman aktif diberi class
              row-hidden-screen (tersembunyi di layar, tetap tampil saat cetak) */}
          {rekapList.map((item, index) => {
            const onCurrentPage =
              index >= pagination.startIndex && index < pagination.startIndex + pagination.pageSize;
            return (
              <tr key={item.id || index} className={onCurrentPage ? '' : 'row-hidden-screen'}>
                <td className="text-center">{index + 1}</td>
                <td className="text-center">{new Date(item.waktu_masuk).toLocaleString('id-ID')}</td>
                <td className="text-center">{item.nis}</td>
                <td>{item.nama}</td>
                <td className="text-center">{item.kelas}</td>
                <td className={`text-center status ${item.status === 'Terlambat' ? 'status--terlambat' : 'status--tepat'}`}>
                  {item.status}
                </td>
              </tr>
            );
          })}
          {rekapList.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center">Data tidak ditemukan pada periode filter ini.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* [BARU] Navigasi halaman */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* [DIHAPUS] <style>{`@media print ...`}</style> -> pindah ke DashboardRekap.css & App.css */}
    </div>
  );
};

export default DashboardRekap;
