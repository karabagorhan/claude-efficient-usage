/**
 * Rapor metinleri: içgörü / öneri cümleleri ve paylaşım özeti. `t` bir çeviri fonksiyonudur
 * (React hook'undan ya da testlerde düz bir yer tutucu doldurucudan gelir).
 */
import { DAYS_LONG, fmtDay, type Lang } from '../../i18n';
import { CURRENCY_SYMBOL, type Currency } from '../life/types';
import { num, type Delta, type WeekComparison, type WeekStats } from './calc';
import type { Insight, Suggestion } from './insights';
import { SLEEP_HI } from './insights';

export { num };
export type TFn = (key: string, params?: Record<string, string | number>) => string;

const pct = (x: number) => Math.round(x * 100);

export function insightText(t: TFn, lang: Lang, i: Insight): string {
  switch (i.id) {
    case 'sleepMood':
      return t(`report.insight.sleepMood.${i.dir}`, { hours: SLEEP_HI, diff: num(Math.abs(i.diff), lang), a: num(i.a, lang), b: num(i.b, lang) });
    case 'sleepRate':
      return t('report.insight.sleepRate', { hours: SLEEP_HI, a: pct(i.a), b: pct(i.b) });
    case 'smokeStress':
      return t('report.insight.smokeStress', { a: num(i.a, lang), b: num(i.b, lang) });
    default:
      return t(`report.insight.${i.id}`, { a: pct(i.a), b: pct(i.b) });
  }
}

export function suggestionText(t: TFn, lang: Lang, s: Suggestion): string {
  const p: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(s.params)) p[k] = k === 'avg' || k === 'h' || k === 'goal' ? num(v, lang) : v;
  if (s.id === 'smoke') p.n = t('common.unit.days', { n: s.params.n });
  if (s.slot) p.slot = t(`task.slot.${s.slot}`);
  if (s.weekday !== undefined) p.day = DAYS_LONG[lang][s.weekday];
  return t(`report.sugg.${s.id}`, p);
}

export function deltaText(t: TFn, d: Delta, unit: 'pct' | 'pts' = 'pct'): string {
  if (d.dir === 'same') return t('report.delta.same');
  if (unit === 'pts') return t(d.dir === 'up' ? 'report.delta.ptsUp' : 'report.delta.ptsDown', { n: Math.abs(d.delta) });
  if (d.pct === null) return t('report.delta.new');
  return t(d.dir === 'up' ? 'report.delta.up' : 'report.delta.down', { n: Math.abs(d.pct) });
}

export const money = (amount: number, currency: string, lang: Lang): string => {
  const sym = CURRENCY_SYMBOL[currency as Currency] ?? currency;
  return `${sym}${num(amount, lang, 0)}`;
};

export function rangeLabel(start: string, end: string, lang: Lang): string {
  return `${fmtDay(start, lang, 'short')} – ${fmtDay(end, lang, 'short')}`;
}

/** Paylaşılacak düz metin özet. */
export function shareText(t: TFn, lang: Lang, s: WeekStats, cmp: WeekComparison, insights: Insight[], partnerName?: string): string {
  const L: string[] = [];
  L.push(`📊 ${t('report.share.header', { range: rangeLabel(s.start, s.end, lang) })}`);
  L.push(`⭐ ${t('report.share.points', { n: t('common.unit.pts', { n: s.points }) })}${cmp.prevHasData ? ` (${deltaText(t, cmp.points)})` : ''}`);
  if (s.rate !== null) L.push(`✅ ${t('report.share.rate', { n: pct(s.rate) })}`);
  L.push(`🔥 ${t('report.share.streak', { n: t('common.unit.days', { n: s.longestRun }), m: t('common.unit.days', { n: s.activeDays }) })}`);
  if (s.bestDay) L.push(`🏆 ${t('report.share.best', { day: fmtDay(s.bestDay.day, lang), n: t('common.unit.pts', { n: s.bestDay.points }) })}`);
  if (s.race && partnerName) L.push(`🤝 ${t('report.share.race', { me: s.race.mePoints, them: s.race.partnerPoints, name: partnerName })}`);
  if (s.sleep) L.push(`😴 ${t('report.share.sleep', { h: num(s.sleep.avgH, lang) })}`);
  if (s.mood) L.push(`🙂 ${t('report.share.mood', { n: num(s.mood.avg, lang) })}`);
  if (s.water) L.push(`💧 ${t('report.share.water', { n: s.water.goalDays, m: s.water.days })}`);
  if (s.smoke) L.push(`🚭 ${t('report.share.smoke', { n: s.smoke.limitDays, m: s.smoke.tracked })}`);
  if (s.meals) L.push(`🍲 ${t('report.share.meals', { n: s.meals.fastFreeDays })}`);
  if (s.chores) L.push(`🧺 ${t('report.share.chores', { n: s.chores.done })}`);
  if (s.study) L.push(`🎓 ${t('report.share.study', { h: num(s.study.minutes / 60, lang) })}`);
  if (s.growth) L.push(`🚀 ${t('report.share.growth', { n: s.growth.topDays, m: s.growth.plannedDays })}`);
  if (insights.length) {
    L.push('');
    L.push(`💡 ${t('report.share.insight')}`);
    L.push(insightText(t, lang, insights[0]) + ' ' + t('report.insight.basedOn', { n: t('common.unit.days', { n: insights[0].n }) }));
  }
  L.push('');
  L.push(t('report.share.footer'));
  return L.join('\n');
}
