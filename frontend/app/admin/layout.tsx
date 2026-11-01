'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import type { ReactNode } from 'react';

const NAV_GROUPS = [
  {
    title: 'TRANG CHỦ',
    items: [{ href: '/admin', label: 'Dashboard', icon: '▦' }],
  },
  {
    title: 'KHÔNG GIAN LÀM VIỆC',
    items: [
      { href: '/admin/fagleague/bookings', label: 'Đặt sân online', icon: '▣' },
      { href: '/admin/fagleague/subfields', label: 'Quản lý sân', icon: '⌖' },
      { href: '/admin/fagleague/tournaments', label: 'Giải đấu', icon: '🏆' },
      { href: '/admin/nguoi-dung', label: 'Quản lý người dùng', icon: '♙' },
      { href: '/admin/fagleague', label: 'Dữ liệu FAGLEAGUE', icon: '⚽' },
    ],
  },
  {
    title: 'QUẢN LÝ VẬN HÀNH',
    items: [
      { href: '/admin/fagleague/services', label: 'Dịch vụ', icon: '⚙' },
      { href: '/admin/fagleague/promotions', label: 'Khuyến mãi', icon: '◇' },
      { href: '/admin/hoa-don', label: 'Hóa đơn', icon: '▤' },
      { href: '/admin/fagleague/staff', label: 'Nhân viên', icon: '♧' },
      { href: '/admin/yeu-cau-chu-san', label: 'Yêu cầu chủ sân', icon: '✉' },
    ],
  },
  {
    title: 'TÀI KHOẢN',
    items: [{ href: '/admin/tai-khoan', label: 'Hồ sơ & bảo mật', icon: '◉' }],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/dat-san': 'Đặt sân online',
  '/admin/san-bong': 'Quản lý sân',
  '/admin/giai-dau': 'Giải đấu',
  '/admin/yeu-cau-chu-san': 'Yêu cầu chủ sân',
  '/admin/nguoi-dung': 'Quản lý người dùng',
  '/admin/dich-vu': 'Dịch vụ',
  '/admin/khuyen-mai': 'Khuyến mãi',
  '/admin/hoa-don': 'Hóa đơn',
  '/admin/nhan-vien': 'Nhân viên',
  '/admin/tai-khoan': 'Hồ sơ & bảo mật',
  '/admin/fagleague': 'Dữ liệu FAGLEAGUE',
  '/admin/fagleague/bookings': 'Đặt sân online',
  '/admin/fagleague/subfields': 'Quản lý sân',
  '/admin/fagleague/tournaments': 'Giải đấu',
  '/admin/fagleague/services': 'Dịch vụ',
  '/admin/fagleague/promotions': 'Khuyến mãi',
  '/admin/fagleague/staff': 'Nhân viên',
};

function AdminClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span>
      <strong>{now ? new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(now) : ' '}</strong>
      <small>{now ? now.toLocaleTimeString('vi-VN') : ' '}</small>
    </span>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [user, setUser] = useState<{ hoTen: string; username: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api('/api/auth/me').then(u => u.vaiTro === 'ADMIN' ? setUser(u) : (location.href = '/dang-nhap'))
      .catch(() => (location.href = '/dang-nhap'));
  }, []);

  const title = PAGE_TITLES[path] ?? 'Quản trị';
  const initial = (user?.hoTen || user?.username || 'A').charAt(0).toLocaleUpperCase('vi');

  if (!user) return null;
  return (
    <div className={`admin-shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand" aria-label="FAGLEAGUE247 - Dashboard">
          <span className="admin-brand-mark">F</span><span className="admin-brand-name">FAG<span>LEAGUE247</span></span>
        </Link>

        <div className="admin-identity">
          <span className="admin-avatar">{initial}</span>
          <span className="admin-identity-copy"><strong>{user.hoTen || user.username}</strong><small><i /> Super Admin</small></span>
        </div>

        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          {NAV_GROUPS.map(group => (
            <section className="admin-nav-group" key={group.title}>
              <h2>{group.title}</h2>
              {group.items.map(item => (
                <Link key={item.href} href={item.href} className={`admin-nav-link${path === item.href ? ' active' : ''}`}>
                  <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <span className="admin-version"><i /> FAGLEAGUE247 · QUẢN TRỊ</span>
          <button className="admin-logout" onClick={() => { localStorage.removeItem('sb_token'); location.href = '/dang-nhap'; }}>
            <span className="admin-nav-icon" aria-hidden="true">↪</span><span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-date">
            <button className="admin-menu-toggle" type="button" aria-label="Thu gọn menu" onClick={() => setCollapsed(!collapsed)}>☰</button>
            <AdminClock />
          </div>
          <div className="admin-topbar-user"><span><strong>{user.hoTen || user.username}</strong><small>Tài khoản quản trị</small></span><span className="admin-avatar admin-avatar-small">{initial}</span></div>
        </header>

        <div className="admin-content">
          <div className="admin-page-heading"><div className="admin-page-context"><span>FAGLEAGUE247 · QUẢN TRỊ</span><p>Quản lý và theo dõi hoạt động sân bóng</p></div>
            <div className="admin-breadcrumb"><Link href="/shop">Trang chủ</Link><span aria-hidden="true">/</span><strong>{title}</strong></div>
          </div>
          <main className="admin-main">{children}</main>
          <footer className="admin-footer">{new Date().getFullYear()} © FAGLEAGUE247 — Hệ thống quản trị</footer>
        </div>
      </div>
    </div>
  );
}
