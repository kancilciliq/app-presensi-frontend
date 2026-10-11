/* =====================================================================
   [BARU] Pagination  -  komponen navigasi halaman yang dipakai ulang
   Props:
     page, totalPages, totalItems, pageSize : angka dari usePagination
     onPageChange(n)                        : dipanggil saat pindah halaman
     onPageSizeChange(n)  (opsional)        : jika diisi, tampil dropdown
                                              "baris per halaman"
     pageSizeOptions      (opsional)        : pilihan jumlah baris
   ===================================================================== */

// Membuat daftar nomor halaman dengan titik-titik, mis: 1 ... 4 5 6 ... 20
const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');

  pages.push(total);
  return pages;
};

const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav className="pagination no-print" aria-label="Navigasi halaman">
      <div className="pagination__info">
        Menampilkan {from} - {to} dari {totalItems} data
        {onPageSizeChange && (
          <label className="pagination__size">
            Baris per halaman:
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Sebelumnya
        </button>

        {buildPageList(page, totalPages).map((item, i) =>
          item === '...' ? (
            <span key={`dots-${i}`} className="pagination__dots">…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={`pagination__btn ${item === page ? 'is-active' : ''}`}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination__btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Berikutnya
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
