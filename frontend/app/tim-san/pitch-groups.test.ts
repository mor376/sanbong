import { describe, expect, it } from 'vitest';
import { getCategoryPitches, groupPitchCards } from '@/lib/pitch-groups';

const tanBinhPitches = ['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4'].map((name, index) => ({
  id: index + 1,
  ten: name,
  categoryId: 10,
  categoryName: 'Sân 5B',
  centerId: 10,
  centerName: 'Sân bóng Thành Công',
  sportId: 1,
  soNguoi: index < 2 ? 5 : 7,
  diaChi: '18 Cộng Hòa, Quận Tân Bình, TP.HCM',
}));

describe('pitch family grouping', () => {
  it('shows a category once and lets it select its numbered child fields', () => {
    expect(groupPitchCards(tanBinhPitches)).toEqual([tanBinhPitches[0]]);
    expect(tanBinhPitches[0].categoryName).toBe('Sân 5B');
    expect(getCategoryPitches(tanBinhPitches, tanBinhPitches[0])).toEqual(tanBinhPitches);
  });

  it('keeps categories at the same center as separate cards', () => {
    const otherCategory = { ...tanBinhPitches[0], id: 5, categoryId: 11, categoryName: 'Sân 5C' };
    expect(groupPitchCards([...tanBinhPitches, otherCategory])).toEqual([
      tanBinhPitches[0],
      otherCategory,
    ]);
  });

  it('does not group legacy rows that have no category id', () => {
    expect(groupPitchCards([
      { ...tanBinhPitches[0], id: 20, categoryId: null },
      { ...tanBinhPitches[0], id: 21, categoryId: null },
    ])).toHaveLength(2);
  });
});
