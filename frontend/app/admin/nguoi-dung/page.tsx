'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, vnd } from '@/lib/api';
import { Pager } from '@/lib/ui';

export default function Users() {
  const [q, setQ] = useState(''), [trang, setTrang] = useState(0), [p, setP] = useState<any>();
  const [selected, setSelected] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [newPass, setNewPass] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [me, setMe] = useState<any>(null);

  const isSelfSelected = !!selected && !!me && Number(selected.id) === Number(me.id);

  const load = useCallback(() => {
    api(`/api/admin/nguoi-dung?q=${encodeURIComponent(q)}&trang=${trang}&kichThuoc=15`).then(setP);
  }, [q, trang]);

  useEffect(load, [load]);
  useEffect(() => { api('/api/auth/me').then(setMe).catch(() => setMe(null)); }, []);

  const ensureCurrentUser = useCallback(async () => {
    if (me) return me;
    try {
      const current = await api('/api/auth/me');
      setMe(current);
      return current;
    } catch {
      setMe(null);
      return null;
    }
  }, [me]);

  const toggle = async (u: any) => {
    setError('');
    setToast('');
    try { await api(`/api/admin/nguoi-dung/${u.id}/trang-thai`, { method: 'PUT', body: { status: !u.status } }); load(); }
    catch (e: any) { setError(e.message); }
  };

  const closeDetail = () => {
    setSelected(null);
    setHistory([]);
    setNewPass('');
    setCurrentPass('');
    setToast('');
    setError('');
  };

  const openDetail = async (u: any) => {
    const currentUser = await ensureCurrentUser();
    setSelected(u);
    setHistory([]);
    setNewPass('');
    setCurrentPass('');
    setToast('');
    setError('');
    try {
      const h = await api(`/api/platform/admin/users/${u.id}/bookings`);
      setHistory(h || []);
      if (currentUser && Number(u.id) === Number(currentUser.id)) {
        setMe(currentUser);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const changePassword = async () => {
    setToast('');
    setError('');
    if (!selected || !newPass.trim()) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPass.trim().length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (me && selected.id === me.id && !currentPass.trim()) {
      setError('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu của chính bạn');
      return;
    }
    try {
      const body: Record<string, string> = { matKhauMoi: newPass.trim() };
      if (currentPass.trim()) body.matKhauCu = currentPass.trim();
      const result = await api(`/api/admin/nguoi-dung/${selected.id}/doi-mat-khau`, {
        method: 'PUT',
        body,
      });
      setToast(result.message || 'Đổi mật khẩu thành công');
      setNewPass('');
      setCurrentPass('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return <>
    <h1>Người dùng</h1>
    <p className="sub">Quản lý tài khoản, khóa tài khoản và xem lịch sử đặt sân của từng người dùng.</p>
    <div className="bar"><input placeholder="Tìm theo tên đăng nhập, họ tên, email" style={{ minWidth: 300 }} value={q} onChange={e => { setTrang(0); setQ(e.target.value); }} /></div>
    <div className="card">{!p ? 'Đang tải…' : p.noiDung.length === 0 ? <div className="empty">Không tìm thấy người dùng nào.</div> :
      <table><thead><tr><th>Tài khoản</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th /></tr></thead><tbody>
        {p.noiDung.map((u: any) => <tr key={u.id}><td>{u.username}</td><td>{u.hoTen}</td><td>{u.email}</td><td>{u.soDienThoai}</td><td>{u.vaiTro}</td>
          <td><div className="acts">
            <button className="btn ghost" onClick={() => openDetail(u)}>Chi tiết</button>
            <button className={`btn ${u.status ? 'bad' : 'ok'}`} onClick={() => toggle(u)}>{u.status ? 'Khoá' : 'Mở khoá'}</button>
          </div></td></tr>)}</tbody></table>}
      <Pager p={p} set={setTrang} /></div>

    {error && <div className="err" style={{ margin: '12px 0' }}>{error}</div>}

    {selected && <div className="modal" onClick={closeDetail}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selected.hoTen}</h2>
          <button className="btn ghost" onClick={closeDetail}>Đóng</button>
        </div>

        <div className="user-detail-grid">
          <div className="card mini-card">
            <h3>Thông tin</h3>
            <p><strong>Username:</strong> {selected.username}</p>
            <p><strong>Email:</strong> {selected.email}</p>
            <p><strong>SĐT:</strong> {selected.soDienThoai || 'Chưa cập nhật'}</p>
            <p><strong>Vai trò:</strong> {selected.vaiTro}</p>
            <div className="detail-actions">
              <button className={`btn ${selected.status ? 'bad' : 'ok'}`} onClick={() => toggle(selected)}>{selected.status ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}</button>
            </div>
          </div>

          <div className="card mini-card">
            <h3>Đổi mật khẩu</h3>
            <div className="stack">
              {isSelfSelected && (
                <>
                  <input type="password" placeholder="Mật khẩu hiện tại" value={currentPass} onChange={e => setCurrentPass(e.target.value)} />
                </>
              )}
              <input type="password" placeholder="Nhập mật khẩu mới" value={newPass} onChange={e => setNewPass(e.target.value)} />
              <button className="btn" onClick={changePassword}>Cập nhật</button>
              {toast && <div className="success-message">{toast}</div>}
              {error && <div className="err">{error}</div>}
            </div>
          </div>
        </div>

        <div className="card mini-card full-width">
          <h3>Lịch sử đặt sân</h3>
          {history.length === 0 ? <div className="empty">Khách hàng chưa có lịch sử đặt sân.</div> : <table>
            <thead><tr><th>Sân</th><th>Ngày</th><th>Giờ</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {history.map((d: any) => <tr key={d.id}><td>{d.tenSan}</td><td>{d.ngay?.split('-').reverse().join('/')}</td><td>{d.gioBatDau?.slice(0,5)} - {d.gioKetThuc?.slice(0,5)}</td><td className="num">{vnd(d.tongTien)}</td><td><span className={`badge ${d.trangThai}`}>{d.trangThai}</span></td></tr>)}
            </tbody>
          </table>}
        </div>
      </div>
    </div>}
  </>;
}
