'use client';

import { useState, type FormEvent } from 'react';
import zaloProfileQr from '@/app/assets/zalo-profile-qr.png';

const contacts = [
  { label: 'Chat với nhân viên', icon: 'support', className: 'contact-float-chat', chat: true },
  { label: 'Liên hệ Zalo', href: 'https://zalo.me/3894196696036261863', icon: 'Zalo', className: 'contact-float-zalo', qr: true },
  { label: 'Facebook', href: 'https://www.facebook.com/ntnthuong0307', icon: 'f', className: 'contact-float-facebook', external: true },
  { label: 'Gmail', href: 'mailto:nguyentranngocthuong376@gmail.com', icon: '✉', className: 'contact-float-email' },
];

export default function ContactFloat() {
  const [open, setOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatSubmitted, setChatSubmitted] = useState(false);

  const showZaloQr = () => {
    setOpen(false);
    setShowQr(true);
  };

  const startChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChatSubmitted(true);
  };

  return (
    <aside className="contact-float" aria-label="Liên hệ hỗ trợ">
      {open && (
        <nav className="contact-float-panel" aria-label="Các kênh liên hệ">
          {contacts.map(contact => (
            'chat' in contact && contact.chat ? (
              <button
                className="contact-float-link"
                type="button"
                key={contact.label}
                onClick={() => {
                  setOpen(false);
                  setChatSubmitted(false);
                  setShowChat(true);
                }}
              >
                <span className={`contact-float-icon ${contact.className}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <rect x="3.5" y="12" width="4" height="6" rx="2" fill="currentColor" />
                    <rect x="16.5" y="12" width="4" height="6" rx="2" fill="currentColor" />
                    <path d="M18.5 18a3 3 0 0 1-3 3h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="10" r="2.5" fill="currentColor" />
                    <path d="M7.5 19a4.5 4.5 0 0 1 9 0" fill="currentColor" />
                  </svg>
                </span>
                <span>{contact.label}</span>
              </button>
            ) : 'qr' in contact && contact.qr ? (
              <button className="contact-float-link" type="button" key={contact.label} onClick={showZaloQr}>
                <span className={`contact-float-icon ${contact.className}`} aria-hidden="true">{contact.icon}</span>
                <span>{contact.label}</span>
              </button>
            ) : (
              <a
                className="contact-float-link"
                href={contact.href}
                key={contact.label}
                target={'external' in contact && contact.external ? '_blank' : undefined}
                rel={'external' in contact && contact.external ? 'noreferrer' : undefined}
              >
                <span className={`contact-float-icon ${contact.className}`} aria-hidden="true">
                  {contact.icon}
                </span>
                <span>{contact.label}</span>
              </a>
            )
          ))}
        </nav>
      )}
      <button
        className="contact-float-toggle"
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Đóng các cách liên hệ' : 'Mở các cách liên hệ'}
        onClick={() => setOpen(value => !value)}
      >
        {open ? '×' : <>Liên hệ <span aria-hidden="true">♧</span></>}
      </button>
      {showChat && (
        <div className="contact-chat-backdrop" onClick={event => {
          if (event.target === event.currentTarget) {
            setShowChat(false);
            setChatSubmitted(false);
          }
        }}>
          <section className={`contact-chat-window${chatSubmitted ? ' is-submitted' : ''}`} role="dialog" aria-modal="true" aria-labelledby={chatSubmitted ? 'contact-chat-success-title' : 'contact-chat-title'}>
            <header className="contact-chat-header">
              <div>
                <h2 id={chatSubmitted ? 'contact-chat-success-title' : 'contact-chat-title'}>{chatSubmitted ? 'Cảm ơn bạn!' : 'Chat với nhân viên tư vấn'}</h2>
                <p><span className="contact-chat-avatar" aria-hidden="true">♧</span> Em ở đây để hỗ trợ cho mình ạ</p>
              </div>
              <button type="button" aria-label="Đóng khung chat" onClick={() => {
                setShowChat(false);
                setChatSubmitted(false);
              }}>×</button>
            </header>
            {chatSubmitted ? (
              <div className="contact-chat-success" role="status">
                <span className="contact-chat-success-check" aria-hidden="true">✓</span>
                <h3>Vui lòng đợi</h3>
                <p>Sẽ có người liên hệ hỗ trợ bạn sớm nhất.</p>
                <small>Bạn vẫn ở trên trang này. Để liên hệ trực tiếp, hãy chọn Zalo, Facebook hoặc Gmail trong mục Liên hệ.</small>
                <button className="contact-chat-submit" type="button" onClick={() => {
                  setChatSubmitted(false);
                  setShowChat(false);
                }}>ĐÓNG</button>
              </div>
            ) : <form className="contact-chat-form" onSubmit={startChat}>
              <strong>Thông tin cơ bản</strong>
              <label className="visually-hidden" htmlFor="contact-chat-name">Họ tên</label>
              <input id="contact-chat-name" name="name" autoComplete="name" placeholder="Nhập tên của bạn *" required maxLength={100} />
              <label className="visually-hidden" htmlFor="contact-chat-email">Email</label>
              <input id="contact-chat-email" name="email" type="email" autoComplete="email" placeholder="Nhập email của bạn *" required maxLength={150} />
              <label className="visually-hidden" htmlFor="contact-chat-phone">Số điện thoại</label>
              <input id="contact-chat-phone" name="phone" type="tel" autoComplete="tel" placeholder="Nhập số điện thoại của bạn *" required maxLength={20} />
              <strong>Thông tin bổ sung</strong>
              <label className="visually-hidden" htmlFor="contact-chat-gender">Giới tính</label>
              <select id="contact-chat-gender" name="gender" defaultValue="" required>
                <option value="" disabled>Giới tính *</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
                <option value="Không muốn chia sẻ">Không muốn chia sẻ</option>
              </select>
              <label className="visually-hidden" htmlFor="contact-chat-message">Tin nhắn</label>
              <textarea id="contact-chat-message" name="message" rows={4} maxLength={1000} placeholder="Tin nhắn *" required />
              <button className="contact-chat-submit" type="submit"><span aria-hidden="true">➤</span> BẮT ĐẦU TRÒ CHUYỆN</button>
              <small>Điền đầy đủ thông tin để nhân viên có thể liên hệ hỗ trợ.</small>
            </form>}
          </section>
        </div>
      )}
      {showQr && (
        <div className="contact-float-qr-backdrop" onClick={event => {
          if (event.target === event.currentTarget) setShowQr(false);
        }}>
          <section className="contact-float-qr" role="dialog" aria-modal="true" aria-labelledby="contact-float-qr-title">
            <button className="contact-float-qr-close" type="button" aria-label="Đóng mã QR" onClick={() => setShowQr(false)}>×</button>
            <span className="contact-float-qr-brand">Zalo</span>
            <h2 id="contact-float-qr-title">Nguyễn Trần Ngọc Thưởng</h2>
            <p>Quét mã bằng Zalo để mở trang liên hệ.</p>
            <img src={zaloProfileQr.src} alt="Mã QR Zalo của Nguyễn Trần Ngọc Thưởng" />
            <a href={contacts[1].href} target="_blank" rel="noreferrer">Mở Zalo</a>
          </section>
        </div>
      )}
    </aside>
  );
}
