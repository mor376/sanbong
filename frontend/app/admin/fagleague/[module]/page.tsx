'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, paymentMethodLabel } from '@/lib/api';

type Row = Record<string, unknown>;
type Column = { key: string; label: string };
type FormField = { key: string; label: string; type?: string; required?: boolean; multiline?: boolean; options?: string[] };
type AdminBookingForm = {
  subFieldId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  fullName: string;
  phone: string;
  email: string;
  paymentMethod: string;
  note: string;
};
type BookingPitch = { id: number; ten: string; categoryName?: string | null; trangThai: string };
type ModuleConfig = {
  title: string;
  endpoint: string;
  columns: Column[];
  adminOnly?: boolean;
  slots?: boolean;
  bookingStatus?: boolean;
  fields?: FormField[];
};

const configs: Record<string, ModuleConfig> = {
  'sports-centers': { title: 'Cụm sân', endpoint: '/api/platform/sports-centers', fields: [
    { key: 'name', label: 'Tên cụm sân', required: true }, { key: 'address', label: 'Địa chỉ', required: true },
    { key: 'phone', label: 'Điện thoại' }, { key: 'email', label: 'Email', type: 'email' },
    { key: 'openTime', label: 'Giờ mở cửa', type: 'time' }, { key: 'closeTime', label: 'Giờ đóng cửa', type: 'time' },
    { key: 'rating', label: 'Đánh giá', type: 'number' }, { key: 'totalReviews', label: 'Lượt đánh giá', type: 'number' },
    { key: 'latitude', label: 'Vĩ độ', type: 'number' }, { key: 'longitude', label: 'Kinh độ', type: 'number' },
  ], columns: [
    { key: 'name', label: 'Tên cụm sân' }, { key: 'address', label: 'Địa chỉ' }, { key: 'phone', label: 'Điện thoại' },
    { key: 'email', label: 'Email' }, { key: 'openTime', label: 'Mở cửa' }, { key: 'closeTime', label: 'Đóng cửa' },
    { key: 'rating', label: 'Đánh giá' }, { key: 'totalReviews', label: 'Lượt đánh giá' },
  ] },
  sports: { title: 'Môn thể thao', endpoint: '/api/platform/sports', fields: [
    { key: 'name', label: 'Tên môn thể thao', required: true },
  ], columns: [
    { key: 'id', label: 'Mã môn' }, { key: 'name', label: 'Tên môn thể thao' },
  ] },
  'pitch-categories': { title: 'Danh mục sân', endpoint: '/api/platform/admin/pitch-categories', fields: [
    { key: 'centerId', label: 'Mã cụm sân', type: 'number', required: true },
    { key: 'sportId', label: 'Mã môn thể thao', type: 'number', required: true },
    { key: 'name', label: 'Tên danh mục', required: true },
    { key: 'playerCount', label: 'Số người', type: 'number', required: true },
  ], columns: [
    { key: 'name', label: 'Danh mục' }, { key: 'centerId', label: 'Mã cụm sân' },
    { key: 'sportId', label: 'Mã môn' }, { key: 'playerCount', label: 'Số người' },
  ] },
  subfields: { title: 'Sân con', endpoint: '/api/platform/subfields', fields: [
    { key: 'centerId', label: 'Mã cụm sân', type: 'number', required: true },
    { key: 'sportId', label: 'Mã môn thể thao', type: 'number', required: true },
    { key: 'categoryId', label: 'Mã danh mục sân', type: 'number' },
    { key: 'name', label: 'Tên sân con', required: true }, { key: 'description', label: 'Mô tả', multiline: true },
    { key: 'giaGio', label: 'Giá thường / giờ', type: 'number', required: true },
    { key: 'giaGioCaoDiem', label: 'Giá cao điểm / giờ', type: 'number', required: true },
    { key: 'status', label: 'Trạng thái', type: 'select', options: ['Active', 'Maintenance', 'Inactive'] },
  ], columns: [
    { key: 'name', label: 'Tên sân con' }, { key: 'categoryName', label: 'Danh mục' },
    { key: 'centerName', label: 'Cụm sân' }, { key: 'address', label: 'Địa chỉ' },
    { key: 'sportName', label: 'Môn thể thao' }, { key: 'giaGio', label: 'Giá thường' },
    { key: 'giaGioCaoDiem', label: 'Giá cao điểm' }, { key: 'description', label: 'Mô tả' }, { key: 'status', label: 'Trạng thái' },
  ] },
  services: { title: 'Dịch vụ', endpoint: '/api/platform/admin/services', fields: [
    { key: 'name', label: 'Tên dịch vụ', required: true }, { key: 'price', label: 'Đơn giá', type: 'number', required: true },
    { key: 'unit', label: 'Đơn vị tính', required: true },
    { key: 'status', label: 'Trạng thái', type: 'select', options: ['Đang kinh doanh', 'Ngừng kinh doanh'] },
  ], columns: [
    { key: 'name', label: 'Tên dịch vụ' }, { key: 'price', label: 'Đơn giá' },
    { key: 'unit', label: 'Đơn vị tính' }, { key: 'status', label: 'Trạng thái' },
  ] },
  promotions: { title: 'Khuyến mãi', endpoint: '/api/platform/admin/promotions', fields: [
    { key: 'name', label: 'Tên chương trình', required: true },
    { key: 'discountPercent', label: 'Phần trăm giảm', type: 'number', required: true },
    { key: 'startDate', label: 'Ngày bắt đầu', type: 'date', required: true },
    { key: 'endDate', label: 'Ngày kết thúc', type: 'date', required: true },
    { key: 'status', label: 'Trạng thái', type: 'select', options: ['Đang áp dụng', 'Ngừng áp dụng'] },
  ], columns: [
    { key: 'name', label: 'Tên chương trình' }, { key: 'discountPercent', label: 'Giảm (%)' },
    { key: 'startDate', label: 'Bắt đầu' }, { key: 'endDate', label: 'Kết thúc' }, { key: 'status', label: 'Trạng thái' },
  ] },
  staff: { title: 'Nhân viên', endpoint: '/api/platform/admin/staff', fields: [
    { key: 'fullName', label: 'Họ tên', required: true }, { key: 'phone', label: 'Điện thoại', required: true },
    { key: 'email', label: 'Email', type: 'email' }, { key: 'position', label: 'Chức vụ', required: true },
    { key: 'status', label: 'Trạng thái', type: 'select', options: ['Đang làm việc', 'Đã nghỉ'] },
  ], columns: [
    { key: 'fullName', label: 'Họ tên' }, { key: 'phone', label: 'Điện thoại' },
    { key: 'email', label: 'Email' }, { key: 'position', label: 'Chức vụ' }, { key: 'status', label: 'Trạng thái' },
  ] },
  'pricing-rules': { title: 'Quy tắc giá', endpoint: '/api/platform/pricing-rules', fields: [
    { key: 'sportId', label: 'Mã môn thể thao', type: 'number', required: true },
    { key: 'startTime', label: 'Bắt đầu', type: 'time', required: true },
    { key: 'endTime', label: 'Kết thúc', type: 'time', required: true },
    { key: 'weekend', label: 'Ngày áp dụng', type: 'select', options: ['false', 'true'] },
    { key: 'pricePerHour', label: 'Giá / giờ', type: 'number', required: true },
  ], columns: [
    { key: 'sportName', label: 'Môn thể thao' }, { key: 'startTime', label: 'Bắt đầu' }, { key: 'endTime', label: 'Kết thúc' },
    { key: 'weekend', label: 'Cuối tuần' }, { key: 'pricePerHour', label: 'Giá / giờ' },
  ] },
  'time-slots': { title: 'Khung giờ', endpoint: '/api/platform/time-slots', slots: true, columns: [
    { key: 'subFieldId', label: 'Mã sân' }, { key: 'bookingDate', label: 'Ngày' }, { key: 'startTime', label: 'Bắt đầu' },
    { key: 'endTime', label: 'Kết thúc' }, { key: 'booked', label: 'Đã đặt' },
  ] },
  teams: { title: 'Đội bóng', endpoint: '/api/platform/teams', fields: [
    { key: 'name', label: 'Tên đội bóng', required: true }, { key: 'homeGround', label: 'Sân nhà' },
    { key: 'logoUrl', label: 'Đường dẫn logo', type: 'url' }, { key: 'foundedYear', label: 'Năm thành lập', type: 'number' },
  ], columns: [
    { key: 'name', label: 'Tên đội' }, { key: 'homeGround', label: 'Sân nhà' },
    { key: 'foundedYear', label: 'Năm thành lập' }, { key: 'logoUrl', label: 'Logo' },
  ] },
  players: { title: 'Cầu thủ', endpoint: '/api/platform/players', fields: [
    { key: 'fullName', label: 'Họ tên cầu thủ', required: true }, { key: 'birthDate', label: 'Ngày sinh', type: 'date' },
    { key: 'position', label: 'Vị trí' }, { key: 'shirtNumber', label: 'Số áo', type: 'number' },
    { key: 'height', label: 'Chiều cao (cm)', type: 'number' }, { key: 'teamId', label: 'Mã đội bóng', type: 'number' },
    { key: 'status', label: 'Trạng thái', type: 'select', options: ['Active', 'Injured', 'Inactive'] },
  ], columns: [
    { key: 'fullName', label: 'Họ tên' }, { key: 'teamName', label: 'Đội bóng' }, { key: 'position', label: 'Vị trí' },
    { key: 'shirtNumber', label: 'Số áo' }, { key: 'height', label: 'Chiều cao (cm)' },
    { key: 'birthDate', label: 'Ngày sinh' }, { key: 'status', label: 'Trạng thái' },
  ] },
  tournaments: { title: 'Giải đấu', endpoint: '/api/platform/tournaments', fields: [
    { key: 'name', label: 'Tên giải đấu', required: true }, { key: 'season', label: 'Mùa giải' },
    { key: 'status', label: 'Trạng thái', type: 'select', options: ['Upcoming', 'Ongoing', 'Finished'] },
    { key: 'startDate', label: 'Ngày bắt đầu', type: 'date' }, { key: 'endDate', label: 'Ngày kết thúc', type: 'date' },
  ], columns: [
    { key: 'name', label: 'Tên giải' }, { key: 'season', label: 'Mùa giải' }, { key: 'status', label: 'Trạng thái' },
    { key: 'startDate', label: 'Bắt đầu' }, { key: 'endDate', label: 'Kết thúc' },
  ] },
  groups: { title: 'Bảng đấu', endpoint: '/api/platform/groups', fields: [
    { key: 'tournamentId', label: 'Mã giải đấu', type: 'number', required: true },
    { key: 'name', label: 'Tên bảng đấu', required: true },
  ], columns: [
    { key: 'tournamentName', label: 'Giải đấu' }, { key: 'name', label: 'Tên bảng' },
  ] },
  matches: { title: 'Trận đấu', endpoint: '/api/platform/matches', fields: [
    { key: 'tournamentId', label: 'Mã giải đấu', type: 'number', required: true },
    { key: 'homeTeamId', label: 'Mã đội nhà', type: 'number', required: true },
    { key: 'awayTeamId', label: 'Mã đội khách', type: 'number', required: true },
    { key: 'subFieldId', label: 'Mã sân con', type: 'number' },
    { key: 'matchTime', label: 'Thời gian trận', type: 'datetime-local', required: true },
    { key: 'homeScore', label: 'Bàn đội nhà', type: 'number' }, { key: 'awayScore', label: 'Bàn đội khách', type: 'number' },
    { key: 'status', label: 'Trạng thái', type: 'select', options: ['Scheduled', 'Live', 'Finished', 'Postponed'] },
  ], columns: [
    { key: 'tournamentName', label: 'Giải đấu' }, { key: 'homeTeam', label: 'Đội nhà' },
    { key: 'homeScore', label: 'Tỷ số' }, { key: 'awayTeam', label: 'Đội khách' },
    { key: 'matchTime', label: 'Thời gian' }, { key: 'subFieldName', label: 'Sân' }, { key: 'status', label: 'Trạng thái' },
  ] },
  'player-stats': { title: 'Thống kê cầu thủ', endpoint: '/api/platform/player-stats', fields: [
    { key: 'playerId', label: 'Mã cầu thủ', type: 'number', required: true },
    { key: 'matchId', label: 'Mã trận đấu', type: 'number', required: true },
    { key: 'goals', label: 'Bàn thắng', type: 'number' }, { key: 'assists', label: 'Kiến tạo', type: 'number' },
    { key: 'yellowCards', label: 'Thẻ vàng', type: 'number' }, { key: 'redCards', label: 'Thẻ đỏ', type: 'number' },
    { key: 'rating', label: 'Điểm đánh giá', type: 'number' },
  ], columns: [
    { key: 'playerName', label: 'Cầu thủ' }, { key: 'matchTime', label: 'Trận đấu' }, { key: 'goals', label: 'Bàn thắng' },
    { key: 'assists', label: 'Kiến tạo' }, { key: 'yellowCards', label: 'Thẻ vàng' },
    { key: 'redCards', label: 'Thẻ đỏ' }, { key: 'rating', label: 'Điểm' },
  ] },
  standings: { title: 'Bảng xếp hạng', endpoint: '/api/platform/standings', fields: [
    { key: 'tournamentId', label: 'Mã giải đấu', type: 'number', required: true },
    { key: 'groupId', label: 'Mã bảng (có thể trống)', type: 'number' },
    { key: 'teamId', label: 'Mã đội bóng', type: 'number', required: true },
    { key: 'matchesPlayed', label: 'Số trận', type: 'number' }, { key: 'wins', label: 'Thắng', type: 'number' },
    { key: 'draws', label: 'Hòa', type: 'number' }, { key: 'losses', label: 'Thua', type: 'number' },
    { key: 'goalsFor', label: 'Bàn thắng', type: 'number' }, { key: 'goalsAgainst', label: 'Bàn thua', type: 'number' },
    { key: 'points', label: 'Điểm', type: 'number' },
  ], columns: [
    { key: 'tournamentName', label: 'Giải đấu' }, { key: 'groupName', label: 'Bảng' }, { key: 'teamName', label: 'Đội' },
    { key: 'matchesPlayed', label: 'Trận' }, { key: 'wins', label: 'Thắng' }, { key: 'draws', label: 'Hòa' },
    { key: 'losses', label: 'Thua' }, { key: 'goalsFor', label: 'BT' }, { key: 'goalsAgainst', label: 'BB' },
    { key: 'points', label: 'Điểm' },
  ] },
  customers: { title: 'Khách hàng', endpoint: '/api/platform/admin/customers', adminOnly: true, columns: [
    { key: 'fullName', label: 'Họ tên' }, { key: 'phone', label: 'Điện thoại' },
    { key: 'email', label: 'Email' }, { key: 'userId', label: 'Tài khoản liên kết' }, { key: 'createdAt', label: 'Ngày tạo' },
  ] },
  bookings: { title: 'Đặt sân', endpoint: '/api/platform/admin/bookings', adminOnly: true, bookingStatus: true, columns: [
    { key: 'customerName', label: 'Khách hàng' }, { key: 'phone', label: 'Điện thoại' },
    { key: 'centerName', label: 'Cụm sân' }, { key: 'subFieldName', label: 'Sân con' },
    { key: 'sportName', label: 'Môn' }, { key: 'bookingDate', label: 'Ngày' },
    { key: 'startTime', label: 'Bắt đầu' }, { key: 'endTime', label: 'Kết thúc' },
    { key: 'totalPrice', label: 'Tổng tiền' }, { key: 'paymentMethod', label: 'Thanh toán' }, { key: 'status', label: 'Trạng thái' },
  ] },
};

