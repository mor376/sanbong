import Link from 'next/link';
import { ContentPage, PublicSite } from '@/components/public-site';

export default function ContactPage() {
  return (
    <PublicSite>
      <ContentPage
        eyebrow="Liên hệ"
        title="Chúng tôi sẵn sàng hỗ trợ"
        intro="Liên hệ với FAGLEAGUE247 về thông tin sân bóng, tài khoản hoặc nhu cầu hợp tác."
      >
        <section className="detail-contact-hero">
          <div><span className="detail-panel-kicker">FAGLEAGUE247 luôn lắng nghe</span><h2>Bạn cần hỗ trợ điều gì?</h2><p>Chọn cách liên hệ thuận tiện nhất. Để được hỗ trợ nhanh hơn, hãy mô tả rõ vấn đề và thời điểm bạn gặp sự cố.</p></div>
          <div className="detail-contact-orbit" aria-hidden="true"><span>☎</span><i /><i /><i /></div>
        </section>
        <section className="detail-contact-grid">
          <a className="detail-contact-card" href="tel:0913217102"><span className="detail-icon" aria-hidden="true">☎</span><span className="detail-panel-kicker">Hotline hỗ trợ</span><strong>091 321 7102</strong><p>Gọi trực tiếp để được trao đổi và hướng dẫn.</p><span className="detail-text-link">Gọi ngay <span aria-hidden="true">→</span></span></a>
          <a className="detail-contact-card" href="mailto:nguyentranngocthuong376@gmail.com"><span className="detail-icon" aria-hidden="true">✉</span><span className="detail-panel-kicker">Email</span><strong>nguyentranngocthuong376@gmail.com</strong><p>Gửi thông tin chi tiết hoặc đề xuất hợp tác.</p><span className="detail-text-link">Soạn email <span aria-hidden="true">→</span></span></a>
          <Link className="detail-contact-card" href="/tim-san"><span className="detail-icon" aria-hidden="true">⌕</span><span className="detail-panel-kicker">Tự tra cứu</span><strong>Tìm sân bóng</strong><p>Xem sân, giá và khung giờ phù hợp ngay trên hệ thống.</p><span className="detail-text-link">Mở trang tìm sân <span aria-hidden="true">→</span></span></Link>
        </section>
        <section className="detail-contact-lower">
          <div className="detail-contact-guidance">
            <span className="detail-panel-kicker">Để chúng tôi hỗ trợ tốt hơn</span><h2>Thông tin nên chuẩn bị</h2>
            <ul><li>Họ tên và cách thuận tiện để liên hệ lại.</li><li>Mô tả ngắn gọn vấn đề hoặc nhu cầu của bạn.</li><li>Nếu liên quan đến lịch đặt, ghi ngày và mã đơn (nếu có).</li></ul>
            <p className="detail-note">Không gửi mật khẩu, mã xác thực hoặc thông tin thanh toán qua email.</p>
          </div>
          <form className="detail-contact-form" action="mailto:nguyentranngocthuong376@gmail.com" method="post" encType="text/plain">
            <span className="detail-panel-kicker">Gửi yêu cầu</span><h2>Để lại nội dung cần hỗ trợ</h2>
            <label>Họ tên<input name="Ho ten" autoComplete="name" placeholder="Tên của bạn" required /></label>
            <label>Email liên hệ<input name="Email" type="email" autoComplete="email" placeholder="ban@example.com" required /></label>
            <label>Chủ đề<select name="Chu de" defaultValue="Hỗ trợ sử dụng"><option>Hỗ trợ sử dụng</option><option>Thông tin sân bóng</option><option>Hợp tác chủ sân</option><option>Góp ý khác</option></select></label>
            <label>Nội dung<textarea name="Noi dung" rows={4} placeholder="Mô tả nội dung bạn cần hỗ trợ..." required /></label>
            <button type="submit">Mở email để gửi yêu cầu <span aria-hidden="true">→</span></button>
            <small>Biểu mẫu sẽ mở ứng dụng email trên thiết bị của bạn để gửi thư.</small>
          </form>
        </section>
      </ContentPage>
    </PublicSite>
  );
}
