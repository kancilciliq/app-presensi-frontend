import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScanPresensi = () => {
  const [presensiList, setPresensiList] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // 1. Fetch riwayat hari ini
    axios.get('http://localhost:3001/api/presensi/hari-ini')
      .then(res => setPresensiList(res.data));

    // 2. Socket listener
    const socket = io('http://localhost:3001');
    socket.on('absen_baru', (dataBaru) => {
      setPresensiList((prev) => [dataBaru, ...prev]);
    });

    // 3. Inisialisasi Scanner Kamera
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      async (nisScanned) => {
        // Dipicu saat kamera berhasil mendeteksi QR Code
        try {
          const res = await axios.post('http://localhost:3001/api/presensi/scan', { nis: nisScanned });
          const { data } = res.data;
          setFeedback({
            type: 'success',
            message: `BERHASIL: ${data.nama} (${data.kelas}) - ${data.status}`
          });
        } catch (err) {
          const msg = err.response?.data?.message || 'Gagal memproses absensi';
          setFeedback({ type: 'error', message: `GAGAL: ${msg}` });
        } finally {
          setTimeout(() => setFeedback(null), 400);
        }
      },
      (error) => {
        // Handling error scan (opsional)
      }
    );

    return () => {
      scanner.clear().catch(error => console.error(error));
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#111111', backgroundColor: '#ffff' }}>
      
      <h2 style={{ color: '#111111' }}>Scan Presensi via Kamera</h2>

      
      <div id="reader" style={{ width: '400px', marginBottom: '20px' }}></div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          color: '#fff',
          backgroundColor: feedback.type === 'success' ? '#28a745' : '#dc3545',
          fontWeight: 'bold'
        }}>
          {feedback.message}
        </div>
      )}

      {/* Tabel Riwayat */}
      <h3>Riwayat Presensi Hari Ini</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>Waktu Masuk</th>
            <th>NISN</th>
            <th>Nama</th>
            <th>Kelas</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {presensiList.map((item, index) => (
            <tr key={item.id || index}>
              <td>{new Date(item.waktu_masuk).toLocaleTimeString('id-ID')} WIB</td>
              <td>{item.nis}</td>
              <td>{item.nama}</td>
              <td>{item.kelas}</td>
              <td style={{ color: item.status === 'Terlambat' ? 'red' : 'green', fontWeight: 'bold' }}>
                {item.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScanPresensi;