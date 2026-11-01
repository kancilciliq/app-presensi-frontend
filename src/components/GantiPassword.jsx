/* [BARU] Popup ganti password milik sendiri */
import { useState } from 'react';
import axios from 'axios';
import { useToast } from '../toast/useToast';

const API_URL = import.meta.env.VITE_API_URL;

export default function GantiPassword({ onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ passwordLama: '', passwordBaru: '', ulangi: '' });
  const [pesan, setPesan] = useState(null); // { ok, text }
  const [saving, setSaving] = useState(false);

  const ubah = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const simpan = async (e) => {
    e.preventDefault();
    if (form.passwordBaru.length < 8) return setPesan({ ok: false, text: 'Password baru minimal 8 karakter' });
    if (form.passwordBaru !== form.ulangi) return setPesan({ ok: false, text: 'Konfirmasi password tidak sama' });
    setSaving(true);
    try {
      await axios.post(`${API_URL}/auth/ganti-password`, { passwordLama: form.passwordLama, passwordBaru: form.passwordBaru });
      toast.sukses('Berhasil diperbarui', 'Password berhasil diganti.');
      onClose();
    } catch (err) {
      setPesan({ ok: false, text: err.response?.data?.message || 'Gagal mengganti password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay no-print">
      <div className="modal">
        <h3>Ganti Password</h3>
        <form className="form" onSubmit={simpan}>
          {pesan && <div className={pesan.ok ? 'form__ok' : 'form__error'}>{pesan.text}</div>}
          <label className="form__label">Password lama
            <input className="form__input" type="password" name="passwordLama" value={form.passwordLama} onChange={ubah} autoComplete="current-password" required />
          </label>
          <label className="form__label">Password baru
            <input className="form__input" type="password" name="passwordBaru" value={form.passwordBaru} onChange={ubah} autoComplete="new-password" required />
            <span className="form__hint">Minimal 8 karakter.</span>
          </label>
          <label className="form__label">Ulangi password baru
            <input className="form__input" type="password" name="ulangi" value={form.ulangi} onChange={ubah} autoComplete="new-password" required />
          </label>
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Tutup</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
