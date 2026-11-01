/* [BARU] Admin: Tugas Mengajar (penugasan guru - mapel - kelas). Dipisah dari KelolaMapel. */
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../toast/useToast';

const API_URL = import.meta.env.VITE_API_URL;
const pesanError = (err, cadangan) => err.response?.data?.message || cadangan;

export default function TugasMengajar() {
  const toast = useToast();
  const [mapel, setMapel] = useState([]);
  const [tugas, setTugas] = useState([]);
  const [guru, setGuru] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [form, setForm] = useState({ guru_id: '', mapel_id: '', kelas: '' });

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
      toast.gagal('Gagal memuat data', pesanError(err, 'Data tugas mengajar tidak dapat dimuat.'));
    }
  }, [toast]);

  useEffect(() => { muat(); }, [muat]);

  const tambahTugas = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/mapel/penugasan`, form);
      setForm((f) => ({ ...f, kelas: '' }));
      toast.sukses('Berhasil ditambahkan', 'Tugas mengajar berhasil ditambahkan.');
      await muat();
    } catch (err) {
      toast.gagal('Gagal menambahkan', pesanError(err, 'Terjadi kesalahan.'));
    }
  };

  const hapusTugas = async (t) => {
    if (!window.confirm(`Hapus penugasan ${t.guru} - ${t.mapel} kelas ${t.kelas}? Riwayat presensi tetap tersimpan.`)) return;
    try {
      await axios.delete(`${API_URL}/mapel/penugasan/${t.id}`);
      toast.sukses('Berhasil dihapus', `Penugasan ${t.guru} - ${t.mapel} dihapus.`);
      await muat();
    } catch (err) {
      toast.gagal('Gagal menghapus', pesanError(err, 'Terjadi kesalahan.'));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Tugas Mengajar</h2>
        <p>Tentukan guru, mata pelajaran, dan kelas yang diajar.</p>
      </div>

      <form className="card sesi-filter" onSubmit={tambahTugas}>
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
        <button type="submit" className="btn btn--primary">+ Tugaskan</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>No</th><th>Guru</th><th>Mata Pelajaran</th><th className="text-center">Kelas</th><th className="text-center">Aksi</th></tr></thead>
          <tbody>
            {tugas.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td>{t.guru}</td><td>{t.mapel}</td><td className="text-center">{t.kelas}</td>
                <td className="text-center"><button type="button" className="btn btn--sm btn--danger" onClick={() => hapusTugas(t)}>Hapus</button></td>
              </tr>
            ))}
            {tugas.length === 0 && <tr><td colSpan="5" className="text-center">Belum ada penugasan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
