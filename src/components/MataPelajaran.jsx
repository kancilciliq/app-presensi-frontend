/* [BARU] Daftar mata pelajaran & kelas yang diajar oleh guru yang sedang login */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function MataPelajaran() {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/mapel/saya`)
      .then((res) => setDaftar(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat mata pelajaran'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Mata Pelajaran Saya</h2>
        <p>Pilih kelas untuk mengisi presensi (H/I/S/A) per jam pelajaran.</p>
      </div>

      {error && <div className="form__error" role="alert">{error}</div>}
      {loading && <p>Memuat...</p>}
      {!loading && !error && daftar.length === 0 && (
        <div className="form__warn">Belum ada mata pelajaran yang ditugaskan kepada Anda. Hubungi admin untuk mengatur penugasan mengajar.</div>
      )}

      <div className="mapel-grid">
        {daftar.map((m) => (
          <div className="mapel-card" key={m.mapel_id}>
            <h3>{m.mapel}</h3>
            <div className="mapel-kelas">
              {m.kelas.map((k) => (
                <Link key={k.mengajar_id} to={`/mapel/${k.mengajar_id}`} className="btn btn--primary">
                  {k.kelas} <small>({k.jumlah_siswa} siswa)</small>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
