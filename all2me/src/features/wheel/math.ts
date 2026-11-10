/**
 * Çark açı matematiği (saf).
 * Düzen: dilim i, çark 0° dönmüşken tepeden (işaretçi) saat yönünde [i*sa, (i+1)*sa) aralığındadır.
 * Çark `rot` derece SAAT YÖNÜNDE dönünce işaretçinin altındaki çark açısı (-rot mod 360) olur.
 */
export const norm = (deg: number): number => ((deg % 360) + 360) % 360;

/** `rot` derece döndükten sonra işaretçinin altındaki dilim indeksi. */
export function sliceAtRotation(rot: number, n: number): number {
  const sa = 360 / n;
  return Math.min(n - 1, Math.floor(norm(-rot) / sa));
}

/**
 * Hedef dilimin (k) merkezine yakın bir noktada durmak için son açı.
 * `current`ten en az `turns` tam tur ileri gider; `jitter` -0.4..0.4 (dilim genişliği oranı).
 */
export function targetRotation(current: number, k: number, n: number, turns: number, jitter = 0): number {
  const sa = 360 / n;
  const wheelAngle = (k + 0.5 + jitter) * sa; // işaretçinin altında olması gereken çark açısı
  const wantMod = norm(-wheelAngle); // rot mod 360
  const base = current - norm(current) + wantMod;
  let next = base;
  while (next < current + turns * 360) next += 360;
  return next;
}
