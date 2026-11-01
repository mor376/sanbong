'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPw] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const r = await api('/api/auth/dang-nhap', {
        method: 'POST',
        body: { login, password },
        signal: controller.signal,
      });
      localStorage.setItem('sb_token', r.token);
      if (r.user.vaiTro === 'ADMIN') {
        location.href = '/admin';
        return;
      }
      location.href = '/shop/ho-so';
    } catch (e: unknown) {
      setErr(controller.signal.aborted
        ? 'Kết nối máy chủ quá thời gian chờ. Vui lòng kiểm tra backend Spring Boot đang chạy rồi thử lại.'
        : e instanceof Error ? e.message : 'Đăng nhập không thành công, vui lòng thử lại.');
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit}>
        <div>
          <h1>FAGLEAGUE247</h1>
          <p className="sub" style={{ margin: 0 }}>Đăng nhập để đặt sân và quản lý tài khoản</p>
        </div>

        <input placeholder="Tên đăng nhập hoặc email" value={login} onChange={e => setLogin(e.target.value)} autoFocus />
        <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPw(e.target.value)} />

        {err && <div className="err" role="alert">{err}</div>}

        <button className="btn" style={{ padding: 11 }} type="submit" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>

        <div className="auth-links">
          <span>Chưa có tài khoản?</span>
          <Link href="/dang-ky">Đăng ký ngay</Link>
        </div>
        <div className="auth-links">
          <Link href="/shop">Về trang chủ</Link>
        </div>
      </form>
    </div>
  );
}