function display(value: unknown, key: string) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (key === 'paymentMethod' && typeof value === 'string') return paymentMethodLabel(value);
  if (typeof value === 'number' && ['pricePerHour', 'totalPrice', 'giaGio', 'giaGioCaoDiem', 'price'].includes(key))
    return `${value.toLocaleString('vi-VN')} ₫`;
  if (typeof value === 'string' && (key.endsWith('Time') || key === 'matchTime' || key === 'createdAt'))
    return value.replace('T', ' ').slice(0, 16);
  return String(value);
}

function statusPresentation(value: unknown) {
  const status = String(value ?? '');
  const presentation: Record<string, { label: string; tone: string }> = {
    Pending: { label: 'Chờ xác nhận', tone: 'pending' },
    Confirmed: { label: 'Đã xác nhận', tone: 'confirmed' },
    Completed: { label: 'Hoàn thành', tone: 'completed' },
    Cancelled: { label: 'Đã hủy', tone: 'cancelled' },
    Active: { label: 'Đang hoạt động', tone: 'active' },
    Maintenance: { label: 'Đang bảo trì', tone: 'maintenance' },
    Inactive: { label: 'Ngừng hoạt động', tone: 'inactive' },
    Upcoming: { label: 'Sắp diễn ra', tone: 'upcoming' },
    Ongoing: { label: 'Đang diễn ra', tone: 'ongoing' },
    Finished: { label: 'Đã kết thúc', tone: 'completed' },
    Scheduled: { label: 'Đã lên lịch', tone: 'upcoming' },
    Live: { label: 'Đang thi đấu', tone: 'ongoing' },
    Postponed: { label: 'Tạm hoãn', tone: 'maintenance' },
    Injured: { label: 'Chấn thương', tone: 'cancelled' },
    'Đang kinh doanh': { label: 'Đang kinh doanh', tone: 'active' },
    'Ngừng kinh doanh': { label: 'Ngừng kinh doanh', tone: 'inactive' },
    'Đang áp dụng': { label: 'Đang áp dụng', tone: 'active' },
    'Ngừng áp dụng': { label: 'Ngừng áp dụng', tone: 'inactive' },
    'Đang làm việc': { label: 'Đang làm việc', tone: 'active' },
    'Đã nghỉ': { label: 'Đã nghỉ', tone: 'inactive' },
    HOAT_DONG: { label: 'Đang hoạt động', tone: 'active' },
    BAO_TRI: { label: 'Đang bảo trì', tone: 'maintenance' },
    MOI: { label: 'Mới', tone: 'upcoming' },
    DANG_XU_LY: { label: 'Đang xử lý', tone: 'ongoing' },
    DA_LIEN_HE: { label: 'Đã liên hệ', tone: 'active' },
    TU_CHOI: { label: 'Từ chối', tone: 'cancelled' },
  };
  return presentation[status] ?? { label: status || 'Chưa xác định', tone: 'unknown' };
}

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function FagleagueModulePage() {
  const params = useParams<{ module: string }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const config = configs[moduleKey];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null);
  const [bookingForm, setBookingForm] = useState<AdminBookingForm | null>(null);
  const [bookingPitches, setBookingPitches] = useState<BookingPitch[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [subFieldId, setSubFieldId] = useState('1');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const endpoint = useMemo(() => {
    if (!config?.slots) return config?.endpoint ?? '';
    return `${config.endpoint}?subFieldId=${encodeURIComponent(subFieldId)}&date=${encodeURIComponent(date)}`;
  }, [config, date, subFieldId]);

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError('');
    try { setRows(await api<Row[]>(endpoint)); }
    catch (cause) { setRows([]); setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu.'); }
    finally { setLoading(false); }
  }, [config, endpoint]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => {
    if (!config?.fields) return;
    setError('');
    setForm(Object.fromEntries(config.fields.map(field => [
      field.key,
      field.key === 'weekend' ? 'false' : '',
    ])));
  };

  const openEdit = (row: Row) => {
    if (!config?.fields) return;
    setError('');
    setForm(Object.fromEntries([...config.fields.map(field => {
      const value = row[field.key];
      return [field.key, value == null ? '' : String(value).replace(' ', 'T').slice(0, field.type === 'datetime-local' ? 16 : undefined)];
    }), ['id', String(row.id)]]));
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!config?.fields || !form) return;
    setSaving(true);
    setError('');
    const body: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = form[field.key]?.trim() ?? '';
      if (!value) {
        if (field.required) {
          setError(`Vui lòng nhập ${field.label.toLocaleLowerCase('vi')}.`);
          setSaving(false);
          return;
        }
        continue;
      } else if (field.type === 'number') {
        const number = Number(value);
        if (!Number.isFinite(number)) {
          setError(`${field.label} phải là số hợp lệ.`);
          setSaving(false);
          return;
        }
        body[field.key] = number;
      } else if (field.key === 'weekend') {
        body[field.key] = value === 'true';
      } else {
        body[field.key] = value;
      }
    }

    try {
      const id = form.id;
      await api(id ? `/api/platform/admin/${moduleKey}/${id}` : `/api/platform/admin/${moduleKey}`, {
        method: id ? 'PUT' : 'POST',
        body,
      });
      setForm(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!config?.fields || row.id == null || !confirm(`Xóa bản ghi #${row.id}?`)) return;
    setError('');
    try {
      await api(`/api/platform/admin/${moduleKey}/${row.id}`, { method: 'DELETE' });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không xóa được bản ghi.');
    }
  };

  const changeBookingStatus = async (row: Row, status: string) => {
    if (row.id == null) return;
    setUpdatingBookingId(Number(row.id));
    setError('');
    try {
      await api(`/api/platform/admin/bookings/${row.id}/status`, { method: 'PUT', body: { status } });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không cập nhật được trạng thái đặt sân.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const openBookingForm = async () => {
    setError('');
    setBookingPitches([]);
    setBookingForm({
      subFieldId: '',
      bookingDate: localToday(),
      startTime: '',
      endTime: '',
      fullName: '',
      phone: '',
      email: '',
      paymentMethod: 'Thanh toán trực tiếp tại sân',
      note: '',
    });
    setLoadingPitches(true);
    try {
      const pitches = await api<BookingPitch[]>('/api/platform/pitches');
      setBookingPitches(pitches.filter(pitch => pitch.trangThai === 'HOAT_DONG'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được danh sách sân.');
    } finally {
      setLoadingPitches(false);
    }
  };

  const saveBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingForm) return;
    setSavingBooking(true);
    setError('');
    try {
      await api('/api/platform/admin/bookings', {
        method: 'POST',
        body: { ...bookingForm, subFieldId: Number(bookingForm.subFieldId) },
      });
      setBookingForm(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được đơn đặt sân.');
    } finally {
      setSavingBooking(false);
    }
  };

  if (!config) return <div className="card"><h1>Không tìm thấy mục dữ liệu</h1><Link href="/admin/fagleague">Quay lại dữ liệu FAGLEAGUE</Link></div>;

  return <div className="dashboard">
    <header className="page-head">
      <div><span className="eyebrow"><Link href="/admin/fagleague">DỮ LIỆU FAGLEAGUE</Link></span><h1>{config.title}</h1></div>
      <div className="acts">
        {config.bookingStatus && <button className="btn" onClick={() => void openBookingForm()}>Đặt hộ khách</button>}
        {config.fields && <button className="btn" onClick={openNew}>Thêm mới</button>}
        <button className="btn ghost" onClick={() => void load()} disabled={loading}>Tải lại</button>
      </div>
    </header>
    {config.slots && <div className="card fagleague-filters">
      <label>Mã sân con<input type="number" min="1" value={subFieldId} onChange={event => setSubFieldId(event.target.value)} /></label>
      <label>Ngày<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
    </div>}
    {error && <div className="err" role="alert">{error}</div>}
    <div className="card">
      <div className="card-head"><h2>{config.title}</h2><span className="chip">{loading ? 'Đang tải…' : `${rows.length} bản ghi`}</span></div>
      {loading ? <div className="empty">Đang tải dữ liệu từ backend…</div> :
        rows.length === 0 ? <div className="empty">Chưa có dữ liệu cho mục này.</div> :
          <div className="fagleague-table-wrap"><table><thead><tr>{config.columns.map(column => <th className={column.key === 'status' ? 'admin-status-header' : undefined} key={column.key}>{column.label}</th>)}
            {(config.fields || config.bookingStatus) && <th className="admin-actions-header">Thao tác</th>}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>
              {config.columns.map(column => {
                if (column.key === 'homeScore' && row.homeScore != null && row.awayScore != null)
                  return <td key={column.key}>{String(row.homeScore)} – {String(row.awayScore)}</td>;
                if (column.key === 'subFieldName' && row.categoryName)
                  return <td key={column.key}><strong>{String(row.categoryName)}</strong><br /><small>{display(row[column.key], column.key)}</small></td>;
                if (column.key === 'status') {
                  const status = statusPresentation(row[column.key]);
                  return <td className="admin-status-cell" key={column.key}>
                    <span className={`admin-status-badge is-${status.tone}`}>{status.label}</span>
                  </td>;
                }
                return <td key={column.key}>{display(row[column.key], column.key)}</td>;
              })}
              {config.bookingStatus && <td className="admin-actions-cell"><select className={`admin-status-select is-${statusPresentation(row.status).tone}`} aria-label={`Trạng thái đơn ${row.id}`} value={String(row.status ?? '')}
                disabled={updatingBookingId === Number(row.id)}
                onChange={event => void changeBookingStatus(row, event.target.value)}>
                {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => <option value={status} key={status}>{statusPresentation(status).label}</option>)}
              </select></td>}
              {config.fields && <td className="admin-actions-cell"><div className="acts">
                <button className="btn ghost" onClick={() => openEdit(row)}>Sửa</button>
                <button className="btn bad" onClick={() => void remove(row)}>Xóa</button>
              </div></td>}
            </tr>)}</tbody></table></div>}
    </div>
    {form && config.fields && <div className="modal"><form onSubmit={save} className="fagleague-form">
      <h2>{form.id ? `Cập nhật ${config.title.toLocaleLowerCase('vi')}` : `Thêm ${config.title.toLocaleLowerCase('vi')}`}</h2>
      <div className="fagleague-form-grid">{config.fields.map(field => (
        <label key={field.key}>{field.label}
          {field.multiline ? <textarea rows={3} required={field.required} value={form[field.key] ?? ''}
            onChange={event => setForm({ ...form, [field.key]: event.target.value })} /> :
            field.type === 'select' ? <select required={field.required} value={form[field.key] ?? ''}
              onChange={event => setForm({ ...form, [field.key]: event.target.value })}>
              <option value="">Chọn…</option>{field.options?.map(option => <option value={option} key={option}>{option}</option>)}
            </select> :
              <input type={field.type ?? 'text'} required={field.required} value={form[field.key] ?? ''}
                onChange={event => setForm({ ...form, [field.key]: event.target.value })} />}
        </label>
      ))}</div>
      {error && <div className="err" role="alert">{error}</div>}
      <div className="acts"><button type="button" className="btn ghost" disabled={saving} onClick={() => setForm(null)}>Đóng</button>
        <button className="btn" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
    </form></div>}
    {bookingForm && <div className="modal"><form onSubmit={saveBooking} className="fagleague-form">
      <h2>Đặt sân hộ khách</h2>
      <p className="sub">Đơn sẽ được tạo ở trạng thái đã xác nhận.</p>
      {loadingPitches ? <p>Đang tải danh sách sân…</p> : bookingPitches.length === 0
        ? <p className="err">Không có sân đang hoạt động để đặt.</p>
        : <label>Sân con<select required value={bookingForm.subFieldId}
          onChange={event => setBookingForm({ ...bookingForm, subFieldId: event.target.value })}>
          <option value="">Chọn sân con</option>{bookingPitches.map(pitch =>
            <option value={pitch.id} key={pitch.id}>
              {pitch.categoryName ? `${pitch.categoryName} · ${pitch.ten}` : pitch.ten}
            </option>)}
        </select></label>}
      <div className="fagleague-form-grid">
        <label>Ngày đặt<input type="date" min={localToday()} required value={bookingForm.bookingDate}
          onChange={event => setBookingForm({ ...bookingForm, bookingDate: event.target.value })} /></label>
        <label>Giờ bắt đầu<input type="time" step={1800} required value={bookingForm.startTime}
          onChange={event => setBookingForm({ ...bookingForm, startTime: event.target.value })} /></label>
        <label>Giờ kết thúc<input type="time" step={1800} required value={bookingForm.endTime}
          onChange={event => setBookingForm({ ...bookingForm, endTime: event.target.value })} /></label>
        <label>Họ tên khách<input required maxLength={100} value={bookingForm.fullName}
          onChange={event => setBookingForm({ ...bookingForm, fullName: event.target.value })} /></label>
        <label>Số điện thoại<input required pattern="[0-9+ ]{9,15}" value={bookingForm.phone}
          onChange={event => setBookingForm({ ...bookingForm, phone: event.target.value })} /></label>
        <label>Email<input type="email" maxLength={150} value={bookingForm.email}
          onChange={event => setBookingForm({ ...bookingForm, email: event.target.value })} /></label>
        <label>Thanh toán<select value={bookingForm.paymentMethod}
          onChange={event => setBookingForm({ ...bookingForm, paymentMethod: event.target.value })}>
          <option>Thanh toán trực tiếp tại sân</option><option>Chuyển khoản QR</option>
        </select></label>
        <label>Ghi chú<input maxLength={2000} value={bookingForm.note}
          onChange={event => setBookingForm({ ...bookingForm, note: event.target.value })} /></label>
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      <div className="acts"><button type="button" className="btn ghost" disabled={savingBooking}
        onClick={() => setBookingForm(null)}>Đóng</button>
        <button className="btn" disabled={savingBooking || loadingPitches || bookingPitches.length === 0}>
          {savingBooking ? 'Đang tạo…' : 'Tạo đơn xác nhận'}
        </button></div>
    </form></div>}
    <style jsx>{`
      .fagleague-filters { display:flex; gap:16px; margin-bottom:16px; }
      .fagleague-filters label { display:grid; gap:6px; min-width:180px; font-size:13px; font-weight:600; }
      .fagleague-filters input { padding:9px 10px; border:1px solid #d5dfd9; border-radius:8px; }
      .fagleague-table-wrap { overflow:auto; }
      .fagleague-table-wrap table { min-width:760px; }
      .fagleague-form { width:min(760px,calc(100vw - 32px)); max-height:calc(100vh - 40px); overflow:auto; }
      .fagleague-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin:18px 0; }
      .fagleague-form-grid label { display:grid; align-content:start; gap:6px; font-size:12px; font-weight:700; color:#475569; }
      .fagleague-form-grid input,.fagleague-form-grid select,.fagleague-form-grid textarea { width:100%; min-width:0; border:1px solid #d5dfd9; border-radius:8px; padding:10px; font:inherit; }
      @media(max-width:600px) { .fagleague-filters { flex-wrap:wrap; } }
      @media(max-width:600px) { .fagleague-form-grid { grid-template-columns:1fr; } }
    `}</style>
  </div>;
}
