/* =====================================================================
   [BARU] PengaturanJam.jsx  -  menu untuk mengatur jam masuk & pulang
   Data disimpan di database lewat:
     GET /api/presensi/pengaturan   (ambil)
     PUT /api/presensi/pengaturan   (simpan)
   Jadi jam bisa diubah kapan saja tanpa menyentuh file .env / restart server.
   ===================================================================== */
import { useState, useEffect } from 'react';
import axios from 'axios';
import './PengaturanJam.css';

const API_URL = import.meta.env.VITE_API_URL;

const PengaturanJam = () => {
  const [form, setForm] = useState({
    jam_masuk_mulai: '',
    jam_masuk_batas: '',
    jam_pulang_mulai: '',
  });
  const [zona, setZona] = useState('WIB');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState(null); // { type: 'success' | 'error', text }

  // Ambil pengaturan saat halaman dibuka
  useEffect(() => {
    axios.get(`${API_URL}/presensi/pengaturan`)
      .then((res) => {
        const { jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai, zona_waktu } = res.data;
        setForm({ jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai });
        setZona(zona_waktu || 'WIB');
      })
      .catch(() => setNotif({ type: 'error', text: 'Gagal memuat pengaturan dari server.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setNotif(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi di sisi layar (format "HH:MM" bisa dibandingkan sebagai teks)
    if (form.jam_masuk_mulai >= form.jam_masuk_batas) {
      return setNotif({ type: 'error', text: 'Jam masuk dibuka harus lebih awal dari batas tepat waktu.' });
    }
    if (form.jam_masuk_batas >= form.jam_pulang_mulai) {
      return setNotif({ type: 'error', text: 'Jam pulang harus lebih akhir dari batas tepat waktu.' });
    }

    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/presensi/pengaturan`, form);
      setNotif({ type: 'success', text: res.data.message || 'Pengaturan berhasil disimpan.' });
    } catch (err) {
      setNotif({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  const siap = form.jam_masuk_mulai && form.jam_masuk_batas && form.jam_pulang_mulai;

  return (
    <div className="page">
      <h2>Pengaturan Jam Presensi</h2>
      <p className="setting-intro">
        Semua jam memakai zona waktu <strong>{zona}</strong>. Perubahan langsung berlaku untuk scan berikutnya.
      </p>

      {loading ? (
        <p>Memuat pengaturan...</p>
      ) : (
        <form onSubmit={handleSubmit} className="form setting-form">
          <div>
            <label className="form__label" htmlFor="jam_masuk_mulai">Scan masuk mulai dibuka</label>
            <input
              id="jam_masuk_mulai"
              name="jam_masuk_mulai"
              type="time"
              className="form__input"
              value={form.jam_masuk_mulai}
              onChange={handleChange}
              required
            />
            <small className="setting-help">Sebelum jam ini, scan ditolak ("Presensi Belum Dibuka").</small>
          </div>

          <div>
            <label className="form__label" htmlFor="jam_masuk_batas">Batas tepat waktu</label>
            <input
              id="jam_masuk_batas"
              name="jam_masuk_batas"
              type="time"
              className="form__input"
              value={form.jam_masuk_batas}
              onChange={handleChange}
              required
            />
            <small className="setting-help">Scan masuk setelah jam ini dicatat "Terlambat".</small>
          </div>

          <div>
            <label className="form__label" htmlFor="jam_pulang_mulai">Scan pulang mulai dibuka</label>
            <input
              id="jam_pulang_mulai"
              name="jam_pulang_mulai"
              type="time"
              className="form__input"
              value={form.jam_pulang_mulai}
              onChange={handleChange}
              required
            />
            <small className="setting-help">
              Mulai jam ini scan dihitung sebagai PULANG dan scan masuk ditutup.
            </small>
          </div>

          {/* Ringkasan alur supaya mudah dipahami */}
          {siap && (
            <div className="setting-summary">
              <strong>Alur scan per hari:</strong>
              <ul>
                <li>Sebelum {form.jam_masuk_mulai}: presensi belum dibuka</li>
                <li>{form.jam_masuk_mulai} – {form.jam_masuk_batas}: masuk <span className="status status--tepat">Tepat Waktu</span></li>
                <li>{form.jam_masuk_batas} – {form.jam_pulang_mulai}: masuk <span className="status status--terlambat">Terlambat</span></li>
                <li>Mulai {form.jam_pulang_mulai}: scan <strong>pulang</strong> (wajib sudah scan masuk)</li>
              </ul>
            </div>
          )}

          {notif && (
            <p className={`setting-alert setting-alert--${notif.type}`} role="alert">{notif.text}</p>
          )}

          <div className="modal__actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PengaturanJam;
