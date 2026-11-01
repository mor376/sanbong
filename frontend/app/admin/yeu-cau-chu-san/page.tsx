'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Application = {
  id: number;
  hoTen: string;
  soDienThoai: string;
  email: string | null;
  tenSan: string;
  diaChiSan: string;
  ghiChu: string | null;
  trangThai: 'MOI' | 'DANG_XU_LY' | 'DA_LIEN_HE' | 'TU_CHOI';
  createdAt: string;
};

const LABELS: Record<Application['trangThai'], string> = {
  MOI: 'Mới', DANG_XU_LY: 'Đang xử lý', DA_LIEN_HE: 'Đã liên hệ', TU_CHOI: 'Từ chối',
};

export default function OwnerApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setItems(await api<Application[]>('/api/admin/yeu-cau-chu-san')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được yêu cầu.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const updateStatus = async (item: Application, trangThai: Application['trangThai']) => {
    setError('');
    try {
      await api(`/api/admin/yeu-cau-chu-san/${item.id}/trang-thai`, {
        method: 'PUT', body: { trangThai },
      });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không cập nhật được trạng thái.'); }
  };

  return <>
    <div><h1>Yêu cầu chủ sân</h1><p className="sub">Các yêu cầu hợp tác được gửi từ biểu mẫu công khai.</p></div>
    {error && <div className="err" role="alert">{error}</div>}
    <div className="card">
      {loading ? <div className="empty">Đang tải…</div> : items.length === 0 ? <div className="empty">Chưa có yêu cầu đăng ký.</div> :
        <table><thead><tr><th>Người liên hệ</th><th>Sân</th><th>Ghi chú</th><th>Ngày gửi</th><th className="admin-status-header">Trạng thái</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <td><b>{item.hoTen}</b><br /><a href={`tel:${item.soDienThoai}`}>{item.soDienThoai}</a>{item.email && <><br /><a href={`mailto:${item.email}`}>{item.email}</a></>}</td>
            <td><b>{item.tenSan}</b><br />{item.diaChiSan}</td><td>{item.ghiChu || '—'}</td>
            <td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
            <td className="admin-status-cell"><select className={`admin-status-select is-${item.trangThai.toLowerCase()}`} aria-label={`Trạng thái yêu cầu ${item.id}`} value={item.trangThai}
              onChange={event => void updateStatus(item, event.target.value as Application['trangThai'])}>
              {Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></td>
          </tr>)}</tbody></table>}
    </div>
  </>;
}
