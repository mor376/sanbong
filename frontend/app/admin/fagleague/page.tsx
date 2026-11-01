'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Overview = Record<string, number>;

const modules = [
  { key: 'sports-centers', label: 'Cụm sân', icon: '⌖', description: 'Địa chỉ, giờ mở cửa và đánh giá' },
  { key: 'sports', label: 'Môn thể thao', icon: '⚽', description: 'Danh mục môn và loại hoạt động' },
  { key: 'pitch-categories', label: 'Danh mục sân', icon: '▤', description: 'Danh mục như Sân 5A, Sân 5B' },
  { key: 'subfields', label: 'Sân con', icon: '▦', description: 'Sân 1, Sân 2… thuộc danh mục sân' },
  { key: 'services', label: 'Dịch vụ', icon: '⚙', description: 'Dịch vụ và giá áp dụng tại sân' },
  { key: 'promotions', label: 'Khuyến mãi', icon: '◇', description: 'Chương trình giảm giá' },
  { key: 'staff', label: 'Nhân viên', icon: '♧', description: 'Hồ sơ và tình trạng nhân viên' },
  { key: 'pricing-rules', label: 'Quy tắc giá', icon: '₫', description: 'Giá theo giờ, ngày thường/cuối tuần' },
  { key: 'time-slots', label: 'Khung giờ', icon: '◷', description: 'Tình trạng khung giờ sân' },
  { key: 'teams', label: 'Đội bóng', icon: '♟', description: 'Tên đội, sân nhà và năm thành lập' },
  { key: 'players', label: 'Cầu thủ', icon: '♙', description: 'Đội, vị trí và trạng thái cầu thủ' },
  { key: 'tournaments', label: 'Giải đấu', icon: '🏆', description: 'Mùa giải và thời gian tổ chức' },
  { key: 'groups', label: 'Bảng đấu', icon: '▤', description: 'Các bảng trong từng giải' },
  { key: 'matches', label: 'Trận đấu', icon: '↔', description: 'Lịch, tỷ số và trạng thái trận' },
  { key: 'player-stats', label: 'Thống kê cầu thủ', icon: '▥', description: 'Bàn thắng, kiến tạo và thẻ' },
  { key: 'standings', label: 'Bảng xếp hạng', icon: '☷', description: 'Điểm và thành tích đội bóng' },
  { key: 'customers', label: 'Khách hàng', icon: '♧', description: 'Tài khoản liên kết và liên hệ' },
  { key: 'bookings', label: 'Đặt sân', icon: '▣', description: 'Khách, sân, thời gian và thanh toán' },
];

const summaryKeys = [
  ['sportsCenters', 'Cụm sân'],
  ['sports', 'Môn thể thao'],
  ['pitchCategories', 'Danh mục sân'],
  ['subFields', 'Sân con'],
  ['teams', 'Đội bóng'],
  ['players', 'Cầu thủ'],
  ['tournaments', 'Giải đấu'],
  ['matches', 'Trận đấu'],
  ['bookings', 'Đơn đặt sân'],
] as const;

export default function FagleagueDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Overview>('/api/platform/overview')
      .then(setOverview)
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu FAGLEAGUE.'));
  }, []);

  return (
    <div className="dashboard">
      <header className="page-head">
        <div><span className="eyebrow">FAGLEAGUE PLATFORM</span><h1>Dữ liệu giải đấu & sân thể thao</h1></div>
        <div className="status-pill">● MySQL · FAG247</div>
      </header>
      <p className="sub">Các màn hình dưới đây đọc và cập nhật trực tiếp schema FAG247.</p>
      {error && <div className="err" role="alert">{error}</div>}

      <div className="stats">
        {summaryKeys.map(([key, label]) => (
          <div className="stat" key={key}><div className="stat-icon">⚽</div>
            <b>{overview ? overview[key] ?? 0 : '—'}</b><span>{label}</span>
          </div>
        ))}
      </div>

      <div className="admin-feature-heading"><div><h2>Quản lý các bảng dữ liệu</h2>
        <p className="sub">Chọn một mục để xem dữ liệu hiện có trong backend.</p></div></div>
      <div className="fagleague-module-grid">
        {modules.map(module => (
          <Link className="card fagleague-module-card" href={`/admin/fagleague/${module.key}`} key={module.key}>
            <span className="fagleague-module-icon" aria-hidden="true">{module.icon}</span>
            <span><strong>{module.label}</strong><small>{module.description}</small></span>
            <span className="fagleague-module-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
      <style jsx>{`
        .fagleague-module-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:14px; }
        .fagleague-module-card { display:flex; align-items:center; gap:14px; padding:18px; color:inherit; text-decoration:none; transition:transform .16s ease,border-color .16s ease; }
        .fagleague-module-card:hover { transform:translateY(-2px); border-color:#38a169; }
        .fagleague-module-icon { display:grid; place-items:center; width:42px; height:42px; flex:none; border-radius:12px; background:#e9f8ef; color:#168044; font-size:21px; }
        .fagleague-module-card strong,.fagleague-module-card small { display:block; }
        .fagleague-module-card small { margin-top:5px; color:#718096; line-height:1.4; }
        .fagleague-module-arrow { margin-left:auto; color:#168044; font-size:20px; }
      `}</style>
    </div>
  );
}
