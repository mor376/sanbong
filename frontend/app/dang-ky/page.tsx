'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export default function DangKyPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
  });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk('');
    setLoading(true);

    try {
      await api('/api/auth/dang-ky', {
        method: 'POST',
        body: form,
      });
      setOk('Đăng ký thành công. Tự động chuyển sang trang đăng nhập...');
      setForm({ username: '', password: '', hoTen: '', email: '', soDienThoai: '' });
      setTimeout(() => {
        window.location.href = '/dang-nhap';
      }, 900);
    } catch (e: any) {
      setErr(e.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit}>
        <div>
          <h1>FAGLEAGUE247</h1>
          <p className="sub" style={{ margin: 0 }}>Tạo tài khoản khách hàng mới</p>
        </div>

        <div className="shop-form row" style={{ margin: 0, padding: 0, maxWidth: '100%' }}>
          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              placeholder="Tên đăng nhập"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        <input
          placeholder="Họ và tên"
          value={form.hoTen}
          onChange={e => setForm({ ...form, hoTen: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Số điện thoại"
          value={form.soDienThoai}
          onChange={e => setForm({ ...form, soDienThoai: e.target.value })}
        />

        {err && <div className="err">{err}</div>}
        {ok && <div className="success-message">{ok}</div>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
        </button>

        <div className="auth-links">
          <span>Đã có tài khoản?</span>
          <Link href="/dang-nhap">Đăng nhập</Link>
        </div>
        <div className="auth-links">
          <Link href="/shop">Về trang chủ</Link>
        </div>
      </form>
    </div>
  );
}
