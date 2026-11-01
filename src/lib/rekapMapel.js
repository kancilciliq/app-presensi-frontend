/* =====================================================================
   [BARU] rekapMapel.js - menyusun isi file Excel rekap presensi mapel.
   Hanya berisi logika murni (tanpa library), supaya mudah diuji.
   ===================================================================== */
export const NAMA_SEKOLAH = 'MTs Miftahul Ulum Sidomulyo';

// '2026-11-01' -> '01/11/2026'
export const tglID = (iso) => {
  const [y, m, d] = String(iso ?? '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(iso ?? '');
};

const slug = (t) => String(t ?? '').replace(/[^A-Za-z0-9-]+/g, '_').replace(/^_+|_+$/g, '') || 'Semua';

export const namaFile = (meta) => `Rekap_Mapel_${slug(meta.kelas)}_${meta.mulai}_sd_${meta.akhir}.xlsx`;

const judul = (meta, lebar) => {
  const baris = [
    ['REKAP PRESENSI MATA PELAJARAN'],
    [NAMA_SEKOLAH],
    [`Periode: ${tglID(meta.mulai)} s.d. ${tglID(meta.akhir)}`],
    [`Kelas: ${meta.kelas} | Mata pelajaran: ${meta.mapel}`],
    []
  ];
  const merges = [0, 1, 2, 3].map((r) => ({ s: { r, c: 0 }, e: { r, c: lebar - 1 } }));
  return { baris, merges };
};

// Sheet 1: ringkasan per siswa (H, I, S, A, total, % hadir) + baris jumlah
export function susunRingkasan(rows, meta) {
  const header = ['No', 'NIS', 'Nama', 'Kelas', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alpa (A)', 'Total Jam', '% Hadir'];
  const { baris, merges } = judul(meta, header.length);
  const data = rows.map((r, i) => [i + 1, String(r.nis), r.nama, r.kelas, r.h, r.i, r.s, r.a, r.total, r.total ? r.h / r.total : '-']);
  const jml = rows.reduce((t, r) => ({ h: t.h + r.h, i: t.i + r.i, s: t.s + r.s, a: t.a + r.a, total: t.total + r.total }), { h: 0, i: 0, s: 0, a: 0, total: 0 });
  const total = rows.length ? [['', '', 'JUMLAH', '', jml.h, jml.i, jml.s, jml.a, jml.total, jml.total ? jml.h / jml.total : '-']] : [];
  const dataAwal = baris.length + 1; // indeks baris (0-based) setelah header
  return {
    aoa: [...baris, header, ...data, ...total],
    merges,
    cols: [5, 14, 32, 10, 10, 10, 10, 10, 11, 10].map((wch) => ({ wch })),
    kolomPersen: 9,
    dataAwal,
    dataAkhir: dataAwal + data.length + total.length - 1
  };
}

// Sheet 2: rincian per pertemuan
export function susunSesi(rows, meta) {
  const header = ['Tanggal', 'Jam ke-', 'Kelas', 'Mata Pelajaran', 'Guru', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alpa (A)', 'Jumlah Siswa'];
  const { baris, merges } = judul(meta, header.length);
  const data = rows.map((r) => [tglID(r.tanggal), r.jam, r.kelas, r.mapel || '-', r.guru || '-', r.h, r.i, r.s, r.a, r.total]);
  return {
    aoa: [...baris, header, ...data],
    merges,
    cols: [12, 8, 10, 30, 26, 10, 10, 10, 10, 13].map((wch) => ({ wch }))
  };
}
