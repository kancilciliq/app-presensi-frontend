/* Form presensi H/I/S/A satu kelas untuk satu mata pelajaran, jam pelajaran 1-4 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../toast/useToast';

const API_URL = import.meta.env.VITE_API_URL;
const JAM = [1, 2, 3, 4];
const OPSI = [['H', 'Hadir'], ['I', 'Izin'], ['S', 'Sakit'], ['A', 'Alpa']];
const dua = (n) => String(n).padStart(2, '0');
const tglLokal = (d) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
const MAX_MUNDUR = 7; // harus sama dengan batas di backend (PRESENSI_MAPEL_MAX_HARI_MUNDUR)

export default function PresensiMapel() {
  const { id } = useParams();
  const hariIni = useMemo(() => tglLokal(new Date()), []);
  const batasAwal = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - MAX_MUNDUR); return tglLokal(d); }, []);

  const [tanggal, setTanggal] = useState(hariIni);
  const [jam, setJam] = useState(1);           // hanya satu jam terpilih
  const [info, setInfo] = useState(null);      // { penugasan, siswa, bentrok }
  const [status, setStatus] = useState({});    // { nis: 'H' | 'I' | 'S' | 'A' }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState(null);    // error saat memuat data (inline)
  const toast = useToast();

  const muat = useCallback(async () => {
    setLoading(true);
    setPesan(null);
    try {
      const res = await axios.get(`${API_URL}/mapel/sesi/${id}`, { params: { tanggal, jam } });
      setInfo(res.data);
      const awal = {};
      res.data.siswa.forEach((s) => {
        // Sudah tersimpan -> pakai itu. Belum: siswa yang scan masuk pagi ini diberi H sebagai usulan.
        awal[s.nis] = s.status || (tanggal === hariIni && s.hadir_pagi ? 'H' : '');
      });
      setStatus(awal);
    } catch (err) {
      setInfo(null);
      setPesan({ ok: false, text: err.response?.data?.message || 'Gagal memuat data kelas' });
    } finally {
      setLoading(false);
    }
  }, [id, tanggal, jam, hariIni]);

  useEffect(() => { muat(); }, [muat]);

  const pilih = (nis, nilai) => setStatus((s) => ({ ...s, [nis]: nilai }));
  const semuaHadir = () => setStatus(Object.fromEntries((info?.siswa || []).map((s) => [s.nis, 'H'])));

  const hitung = useMemo(() => {
    const h = { H: 0, I: 0, S: 0, A: 0, kosong: 0 };
    (info?.siswa || []).forEach((s) => { const v = status[s.nis]; if (v) h[v] += 1; else h.kosong += 1; });
    return h;
  }, [info, status]);

  const simpan = async () => {
    if (hitung.kosong > 0) {
      const belum = info.siswa.filter((s) => !status[s.nis]).map((s) => s.nama);
      const contoh = belum.slice(0, 3).join(', ') + (belum.length > 3 ? `, dan ${belum.length - 3} lainnya` : '');
      toast.gagal('Presensi belum lengkap', `${hitung.kosong} siswa belum diberi status: ${contoh}.`);
      // Scroll ke baris pertama yang kosong
      document.querySelector('.baris-kosong')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      const data = info.siswa.map((s) => ({ nis: s.nis, status: status[s.nis] }));
      const res = await axios.post(`${API_URL}/mapel/sesi/${id}`, { tanggal, jam: [jam], data });
      toast.sukses('Berhasil disimpan', res.data.message || `Presensi jam ke-${jam} berhasil disimpan.`);
    } catch (err) {
      const text = err.response?.data?.message
        || (err.request ? 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' : 'Gagal menyimpan presensi.');
      toast.gagal('Gagal menyimpan', text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="toolbar">
        <h2 className="toolbar__title">
          Presensi {info ? `${info.penugasan.mapel} - Kelas ${info.penugasan.kelas}` : 'Mata Pelajaran'}
        </h2>
        <div className="toolbar__right"><Link to="/mapel" className="btn btn--ghost">&larr; Kembali</Link></div>
      </div>

      <div className="sesi-filter">
        <label className="form__label">Tanggal
          <input type="date" className="form__input" value={tanggal} min={batasAwal} max={hariIni}
            onChange={(e) => e.target.value && setTanggal(e.target.value)} />
        </label>
        <div>
          <div className="form__label">Jam pelajaran ke-</div>
          <div className="jam-group" role="radiogroup" aria-label="Jam pelajaran">
            {JAM.map((j) => (
              <label key={j} className={`jam-chip ${jam === j ? 'jam-chip--aktif' : ''}`}>
                <input type="radio" name="jam" checked={jam === j} onChange={() => setJam(j)} />{j}
              </label>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn--ghost" onClick={semuaHadir} disabled={!info || !!info.bentrok}>Semua Hadir</button>
      </div>

      {pesan && <div className="form__error" role="alert">{pesan.text}</div>}
      {info?.bentrok && (
        <div className="form__warn">
          Jam ke-{jam} kelas ini pada tanggal tersebut sudah diisi oleh <strong>{info.bentrok.guru}</strong> ({info.bentrok.mapel}).
          Anda tidak dapat mengisinya. Hubungi admin bila perlu diubah.
        </div>
      )}

      {loading && <p>Memuat...</p>}
      {info && !loading && (
        <>
          <div className="sesi-ringkas">
            <span>H: {hitung.H}</span><span>I: {hitung.I}</span><span>S: {hitung.S}</span><span>A: {hitung.A}</span>
            <span>Belum diisi: {hitung.kosong}</span>
          </div>

          <div className="table-wrap"><table className="table">
            <thead><tr><th>No</th><th className="col-kiri">NISN</th><th className="col-kiri">Nama</th><th>Scan Pagi</th><th>Status</th></tr></thead>
            <tbody>
              {info.siswa.map((s, i) => (
                <tr key={s.nis} className={status[s.nis] ? '' : 'baris-kosong'}>
                  <td className="text-center">{i + 1}</td>
                  <td className="col-kiri">{s.nis}</td>
                  <td className="col-kiri">{s.nama}</td>
                  <td className="text-center">
                    <span className={`tag-pagi ${s.hadir_pagi ? 'tag-pagi--ya' : 'tag-pagi--tidak'}`}>{s.hadir_pagi ? 'Sudah' : 'Belum'}</span>
                  </td>
                  <td className="text-center">
                    <div className="hisa">
                      {OPSI.map(([k, label]) => (
                        <button key={k} type="button" title={label} aria-pressed={status[s.nis] === k}
                          disabled={!!info.bentrok}
                          className={`hisa__btn hisa__btn--${k} ${status[s.nis] === k ? 'is-aktif' : ''}`}
                          onClick={() => pilih(s.nis, k)}>{k}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {info.siswa.length === 0 && <tr><td colSpan="5" className="text-center">Tidak ada siswa di kelas ini.</td></tr>}
            </tbody>
          </table></div>

          <div className="aksi-simpan">
            <button type="button" className="btn btn--primary" onClick={simpan} disabled={saving || !!info.bentrok || info.siswa.length === 0}>
              {saving ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}