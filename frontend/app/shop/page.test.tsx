import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SiteAuthProvider } from '@/components/site-auth';
import ShopPage from './page';

describe('ShopPage', () => {
  it('renders the separate homepage sections and links to the search page', () => {
    const markup = renderToStaticMarkup(
      <SiteAuthProvider><ShopPage /></SiteAuthProvider>,
    );

    expect(markup).toContain('Đặt sân thể thao');
    expect(markup).toContain('href="/tim-san"');
    expect(markup).toContain('Tìm sân nhanh');
    expect(markup).toContain('FAGLEAGUE247 Pro');
    expect(markup).toContain('Đánh giá người chơi');
    expect(markup).not.toContain('ĐÁNH GIÁ MẪU · HƯ CẤU');
    expect(markup).not.toContain('Người chơi mẫu A');
    expect(markup).not.toContain('Từ khóa tìm kiếm');
  });
});
