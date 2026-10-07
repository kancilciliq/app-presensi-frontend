import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';

const DataSiswa = () => {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/siswa');
      setSiswa(response.data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          await axios.post('http://localhost:3001/api/siswa/import', { dataSiswa: formattedData });
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
        await axios.delete(`http://localhost:3001/api/siswa/${nis}`);
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
      await axios.put(`http://localhost:3001/api/siswa/${editData.nis}`, {
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Manajemen Data Siswa</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
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

        {loading && <span> Proses memuat data...</span>}
      </div>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>No</th>
            <th>NIS</th>
            <th>Nama Lengkap</th>
            <th>Kelas</th>
            <th>No WA Ortu</th>
            <th>QR Code (NIS)</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {siswa.map((item, index) => (
            <tr key={item.nis}>
              <td style={{ textAlign: 'center' }}>{index + 1}</td>
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

      {editData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '380px' }}>
            <h3>Edit Data Siswa</h3>
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>NIS (Kunci Utama):</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#e9ecef' }}
                  value={editData.nis}
                  disabled
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nama Lengkap:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  value={editData.nama}
                  onChange={(e) => setEditData({ ...editData, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Kelas:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  value={editData.kelas}
                  onChange={(e) => setEditData({ ...editData, kelas: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>No WA Ortu:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
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