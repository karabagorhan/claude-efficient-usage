/**
 * Çekirdek store (partnerle senkronlanır): profil, görevler, tamamlamalar, puan olayları, rozetler, dürtmeler.
 * Araç verileri burada DEĞİL; src/store/slices/* içinde.
 * Kullanıcıya görünen metin saklanmaz: toast/hata = { key, params } (src/i18n `tMsg`).
 */
import { safeJSONStorage, safeMerge } from './safeStorage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BADGES } from '../data/badges';
import { evaluateBadges, userTotals } from '../engine/badges';
import { CONFIG } from '../engine/config';
import { addDays, dayKeyOf, periodRange, weekStartKey } from '../engine/dates';
import { standings } from '../engine/leaderboard';
import { currentStreak, deriveBonusEvents, isPlannedOn, scoreCompletion } from '../engine/points';
import { activeDaySet, dayStreakFrom } from '../engine/streak';
import {
  isScoreEvent,
  type Completion,
  type Habit,
  type HabitLink,
  type PastelKey,
  type PointEvent,
  type Slot,
} from '../engine/types';
import type { Msg, MsgParams } from '../i18n/types';
import { completionId, uuid } from '../lib/id';

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  color: string;
  _u: number;
}

export interface Nudge {
  id: string;
  from: string;
  to: string;
  kind: 'nudge' | 'cheer';
  /** Kullanıcı metni (serbest) */
  text: string;
  at: string;
  _u: number;
}

export interface BadgeRec {
  id: string;
  userId: string;
  badgeId: string;
  at: string;
  _u: number;
}

/** Rozetleri besleyen araç etkinlikleri. Araç ekranları `logActivity(kind)` çağırır. */
export type ActivityKind =
  | 'mood' | 'reflection' | 'focus' | 'meditate' | 'workout' | 'drink' | 'sleep' | 'love'
  | 'smoke' | 'meal' | 'chore' | 'study' | 'growth'
  /** gün sigara limitinde kapatıldı (günler kümesi önemli) */
  | 'smokeOk'
  /** fast food kaydı olan gün */
  | 'fastFood'
  /** her yapılan ev işi (sayaç önemli) */
  | 'choreDone'
  /** tamamlanan gelişim hedefi (sayaç önemli) */
  | 'goalDone';

/**
 * Üst toast. `action` verilirse toast üzerinde bir düğme görünür (ör. "Geri al") ve süre uzar;
 * `run` yalnız bellekte tutulur (toast kuyruğu kalıcı değildir).
 */
export type Toast = Msg & { emoji?: string; action?: { labelKey: string; run: () => void } };

/** Rutin sıralama modu: saate göre otomatik ya da elle (`habit.order`). */
export type TaskOrderMode = 'auto' | 'manual';
export type MoveDir = 'up' | 'down' | 'top';

export type DocKind = 'profile' | 'habit' | 'completion' | 'event' | 'badge' | 'nudge';
type Stamped<T> = T & { _u: number };

export interface RemoteDoc {
  id: string;
  kind: DocKind;
  owner_id: string;
  data: any;
  deleted: boolean;
}

/** Görev oluşturma girdisi: yalnızca title + icon zorunlu, gerisi varsayılanlı (bkz. habitDefaults). */
export type HabitDraft = Partial<Omit<Habit, 'ownerId' | 'archived'>> & { title: string; icon: string };

export const habitDefaults = {
  difficulty: 'easy',
  kind: 'check',
  schedule: { days: [] },
  slot: 'anytime',
  pastel: 'blue',
  isPrivate: false,
  together: false,
} as const satisfies Partial<Habit>;

/** Varsayılanları doldurur; id yoksa üretir. */
export function makeHabit(d: HabitDraft): Omit<Habit, 'ownerId' | 'archived' | 'createdAt'> & { createdAt?: string } {
  // `{kind: undefined}` gibi açıkça tanımsız alanlar varsayılanı ezmesin (diğer alanlarda undefined = temizle)
  const out: any = { ...habitDefaults, schedule: { days: [] }, ...d, id: d.id ?? uuid() };
  for (const [k, v] of Object.entries(habitDefaults)) if (out[k] === undefined) out[k] = v;
  if (!out.schedule) out.schedule = { days: [] };
  return out;
}

export interface AwardBonusInput {
  /** İdempotentlik anahtarı (ör. `wheel:${uuid}`); aynı id ikinci kez puan vermez. */
  id: string;
  points: number;
  /** Kullanıcı içeriği/çevrilmiş görünen ad (ör. dilim adı) */
  label?: string;
  /** veya i18n anahtarı */
  labelKey?: string;
  dayKey?: string;
  /** Günlük tavan grubu, ör. 'wheel' */
  group?: string;
  /** Grup için günlük en fazla puanlı olay sayısı (ör. CONFIG.bonus.wheel.perDay) */
  perDay?: number;
}
export type AwardBonusResult =
  | { ok: true; event: PointEvent }
  | { ok: false; reason: 'duplicate' | 'cap' | 'no_profile' };

