'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, paymentMethodLabel, vnd } from '@/lib/api';
import { PublicSite } from '@/components/public-site';

type Booking = {
  id: number;
  tenSan: string;
  ngay: string;
  gioBatDau: string;
  gioKetThuc: string;
  tongTien: number;
  phuongThucThanhToan?: string;
  trangThai: string;
  ghiChu?: string;
  trangThaiThanhToan?: string;
  maThanhToan?: string;
  maKhuyenMai?: string;
  soTienGiam?: number;
};

const bookingStatus: Record<string, { label: string; className: string }> = {
  Pending: { label: 'Chờ xác nhận', className: 'pending' },
  Confirmed: { label: 'Đã xác nhận', className: 'confirmed' },
  Completed: { label: 'Hoàn thành', className: 'completed' },
  Cancelled: { label: 'Đã hủy', className: 'cancelled' },
};

export default function HoSoPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ hoTen: '', email: '', soDienThoai: '' });
  const [password, setPassword] = useState({ matKhauCu: '', matKhauMoi: '', nhapLai: '' });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const me = await api('/api/auth/me');
      setUser(me);
      setProfile({ hoTen: me.hoTen || '', email: me.email || '', soDienThoai: me.soDienThoai || '' });
      const ds = await api('/api/platform/bookings/mine');
      setBookings(ds || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    setSavingProfile(true);
    try {
      const updated = await api('/api/auth/me', { method: 'PUT', body: profile });
      setUser(updated);
      setMessage('Cập nhật thông tin cá nhân thành công.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!password.matKhauCu || !password.matKhauMoi) {
      setError('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (password.matKhauMoi.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (password.matKhauMoi !== password.nhapLai) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      await api('/api/auth/doi-mat-khau', {
        method: 'PUT',
        body: { matKhauCu: password.matKhauCu, matKhauMoi: password.matKhauMoi },
      });
      setPassword({ matKhauCu: '', matKhauMoi: '', nhapLai: '' });
      setMessage('Đổi mật khẩu thành công.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <PublicSite>
      <main className="account-profile">
        <section className="account-profile-hero">
          <div className="account-profile-intro">
            <span className="account-profile-eyebrow"><span /> KHÔNG GIAN THÀNH VIÊN</span>
            <h1>Xin chào, {user?.hoTen?.trim().split(/\s+/).slice(-1)[0] || 'bạn'}!</h1>
            <p>Quản lý thông tin, bảo mật tài khoản và theo dõi các lịch đặt sân của bạn.</p>
          </div>
          <div className="account-profile-identity">
            <div className="account-profile-avatar">{(user?.hoTen || 'A').charAt(0).toUpperCase()}</div>
            <div className="account-profile-identity-copy">
              <strong>{user?.hoTen || 'Thành viên FAGLEAGUE'}</strong>
              <span>@{user?.username || 'guest'}</span>
            </div>
            <span className="account-profile-member">Thành viên</span>
          </div>
          <div className="account-profile-orb account-profile-orb-one" />
          <div className="account-profile-orb account-profile-orb-two" />
        </section>

        {(message || error) && (
          <div className={`account-profile-notice ${error ? 'is-error' : 'is-success'}`} role={error ? 'alert' : 'status'}>
            <span className="account-profile-notice-icon">{error ? '!' : '✓'}</span>
            {error || message}
          </div>
        )}

        <section className="account-profile-grid">
          <div className="card account-profile-card">
            <div className="account-profile-card-heading">
              <span className="account-profile-icon account-profile-icon-green" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </span>
              <div><h2>Thông tin cá nhân</h2><p>Cập nhật thông tin liên hệ của bạn</p></div>
            </div>

            <div className="account-profile-form-identity">
              <div className="account-profile-mini-avatar">{(user?.hoTen || 'A').charAt(0).toUpperCase()}</div>
              <div><strong>{user?.hoTen || 'Chưa cập nhật tên'}</strong><span>Tài khoản @{user?.username || 'guest'}</span></div>
              <span className="account-profile-verified"><span /> Đang hoạt động</span>
            </div>

            <form onSubmit={saveProfile} className="account-profile-form">
              <label>
                <span>Họ và tên</span>
                <input autoComplete="name" value={profile.hoTen} onChange={e => setProfile({ ...profile, hoTen: e.target.value })} placeholder="Nhập họ và tên" />
              </label>
              <label>
                <span>Địa chỉ email</span>
                <input type="email" autoComplete="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="name@example.com" />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input type="tel" autoComplete="tel" value={profile.soDienThoai} onChange={e => setProfile({ ...profile, soDienThoai: e.target.value })} placeholder="Nhập số điện thoại" />
              </label>
              <button className="btn account-profile-submit" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'} <span aria-hidden="true">→</span>
              </button>
            </form>
          </div>

          <div className="card account-profile-card">
            <div className="account-profile-card-heading">
              <span className="account-profile-icon account-profile-icon-rose" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </span>
              <div><h2>Bảo mật tài khoản</h2><p>Đổi mật khẩu để bảo vệ tài khoản</p></div>
            </div>

            <div className="account-profile-security-tip">
              <span aria-hidden="true">✦</span>
              <p>Sử dụng mật khẩu mạnh có ít nhất 6 ký tự và không chia sẻ với người khác.</p>
            </div>

            <form onSubmit={savePassword} className="account-profile-form">
              <label>
                <span>Mật khẩu hiện tại</span>
                <input type="password" autoComplete="current-password" value={password.matKhauCu} onChange={e => setPassword({ ...password, matKhauCu: e.target.value })} placeholder="Nhập mật khẩu hiện tại" />
              </label>
              <label>
                <span>Mật khẩu mới</span>
                <input type="password" autoComplete="new-password" value={password.matKhauMoi} onChange={e => setPassword({ ...password, matKhauMoi: e.target.value })} placeholder="Ít nhất 6 ký tự" />
              </label>
              <label>
                <span>Xác nhận mật khẩu mới</span>
                <input type="password" autoComplete="new-password" value={password.nhapLai} onChange={e => setPassword({ ...password, nhapLai: e.target.value })} placeholder="Nhập lại mật khẩu mới" />
              </label>
              <button className="btn account-profile-submit account-profile-submit-rose" type="submit" disabled={savingPassword}>
                {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'} <span aria-hidden="true">→</span>
              </button>
            </form>
          </div>
        </section>

        <section className="card account-profile-bookings">
          <div className="account-profile-bookings-heading">
            <div className="account-profile-card-heading">
              <span className="account-profile-icon account-profile-icon-amber" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M7.5 3v4M16.5 3v4m-13 3h17M8 14h3m-3 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </span>
              <div><h2>Lịch sử đặt sân</h2><p>Xem lại các lịch đặt sân của bạn</p></div>
            </div>
            <span className="account-profile-booking-count">{loading ? '…' : `${bookings.length} lịch đặt`}</span>
          </div>

          {loading ? (
            <div className="account-profile-empty"><span className="account-profile-loader" />Đang tải lịch sử đặt sân...</div>
          ) : bookings.length === 0 ? (
            <div className="account-profile-empty">
              <span className="account-profile-empty-icon" aria-hidden="true">⚽</span>
              <strong>Chưa có lịch đặt sân</strong>
              <span>Các lịch đặt của bạn sẽ hiển thị tại đây.</span>
            </div>
          ) : (
            <div className="account-profile-booking-list">
              {bookings.map(booking => {
                const status = bookingStatus[booking.trangThai] || { label: booking.trangThai || 'Chưa xác định', className: 'unknown' };
                return (
                  <article key={booking.id} className="account-profile-booking-item">
                    <div className="account-profile-booking-date">
                      <span aria-hidden="true">◷</span>
                      <div>
                        <strong>{booking.ngay?.split('-').reverse().join('/') || 'Chưa có ngày'}</strong>
                        <span>{booking.gioBatDau?.slice(0, 5)} – {booking.gioKetThuc?.slice(0, 5)}</span>
                      </div>
                    </div>
                    <div className="account-profile-booking-details">
                      <strong>{booking.tenSan || 'Sân thể thao'}</strong>
                      <span>{paymentMethodLabel(booking.phuongThucThanhToan)}</span>
                      {booking.ghiChu && <span>{booking.ghiChu}</span>}
                      {booking.trangThaiThanhToan && <span>{booking.trangThaiThanhToan}</span>}
                      {booking.maThanhToan && <span>Nội dung chuyển khoản: {booking.maThanhToan}</span>}
                      {booking.maKhuyenMai && <span>Mã {booking.maKhuyenMai} · Đã giảm {vnd(booking.soTienGiam || 0)}</span>}
                    </div>
                    <div className="account-profile-booking-total">
                      <span className={`account-profile-status is-${status.className}`}>{status.label}</span>
                      <strong>{vnd(booking.tongTien || 0)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PublicSite>
  );
}
