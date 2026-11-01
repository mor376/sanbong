'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, vnd } from '@/lib/api';
import { getPitchVisual } from '@/lib/pitch-images';
import { getCategoryPitches, groupPitchCards } from '@/lib/pitch-groups';
import { PublicSite } from '@/components/public-site';
import { LiveReviews } from '@/components/live-reviews';

type Pitch = {
  id: number;
  categoryId?: number | null;
  categoryName?: string | null;
  ten: string;
  sportId: number;
  sportName: string;
  soNguoi: number;
  diaChi: string | null;
  hinhAnh: string | null;
  giaGio: number;
  trangThai: 'HOAT_DONG' | 'BAO_TRI';
};
type Sport = { id: number; name: string };
type Center = { rating: number; totalReviews: number };

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function ShopPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(localToday);
  const [area, setArea] = useState('');
  const [sportId, setSportId] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Pitch[]>('/api/platform/pitches'),
      api<Sport[]>('/api/platform/sports'),
      api<Center[]>('/api/platform/sports-centers'),
    ])
      .then(([pitchData, sportData, centers]) => {
        if (!active) return;
        setPitches(pitchData.filter(pitch => pitch.trangThai === 'HOAT_DONG'));
        setSports(sportData);
        const reviewCount = centers.reduce((sum, center) => sum + center.totalReviews, 0);
        setAverageRating(reviewCount
          ? centers.reduce((sum, center) => sum + center.rating * center.totalReviews, 0) / reviewCount
          : null);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Không tải được danh sách sân.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const areas = useMemo(
    () => [...new Set(pitches.map(pitch => pitch.diaChi?.split(',').at(-1)?.trim()).filter((value): value is string => Boolean(value)))],
    [pitches],
  );

  const searchHref = `/tim-san?ngay=${encodeURIComponent(date)}${area ? `&khuVuc=${encodeURIComponent(area)}` : ''}${sportId ? `&sportId=${encodeURIComponent(sportId)}` : ''}`;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.href = searchHref;
  };

  const pitchCategories = useMemo(() => groupPitchCards(pitches), [pitches]);
  const featuredPitches = pitchCategories.slice(0, 3);

  return (
    <PublicSite>
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-inner">
            <div className="home-hero-copy">
              <span className="home-eyebrow"><span className="home-live-dot" /> Kết nối sân thể thao · FAGLEAGUE247</span>
              <h1>Đặt sân thể thao<br /><span>trong 30 giây</span></h1>
              <p>
                FAGLEAGUE247 giúp bạn tìm sân bóng đá, xem thông tin và mức giá,
                rồi kiểm tra khung giờ phù hợp. Các môn thể thao khác sẽ được
                hỗ trợ khi có dữ liệu trên hệ thống.
              </p>
              <div className="home-hero-actions">
                <a href="#tim-san-nhanh" className="home-primary-button">Tìm sân ngay <span aria-hidden="true">→</span></a>
                <Link href="/huong-dan" className="home-text-link">Cách tìm sân <span aria-hidden="true">↗</span></Link>
              </div>
              <div className="home-stats" aria-label="Thông tin hệ thống">
                <div><strong>{loading ? '…' : pitchCategories.length}</strong><span>Danh mục sân hoạt động</span></div>
                <div><strong>{loading ? '…' : sports.length}</strong><span>Môn thể thao</span></div>
                <div><strong>{error ? '—' : loading ? '…' : 'Online'}</strong><span>Tra cứu trực tuyến</span></div>
                <div><strong>{loading ? '…' : averageRating?.toFixed(1) ?? '—'}</strong><span>Đánh giá trung bình</span></div>
              </div>
            </div>
            <div className="home-hero-visual" aria-hidden="true">
              <div className="home-stadium-glow" />
              <div className="home-field">
                <div className="home-field-line home-field-center" />
                <div className="home-field-circle" />
                <div className="home-field-box home-field-box-left" />
                <div className="home-field-box home-field-box-right" />
                <span className="home-football">⚽</span>
              </div>
              <span className="home-visual-caption">YOUR GAME. YOUR FIELD.</span>
            </div>
          </div>
        </section>

        <section className="home-search-wrap" id="tim-san-nhanh">
          <form className="home-search-card" onSubmit={handleSearch}>
            <div className="home-search-heading">
              <span className="home-search-icon" aria-hidden="true">⌕</span>
              <div>
                <h2>Tìm sân nhanh</h2>
                <p>Chọn môn, khu vực và ngày chơi để bắt đầu tìm kiếm.</p>
              </div>
            </div>
            <div className="home-search-fields">
              <label>
                Môn thể thao
                <select value={sportId} onChange={event => setSportId(event.target.value)} aria-label="Môn thể thao">
                  <option value="">Tất cả môn</option>
                  {sports.map(sport => <option value={sport.id} key={sport.id}>{sport.name}</option>)}
                </select>
              </label>
              <label>
                Tỉnh / thành phố
                <select value={area} onChange={event => setArea(event.target.value)}>
                  <option value="">Tất cả khu vực</option>
                  {areas.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                Ngày chơi
                <input type="date" min={localToday()} value={date} onChange={event => setDate(event.target.value)} required />
              </label>
              <button type="submit">Chọn sân <span aria-hidden="true">→</span></button>
            </div>
            <p className="home-search-note">Danh sách môn thể thao, sân và khu vực được đồng bộ từ FAG247.</p>
          </form>
        </section>

        <section className="home-section home-sports">
          <div className="home-section-heading">
            <div><span className="home-section-eyebrow">Chọn môn thể thao</span><h2>Bạn muốn chơi môn nào?</h2></div>
            <p>Chọn một môn để xem các sân đang có trên hệ thống.</p>
          </div>
          <div className="home-sport-grid">
            {sports.map(sport => {
              const count = pitchCategories.filter(pitch => pitch.sportId === sport.id).length;
              const icon = sport.name.toLocaleLowerCase('vi').includes('cầu lông') ? '🏸'
                : sport.name.toLocaleLowerCase('vi').includes('tennis') || sport.name.toLocaleLowerCase('vi').includes('quần vợt') ? '🎾'
                  : sport.name.toLocaleLowerCase('vi').includes('bóng rổ') ? '🏀'
                    : sport.name.toLocaleLowerCase('vi').includes('pickleball') ? '🏓' : '⚽';
              const href = `/tim-san?ngay=${encodeURIComponent(date)}&sportId=${sport.id}`;
              return <Link className="home-sport-card home-sport-active" href={href} key={sport.id}>
                <span className="home-sport-icon" aria-hidden="true">{icon}</span>
                <span className="home-sport-title">{sport.name}</span>
                <span className="home-sport-detail">{loading ? 'Đang tải sân…' : `${count} sân đang hoạt động`}</span>
                <span className="home-sport-arrow" aria-hidden="true">↗</span>
              </Link>;
            })}
          </div>
        </section>

        <section className="home-section home-featured">
          <div className="home-section-heading">
            <div><span className="home-section-eyebrow">Sân nổi bật</span><h2>Sân bóng đang hoạt động</h2></div>
            <Link className="home-view-all" href="/tim-san">Xem tất cả sân <span aria-hidden="true">→</span></Link>
          </div>
          {error && <p className="home-error" role="alert">{error}</p>}
          {loading && <p className="home-empty">Đang tải danh sách sân…</p>}
          {!loading && !error && featuredPitches.length === 0 && (
            <p className="home-empty">Chưa có sân bóng đang hoạt động để hiển thị.</p>
          )}
          {!loading && !error && featuredPitches.length > 0 && (
            <div className="home-venue-grid">
              {featuredPitches.map(pitch => {
                const categoryPitches = getCategoryPitches(pitches, pitch);
                const minPrice = Math.min(...categoryPitches.map(item => item.giaGio));
                const categoryName = pitch.categoryName || pitch.ten;
                const visual = getPitchVisual(pitch.sportName, pitch.id);
                const image = pitch.hinhAnh || visual.image;
                return <article className="home-venue-card" key={pitch.id}>
                  <Link href={`/tim-san?sanId=${pitch.id}`} className={`home-venue-image${!image ? ' sport-illustration' : ''}`} aria-label={`Thông tin danh mục ${categoryName}`}>
                    {image && <img src={image} alt="" />}
                    {!image && <span className="sport-illustration-icon" aria-hidden="true">{visual.icon}</span>}
                    <span className="home-venue-size">{pitch.soNguoi ? `Sân ${pitch.soNguoi} người` : pitch.sportName}</span>
                    {!pitch.hinhAnh && <span className="home-venue-image-note">Ảnh minh họa</span>}
                  </Link>
                  <div className="home-venue-body">
                    <span className="home-venue-address">⌖ {pitch.diaChi || 'Chưa cập nhật địa chỉ'}</span>
                    <h3><Link href={`/tim-san?sanId=${pitch.id}`}>{categoryName}</Link></h3>
                    <div className="home-venue-meta"><span>{pitch.sportName} · {categoryPitches.length} sân con</span><span>Đang hoạt động</span></div>
                    <div className="home-venue-price"><strong>Từ {vnd(minPrice)}<small> / giờ</small></strong><span>Giá từ hệ thống</span></div>
                    <Link className="home-venue-link" href={`/tim-san?sanId=${pitch.id}`}>Chọn sân con <span aria-hidden="true">→</span></Link>
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>

        <section className="home-guide-section" id="huong-dan">
          <div className="home-section home-guide-inner">
            <div className="home-section-heading">
              <div><span className="home-section-eyebrow">Hướng dẫn</span><h2>Tìm sân trong 3 bước</h2></div>
              <Link className="home-view-all" href="/huong-dan">Xem hướng dẫn <span aria-hidden="true">→</span></Link>
            </div>
            <div className="home-guide-grid">
              <article><span className="home-guide-number">01</span><div><h3>Chọn môn &amp; khu vực</h3><p>Lọc sân bóng đá theo khu vực gần bạn. Xem địa chỉ và mức giá được cập nhật.</p></div></article>
              <article><span className="home-guide-number">02</span><div><h3>Chọn ngày &amp; khung giờ</h3><p>Kiểm tra khung giờ còn trống trên trang tìm sân và so sánh thông tin.</p></div></article>
              <article><span className="home-guide-number">03</span><div><h3>Đăng nhập để tiếp tục</h3><p>Đăng nhập để truy cập tài khoản và xem lịch sử đặt sân của bạn.</p></div></article>
            </div>
          </div>
        </section>

        <section className="home-pro-section" id="phan-mem">
          <div className="home-pro-inner">
            <div className="home-pro-copy">
              <span className="home-section-eyebrow">Phần mềm quản lý</span>
              <h2>FAGLEAGUE247 Pro<br /><span>cho chủ sân</span></h2>
              <p>Tìm hiểu các công cụ quản lý sân và lịch đặt dành cho chủ sân.</p>
              <Link className="home-pro-button" href="/phan-mem">Tìm hiểu phần mềm <span aria-hidden="true">→</span></Link>
            </div>
            <div className="home-pro-features">
              <article><span aria-hidden="true">◷</span><div><h3>Quản lý lịch đặt</h3><p>Theo dõi các lịch đặt sân trên hệ thống.</p></div></article>
              <article><span aria-hidden="true">▥</span><div><h3>Theo dõi hoạt động</h3><p>Tra cứu thông tin quản lý sân tập trung.</p></div></article>
              <article><span aria-hidden="true">♙</span><div><h3>Thông tin khách hàng</h3><p>Quản lý thông tin và lịch sử khách hàng.</p></div></article>
            </div>
          </div>
        </section>

        <section className="home-section home-reviews" id="danh-gia">
          <div className="home-section-heading">
            <div><span className="home-section-eyebrow">Đánh giá người chơi</span><h2>Chia sẻ trải nghiệm thực tế</h2></div>
            <Link className="home-view-all" href="/danh-gia">Trang đánh giá <span aria-hidden="true">→</span></Link>
          </div>
          <p className="home-review-disclaimer">Đánh giá do tài khoản người dùng gửi; chưa xác minh người viết đã đặt sân.</p>
          <LiveReviews compact />
        </section>

        <section className="home-contact-section" id="lien-he">
          <div className="home-contact-inner">
            <div className="home-contact-copy">
              <span className="home-section-eyebrow">Liên hệ</span>
              <h2>Cần hỗ trợ<br />hoặc muốn hợp tác?</h2>
              <p>Gửi thông tin cho FAGLEAGUE247 về sân bóng, tài khoản hoặc nhu cầu hợp tác.</p>
              <div className="home-contact-details">
                <a href="tel:0913217102"><span aria-hidden="true">☎</span><span><small>Hotline</small><strong>091 321 7102</strong><small>8:00 – 22:00</small></span></a>
                <a href="mailto:nguyentranngocthuong376@gmail.com"><span aria-hidden="true">✉</span><span><small>Email</small><strong>nguyentranngocthuong376@gmail.com</strong></span></a>
              </div>
            </div>
            <form className="home-contact-form" action="mailto:nguyentranngocthuong376@gmail.com" method="post" encType="text/plain">
              <label>Họ tên<input name="Họ tên" placeholder="Nhập họ tên của bạn" required /></label>
              <label>Số điện thoại<input name="Số điện thoại" type="tel" placeholder="Nhập số điện thoại" required /></label>
              <label>Bạn là<select name="Vai trò" defaultValue="Người chơi — cần đặt sân"><option>Người chơi — cần đặt sân</option><option>Chủ sân — muốn gia nhập</option><option>Đối tác doanh nghiệp</option></select></label>
              <label>Nội dung<textarea name="Nội dung" rows={3} placeholder="Bạn cần hỗ trợ điều gì?" required /></label>
              <button type="submit">Gửi yêu cầu qua email <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>
      </main>

      <style>{`
        .home-page{--home-red:#be123c;--home-deep:#4c0519;--home-pink:#ffe4e6;--home-ink:#0f172a;--home-muted:#64748b;--home-line:#e2e8f0;background:#fff;max-width:none;width:100%;margin:0 auto;padding:0}
        .home-hero{position:relative;overflow:hidden;background:radial-gradient(ellipse at 74% 48%,rgba(244,63,94,.26),transparent 34%),linear-gradient(118deg,#3f0715 0%,#881337 52%,#0f172a 100%);color:#fff}
        .home-hero-inner{max-width:1240px;min-height:610px;margin:auto;padding:64px 34px 72px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:38px}
        .home-hero-copy{max-width:660px}.home-eyebrow{display:inline-flex;align-items:center;gap:9px;padding:8px 13px;border:1px solid #ffffff2b;border-radius:999px;background:#ffffff12;color:#ffe4e6;font-size:12px;font-weight:800;letter-spacing:.05em}
        .home-live-dot{width:8px;height:8px;border-radius:50%;background:#fb7185;box-shadow:0 0 12px #fb7185}
        .home-hero h1{margin:24px 0 16px;font-size:clamp(46px,5.8vw,70px);line-height:1.03;letter-spacing:-3.2px;color:#fff}
        .home-hero h1 span{color:#fda4af}.home-hero-copy>p{max-width:600px;color:#ffe4e6;font-size:15px;line-height:1.85}
        .home-hero-actions{display:flex;align-items:center;gap:24px;margin-top:27px}.home-primary-button{display:inline-flex;align-items:center;gap:12px;padding:14px 19px;border-radius:11px;background:#fff;color:#881337;text-decoration:none;font-size:14px;font-weight:850;box-shadow:0 10px 25px #1e061433}
        .home-text-link{color:#fff;text-decoration:none;font-size:13px;font-weight:750}.home-text-link span{margin-left:5px}
        .home-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:46px;padding-top:22px;border-top:1px solid #ffffff30}
        .home-stats div{display:grid;gap:5px}.home-stats strong{font-size:22px;color:#fff}.home-stats span{color:#fecdd3;font-size:10px;line-height:1.4}
        .home-hero-visual{position:relative;min-height:390px;display:grid;place-items:center}.home-stadium-glow{position:absolute;width:85%;height:75%;border-radius:50%;background:#fb71851c;filter:blur(36px)}
        .home-field{position:relative;width:min(100%,480px);aspect-ratio:1.28;border:2px solid #ffffff8a;border-radius:28px;transform:perspective(700px) rotateX(12deg) rotateZ(-4deg);background:linear-gradient(145deg,#19734a,#0b422f);box-shadow:0 35px 65px #1f071d70;overflow:hidden}
        .home-field:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,#ffffff08 0 12.5%,transparent 12.5% 25%)}
        .home-field-line{position:absolute;background:#ffffff85}.home-field-center{left:50%;top:0;bottom:0;width:2px}
        .home-field-circle{position:absolute;left:50%;top:50%;width:34%;aspect-ratio:1;border:2px solid #ffffff85;border-radius:50%;transform:translate(-50%,-50%)}
        .home-field-box{position:absolute;top:27%;width:15%;height:46%;border:2px solid #ffffff85}.home-field-box-left{left:-1px;border-left:0}.home-field-box-right{right:-1px;border-right:0}
        .home-football{position:absolute;left:49%;top:47%;font-size:clamp(70px,10vw,116px);transform:translate(-50%,-50%) rotate(15deg);filter:drop-shadow(0 13px 9px #071b1280)}
        .home-visual-caption{position:absolute;right:2%;bottom:3%;color:#fecdd3;font-size:10px;font-weight:850;letter-spacing:.22em}
        .home-search-wrap{position:relative;z-index:2;margin:-37px auto 0;padding:0 24px}
        .home-search-card{max-width:1160px;margin:auto;padding:23px 25px;border:1px solid #f1d7de;border-radius:17px;background:#fff;box-shadow:0 22px 56px #3f07151c}
        .home-search-heading{display:flex;align-items:center;gap:13px;margin-bottom:19px}.home-search-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#fff1f2;color:#be123c;font-size:27px}
        .home-search-heading h2{font-size:18px;color:#0f172a}.home-search-heading p{margin-top:3px;color:#64748b;font-size:12px}
        .home-search-fields{display:grid;grid-template-columns:1.05fr 1.15fr 1fr auto;gap:13px;align-items:end}
        .home-search-fields label,.home-contact-form label{display:grid;gap:7px;color:#475569;font-size:11px;font-weight:800}
        .home-search-fields select,.home-search-fields input,.home-contact-form input,.home-contact-form select,.home-contact-form textarea{min-height:44px;width:100%;border:1px solid #e2e8f0;border-radius:9px;background:#fff;padding:10px 12px;color:#1e293b;font:inherit;font-size:12px}
        .home-search-fields button,.home-contact-form button{min-height:44px;border:0;border-radius:9px;padding:0 19px;background:linear-gradient(100deg,#9f1239,#e11d48);color:#fff;font:inherit;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap}
        .home-search-note{margin:12px 0 0 55px;color:#94a3b8;font-size:10px}
        .home-section{max-width:1160px;margin:auto;padding:76px 24px}
        .home-section-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:25px}
        .home-section-eyebrow{color:#be123c;font-size:11px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
        .home-section-heading h2{margin:8px 0 0;color:#0f172a;font-size:clamp(26px,3.6vw,36px);letter-spacing:-1px}
        .home-section-heading>p{max-width:370px;color:#64748b;font-size:12px;line-height:1.7}
        .home-view-all{display:inline-flex;align-items:center;gap:8px;color:#9f1239;text-decoration:none;font-size:12px;font-weight:850;white-space:nowrap}
        .home-sport-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
        .home-sport-card{position:relative;display:grid;gap:8px;min-height:157px;padding:19px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;color:#0f172a;text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
        .home-sport-active:hover{transform:translateY(-3px);box-shadow:0 14px 28px #88133714;border-color:#fda4af}
        .home-sport-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#fff1f2;font-size:22px}
        .home-sport-title{font-size:15px;font-weight:850}.home-sport-detail{color:#64748b;font-size:10px}
        .home-sport-arrow{position:absolute;right:17px;top:19px;color:#be123c;font-size:17px}
        .home-sport-disabled{background:#f8fafc;color:#475569}.home-coming-soon{position:absolute;right:12px;top:14px;padding:5px 8px;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:9px;font-weight:800}
        .home-featured{padding-top:32px}.home-venue-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
        .home-venue-card{overflow:hidden;border:1px solid #e2e8f0;border-radius:16px;background:#fff;transition:transform .2s ease,box-shadow .2s ease}
        .home-venue-card:hover{transform:translateY(-3px);box-shadow:0 16px 32px #0f172a12}
        .home-venue-image{position:relative;display:grid;place-items:center;height:190px;overflow:hidden;background:#0f172a;color:#ffe4e6;text-decoration:none}
        .home-venue-image>img{position:absolute;z-index:0;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
        .home-venue-image.sport-illustration{overflow:hidden;background:radial-gradient(ellipse at 50% 120%,#ffffff24 0 40%,transparent 41%),linear-gradient(135deg,#0f766e,#134e4a)}
        .home-venue-image.sport-illustration:before,.home-venue-image.sport-illustration:after{position:absolute;content:"";border:1px solid #ffffff50;pointer-events:none}
        .home-venue-image.sport-illustration:before{inset:18px 24px;border-radius:10px}
        .home-venue-image.sport-illustration:after{top:18px;bottom:18px;left:50%;border-width:0 0 0 1px}
        .sport-illustration-icon{font-size:76px;filter:drop-shadow(0 8px 12px #052e2b55)}
        .home-venue-size{position:absolute;z-index:1;left:13px;bottom:12px;padding:6px 9px;border-radius:999px;background:#0f172acc;color:#fff;font-size:10px;font-weight:800}
        .home-venue-image-note{position:absolute;z-index:1;right:12px;top:12px;padding:5px 8px;border-radius:999px;background:#0f172ab8;color:#fff;font-size:9px;font-weight:750}
        .home-venue-body{padding:17px}.home-venue-address{display:block;overflow:hidden;color:#64748b;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
        .home-venue-body h3{margin:8px 0 11px;font-size:17px}.home-venue-body h3 a{color:#0f172a;text-decoration:none}
        .home-venue-meta{display:flex;gap:7px}.home-venue-meta span{padding:5px 8px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:9px;font-weight:750}
        .home-venue-price{display:flex;align-items:end;justify-content:space-between;gap:8px;margin:15px 0;padding-bottom:14px;border-bottom:1px solid #f1f5f9}
        .home-venue-price strong{color:#9f1239;font-size:16px}.home-venue-price small{color:#64748b;font-size:10px;font-weight:500}.home-venue-price>span{color:#94a3b8;font-size:9px}
        .home-venue-link{display:flex;justify-content:space-between;color:#9f1239;text-decoration:none;font-size:11px;font-weight:850}
        .home-empty,.home-error{padding:24px;border:1px solid #e2e8f0;border-radius:13px;color:#64748b;background:#fff;font-size:13px}.home-error{color:#9f1239}
        .home-guide-section{background:#fff7f8;border-top:1px solid #fff1f2;border-bottom:1px solid #fff1f2}
        .home-guide-inner{padding-top:68px;padding-bottom:68px}
        .home-guide-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .home-guide-grid article{display:flex;gap:13px;padding:19px;border:1px solid #f3d9df;border-radius:14px;background:#fff}
        .home-guide-number{flex:0 0 37px;display:grid;place-items:center;width:37px;height:37px;border-radius:11px;background:#ffe4e6;color:#9f1239;font-size:12px;font-weight:900}
        .home-guide-grid h3{margin:2px 0 7px;color:#0f172a;font-size:13px}.home-guide-grid p{color:#64748b;font-size:11px;line-height:1.7}
        .home-pro-section{margin:24px auto 0;max-width:1160px;padding:0 24px}
        .home-pro-inner{display:grid;grid-template-columns:.9fr 1.1fr;gap:50px;align-items:center;padding:42px;border-radius:20px;background:linear-gradient(120deg,#0f172a,#1e293b);color:#fff}
        .home-pro-copy h2{margin:12px 0;font-size:clamp(30px,4vw,42px);line-height:1.1;letter-spacing:-1px}.home-pro-copy h2 span{color:#fda4af}
        .home-pro-copy>p{max-width:390px;color:#cbd5e1;font-size:12px;line-height:1.8}
        .home-pro-copy .home-section-eyebrow{color:#fda4af}
        .home-pro-button{display:inline-flex;gap:11px;margin-top:22px;padding:12px 15px;border-radius:9px;background:#be123c;color:#fff;text-decoration:none;font-size:11px;font-weight:850}
        .home-pro-features{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .home-pro-features article{display:flex;gap:12px;padding:16px;border:1px solid #ffffff20;border-radius:12px;background:#ffffff08}
        .home-pro-features article>span{color:#fda4af;font-size:20px}.home-pro-features h3{margin:2px 0 6px;font-size:12px}.home-pro-features p{color:#cbd5e1;font-size:10px;line-height:1.6}
        .home-reviews{padding-top:76px;padding-bottom:72px}
        .home-review-disclaimer{margin:0 0 16px;color:#9f1239;font-size:12px;line-height:1.6}
        .home-contact-section{background:#fff7f8;border-top:1px solid #ffe4e6}
        .home-contact-inner{max-width:1160px;margin:auto;padding:70px 24px;display:grid;grid-template-columns:.9fr 1.1fr;gap:60px}
        .home-contact-copy h2{margin:10px 0 12px;color:#0f172a;font-size:clamp(30px,4vw,42px);line-height:1.12;letter-spacing:-1px}
        .home-contact-copy>p{max-width:410px;color:#64748b;font-size:12px;line-height:1.8}
        .home-contact-details{display:grid;gap:14px;margin-top:25px}.home-contact-details>a{display:flex;align-items:center;gap:12px;color:#0f172a;text-decoration:none}
        .home-contact-details>a>span:first-child{display:grid;place-items:center;width:39px;height:39px;border-radius:11px;background:#ffe4e6;color:#9f1239}
        .home-contact-details>a>span:last-child{display:grid;gap:2px}.home-contact-details small{color:#64748b;font-size:9px}.home-contact-details strong{font-size:12px}
        .home-contact-form{display:grid;gap:12px;padding:23px;border:1px solid #f1d7de;border-radius:15px;background:#fff;box-shadow:0 12px 28px #8813370d}
        .home-contact-form textarea{resize:vertical}.home-contact-form button{display:flex;align-items:center;justify-content:center;gap:10px}
        @media(max-width:900px){.home-hero-inner{grid-template-columns:1fr 0.8fr;gap:10px;padding-inline:25px}.home-hero h1{font-size:clamp(42px,5.8vw,58px);letter-spacing:-2.5px}.home-stats{grid-template-columns:repeat(2,1fr);gap:13px}.home-search-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.home-search-fields button{min-height:44px}.home-sport-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-pro-inner{gap:25px;padding:30px}.home-contact-inner{gap:30px}}
        @media(max-width:640px){.home-hero-inner{grid-template-columns:1fr;min-height:0;padding:49px 20px 52px}.home-hero h1{font-size:46px;letter-spacing:-2.2px}.home-hero-copy>p{font-size:13px}.home-hero-visual{min-height:240px}.home-field{width:90%}.home-football{font-size:82px}.home-search-wrap{margin-top:-25px;padding-inline:13px}.home-search-card{padding:17px}.home-search-fields{grid-template-columns:1fr;gap:11px}.home-search-fields button{width:100%}.home-search-note{margin-left:0;line-height:1.5}.home-section{padding:55px 18px}.home-section-heading{align-items:flex-start;flex-direction:column;gap:10px}.home-section-heading>p{margin:0}.home-sport-grid,.home-venue-grid,.home-guide-grid{grid-template-columns:1fr}.home-sport-card{min-height:130px}.home-featured{padding-top:20px}.home-guide-inner{padding-top:52px;padding-bottom:52px}.home-pro-section{padding-inline:14px}.home-pro-inner{grid-template-columns:1fr;padding:25px 20px}.home-pro-features{grid-template-columns:1fr}.home-reviews{padding-top:54px;padding-bottom:54px}.home-contact-inner{grid-template-columns:1fr;padding:54px 18px;gap:25px}.home-contact-form{padding:18px}.home-stats{margin-top:30px}}
      `}</style>
    </PublicSite>
  );
}
