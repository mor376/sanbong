import { describe, expect, it, vi } from 'vitest';
import { getPitchGalleryImages, getPitchImage, getPitchVisual } from '@/lib/pitch-images';

vi.mock('@/app/assets/1765667692975_sanvandong1.webp', () => ({
  default: { src: '/assets/aerial.webp' },
}));
vi.mock('@/app/assets/h5-172621341807738177746.webp', () => ({
  default: { src: '/assets/night.webp' },
}));
vi.mock('@/app/assets/trong-dong-stadium.webp', () => ({
  default: { src: '/assets/evening.webp' },
}));
vi.mock('@/app/assets/san-van-dong-trong-dong-17854047182621405046794.webp', () => ({
  default: { src: '/assets/exterior.webp' },
}));
vi.mock('@/app/assets/san-van-dong-camp-nou.jpg', () => ({
  default: { src: '/assets/camp-nou.jpg' },
}));
vi.mock('@/app/assets/san-van-dong-dep-nhat-the-gioi-3-1730679496.jpeg', () => ({
  default: { src: '/assets/interior.jpeg' },
}));

describe('pitch image fallbacks', () => {
  it('selects a stable local image for each pitch', () => {
    const images = Array.from({ length: 6 }, (_, index) => getPitchImage(index + 1));

    expect(images).toHaveLength(6);
    expect(new Set(images).size).toBe(6);
    expect(getPitchImage(1)).toBe(images[0]);
  });

  it('provides three distinct gallery images that differ from the cover', () => {
    const cover = getPitchImage(4);
    const gallery = getPitchGalleryImages(4);

    expect(gallery).toHaveLength(3);
    expect(new Set(gallery).size).toBe(3);
    expect(gallery).not.toContain(cover);
  });

  it('uses football photos only for football and sport-specific illustrations otherwise', () => {
    expect(getPitchVisual('Bóng đá', 1)).toMatchObject({ image: getPitchImage(1), icon: '⚽' });
    expect(getPitchVisual('Quần vợt', 1)).toMatchObject({ image: null, icon: '🎾' });
    expect(getPitchVisual('Bóng rổ', 1)).toMatchObject({ image: null, icon: '🏀' });
    expect(getPitchVisual('Bóng chuyền', 1)).toMatchObject({ image: null, icon: '🏐' });
  });
});
