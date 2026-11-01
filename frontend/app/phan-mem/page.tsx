import Link from 'next/link';
import { ContentPage, PublicSite } from '@/components/public-site';
import { OwnerApplicationForm } from '@/components/owner-application-form';

const features = [
  ['⌕', 'Tìm kiếm linh hoạt', 'Tra cứu sân theo tên, địa chỉ, khu vực và quy mô sân để nhanh chóng tìm lựa chọn phù hợp.'],
  ['◷', 'Kiểm tra khung giờ', 'Chọn ngày và giờ mong muốn để kiểm tra sân còn trống, lịch đã đặt và thời gian mở cửa.'],
  ['₫', 'Giá rõ ràng', 'Xem giá theo giờ trước khi gửi yêu cầu; mức giá cao điểm được tính theo cấu hình của từng sân.'],
  ['▤', 'Quản lý lịch đặt', 'Người chơi theo dõi lịch sử đặt sân; quản trị viên có thể xác nhận, xử lý và tìm kiếm đơn đặt.'],
  ['⚙', 'Quản lý sân tập trung', 'Khu vực quản trị hỗ trợ cập nhật thông tin, giá và trạng thái hoạt động của sân.'],
  ['▧', 'Theo dõi hoạt động', 'Trang tổng quan quản trị hiển thị các chỉ số đơn đặt và doanh thu theo dữ liệu hiện có.'],
];

export default function SoftwarePage() {
  return (
    <PublicSite>
      <ContentPage
        eyebrow="Nền tảng FAGLEAGUE247"
        title="Công cụ cho người chơi và chủ sân"
        intro="Một giao diện tập trung để tra cứu sân bóng, quản lý tài khoản và theo dõi các dữ liệu được hệ thống hỗ trợ."
      >
        <section className="detail-product-hero">
          <div className="detail-product-copy">
            <span className="detail-panel-kicker">Một nơi cho cả hai phía</span>
            <h2>Từ lúc tìm sân đến khi quản lý lịch đặt</h2>
            <p>FAGLEAGUE247 kết nối trải nghiệm tìm sân của người chơi với công cụ quản trị dành cho đội ngũ vận hành. Nội dung và giá sân được tải từ dữ liệu đang có trên hệ thống.</p>
            <div className="detail-actions">
              <Link className="public-link-button" href="/tim-san">Khám phá sân bóng →</Link>
              <Link className="detail-text-link" href="/huong-dan">Xem cách sử dụng</Link>
            </div>
          </div>
          <div className="detail-product-preview" aria-label="Minh hoạ giao diện quản lý">
            <div className="detail-preview-bar"><span /><span /><span /><b>FAG LEAGUE · QUẢN LÝ SÂN</b></div>
            <div className="detail-preview-body">
              <div className="detail-preview-sidebar"><i /><i /><i /><i /></div>
              <div className="detail-preview-content">
                <strong>Tổng quan</strong>
                <div className="detail-preview-stats"><span><small>Đơn đặt hôm nay</small><b>Quản lý lịch</b></span><span><small>Trạng thái</small><b>Đang hoạt động</b></span></div>
                <div className="detail-preview-row"><i /><span>Sân bóng · Lịch đặt</span><b>✓</b></div>
                <div className="detail-preview-row"><i /><span>Khách hàng · Báo cáo</span><b>→</b></div>
              </div>
            </div>
          </div>
        </section>
        <section className="detail-feature-section">
          <div className="detail-heading">
            <span className="detail-panel-kicker">Tính năng chính</span>
            <h2>Công cụ rõ ràng, thao tác tập trung</h2>
            <p>Các chức năng phản ánh đúng dữ liệu và nghiệp vụ hiện có trong hệ thống.</p>
          </div>
          <div className="detail-feature-grid">
            {features.map(([icon, title, description], index) => (
              <article className="detail-feature-card" key={title}>
                <span className="detail-icon" aria-hidden="true">{icon}</span>
                <span className="detail-feature-index">0{index + 1}</span>
                <h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="detail-audience-grid">
          <article className="detail-audience-card">
            <span className="detail-panel-kicker">Dành cho người chơi</span>
            <h2>Tìm nhanh. Đặt dễ.</h2>
            <p>Tìm sân bóng đá theo khu vực, quy mô và lịch trống. Tạo tài khoản để đặt sân, quản lý hồ sơ và theo dõi các đơn đã gửi.</p>
            <Link className="detail-text-link" href="/tim-san">Bắt đầu tìm sân <span aria-hidden="true">→</span></Link>
          </article>
          <article className="detail-audience-card detail-audience-dark">
            <span className="detail-panel-kicker">Dành cho quản trị viên</span>
            <h2>Kiểm soát vận hành</h2>
            <p>Xử lý đơn đặt, cập nhật sân, tra cứu người dùng và xem thống kê tập trung trong khu vực quản trị.</p>
            <Link className="detail-text-link" href="/dang-nhap">Đăng nhập quản trị <span aria-hidden="true">→</span></Link>
          </article>
        </section>
        <section className="detail-cta">
          <div><span className="detail-panel-kicker">Cần trao đổi về giải pháp?</span><h2>Đội ngũ FAGLEAGUE247 sẵn sàng hỗ trợ</h2><p>Liên hệ để trao đổi về việc sử dụng nền tảng và nhu cầu của bạn.</p></div>
          <Link className="public-link-button" href="/lien-he">Liên hệ với chúng tôi →</Link>
        </section>
        <section className="public-card owner-application" id="dang-ky-chu-san">
          <div><span className="detail-panel-kicker">Dành cho chủ sân</span><h2>Đăng ký để được tư vấn</h2><p>Để lại thông tin sân. Yêu cầu sẽ được lưu trên hệ thống để đội ngũ liên hệ và hỗ trợ bạn.</p></div>
          <OwnerApplicationForm />
        </section>
      </ContentPage>
    </PublicSite>
  );
}
