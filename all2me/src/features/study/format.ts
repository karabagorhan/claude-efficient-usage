/** Okul ekranları için görüntü biçimlendiricileri. */
import { thesisDef } from '../../data/thesisMilestones';
import { DAYS_SHORT, fmtTime, L, useT, type Lang } from '../../i18n';
import { splitMinutes } from './calc';
import type { Course, ThesisMilestone } from './types';

/** Dakika → "3 sa 20 dk" / "3 h 20 min" */
export function useDuration() {
  const tr = useT();
  return (min: number) => {
    const { h, m } = splitMinutes(min);
    if (h === 0) return tr('study.dur.m', { m });
    if (m === 0) return tr('study.dur.h', { h });
    return tr('study.dur.hm', { h, m });
  };
}

export function milestoneTitle(m: ThesisMilestone, lang: Lang) {
  if (m.title) return m.title;
  const def = thesisDef(m.key);
  return def ? L(def.title, lang) : '—';
}

export function slotsText(c: Course, lang: Lang) {
  return [...c.slots]
    .sort((a, b) => a.day - b.day || (a.start < b.start ? -1 : 1))
    .map((s) => `${DAYS_SHORT[lang][s.day]} ${fmtTime(s.start, lang)}–${fmtTime(s.end, lang)}`)
    .join(' · ');
}
