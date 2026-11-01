'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { api, vnd } from '@/lib/api';
import { getPitchVisual } from '@/lib/pitch-images';
import { getCategoryPitches, groupPitchCards } from '@/lib/pitch-groups';
import { createVietQrPayload } from '@/lib/vietqr';
import { PublicSite } from '@/components/public-site';
import { useSiteAuth } from '@/components/site-auth';

type Pitch = {
  id: number;
  centerId?: number;
  centerName?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  ten: string;
  sportId: number;
  sportName: string;
  soNguoi: number;
  diaChi: string | null;
  moTa: string | null;
  hinhAnh: string | null;
  tienIch: string[];
  giaGio: number;
  giaGioCaoDiem: number;
  gioMo: string;
  gioDong: string;
  trangThai: 'HOAT_DONG' | 'BAO_TRI';
};

type AvailablePitch = { san: Pitch; tongTien: number };
type Sport = { id: number; name: string };

type Slot = { gio: number; phut?: number; nhan: string; trong: boolean; quaKhu: boolean; gia: number };
type BookingResult = { id: number; maThanhToan?: string; maKhuyenMai?: string | null; tongTienGoc?: number; soTienGiam?: number; tenSan: string; ngay: string; gioBatDau: string; gioKetThuc: string; tongTien: number };
type PromotionPreview = { maKhuyenMai: string; ten: string; phanTramGiam: number; tongTienGoc: number; soTienGiam: number; tongTien: number; key: string };
type BookingContact = { hoTen: string; soDienThoai: string; email: string };
type AccountProfile = { hoTen: string; soDienThoai: string | null; email: string };

