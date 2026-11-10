export type Units = 'ml' | 'oz';
const OZ = 29.5735;

/** ml → gösterim birimi (tam sayıya yuvarlar) */
export const fromMl = (ml: number, u: Units) => (u === 'oz' ? Math.round(ml / OZ) : Math.round(ml));
/** gösterim birimi → ml */
export const toMl = (v: number, u: Units) => (u === 'oz' ? Math.round(v * OZ) : Math.round(v));

/** Bardak (200 ml) ve şişe (500 ml) hızlı ekleme değerleri, ml cinsinden */
export const quickAmounts = (u: Units) =>
  u === 'oz' ? { glass: toMl(8, 'oz'), bottle: toMl(16, 'oz') } : { glass: 200, bottle: 500 };

/** Hedef adım büyüklüğü */
export const goalStep = (u: Units) => (u === 'oz' ? toMl(8, 'oz') : 250);

export const fmtDuration = (minutes: number) => ({ h: Math.floor(minutes / 60), m: Math.round(minutes % 60) });
