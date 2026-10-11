import { useState } from 'react';

/* =====================================================================
   [BARU] usePagination
   Hook kecil yang dipakai semua tabel/daftar supaya logika pagination
   tidak ditulis berulang-ulang.

   Contoh pakai:
     const p = usePagination(dataSiswa, 10);
     p.visibleItems  -> data untuk halaman yang sedang dibuka
     p.startIndex    -> indeks awal (untuk penomoran "No")
   ===================================================================== */
export default function usePagination(items, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Total halaman minimal 1 supaya tidak muncul "halaman 1 dari 0"
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Jika data berkurang (mis. habis dihapus) halaman otomatis ditarik mundur
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);

  // Mengganti jumlah baris per halaman -> kembali ke halaman 1
  const setPageSize = (size) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: items.length,
    startIndex,
    visibleItems,
  };
}
