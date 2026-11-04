/* Tabel rekap presensi bulanan (tab di halaman Rekap Mapel).
   Data & aturan status dihitung di backend: services/rekapBulananService.js */
const persen = (v) => (v === null ? '-' : `${Math.round(v * 100)}%`);

export default function RekapBulanan({ data, loading }) {
  if (loading) return <p className="no-print">Memuat...</p>;
  if (!data) return null;

  const { hari, siswa } = data;

  return (
    <>
      <div className="bulanan-info no-print">
        <div className="bulanan-legenda">
          <span className="sel sel--H">H</span> Hadir
          <span className="sel sel--I">I</span> Izin
          <span className="sel sel--S">S</span> Sakit
          <span className="sel sel--A">A</span> Alpa
          <strong className="bulanan-hari">Hari efektif: {hari.length} hari</strong>
        </div>
        <details className="bulanan-aturan">
          <summary>Aturan penentuan status</summary>
          <ul>
            <li>Siswa yang <strong>scan datang dan pulang</strong> dihitung <strong>H</strong>, kecuali jam pelajaran 1-4 semuanya sudah diisi guru dan tidak ada yang H, maka otomatis <strong>A</strong> (jika di jam itu ada I/S, dipakai I/S terbanyak).</li>
            <li>Siswa yang <strong>tidak scan datang/pulang</strong> otomatis <strong>A</strong>, kecuali guru mengisi <strong>I</strong> atau <strong>S</strong> di salah satu jam pelajaran.</li>
            <li>Hari efektif = tanggal yang ada scan datang. Hari ini ikut dihitung setelah jam pulang dibuka (lihat Pengaturan Jam).</li>
          </ul>
        </details>
      </div>

      {data.sementara && (
        <div className="form__warn no-print">Data hari ini masih sementara: siswa yang belum scan pulang tampil <strong>A</strong> dan akan berubah otomatis setelah mereka scan pulang.</div>
      )}

      {hari.length === 0 && (
        <div className="form__warn">Belum ada hari efektif pada bulan ini (belum ada data scan datang).</div>
      )}

      <div className="table-wrap bulanan-wrap">
        <table className="table table--grid">
          <thead>
            <tr>
              <th className="frz frz-1">No</th>
              <th className="frz frz-2 col-kiri">NISN</th>
              <th className="frz frz-3 col-kiri">Nama</th>
              <th className="frz frz-4">Kelas</th>
              {hari.map((h) => <th key={h.tanggal} className="col-tgl" title={h.tanggal}>{h.hari}</th>)}
              <th>H</th><th>I</th><th>S</th><th>A</th><th>% Hadir</th>
            </tr>
          </thead>
          <tbody>
            {siswa.map((s, i) => (
              <tr key={s.nis}>
                <td className="frz frz-1">{i + 1}</td>
                <td className="frz frz-2 col-kiri">{s.nis}</td>
                <td className="frz frz-3 col-kiri">{s.nama}</td>
                <td className="frz frz-4">{s.kelas}</td>
                {s.harian.map((st, k) => <td key={hari[k].tanggal} className={`sel sel--${st}`}>{st}</td>)}
                <td>{s.h}</td><td>{s.i}</td><td>{s.s}</td><td>{s.a}</td>
                <td>{persen(s.persen)}</td>
              </tr>
            ))}
            {siswa.length === 0 && (
              <tr><td colSpan={9 + hari.length} className="text-center">Tidak ada siswa.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
