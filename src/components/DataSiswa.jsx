import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
const API_URL = import.meta.env.VITE_API_URL;

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

  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const totalPages = Math.ceil(siswa.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleSiswa = siswa.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#ffff', color: '#111111' }}>
      <h2 style={{ color: '#111111' }}>Manajemen Data Siswa</h2>
      
      {/* Header Actions */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          <strong>Import Data (Excel): </strong>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} />
        </label>

        <button
          type="button"
          onClick={downloadTemplate}
          style={{
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Unduh Template Excel
        </button>

        {/* Tombol Tambah 1 Data Siswa Manual */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Tambah Siswa
        </button>

        {loading && <span> Proses memuat data...</span>}

        
        {/*tombol delete semua data
          <button
          type="button"
          onClick = {() => setDeleteAllModal(true)}
          style={{
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Hapus Semua Data Siswa
        </button>
        */}

      </div>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
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
          {visibleSiswa.map((item, index) => (
            <tr key={item.nis}>
              <td style={{ textAlign: 'center' }}>{(currentPage - 1) * pageSize + index + 1}</td>
              <td style={{ textAlign: 'center' }}>{item.nis}</td>
              <td>{item.nama}</td>
              <td style={{ textAlign: 'center' }}>{item.kelas}</td>
              <td>{item.no_wa_ortu}</td>
              <td style={{ textAlign: 'center' }}>
                <QRCodeCanvas value={item.nis} size={64} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleEditClick(item)}
                  style={{ backgroundColor: '#ffc107', border: 'none', padding: '5px 10px', marginRight: '5px', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.nis)}
                  style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
          {siswa.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>Belum ada data siswa. Silakan unduh template dan import file Excel.</td>
            </tr>
          )}
        </tbody>
      </table>

      {siswa.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <span>
            Menampilkan {(currentPage - 1) * pageSize + 1}
            {' - '}{Math.min(currentPage * pageSize, siswa.length)} dari {siswa.length} siswa
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ padding: '6px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Sebelumnya
            </button>
            <span>Halaman {currentPage} dari {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Modal Popup Tambah Data Siswa */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '380px', color: '#111' }}>
            <h3>Tambah Data Siswa</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>NIS / NISN:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#fff', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={addData.nis}
                  onChange={(e) => setAddData({ ...addData, nis: e.target.value })}
                  placeholder="Masukkan NIS"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nama Lengkap:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#fff', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={addData.nama}
                  onChange={(e) => setAddData({ ...addData, nama: e.target.value })}
                  placeholder="Masukkan Nama Lengkap"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Kelas:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#fff', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={addData.kelas}
                  onChange={(e) => setAddData({ ...addData, kelas: e.target.value })}
                  placeholder="misal: 10 A"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>No WA Ortu:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#fff', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={addData.no_wa_ortu}
                  onChange={(e) => setAddData({ ...addData, no_wa_ortu: e.target.value })}
                  placeholder="misal: 08123456789"
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup Edit Data Siswa */}
      {editData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '380px', color: '#111' }}>
            <h3>Edit Data Siswa</h3>
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>NIS (Kunci Utama):</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#f2f2f2', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editData.nis}
                  disabled
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nama Lengkap:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#fff', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editData.nama}
                  onChange={(e) => setEditData({ ...editData, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Kelas:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#fff', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editData.kelas}
                  onChange={(e) => setEditData({ ...editData, kelas: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>No WA Ortu:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#fff', color: '#111111', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editData.no_wa_ortu}
                  onChange={(e) => setEditData({ ...editData, no_wa_ortu: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditData(null)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSiswa;