import { useContext } from 'react';
import { ToastContext } from './ToastContext';

// Pakai di komponen mana pun:
//   const toast = useToast();
//   toast.sukses('Berhasil ditambahkan', 'Data siswa tersimpan.');
//   toast.gagal('Gagal menghapus', 'Pesan error...');
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  return ctx;
}
