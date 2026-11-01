'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, iso, vnd } from '@/lib/api';

type Booking = {
  id: number;
  customerName: string;
  phone: string;
  categoryName: string | null;
  subFieldName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
};

const STATUSES: Booking['status'][] = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const STATUS_LABELS: Record<Booking['status'], string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
};

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pitchCount, setPitchCount] = useState(0);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [overview, data] = await Promise.all([
        api<Record<string, number>>('/api/platform/overview'),
        api<Booking[]>('/api/platform/admin/bookings'),
      ]);
      setPitchCount(overview.subFields ?? 0);
      setBookings(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu FAG247.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pending = bookings.filter(booking => booking.status === 'Pending');
  const completed = bookings.filter(booking => booking.status === 'Completed');
  const revenue = completed.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const chart = useMemo(() => {
    const dates = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - index));
      return iso(date);
    });
    return dates.map(date => ({
      date,
      total: completed.filter(booking => booking.bookingDate === date)
        .reduce((sum, booking) => sum + booking.totalPrice, 0),
    }));
  }, [completed]);
  const chartMax = Math.max(1, ...chart.map(item => item.total));

  const changeStatus = async (booking: Booking, status: Booking['status']) => {
    setUpdatingId(booking.id);
    setError('');
    try {
      await api(`/api/platform/admin/bookings/${booking.id}/status`, {
        method: 'PUT',
        body: { status },
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không cập nhật được trạng thái đơn.');
    } finally {
      setUpdatingId(null);
    }
  };

  return <div className="dashboard">
    <header className="page-head">
      <div><span className="eyebrow">TRUNG TÂM ĐIỀU HÀNH</span><h1>Tổng quan</h1></div>
      <div className={`status-pill${error ? ' error' : ''}`}>{error ? '● Có lỗi API' : '● MySQL · FAG247'}</div>
    </header>
    <p className="sub">Theo dõi hoạt động đặt sân và tình hình kinh doanh trên hệ thống FAG247.</p>
    {error && <div className="err" role="alert">{error}</div>}
    <div className="stats">
      <div className="stat"><div className="stat-icon">⌖</div><b>{pitchCount}</b><span>Sân con</span></div>
      <div className="stat"><div className="stat-icon">⏳</div><b>{pending.length}</b><span>Đơn chờ xác nhận</span></div>
      <div className="stat"><div className="stat-icon">✅</div><b>{bookings.filter(item => item.status === 'Confirmed').length}</b><span>Đơn đã xác nhận</span></div>
      <div className="stat"><div className="stat-icon">💰</div><b>{vnd(revenue)}</b><span>Doanh thu đơn hoàn thành</span></div>
    </div>
    <div className="card">
      <div className="card-head"><h2>Đơn chờ xác nhận</h2><span className="chip">{pending.length} đơn</span></div>
      {pending.length === 0 ? <div className="empty">Không có đơn nào đang chờ.</div> :
        <div className="admin-table-wrap"><table><thead><tr><th>Khách hàng</th><th>Sân</th><th>Ngày & giờ</th><th className="num">Tổng tiền</th><th className="admin-status-header">Trạng thái</th></tr></thead>
            <tbody>{pending.map(booking => <tr key={booking.id}>
              <td><strong>{booking.customerName}</strong><br /><small>{booking.phone}</small></td>
              <td>{booking.categoryName ? <><strong>{booking.categoryName}</strong><br /><small>{booking.subFieldName}</small></> : booking.subFieldName}</td>
              <td>{booking.bookingDate} · {booking.startTime.slice(0, 5)}–{booking.endTime.slice(0, 5)}</td>
              <td className="num">{vnd(booking.totalPrice)}</td>
              <td className="admin-status-cell"><select className={`admin-status-select is-${booking.status.toLowerCase()}`} aria-label={`Trạng thái đơn ${booking.id}`} value={booking.status}
                disabled={updatingId === booking.id}
                onChange={event => void changeStatus(booking, event.target.value as Booking['status'])}>
                {STATUSES.map(status => <option value={status} key={status}>{STATUS_LABELS[status]}</option>)}
              </select></td>
            </tr>)}</tbody></table></div>}
    </div>
    <div className="card">
      <div className="card-head"><h2>Doanh thu theo ngày</h2><span className="chip soft">14 ngày</span></div>
      {chart.every(item => item.total === 0) ? <div className="empty">Chưa có đơn hoàn thành trong 14 ngày qua.</div> : <>
        <div className="chart">{chart.map(item => <div key={item.date}
          style={{ height: `${Math.max(3, (item.total / chartMax) * 100)}%` }}
          title={`${item.date}: ${vnd(item.total)}`} />)}</div>
        <div className="axis">{chart.map(item => <span key={item.date}>{item.date.slice(-2)}</span>)}</div>
      </>}
    </div>
  </div>;
}
