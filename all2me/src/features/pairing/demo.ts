import { CONFIG } from '../../engine/config';
import { addDays } from '../../engine/dates';
import type { Completion, Difficulty, Habit, Loc, PastelKey, PointEvent, Slot } from '../../engine/types';
import { L } from '../../i18n';
import { today, useCore } from '../../store/core';

export const DEMO_ID = 'demo-partner';
const DEMO_COLOR = '#EC4899';

const SPEC: Array<{ title: Loc; icon: string; difficulty: Difficulty; slot: Slot; pastel: PastelKey }> = [
  { title: { tr: 'Sabah koşusu', en: 'Morning run' }, icon: '🏃', difficulty: 'hard', slot: 'morning', pastel: 'green' },
  { title: { tr: 'Kitap oku', en: 'Read a book' }, icon: '📖', difficulty: 'medium', slot: 'evening', pastel: 'purple' },
  { title: { tr: 'Su iç', en: 'Drink water' }, icon: '💧', difficulty: 'easy', slot: 'anytime', pastel: 'mint' },
  { title: { tr: 'Meditasyon', en: 'Meditate' }, icon: '🧠', difficulty: 'medium', slot: 'morning', pastel: 'blue' },
  { title: { tr: 'Erken yat', en: 'Go to bed early' }, icon: '🛌', difficulty: 'medium', slot: 'evening', pastel: 'pink' },
  { title: { tr: 'Günlük yaz', en: 'Write in a journal' }, icon: '📓', difficulty: 'easy', slot: 'evening', pastel: 'yellow' },
];

/** Yalnızca yerel mod: yarış ekranını denemek için sahte partner ve 30 günlük veri. */
export function seedDemoPartner(name: string) {
  const now = Date.now();
  const t0 = today();
  const habits: Record<string, any> = {};
  const completions: Record<string, any> = {};
  const events: Record<string, any> = {};
  SPEC.forEach((sp, i) => {
    const id = `demo-h${i}`;
    habits[id] = {
      id,
      ownerId: DEMO_ID,
      title: L(sp.title),
      icon: sp.icon,
      slot: sp.slot,
      pastel: sp.pastel,
      difficulty: sp.difficulty,
      kind: 'check',
      schedule: { days: [] },
      isPrivate: i === 3,
      together: false,
      createdAt: new Date(now - 40 * 86400000).toISOString(),
      archived: false,
      _u: now,
    } satisfies Habit & { _u: number };
  });
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let back = 30; back >= 0; back--) {
    const day = addDays(t0, -back);
    let done = 0;
    let sumBase = 0;
    for (const h of Object.values(habits) as Habit[]) {
      sumBase += CONFIG.basePoints[h.difficulty];
      if (rnd() < 0.62 && !(back === 0 && rnd() < 0.5)) {
        const pts = CONFIG.basePoints[h.difficulty];
        const cid = `c:${h.id}:${day}`;
        const at = new Date(`${day}T12:00:00`).toISOString();
        completions[cid] = { id: cid, habitId: h.id, userId: DEMO_ID, dayKey: day, completedAt: at, points: pts, base: pts, multiplier: 1, earlyBonus: 0, _u: now } satisfies Completion & { _u: number };
        events[`ev:${cid}`] = { id: `ev:${cid}`, userId: DEMO_ID, dayKey: day, type: 'completion', points: pts, refId: cid, createdAt: at, label: h.title, _u: now } satisfies PointEvent & { _u: number };
        done++;
      }
    }
    if (done === SPEC.length) {
      const pts = Math.min(CONFIG.perfectDay.max, Math.max(CONFIG.perfectDay.min, Math.round(sumBase * CONFIG.perfectDay.pct)));
      events[`perfect:${DEMO_ID}:${day}`] = {
        id: `perfect:${DEMO_ID}:${day}`,
        userId: DEMO_ID,
        dayKey: day,
        type: 'perfect_day',
        points: pts,
        createdAt: new Date(`${day}T20:00:00`).toISOString(),
        labelKey: 'points.event.perfect_day',
        _u: now,
      };
    }
  }
  useCore.setState((s) => ({
    partner: { id: DEMO_ID, name, emoji: '🤖', color: DEMO_COLOR, _u: now },
    habits: { ...s.habits, ...habits },
    completions: { ...s.completions, ...completions },
    events: { ...s.events, ...events },
  }));
  useCore.getState().checkBadges();
}

export function removeDemoPartner() {
  useCore.setState((s) => {
    const strip = <T extends Record<string, any>>(o: T, key: string): T => {
      const out: any = {};
      for (const [k, v] of Object.entries(o)) if ((v as any)[key] !== DEMO_ID) out[k] = v;
      return out;
    };
    return {
      partner: null,
      habits: strip(s.habits, 'ownerId'),
      completions: strip(s.completions, 'userId'),
      events: strip(s.events, 'userId'),
    };
  });
}

export const isDemoPartner = () => useCore.getState().partner?.id === DEMO_ID;
