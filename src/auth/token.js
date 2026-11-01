/* =====================================================================
   [BARU] token.js - simpan token login & pasang interceptor axios (sekali).
   Semua komponen lama tetap memakai `axios` biasa: token otomatis dikirim,
   dan jika server menjawab 401 (sesi habis) pengguna dikembalikan ke login.
   ===================================================================== */
import axios from 'axios';

const KUNCI = 'presensi_token';
const API_URL = import.meta.env.VITE_API_URL || '';

export const getToken = () => {
  try { return localStorage.getItem(KUNCI); } catch { return null; }
};
export const setToken = (t) => {
  try { localStorage.setItem(KUNCI, t); } catch { /* penyimpanan diblokir */ }
};
export const clearToken = () => {
  try { localStorage.removeItem(KUNCI); } catch { /* abaikan */ }
};

if (!axios.__authDipasang) {
  axios.__authDipasang = true;

  axios.interceptors.request.use((config) => {
    const token = getToken();
    // Token hanya dikirim ke API kita sendiri
    if (token && typeof config.url === 'string' && config.url.startsWith(API_URL)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const url = String(err.config?.url || '');
      if (err.response?.status === 401 && !url.endsWith('/auth/login')) {
        clearToken();
        window.dispatchEvent(new Event('auth:logout'));
      }
      return Promise.reject(err);
    }
  );
}
