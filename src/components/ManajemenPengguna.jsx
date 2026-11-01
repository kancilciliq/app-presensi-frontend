/* [BARU] Manajemen Pengguna (khusus admin): tambah, ubah peran/kelas, aktif/nonaktif, reset password, hapus */
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/useAuth';
import { NAMA_PERAN } from '../auth/akses';
import { useToast } from '../toast/useToast';

const API_URL = import.meta.env.VITE_API_URL;
const KOSONG = { username: '', nama: '', role: 'guru', kelas: '', password: '' };
const pesanError = (err, cadangan) => err.response?.data?.message || cadangan;

export default function ManajemenPengguna() {
  const { user: saya } = useAuth();
  const toast = useToast();
  const [daftar, setDaftar] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [form, setForm] = useState(null);        // null = modal tertutup; {id?} = edit; tanpa id = tambah
  const [resetFor, setResetFor] = useState(null); // pengguna yang password-nya direset
  const [pwBaru, setPwBaru] = useState('');

  const muat = useCallback(async () => {
    try {
      const [u, k] = await Promise.all([axios.get(`${API_URL}/pengguna`), axios.get(`${API_URL}/pengguna/kelas`)]);
      setDaftar(u.data);
      setKelasList(k.data);
    } catch (err) {
      toast.gagal('Gagal memuat data', pesanError(err, 'Gagal memuat data pengguna'));
    }
  }, [toast]);

  useEffect(() => { muat(); }, [muat]);

  const ubahForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const simpan = async (e) => {
    e.preventDefault();
    const edit = !!form.id;
    try {
      if (form.id) {
        await axios.put(`${API_URL}/pengguna/${form.id}`, { nama: form.nama, role: form.role, kelas: form.kelas, aktif: form.aktif });
      } else {
        await axios.post(`${API_URL}/pengguna`, form);
      }
      setForm(null);
      toast.sukses(edit ? 'Berhasil diperbarui' : 'Berhasil ditambahkan', edit ? 'Data pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.');
      muat();
    } catch (err) {
      toast.gagal(edit ? 'Gagal memperbarui' : 'Gagal menambahkan', pesanError(err, 'Gagal menyimpan pengguna'));
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/pengguna/${resetFor.id}/password`, { password: pwBaru });
      setResetFor(null);
      setPwBaru('');
      toast.sukses('Password direset', 'Sampaikan password baru kepada pengguna.');
    } catch (err) {
      toast.gagal('Gagal mereset password', pesanError(err, 'Gagal mereset password'));
    }
  };

  const hapus = async (u) => {
    if (!window.confirm(`Hapus pengguna "${u.nama}" (${u.username})?`)) return;
    try {
      await axios.delete(`${API_URL}/pengguna/${u.id}`);
      toast.sukses('Berhasil dihapus', `Pengguna "${u.nama}" dihapus.`);
      muat();
    } catch (err) {
      toast.gagal('Gagal menghapus', pesanError(err, 'Gagal menghapus pengguna'));
    }
  };

  const bukaTambah = () => { setForm({ ...KOSONG }); };
  const bukaEdit = (u) => { setForm({ id: u.id, username: u.username, nama: u.nama, role: u.role, kelas: u.kelas || '', aktif: !!u.aktif }); };

  return (
    <div className="page">
      <div className="toolbar">
        <h2 className="toolbar__title">Manajemen Pengguna</h2>
        <div className="toolbar__right">
          <button type="button" className="btn btn--primary" onClick={bukaTambah}>+ Tambah Pengguna</button>
        </div>
      </div>

      <div className="table-wrap"><table className="table">
        <thead>
          <tr><th>No</th><th>Username</th><th>Nama</th><th>Peran</th><th>Kelas</th><th>Status</th><th>Login Terakhir</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {daftar.map((u, i) => (
            <tr key={u.id}>
              <td className="text-center">{i + 1}</td>
              <td>{u.username}</td>
              <td>{u.nama}</td>
              <td className="text-center"><span className={`badge badge--${u.role}`}>{NAMA_PERAN[u.role]}</span></td>
              <td className="text-center">{u.kelas || '-'}</td>
              <td className="text-center">{u.aktif ? 'Aktif' : <span className="badge badge--off">Nonaktif</span>}</td>
              <td className="text-center">{u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : '-'}</td>
              <td className="text-center">
                <div className="aksi">
                  <button type="button" className="btn btn--sm btn--warning" onClick={() => bukaEdit(u)}>Edit</button>
                  <button type="button" className="btn btn--sm btn--primary" onClick={() => { setResetFor(u); setPwBaru(''); }}>Reset Password</button>
                  {u.id !== saya.id && <button type="button" className="btn btn--sm btn--danger" onClick={() => hapus(u)}>Hapus</button>}
                </div>
              </td>
            </tr>
          ))}
          {daftar.length === 0 && <tr><td colSpan="8" className="text-center">Belum ada pengguna.</td></tr>}
        </tbody>
      </table></div>

      {form && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{form.id ? 'Edit Pengguna' : 'Tambah Pengguna'}</h3>
            <form className="form" onSubmit={simpan}>
              <label className="form__label">Username
                <input className="form__input" name="username" value={form.username} onChange={ubahForm}
                  disabled={!!form.id} autoCapitalize="none" required />
                {!form.id && <span className="form__hint">Huruf kecil, angka, titik, strip, atau garis bawah (3-30 karakter).</span>}
              </label>
              <label className="form__label">Nama lengkap
                <input className="form__input" name="nama" value={form.nama} onChange={ubahForm} required />
              </label>
              <label className="form__label">Peran
                <select className="form__input" name="role" value={form.role} onChange={ubahForm}>
                  <option value="admin">Admin</option>
                  <option value="wali_kelas">Wali Kelas</option>
                  <option value="guru">Guru</option>
                </select>
              </label>
              {form.role === 'wali_kelas' && (
                <label className="form__label">Kelas yang diampu
                  <select className="form__input" name="kelas" value={form.kelas} onChange={ubahForm} required>
                    <option value="">-- pilih kelas --</option>
                    {kelasList.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
              )}
              {!form.id && (
                <label className="form__label">Password awal
                  <input className="form__input" type="password" name="password" value={form.password} onChange={ubahForm}
                    autoComplete="new-password" minLength={8} required />
                  <span className="form__hint">Minimal 8 karakter. Pengguna dapat menggantinya sendiri setelah login.</span>
                </label>
              )}
              {form.id && (
                <label className="form__label">
                  <input type="checkbox" checked={!!form.aktif} onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.checked }))} />{' '}
                  Akun aktif
                </label>
              )}
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>Batal</button>
                <button type="submit" className="btn btn--primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reset Password</h3>
            <p>Pengguna: <strong>{resetFor.nama}</strong> ({resetFor.username})</p>
            <form className="form" onSubmit={resetPassword}>
              <label className="form__label">Password baru
                <input className="form__input" type="password" value={pwBaru} onChange={(e) => setPwBaru(e.target.value)}
                  autoComplete="new-password" minLength={8} required />
              </label>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setResetFor(null)}>Batal</button>
                <button type="submit" className="btn btn--primary">Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
