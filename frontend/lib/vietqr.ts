const ACCOUNT_NUMBER = '060314217406';
const BANK_BIN = '970403';
const ACCOUNT_NAME = 'TRANTANDAT';

function field(tag: string, value: string) {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`;
}

export function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index++) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function createVietQrPayload(amount: number, transferReference: string) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Số tiền thanh toán không hợp lệ.');
  if (!/^SAN[0-9A-F]{8}$/.test(transferReference)) throw new Error('Mã thanh toán không hợp lệ.');

  const bankAccount = field('00', BANK_BIN)
    + field('01', ACCOUNT_NUMBER)
    + field('02', 'QRIBFTTA');
  const merchantAccount = field('00', 'A000000727') + field('01', bankAccount);
  const transferNote = transferReference;
  const payload = field('00', '01')
    + field('01', '12')
    + field('38', merchantAccount)
    + field('53', '704')
    + field('54', String(amount))
    + field('58', 'VN')
    + field('59', ACCOUNT_NAME)
    + field('60', 'HO CHI MINH')
    + field('62', field('08', transferNote))
    + '6304';

  return payload + crc16Ccitt(payload);
}
