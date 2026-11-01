const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
export async function api<T = any>(path: string, o: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const t = localStorage.getItem('sb_token');
  let r: Response;
  try {
    r = await fetch(BASE + path, {
      method: o.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: o.body ? JSON.stringify(o.body) : undefined,
      signal: o.signal,
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new Error(`Không thể kết nối backend tại ${BASE}. Hãy kiểm tra Spring Boot đang chạy rồi thử lại.`);
    }
    throw cause;
  }
  const d = await r.json().catch(() => null);
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem('sb_token');
      if (path !== '/api/auth/dang-nhap') location.href = '/dang-nhap';
      throw new Error(d?.message ?? 'Bạn cần đăng nhập lại');
    }
    if (r.status === 403) {
      throw new Error(d?.message ?? 'Bạn không có quyền thực hiện thao tác này');
    }
    if (r.status === 404) {
      throw new Error('API không tồn tại hoặc backend đang chạy cũ. Hãy khởi động lại Spring Boot và đăng nhập lại.');
    }
    throw new Error(d?.message ?? 'Có lỗi xảy ra, thử lại sau');
  }
  return d as T;
}
export const vnd = (n: number) => n.toLocaleString('vi-VN') + ' đ';
export const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const paymentMethodLabel = (method: string | null | undefined) => {
  switch (method) {
    case 'TAI_SAN':
      return 'Thanh toán tại sân';
    case 'CHUYEN_KHOAN':
      return 'Chuyển khoản QR';
    default:
      return method || 'Thanh toán tại sân';
  }
};
