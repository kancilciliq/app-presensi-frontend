/* =====================================================================
   ScanPresensi.jsx
   Legenda: [BARU] = baru | [DIUBAH] = diubah | [DIHAPUS] = dibuang
   ===================================================================== */
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
// [DIUBAH] Html5QrcodeScanner (UI bawaan) diganti Html5Qrcode (kontrol manual).
// Html5QrcodeScanner.clear() bersifat async, sehingga di React StrictMode
// render() kedua jalan sebelum clear() pertama selesai -> muncul 2 kamera.
import { Html5Qrcode } from 'html5-qrcode';
import Pagination from './Pagination';       // [BARU]
import usePagination from '../hooks/usePagination'; // [BARU]
import './ScanPresensi.css';                 // [BARU] style dipindah ke file CSS

const API_URL = import.meta.env.VITE_API_URL;

const READER_ID = 'reader';
const AUTO_CLOSE_MS = 5000; // [BARU] popup tertutup otomatis (samakan dengan 5s di CSS)

/* [BARU] Antrian start/stop kamera.
   Setiap start/stop dijalankan BERURUTAN. Jadi ketika React menjalankan
   effect 2x (StrictMode), kamera pertama pasti berhenti dulu sebelum
   kamera kedua menyala -> tidak pernah ada 2 kamera. */
let scannerQueue = Promise.resolve();

/* ---------------------------------------------------------------------
   [BARU] Popup notifikasi scan yang interaktif
   - Menutup otomatis (ada garis waktu mundur)
   - Bisa ditutup dengan tombol, klik latar gelap, atau tombol Esc
   - Selama popup tampil kamera DIJEDA, saat ditutup kamera lanjut lagi
   --------------------------------------------------------------------- */
const ScanNotification = ({ feedback, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [feedback, onClose]);

  // [DIUBAH] ditambah jenis 'pulang' (scan pulang berhasil)
  const icons = { success: '✓', late: '✓', pulang: '✓', duplicate: '!', error: '✕' };
  const { type, nama, kelas, nis, status, waktu, message } = feedback;

  return (
    <div className="scan-notif-overlay" onClick={onClose}>
      <div
        className={`scan-notif scan-notif--${type}`}
        role="alertdialog"
        aria-live="assertive"
        onClick={(e) => e.stopPropagation()} // klik di kartu tidak menutup popup
      >
        <div className="scan-notif__icon">{icons[type]}</div>
        <h3 className="scan-notif__title">{feedback.title}</h3>

        {nama && (
          <>
            <p className="scan-notif__name">{nama}</p>
            <p className="scan-notif__detail">Kelas {kelas} · NISN {nis}</p>
            {waktu && (
              <p className="scan-notif__detail">
                Pukul {new Date(waktu).toLocaleTimeString('id-ID')} WIB
              </p>
            )}
            {status && <span className="scan-notif__badge">{status}</span>}
          </>
        )}

        {message && <p className="scan-notif__message">{message}</p>}

        <button
          type="button"
          className={`btn scan-notif__close ${type === 'duplicate' ? 'btn--warning' : 'btn--primary'}`}
          onClick={onClose}
          autoFocus
        >
          Scan Berikutnya
        </button>

        {/* garis waktu mundur; key agar animasi mulai ulang tiap notifikasi baru */}
        <div className="scan-notif__timer" key={feedback.id} />
      </div>
    </div>
  );
};

