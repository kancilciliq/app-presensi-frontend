/* =====================================================================
   akses.js - SATU-SATUNYA tempat mengatur menu per peran.
   - `icon`     : nama ikon di components/Icon.jsx
   - `children` : jika ada, menu tampil sebagai DROPDOWN
   Untuk menambah/mengurangi menu suatu peran, ubah daftar `roles`.
   (Pembatasan sebenarnya tetap dijaga backend; ini hanya mengatur tampilan.)
   ===================================================================== */
export const NAMA_PERAN = { admin: 'Admin', wali_kelas: 'Wali Kelas', guru: 'Guru' };

export const MENU = [
  { path: '/',             label: 'Data Siswa',          icon: 'users',     roles: ['admin', 'wali_kelas'] },
  { path: '/mapel',        label: 'Mata Pelajaran',      icon: 'book',      roles: ['guru', 'wali_kelas'] },
  { path: '/scan',         label: 'Scan Presensi',       icon: 'scan',      roles: ['wali_kelas', 'guru'] },
  { path: '/rekap',        label: 'Rekap Scan Siswa',     icon: 'chart',     roles: ['admin', 'wali_kelas'] },
  { path: '/rekap-mapel',  label: 'Rekap Mapel',         icon: 'clipboard', roles: ['admin', 'wali_kelas'] },
  { path: '/cetak-kartu',  label: 'Cetak Kartu QR',      icon: 'card',      roles: ['admin'] },
  {
    label: 'Kelola Mapel', icon: 'layers', roles: ['admin'],
    children: [
      { path: '/kelola-mapel/daftar', label: 'Daftar Mata Pelajaran', icon: 'list' },
      { path: '/kelola-mapel/tugas',  label: 'Tugas Mengajar',        icon: 'briefcase' },
    ],
  },
  { path: '/pengaturan',   label: 'Pengaturan Jam',      icon: 'clock',     roles: ['admin'] },
  { path: '/pengguna',     label: 'Manajemen Pengguna',  icon: 'shield',    roles: ['admin'] },
];

// Semua halaman (menu biasa + anak dropdown) beserta peran yang berhak
const halamanDatar = () => MENU.flatMap((m) => (m.children
  ? m.children.map((c) => ({ ...c, roles: m.roles }))
  : [m]));

export const menuUntuk = (role) => MENU.filter((m) => m.roles.includes(role));
export const boleh = (role, path) => halamanDatar().some((m) => m.path === path && m.roles.includes(role));
export const halamanAwal = (role) => {
  const pertama = menuUntuk(role)[0];
  return pertama?.children?.[0]?.path || pertama?.path || '/login';
};
// Judul halaman (dipakai topbar di HP)
export const judulHalaman = (pathname) => halamanDatar().find((m) => m.path === pathname)?.label || 'App Presensi';
