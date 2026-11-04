/* =====================================================================
   rekapBulanan.js - bahan rekap presensi bulanan + export Excel BERGAYA
   (rata tengah, garis tabel, warna status). Memakai `xlsx-js-style`,
   yaitu SheetJS dengan dukungan style sel; API-nya sama dengan `xlsx`.
   ===================================================================== */
import * as XLSXNS from 'xlsx-js-style';
import { NAMA_SEKOLAH } from './rekapMapel';

const XLSX = XLSXNS.default ?? XLSXNS;

export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const labelBulan = (bln, thn) => `${NAMA_BULAN[bln - 1]} ${thn}`;

const slug = (t) => String(t ?? '').replace(/[^A-Za-z0-9-]+/g, '_').replace(/^_+|_+$/g, '') || 'Semua';
const namaSheet = (t) => String(t).replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Rekap';

// Kolom tetap di depan: No, NISN, Nama, Kelas. Setelah itu tanggal, lalu H I S A % Hadir.
const KOLOM_DEPAN = 4;
const KOLOM_NISN = 1;
const KOLOM_NAMA = 2;

// Murni (tanpa library): menyusun baris-baris sheet untuk satu kelompok siswa
export function susunBulanan(hari, siswa, meta) {
  const header = ['No', 'NISN', 'Nama', 'Kelas', ...hari.map((h) => h.hari), 'H', 'I', 'S', 'A', '% Hadir'];
  const lebar = header.length;
  const judul = [
    ['REKAP PRESENSI BULANAN'],
    [NAMA_SEKOLAH],
    [`Bulan: ${meta.label} | Kelas: ${meta.kelas}`],
    [`Hari efektif: ${hari.length} hari | H = Hadir, I = Izin, S = Sakit, A = Alpa`],
    []
  ];
  const data = siswa.map((s, i) => [
    i + 1, String(s.nis), s.nama, s.kelas, ...s.harian, s.h, s.i, s.s, s.a, s.persen === null ? '-' : s.persen
  ]);
  const barisHeader = judul.length;
  return {
    aoa: [...judul, header, ...data],
    merges: [0, 1, 2, 3].map((r) => ({ s: { r, c: 0 }, e: { r, c: lebar - 1 } })),
    cols: [5, 14, 32, 9, ...hari.map(() => 4.5), 6, 6, 6, 6, 10].map((wch) => ({ wch })),
    lebar, barisHeader, barisAkhir: barisHeader + data.length,
    kolomPersen: lebar - 1,
    kolomTanggalAwal: KOLOM_DEPAN,
    kolomTanggalAkhir: KOLOM_DEPAN + hari.length - 1
  };
}

const GARIS = { style: 'thin', color: { rgb: '9CA3AF' } };
const BORDER = { top: GARIS, bottom: GARIS, left: GARIS, right: GARIS };
const WARNA_STATUS = {
  H: { font: '15803D' },
  I: { font: '2563EB' },
  S: { font: 'B45309' },
  A: { font: 'DC2626', fill: 'FDECEE' }
};

const alamat = (r, c) => XLSX.utils.encode_cell({ r, c });
const sel = (ws, r, c) => ws[alamat(r, c)] || (ws[alamat(r, c)] = { t: 's', v: '' });

function terapkanGaya(ws, p) {
  // Judul: tebal & tengah
  for (let r = 0; r < p.barisHeader - 1; r += 1) {
    sel(ws, r, 0).s = { font: { bold: true, sz: r === 0 ? 14 : 11 }, alignment: { horizontal: 'center', vertical: 'center' } };
  }
  // Header tabel
  for (let c = 0; c < p.lebar; c += 1) {
    sel(ws, p.barisHeader, c).s = {
      font: { bold: true },
      fill: { patternType: 'solid', fgColor: { rgb: 'E0F2F1' } },
      alignment: { horizontal: c === KOLOM_NISN || c === KOLOM_NAMA ? 'left' : 'center', vertical: 'center', wrapText: true },
      border: BORDER
    };
  }
  // Isi: rata tengah, kecuali NISN & Nama (rata kiri)
  for (let r = p.barisHeader + 1; r <= p.barisAkhir; r += 1) {
    for (let c = 0; c < p.lebar; c += 1) {
      const sl = sel(ws, r, c);
      const kiri = c === KOLOM_NISN || c === KOLOM_NAMA;
      const gaya = { alignment: { horizontal: kiri ? 'left' : 'center', vertical: 'center' }, border: BORDER };
      if (c >= p.kolomTanggalAwal && c <= p.kolomTanggalAkhir && WARNA_STATUS[sl.v]) {
        const w = WARNA_STATUS[sl.v];
        gaya.font = { bold: true, color: { rgb: w.font } };
        if (w.fill) gaya.fill = { patternType: 'solid', fgColor: { rgb: w.fill } };
      }
      sl.s = gaya;
      if (c === p.kolomPersen && typeof sl.v === 'number') sl.z = '0%';
    }
  }
}

// Satu sheet per kelas (jika "Semua kelas", tiap kelas dapat sheet sendiri)
export function unduhRekapBulanan(data, meta) {
  const wb = XLSX.utils.book_new();
  const kelompok = new Map();
  data.siswa.forEach((s) => {
    if (!kelompok.has(s.kelas)) kelompok.set(s.kelas, []);
    kelompok.get(s.kelas).push(s);
  });

  kelompok.forEach((daftar, kelas) => {
    const p = susunBulanan(data.hari, daftar, { label: meta.label, kelas });
    const ws = XLSX.utils.aoa_to_sheet(p.aoa);
    ws['!merges'] = p.merges;
    ws['!cols'] = p.cols;
    ws['!rows'] = [];
    ws['!rows'][p.barisHeader] = { hpx: 24 };
    terapkanGaya(ws, p);
    // Freeze panes: kolom No-Kelas dan baris judul tetap terlihat saat digeser
    ws['!freeze'] = { xSplit: String(KOLOM_DEPAN), ySplit: String(p.barisHeader + 1), topLeftCell: alamat(p.barisHeader + 1, KOLOM_DEPAN), activePane: 'bottomRight', state: 'frozen' };
    XLSX.utils.book_append_sheet(wb, ws, namaSheet(kelas));
  });

  const namaKelas = kelompok.size === 1 ? [...kelompok.keys()][0] : 'Semua_Kelas';
  XLSX.writeFile(wb, `Rekap_Bulanan_${slug(namaKelas)}_${meta.bulan}.xlsx`);
}
