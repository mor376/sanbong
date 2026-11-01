'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api, vnd } from '@/lib/api';

export default function TaiKhoanPage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [pass, setPass] = useState({ matKhauCu: '', matKhauMoi: '', nhapLai: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const me = await api('/api/auth/me');
      setUser(me);
      const ds = await api('/api/platform/bookings/mine');
      setBookings(ds || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!pass.matKhauCu || !pass.matKhauMoi) {
      setError('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (pass.matKhauMoi.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (pass.matKhauMoi !== pass.nhapLai) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      const res = await api('/api/auth/doi-mat-khau', {
        method: 'PUT',
        body: {
          matKhauCu: pass.matKhauCu,
          matKhauMoi: pass.matKhauMoi,
        },
      });
      setMessage(res?.message || 'Đổi mật khẩu thành công.');
      setPass({ matKhauCu: '', matKhauMoi: '', nhapLai: '' });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="account-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Tài khoản</span>
          <h1>Hồ sơ & bảo mật</h1>
        </div>
      </header>

      <div className="profile-grid">
        <div className="card profile-card">
          <h2>Thông tin tài khoản</h2>
          {user ? (
            <div className="profile-info">
              <div className="avatar">{user.hoTen?.charAt(0)?.toUpperCase() || 'A'}</div>
              <div>
                <div className="profile-name">{user.hoTen}</div>
                <div className="profile-meta">@{user.username}</div>
                <div className="profile-meta">{user.email}</div>
                <div className="profile-meta">{user.soDienThoai || 'Chưa cập nhật SĐT'}</div>
              </div>
            </div>
          ) : (
            <div className="empty">Đang tải thông tin...</div>
          )}
        </div>

        <div className="card form-card">
          <h2>Đổi mật khẩu</h2>
          <form onSubmit={submitPassword} className="password-form">
            <label>
              Mật khẩu hiện tại
              <input type="password" value={pass.matKhauCu} onChange={e => setPass({ ...pass, matKhauCu: e.target.value })} />
            </label>
            <label>
              Mật khẩu mới
              <input type="password" value={pass.matKhauMoi} onChange={e => setPass({ ...pass, matKhauMoi: e.target.value })} />
            </label>
            <label>
              Nhập lại mật khẩu mới
              <input type="password" value={pass.nhapLai} onChange={e => setPass({ ...pass, nhapLai: e.target.value })} />
            </label>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="err">{error}</div>}
            <button className="btn" type="submit">Cập nhật mật khẩu</button>
          </form>
        </div>
      </div>

      <div className="card history-card">
        <div className="card-head">
          <h2>Lịch sử đặt sân</h2>
          <span className="chip soft">{bookings.length} lần</span>
        </div>

        {bookings.length === 0 ? (
          <div className="empty">Bạn chưa có lịch sử đặt sân nào.</div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Sân</th>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((d: any) => (
                  <tr key={d.id}>
                    <td>{d.tenSan}</td>
                    <td>{d.ngay?.split('-').reverse().join('/')}</td>
                    <td>{d.gioBatDau?.slice(0, 5)} - {d.gioKetThuc?.slice(0, 5)}</td>
                    <td className="num">{vnd(d.tongTien)}</td>
                    <td><span className={`badge ${d.trangThai}`}>{d.trangThai}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
