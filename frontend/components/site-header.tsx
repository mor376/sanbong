'use client';

import Link from 'next/link';
import { useSiteAuth } from './site-auth';

const navigation = [
  ['/shop', 'Trang chủ'],
  ['/tim-san', 'Tìm sân'],
  ['/shop/ho-so', 'Lịch đặt sân'],
  ['/shop#huong-dan', 'Hướng dẫn'],
  ['/phan-mem', 'Phần mềm'],
  ['/shop#danh-gia', 'Đánh giá'],
  ['/shop#lien-he', 'Liên hệ'],
  ['/giai-dau', 'Giải đấu'],
] as const;

export default function SiteHeader() {
  const { user, authChecked, logout } = useSiteAuth();

  return (
    <header className="fl-header">
      <Link className="fl-logo" href="/shop" aria-label="FAGLEAGUE247 - Trang chủ">FAG<span>LEAGUE247</span></Link>
      <nav className="fl-nav" aria-label="Điều hướng chính">
        {navigation.map(([href, label]) => (
          <Link
            key={href}
            href={href}
          >
            {label}
          </Link>
        ))}
        {authChecked && !user && (
          <>
            <Link className="fl-auth-link" href="/dang-nhap">Đăng nhập</Link>
            <Link className="fl-auth-link" href="/dang-ky">Đăng ký</Link>
          </>
        )}
        {authChecked && user && (
          <>
            <span className="fl-user">Xin chào, {user.hoTen || user.username}</span>
            {user.vaiTro === 'ADMIN' && <Link className="fl-auth-link" href="/admin">Quản trị</Link>}
            <button className="fl-logout" type="button" onClick={logout}>Đăng xuất</button>
          </>
        )}
        <Link className="fl-cta" href={authChecked && user ? '/tim-san' : '/dang-nhap'}>Đặt sân ngay</Link>
      </nav>
    </header>
  );
}
