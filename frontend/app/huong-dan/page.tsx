import Link from 'next/link';
import { ContentPage, PublicSite } from '@/components/public-site';

const steps = [
  {
    number: '01',
    icon: '⌕',
    title: 'Tìm sân phù hợp',
    description: 'Mở trang Tìm sân. Nhập tên hoặc địa chỉ nếu bạn đã có khu vực mong muốn, hoặc để trống để xem tất cả sân.',
    tip: 'Mẹo: thử tìm theo tên đường, quận hoặc tên sân.',
  },
  {
    number: '02',
    icon: '⚽',
    title: 'Lọc theo nhu cầu',
    description: 'Chọn quy mô sân 5, 7 hoặc 11 người, khu vực và ngày chơi. Dùng bộ lọc để thu hẹp danh sách.',
    tip: 'Hiện hệ thống hỗ trợ tìm sân bóng đá.',
  },
  {
    number: '03',
    icon: '◷',
    title: 'Kiểm tra lịch trống',
    description: 'Chọn giờ bắt đầu và giờ kết thúc để xem sân phù hợp. Giá được tính theo từng giờ và có thể khác nhau trong khung giờ cao điểm.',
    tip: 'Có thể đặt từ 1 đến 4 giờ liên tiếp.',
  },
  {
    number: '04',
    icon: '✓',
    title: 'Đăng nhập và đặt sân',
    description: 'Đăng nhập hoặc đăng ký tài khoản để gửi yêu cầu đặt sân. Đơn sẽ xuất hiện trong mục Lịch đặt sân để bạn theo dõi.',
    tip: 'Đơn đặt online cần chờ sân xác nhận.',
  },
];

export default function GuidePage() {
  return (
    <PublicSite>
      <ContentPage
        eyebrow="Hướng dẫn sử dụng"
        title="Tìm sân theo cách đơn giản"
        intro="Các bước giúp bạn lọc sân và kiểm tra thông tin trước khi sắp xếp buổi chơi."
      >
        <section className="detail-steps">
          {steps.map(step => (
            <article className="detail-step" key={step.number}>
              <div className="detail-step-top">
                <span className="detail-icon" aria-hidden="true">{step.icon}</span>
                <span className="detail-step-number">{step.number}</span>
              </div>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
              <span className="detail-tip">{step.tip}</span>
            </article>
          ))}
        </section>
        <section className="detail-split">
          <div className="detail-panel detail-panel-accent">
            <span className="detail-panel-kicker">Trước khi đặt</span>
            <h2>Kiểm tra lại ngày và giờ</h2>
            <p>Đặt sân theo giờ tròn, tối đa 4 giờ liên tiếp. Hệ thống chỉ nhận lịch trong thời gian sân mở cửa và không cho đặt khung giờ đã qua.</p>
          </div>
          <div className="detail-panel">
            <span className="detail-panel-kicker">Sau khi đặt</span>
            <h2>Theo dõi trạng thái đơn</h2>
            <p>Mở mục Lịch đặt sân để xem yêu cầu của bạn. Đơn online ở trạng thái chờ cho đến khi được xác nhận; nếu cần trợ giúp, hãy liên hệ trực tiếp với đội ngũ hỗ trợ.</p>
            <Link className="detail-text-link" href="/shop/ho-so">Mở lịch đặt sân <span aria-hidden="true">→</span></Link>
          </div>
        </section>
        <section className="detail-faq">
          <div className="detail-heading">
            <span className="detail-panel-kicker">Câu hỏi thường gặp</span>
            <h2>Cần biết thêm điều gì?</h2>
          </div>
          <details><summary>Tôi có thể đặt trước bao lâu?</summary><p>Hệ thống cho phép đặt trước tối đa 30 ngày.</p></details>
          <details><summary>Mỗi lần có thể đặt tối đa bao nhiêu giờ?</summary><p>Mỗi lần đặt tối đa 4 giờ liên tiếp, theo khung giờ sân đang mở cửa.</p></details>
          <details><summary>Tôi có thể tự huỷ lịch không?</summary><p>Có. Bạn có thể huỷ lịch của mình trước giờ đá ít nhất 2 tiếng. Hãy mở lịch sử đặt sân để kiểm tra đơn.</p></details>
          <details><summary>Những môn thể thao nào đang được hỗ trợ?</summary><p>Hiện dữ liệu tìm kiếm trên hệ thống dành cho sân bóng đá; các môn khác chưa được hỗ trợ tìm kiếm.</p></details>
        </section>
        <section className="detail-cta">
          <div><span className="detail-panel-kicker">Sẵn sàng bắt đầu?</span><h2>Tìm sân cho trận đấu tiếp theo</h2><p>Khám phá các sân đang hoạt động và chọn khung giờ phù hợp.</p></div>
          <Link className="public-link-button" href="/tim-san">Đi tới trang tìm sân →</Link>
        </section>
      </ContentPage>
    </PublicSite>
  );
}
