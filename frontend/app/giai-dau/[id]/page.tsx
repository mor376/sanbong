'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ContentPage, PublicSite } from '@/components/public-site';
import { api } from '@/lib/api';

type Tournament = {
  id: number;
  name: string;
  season: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
};

export default function TournamentDetailsPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Tournament | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Tournament>(`/api/platform/tournaments/${encodeURIComponent(params.id)}`)
      .then(setItem)
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không tải được thông tin giải đấu.'));
  }, [params.id]);

  return <PublicSite><ContentPage eyebrow="Giải đấu" title={item?.name ?? 'Thông tin giải đấu'}
    intro="Thông tin được lấy trực tiếp từ dữ liệu FAG247.">
    {error && <p className="pitch-detail-error" role="alert">{error}</p>}
    {!item && !error && <p>Đang tải thông tin giải đấu…</p>}
    {item && <>
      <section className="public-card">
        <p><strong>Mùa giải:</strong> {item.season || 'Chưa cập nhật'}</p>
        <p><strong>Thời gian:</strong> {item.startDate || 'Chưa cập nhật'} – {item.endDate || 'Chưa cập nhật'}</p>
        <p><strong>Trạng thái:</strong> {item.status}</p>
      </section>
    </>}
    <Link href="/giai-dau" className="detail-text-link">← Quay lại danh sách giải</Link>
  </ContentPage></PublicSite>;
}