export interface CoreState {
  hydrated: boolean;
  me: Profile | null;
  partner: Profile | null;
  pairId: string | null;
  pairCode: string | null;
  startedAt: string | null;
  habits: Record<string, Stamped<Habit>>;
  completions: Record<string, Stamped<Completion>>;
  events: Record<string, Stamped<PointEvent>>;
  badges: Record<string, BadgeRec>;
  nudges: Record<string, Nudge>;
  /** yalnızca yerel: sayaç ilerlemesi, anahtar `${habitId}|${dayKey}` */
  progress: Record<string, number>;
  /** yalnızca yerel: araç etkinlik sayaçları ve günleri (rozetler için) */
  activity: Partial<Record<ActivityKind, { count: number; days: Record<string, true> }>>;
  backfillUsed: Record<string, true>;
  /** senkron kuyruğu: "kind|id" -> 0 (upsert) | 1 (sil) */
  dirty: Record<string, 0 | 1>;
  cursor: string | null;
  syncedOnce: boolean;
  seenNudges: Record<string, true>;
  toasts: Toast[];

  // kimlik / eşleşme
  setMe: (p: { id: string; name: string; emoji: string; color: string }) => void;
  setPair: (pairId: string, code: string | null) => void;
  leavePair: () => void;
  resetAll: () => void;

  // görevler
  saveHabit: (h: HabitDraft) => string;
  archiveHabit: (id: string) => void;
  /** Arşivlemeyi geri alır ("Geri al" toast'ı). */
  unarchiveHabit: (id: string) => void;
  /**
   * Görevi `peers` (ekranda görünen, sıralı aynı bölüm görevleri) içinde taşır ve `order` alanlarını yazar.
   * Bölümdeki görünmeyen görevlerin sırası korunur. Değişen görev sayısını döner.
   */
  moveHabit: (id: string, dir: MoveDir, peers: string[]) => number;
  addHabitsFromTemplates: (items: HabitDraft[]) => number;

  // tamamlama
  /**
   * `advance: true` = "Önceden yap": yalnız bugünden SONRAKİ bir gün için; puan 0, puan olayı yok,
   * seri/liderlik/rozete sayılmaz; o gün geldiğinde tamamlanmış görünür.
   */
  complete: (habitId: string, dayKey?: string, opts?: { backfill?: boolean; advance?: boolean }) => Completion | null;
  undo: (habitId: string, dayKey?: string) => void;
  addProgress: (habitId: string, dayKey: string, delta: number) => number;
  canBackfill: () => boolean;
  completeLinked: (link: HabitLink, dayKey?: string) => Completion | null;
  setLinkedProgress: (link: HabitLink, value: number, dayKey?: string) => Completion | null;
  /** Kaynak kayıt geri alınınca / silinince bu türdeki bağlı görev(ler)in o günkü tamamlamasını geri alır (puan + bonuslar yeniden hesaplanır). Geri alınan sayısını döner. */
  undoLinked: (link: HabitLink, dayKey?: string) => number;
  awardBonus: (b: AwardBonusInput) => AwardBonusResult;
  revokeBonus: (id: string) => void;

  // araç etkinliği
  logActivity: (kind: ActivityKind, dayKey?: string) => void;

  // seçici-aksiyonlar (anlık değer; reaktif kullanım için hook'lara bak)
  dayStreak: () => number;
  activeDays: () => Set<string>;

  // sosyal
  sendNudge: (kind: 'nudge' | 'cheer', text: string) => { ok: boolean; reason?: Msg };
  markNudgesSeen: () => void;

  setPartnerLocal: (p: Profile | null) => void;

  // senkron
  applyRemote: (docs: RemoteDoc[]) => void;
  clearDirty: (keys: string[]) => void;
  setCursor: (c: string | null) => void;
  markSynced: () => void;
  markAllDirty: () => void;

  // türetilmiş işler
  settleChampions: () => void;
  checkBadges: () => void;
  popToast: () => void;
  pushToast: (t: Toast | string, params?: MsgParams) => void;
}

const now = () => Date.now();

/** Öğün kaydı olan ama fast food kaydı olmayan, kapanmış (bugünden önceki) günler. */
export function fastFoodFreeDays(act: CoreState['activity'], todayKey: string): number {
  const fast = act.fastFood?.days ?? {};
  return Object.keys(act.meal?.days ?? {}).filter((d) => d < todayKey && !fast[d]).length;
}

export const today = () => dayKeyOf(new Date());

