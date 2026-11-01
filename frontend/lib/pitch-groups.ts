type PitchGroupItem = {
  id: number;
  ten: string;
  categoryId?: number | null;
  categoryName?: string | null;
  centerId?: number;
  centerName?: string;
  sportId: number;
  soNguoi: number;
  diaChi: string | null;
};

const letteredFieldName = /^(.*\S)\s+([A-Z])$/;

export function getPitchFamilyName(name: string) {
  return name.match(letteredFieldName)?.[1] ?? name;
}

export function isLetteredPitchName(name: string) {
  return letteredFieldName.test(name);
}

export function groupPitchCards<T extends PitchGroupItem>(pitches: T[]) {
  const groups = new Map<string, T>();
  for (const pitch of pitches) {
    const key = pitch.categoryId != null ? `category:${pitch.categoryId}` : `pitch:${pitch.id}`;
    if (!groups.has(key)) groups.set(key, pitch);
  }
  return [...groups.values()];
}

export function getCategoryPitches<T extends PitchGroupItem>(pitches: T[], pitch: T) {
  if (pitch.categoryId == null) return pitches.filter(item => item.id === pitch.id);
  return pitches.filter(item =>
    item.categoryId === pitch.categoryId,
  );
}