const ScanPresensi = () => {
  const [presensiList, setPresensiList] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [cameraError, setCameraError] = useState(''); // [BARU]

  const scannerRef = useRef(null);      // [BARU] menyimpan instance kamera aktif
  const processingRef = useRef(false);  // [BARU] mencegah scan ganda saat request berjalan

  // [BARU] Pagination untuk tabel riwayat
  const pagination = usePagination(presensiList, 10);

  /* [BARU] Menutup popup lalu melanjutkan kamera */
  const closeFeedback = useCallback(() => {
    setFeedback(null);
    try {
      scannerRef.current?.resume();
    } catch {
      /* kamera sedang tidak dijeda -> abaikan */
    }
    processingRef.current = false;
  }, []);

  /* [DIUBAH] Dipicu saat kamera berhasil membaca QR.
     Hasil ditampilkan lewat popup interaktif, bukan banner 0,4 detik. */
  const handleScan = useCallback(async (nisScanned) => {
    if (processingRef.current) return; // masih memproses scan sebelumnya
    processingRef.current = true;

    try {
      scannerRef.current?.pause(true); // jeda kamera selama popup tampil
    } catch {
      /* abaikan */
    }

    const id = Date.now(); // penanda unik notifikasi

    try {
      const res = await axios.post(`${API_URL}/presensi/scan`, { nis: nisScanned });
      const { data } = res.data;
      // [DIUBAH] Backend menentukan jenis scan (masuk/pulang) dari pengaturan jam
      const pulang = data.jenis === 'pulang';
      setFeedback({
        id,
        type: pulang ? 'pulang' : data.status === 'Terlambat' ? 'late' : 'success',
        title: pulang ? 'Presensi Pulang Berhasil' : 'Presensi Masuk Berhasil',
        nama: data.nama,
        kelas: data.kelas,
        nis: data.nis,
        status: pulang ? 'Pulang' : data.status,
        waktu: pulang ? data.waktu_pulang : data.waktu_masuk,
      });
    } catch (err) {
      const body = err.response?.data;

      if (err.response?.status === 409) {
        // Sudah scan masuk / sudah scan pulang (1x masuk & 1x pulang per hari)
        setFeedback({
          id,
          type: 'duplicate',
          title: body?.title || 'Sudah Scan Hari Ini', // [DIUBAH] judul dari backend
          nama: body?.data?.nama,
          kelas: body?.data?.kelas,
          nis: body?.data?.nis,
          status: body?.data?.status,
          waktu: body?.data?.waktu, // [DIUBAH] waktu scan sebelumnya (masuk atau pulang)
          message: body?.message,
        });
      } else {
        // [DIUBAH] judul bisa dari backend: "Presensi Belum Dibuka", "Belum Scan Masuk", dll.
        setFeedback({
          id,
          type: 'error',
          title: body?.title || 'Presensi Gagal',
          message: body?.message || 'Gagal memproses absensi',
        });
      }
    }
  }, []);

  /* Riwayat hari ini + socket realtime */
  useEffect(() => {
    axios.get(`${API_URL}/presensi/hari-ini`).then((res) => setPresensiList(res.data));

    const socket = io(`${API_URL.replace('/api', '')}`);
    socket.on('absen_baru', (dataBaru) => {
      // [DIUBAH] cegah baris dobel jika data yang sama datang 2x
      setPresensiList((prev) =>
        prev.some((p) => p.id === dataBaru.id) ? prev : [dataBaru, ...prev]
      );
    });

    // [BARU] Saat siswa scan pulang, baris yang sama diperbarui (kolom Waktu Pulang terisi)
    socket.on('absen_pulang', (dataPulang) => {
      setPresensiList((prev) =>
        prev.map((p) => (p.id === dataPulang.id ? { ...p, waktu_pulang: dataPulang.waktu_pulang } : p))
      );
    });

    return () => socket.disconnect();
  }, []);

  /* [DIUBAH] Kamera dipisah ke effect sendiri + memakai antrian scannerQueue */
  useEffect(() => {
    let scanner = null;
    let cancelled = false;

    const startTask = scannerQueue
      .then(async () => {
        if (cancelled) return; // komponen sudah dilepas sebelum sempat start
        scanner = new Html5Qrcode(READER_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' }, // kamera belakang; di laptop memakai webcam
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          () => {} // error per-frame (QR belum terbaca) diabaikan
        );
      })
      .catch((err) => {
        console.error('Gagal membuka kamera:', err);
        setCameraError('Kamera tidak dapat dibuka. Izinkan akses kamera di browser lalu muat ulang halaman.');
      });

    scannerQueue = startTask;

    // Cleanup: hentikan kamera SETELAH proses start selesai
    return () => {
      cancelled = true;
      scannerQueue = startTask.then(async () => {
        try {
          if (scanner?.isScanning) await scanner.stop();
          scanner?.clear();
        } catch (err) {
          console.error(err);
        }
        scannerRef.current = null;
      });
    };
  }, [handleScan]);

  return (
    <div className="page">
      <h2>Scan Presensi via Kamera</h2>

      {/* [DIUBAH] id="reader" kini hanya berisi video kamera tunggal */}
      <div id={READER_ID} className="scan-reader"></div>
      {cameraError && <p className="scan-camera-error">{cameraError}</p>}

      {/* [DIUBAH] Banner lama diganti popup interaktif */}
      {feedback && <ScanNotification feedback={feedback} onClose={closeFeedback} />}

      {/* Tabel Riwayat */}
      <h3>Riwayat Presensi Hari Ini</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Waktu Masuk</th>
            {/* [BARU] kolom Waktu Pulang */}
            <th>Waktu Pulang</th>
            <th>NISN</th>
            <th>Nama</th>
            <th>Kelas</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {/* [DIUBAH] memakai visibleItems (data halaman aktif) */}
          {pagination.visibleItems.map((item, index) => (
            <tr key={item.id || index}>
              <td>{new Date(item.waktu_masuk).toLocaleTimeString('id-ID')} WIB</td>
              {/* [BARU] tanda minus bila belum scan pulang */}
              <td>{item.waktu_pulang ? `${new Date(item.waktu_pulang).toLocaleTimeString('id-ID')} WIB` : '-'}</td>
              <td>{item.nis}</td>
              <td>{item.nama}</td>
              <td>{item.kelas}</td>
              <td className={`status ${item.status === 'Terlambat' ? 'status--terlambat' : 'status--tepat'}`}>
                {item.status}
              </td>
            </tr>
          ))}
          {presensiList.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center">Belum ada yang presensi hari ini.</td>
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
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  );
};

export default ScanPresensi;
