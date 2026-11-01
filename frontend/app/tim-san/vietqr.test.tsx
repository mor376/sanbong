import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import { createVietQrPayload, crc16Ccitt } from '@/lib/vietqr';

describe('VietQR payload', () => {
  it('generates a dynamic transfer QR payload with amount and booking reference', () => {
    const payload = createVietQrPayload(220_000, 'SAN1234ABCD');

    expect(payload).toContain('5406220000');
    expect(payload).toContain('060314217406');
    expect(payload).toContain('SAN1234ABCD');
    expect(payload.slice(-8, -4)).toBe('6304');
    expect(payload.slice(-4)).toBe(crc16Ccitt(payload.slice(0, -4)));
  });

  it('uses the standard CRC-16/CCITT-FALSE checksum', () => {
    expect(crc16Ccitt('123456789')).toBe('29B1');
  });

  it('creates scannable QR matrix data and changes when the amount changes', () => {
    const qr220 = QRCode.create(createVietQrPayload(220_000, 'SAN1234ABCD'));
    const qr440 = QRCode.create(createVietQrPayload(440_000, 'SAN1234ABCD'));

    expect(qr220.modules.size).toBeGreaterThan(0);
    expect(qr440.modules.size).toBe(qr220.modules.size);
    expect(qr220.modules.data).not.toEqual(qr440.modules.data);
  });

  it('rejects invalid amount and booking identifiers', () => {
    expect(() => createVietQrPayload(0, 'SAN1234ABCD')).toThrow('Số tiền thanh toán không hợp lệ.');
    expect(() => createVietQrPayload(1000, 'bad')).toThrow('Mã thanh toán không hợp lệ.');
  });
});
