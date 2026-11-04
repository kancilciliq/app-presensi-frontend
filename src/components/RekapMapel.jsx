/* [BARU] Rekap presensi per mata pelajaran: admin (semua kelas) & wali kelas (kelasnya sendiri) */
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../toast/useToast';
import { NAMA_SEKOLAH, namaFile, susunRingkasan, susunSesi, tglID } from '../lib/rekapMapel';
import { NAMA_BULAN, labelBulan, unduhRekapBulanan } from '../lib/rekapBulanan';
import RekapBulanan from './RekapBulanan';

const BATAS_SESI = 1000; // sama dengan LIMIT di backend

const API_URL = import.meta.env.VITE_API_URL;
const dua = (n) => String(n).padStart(2, '0');
const tgl = (d) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
const persen = (h, total) => (total ? `${Math.round((h / total) * 100)}%` : '-');

export default function RekapMapel() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const awal = useMemo(() => { const d = new Date(); return tgl(new Date(d.getFullYear(), d.getMonth(), 1)); }, []);
  const akhir = useMemo(() => tgl(new Date()), []);

  const [filter, setFilter] = useState({ mulai: awal, akhir, kelas: 'Semua', mapel_id: '' });
  const [tab, setTab] = useState('siswa');
  const [ringkas, setRingkas] = useState([]);
  const [sesi, setSesi] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- Tab Rekap Bulanan (filternya terpisah: bulan, tahun, kelas) ----
  const sekarang = useMemo(() => new Date(), []);
  const [fb, setFb] = useState({ bln: sekarang.getMonth() + 1, thn: sekarang.getFullYear(), kelas: 'Semua' });
  const [bulanan, setBulanan] = useState(null);
  const [loadingBulanan, setLoadingBulanan] = useState(false);
  const daftarTahun = useMemo(() => Array.from({ length: 4 }, (_, i) => sekarang.getFullYear() - i), [sekarang]);
  const kodeBulan = `${fb.thn}-${dua(fb.bln)}`;

  useEffect(() => {
    axios.get(`${API_URL}/mapel/daftar`).then((r) => setMapelList(r.data)).catch(() => {});
    if (isAdmin) axios.get(`${API_URL}/pengguna/kelas`).then((r) => setKelasList(r.data)).catch(() => {});
  }, [isAdmin]);

  const muat = useCallback(async () => {
    setLoading(true); setError('');
    const params = { mulai: filter.mulai, akhir: filter.akhir, mapel_id: filter.mapel_id || undefined, kelas: isAdmin ? filter.kelas : undefined };
    try {
      const [a, b] = await Promise.all([axios.get(`${API_URL}/mapel/rekap`, { params }), axios.get(`${API_URL}/mapel/rekap/sesi`, { params })]);
      setRingkas(a.data); setSesi(b.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat rekap');
    } finally {
      setLoading(false);
    }
  }, [filter, isAdmin]);

  useEffect(() => { muat(); }, [muat]);

  const muatBulanan = useCallback(async () => {
    setLoadingBulanan(true);
    try {
      const res = await axios.get(`${API_URL}/mapel/rekap/bulanan`, { params: { bulan: kodeBulan, kelas: isAdmin ? fb.kelas : undefined } });
      setBulanan(res.data);
    } catch (err) {
      setBulanan(null);
      toast.gagal('Gagal memuat rekap bulanan', err.response?.data?.message || 'Terjadi kesalahan pada server.');
    } finally {
      setLoadingBulanan(false);
    }
  }, [kodeBulan, fb.kelas, isAdmin, toast]);

  useEffect(() => { if (tab === 'bulanan') muatBulanan(); }, [tab, muatBulanan]);

  // Keterangan filter (dipakai di judul Excel dan kop cetak)
  const meta = useMemo(() => ({
    mulai: filter.mulai,
    akhir: filter.akhir,
    kelas: isAdmin ? (filter.kelas === 'Semua' ? 'Semua kelas' : filter.kelas) : (user?.kelas || '-'),
    mapel: mapelList.find((m) => String(m.id) === String(filter.mapel_id))?.nama || 'Semua mata pelajaran'
  }), [filter, isAdmin, user, mapelList]);

  const unduhExcel = () => {
    if (tab === 'bulanan') {
      unduhRekapBulanan(bulanan, { label: labelBulan(fb.bln, fb.thn), bulan: kodeBulan });
      toast.sukses('Berhasil diunduh', `Rekap bulanan ${labelBulan(fb.bln, fb.thn)} diunduh sebagai Excel.`);
      return;
    }
    const wb = XLSX.utils.book_new();

    const a = susunRingkasan(ringkas, meta);
    const ws1 = XLSX.utils.aoa_to_sheet(a.aoa);
    ws1['!merges'] = a.merges;
    ws1['!cols'] = a.cols;
    for (let baris = a.dataAwal; baris <= a.dataAkhir; baris += 1) {
      const sel = ws1[XLSX.utils.encode_cell({ r: baris, c: a.kolomPersen })];
      if (sel && typeof sel.v === 'number') sel.z = '0%';
    }
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan per Siswa');

    const b = susunSesi(sesi, meta);
    const ws2 = XLSX.utils.aoa_to_sheet(b.aoa);
    ws2['!merges'] = b.merges;
    ws2['!cols'] = b.cols;
    XLSX.utils.book_append_sheet(wb, ws2, 'Rincian per Pertemuan');

    XLSX.writeFile(wb, namaFile(meta));
  };

  const cetak = () => window.print();
  const adaData = tab === 'bulanan' ? (bulanan?.siswa.length > 0 && bulanan?.hari.length > 0) : (ringkas.length > 0 || sesi.length > 0);
  const sedangMemuat = tab === 'bulanan' ? loadingBulanan : loading;
  const kelasBulanan = isAdmin ? (fb.kelas === 'Semua' ? 'Semua kelas' : fb.kelas) : (user?.kelas || '-');

  const ubah = (e) => setFilter((f) => ({ ...f, [e.target.name]: e.target.value }));

  const hapusSesi = async (s) => {
    if (!window.confirm(`Hapus presensi ${s.mapel} kelas ${s.kelas} jam ke-${s.jam} tanggal ${s.tanggal}?`)) return;
    try {
      await axios.delete(`${API_URL}/mapel/rekap/sesi`, { params: { tanggal: s.tanggal, jam: s.jam, kelas: s.kelas, mapel_id: s.mapel_id, guru_id: s.guru_id } });
      toast.sukses('Berhasil dihapus', `Presensi ${s.mapel} kelas ${s.kelas} jam ke-${s.jam} dihapus.`);
      muat();
    } catch (err) {
      toast.gagal('Gagal menghapus', err.response?.data?.message || 'Gagal menghapus sesi');
    }
  };

  return (
    <div className={`page ${tab === 'bulanan' ? 'rekap-bulanan-print' : ''}`}>
      {/* Kop khusus cetak (tidak tampil di layar) */}
      {tab === 'bulanan' && (
        <div className="print-only">
          <h2>REKAP PRESENSI BULANAN</h2>
          <div>{NAMA_SEKOLAH}</div>
          <div>Bulan: {labelBulan(fb.bln, fb.thn)} | Kelas: {kelasBulanan}</div>
          <div>Hari efektif: {bulanan?.hari.length ?? 0} hari - dicetak {new Date().toLocaleString('id-ID')}</div>
        </div>
      )}
      {tab !== 'bulanan' && (
        <div className="print-only">
          <h2>REKAP PRESENSI MATA PELAJARAN</h2>
          <div>{NAMA_SEKOLAH}</div>
          <div>Periode: {tglID(meta.mulai)} s.d. {tglID(meta.akhir)} | Kelas: {meta.kelas} | Mata pelajaran: {meta.mapel}</div>
          <div>{tab === 'siswa' ? 'Ringkasan per Siswa' : 'Rincian per Pertemuan'} - dicetak {new Date().toLocaleString('id-ID')}</div>
        </div>
      )}

      <div className="toolbar no-print">
        <h2 className="toolbar__title">Rekap Presensi Mata Pelajaran{!isAdmin && user?.kelas ? ` - Kelas ${user.kelas}` : ''}</h2>
        <div className="toolbar__right">
          <button type="button" className="btn btn--primary" onClick={unduhExcel} disabled={!adaData || sedangMemuat}>Unduh Excel</button>{' '}
          <button type="button" className="btn btn--ghost" onClick={cetak} disabled={!adaData || sedangMemuat}>Cetak</button>
        </div>
      </div>

      {tab === 'bulanan' && (
        <div className="sesi-filter no-print">
          <label className="form__label">Bulan
            <select className="form__input" value={fb.bln} onChange={(e) => setFb((f) => ({ ...f, bln: Number(e.target.value) }))}>
              {NAMA_BULAN.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
            </select>
          </label>
          <label className="form__label">Tahun
            <select className="form__input" value={fb.thn} onChange={(e) => setFb((f) => ({ ...f, thn: Number(e.target.value) }))}>
              {daftarTahun.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          {isAdmin && (
            <label className="form__label">Kelas
              <select className="form__input" value={fb.kelas} onChange={(e) => setFb((f) => ({ ...f, kelas: e.target.value }))}>
                <option value="Semua">Semua</option>
                {kelasList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      {tab !== 'bulanan' && <div className="sesi-filter no-print">
        <label className="form__label">Dari<input type="date" className="form__input" name="mulai" value={filter.mulai} max={filter.akhir} onChange={ubah} /></label>
        <label className="form__label">Sampai<input type="date" className="form__input" name="akhir" value={filter.akhir} min={filter.mulai} onChange={ubah} /></label>
        {isAdmin && (
          <label className="form__label">Kelas
            <select className="form__input" name="kelas" value={filter.kelas} onChange={ubah}>
              <option value="Semua">Semua</option>
              {kelasList.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
        )}
        <label className="form__label">Mata pelajaran
          <select className="form__input" name="mapel_id" value={filter.mapel_id} onChange={ubah}>
            <option value="">Semua</option>
            {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
        </label>
      </div>}

      {error && <div className="form__error no-print" role="alert">{error}</div>}
      {loading && tab !== 'bulanan' && <p className="no-print">Memuat...</p>}
      {tab !== 'bulanan' && sesi.length >= BATAS_SESI && (
        <div className="form__warn no-print">Hanya {BATAS_SESI} pertemuan terbaru yang ditampilkan dan diekspor. Persempit rentang tanggal atau pilih kelas/mapel tertentu.</div>
      )}

      <div className="tab-bar no-print">
        <button type="button" className={tab === 'siswa' ? 'is-aktif' : ''} onClick={() => setTab('siswa')}>Ringkasan per Siswa</button>
        <button type="button" className={tab === 'sesi' ? 'is-aktif' : ''} onClick={() => setTab('sesi')}>Rincian per Pertemuan</button>
        <button type="button" className={tab === 'bulanan' ? 'is-aktif' : ''} onClick={() => setTab('bulanan')}>Rekap Bulanan</button>
      </div>

      {tab === 'bulanan' && <RekapBulanan data={bulanan} loading={loadingBulanan} />}

      {tab === 'siswa' && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>No</th><th className="col-kiri">NISN</th><th className="col-kiri">Nama</th><th>Kelas</th><th>H</th><th>I</th><th>S</th><th>A</th><th>Total Jam</th><th>% Hadir</th></tr></thead>
          <tbody>
            {ringkas.map((r, i) => (
              <tr key={r.nis}>
                <td className="text-center">{i + 1}</td><td className="col-kiri">{r.nis}</td><td className="col-kiri">{r.nama}</td><td className="text-center">{r.kelas}</td>
                <td className="text-center">{r.h}</td><td className="text-center">{r.i}</td><td className="text-center">{r.s}</td><td className="text-center">{r.a}</td>
                <td className="text-center">{r.total}</td><td className="text-center">{persen(r.h, r.total)}</td>
              </tr>
            ))}
            {ringkas.length === 0 && !loading && <tr><td colSpan="10" className="text-center">Tidak ada data.</td></tr>}
          </tbody>
        </table></div>
      )}

      {tab === 'sesi' && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Tanggal</th><th>Jam</th><th>Kelas</th><th>Mata Pelajaran</th><th>Guru</th><th>H</th><th>I</th><th>S</th><th>A</th>{isAdmin && <th>Aksi</th>}</tr></thead>
          <tbody>
            {sesi.map((s) => (
              <tr key={`${s.tanggal}-${s.jam}-${s.kelas}-${s.mapel_id}-${s.guru_id}`}>
                <td className="text-center">{s.tanggal}</td><td className="text-center">{s.jam}</td><td className="text-center">{s.kelas}</td>
                <td>{s.mapel || '-'}</td><td>{s.guru || '-'}</td>
                <td className="text-center">{s.h}</td><td className="text-center">{s.i}</td><td className="text-center">{s.s}</td><td className="text-center">{s.a}</td>
                {isAdmin && <td className="text-center"><button type="button" className="btn btn--sm btn--danger" onClick={() => hapusSesi(s)}>Hapus</button></td>}
              </tr>
            ))}
            {sesi.length === 0 && !loading && <tr><td colSpan={isAdmin ? 10 : 9} className="text-center">Tidak ada data.</td></tr>}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
