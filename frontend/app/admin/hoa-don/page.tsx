'use client';
import { useEffect, useState } from 'react';
import { api, paymentMethodLabel, vnd } from '@/lib/api';

type Invoice = {
  id: number;
  datSanId: number;
  tenSan: string;
  tenKhach: string;
  ngayDat: string;
  tongTien: number;
  ghiChu: string | null;
  daThanhToan: number;
  conLai: number;
  thanhToans: { id: number; soTien: number; phuongThuc: string; ngayThanhToan: string; trangThai: string }[];
};
export default function Invoices() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [completed, setCompleted] = useState<{ id: number; status: string }[]>([]);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState<Record<number, string>>({});
  const load = async () => {
    setError('');
    try {
      const [invoices, bookings] = await Promise.all([
        api<Invoice[]>('/api/platform/admin/invoices'),
        api<{ id: number; status: string }[]>('/api/platform/admin/bookings'),
      ]);
      setItems(invoices);
      setCompleted(bookings.filter(booking => booking.status === 'Completed'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được hóa đơn'); }
  };
  useEffect(() => { void load(); }, []);
  const createInvoice = async (id: number) => {
    setError('');
    try {
      await api(`/api/platform/admin/bookings/${id}/invoice`, { method: 'POST', body: { ghiChu: '' } });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lập được hóa đơn'); }
  };
  const pay = async (invoice: Invoice) => {
    const soTien = Number(amount[invoice.id] || invoice.conLai);
    if (!Number.isSafeInteger(soTien) || soTien < 1) {
      setError('Số tiền thanh toán phải là số nguyên dương');
      return;
    }
    setError('');
    try {
      await api(`/api/platform/admin/bookings/${invoice.datSanId}/payments`, {
        method: 'POST', body: { amount: soTien, method: 'Tiền mặt' },
      });
      setAmount({ ...amount, [invoice.id]: '' });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không ghi nhận được thanh toán'); }
  };
  const invoicedBookingIds = new Set(items.map(item => item.datSanId));
  const uninvoiced = completed.filter(item => !invoicedBookingIds.has(item.id));
  return <>
    <h1>Hóa đơn & thanh toán</h1>
    <p className="sub">Lập hóa đơn cho đơn đã hoàn thành và ghi nhận thanh toán từng phần hoặc đầy đủ.</p>
    {error && <div className="err">{error}</div>}
    <div className="card" style={{ marginBottom: 16 }}>
      <h2>Đơn hoàn thành chưa lập hóa đơn</h2>
      {uninvoiced.length === 0 ? <div className="empty">Không có đơn chờ lập hóa đơn.</div> :
        <table><thead><tr><th>Mã đơn</th><th>Trạng thái</th><th /></tr></thead><tbody>
          {uninvoiced.map(item => <tr key={item.id}><td>#{item.id}</td><td>Đã hoàn thành</td>
            <td><button className="btn" onClick={() => void createInvoice(item.id)}>Lập hóa đơn</button></td></tr>)}
        </tbody></table>}
    </div>
    <div className="card">
      <h2>Danh sách hóa đơn</h2>
      {items.length === 0 ? <div className="empty">Chưa có hóa đơn.</div> :
        <div className="admin-table-wrap"><table><thead><tr><th>Mã HĐ</th><th>Đơn</th><th>Khách</th><th>Sân / ngày</th><th className="num">Tổng</th><th className="num">Đã trả</th><th className="num">Còn lại</th><th className="admin-payment-header">Thanh toán</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <td>#{item.id}</td><td>#{item.datSanId}</td><td>{item.tenKhach}</td>
            <td>{item.tenSan}<br /><small>{item.ngayDat}</small></td>
            <td className="num">{vnd(item.tongTien)}</td><td className="num admin-payment-paid">{vnd(item.daThanhToan)}</td>
            <td className={`num ${item.conLai > 0 ? 'admin-payment-due' : 'admin-payment-settled'}`}>{vnd(item.conLai)}</td>
            <td className="admin-payment-cell">
              <span className={`admin-payment-badge ${item.conLai <= 0 ? 'is-paid' : item.daThanhToan > 0 ? 'is-partial' : 'is-due'}`}>
                {item.conLai <= 0 ? 'Đã thanh toán' : item.daThanhToan > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'}
              </span>
              {item.conLai > 0 && <div className="admin-payment-action">
              <input aria-label={`Số tiền thanh toán hóa đơn ${item.id}`} type="number" min={1} max={item.conLai} value={amount[item.id] ?? item.conLai}
                onChange={e => setAmount({ ...amount, [item.id]: e.target.value })} style={{ width: 120 }} />
              <button className="btn admin-payment-submit" onClick={() => void pay(item)}>Ghi nhận</button>
              </div>}
              {item.thanhToans.length > 0 && <div className="admin-payment-history">
                {item.thanhToans.map(payment => <span key={payment.id}>{vnd(payment.soTien)} · {paymentMethodLabel(payment.phuongThuc)}</span>)}
              </div>}
            </td>
          </tr>)}</tbody></table></div>}
    </div>
  </>;
}
