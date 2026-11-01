/* [BARU] Admin: kelola mata pelajaran dan penugasan guru (guru - mapel - kelas) */
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import '../auth/auth.css';
import './mapel.css';

const API_URL = import.meta.env.VITE_API_URL;
const pesanError = (err, cadangan) => err.response?.data?.message || cadangan;

export default function KelolaMapel() {
  const [mapel, setMapel] = useState([]);
  const [tugas, setTugas] = useState([]);
  const [guru, setGuru] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [namaBaru, setNamaBaru] = useState('');
  const [edit, setEdit] = useState(null); // { id, nama, aktif }
  const [form, setForm] = useState({ guru_id: '', mapel_id: '', kelas: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const muat = useCallback(async () => {
    try {
      const [m, t, u, k] = await Promise.all([
        axios.get(`${API_URL}/mapel/master`), axios.get(`${API_URL}/mapel/penugasan`),
        axios.get(`${API_URL}/pengguna`), axios.get(`${API_URL}/pengguna/kelas`)
      ]);
      setMapel(m.data);
      setTugas(t.data);
      setGuru(u.data.filter((x) => x.aktif && ['guru', 'wali_kelas'].includes(x.role)));
      setKelasList(k.data);
    } catch (err) {
      setError(pesanError(err, 'Gagal memuat data'));
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const aksi = async (fn, sukses) => {
    setError(''); setInfo('');
    try { await fn(); setInfo(sukses); await muat(); } catch (err) { setError(pesanError(err, 'Terjadi kesalahan')); }
  };

  const tambahMapel = (e) => {
    e.preventDefault();
    aksi(async () => { await axios.post(`${API_URL}/mapel/master`, { nama: namaBaru }); setNamaBaru(''); }, 'Mata pelajaran ditambahkan');
  };
  const simpanEdit = (e) => {
    e.preventDefault();
    aksi(async () => { await axios.put(`${API_URL}/mapel/master/${edit.id}`, { nama: edit.nama, aktif: edit.aktif }); setEdit(null); }, 'Mata pelajaran diperbarui');
  };
  const hapusMapel = (m) => {
    if (!window.confirm(`Hapus mata pelajaran "${m.nama}"?`)) return;
    aksi(() => axios.delete(`${API_URL}/mapel/master/${m.id}`), 'Mata pelajaran dihapus');
  };
  const tambahTugas = (e) => {
    e.preventDefault();
    aksi(async () => { await axios.post(`${API_URL}/mapel/penugasan`, form); setForm((f) => ({ ...f, kelas: '' })); }, 'Penugasan ditambahkan');
  };
  const hapusTugas = (t) => {
    if (!window.confirm(`Hapus penugasan ${t.guru} - ${t.mapel} kelas ${t.kelas}? Riwayat presensi tetap tersimpan.`)) return;
    aksi(() => axios.delete(`${API_URL}/mapel/penugasan/${t.id}`), 'Penugasan dihapus');
  };

  return (
    <div className="page">
      <div className="toolbar"><h2 className="toolbar__title">Kelola Mata Pelajaran</h2></div>
      {error && <div className="form__error" role="alert">{error}</div>}
      {info && <div className="form__ok">{info}</div>}

      <div className="dua-kolom">
        <section>
          <h3>Daftar Mata Pelajaran</h3>
          <form className="sesi-filter" onSubmit={tambahMapel}>
            <label className="form__label">Nama mata pelajaran baru
              <input className="form__input" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} maxLength={100} required />
            </label>
            <button type="submit" className="btn btn--primary">Tambah</button>
          </form>
          <table className="table">
            <thead><tr><th>Mata Pelajaran</th><th>Status</th><th>Dipakai</th><th>Aksi</th></tr></thead>
            <tbody>
              {mapel.map((m) => (
                <tr key={m.id}>
                  <td>{m.nama}</td>
                  <td className="text-center">{m.aktif ? 'Aktif' : <span className="badge badge--off">Nonaktif</span>}</td>
                  <td className="text-center">{m.jumlah_penugasan} penugasan, {m.jumlah_presensi} data</td>
                  <td className="text-center">
                    <button type="button" className="btn btn--sm btn--warning" onClick={() => setEdit({ id: m.id, nama: m.nama, aktif: !!m.aktif })}>Edit</button>{' '}
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => hapusMapel(m)}>Hapus</button>
                  </td>
                </tr>
              ))}
              {mapel.length === 0 && <tr><td colSpan="4" className="text-center">Belum ada mata pelajaran.</td></tr>}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Penugasan Mengajar</h3>
          <form className="sesi-filter" onSubmit={tambahTugas}>
            <label className="form__label">Guru
              <select className="form__input" value={form.guru_id} onChange={(e) => setForm({ ...form, guru_id: e.target.value })} required>
                <option value="">-- pilih --</option>
                {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}{g.role === 'wali_kelas' ? ` (Wali ${g.kelas})` : ''}</option>)}
              </select>
            </label>
            <label className="form__label">Mata pelajaran
              <select className="form__input" value={form.mapel_id} onChange={(e) => setForm({ ...form, mapel_id: e.target.value })} required>
                <option value="">-- pilih --</option>
                {mapel.filter((m) => m.aktif).map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
            </label>
            <label className="form__label">Kelas
              <select className="form__input" value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} required>
                <option value="">-- pilih --</option>
                {kelasList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <button type="submit" className="btn btn--primary">Tugaskan</button>
          </form>
          <table className="table">
            <thead><tr><th>Guru</th><th>Mata Pelajaran</th><th>Kelas</th><th>Aksi</th></tr></thead>
            <tbody>
              {tugas.map((t) => (
                <tr key={t.id}>
                  <td>{t.guru}</td><td>{t.mapel}</td><td className="text-center">{t.kelas}</td>
                  <td className="text-center"><button type="button" className="btn btn--sm btn--danger" onClick={() => hapusTugas(t)}>Hapus</button></td>
                </tr>
              ))}
              {tugas.length === 0 && <tr><td colSpan="4" className="text-center">Belum ada penugasan.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      {edit && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Mata Pelajaran</h3>
            <form className="form" onSubmit={simpanEdit}>
              <label className="form__label">Nama
                <input className="form__input" value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} maxLength={100} required />
              </label>
              <label className="form__label">
                <input type="checkbox" checked={edit.aktif} onChange={(e) => setEdit({ ...edit, aktif: e.target.checked })} /> Aktif
              </label>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setEdit(null)}>Batal</button>
                <button type="submit" className="btn btn--primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
