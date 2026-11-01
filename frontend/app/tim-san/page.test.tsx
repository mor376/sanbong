import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SiteAuthProvider } from '@/components/site-auth';
import FindPitchPage from './page';

describe('FindPitchPage', () => {
  it('renders backend-backed search and display controls on its own route', () => {
    const markup = renderToStaticMarkup(
      <SiteAuthProvider><FindPitchPage /></SiteAuthProvider>,
    );

    expect(markup).toContain('Tìm sân phù hợp');
    expect(markup).toContain('Từ khóa tìm kiếm');
    expect(markup).toContain('Tất cả quy mô');
    expect(markup).toContain('Thời lượng');
    expect(markup).toContain('30 phút');
    expect(markup).toContain('Bản đồ');
    expect(markup).toContain('Danh sách sân thể thao');
    expect(markup).toContain('Thống kê số lượng sân theo quy mô');
    expect(markup).toContain('Tổng số mặt sân');
    expect(markup).not.toContain('Đặt sân trong 3 bước');
  });
});
