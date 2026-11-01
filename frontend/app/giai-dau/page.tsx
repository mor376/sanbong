'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ContentPage, PublicSite } from '@/components/public-site';
import { api } from '@/lib/api';

type Tournament = {
  id: number;
  name: string;
  season: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'Upcoming' | 'Ongoing' | 'Finished';
};

const STATUS: Record<Tournament['status'], string> = {
  Upcoming: 'Sắp diễn ra',
  Ongoing: 'Đang diễn ra',
  Finished: 'Đã kết thúc',
};

export default function TournamentPage() {
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api<Tournament[]>('/api/platform/tournaments')
      .then(setItems)
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không tải được giải đấu.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicSite>
      <ContentPage
        eyebrow="Giải đấu"
        title="Kết nối cộng đồng bóng đá"
        intro="Theo dõi các giải đấu bóng đá được cập nhật trực tiếp từ ban tổ chức."
      >
        {error && <p className="pitch-detail-error" role="alert">{error}</p>}
        {loading && <p>Đang tải giải đấu…</p>}
        {!loading && !error && items.length === 0 && <section className="public-card"><h2>Chưa có giải đấu</h2><p>Các giải đấu mới sẽ xuất hiện tại đây khi được ban tổ chức đăng tải.</p></section>}
        {!loading && !error && items.length > 0 && <section className="tournament-grid">
          {items.map(item => <article className="tournament-card" key={item.id}>
          <div className="tournament-image-placeholder" aria-hidden="true">🏆</div>
            <div className="tournament-card-body">
            <span className={`tournament-status ${item.status}`}>{STATUS[item.status]}</span>
            <h2>{item.name}</h2><p>{item.season || 'Chưa cập nhật mùa giải'}</p>
            <p>{item.startDate || 'Chưa có ngày'} – {item.endDate || 'Chưa có ngày'}</p>
              <Link href={`/giai-dau/${item.id}`}>Xem thông tin giải →</Link>
            </div>
          </article>)}
        </section>}
        <section className="public-card">
          <h2>Bạn tổ chức giải đấu?</h2>
          <p>Gửi thông tin để đội ngũ FAGLEAGUE247 trao đổi về việc đăng tải giải đấu.</p>
          <Link href="/lien-he">Liên hệ với chúng tôi →</Link>
        </section>
      </ContentPage>
    </PublicSite>
  );
}
