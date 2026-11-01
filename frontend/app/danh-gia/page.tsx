import { ContentPage, PublicSite } from '@/components/public-site';
import { LiveReviews } from '@/components/live-reviews';

export default function ReviewsPage() {
  return (
    <PublicSite>
      <ContentPage
        eyebrow="Đánh giá sân"
        title="Chia sẻ trải nghiệm của bạn"
        intro="Đọc và gửi đánh giá trực tiếp cho các sân bóng trên hệ thống."
      >
        <section className="public-card"><p>Mỗi tài khoản có thể gửi một đánh giá cho mỗi sân và cập nhật lại sau đó. Đánh giá hiện chưa xác minh lịch đặt.</p><LiveReviews /></section>
      </ContentPage>
    </PublicSite>
  );
}