const initial = {
  hydrated: false,
  me: null,
  partner: null,
  pairId: null,
  pairCode: null,
  startedAt: null,
  habits: {},
  completions: {},
  events: {},
  badges: {},
  nudges: {},
  progress: {},
  activity: {},
  backfillUsed: {},
  dirty: {},
  cursor: null,
  syncedOnce: false,
  seenNudges: {},
  toasts: [] as Toast[],
};

const dk = (kind: DocKind, id: string) => `${kind}|${id}`;
const CHAMP_KEY = { day: 'points.champion.day', week: 'points.champion.week', month: 'points.champion.month' } as const;

export const useCore = create<CoreState>()(
  persist(
    (set, get) => {
      /** Belgeyi yerelde yaz + senkron kuyruğuna ekle. */
      const put = <K extends 'habits' | 'completions' | 'events' | 'badges' | 'nudges'>(coll: K, kind: DocKind, obj: any) => {
        const stamped = { ...obj, _u: now() };
        set(
          (s) =>
            ({
              [coll]: { ...(s[coll] as any), [obj.id]: stamped },
              dirty: { ...s.dirty, [dk(kind, obj.id)]: 0 },
            }) as any,
        );
        return stamped;
      };
      const del = (coll: 'completions' | 'events', kind: DocKind, id: string) => {
        set((s) => {
          const c = { ...(s[coll] as any) };
          delete c[id];
          return { [coll]: c, dirty: { ...s.dirty, [dk(kind, id)]: 1 } } as any;
        });
      };

      /** Benim görevlerim arasında en büyük sıra + 1 (yeni görev en sona). */
      const nextOrder = (): number => {
        const s = get();
        let max = -1;
        for (const h of Object.values(s.habits)) if (h.ownerId === s.me?.id && typeof h.order === 'number' && Number.isFinite(h.order)) max = Math.max(max, h.order);
        return max + 1;
      };

      const myComps = (): Completion[] => {
        const s = get();
        return Object.values(s.completions).filter((c) => c.userId === s.me?.id);
      };

      const linkedHabits = (link: HabitLink): Habit[] => {
        const s = get();
        return Object.values(s.habits).filter((h) => h.ownerId === s.me?.id && !h.archived && h.link === link);
      };

      /** O gün için bonus olaylarını (mükemmel gün / haftalık) yeniden üretir. */
      const recomputeBonuses = (day: string) => {
        const s = get();
        if (!s.me) return;
        const uid = s.me.id;
        const habits = Object.values(s.habits);
        const comps = myComps();
        const newbie = s.startedAt ? Date.now() - new Date(s.startedAt).getTime() < 7 * 86400000 : false;
        const wanted = deriveBonusEvents(habits, comps, uid, day, newbie);
        const ws = weekStartKey(day);
        const bonusTypes = new Set(['perfect_day', 'almost_perfect']);
        const wantedIds = new Set(wanted.map((e) => e.id));
        for (const e of Object.values(s.events)) {
          if (e.userId !== uid) continue;
          const stale =
            (bonusTypes.has(e.type) && e.dayKey === day) || (e.type === 'weekly_bonus' && e.id === `weekly:${uid}:${ws}`);
          if (stale && !wantedIds.has(e.id)) del('events', 'event', e.id);
        }
        for (const e of wanted) {
          const ex = get().events[e.id];
          if (!ex || ex.points !== e.points) put('events', 'event', e);
        }
      };

      return {
        ...initial,

        setMe: (p) =>
          set((s) => {
            const prof: Profile = { ...p, _u: now() };
            return {
              me: prof,
              startedAt: s.startedAt ?? new Date().toISOString(),
              dirty: { ...s.dirty, [dk('profile', `profile:${p.id}`)]: 0 },
            };
          }),

        setPair: (pairId, code) =>
          set((s) => {
            const dirty = { ...s.dirty };
            if (s.me) dirty[dk('profile', `profile:${s.me.id}`)] = 0;
            for (const id of Object.keys(s.habits)) dirty[dk('habit', id)] = 0;
            for (const id of Object.keys(s.completions)) dirty[dk('completion', id)] = 0;
            for (const id of Object.keys(s.events)) dirty[dk('event', id)] = 0;
            for (const id of Object.keys(s.badges)) dirty[dk('badge', id)] = 0;
            return { pairId, pairCode: code, dirty, cursor: null, syncedOnce: false };
          }),

        leavePair: () => set({ pairId: null, pairCode: null, partner: null, cursor: null, syncedOnce: false }),

        resetAll: () => set({ ...initial, hydrated: true }),

        saveHabit: (draft) => {
          const s = get();
          const me = s.me;
          const h = makeHabit(draft);
          if (!me) return h.id;
          const existing = s.habits[h.id];
          const habit: Habit = {
            ...(existing ?? {}),
            ...h,
            order: h.order ?? existing?.order ?? nextOrder(),
            ownerId: me.id,
            createdAt: existing?.createdAt ?? h.createdAt ?? new Date().toISOString(),
            archived: existing?.archived ?? false,
          };
          put('habits', 'habit', habit);
          return habit.id;
        },

        archiveHabit: (id) => {
          const h = get().habits[id];
          if (!h) return;
          put('habits', 'habit', { ...h, archived: true });
          recomputeBonuses(today());
        },

        unarchiveHabit: (id) => {
          const h = get().habits[id];
          if (!h || !h.archived) return;
          put('habits', 'habit', { ...h, archived: false });
          recomputeBonuses(today());
        },

        moveHabit: (id, dir, peers) => {
          const s = get();
          const list = peers.filter((p) => s.habits[p]);
          const i = list.indexOf(id);
          if (i < 0) return 0;
          const next = moveInList(list, i, dir);
          if (next === list) return 0;
          // mevcut sıra değerlerini (artan) yeni diziliş sırasıyla yeniden dağıt; eksik/çakışan değer varsa
          // en küçük değerden başlayan ardışık değerler kullan
          const cur = list.map((p) => s.habits[p].order);
          const valid = cur.every((v) => typeof v === 'number' && Number.isFinite(v)) && new Set(cur).size === cur.length;
          const base = valid ? 0 : Math.min(0, ...cur.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)));
          const values = valid ? [...(cur as number[])].sort((a, b) => a - b) : list.map((_, k) => base + k);
          let changed = 0;
          next.forEach((hid, k) => {
            const h = get().habits[hid];
            if (h.order === values[k]) return;
            put('habits', 'habit', { ...h, order: values[k] });
            changed++;
          });
          return changed;
        },

        addHabitsFromTemplates: (items) => {
          const s = get();
          if (!s.me) return 0;
          let n = 0;
          const titles = new Set(
            Object.values(s.habits)
              .filter((h) => h.ownerId === s.me!.id && !h.archived)
              .map((h) => h.title),
          );
          for (const it of items) {
            if (titles.has(it.title)) continue;
            titles.add(it.title);
            put('habits', 'habit', {
              ...makeHabit({ ...it, id: undefined }),
              order: nextOrder(),
              ownerId: s.me.id,
              createdAt: new Date().toISOString(),
              archived: false,
            } satisfies Habit);
            n++;
          }
          return n;
        },

        complete: (habitId, dayKey, opts) => {
          const s = get();
          const me = s.me;
          const habit = s.habits[habitId];
          if (!me || !habit || habit.archived) return null;
          const day = dayKey ?? today();
          const id = completionId(habitId, day);
          if (s.completions[id]) return null; // çift sayım yok

          if (opts?.advance) {
            // yalnız ileri tarih; puan yok, olay yok, bonus/rozet hesabına girmez
            if (day <= today()) return null;
            const adv: Completion = {
              id,
              habitId,
              userId: me.id,
              dayKey: day,
              completedAt: new Date().toISOString(),
              points: 0,
              base: 0,
              multiplier: 1,
              earlyBonus: 0,
              advance: true,
            };
            put('completions', 'completion', adv);
            return adv;
          }

          const mine = myComps();
          const streakDays = currentStreak(habit, mine, day) + 1;
          const todays = mine.filter((c) => c.dayKey === day && !c.undone);
          const habitsById = s.habits as Record<string, Habit>;
          const dayTotalSoFar = Object.values(s.events)
            .filter((e) => e.userId === me.id && e.dayKey === day && e.type === 'completion')
            .reduce((a, e) => a + e.points, 0);

          const score = scoreCompletion({ habit, streakDays, completedAt: new Date(), todays, habitsById, dayTotalSoFar });
          let points = score.points;
          let early = score.earlyBonus;
          if (opts?.backfill) {
            points = Math.round(points * 0.7);
            early = 0;
          }
          const c: Completion = {
            id,
            habitId,
            userId: me.id,
            dayKey: day,
            completedAt: new Date().toISOString(),
            points,
            base: score.base,
            multiplier: score.multiplier,
            earlyBonus: early,
          };
          put('completions', 'completion', c);
          put('events', 'event', {
            id: `ev:${id}`,
            userId: me.id,
            dayKey: day,
            type: 'completion',
            points,
            refId: id,
            createdAt: c.completedAt,
            label: habit.title,
          } satisfies PointEvent);
          if (opts?.backfill) {
            set((st) => ({ backfillUsed: { ...st.backfillUsed, [weekStartKey(today())]: true } }));
          }
          recomputeBonuses(day);
          get().checkBadges();
          return c;
        },

        undo: (habitId, dayKey) => {
          const s = get();
          if (!s.me) return;
          const day = dayKey ?? today();
          const id = completionId(habitId, day);
          if (!s.completions[id]) return;
          del('completions', 'completion', id);
          del('events', 'event', `ev:${id}`);
          set((st) => {
            const p = { ...st.progress };
            delete p[`${habitId}|${day}`];
            return { progress: p };
          });
          recomputeBonuses(day);
        },

        addProgress: (habitId, day, delta) => {
          const key = `${habitId}|${day}`;
          const next = Math.max(0, (get().progress[key] ?? 0) + delta);
          set((s) => ({ progress: { ...s.progress, [key]: next } }));
          return next;
        },

        canBackfill: () => {
          const s = get();
          const ok = new Date().getHours() < 9; // ertesi gün 09:00'a kadar
          return ok && !s.backfillUsed[weekStartKey(today())];
        },

        completeLinked: (link, dayKey) => {
          const day = dayKey ?? today();
          let first: Completion | null = null;
          for (const h of linkedHabits(link)) {
            if (h.kind === 'counter' && h.target) {
              set((s) => ({ progress: { ...s.progress, [`${h.id}|${day}`]: Math.max(s.progress[`${h.id}|${day}`] ?? 0, h.target!) } }));
            }
            const c = get().complete(h.id, day);
            if (c && !first) first = c;
          }
          return first;
        },

        setLinkedProgress: (link, value, dayKey) => {
          const day = dayKey ?? today();
          let first: Completion | null = null;
          for (const h of linkedHabits(link)) {
            set((s) => ({ progress: { ...s.progress, [`${h.id}|${day}`]: Math.max(0, value) } }));
            const target = h.kind === 'check' ? 1 : (h.target ?? 1);
            if (value >= target) {
              const c = get().complete(h.id, day);
              if (c && !first) first = c;
            }
          }
          return first;
        },

        undoLinked: (link, dayKey) => {
          const day = dayKey ?? today();
          let n = 0;
          for (const h of linkedHabits(link)) {
            if (get().completions[completionId(h.id, day)]) {
              get().undo(h.id, day);
              n++;
            }
          }
          return n;
        },

        awardBonus: (b) => {
          const s = get();
          const me = s.me;
          if (!me) return { ok: false, reason: 'no_profile' };
          const id = `bonus:${me.id}:${b.id}`;
          if (s.events[id]) return { ok: false, reason: 'duplicate' };
          const day = b.dayKey ?? today();
          if (b.group && b.perDay !== undefined) {
            const used = Object.values(s.events).filter(
              (e) => e.userId === me.id && e.type === 'bonus' && e.group === b.group && e.dayKey === day,
            ).length;
            if (used >= b.perDay) return { ok: false, reason: 'cap' };
          }
          const ev: PointEvent = {
            id,
            userId: me.id,
            dayKey: day,
            type: 'bonus',
            points: Math.max(0, Math.min(CONFIG.bonus.maxPoints, Math.round(b.points))),
            refId: b.id,
            createdAt: new Date().toISOString(),
            ...(b.label ? { label: b.label } : {}),
            ...(b.labelKey ? { labelKey: b.labelKey } : {}),
            ...(b.group ? { group: b.group } : {}),
          };
          put('events', 'event', ev);
          get().checkBadges();
          return { ok: true, event: ev };
        },

        revokeBonus: (bid) => {
          const me = get().me;
          if (!me) return;
          const id = `bonus:${me.id}:${bid}`;
          if (get().events[id]) del('events', 'event', id);
        },

        logActivity: (kind, dayKey) => {
          const day = dayKey ?? today();
          set((s) => {
            const cur = s.activity[kind] ?? { count: 0, days: {} };
            return { activity: { ...s.activity, [kind]: { count: cur.count + 1, days: { ...cur.days, [day]: true } } } };
          });
          get().checkBadges();
        },

        dayStreak: () => selectDayStreak(get()),
        activeDays: () => {
          const s = get();
          return s.me ? activeDaySet(Object.values(s.completions), s.me.id) : new Set<string>();
        },

        sendNudge: (kind, text) => {
          const s = get();
          if (!s.me || !s.partner) return { ok: false, reason: { key: 'toast.nudge.needPartner' } };
          const day = today();
          const mine = Object.values(s.nudges).filter((n) => n.from === s.me!.id && n.kind === kind);
          const sentToday = mine.filter((n) => dayKeyOf(new Date(n.at)) === day);
          if (kind === 'nudge') {
            if (sentToday.length >= CONFIG.nudge.perDay)
              return { ok: false, reason: { key: 'toast.nudge.perDay', params: { n: CONFIG.nudge.perDay } } };
            const last = sentToday
              .map((n) => new Date(n.at).getTime())
              .sort()
              .pop();
            if (last && Date.now() - last < CONFIG.nudge.minGapHours * 3600000) {
              return { ok: false, reason: { key: 'toast.nudge.minGap', params: { n: CONFIG.nudge.minGapHours } } };
            }
            const h = new Date().getHours();
            if (h >= 22 || h < 8) return { ok: false, reason: { key: 'toast.nudge.quietHours' } };
          }
          const n: Nudge = { id: uuid(), from: s.me.id, to: s.partner.id, kind, text, at: new Date().toISOString(), _u: now() };
          put('nudges', 'nudge', n);
          get().checkBadges();
          return { ok: true };
        },

        markNudgesSeen: () => {
          const s = get();
          const seen = { ...s.seenNudges };
          for (const n of Object.values(s.nudges)) if (n.to === s.me?.id) seen[n.id] = true;
          set({ seenNudges: seen });
        },

        setPartnerLocal: (p) => set({ partner: p }),

        applyRemote: (docs) => {
          set((s) => {
            const habits = { ...s.habits };
            const completions = { ...s.completions };
            const events = { ...s.events };
            const badges = { ...s.badges };
            const nudges = { ...s.nudges };
            let partner = s.partner;
            const map: Record<string, Record<string, any> | undefined> = {
              habit: habits,
              completion: completions,
              event: events,
              badge: badges,
              nudge: nudges,
            };
            for (const d of docs) {
              if (d.kind === 'profile') {
                if (d.owner_id !== s.me?.id && !d.deleted) partner = d.data as Profile;
                continue;
              }
              const coll = map[d.kind];
              if (!coll) continue;
              const local = coll[d.id];
              if (d.deleted) {
                if (local && d.owner_id !== s.me?.id) delete coll[d.id];
                else if (local && (local._u ?? 0) <= (d.data?._u ?? 0)) delete coll[d.id];
                continue;
              }
              if (local && d.owner_id === s.me?.id && (local._u ?? 0) >= (d.data?._u ?? 0)) continue;
              coll[d.id] = d.data;
            }
            return { habits, completions, events, badges, nudges, partner };
          });
        },

        clearDirty: (keys) =>
          set((s) => {
            const d = { ...s.dirty };
            for (const k of keys) delete d[k];
            return { dirty: d };
          }),
        setCursor: (c) => set({ cursor: c }),
        markSynced: () => set({ syncedOnce: true }),
        markAllDirty: () =>
          set((s) => {
            const dirty: Record<string, 0 | 1> = { ...s.dirty };
            if (s.me) dirty[dk('profile', `profile:${s.me.id}`)] = 0;
            for (const id of Object.keys(s.habits)) dirty[dk('habit', id)] = 0;
            for (const id of Object.keys(s.completions)) dirty[dk('completion', id)] = 0;
            for (const id of Object.keys(s.events)) dirty[dk('event', id)] = 0;
            for (const id of Object.keys(s.badges)) dirty[dk('badge', id)] = 0;
            return { dirty };
          }),

        pushToast: (t, params) =>
          set((s) => ({ toasts: [...s.toasts, typeof t === 'string' ? { key: t, ...(params ? { params } : {}) } : t] })),
        popToast: () => set((s) => ({ toasts: s.toasts.slice(1) })),

        checkBadges: () => {
          const s = get();
          const me = s.me;
          if (!me) return;
          const habits = Object.values(s.habits).filter((h) => h.ownerId === me.id);
          const comps = myComps();
          const events = Object.values(s.events).filter((e) => e.userId === me.id);
          const sent = Object.values(s.nudges).filter((n) => n.from === me.id);
          const wins = { day: 0, week: 0, month: 0 };
          for (const e of events) {
            if (e.type === 'champion') {
              if (e.id.startsWith('champ:day')) wins.day++;
              else if (e.id.startsWith('champ:week')) wins.week++;
              else if (e.id.startsWith('champ:month')) wins.month++;
            }
          }
          const act = s.activity;
          const have = new Set(
            Object.values(s.badges)
              .filter((b) => b.userId === me.id)
              .map((b) => b.badgeId),
          );
          const earned = evaluateBadges({
            userId: me.id,
            today: today(),
            habits,
            completions: comps,
            events,
            moodDays: Object.keys(act.mood?.days ?? {}).length,
            journalCount: act.reflection?.count ?? 0,
            focusSessions: act.focus?.count ?? 0,
            breathSessions: act.meditate?.count ?? 0,
            dayStreak: dayStreakFrom(activeDaySet(comps, me.id), today()),
            wheelTasks: events.filter((e) => e.type === 'bonus' && e.group === 'wheel').length,
            nudgesSent: sent.filter((n) => n.kind === 'nudge').length,
            cheersSent: sent.filter((n) => n.kind === 'cheer').length,
            paired: Boolean(s.pairId && s.partner),
            wins,
            comeback: events.some((e) => e.id.startsWith('comeback:')),
            smokeLimitDays: Object.keys(act.smokeOk?.days ?? {}).length,
            fastFoodFreeDays: fastFoodFreeDays(act, today()),
            choresDone: act.choreDone?.count ?? 0,
            studyItemsDone: events.filter((e) => e.type === 'bonus' && e.group === 'study' && (e.refId ?? '').startsWith('study:item:')).length,
            goalsDone: Math.max(
              act.goalDone?.count ?? 0,
              events.filter((e) => e.type === 'bonus' && e.group === 'growth' && (e.refId ?? '').startsWith('growth:goal:')).length,
            ),
          });
          for (const id of earned) {
            if (have.has(id)) continue;
            const def = BADGES.find((b) => b.id === id);
            if (!def) continue;
            const rec: BadgeRec = { id: `${me.id}:${id}`, userId: me.id, badgeId: id, at: new Date().toISOString(), _u: now() };
            set((st) => ({
              badges: { ...st.badges, [rec.id]: rec },
              dirty: { ...st.dirty, [dk('badge', rec.id)]: 0 },
            }));
            put('events', 'event', {
              id: `badge:${me.id}:${id}`,
              userId: me.id,
              dayKey: today(),
              type: 'badge',
              points: CONFIG.badgeBonusXp[def.tier],
              createdAt: rec.at,
              labelKey: 'points.event.badge',
              refId: id,
            } satisfies PointEvent);
            get().pushToast({ key: 'toast.newBadge', params: { emoji: def.emoji, name: def.name }, emoji: def.emoji });
          }
        },

        /** Kapanmış gün/hafta/ay şampiyonluklarını (kendi adıma) XP olarak işler. */
        settleChampions: () => {
          const s = get();
          const me = s.me;
          const partner = s.partner;
          if (!me || !partner) return;
          if (s.pairId && !s.syncedOnce) return; // partner verisi gelmeden hüküm verme
          const events = Object.values(s.events);
          const comps = Object.values(s.completions);
          const t = today();
          const ids: [string, string] = [me.id, partner.id];
          const bonus = CONFIG.championBonusXp;
          const check = (period: 'day' | 'week' | 'month', anchor: string) => {
            const [from, to] = periodRange(period, anchor);
            if (to >= t) return; // henüz kapanmadı
            const id = `champ:${period}:${from}:${me.id}`;
            if (s.events[id]) return;
            const st = standings(period, anchor, ids, events, comps, t);
            if (st.winnerId !== me.id) return;
            put('events', 'event', {
              id,
              userId: me.id,
              dayKey: to,
              type: 'champion',
              points: bonus[period],
              createdAt: new Date().toISOString(),
              labelKey: CHAMP_KEY[period],
            } satisfies PointEvent);
            get().pushToast({ key: `toast.champion.${period}`, emoji: '🏆' });
            if (period === 'week') {
              const prev = standings('week', addDays(from, -7), ids, events, comps, t);
              if (prev.winnerId === partner.id) {
                put('events', 'event', {
                  id: `comeback:${me.id}:${from}`,
                  userId: me.id,
                  dayKey: to,
                  type: 'champion',
                  points: 0,
                  createdAt: new Date().toISOString(),
                  labelKey: 'points.event.comeback',
                } satisfies PointEvent);
              }
            }
          };
          for (let i = 1; i <= 30; i++) check('day', addDays(t, -i));
          for (let i = 1; i <= 8; i++) check('week', addDays(weekStartKey(t), -7 * i));
          for (let i = 1; i <= 3; i++) check('month', addDays(periodRange('month', t)[0], -i * 28));
          get().checkBadges();
        },
      };
    },
    {
      name: 'all2me-core-v1',
      storage: safeJSONStorage(),
      merge: safeMerge,
      version: 1,
      partialize: (s) => {
        const { hydrated, toasts, ...rest } = s as any;
        const out: any = {};
        for (const [k, v] of Object.entries(rest)) if (typeof v !== 'function') out[k] = v;
        return out;
      },
      onRehydrateStorage: () => () => {
        // eski sürüm onboarding'i `kind: undefined` görev yazabiliyordu: eksik varsayılanları tamamla
        const s = useCore.getState();
        const fixed: Record<string, Stamped<Habit>> = {};
        for (const h of Object.values(s.habits)) {
          if (h.ownerId !== s.me?.id) continue;
          const miss = Object.entries(habitDefaults).filter(([k]) => (h as any)[k] === undefined);
          if (miss.length) fixed[h.id] = { ...h, ...Object.fromEntries(miss), _u: now() } as Stamped<Habit>;
        }
        const ids = Object.keys(fixed);
        if (ids.length) {
          useCore.setState((st) => ({
            habits: { ...st.habits, ...fixed },
            dirty: { ...st.dirty, ...Object.fromEntries(ids.map((id) => [dk('habit', id), 0 as const])) },
          }));
        }
        useCore.setState({ hydrated: true });
      },
    },
  ),
);

