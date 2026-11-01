'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSiteAuth } from '@/components/site-auth';

type Pitch = { id: number; ten: string; categoryName?: string | null };
type Review = {
  id: number;
  sanId: number;
  tenSan: string;
  tenNguoiDung: string;
  diem: number;
  noiDung: string;
  createdAt: string;
};

export function LiveReviews({ sanId, compact = false }: { sanId?: number; compact?: boolean }) {
  const { user, authChecked } = useSiteAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [selectedPitch, setSelectedPitch] = useState(sanId ? String(sanId) : '');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mine, setMine] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const activePitchId = sanId ?? (selectedPitch ? Number(selectedPitch) : undefined);

  useEffect(() => {
    if (sanId || compact) return;
    api<Pitch[]>('/api/platform/pitches')
      .then(items => setPitches(items.filter(pitch => pitch.id)))
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không tải được danh sách sân.'));
  }, [sanId]);

  useEffect(() => {
    if (!activePitchId) {
      setMine(null);
      let active = true;
      setLoading(true);
      api<Review[]>('/api/platform/reviews')
        .then(items => { if (active) setReviews(items); })
        .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Không tải được đánh giá.'); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }
    let active = true;
    setLoading(true);
    setError('');
    const ownReview = user
      ? api<Review | null>(`/api/platform/reviews/mine?sanId=${activePitchId}`)
      : Promise.resolve(null);
    Promise.all([
      api<Review[]>(`/api/platform/reviews?sanId=${activePitchId}`),
      ownReview,
    ]).then(([items, own]) => {
      if (!active) return;
      setReviews(items);
      setMine(own);
      setRating(own?.diem ?? 5);
      setComment(own?.noiDung ?? '');
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Không tải được đánh giá.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activePitchId, user]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activePitchId) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await api<Review>(mine ? `/api/platform/reviews/${mine.id}` : '/api/platform/reviews', {
        method: mine ? 'PUT' : 'POST',
        body: { sanId: activePitchId, diem: rating, noiDung: comment },
      });
      setMine(saved);
      setMessage('Đã lưu đánh giá của bạn.');
      setReviews(current => mine
        ? current.map(review => review.id === saved.id ? saved : review)
        : [saved, ...current]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`live-reviews${compact ? ' live-reviews-compact' : ''}`}>
      {!sanId && !compact && (
        <label className="live-review-pitch">
          Chọn sân muốn đánh giá
          <select value={selectedPitch} onChange={event => setSelectedPitch(event.target.value)}>
            <option value="">Chọn sân</option>
            {pitches.map(pitch => <option key={pitch.id} value={pitch.id}>
              {pitch.categoryName ? `${pitch.categoryName} · ${pitch.ten}` : pitch.ten}
            </option>)}
          </select>
        </label>
      )}
      {user && activePitchId ? (
        <form className="live-review-form" onSubmit={submit}>
          <h3>{mine ? 'Cập nhật đánh giá của bạn' : 'Chia sẻ trải nghiệm'}</h3>
          <label>Điểm đánh giá
            <select value={rating} onChange={event => setRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} sao</option>)}
            </select>
          </label>
          <label>Nhận xét
            <textarea required minLength={3} maxLength={1000} rows={3} value={comment}
              onChange={event => setComment(event.target.value)} placeholder="Chia sẻ nhận xét về sân..." />
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : mine ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</button>
        </form>
      ) : authChecked && activePitchId ? (
        <p className="live-review-login"><Link href="/dang-nhap">Đăng nhập</Link> để gửi đánh giá.</p>
      ) : null}
      {activePitchId && reviews.length > 0 && (
        <p className="live-review-summary">
          <strong>{(reviews.reduce((total, review) => total + review.diem, 0) / reviews.length).toFixed(1)} / 5</strong>
          {' '}· {reviews.length} đánh giá
        </p>
      )}
      <div className="live-review-list">
        {loading ? <p>Đang tải đánh giá…</p> : reviews.length === 0
          ? <p>Chưa có đánh giá cho sân này. Hãy là người đầu tiên chia sẻ trải nghiệm.</p>
          : reviews.slice(0, compact ? 3 : undefined).map(review => (
            <article className="live-review-card" key={review.id}>
              {!sanId && <Link href={`/san-bong/${review.sanId}`}>{review.tenSan}</Link>}
              <div className="live-review-stars" aria-label={`${review.diem} trên 5 sao`}>
                {'★'.repeat(review.diem)}{'☆'.repeat(5 - review.diem)}
              </div>
              <p>{review.noiDung}</p>
              <footer><strong>{review.tenNguoiDung}</strong><time>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</time></footer>
            </article>
          ))}
      </div>
      <p className="live-review-disclaimer">Đánh giá do tài khoản người dùng gửi; chưa xác minh người viết đã đặt sân.</p>
      {error && <p className="live-review-error" role="alert">{error}</p>}
      {message && <p className="live-review-success" role="status">{message}</p>}
    </section>
  );
}