const pad2 = (n: number) => String(n).padStart(2, '0');
const timeMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const timeLabel = (minutes: number) => `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
const slotIndex = (slot: Slot) => slot.gio * 2 + (slot.phut ?? 0) / 30;
const durationLabel = (hours: number) => hours % 1 === 0
  ? `${hours} giờ`
  : hours < 1 ? '30 phút' : `${Math.floor(hours)} giờ 30 phút`;

function addDays(base: string, days: number) {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function BookingModal({ pitch, categoryPitches, initialDate, initialFrom, initialTo, onClose }: {
  pitch: Pitch;
  categoryPitches: Pitch[];
  initialDate: string;
  initialFrom: string | null;
  initialTo: string | null;
  onClose: () => void;
}) {
  const [selectedPitch, setSelectedPitch] = useState(pitch);
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [supportsHalfHours, setSupportsHalfHours] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<BookingResult | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<'TAI_SAN' | 'CHUYEN_KHOAN' | null>(null);
  const [contact, setContact] = useState<BookingContact>({ hoTen: '', soDienThoai: '', email: '' });
  const [promotionCode, setPromotionCode] = useState('');
  const [promotion, setPromotion] = useState<PromotionPreview | null>(null);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [checkingPromotion, setCheckingPromotion] = useState(false);
  const [transferReference, setTransferReference] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, done]);

  useEffect(() => {
    let active = true;
    api<AccountProfile>('/api/auth/me')
      .then(profile => {
        if (active) setContact({
          hoTen: profile.hoTen ?? '',
          soDienThoai: profile.soDienThoai ?? '',
          email: profile.email ?? '',
        });
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Không tải được thông tin tài khoản.');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setError('');
    setRange(null);
    setStep(2);
    api<Slot[]>(`/api/platform/pitches/${selectedPitch.id}/schedule?date=${encodeURIComponent(date)}`)
      .then(data => {
        if (!active) return;
        setSlots(data);
        const supportsHalfHours = data.every(slot =>
          Number.isInteger(slot.phut) && (slot.phut === 0 || slot.phut === 30),
        );
        setSupportsHalfHours(supportsHalfHours);
        if (!supportsHalfHours) {
          setError('Backend chưa hỗ trợ khung 30 phút. Vui lòng khởi động lại backend để cập nhật.');
        }
        // Lần đầu mở: tự chọn sẵn khung giờ khách đã chọn ở ô tìm kiếm (nếu còn trống)
        if (!prefilled && initialFrom !== null && initialTo !== null && date === initialDate) {
          const startIndex = timeMinutes(initialFrom) / 30;
          const endIndex = timeMinutes(initialTo) / 30;
          const wanted = data.filter(slot => slotIndex(slot) >= startIndex && slotIndex(slot) < endIndex);
          if (wanted.length === endIndex - startIndex && wanted.every(slot => slot.trong)) {
            setRange({ from: startIndex, to: endIndex });
          }
        }
        setPrefilled(true);
      })
      .catch(cause => { if (active) { setSlots([]); setError(cause instanceof Error ? cause.message : 'Không tải được lịch của sân.'); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selectedPitch.id]);

  const slotOf = (index: number) => slots.find(slot => slotIndex(slot) === index);

  const pick = (index: number) => {
    setError('');
    const slot = slotOf(index);
    if (!supportsHalfHours) return;
    if (!range) {
      if (slot?.trong) setRange({ from: index, to: index });
      return;
    }
    if (range.from === range.to) {
      if (index === range.from) { setRange(null); return; }
      if (index < range.from) {
        if (slot?.trong) setRange({ from: index, to: index });
        return;
      }
    } else {
      if (index === range.from) { setRange(null); return; }
      if (index < range.from) {
        if (slot?.trong) setRange({ from: index, to: index });
        return;
      }
    }

    if (index > range.from) {
      const between = slots.filter(item => slotIndex(item) >= range.from && slotIndex(item) < index);
      if (index - range.from > 8) {
        setError('Mỗi lần chỉ được đặt tối đa 4 giờ liên tiếp.');
        return;
      }
      if (between.length === index - range.from && between.every(item => item.trong)) {
        setRange({ from: range.from, to: index });
      } else {
        setError('Khung giờ có sân đã được đặt. Vui lòng chọn giờ kết thúc khác.');
      }
      return;
    }
  };

  const choosePayment = (choice: 'TAI_SAN' | 'CHUYEN_KHOAN') => {
    setPaymentChoice(choice);
    setError('');
    if (choice === 'CHUYEN_KHOAN' && !transferReference) {
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      setTransferReference(`SAN${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`);
    }
  };

  const choosePitch = (id: number) => {
    const nextPitch = categoryPitches.find(item => item.id === id);
    if (!nextPitch || nextPitch.id === selectedPitch.id) return;
    setSelectedPitch(nextPitch);
    setRange(null);
    setStep(2);
    setPaymentChoice(null);
    setPromotion(null);
    setPromotionCode('');
    setPromotionMessage('');
    setDone(null);
    setError('');
    setTransferReference('');
    setQrDataUrl('');
  };

  const today = localToday();
  const moveDate = (days: number) => {
    const next = addDays(date, days);
    if (next >= today && next <= addDays(today, 30)) setDate(next);
  };

  const dateChoices = Array.from({ length: 7 }, (_, index) => addDays(date, index - 3))
    .filter(value => value >= today && value <= addDays(today, 30));
  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

  const hasDuration = range !== null && range.to > range.from;
  const selected = range && hasDuration
    ? slots.filter(slot => slotIndex(slot) >= range.from && slotIndex(slot) < range.to)
    : [];
  const total = selected.reduce((sum, slot) => sum + slot.gia, 0);
  const startText = range && hasDuration ? timeLabel(range.from * 30) : '';
  const endText = range && hasDuration ? timeLabel(range.to * 30) : '';
  const durationText = durationLabel(selected.length / 2);
  const promotionKey = `${selectedPitch.id}|${date}|${startText}|${endText}|${promotionCode.trim().toUpperCase()}`;
  const activePromotion = promotion?.key === promotionKey ? promotion : null;
  const amountDue = activePromotion?.tongTien ?? total;

  useEffect(() => {
    setPromotion(null);
    setPromotionMessage('');
  }, [promotionKey]);

  async function applyPromotion() {
    if (!hasDuration) { setPromotionMessage('Vui lòng chọn giờ bắt đầu và giờ kết thúc.'); return; }
    if (!promotionCode.trim()) { setPromotionMessage('Nhập mã khuyến mãi cần áp dụng.'); return; }
    setCheckingPromotion(true);
    setPromotion(null);
    setPromotionMessage('');
    try {
      const result = await api<{ name: string; discountPercent: number; originalTotal: number; discountAmount: number; totalPrice: number }>('/api/platform/promotions/validate', {
        method: 'POST',
        body: {
          name: promotionCode.trim(),
          bookingDate: date,
          baseTotal: total,
        },
      });
      setPromotion({
        maKhuyenMai: result.name,
        ten: result.name,
        phanTramGiam: result.discountPercent,
        tongTienGoc: result.originalTotal,
        soTienGiam: result.discountAmount,
        tongTien: result.totalPrice,
        key: promotionKey,
      });
      setPromotionMessage(`Đã áp dụng ${result.name} — giảm ${vnd(result.discountAmount)}.`);
    } catch (cause) {
      setPromotionMessage(cause instanceof Error ? cause.message : 'Không áp dụng được mã khuyến mãi.');
    } finally {
      setCheckingPromotion(false);
    }
  }

  useEffect(() => {
    if (paymentChoice !== 'CHUYEN_KHOAN' || (step !== 4 && !done)) return;
    let active = true;
    setQrDataUrl('');
    setQrError('');
    const amount = done?.tongTien ?? amountDue;
    const reference = done?.maThanhToan ?? transferReference;
    if (!reference) return;
    QRCode.toDataURL(createVietQrPayload(amount, reference), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 240,
    }).then(dataUrl => {
      if (active) setQrDataUrl(dataUrl);
    }).catch(cause => {
      if (active) setQrError(cause instanceof Error ? cause.message : 'Không tạo được mã QR thanh toán.');
    });
    return () => { active = false; };
  }, [done, paymentChoice, step, amountDue, transferReference]);

  const continueToContact = () => {
    if (!hasDuration) { setError('Vui lòng chọn giờ bắt đầu và giờ kết thúc.'); return; }
    if (loadingSlots || !supportsHalfHours) return;
    setError('');
    setStep(3);
  };

  const continueToConfirmation = () => {
    if (!contact.hoTen.trim()) { setError('Vui lòng nhập họ và tên người đặt.'); return; }
    if (!/^[0-9+ ]{9,15}$/.test(contact.soDienThoai.trim())) {
      setError('Số điện thoại cần từ 9 đến 15 ký tự số.');
      return;
    }
    if (contact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }
    setError('');
    setStep(4);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasDuration) { setError('Vui lòng chọn khung giờ muốn đặt.'); return; }
    if (!paymentChoice) { setError('Vui lòng chọn cách thanh toán.'); return; }
    if (!contact.hoTen.trim() || !/^[0-9+ ]{9,15}$/.test(contact.soDienThoai.trim())) {
      setStep(3);
      setError('Vui lòng kiểm tra họ tên và số điện thoại người đặt.');
      return;
    }
    if (promotionCode.trim() && !activePromotion) {
      setError('Vui lòng áp dụng mã khuyến mãi hoặc xoá mã trước khi xác nhận.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await api<{ id: number; totalPrice: number }>('/api/platform/bookings', {
        method: 'POST',
        body: {
          subFieldId: selectedPitch.id,
          bookingDate: date,
          startTime: startText,
          endTime: endText,
          paymentMethod: paymentChoice,
          note: note.trim() || null,
          fullName: contact.hoTen.trim(),
          phone: contact.soDienThoai.trim(),
          email: contact.email.trim() || null,
          promotionName: activePromotion?.ten ?? null,
        },
      });
      setDone({
        id: result.id,
        maKhuyenMai: activePromotion?.maKhuyenMai ?? null,
        tongTienGoc: activePromotion?.tongTienGoc ?? total,
        soTienGiam: activePromotion?.soTienGiam ?? 0,
        tenSan: selectedPitch.categoryName
          ? `${selectedPitch.categoryName} · ${selectedPitch.ten}`
          : selectedPitch.ten,
        ngay: date,
        gioBatDau: startText,
        gioKetThuc: endText,
        tongTien: result.totalPrice,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không đặt được sân, thử lại sau.');
      // tải lại lịch sân khi có người vừa đặt trùng giờ
      api<Slot[]>(`/api/platform/pitches/${selectedPitch.id}/schedule?date=${encodeURIComponent(date)}`).then(setSlots).catch(() => undefined);
      setRange(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bk-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={modalRef} className="bk-modal bk-flow" role="dialog" aria-modal="true" aria-label={`Đặt sân ${selectedPitch.ten}`}>
        <button type="button" className="bk-close" onClick={onClose} aria-label="Đóng">×</button>
        {done ? (
          <div className="bk-done">
            <div className="bk-done-icon">✓</div>
            <h3>Đã gửi yêu cầu đặt sân</h3>
            <p>{done.tenSan} · {done.ngay.split('-').reverse().join('/')} · {done.gioBatDau.slice(0, 5)} – {done.gioKetThuc.slice(0, 5)}</p>
            {done.soTienGiam ? <p className="bk-promo-success">Mã {done.maKhuyenMai} · Đã giảm {vnd(done.soTienGiam)}</p> : null}
            <p className="bk-done-total">{vnd(done.tongTien)}</p>
            {paymentChoice === 'CHUYEN_KHOAN' ? (
              <div className="bk-payment">
                <p>Quét mã bằng ứng dụng ngân hàng để thanh toán đúng số tiền cho đơn <strong>#{done.id}</strong>.</p>
                {qrError ? <p className="bk-error" role="alert">{qrError}</p> : qrDataUrl
                  ? <img src={qrDataUrl} alt={`Mã QR thanh toán ${vnd(done.tongTien)}`} width={240} height={240} />
                  : <p className="bk-hint">Đang tạo mã QR thanh toán…</p>}
                <dl>
                  <div><dt>Ngân hàng</dt><dd>Sacombank</dd></div>
                  <div><dt>Số tài khoản</dt><dd>060314217406</dd></div>
                  <div><dt>Chủ tài khoản</dt><dd>TRANTANDAT</dd></div>
                  <div><dt>Số tiền</dt><dd>{vnd(done.tongTien)}</dd></div>
                  <div><dt>Nội dung chuyển khoản</dt><dd>{done.maThanhToan || transferReference}</dd></div>
                </dl>
                <p className="bk-hint">Đơn đang chờ xác nhận. Admin sẽ kiểm tra giao dịch và cập nhật trạng thái thanh toán; vui lòng giữ lại biên lai.</p>
              </div>
            ) : (
              <p className="bk-hint">Đơn đang ở trạng thái <strong>chờ xác nhận</strong>. Bạn thanh toán tại sân sau khi đá. Có thể theo dõi hoặc huỷ (trước giờ đá 2 tiếng) trong mục Lịch đặt sân.</p>
            )}
            <div className="bk-actions">
              <button type="button" className="bk-secondary" onClick={onClose}>Đóng</button>
              <Link className="bk-primary" href="/shop/ho-so">Xem lịch đặt sân</Link>
            </div>
          </div>
        ) : (
          <>
            {step !== 2 && <div className="bk-stepper" aria-label="Tiến trình đặt sân">
              {['Chọn sân', 'Chọn giờ', 'Thông tin', 'Xác nhận'].map((label, index) => {
                const number = index + 1;
                const completed = number < step;
                return <div className={`bk-step${completed ? ' completed' : ''}${number === step ? ' current' : ''}`} key={label}>
                  <span>{completed ? '✓' : number}</span><strong>{label}</strong>
                </div>;
              })}
            </div>}
            <form className="bk-layout" onSubmit={submit}>
              <section className="bk-main-panel">
                {step === 2 && <>
                  <h3>Chọn sân và khung giờ</h3>
                  <p className="bk-sub">Danh mục {pitch.categoryName || pitch.ten} · Chọn sân con, sau đó chọn ngày và khung giờ</p>
                  <div className="bk-field">
                    <span>Chọn sân con</span>
                    <div className="bk-pitch-choices" role="group" aria-label="Chọn sân con">
                      {categoryPitches.map(item => <button
                        key={item.id}
                        type="button"
                        className={`bk-pitch-choice${selectedPitch.id === item.id ? ' selected' : ''}`}
                        aria-pressed={selectedPitch.id === item.id}
                        onClick={() => choosePitch(item.id)}
                      >
                        <strong>{item.ten}</strong>
                        <small>{item.soNguoi ? `Sân ${item.soNguoi} người · ` : ''}{vnd(item.giaGio)}/giờ</small>
                      </button>)}
                    </div>
                    <small>Mỗi mặt sân có lịch trống và giá riêng.</small>
                  </div>
                  <div className="bk-date-picker">
                    <button type="button" className="bk-date-arrow" aria-label="Ngày trước" disabled={date <= today} onClick={() => moveDate(-1)}>‹</button>
                    <div className="bk-date-options">
                      {dateChoices.map(value => {
                        const day = new Date(`${value}T00:00:00`);
                        return <button key={value} type="button" className={`bk-date-option${value === date ? ' selected' : ''}`} aria-pressed={value === date} onClick={() => setDate(value)}>
                          <small>{new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(day).replace('.', '')}</small>
                          <strong>{day.getDate()}/{day.getMonth() + 1}</strong>
                        </button>;
                      })}
                    </div>
                    <button type="button" className="bk-date-arrow" aria-label="Ngày sau" disabled={date >= addDays(today, 30)} onClick={() => moveDate(1)}>›</button>
                  </div>
                  <h4 className="bk-selected-day">{formattedDate}</h4>
                  <div className="bk-field">
                    <span>Chọn khung giờ <small>(chọn giờ bắt đầu, sau đó chọn giờ kết thúc; tối đa 4 giờ)</small></span>
                    {loadingSlots ? <p className="bk-hint">Đang tải lịch sân…</p> : slots.length === 0 ? <p className="bk-hint">Không có khung giờ nào cho ngày này.</p> : (
                      <div className="bk-slots">
                        {slots.map(slot => {
                          const index = slotIndex(slot);
                          const active = range !== null && hasDuration && index > range.from && index < range.to;
                          const isStart = range !== null && index === range.from;
                          const isEnd = range !== null && hasDuration && index === range.to;
                          const endAvailable = isEnd && (slots.find(item => slotIndex(item) === index - 1)?.trong ?? false);
                          return <button
                            key={index}
                            type="button"
                            disabled={!supportsHalfHours || (!slot.trong && !endAvailable)}
                            aria-pressed={isStart || isEnd || active}
                            className={`bk-slot${active ? ' active' : ''}${isStart ? ' start' : ''}${isEnd ? ' end' : ''}`}
                            onClick={() => pick(index)}
                          >
                            <strong>{timeLabel(index * 30)}</strong>
                            {isStart && <small>BẮT ĐẦU</small>}
                            {isEnd && <small>KẾT THÚC</small>}
                          </button>;
                        })}
                        {slots.length > 0 && (() => {
                          const lastSlot = slots[slots.length - 1];
                          const index = slotIndex(lastSlot) + 1;
                          const isEnd = range !== null && hasDuration && index === range.to;
                          return <button
                            key={index}
                            type="button"
                            disabled={!supportsHalfHours || (!lastSlot.trong && !isEnd)}
                            aria-pressed={isEnd}
                            className={`bk-slot${isEnd ? ' end' : ''}`}
                            onClick={() => pick(index)}
                          >
                            <strong>{timeLabel(index * 30)}</strong>
                            {isEnd && <small>KẾT THÚC</small>}
                          </button>;
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="bk-slot-legend" aria-label="Chú thích trạng thái khung giờ">
                    <span><i className="available" />Còn trống</span>
                    <span><i className="booked" />Đã có người đặt</span>
                    <span><i className="selected" />Đang chọn</span>
                    <span><i className="start" />Bắt đầu</span>
                    <span><i className="end" />Kết thúc</span>
                  </div>
                  {hasDuration && <p className="bk-selected-range">ⓘ &nbsp;Khung giờ: <strong>{startText} – {endText}</strong> ({durationText}) · Tổng: <strong>{vnd(total)}</strong></p>}
                  {!hasDuration && range && <p className="bk-hint">Đã chọn giờ bắt đầu <strong>{timeLabel(range.from * 30)}</strong>. Tiếp tục chọn giờ kết thúc.</p>}
                </>}
                {step === 3 && <>
                  <h3>Thông tin người đặt</h3>
                  <p className="bk-sub">Thông tin liên hệ được lưu cùng đơn đặt sân của bạn.</p>
                  <div className="bk-contact-grid">
                    <label className="bk-field">Họ và tên <span aria-hidden="true">*</span>
                      <input autoComplete="name" maxLength={100} value={contact.hoTen} onChange={event => setContact({ ...contact, hoTen: event.target.value })} required />
                    </label>
                    <label className="bk-field">Số điện thoại <span aria-hidden="true">*</span>
                      <input autoComplete="tel" inputMode="tel" maxLength={15} value={contact.soDienThoai} onChange={event => setContact({ ...contact, soDienThoai: event.target.value })} required />
                    </label>
                    <label className="bk-field">Email
                      <input type="email" autoComplete="email" maxLength={150} value={contact.email} onChange={event => setContact({ ...contact, email: event.target.value })} />
                    </label>
                    <label className="bk-field bk-note-field">Ghi chú (tuỳ chọn)
                      <textarea rows={4} maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder="Yêu cầu đặc biệt, hỏi về thiết bị thuê…" />
                    </label>
                  </div>
                </>}
                {step === 4 && <>
                  <h3>Xác nhận đặt sân</h3>
                  <p className="bk-sub">Kiểm tra lại thông tin trước khi hoàn tất đặt sân</p>
                  <dl className="bk-review-list">
                    <div><dt>Sân</dt><dd>{selectedPitch.diaChi || selectedPitch.ten}<small>{selectedPitch.ten}</small></dd></div>
                    <div><dt>Môn</dt><dd>{selectedPitch.sportName}</dd></div>
                    <div><dt>Ngày</dt><dd>{formattedDate}</dd></div>
                    <div><dt>Khung giờ</dt><dd>{startText} – {endText} ({durationText})</dd></div>
                    <div><dt>Người đặt</dt><dd>{contact.hoTen} · {contact.soDienThoai}</dd></div>
                    {contact.email && <div><dt>Email</dt><dd>{contact.email}</dd></div>}
                    {note.trim() && <div><dt>Ghi chú</dt><dd>{note}</dd></div>}
                    <div><dt>Tạm tính</dt><dd>{vnd(total)}</dd></div>
                  </dl>
                  <div className="bk-promo">
                    <label htmlFor="bk-promo-code">Tên chương trình khuyến mãi (nếu có)</label>
                    <div className="bk-promo-controls">
                      <input id="bk-promo-code" value={promotionCode} onChange={event => { setPromotionCode(event.target.value); setPromotionMessage(''); }} placeholder="Nhập tên chương trình" maxLength={150} />
                      <button type="button" className="bk-secondary" onClick={applyPromotion} disabled={checkingPromotion || !range}>{checkingPromotion ? 'Đang kiểm tra…' : activePromotion ? 'Áp dụng lại' : 'Áp dụng'}</button>
                    </div>
                    {promotionMessage && <p className={activePromotion ? 'bk-promo-success' : 'bk-promo-message'} role="status">{promotionMessage}</p>}
                  </div>
                  <fieldset className="bk-payment-options">
                    <legend>Phương thức thanh toán</legend>
                    <label className={`bk-payment-option${paymentChoice === 'TAI_SAN' ? ' selected' : ''}`}>
                      <input type="radio" name="payment" checked={paymentChoice === 'TAI_SAN'} onChange={() => choosePayment('TAI_SAN')} />
                      <span className="bk-payment-copy"><strong>Thanh toán tại sân</strong><small>Thanh toán trước khi chơi</small></span>
                    </label>
                    <label className={`bk-payment-option${paymentChoice === 'CHUYEN_KHOAN' ? ' selected' : ''}`}>
                      <input type="radio" name="payment" checked={paymentChoice === 'CHUYEN_KHOAN'} onChange={() => choosePayment('CHUYEN_KHOAN')} />
                      <span className="bk-payment-copy"><strong>Chuyển khoản QR</strong><small>Thanh toán trước, quét mã ngân hàng</small></span>
                    </label>
                  </fieldset>
                  {paymentChoice === 'CHUYEN_KHOAN' && <div className="bk-payment">
                    <p>Mã QR thanh toán <strong>{vnd(amountDue)}</strong></p>
                    {qrError ? <p className="bk-error" role="alert">{qrError}</p> : qrDataUrl ? <img src={qrDataUrl} alt={`Mã QR thanh toán ${vnd(amountDue)}`} width={240} height={240} /> : <p className="bk-hint">Đang tạo mã QR thanh toán…</p>}
                    <dl>
                      <div><dt>Ngân hàng</dt><dd>Sacombank</dd></div><div><dt>Số tài khoản</dt><dd>060314217406</dd></div>
                      <div><dt>Chủ tài khoản</dt><dd>TRANTANDAT</dd></div><div><dt>Số tiền</dt><dd>{vnd(amountDue)}</dd></div>
                      <div><dt>Nội dung chuyển khoản</dt><dd>{transferReference}</dd></div>
                    </dl>
                  </div>}
                  {!paymentChoice && <p className="bk-hint" role="status">Chọn phương thức thanh toán để tiếp tục.</p>}
                  <div className="bk-total-line"><strong>Tổng thanh toán</strong><strong>{vnd(amountDue)}</strong></div>
                  <p className="bk-notice">Đơn đặt sân sẽ được lưu vào hệ thống và chờ xác nhận.</p>
                </>}
                {error && <p className="bk-error" role="alert">{error}</p>}
              </section>
              <aside className="bk-summary-panel">
                <h4>▤ &nbsp;Thông tin đặt sân</h4>
                <dl>
                  <div><dt>⌖ &nbsp;Sân</dt><dd>{selectedPitch.centerName || selectedPitch.diaChi || selectedPitch.ten}</dd></div>
                  <div><dt>🏆 &nbsp;Môn</dt><dd>{selectedPitch.sportName}</dd></div>
                  <div><dt>◉ &nbsp;Sân con</dt><dd>{selectedPitch.ten}</dd></div>
                  <div><dt>▦ &nbsp;Ngày</dt><dd>{new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN')}</dd></div>
                  <div><dt>◷ &nbsp;Giờ</dt><dd>{range ? `${startText} – ${endText}` : '—'}</dd></div>
                  <div><dt>◆ &nbsp;Giá</dt><dd>{hasDuration ? vnd(amountDue) : vnd(0)}</dd></div>
                </dl>
                <div className="bk-sidebar-actions">
                  {step === 2 && <>
                    <button type="button" className="bk-secondary" onClick={onClose}>← Quay lại</button>
                    <button type="button" className="bk-primary" disabled={!hasDuration || loadingSlots || !supportsHalfHours} onClick={continueToContact}>→ Tiếp tục</button>
                  </>}
                  {step === 3 && <>
                    <button type="button" className="bk-secondary" onClick={() => { setError(''); setStep(2); }}>← Quay lại</button>
                    <button type="button" className="bk-primary" onClick={continueToConfirmation}>→ Tiếp tục</button>
                  </>}
                  {step === 4 && <>
                    <button type="button" className="bk-secondary" disabled={submitting} onClick={() => { setError(''); setStep(3); }}>← Quay lại</button>
                    <button type="submit" className="bk-primary" disabled={submitting || !paymentChoice}>{submitting ? 'Đang gửi…' : '✓ Xác nhận đặt sân'}</button>
                  </>}
                </div>
                <p className="bk-security-note">♧ Thông tin của bạn được bảo mật</p>
              </aside>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = `
  .fl-page{--fl-green:#e11d48;--fl-green-dark:#881337;--fl-ink:#1e293b;--fl-muted:#64748b;--fl-line:#e2e8f0;--fl-bg:#f8fafc}
  .fl-nav{gap:clamp(8px,1vw,15px)}.fl-nav a{font-size:clamp(10px,.9vw,12px)}
  .fl-nav .fl-cta{background:linear-gradient(100deg,#9f1239,#e11d48);border-radius:999px;box-shadow:0 6px 16px rgba(136,19,57,.22)}.fl-nav .fl-cta:hover{background:#881337}
  .fl-hero{padding:42px max(5vw,24px) 74px;background:radial-gradient(ellipse at 82% 35%,rgba(251,113,133,.22),transparent 36%),linear-gradient(125deg,#881337,#9f1239 58%,#0f172a)}
  .fl-kicker{color:#ffe4e6}.fl-kicker:before{background:#fb7185}.fl-hero h1{font-size:clamp(34px,4.5vw,58px);line-height:1.08;letter-spacing:-2.5px;margin:15px 0}.fl-hero h1 span{color:#fecdd3}.fl-intro{max-width:720px;color:#ffe4e6;font-size:15px}
  .fl-art{min-height:180px}.fl-ball{font-size:126px}.fl-orbit{border-color:rgba(255,228,230,.25);width:260px;height:150px}.fl-orbit.two{width:320px;height:195px}
  .fl-search{margin:-36px auto 0;box-shadow:0 20px 50px rgba(15,23,42,.14);padding:22px}.fl-search-icon{background:#fff1f2}
  .fl-fields{grid-template-columns:1.4fr 1fr 1fr 1fr;gap:14px}.fl-fields label,.fl-contact label{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
  .fl-search-button,.fl-contact button{background:linear-gradient(100deg,#9f1239,#e11d48)}.fl-search-button:hover,.fl-contact button:hover{background:#881337}
  .fl-search-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #f1f5f9;padding-top:15px;margin-top:16px}
  .fl-sport-tabs{display:flex;gap:8px;overflow:auto;padding-bottom:3px}
  .fl-sport-tab{border:0;border-radius:10px;padding:9px 12px;background:#f1f5f9;color:#64748b;font:inherit;font-size:12px;font-weight:750;white-space:nowrap;cursor:pointer}
  .fl-sport-tab.active{background:#be123c;color:white}.fl-sport-tab:disabled{opacity:.55;cursor:not-allowed}
  .fl-search-actions{display:flex;gap:8px;flex:none}.fl-clear,.fl-apply{border:1px solid #e2e8f0;border-radius:10px;padding:10px 13px;background:white;color:#475569;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.fl-apply{background:#be123c;border-color:#be123c;color:white}.fl-apply:hover{background:#9f1239}
  .fl-sports{display:none}
  .fl-results-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:36px auto 0;padding:0 24px;max-width:1180px}
  .fl-size-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;max-width:1180px;margin:24px auto 0;padding:0 24px}
  .fl-size-card{padding:14px 16px;border:1px solid #e2e8f0;border-radius:13px;background:#fff}
  .fl-size-card strong{display:block;color:#881337;font-size:23px}.fl-size-card span{display:block;margin-top:3px;color:#334155;font-size:12px;font-weight:800}.fl-size-card small{display:block;margin-top:5px;color:#64748b;font-size:11px}
  .fl-venue-status{position:absolute;z-index:1;top:12px;right:12px;padding:5px 9px;border-radius:999px;background:#dcfce7;color:#166534;font-size:10px;font-weight:850}
  .fl-venue-status.maintenance{background:#fef3c7;color:#92400e}
  .fl-location-count{margin:8px 0;padding:7px 9px;border-radius:8px;background:#f8fafc;color:#475569;font-size:11px;font-weight:750}
  .fl-pitch-description{margin:9px 0;color:#475569;font-size:12px;line-height:1.55}
  .fl-amenities{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 12px}.fl-amenities span{padding:4px 7px;border-radius:999px;background:#fff1f2;color:#9f1239;font-size:10px;font-weight:750}
  .fl-venue-image{position:relative}
  .fl-image-note{position:absolute;z-index:1;left:14px;top:12px;padding:5px 8px;border-radius:999px;background:rgba(15,23,42,.68);color:#fff;font-size:9px;font-weight:750}
  .fl-results-title{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:850;color:#0f172a}.fl-count{background:#ffe4e6;color:#9f1239;border-radius:999px;padding:4px 10px;font-size:11px}
  .fl-view-tools{display:flex;align-items:center;gap:9px}.fl-sort{border:1px solid #e2e8f0;border-radius:9px;padding:9px 11px;background:#fff;color:#334155;font:inherit;font-size:12px}
  .fl-view-toggle{display:flex;background:#e2e8f0;padding:3px;border-radius:9px}.fl-view-toggle button{border:0;border-radius:7px;padding:7px 10px;background:transparent;color:#475569;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.fl-view-toggle button.active{background:#fff;color:#0f172a;box-shadow:0 1px 3px #0002}
  .fl-venue-grid.list{grid-template-columns:1fr}.fl-venue-grid.list .fl-venue{display:grid;grid-template-columns:230px 1fr}.fl-venue-grid.list .fl-venue-image{height:100%;min-height:190px}.fl-venue-grid.list .fl-venue-body{display:flex;flex-direction:column;justify-content:center}
  .fl-venue:hover{box-shadow:0 14px 30px rgba(136,19,57,.1)}
  .fl-venue-image{background:linear-gradient(135deg,#fb7185,#881337)}.fl-venue-image.no-image{background-image:radial-gradient(circle at 78% 24%,rgba(255,228,230,.55) 0 5%,transparent 5.5%),linear-gradient(135deg,#be123c,#4c0519)}
  .fl-book{background:#fff1f2}.fl-book:hover{background:#ffe4e6}
  .fl-pro{background:#1e293b}.fl-pro h2 span,.fl-pro-link,.fl-feature>span{color:#fda4af}.fl-pro p{color:#cbd5e1}
  .fl-footer{background:#0f172a;color:#cbd5e1}
  .fl-map-panel{min-height:390px;display:grid;place-items:center;background-color:#e8e7e3;background-image:linear-gradient(30deg,transparent 48%,#fff 49%,#fff 51%,transparent 52%),linear-gradient(120deg,transparent 48%,#fff 49%,#fff 51%,transparent 52%);background-size:120px 100px;border:1px solid #cbd5e1;border-radius:16px;padding:24px}
  .fl-map-message{max-width:440px;padding:20px;background:white;border-radius:14px;box-shadow:0 12px 28px #0f172a22;text-align:center}.fl-map-message p{font-size:12px;color:#64748b;line-height:1.7}.fl-map-message a{color:#be123c;font-weight:800}
  @media(max-width:920px){.fl-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.fl-results-bar{align-items:flex-start;flex-direction:column}.fl-size-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:640px){.fl-hero{padding:38px 18px 62px}.fl-hero-inner{grid-template-columns:1fr;gap:8px}.fl-hero h1{font-size:37px;letter-spacing:-1.8px}.fl-art{min-height:120px}.fl-ball{font-size:92px}.fl-orbit{width:190px;height:110px}.fl-orbit.two{width:230px;height:140px}.fl-art-tag{right:8%;font-size:9px}.fl-search{margin:-32px 12px 0;padding:15px}.fl-fields{grid-template-columns:1fr 1fr;gap:10px}.fl-fields label:first-child,.fl-fields label:nth-child(2){grid-column:1/-1}.fl-search-tools{align-items:stretch;flex-direction:column}.fl-search-actions{width:100%}.fl-search-actions button{flex:1}.fl-results-bar{padding:0 16px;margin-top:30px}.fl-size-summary{padding:0 16px;gap:7px}.fl-size-card{padding:11px}.fl-size-card strong{font-size:20px}.fl-results-title{font-size:17px}.fl-view-tools{width:100%;justify-content:space-between}.fl-venue-grid.list .fl-venue{grid-template-columns:1fr}.fl-venue-grid.list .fl-venue-image{height:150px;min-height:0}}
  .fl-page{--fl-green:#e11d48;--fl-green-dark:#881337;--fl-ink:#1e293b;--fl-muted:#64748b;--fl-line:#e2e8f0;--fl-bg:#f8fafc;min-height:100vh;background:var(--fl-bg);color:var(--fl-ink);font-family:inherit}
  .fl-page *{box-sizing:border-box}
  .fl-header{min-height:76px;padding:10px max(5vw,24px);display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff;border-bottom:1px solid var(--fl-line);position:sticky;top:0;z-index:10}
  .fl-logo{font-size:23px;font-weight:900;letter-spacing:-1px;color:var(--fl-green-dark);text-decoration:none}.fl-logo span{color:var(--fl-green)}
  .fl-nav{display:flex;align-items:center;justify-content:flex-end;gap:clamp(10px,1.35vw,20px)}.fl-nav a{color:#42544c;text-decoration:none;font-size:clamp(11px,.95vw,13px);font-weight:700;white-space:nowrap;transition:color .18s ease}.fl-nav a:hover{color:var(--fl-green)}
  .fl-nav .fl-cta{background:var(--fl-green);color:#fff;padding:12px 17px;border-radius:10px;box-shadow:0 6px 16px rgba(25,167,107,.22)}.fl-nav .fl-cta:hover{background:#12885a;color:white}
  .fl-nav .fl-auth-link{border:1px solid var(--fl-line);padding:10px 13px;border-radius:9px}.fl-nav .fl-logout{border:0;background:transparent;color:#42544c;font:inherit;font-size:12px;font-weight:700;white-space:nowrap;padding:9px 4px;cursor:pointer}.fl-nav .fl-logout:hover{color:#b33b32}.fl-nav .fl-user{font-size:12px;color:var(--fl-muted);white-space:nowrap}
  .fl-nav a:focus-visible{outline:3px solid #80d5a8;outline-offset:3px;border-radius:5px}
  .fl-hero{padding:70px max(5vw,24px) 88px;background:radial-gradient(ellipse at 82% 35%,rgba(60,210,143,.23),transparent 36%),linear-gradient(125deg,#092f27,#0b523b 58%,#0b7048);color:#fff;position:relative;overflow:hidden}
  .fl-hero-inner{max-width:1180px;margin:auto;display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
  .fl-kicker{font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#a6f0c8;display:flex;align-items:center;gap:9px}.fl-kicker:before{content:'';height:2px;width:25px;background:#62e19f}
  .fl-hero h1{font-size:clamp(42px,5.5vw,70px);line-height:1.04;letter-spacing:-3.5px;margin:18px 0}.fl-hero h1 span{color:#62e19f}
  .fl-intro{max-width:560px;color:#d1e4dc;line-height:1.8;font-size:16px}
  .fl-stats{display:flex;gap:34px;margin-top:32px;flex-wrap:wrap}.fl-stat{display:grid;gap:2px}.fl-stat strong{font-size:24px}.fl-stat span{font-size:12px;color:#c4dbd0}
  .fl-art{min-height:300px;display:grid;place-items:center;position:relative}.fl-ball{font-size:156px;filter:drop-shadow(0 25px 22px rgba(0,0,0,.27));z-index:1}.fl-orbit{position:absolute;border:1px solid rgba(154,241,194,.25);border-radius:50%;width:300px;height:180px;transform:rotate(-28deg)}.fl-orbit.two{width:360px;height:230px;transform:rotate(28deg)}
  .fl-art-tag{position:absolute;right:0;bottom:14px;padding:10px 14px;border:1px solid rgba(255,255,255,.23);border-radius:12px;background:rgba(255,255,255,.08);font-size:11px;font-weight:800;letter-spacing:2px}
  .fl-search{max-width:1180px;margin:-42px auto 0;position:relative;z-index:2;background:#fff;border:1px solid var(--fl-line);box-shadow:0 20px 50px rgba(15,46,34,.12);border-radius:18px;padding:24px}
  .fl-search-title{display:flex;align-items:center;gap:13px;margin-bottom:20px}.fl-search-icon{width:42px;height:42px;border-radius:12px;background:#e9f8f0;color:var(--fl-green-dark);display:grid;place-items:center;font-size:22px}.fl-search-title h2{font-size:18px;margin:0 0 3px}.fl-search-title p{font-size:13px;color:var(--fl-muted);margin:0}
  .fl-fields{display:grid;grid-template-columns:1fr 1.5fr 1fr 1fr 1fr auto;gap:12px;align-items:end}.fl-fields label,.fl-contact label{display:grid;gap:7px;font-size:12px;font-weight:750;color:#53645c}
  .fl-fields input,.fl-fields select,.fl-contact input,.fl-contact select,.fl-contact textarea{width:100%;min-width:0;border:1px solid #dce6df;border-radius:9px;background:#fff;padding:11px 12px;font:inherit;color:var(--fl-ink)}
  .fl-search-button,.fl-contact button{height:42px;border:0;border-radius:9px;background:var(--fl-green);color:white;font:inherit;font-size:13px;font-weight:800;padding:0 18px;cursor:pointer}.fl-search-button:hover,.fl-contact button:hover{background:#12885a}
  .fl-section{max-width:1180px;margin:0 auto;padding:76px 24px 0}.fl-section-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:25px}.fl-eyebrow{color:var(--fl-green);font-size:11px;font-weight:850;letter-spacing:1.4px;text-transform:uppercase}.fl-section h2{font-size:30px;letter-spacing:-1px;margin:8px 0}.fl-section-head p{max-width:440px;color:var(--fl-muted);font-size:13px;line-height:1.7;margin:0}
  .fl-sports{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.fl-sport{display:flex;align-items:center;gap:13px;text-align:left;padding:17px;background:#fff;border:1px solid var(--fl-line);border-radius:14px;cursor:pointer;color:var(--fl-ink)}.fl-sport.active,.fl-sport:hover{border-color:#80d5a8;box-shadow:0 8px 22px rgba(16,110,69,.08)}.fl-sport-icon{width:44px;height:44px;flex:none;border-radius:12px;background:#e9f8f0;color:var(--fl-green-dark);display:grid;place-items:center;font-weight:900}.fl-sport strong{display:block;font-size:13px}.fl-sport small{display:block;color:var(--fl-muted);margin-top:3px}
  .fl-venue-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.fl-venue{background:white;border:1px solid var(--fl-line);border-radius:15px;overflow:hidden;transition:transform .2s,box-shadow .2s}.fl-venue:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(13,52,35,.1)}
  .fl-venue-image{position:relative;height:155px;background:#0f172a;display:flex;align-items:end;padding:14px;overflow:hidden}.fl-venue-image.no-image{background-image:radial-gradient(circle at 78% 24%,rgba(164,243,192,.55) 0 5%,transparent 5.5%),linear-gradient(135deg,#236f4d,#092f27)}.fl-venue-photo{position:absolute;z-index:0;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
  .fl-venue-image.sport-illustration{position:relative;overflow:hidden;justify-content:center;background:radial-gradient(ellipse at 50% 130%,#ffffff24 0 42%,transparent 43%),linear-gradient(135deg,#0f766e,#134e4a)!important}.fl-venue-image.sport-illustration:before,.fl-venue-image.sport-illustration:after{position:absolute;content:"";border:1px solid #ffffff50;pointer-events:none}.fl-venue-image.sport-illustration:before{inset:15px 20px;border-radius:9px}.fl-venue-image.sport-illustration:after{top:15px;bottom:15px;left:50%;border-width:0 0 0 1px}.sport-illustration-icon{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:68px;filter:drop-shadow(0 8px 12px #052e2b55)}
  .fl-size{position:relative;z-index:1;display:inline-flex;background:#fff;color:var(--fl-green-dark);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:850}.fl-venue-body{padding:17px}.fl-address{font-size:11px;color:var(--fl-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fl-venue h3{font-size:17px;margin:8px 0 13px}.fl-hours{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--fl-muted);border-bottom:1px solid #edf1ee;padding-bottom:13px}
  .fl-prices{display:flex;justify-content:space-between;align-items:end;padding:13px 0}.fl-prices strong{font-size:18px;color:var(--fl-green-dark)}.fl-prices small{font-size:10px;font-weight:500;color:var(--fl-muted)}.fl-prices span{font-size:10px;color:var(--fl-muted)}
  .fl-book{display:flex;justify-content:space-between;align-items:center;text-decoration:none;background:#eaf8f0;color:var(--fl-green-dark);font-size:12px;font-weight:800;padding:11px 12px;border-radius:9px}.fl-book:hover{background:#d8f2e3}
  .fl-empty{grid-column:1/-1;text-align:center;padding:34px 18px;background:white;border:1px dashed #ccd9d0;border-radius:14px;color:var(--fl-muted);line-height:1.7}
  .fl-center{text-align:center}.fl-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:17px}.fl-step{padding:22px;background:#fff;border:1px solid var(--fl-line);border-radius:14px}.fl-step-top{display:flex;justify-content:space-between;color:var(--fl-green);font-size:25px}.fl-step-top small{font-size:12px;font-weight:800}.fl-step h3{font-size:16px;margin:16px 0 7px}.fl-step p{font-size:12px;color:var(--fl-muted);line-height:1.7;margin:0}
  .fl-pro{margin:76px 0 0;background:#102f27;color:white;padding:56px max(5vw,24px)}.fl-pro-inner{max-width:1132px;margin:auto;display:grid;grid-template-columns:.8fr 1.2fr;gap:45px;align-items:center}.fl-pro h2{font-size:34px;letter-spacing:-1.4px;margin:10px 0}.fl-pro h2 span{color:#63dfa0}.fl-pro p{color:#c8d9d1;line-height:1.8;font-size:13px}.fl-pro-link{display:inline-block;margin-top:10px;color:#75e5a9;font-weight:800;text-decoration:none;font-size:13px}.fl-features{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fl-feature{display:flex;gap:12px;padding:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:12px}.fl-feature>span{color:#73e2a6;font-size:20px}.fl-feature h3{font-size:12px;margin:2px 0 6px}.fl-feature p{font-size:11px;margin:0}
  .fl-contact{max-width:1180px;margin:76px auto;padding:0 24px;display:grid;grid-template-columns:1fr .9fr;gap:60px}.fl-contact h2{font-size:31px;letter-spacing:-1px;margin:8px 0}.fl-contact-copy>p{color:var(--fl-muted);font-size:13px;line-height:1.8}.fl-contact-info{display:grid;gap:14px;margin-top:24px}.fl-contact-info a{color:var(--fl-green-dark);text-decoration:none;font-size:13px;font-weight:750}
  .fl-contact form{display:grid;gap:12px;padding:22px;background:#fff;border:1px solid var(--fl-line);border-radius:15px}.fl-contact textarea{resize:vertical}.fl-footer{background:#092c24;color:#d3e4dc;padding:25px max(5vw,24px);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:11px}.fl-footer strong{color:white}
  .fl-error{color:#a6332a;font-size:12px}.fl-loading{color:var(--fl-muted);text-align:center;padding:30px;grid-column:1/-1}
  @media(max-width:920px){.fl-fields{grid-template-columns:repeat(3,1fr)}.fl-search-button{height:42px}.fl-venue-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fl-pro-inner{grid-template-columns:1fr;gap:24px}.fl-contact{grid-template-columns:1fr;gap:25px}}
  @media(max-width:980px){.fl-header{align-items:flex-start;flex-direction:column;gap:8px;padding:12px 24px}.fl-nav{width:100%;justify-content:flex-start;overflow-x:auto;overscroll-behavior-inline:contain;padding:4px 0 8px;scrollbar-width:thin}.fl-nav a{font-size:12px}.fl-hero-inner{gap:20px}}
  @media(max-width:640px){.fl-header{min-height:66px;padding:10px 16px;gap:5px}.fl-nav{gap:17px}.fl-nav a{font-size:12px}.fl-nav .fl-cta{padding:9px 12px}.fl-hero{padding:48px 22px 68px}.fl-hero-inner{grid-template-columns:1fr;gap:8px}.fl-hero h1{font-size:46px;letter-spacing:-2px}.fl-art{min-height:170px}.fl-ball{font-size:105px}.fl-orbit{width:240px;height:140px}.fl-orbit.two{width:280px;height:175px}.fl-art-tag{right:8%}.fl-stats{gap:20px}.fl-search{margin:-34px 14px 0;padding:17px}.fl-search-title p{line-height:1.5}.fl-fields{grid-template-columns:1fr 1fr}.fl-fields label:nth-child(2){grid-column:1/-1}.fl-search-button{grid-column:1/-1}.fl-section{padding:55px 18px 0}.fl-section-head{display:block}.fl-section-head p{margin-top:10px}.fl-section h2{font-size:25px}.fl-sports{grid-template-columns:1fr 1fr;gap:9px}.fl-sport{padding:12px 9px;gap:9px}.fl-sport-icon{width:37px;height:37px}.fl-venue-grid,.fl-steps{grid-template-columns:1fr}.fl-pro{margin-top:55px;padding:40px 20px}.fl-pro h2,.fl-contact h2{font-size:28px}.fl-features{grid-template-columns:1fr}.fl-contact{margin:55px auto;padding:0 18px}.fl-footer{padding:22px 18px}}
  .fl-nav{gap:clamp(8px,1vw,15px)}.fl-nav a{font-size:clamp(10px,.9vw,12px)}
  .fl-nav .fl-cta{background:linear-gradient(100deg,#9f1239,#e11d48);border-radius:999px;box-shadow:0 6px 16px rgba(136,19,57,.22)}.fl-nav .fl-cta:hover{background:#881337}
  .fl-hero{padding:42px max(5vw,24px) 74px;background:radial-gradient(ellipse at 82% 35%,rgba(251,113,133,.22),transparent 36%),linear-gradient(125deg,#881337,#9f1239 58%,#0f172a)}
  .fl-kicker{color:#ffe4e6}.fl-kicker:before{background:#fb7185}.fl-hero h1{font-size:clamp(34px,4.5vw,58px);line-height:1.08;letter-spacing:-2.5px;margin:15px 0}.fl-hero h1 span{color:#fecdd3}.fl-intro{max-width:720px;color:#ffe4e6;font-size:15px}
  .fl-art{min-height:180px}.fl-ball{font-size:126px}.fl-orbit{border-color:rgba(255,228,230,.25);width:260px;height:150px}.fl-orbit.two{width:320px;height:195px}
  .fl-search{margin:-36px auto 0;box-shadow:0 20px 50px rgba(15,23,42,.14);padding:22px}.fl-search-icon{background:#fff1f2}
  .fl-fields{grid-template-columns:1.4fr 1fr 1fr 1fr;gap:14px}.fl-fields label,.fl-contact label{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
  .fl-search-button,.fl-contact button{background:linear-gradient(100deg,#9f1239,#e11d48)}.fl-search-button:hover,.fl-contact button:hover{background:#881337}
  .fl-search-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #f1f5f9;padding-top:15px;margin-top:16px}
  .fl-sport-tabs{display:flex;gap:8px;overflow:auto;padding-bottom:3px}.fl-sport-tab{border:0;border-radius:10px;padding:9px 12px;background:#f1f5f9;color:#64748b;font:inherit;font-size:12px;font-weight:750;white-space:nowrap;cursor:pointer}.fl-sport-tab.active{background:#be123c;color:white}.fl-sport-tab:disabled{opacity:.55;cursor:not-allowed}
  .fl-search-actions{display:flex;gap:8px;flex:none}.fl-clear,.fl-apply{border:1px solid #e2e8f0;border-radius:10px;padding:10px 13px;background:white;color:#475569;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.fl-apply{background:#be123c;border-color:#be123c;color:white}.fl-apply:hover{background:#9f1239}
  .fl-sports{display:none}
  .fl-results-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:36px auto 0;padding:0 24px;max-width:1180px}.fl-results-title{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:850;color:#0f172a}.fl-count{background:#ffe4e6;color:#9f1239;border-radius:999px;padding:4px 10px;font-size:11px}
  .fl-results-subtitle{margin:7px 0 0;color:#64748b;font-size:12px}
  .fl-view-tools{display:flex;align-items:center;gap:9px}.fl-sort{border:1px solid #e2e8f0;border-radius:9px;padding:9px 11px;background:#fff;color:#334155;font:inherit;font-size:12px}.fl-view-toggle{display:flex;background:#e2e8f0;padding:3px;border-radius:9px}.fl-view-toggle button{border:0;border-radius:7px;padding:7px 10px;background:transparent;color:#475569;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.fl-view-toggle button.active{background:#fff;color:#0f172a;box-shadow:0 1px 3px #0002}
  .fl-venue-grid.list{grid-template-columns:1fr}.fl-venue-grid.list .fl-venue{display:grid;grid-template-columns:230px 1fr}.fl-venue-grid.list .fl-venue-image{height:100%;min-height:190px}.fl-venue-grid.list .fl-venue-body{display:flex;flex-direction:column;justify-content:center}.fl-venue:hover{box-shadow:0 14px 30px rgba(136,19,57,.1)}
  .fl-venue-image{background:linear-gradient(135deg,#fb7185,#881337)}.fl-venue-image.no-image{background-image:radial-gradient(circle at 78% 24%,rgba(255,228,230,.55) 0 5%,transparent 5.5%),linear-gradient(135deg,#be123c,#4c0519)}
  .fl-venue-image.sport-illustration{background:radial-gradient(ellipse at 50% 130%,#ffffff24 0 42%,transparent 43%),linear-gradient(135deg,#0f766e,#134e4a)!important}
  .fl-book{background:#fff1f2}.fl-book:hover{background:#ffe4e6}.fl-pro{background:#1e293b}.fl-pro h2 span,.fl-pro-link,.fl-feature>span{color:#fda4af}.fl-pro p{color:#cbd5e1}.fl-footer{background:#0f172a;color:#cbd5e1}
  .fl-map-panel{min-height:390px;display:grid;place-items:center;background-color:#e8e7e3;background-image:linear-gradient(30deg,transparent 48%,#fff 49%,#fff 51%,transparent 52%),linear-gradient(120deg,transparent 48%,#fff 49%,#fff 51%,transparent 52%);background-size:120px 100px;border:1px solid #cbd5e1;border-radius:16px;padding:24px}.fl-map-message{max-width:440px;padding:20px;background:white;border-radius:14px;box-shadow:0 12px 28px #0f172a22;text-align:center}.fl-map-message p{font-size:12px;color:#64748b;line-height:1.7}.fl-map-message a{color:#be123c;font-weight:800}
  @media(max-width:920px){.fl-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.fl-results-bar{align-items:flex-start;flex-direction:column}}
  @media(max-width:640px){.fl-hero{padding:38px 18px 62px}.fl-hero-inner{grid-template-columns:1fr;gap:8px}.fl-hero h1{font-size:37px;letter-spacing:-1.8px}.fl-art{min-height:120px}.fl-ball{font-size:92px}.fl-orbit{width:190px;height:110px}.fl-orbit.two{width:230px;height:140px}.fl-art-tag{right:8%;font-size:9px}.fl-search{margin:-32px 12px 0;padding:15px}.fl-fields{grid-template-columns:1fr 1fr;gap:10px}.fl-fields label:first-child,.fl-fields label:nth-child(2){grid-column:1/-1}.fl-search-tools{align-items:stretch;flex-direction:column}.fl-search-actions{width:100%}.fl-search-actions button{flex:1}.fl-results-bar{padding:0 16px;margin-top:30px}.fl-results-title{font-size:17px}.fl-view-tools{width:100%;justify-content:space-between}.fl-venue-grid.list .fl-venue{grid-template-columns:1fr}.fl-venue-grid.list .fl-venue-image{height:150px;min-height:0}}
  .fl-book-btn{width:100%;border:0;font:inherit;cursor:pointer}
  .bk-backdrop{position:fixed;inset:0;z-index:100;background:rgba(255,250,250,.94);display:grid;place-items:center;padding:16px;overflow:auto}
  .bk-modal{position:relative;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#fff;border-radius:18px;padding:26px;box-shadow:0 30px 70px rgba(15,23,42,.35);color:#1e293b}
  .bk-flow{width:min(960px,100%);padding:0;border:0;border-radius:0;background:transparent;box-shadow:none}
  .bk-stepper{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));max-width:760px;margin:0 auto 25px}
  .bk-step{position:relative;display:flex;align-items:center;gap:8px;color:#64748b;font-size:12px}
  .bk-step:not(:last-child):after{content:"";position:absolute;left:35px;right:9px;top:15px;height:2px;background:#e2e8f0}
  .bk-step.completed:after{background:#be123c}
  .bk-step>span{position:relative;z-index:1;display:grid;place-items:center;flex:none;width:31px;height:31px;border:2px solid #e2e8f0;border-radius:50%;background:#fff;font-weight:850}
  .bk-step strong{position:relative;z-index:1;padding-right:6px;background:#fffafa;font-weight:650}
  .bk-step.current{color:#881337}.bk-step.current>span{border-color:#be123c;background:#be123c;color:#fff;box-shadow:0 5px 13px #be123c33}
  .bk-step.completed>span{border-color:#be123c;background:#fff1f2;color:#be123c}
  .bk-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;align-items:start;gap:18px}
  .bk-main-panel,.bk-summary-panel{min-width:0;padding:24px;background:#fff;border:1px solid #f1dede;border-radius:16px;box-shadow:0 5px 16px #88133708}
  .bk-main-panel{min-height:100%}
  .bk-main-panel h3{margin:0 0 5px;color:#111827;font-size:21px}
  .bk-summary-panel{position:sticky;top:0;padding:20px}
  .bk-summary-panel h4{margin:0 0 15px;font-size:16px;color:#111827}
  .bk-summary-panel dl{margin:0}
  .bk-summary-panel dl>div{display:grid;grid-template-columns:minmax(74px,.8fr) minmax(0,1.3fr);gap:10px;padding:11px 0;border-bottom:1px solid #f1e6e6;font-size:12px}
  .bk-summary-panel dt{color:#8b7b7b}.bk-summary-panel dd{margin:0;text-align:right;font-weight:750;overflow-wrap:anywhere}
  .bk-summary-panel dl>div:last-child dd{color:#be123c;font-size:16px}
  .bk-summary-panel dl>div:last-child{align-items:center}
  .bk-sidebar-actions{display:grid;grid-template-columns:minmax(80px,.75fr) minmax(0,1.5fr);gap:9px;margin-top:16px}
  .bk-sidebar-actions .bk-primary,.bk-sidebar-actions .bk-secondary{min-height:54px;padding:8px 11px;text-align:center;line-height:1.35}
  .bk-sidebar-actions .bk-primary{background:linear-gradient(110deg,#315bd6,#2546b8);box-shadow:0 6px 15px #315bd640}
  .bk-security-note{margin:12px 0 0;text-align:center;color:#948888;font-size:10px}
  .bk-date-picker{display:grid;grid-template-columns:34px minmax(0,1fr) 34px;align-items:center;gap:7px;margin:18px 0 20px;padding-bottom:18px;border-bottom:1px solid #f1e6e6}
  .bk-date-options{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}
  .bk-date-option,.bk-date-arrow{min-width:0;min-height:62px;border:1px solid #f0dfdf;border-radius:10px;background:#fff;color:#475569;font:inherit;cursor:pointer}
  .bk-date-option{display:grid;align-content:center;justify-items:center;gap:2px;padding:5px 2px}
  .bk-date-option small{font-size:9px;text-transform:uppercase}.bk-date-option strong{font-size:13px}
  .bk-date-option.selected{border-color:#be123c;background:#be123c;color:white;box-shadow:0 5px 12px #be123c30}
  .bk-date-arrow{min-height:36px;font-size:20px}.bk-date-arrow:disabled{opacity:.35;cursor:not-allowed}
  .bk-date-input{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;color:#64748b;font-size:11px}
  .bk-date-input input{max-width:155px;border:1px solid #e2e8f0;border-radius:8px;padding:6px 8px;font:inherit}
  .bk-selected-day{margin:0 0 16px;color:#111827;font-size:15px;text-transform:capitalize}
  .bk-contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}
  .bk-contact-grid .bk-field>span[aria-hidden]{color:#be123c}
  .bk-note-field{grid-column:1/-1}
  .bk-review-list{margin:16px 0;padding:11px 16px;border-radius:12px;background:#fbf0f1}
  .bk-review-list>div{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #f0dfe1;font-size:12px}
  .bk-review-list>div:last-child{border-bottom:0}
  .bk-review-list dt{color:#64748b;flex:none}.bk-review-list dd{margin:0;text-align:right;font-weight:750;overflow-wrap:anywhere}
  .bk-review-list dd small{display:block;color:#64748b;font-weight:500}
  .bk-payment-options{display:grid;gap:8px;margin:13px 0;padding:12px;border:1px solid #e2e8f0;border-radius:11px}
  .bk-payment-options legend{padding:0 5px;font-size:12px;font-weight:800}
  .bk-payment-options .bk-payment-option{grid-template-columns:18px minmax(0,1fr);min-height:54px;padding:9px 11px}
  .bk-payment-options input[type="radio"]{width:16px;height:16px;accent-color:#be123c}
  .bk-total-line{display:flex;justify-content:space-between;gap:14px;padding:12px 0;font-size:15px}
  .bk-total-line strong:last-child{color:#be123c;font-size:21px}
  .bk-notice{margin:8px 0;padding:11px;border-radius:9px;background:#fff1f2;color:#7f1d1d;font-size:12px}
  .bk-modal h3{margin:0 34px 4px 0;font-size:20px;color:#881337}.bk-sub{margin:0 0 18px;color:#64748b;font-size:12px;line-height:1.6}
  .bk-close{position:absolute;right:14px;top:12px;width:34px;height:34px;border:0;border-radius:50%;background:#f1f5f9;color:#475569;font-size:22px;line-height:1;cursor:pointer}.bk-close:hover{background:#ffe4e6;color:#9f1239}
  .bk-field{display:grid;gap:7px;margin-bottom:15px;font-size:12px;font-weight:800;color:#475569}.bk-field small{font-weight:500;color:#94a3b8}
  .bk-field input,.bk-field select,.bk-field textarea{width:100%;border:1px solid #e2e8f0;border-radius:9px;padding:10px 12px;font:inherit;font-size:13px;color:#1e293b;background:#fff}.bk-field textarea{resize:vertical}
  .bk-pitch-choices{display:flex;flex-wrap:wrap;gap:8px;margin:-5px 0 12px}
  .bk-pitch-choice{display:grid;gap:3px;min-width:145px;padding:10px 13px;border:1px solid #f0dede;border-radius:10px;background:#fff;color:#334155;text-align:left;font:inherit;cursor:pointer}
  .bk-pitch-choice strong{font-size:12px}.bk-pitch-choice small{color:#64748b;font-size:10px}
  .bk-pitch-choice.selected{border-color:#be123c;background:#fff1f2;color:#881337;box-shadow:0 0 0 1px #be123c22}
  .bk-pitch-choice:focus-visible{outline:2px solid #be123c;outline-offset:2px}
  .bk-slots{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:7px}
  .bk-slot{display:grid;align-content:center;gap:1px;justify-items:center;min-height:43px;padding:6px 3px;border:1px solid #f3d2d4;border-radius:9px;background:#fbe9ea;color:#9f1239;font:inherit;cursor:pointer;transition:background .15s,border-color .15s}.bk-slot strong{font-size:12px}.bk-slot small{font-size:8px;color:#fff;font-weight:800;line-height:1.2}
  .bk-slot:hover:not(:disabled){border-color:#e11d48;background:#ffe4e6}.bk-slot.active{background:#ffe4e6;border-color:#f3d2d4;color:#9f1239}.bk-slot.start{background:#b91c2b;border-color:#b91c2b;color:#fff}.bk-slot.end{background:#288449;border-color:#288449;color:#fff}
  .bk-slot:disabled{background:#f1f3f2;border-color:#e5e9e7;color:#9ca3af;cursor:not-allowed;text-decoration:none}.bk-slot:disabled small{text-decoration:none}
  .bk-slot-legend{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0;color:#7c7373;font-size:10px}.bk-slot-legend span{display:inline-flex;align-items:center;gap:5px}.bk-slot-legend i{width:15px;height:15px;border:1px solid #f3d2d4;border-radius:5px;background:#fbe9ea}.bk-slot-legend i.booked{background:#f1f3f2;border-color:#e5e9e7}.bk-slot-legend i.selected{background:#ffe4e6}.bk-slot-legend i.start{background:#b91c2b;border-color:#b91c2b}.bk-slot-legend i.end{background:#288449;border-color:#288449}
  .bk-selected-range{margin:12px 0 0;padding:13px 14px;border:1px solid #f3d2d4;border-radius:10px;background:#fbe9ea;color:#7f1d1d;font-size:12px}.bk-selected-range strong{color:#b91c2b}
  .bk-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;margin-bottom:12px;border-radius:11px;background:#fff1f2;color:#881337;font-size:13px;font-weight:700}.bk-summary strong{font-size:18px}
  .bk-error{margin:0 0 12px;padding:10px 12px;border-radius:9px;background:#fef2f2;color:#b91c1c;font-size:12px;line-height:1.5}.bk-hint{margin:0;color:#64748b;font-size:12px;line-height:1.6;font-weight:500}
  .bk-actions{display:flex;justify-content:flex-end;gap:10px}.bk-primary,.bk-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:10px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;text-decoration:none}
  .bk-primary{border:0;background:linear-gradient(100deg,#9f1239,#e11d48);color:#fff}.bk-primary:disabled{opacity:.5;cursor:not-allowed}.bk-secondary{border:1px solid #e2e8f0;background:#fff;color:#475569}
  .bk-done{text-align:center;padding:8px 0}.bk-done h3{margin:12px 0 6px}.bk-done p{margin:6px 0}.bk-done .bk-actions{justify-content:center;margin-top:18px}.bk-done-icon{width:54px;height:54px;margin:0 auto;display:grid;place-items:center;border-radius:50%;background:#dcfce7;color:#15803d;font-size:28px;font-weight:900}.bk-done-total{font-size:22px;font-weight:900;color:#9f1239}
  .bk-payment-choice{padding:14px;margin:12px 0;border:1px solid #e2e8f0;border-radius:12px}.bk-payment-choice h4{margin:0 0 8px}.bk-payment-choice p{margin:5px 0;color:#475569;font-size:13px}.bk-payment-choice fieldset{display:grid;gap:9px;margin:14px 0 0;padding:12px;border:1px solid #e2e8f0;border-radius:11px;min-width:0}.bk-payment-choice legend{padding:0 5px;font-size:12px;font-weight:800}.bk-payment-choice .bk-payment-option{display:grid;grid-template-columns:18px 34px minmax(0,1fr) 24px;align-items:center;gap:11px;width:100%;min-height:68px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#334155;font-size:13px;cursor:pointer;transition:border-color .16s ease,background .16s ease,box-shadow .16s ease}.bk-payment-choice .bk-payment-option:hover{border-color:#fda4af;background:#fff8f8}.bk-payment-choice .bk-payment-option.selected{border-color:#e11d48;background:#fff1f2;box-shadow:0 0 0 1px #e11d4820}.bk-payment-choice input[type="radio"]{appearance:auto;flex:none;width:16px;height:16px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;accent-color:#be123c;cursor:pointer}.bk-payment-choice input[type="radio"]:focus-visible{outline:2px solid #be123c;outline-offset:3px}.bk-payment-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#f1f5f9;color:#64748b;font-size:16px;font-weight:900}.bk-payment-option.selected .bk-payment-icon{background:#ffe4e6;color:#be123c}.bk-payment-copy{display:grid;gap:2px;min-width:0}.bk-payment-copy strong{font-size:13px}.bk-payment-copy small{color:#64748b;font-size:11px;font-weight:500}.bk-payment-check{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#be123c;color:#fff;font-size:13px;font-weight:900}.bk-payment-option:not(.selected) .bk-payment-check{visibility:hidden}
  .bk-payment{display:grid;justify-items:center;gap:10px;margin:14px auto;max-width:390px}.bk-payment img{width:240px;height:240px;object-fit:contain}.bk-payment dl{width:100%;margin:0;padding:12px;background:#f8fafc;border-radius:10px;text-align:left}.bk-payment dl div{display:flex;justify-content:space-between;gap:14px;padding:5px 0;font-size:12px}.bk-payment dt{color:#64748b}.bk-payment dd{margin:0;font-weight:800;text-align:right;overflow-wrap:anywhere}
  .bk-price-breakdown{display:grid;grid-template-columns:1fr auto;gap:7px 12px;align-items:center;margin:12px 0;padding:12px 14px;border-radius:10px;background:#f8fafc;color:#475569;font-size:13px}.bk-price-breakdown del{color:#94a3b8}.bk-price-breakdown>strong{color:#334155}.bk-price-breakdown .bk-done-total{margin:0;color:#9f1239;font-size:20px;text-align:right}.bk-promo{margin:12px 0;padding:12px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}.bk-promo>label{display:block;margin-bottom:7px;color:#334155;font-size:12px;font-weight:800}.bk-promo-controls{display:flex;gap:8px}.bk-promo-controls input{flex:1;min-width:0;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;font:inherit;font-size:13px;text-transform:uppercase}.bk-promo-controls button{min-height:40px;padding:0 13px}.bk-promo-message,.bk-promo-success{margin:8px 0 0!important;font-size:12px!important;line-height:1.5}.bk-promo-message{color:#b91c1c!important}.bk-promo-success{color:#15803d!important;font-weight:750}
  @media(max-width:800px){.bk-layout{grid-template-columns:1fr}.bk-summary-panel{position:static;order:-1}.bk-summary-panel dl>div{grid-template-columns:1fr 1.4fr}.bk-stepper{margin-right:20px;margin-left:20px}.bk-flow{width:min(680px,100%)}}
  @media(max-width:520px){.bk-slots{grid-template-columns:repeat(4,minmax(0,1fr))}.bk-modal{padding:20px 16px}.bk-flow{padding:0}.bk-stepper{margin:0 0 18px;gap:2px}.bk-step{gap:4px;font-size:9px}.bk-step>span{width:26px;height:26px}.bk-step:not(:last-child):after{left:29px;top:12px;right:3px}.bk-main-panel,.bk-summary-panel{padding:17px 14px}.bk-date-options{gap:3px}.bk-date-option{min-height:52px}.bk-date-option small{font-size:8px}.bk-date-option strong{font-size:11px}.bk-contact-grid{grid-template-columns:1fr}.bk-note-field{grid-column:auto}.bk-sidebar-actions .bk-primary,.bk-sidebar-actions .bk-secondary{font-size:11px}}
`;

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function FindPitchPage() {
  const { user, authChecked } = useSiteAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [available, setAvailable] = useState<AvailablePitch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [size, setSize] = useState<number | null>(null);
  const [sportId, setSportId] = useState<number | null>(null);
  const [area, setArea] = useState('');
  const [keyword, setKeyword] = useState('');
  const [date, setDate] = useState(localToday);
  const [start, setStart] = useState('18:00');
  const [duration, setDuration] = useState(1);
  const [sort, setSort] = useState('featured');
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
  const [booking, setBooking] = useState<Pitch | null>(null);
  const [requestedPitchId, setRequestedPitchId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Pitch[]>('/api/platform/pitches'),
      api<Sport[]>('/api/platform/sports'),
    ])
      .then(([pitchData, sportData]) => {
        if (!active) return;
        setPitches(pitchData);
        setSports(sportData);
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Không tải được danh sách sân.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedDate = params.get('ngay');
    const selectedArea = params.get('khuVuc');
    const selectedSportId = Number(params.get('sportId'));
    const selectedPitch = Number(params.get('sanId'));
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) setDate(selectedDate);
    if (selectedArea) setArea(selectedArea);
    if (Number.isSafeInteger(selectedSportId) && selectedSportId > 0) setSportId(selectedSportId);
    if (Number.isSafeInteger(selectedPitch) && selectedPitch > 0) setRequestedPitchId(selectedPitch);
  }, []);

  const activePitches = useMemo(() => pitches.filter(pitch => pitch.trangThai === 'HOAT_DONG'), [pitches]);
  const basePitches = available ? available.map(item => item.san) : pitches;
  const areas = useMemo(
    () => [...new Set(activePitches.map(pitch => pitch.diaChi?.split(',').at(-1)?.trim()).filter((value): value is string => Boolean(value)))],
    [activePitches],
  );
  const startOptions = useMemo(
    () => Array.from({ length: 34 }, (_, index) => timeLabel((6 * 60) + index * 30)),
    [],
  );
  const visiblePitches = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase();
    const filtered = basePitches.filter(pitch =>
      (sportId === null || pitch.sportId === sportId) &&
      (size === null || pitch.soNguoi === size) &&
      (requestedPitchId === null || pitch.id === requestedPitchId) &&
      (!area || (pitch.diaChi ?? '').toLocaleLowerCase().includes(area.toLocaleLowerCase())) &&
      (!query || `${pitch.categoryName ?? ''} ${pitch.ten} ${pitch.diaChi ?? ''} ${pitch.moTa ?? ''}`.toLocaleLowerCase().includes(query))
    );
    return filtered.sort((first, second) => {
      if (sort === 'price-asc') return first.giaGio - second.giaGio;
      if (sort === 'price-desc') return second.giaGio - first.giaGio;
      if (sort === 'name') return first.ten.localeCompare(second.ten, 'vi');
      return first.id - second.id;
    });
  }, [area, basePitches, keyword, requestedPitchId, size, sort, sportId]);
  const visiblePitchCards = useMemo(() => groupPitchCards(visiblePitches), [visiblePitches]);

  const resetFilters = () => {
    setAvailable(null);
    setSize(null);
    setSportId(null);
    setArea('');
    setKeyword('');
    setDate(localToday());
    setStart('18:00');
    setDuration(1);
    setError('');
    setRequestedPitchId(null);
  };

  const changeStartTime = (value: string) => {
    setStart(value);
    const latestDuration = (23 * 60 - timeMinutes(value)) / 60;
    setDuration(current => Math.min(current, latestDuration));
  };
  const end = timeLabel(timeMinutes(start) + duration * 60);
  const durationOptions = Array.from(
    { length: Math.floor(((23 * 60 - timeMinutes(start)) / 30)) },
    (_, index) => (index + 1) / 2,
  ).filter(value => value <= 4);

  async function findAvailable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setError('');
    try {
      const params = new URLSearchParams({ ngay: date, gioBatDau: start, gioKetThuc: end });
      if (sportId !== null) params.set('sportId', String(sportId));
      setAvailable(await api<AvailablePitch[]>(`/api/platform/pitches/available?${params.toString()}`));
      document.getElementById('san-noi-bat')?.scrollIntoView({ behavior: 'smooth' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tìm được sân trống.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <PublicSite>

      <section className="fl-hero">
        <div className="fl-hero-inner">
          <div>
            <span className="fl-kicker">Tìm sân thể thao · FAGLEAGUE247</span>
            <h1>TÌM SÂN THỂ THAO PHÙ HỢP</h1>
            <p className="fl-intro">Lọc sân theo môn thể thao, khu vực và khung giờ; thông tin, giá và lịch được lấy trực tiếp từ FAG247.</p>
            <div className="fl-stats">
              <div className="fl-stat"><strong>{loading ? '…' : groupPitchCards(activePitches).length}</strong><span>Danh mục đang hoạt động</span></div>
              <div className="fl-stat"><strong>{loading ? '…' : pitches.length}</strong><span>Tổng sân con trong hệ thống</span></div>
            </div>
          </div>
          <div className="fl-art" aria-hidden="true"><div className="fl-orbit" /><div className="fl-orbit two" /><div className="fl-ball">⚽</div><span className="fl-art-tag">PLAY YOUR GAME</span></div>
        </div>
      </section>

      <form className="fl-search" id="tim-kiem" onSubmit={findAvailable}>
        <div className="fl-search-title"><span className="fl-search-icon">⌕</span><div><h2>Tìm sân phù hợp</h2><p>Lọc danh sách sân đang hoạt động và kiểm tra giờ còn trống.</p></div></div>
        <div className="fl-sport-tabs" role="group" aria-label="Môn thể thao">
          <button className={`fl-sport-tab${sportId === null ? ' active' : ''}`} type="button" onClick={() => { setSportId(null); setSize(null); setAvailable(null); }}>Tất cả môn</button>
          {sports.map(sport => <button
            key={sport.id}
            className={`fl-sport-tab${sportId === sport.id ? ' active' : ''}`}
            type="button"
            onClick={() => { setSportId(sport.id); setSize(null); setAvailable(null); }}
          >{sport.name}</button>)}
        </div>
        <div className="fl-fields">
          <label>Từ khóa tìm kiếm<input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Tên sân, tên đường..." /></label>
          <label>Khu vực<select value={area} onChange={event => setArea(event.target.value)}><option value="">Tất cả khu vực</option>{areas.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label>Ngày đặt sân<input type="date" min={localToday()} value={date} onChange={event => setDate(event.target.value)} required /></label>
          <label>Khung giờ bắt đầu<select value={start} onChange={event => changeStartTime(event.target.value)}>{startOptions.map((time, index) => <option key={time} value={time}>{time} – {timeLabel(timeMinutes(time) + 30)}</option>)}</select></label>
          <label>Thời lượng<select value={duration} onChange={event => setDuration(Number(event.target.value))}>{durationOptions.map(value => <option key={value} value={value}>{durationLabel(value)}</option>)}</select></label>
        </div>
        <div className="fl-search-tools">
          {(!sportId || ['Bóng đá', 'Bóng đá futsal'].includes(sports.find(sport => sport.id === sportId)?.name ?? '')) && (
            <div className="fl-sport-tabs" role="group" aria-label="Quy mô sân">
              {[null, 5, 7, 11].map(value => <button key={value ?? 'all'} className={`fl-sport-tab ${size === value ? 'active' : ''}`} type="button" onClick={() => setSize(value)}>{value ? `Sân ${value} người` : 'Tất cả quy mô'}</button>)}
            </div>
          )}
          <div className="fl-search-actions">
            <button className="fl-clear" type="button" onClick={resetFilters}>Xóa lọc</button>
            <button className="fl-apply" type="submit" disabled={searching}>{searching ? 'Đang tìm…' : 'Tìm sân còn trống'}</button>
          </div>
        </div>
      </form>

      <section className="fl-size-summary" aria-label="Thống kê số lượng sân theo quy mô">
        {[5, 7, 11].map(players => {
          const matching = pitches.filter(pitch => pitch.soNguoi === players);
          const active = matching.filter(pitch => pitch.trangThai === 'HOAT_DONG').length;
          return <div className="fl-size-card" key={players}>
            <strong>{loading ? '…' : matching.length}</strong>
            <span>Sân {players} người</span>
            <small>{active} hoạt động · {matching.length - active} bảo trì</small>
          </div>;
        })}
        <div className="fl-size-card">
          <strong>{loading ? '…' : pitches.length}</strong>
          <span>Tổng số mặt sân</span>
          <small>{loading ? 'Đang tải dữ liệu' : `${activePitches.length} hoạt động · ${pitches.length - activePitches.length} bảo trì`}</small>
        </div>
      </section>

      <section className="fl-section" id="san-noi-bat">
        <div className="fl-results-bar">
          <div><div className="fl-results-title">Danh sách sân thể thao <span className="fl-count">{visiblePitchCards.length} cụm sân</span></div><p className="fl-results-subtitle">{available ? `Sân trống ngày ${date}, ${start} – ${end}` : 'Đặt lịch trực tuyến, thông tin và giá lấy từ hệ thống FAG247'}</p></div>
          <div className="fl-view-tools">
            <select className="fl-sort" aria-label="Sắp xếp sân" value={sort} onChange={event => setSort(event.target.value)}>
              <option value="featured">Mặc định</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option><option value="name">Tên sân A–Z</option>
            </select>
            <div className="fl-view-toggle" role="group" aria-label="Kiểu hiển thị">
              <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>Lưới</button>
              <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Danh sách</button>
              <button type="button" className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Bản đồ</button>
            </div>
          </div>
        </div>
        {error && <p className="fl-error" role="alert">{error}</p>}
        {view === 'map' && (
          <div className="fl-map-panel">
            <div className="fl-map-message">
              {loading ? <p>Đang tải danh sách sân…</p> : error ? <p role="alert">{error}</p> : visiblePitches.length === 0 ? <p>Không có sân phù hợp bộ lọc.</p> : (
                <>
                  <strong>Sân thể thao trong khu vực bạn chọn</strong>
                  <p>Chọn một sân để mở địa chỉ trên Google Maps. Danh sách và địa chỉ được lấy từ backend.</p>
                  {visiblePitchCards.map(pitch => <p key={pitch.categoryId ?? pitch.id}>📍 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pitch.diaChi ?? pitch.centerName ?? pitch.ten)}`} target="_blank" rel="noreferrer">{pitch.categoryName || pitch.centerName || pitch.ten} — {pitch.diaChi || 'Chưa cập nhật địa chỉ'}</a></p>)}
                </>
              )}
            </div>
          </div>
        )}
        {view !== 'map' && <div className={`fl-venue-grid ${view}`}>
          {loading && <div className="fl-loading">Đang tải danh sách sân…</div>}
          {!loading && !error && visiblePitchCards.map(pitch => {
            const categoryPitches = getCategoryPitches(pitches, pitch);
            const activeCategoryPitches = categoryPitches.filter(item => item.trangThai === 'HOAT_DONG');
            const availableCategoryPitches = available
              ? getCategoryPitches(available.map(item => item.san), pitch)
              : [];
            const minPrice = Math.min(...categoryPitches.map(item => item.giaGio));
            const minPeakPrice = Math.min(...categoryPitches.map(item => item.giaGioCaoDiem));
            const visual = getPitchVisual(pitch.sportName, pitch.id);
            const image = pitch.hinhAnh || visual.image;
            const isActive = activeCategoryPitches.length > 0;
            const pitchTitle = pitch.categoryName || pitch.ten;
            const sizeLabel = pitch.soNguoi ? `Sân ${pitch.soNguoi} người` : pitch.sportName;
            return (
              <article className="fl-venue" key={pitch.id}>
              <div className={`fl-venue-image ${image ? '' : 'no-image sport-illustration'}`}>
                {image && <img className="fl-venue-photo" src={image} alt="" />}
                {!image && <span className="sport-illustration-icon" aria-hidden="true">{visual.icon}</span>}
                <span className="fl-size">{sizeLabel}</span>
                <span className={`fl-venue-status${!isActive ? ' maintenance' : ''}`}>{isActive ? 'Đang hoạt động' : 'Đang bảo trì'}</span>
                {!pitch.hinhAnh && <span className="fl-image-note">Ảnh minh họa</span>}
              </div>
              <div className="fl-venue-body">
                <div className="fl-address">⌖ {pitch.diaChi || 'Chưa cập nhật địa chỉ'}</div>
                <h3><Link href={`/tim-san?sanId=${pitch.id}`} className="fl-venue-detail-link">{pitchTitle}</Link></h3>
                <div className="fl-location-count">Danh mục {pitchTitle}: {categoryPitches.length} sân con</div>
                <p className="fl-pitch-description">{pitch.moTa || 'Chưa có mô tả chi tiết cho sân này.'}</p>
                {!!pitch.tienIch?.length && <div className="fl-amenities" aria-label="Tiện ích">
                  {pitch.tienIch.map(item => <span key={item}>{item}</span>)}
                </div>}
                <div className="fl-hours"><span>{available ? (availableCategoryPitches.length ? 'Còn sân trống' : 'Hết sân trống') : isActive ? 'Đang hoạt động' : 'Không nhận đặt'}</span><span>{pitch.gioMo?.slice(0, 5)} – {pitch.gioDong?.slice(0, 5)}</span></div>
                <div className="fl-prices"><strong>Từ {vnd(minPrice)}<small> / giờ</small></strong><span>Cao điểm từ {vnd(minPeakPrice)}/giờ</span></div>
                {!isActive ? (
                  <span className="fl-book" aria-disabled="true">Tạm ngưng nhận đặt</span>
                ) : authChecked && user ? (
                  <button type="button" className="fl-book fl-book-btn" onClick={() => setBooking(pitch)}>Đặt sân ngay <span>→</span></button>
                  ) : (
                    <Link className="fl-book" href="/dang-nhap">Đăng nhập để đặt sân <span>→</span></Link>
                  )}
                </div>
              </article>
            );
          })}
          {!loading && !error && visiblePitches.length === 0 && <div className="fl-empty">{available ? 'Không có sân trống khớp với lựa chọn. Hãy đổi ngày, giờ hoặc quy mô sân.' : 'Chưa có sân nào phù hợp bộ lọc.'}</div>}
        </div>}
      </section>

      {booking && (
        <BookingModal
          key={booking.id}
          pitch={booking}
          categoryPitches={getCategoryPitches(activePitches, booking)
            .sort((first, second) => first.ten.localeCompare(second.ten, 'vi'))}
          initialDate={date}
          initialFrom={available ? start : null}
          initialTo={available ? end : null}
          onClose={() => setBooking(null)}
        />
      )}
      </PublicSite>
    </>
  );
}