/** Geriye uyum (lib/sync.ts vb.) */
export const useStore = useCore;

// ---------- Saf seçiciler (state -> değer) ----------

export function totalsFor(state: CoreState, userId: string | undefined) {
  if (!userId) return { sp: 0, xp: 0 };
  return userTotals(Object.values(state.events).filter((e) => e.userId === userId));
}

/** Liderliğe sayılan (SP) günlük puan. */
export function pointsOnDay(state: CoreState, userId: string, day: string): number {
  let sum = 0;
  for (const e of Object.values(state.events)) if (e.userId === userId && e.dayKey === day && isScoreEvent(e)) sum += e.points;
  return sum;
}

/** Benim arşivlenmemiş görevlerim. */
export const myHabits = (s: CoreState): Habit[] =>
  Object.values(s.habits).filter((h) => h.ownerId === s.me?.id && !h.archived);

/** O gün Rutin'de görünecek görevlerim (planlı olanlar + haftalık kotalılar). */
export const habitsOnDay = (s: CoreState, day: string): Habit[] =>
  myHabits(s).filter((h) => h.createdAt.slice(0, 10) <= day && (h.schedule.weeklyQuota ? true : isPlannedOn(h, day)));

/** Diziyi taşınmış yeni dizi olarak döner (değişiklik yoksa aynı dizi). */
export function moveInList<T>(list: T[], i: number, dir: MoveDir): T[] {
  const j = dir === 'top' ? 0 : dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || i >= list.length || j < 0 || j >= list.length || j === i) return list;
  const out = [...list];
  const [x] = out.splice(i, 1);
  out.splice(j, 0, x);
  return out;
}

