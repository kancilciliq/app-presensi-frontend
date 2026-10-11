/* =====================================================================
   DataSiswa.jsx
   Legenda: [BARU] = baru | [DIUBAH] = diubah | [DIHAPUS] = dibuang
   Semua style inline sudah dipindah ke App.css (class .btn, .table, .modal, dst.)
   ===================================================================== */
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import Pagination from './Pagination';              // [BARU]
import usePagination from '../hooks/usePagination'; // [BARU]

const API_URL = import.meta.env.VITE_API_URL;

// [BARU] Kata yang harus diketik admin untuk mengonfirmasi hapus semua data
const KATA_KONFIRMASI = 'HAPUS';

const DataSiswa = () => {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState(null);

  // State untuk Modal & Form Tambah Siswa
  const [showAddModal, setShowAddModal] = useState(false);
  const [addData, setAddData] = useState({
    nis: '',
    nama: '',
    kelas: '',
    no_wa_ortu: ''
  });

  // [BARU] State untuk fitur Hapus Semua Data
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  // [DIUBAH] pagination lama (page/pageSize manual) diganti hook usePagination
  const pagination = usePagination(siswa, 10);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/siswa`);
      setSiswa(response.data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    axios.get(`${API_URL}/siswa`)
      .then((response) => {
        if (isMounted) setSiswa(response.data);
      })
      .catch((error) => {
        console.error('Gagal mengambil data:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Submit Handler Tambah Siswa Manual
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/siswa`, addData);
      alert('Data siswa berhasil ditambahkan!');
      setAddData({ nis: '', nama: '', kelas: '', no_wa_ortu: '' });
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menambahkan data siswa');
    }
  };

  // Download Template Excel
  const downloadTemplate = () => {
    const templateData = [
      ['NIS', 'Nama Lengkap', 'Kelas', 'No WA Ortu'],
      ['1001', 'Ahmad Dahlan', '10 A', '081234567890'],
      ['1002', 'Siti Rahma', '10 A', '082345678901']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 16 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, 'Template_Tambah_Siswa.xlsx');
  };

  // Handle Import Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const formattedData = data.slice(1).filter(row => row.length >= 4).map(row => [
          String(row[0]), // NIS
          String(row[1]), // Nama
          String(row[2]), // Kelas
          String(row[3])  // No WA Ortu
        ]);

        if (formattedData.length > 0) {
          await axios.post(`${API_URL}/siswa/import`, { dataSiswa: formattedData });
          alert('Data berhasil di-import!');
          fetchData();
        } else {
          alert('Format data Excel kosong atau tidak sesuai.');
        }
      } catch (error) {
        console.error('Error saat import:', error);
        alert('Gagal meng-import data.');
      } finally {
        setLoading(false);
        e.target.value = ''; // [BARU] reset input agar file yang sama bisa dipilih lagi
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (nis) => {
    if (window.confirm(`Yakin ingin menghapus data NIS: ${nis}?`)) {
      try {
        await axios.delete(`${API_URL}/siswa/${nis}`);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus data');
      }
    }
  };

  /* [BARU] Hapus SEMUA data siswa.
     Dikirim kata konfirmasi ke backend sebagai pengaman ganda. */
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await axios.delete(`${API_URL}/siswa`, {
        data: { konfirmasi: KATA_KONFIRMASI }
      });
      alert(res.data.message || 'Semua data siswa berhasil dihapus');
      closeDeleteAllModal();
      pagination.setPage(1);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus semua data siswa');
    } finally {
      setDeletingAll(false);
    }
  };

  // [BARU] Tutup modal hapus semua + kosongkan kolom konfirmasi
  const closeDeleteAllModal = () => {
    setShowDeleteAllModal(false);
    setDeleteConfirmText('');
  };

  const handleEditClick = (item) => {
    setEditData({ ...item });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/siswa/${editData.nis}`, {
        nama: editData.nama,
        kelas: editData.kelas,
        no_wa_ortu: editData.no_wa_ortu
      });
      setEditData(null);
      fetchData();
    } catch (error) {
      alert('Gagal memperbarui data siswa');
    }
  };

  return (
    <div className="page">
      <h2>Manajemen Data Siswa</h2>

      {/* Header Actions */}
      <div className="toolbar">
        <label>
          <strong>Import Data (Excel): </strong>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} />
        </label>

        <button type="button" className="btn btn--success" onClick={downloadTemplate}>
          Unduh Template Excel
        </button>

        {/* Tombol Tambah 1 Data Siswa Manual */}
        <button type="button" className="btn btn--primary" onClick={() => setShowAddModal(true)}>
          + Tambah Siswa
        </button>

        {/* [BARU] Tombol Hapus Semua Data (sebelumnya masih dikomentari) */}
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => setShowDeleteAllModal(true)}
          disabled={siswa.length === 0}
        >
          Hapus Semua Data Siswa
        </button>

        {loading && <span> Proses memuat data...</span>}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>No</th>
            <th>NISN</th>
            <th>Nama Lengkap</th>
            <th>Kelas</th>
            <th>No WA Ortu</th>
            <th>QR Code (NIS)</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {pagination.visibleItems.map((item, index) => (
            <tr key={item.nis}>
              <td className="text-center">{pagination.startIndex + index + 1}</td>
              <td className="text-center">{item.nis}</td>
              <td>{item.nama}</td>
              <td className="text-center">{item.kelas}</td>
              <td>{item.no_wa_ortu}</td>
              <td className="text-center">
                <QRCodeCanvas value={item.nis} size={64} />
              </td>
              <td className="text-center">
                <button type="button" className="btn btn--sm btn--warning" onClick={() => handleEditClick(item)}>
                  Edit
                </button>{' '}
                <button type="button" className="btn btn--sm btn--danger" onClick={() => handleDelete(item.nis)}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
          {siswa.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center">
                Belum ada data siswa. Silakan unduh template dan import file Excel.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* [DIUBAH] Pagination lama diganti komponen <Pagination /> (nomor halaman + pilih jumlah baris) */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* Modal Popup Tambah Data Siswa */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Tambah Data Siswa</h3>
            <form onSubmit={handleAddSubmit} className="form">
              <div>
                <label className="form__label">NIS / NISN:</label>
                <input
                  type="text"
                  className="form__input"
                  value={addData.nis}
                  onChange={(e) => setAddData({ ...addData, nis: e.target.value })}
                  placeholder="Masukkan NIS"
                  required
                />
              </div>
              <div>
                <label className="form__label">Nama Lengkap:</label>
                <input
                  type="text"
                  className="form__input"
                  value={addData.nama}
                  onChange={(e) => setAddData({ ...addData, nama: e.target.value })}
                  placeholder="Masukkan Nama Lengkap"
                  required
                />
              </div>
              <div>
                <label className="form__label">Kelas:</label>
                <input
                  type="text"
                  className="form__input"
                  value={addData.kelas}
                  onChange={(e) => setAddData({ ...addData, kelas: e.target.value })}
                  placeholder="misal: 10 A"
                  required
                />
              </div>
              <div>
                <label className="form__label">No WA Ortu:</label>
                <input
                  type="text"
                  className="form__input"
                  value={addData.no_wa_ortu}
                  onChange={(e) => setAddData({ ...addData, no_wa_ortu: e.target.value })}
                  placeholder="misal: 08123456789"
                  required
                />
              </div>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn--primary">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup Edit Data Siswa */}
      {editData && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Data Siswa</h3>
            <form onSubmit={handleUpdateSubmit} className="form">
              <div>
                <label className="form__label">NIS (Kunci Utama):</label>
                <input
                  type="text"
                  className="form__input form__input--readonly"
                  value={editData.nis}
                  disabled
                />
              </div>
              <div>
                <label className="form__label">Nama Lengkap:</label>
                <input
                  type="text"
                  className="form__input"
                  value={editData.nama}
                  onChange={(e) => setEditData({ ...editData, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form__label">Kelas:</label>
                <input
                  type="text"
                  className="form__input"
                  value={editData.kelas}
                  onChange={(e) => setEditData({ ...editData, kelas: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form__label">No WA Ortu:</label>
                <input
                  type="text"
                  className="form__input"
                  value={editData.no_wa_ortu}
                  onChange={(e) => setEditData({ ...editData, no_wa_ortu: e.target.value })}
                  required
                />
              </div>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setEditData(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn--primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* [BARU] Modal Konfirmasi Hapus Semua Data Siswa */}
      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal modal--danger">
            <h3>Hapus Semua Data Siswa?</h3>
            <p className="modal__warning">
              Tindakan ini akan menghapus <strong>{siswa.length} data siswa</strong> beserta
              seluruh riwayat presensinya dan <strong>tidak bisa dibatalkan</strong>.
            </p>
            <div className="form">
              <div>
                <label className="form__label">
                  Ketik <strong>{KATA_KONFIRMASI}</strong> untuk melanjutkan:
                </label>
                <input
                  type="text"
                  className="form__input"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={KATA_KONFIRMASI}
                  autoFocus
                />
              </div>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={closeDeleteAllModal} disabled={deletingAll}>
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleDeleteAll}
                  disabled={deleteConfirmText !== KATA_KONFIRMASI || deletingAll}
                >
                  {deletingAll ? 'Menghapus...' : 'Hapus Semua'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSiswa;
