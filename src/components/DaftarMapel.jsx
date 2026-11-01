/* [BARU] Admin: Daftar Mata Pelajaran (tambah, edit, hapus). Dipisah dari KelolaMapel. */
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../toast/useToast';

const API_URL = import.meta.env.VITE_API_URL;
const pesanError = (err, cadangan) => err.response?.data?.message || cadangan;

export default function DaftarMapel() {
  const toast = useToast();
  const [mapel, setMapel] = useState([]);
  const [namaBaru, setNamaBaru] = useState('');
  const [edit, setEdit] = useState(null); // { id, nama, aktif }

  const muat = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/mapel/master`);
      setMapel(res.data);
    } catch (err) {
      toast.gagal('Gagal memuat data', pesanError(err, 'Daftar mata pelajaran tidak dapat dimuat.'));
    }
  }, [toast]);

  useEffect(() => { muat(); }, [muat]);

  const jalankan = async (fn, judulOk, teksOk, judulGagal) => {
    try {
      await fn();
      toast.sukses(judulOk, teksOk);
      await muat();
    } catch (err) {
      toast.gagal(judulGagal, pesanError(err, 'Terjadi kesalahan.'));
    }
  };

  const tambahMapel = (e) => {
    e.preventDefault();
    jalankan(
      async () => { await axios.post(`${API_URL}/mapel/master`, { nama: namaBaru }); setNamaBaru(''); },
      'Berhasil ditambahkan', `Mata pelajaran "${namaBaru}" ditambahkan.`, 'Gagal menambahkan'
    );
  };
  const simpanEdit = (e) => {
    e.preventDefault();
    jalankan(
      async () => { await axios.put(`${API_URL}/mapel/master/${edit.id}`, { nama: edit.nama, aktif: edit.aktif }); setEdit(null); },
      'Berhasil diperbarui', 'Mata pelajaran berhasil diperbarui.', 'Gagal memperbarui'
    );
  };
  const hapusMapel = (m) => {
    if (!window.confirm(`Hapus mata pelajaran "${m.nama}"?`)) return;
    jalankan(
      () => axios.delete(`${API_URL}/mapel/master/${m.id}`),
      'Berhasil dihapus', `Mata pelajaran "${m.nama}" dihapus.`, 'Gagal menghapus'
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Daftar Mata Pelajaran</h2>
        <p>Kelola mata pelajaran yang tersedia untuk penugasan guru.</p>
      </div>

      <form className="card sesi-filter" onSubmit={tambahMapel}>
        <label className="form__label">Nama mata pelajaran baru
          <input className="form__input" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} maxLength={100} required />
        </label>
        <button type="submit" className="btn btn--primary">+ Tambah</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>No</th><th>Mata Pelajaran</th><th className="text-center">Status</th><th className="text-center">Dipakai</th><th className="text-center">Aksi</th></tr></thead>
          <tbody>
            {mapel.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td>{m.nama}</td>
                <td className="text-center">{m.aktif ? 'Aktif' : <span className="badge badge--off">Nonaktif</span>}</td>
                <td className="text-center">{m.jumlah_penugasan} penugasan, {m.jumlah_presensi} data</td>
                <td className="text-center">
                  <div className="aksi">
                    <button type="button" className="btn btn--sm btn--warning" onClick={() => setEdit({ id: m.id, nama: m.nama, aktif: !!m.aktif })}>Edit</button>
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => hapusMapel(m)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {mapel.length === 0 && <tr><td colSpan="5" className="text-center">Belum ada mata pelajaran.</td></tr>}
          </tbody>
        </table>
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