const ord = (h: Habit) => (typeof h.order === 'number' && Number.isFinite(h.order) ? h.order : Number.MAX_SAFE_INTEGER);
const byManual = (a: Habit, b: Habit) => ord(a) - ord(b) || (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0) || a.id.localeCompare(b.id);
const timeOf = (h: Habit) => h.reminderTime ?? h.dueTime ?? null;

/**
 * Rutin sıralaması. `manual`: `order`, sonra oluşturulma. `auto`: hatırlatıcı (yoksa hedef) saatine göre,
 * saatsizler sonda; eşitlikte elle sıra.
 */
export function sortHabits(list: Habit[], mode: TaskOrderMode): Habit[] {
  const out = [...list];
  if (mode === 'manual') return out.sort(byManual);
  return out.sort((a, b) => {
    const ta = timeOf(a);
    const tb = timeOf(b);
    if (ta && tb && ta !== tb) return ta < tb ? -1 : 1;
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    return byManual(a, b);
  });
}

export const habitsBySlot = (list: Habit[]): Record<Slot, Habit[]> => {
  const out: Record<Slot, Habit[]> = { morning: [], afternoon: [], evening: [], anytime: [] };
  for (const h of list) out[h.slot ?? 'anytime'].push(h);
  return out;
};

export const isDone = (s: CoreState, habitId: string, day: string): boolean => Boolean(s.completions[completionId(habitId, day)]);
export const progressOf = (s: CoreState, habitId: string, day: string): number => s.progress[`${habitId}|${day}`] ?? 0;

