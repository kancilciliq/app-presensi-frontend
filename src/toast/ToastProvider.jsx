/* Penyedia notifikasi toast untuk seluruh aplikasi (tampilan: styles/toast.css) */
import { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from './ToastContext';

const DURASI_TOAST = 5000;

export default function ToastProvider({ children }) {
  const [daftar, setDaftar] = useState([]); // [{ id, ok, title, text }]
  const urut = useRef(0);

  const tutup = useCallback((id) => setDaftar((d) => d.filter((t) => t.id !== id)), []);

  const tampil = useCallback((ok, title, text) => {
    urut.current += 1;
    const id = urut.current;
    setDaftar((d) => [...d.slice(-3), { id, ok, title, text }]); // maksimal 4 toast sekaligus
    setTimeout(() => tutup(id), DURASI_TOAST);
  }, [tutup]);

  const value = useMemo(() => ({
    sukses: (title, text) => tampil(true, title, text),
    gagal: (title, text) => tampil(false, title, text),
  }), [tampil]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {daftar.map((t) => (
          <div key={t.id} className={`toast ${t.ok ? 'toast--ok' : 'toast--error'}`} role="alert">
            <div className="toast__icon">{t.ok ? '✓' : '!'}</div>
            <div className="toast__body">
              <strong>{t.title}</strong>
              {t.text && <span>{t.text}</span>}
            </div>
            <button type="button" className="toast__close" aria-label="Tutup" onClick={() => tutup(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
