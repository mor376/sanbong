'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LiveReviews } from '@/components/live-reviews';
import { PublicSite } from '@/components/public-site';
import { api, vnd } from '@/lib/api';
import { getPitchGalleryImages, getPitchVisual } from '@/lib/pitch-images';
import { getCategoryPitches } from '@/lib/pitch-groups';

type Pitch = {
  id: number;
  categoryId?: number | null;
  categoryName?: string | null;
  centerId?: number;
  ten: string;
  sportId: number;
  sportName: string;
  soNguoi: number;
  diaChi: string | null;
  moTa: string | null;
  hinhAnh: string | null;
  hinhAnhBoSung: string[];
  tienIch: string[];
  giaGio: number;
  giaGioCaoDiem: number;
  gioMo: string;
  gioDong: string;
  trangThai: 'HOAT_DONG' | 'BAO_TRI';
};

export default function PitchDetailsPage() {
  const params = useParams<{ id: string }>();
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [categoryPitches, setCategoryPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Pitch>(`/api/platform/pitches/${encodeURIComponent(params.id)}`),
      api<Pitch[]>('/api/platform/pitches'),
    ])
      .then(([item, items]) => {
        if (!active) return;
        setPitch(item);
        setCategoryPitches(getCategoryPitches(items, item));
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Không tải được thông tin sân.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  const visual = pitch ? getPitchVisual(pitch.sportName, pitch.id) : { image: null, icon: '🏟️' };
  const image = pitch?.hinhAnh || visual.image;

  return (
    <PublicSite>
      <main className="public-page pitch-detail-page">
        <Link href="/tim-san" className="detail-text-link">← Quay lại danh sách sân</Link>
        {loading && <p className="pitch-detail-message">Đang tải thông tin sân…</p>}
        {error && <p className="pitch-detail-error" role="alert">{error}</p>}
        {!loading && !error && pitch && <>
          <section className="pitch-detail-hero">
            <div className="pitch-detail-image-wrap">
              {image
                ? <img src={image} alt={`Hình ảnh ${pitch.ten}`} />
                : <div className="pitch-detail-sport-illustration" aria-label={`Minh họa ${pitch.sportName}`}><span aria-hidden="true">{visual.icon}</span></div>}
              {!pitch.hinhAnh && <span className="pitch-detail-image-note">Ảnh minh họa</span>}
            </div>
            <div className="pitch-detail-copy">
              <span className="public-eyebrow">{pitch.sportName} · Sân {pitch.soNguoi} người</span>
              {pitch.categoryName && <span className="pitch-detail-category">Danh mục: {pitch.categoryName}</span>}
              <h1>{pitch.ten}</h1>
              <p>{pitch.diaChi || 'Đang cập nhật địa chỉ'}</p>
              <p className="pitch-detail-hours">Giờ mở cửa: {pitch.gioMo?.slice(0, 5)} – {pitch.gioDong?.slice(0, 5)}</p>
              <div className="pitch-detail-prices">
                <span>Giá thường<strong>{vnd(pitch.giaGio)} / giờ</strong></span>
                <span>Giá cao điểm từ 17:00<strong>{vnd(pitch.giaGioCaoDiem)} / giờ</strong></span>
              </div>
              {categoryPitches.length > 1 && <div className="pitch-category-picker">
                <strong>Các sân con trong danh mục</strong>
                <div>{categoryPitches.map(child => <Link
                  key={child.id}
                  className={`pitch-category-child${child.id === pitch.id ? ' selected' : ''}`}
                  href={`/san-bong/${child.id}`}
                  aria-current={child.id === pitch.id ? 'page' : undefined}
                >
                  <span>{child.ten}</span><small>{vnd(child.giaGio)}/giờ</small>
                </Link>)}</div>
              </div>}
              {pitch.trangThai === 'HOAT_DONG'
                ? <Link className="public-link-button" href={`/tim-san?sanId=${pitch.id}`}>Kiểm tra lịch và đặt sân →</Link>
                : <p className="pitch-detail-maintenance">Sân đang bảo trì, chưa nhận đặt sân trực tuyến.</p>}
            </div>
          </section>
          <section className="public-card pitch-detail-description">
            <h2>Giới thiệu sân</h2>
            <p>{pitch.moTa || 'Sân chưa cập nhật phần giới thiệu.'}</p>
          </section>
          {(pitch.hinhAnhBoSung?.length > 0 || (!pitch.hinhAnh && visual.image)) && <section className="public-card">
            <h2>{pitch.hinhAnhBoSung?.length ? 'Hình ảnh sân' : 'Ảnh sân vận động tham khảo'}</h2>
            <div className="pitch-photo-grid">{pitch.hinhAnhBoSung?.length
              ? pitch.hinhAnhBoSung.map((photo, index) =>
                <img src={photo} alt={`${pitch.ten} - hình ${index + 2}`} key={`${photo}-${index}`} />)
              : getPitchGalleryImages(pitch.id).map((photo, index) =>
                <img src={photo} alt={`${pitch.ten} - ảnh minh họa ${index + 1}`} key={`${photo}-${index}`} />)}</div>
          </section>}
          <section className="public-card">
            <h2>Tiện ích tại sân</h2>
            {pitch.tienIch?.length
              ? <ul className="pitch-amenity-list">{pitch.tienIch.map(item => <li key={item}>{item}</li>)}</ul>
              : <p>Sân chưa cập nhật danh sách tiện ích. Vui lòng liên hệ trực tiếp để xác nhận.</p>}
          </section>
          <section className="public-card">
            <h2>Đánh giá của người chơi</h2>
            <LiveReviews sanId={pitch.id} />
          </section>
        </>}
      </main>
    </PublicSite>
  );
}
