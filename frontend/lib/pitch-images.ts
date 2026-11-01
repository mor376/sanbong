import campNou from '@/app/assets/san-van-dong-camp-nou.jpg';
import stadiumAerial from '@/app/assets/1765667692975_sanvandong1.webp';
import stadiumEvening from '@/app/assets/trong-dong-stadium.webp';
import stadiumExterior from '@/app/assets/san-van-dong-trong-dong-17854047182621405046794.webp';
import stadiumInterior from '@/app/assets/san-van-dong-dep-nhat-the-gioi-3-1730679496.jpeg';
import stadiumNight from '@/app/assets/h5-172621341807738177746.webp';

const pitchImages = [
  stadiumAerial,
  stadiumNight,
  stadiumEvening,
  stadiumExterior,
  campNou,
  stadiumInterior,
];

export function getPitchImage(pitchId: number) {
  const index = Math.abs(pitchId) % pitchImages.length;
  return pitchImages[index].src;
}

export function getPitchVisual(sportName: string | null | undefined, pitchId: number) {
  const sport = sportName?.toLocaleLowerCase('vi') ?? '';
  const image = sport.includes('bóng đá') || sport.includes('futsal')
    ? getPitchImage(pitchId)
    : null;
  const icon = sport.includes('quần vợt') || sport.includes('tennis') ? '🎾'
    : sport.includes('bóng rổ') || sport.includes('basketball') ? '🏀'
      : sport.includes('bóng chuyền') || sport.includes('volleyball') ? '🏐'
        : sport.includes('cầu lông') || sport.includes('badminton') ? '🏸'
          : sport.includes('bóng đá') || sport.includes('futsal') ? '⚽'
            : '🏟️';

  return { image, icon };
}

export function getPitchGalleryImages(pitchId: number) {
  return Array.from({ length: 3 }, (_, index) =>
    pitchImages[(Math.abs(pitchId) + index + 1) % pitchImages.length].src,
  );
}
