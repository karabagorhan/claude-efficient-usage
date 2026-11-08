import { CONFIG } from '../engine/config';
import { addDays } from '../engine/dates';
import type { Completion, Difficulty, Habit, PointEvent } from '../engine/types';
import { today, useStore } from '../store/store';

const DEMO_ID = 'demo-partner';

/** Yalnızca yerel mod: yarış ekranını denemek için sahte partner ve 30 günlük veri. */
export function seedDemoPartner() {
  const now = Date.now();
  const t0 = today();
  const spec: Array<[string, string, Difficulty]> = [
    ['Sabah koşusu', '🏃', 'hard'],
    ['Kitap oku', '📖', 'medium'],
    ['Su iç', '💧', 'easy'],
    ['Meditasyon', '🧠', 'medium'],
    ['Erken yat', '🛌', 'medium'],
    ['Günlük yaz', '📓', 'easy'],
  ];
  const habits: Record<string, any> = {};
  const completions: Record<string, any> = {};
  const events: Record<string, any> = {};
  spec.forEach(([title, icon, difficulty], i) => {
    const id = `demo-h${i}`;
    habits[id] = {
      id, ownerId: DEMO_ID, title, icon, color: '#EC4899', category: 'Sağlık', difficulty, kind: 'check',
      schedule: { days: [] }, isPrivate: i === 3, together: false,
      createdAt: new Date(now - 40 * 86400000).toISOString(), archived: false, _u: now,
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
    if (done === Object.keys(habits).length) {
      const pts = Math.min(CONFIG.perfectDay.max, Math.max(CONFIG.perfectDay.min, Math.round(sumBase * CONFIG.perfectDay.pct)));
      events[`perfect:${DEMO_ID}:${day}`] = { id: `perfect:${DEMO_ID}:${day}`, userId: DEMO_ID, dayKey: day, type: 'perfect_day', points: pts, createdAt: new Date(`${day}T20:00:00`).toISOString(), label: 'Mükemmel Gün', _u: now };
    }
  }
  useStore.setState((s) => ({
    partner: { id: DEMO_ID, name: 'Demo', emoji: '🤖', color: '#EC4899', _u: now },
    habits: { ...s.habits, ...habits },
    completions: { ...s.completions, ...completions },
    events: { ...s.events, ...events },
  }));
  useStore.getState().checkBadges();
}

export function removeDemoPartner() {
  useStore.setState((s) => {
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

export const isDemoPartner = () => useStore.getState().partner?.id === DEMO_ID;
