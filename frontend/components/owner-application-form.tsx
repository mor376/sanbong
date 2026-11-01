'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const EMPTY_FORM = { hoTen: '', soDienThoai: '', email: '', tenSan: '', diaChiSan: '', ghiChu: '' };

export function OwnerApplicationForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api('/api/yeu-cau-chu-san', {
        method: 'POST',
        body: { ...form, email: form.email.trim() || null },
      });
      setForm(EMPTY_FORM);
      setMessage('Đã gửi thông tin. Đội ngũ sẽ liên hệ với bạn.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không gửi được yêu cầu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="public-form owner-application-form" onSubmit={submit}>
      <label>Họ tên người liên hệ<input required maxLength={100} value={form.hoTen} onChange={event => setForm({ ...form, hoTen: event.target.value })} /></label>
      <div className="owner-form-grid">
        <label>Số điện thoại<input required type="tel" maxLength={15} value={form.soDienThoai} onChange={event => setForm({ ...form, soDienThoai: event.target.value })} /></label>
        <label>Email (không bắt buộc)<input type="email" maxLength={150} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
      </div>
      <label>Tên sân / cụm sân<input required maxLength={150} value={form.tenSan} onChange={event => setForm({ ...form, tenSan: event.target.value })} /></label>
      <label>Địa chỉ sân<input required maxLength={500} value={form.diaChiSan} onChange={event => setForm({ ...form, diaChiSan: event.target.value })} /></label>
      <label>Ghi chú<textarea rows={3} maxLength={1000} value={form.ghiChu} onChange={event => setForm({ ...form, ghiChu: event.target.value })} placeholder="Số lượng sân, quy mô, thời gian thuận tiện để liên hệ..." /></label>
      {error && <p className="live-review-error" role="alert">{error}</p>}
      {message && <p className="live-review-success" role="status">{message}</p>}
      <button type="submit" disabled={saving}>{saving ? 'Đang gửi…' : 'Gửi yêu cầu hợp tác'}</button>
      <small>Thông tin được lưu để đội ngũ FAGLEAGUE247 liên hệ tư vấn.</small>
    </form>
  );
}
