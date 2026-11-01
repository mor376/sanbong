import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="fl-footer">
      <div className="footer-main">
        <section className="footer-brand">
          <Link className="footer-logo" href="/shop">FAG<span>LEAGUE247</span></Link>
          <p>Nền tảng tra cứu sân bóng, kiểm tra khung giờ và quản lý lịch đặt dành cho người chơi và chủ sân.</p>
          <Link className="footer-brand-cta" href="/tim-san">Tìm sân ngay <span aria-hidden="true">→</span></Link>
        </section>

        <nav className="footer-column" aria-label="Liên kết nhanh">
          <h2>Khám phá</h2>
          <Link href="/shop">Trang chủ</Link>
          <Link href="/tim-san">Tìm sân bóng</Link>
          <Link href="/giai-dau">Giải đấu</Link>
          <Link href="/phan-mem">Phần mềm</Link>
          <Link href="/phan-mem#dang-ky-chu-san">Dành cho chủ sân</Link>
        </nav>

        <nav className="footer-column" aria-label="Hỗ trợ">
          <h2>Hỗ trợ</h2>
          <Link href="/huong-dan">Hướng dẫn đặt sân</Link>
          <Link href="/shop/ho-so">Lịch đặt sân</Link>
          <Link href="/danh-gia">Đánh giá & góp ý</Link>
          <Link href="/lien-he">Liên hệ với chúng tôi</Link>
        </nav>

        <section className="footer-column footer-contact">
          <h2>Liên hệ</h2>
          <a href="tel:0913217102"><span aria-hidden="true">☎</span><span><small>Hotline</small><strong>091 321 7102</strong></span></a>
          <a href="mailto:nguyentranngocthuong376@gmail.com"><span aria-hidden="true">✉</span><span><small>Email</small><strong>nguyentranngocthuong376@gmail.com</strong></span></a>
          <p><span aria-hidden="true">◷</span><span><small>Thời gian hỗ trợ</small><strong>8:00 – 22:00</strong></span></p>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} <strong>FAGLEAGUE247</strong>. Hệ thống đặt sân thể thao.</span>
        <span>Thông tin sân và giá được cập nhật theo dữ liệu trên hệ thống.</span>
      </div>
    </footer>
  );
}
