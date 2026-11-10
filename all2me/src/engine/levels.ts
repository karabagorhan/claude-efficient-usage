/** Toplam XP = 30L² + 10L − 40  (Seviye 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 30 * level * level + 10 * level - 40;
}

export interface LevelInfo {
  level: number;
  /** i18n anahtarı, ör. 'points.level.rookie' */
  titleKey: string;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number; // 0..1
}

const TITLES: Array<[number, string]> = [
  [1, 'points.level.rookie'],
  [5, 'points.level.regular'],
  [10, 'points.level.determined'],
  [20, 'points.level.disciplined'],
  [35, 'points.level.master'],
  [50, 'points.level.legend'],
  [75, 'points.level.grandmaster'],
  [100, 'points.level.immortal'],
];

/** Seviye unvanının i18n anahtarı. */
export function titleKeyForLevel(level: number): string {
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
    titleKey: titleKeyForLevel(level),
    xp: safe,
    currentLevelXp: cur,
    nextLevelXp: next,
    progress: (safe - cur) / (next - cur),
  };
}
