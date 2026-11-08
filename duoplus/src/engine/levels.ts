/** Toplam XP = 30L² + 10L − 40  (Seviye 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 30 * level * level + 10 * level - 40;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number; // 0..1
}

const TITLES: Array<[number, string]> = [
  [1, 'Çaylak'],
  [5, 'Düzenli'],
  [10, 'Azimli'],
  [20, 'Disiplinli'],
  [35, 'Usta'],
  [50, 'Efsane'],
  [75, 'Büyük Usta'],
  [100, 'Ölümsüz'],
];

export function titleForLevel(level: number): string {
  let t = TITLES[0][1];
  for (const [min, name] of TITLES) if (level >= min) t = name;
  return t;
}

export function levelFromXp(xp: number): LevelInfo {
  const safe = Math.max(0, xp);
  let level = 1;
  while (xpForLevel(level + 1) <= safe && level < 200) level++;
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    title: titleForLevel(level),
    xp: safe,
    currentLevelXp: cur,
    nextLevelXp: next,
    progress: (safe - cur) / (next - cur),
  };
}