export function selectDayStreak(s: CoreState): number {
  if (!s.me) return 0;
  return dayStreakFrom(activeDaySet(Object.values(s.completions), s.me.id), today());
}

export const selectTodayPoints = (s: CoreState): number => (s.me ? pointsOnDay(s, s.me.id, today()) : 0);

export const allEvents = (s: CoreState) => Object.values(s.events);
export const allCompletions = (s: CoreState) => Object.values(s.completions);

// ---------- Reaktif hook'lar (yeni nesne döndüren seçiciler için memo'lu) ----------

/** Gün serisi (sayı). */
export const useDayStreak = () => useCore(selectDayStreak);

/** Tamamlama olan günler kümesi (Seri Takvimi). */
export function useActiveDays(): Set<string> {
  const completions = useCore((s) => s.completions);
  const meId = useCore((s) => s.me?.id);
  return useMemo(() => (meId ? activeDaySet(Object.values(completions), meId) : new Set<string>()), [completions, meId]);
}

/** O günün görevleri (memo'lu). */
export function useHabitsOnDay(day: string): Habit[] {
  const habits = useCore((s) => s.habits);
  const meId = useCore((s) => s.me?.id);
  return useMemo(() => habitsOnDay({ habits, me: meId ? { id: meId } : null } as CoreState, day), [habits, meId, day]);
}

export type { Completion, Habit, HabitLink, PastelKey, PointEvent, Slot };
