/**
 * İş ve kişisel gelişim dilimi (yalnız cihazda). Anahtar: all2me-growth-v1.
 * 3 önemli işin tamamı / hedef adımı → completeLinked('growth') + günde bir logActivity('growth').
 * Hedef tamamlandı, öğrenme bitti, haftalık değerlendirme → awardBonus(group:'growth').
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKeyOf, weekStartKey } from '../../engine/dates';
import { uuid } from '../../lib/id';
import { applyCarry, goalProgress, isGoalComplete, TOP_MAX, top3Done } from '../../features/growth/calc';
import { LEARN_META, type Goal, type GrowthSettings, type LearnItem, type TopTask, type WeeklyReview } from '../../features/growth/types';
import { useCore } from '../core';

export const GROWTH_BONUS_PER_DAY = 5;
export const GROWTH_POINTS = { goal: 30, learn: 20, review: 15 } as const;

export type GoalDraft = Partial<Goal> & { title: string };
export type LearnDraft = Partial<LearnItem> & { title: string };

interface GrowthState {
  hydrated: boolean;
  tops: Record<string, TopTask[]>;
  goals: Record<string, Goal>;
  learning: Record<string, LearnItem>;
  reviews: WeeklyReview[];
  settings: GrowthSettings;
  activityDay: string;

  addTop: (title: string, day?: string) => boolean;
  toggleTop: (id: string, day?: string) => { allDone: boolean };
  removeTop: (id: string, day?: string) => void;
  carryOver: (sugg: { from: string; items: TopTask[] }, day?: string) => void;

  saveGoal: (d: GoalDraft) => string;
  deleteGoal: (id: string) => void;
  /** sayısal hedefte mevcut değeri delta kadar değiştir */
  bumpGoal: (id: string, delta: number) => void;
  toggleGoalMilestone: (goalId: string, milestoneId: string) => void;
  addCheckin: (goalId: string, note: string) => void;

  saveLearn: (d: LearnDraft) => string;
  bumpLearn: (id: string, delta: number) => void;
  deleteLearn: (id: string) => void;

  saveReview: (r: { good: string; blockers: string; next: string; week?: string }) => void;
  setSettings: (p: Partial<GrowthSettings>) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: GrowthSettings = { morningTop3: true, fridayReview: true };

function touchGrowth(get: () => GrowthState, set: (p: Partial<GrowthState>) => void) {
  const core = useCore.getState();
  const day = dayKeyOf();
  if (get().activityDay !== day) {
    core.logActivity('growth', day);
    set({ activityDay: day });
  }
  const c = core.completeLinked('growth', day);
  if (c) core.pushToast('toast.completedTitle', { title: core.habits[c.habitId]?.title ?? '', points: c.points });
}

function award(id: string, points: number, labelKey: string, emoji: string) {
  const core = useCore.getState();
  const r = core.awardBonus({ id, points, labelKey, group: 'growth', perDay: GROWTH_BONUS_PER_DAY });
  if (r.ok) core.pushToast({ key: 'toast.bonus', params: { emoji, points: r.event.points } });
  else if (r.reason === 'cap') core.pushToast('toast.bonusCap', { n: GROWTH_BONUS_PER_DAY });
}

export const useGrowth = create<GrowthState>()(
  persist(
    (set, get) => {
      const commitGoal = (next: Goal) => {
        const prev = get().goals[next.id];
        const complete = isGoalComplete(next);
        next = { ...next, doneDay: complete ? (prev?.doneDay ?? dayKeyOf()) : undefined };
        set((s) => ({ goals: { ...s.goals, [next.id]: next } }));
        const was = prev ? !!prev.doneDay : false;
        if (!was && complete) award(`growth:goal:${next.id}`, GROWTH_POINTS.goal, 'growth.bonus.goal', '🏆');
        else if (was && !complete) useCore.getState().revokeBonus(`growth:goal:${next.id}`);
        const step =
          prev &&
          (goalProgress(next) > goalProgress(prev) || next.checkins.length > prev.checkins.length);
        if (step) touchGrowth(get, set);
        return next.id;
      };
      const commitLearn = (next: LearnItem) => {
        const prev = get().learning[next.id];
        if (next.total > 0 && next.current >= next.total) next = { ...next, current: next.total, status: 'done' };
        set((s) => ({ learning: { ...s.learning, [next.id]: next } }));
        const bid = `growth:learn:${next.id}`;
        if (prev?.status !== 'done' && next.status === 'done' && prev) award(bid, GROWTH_POINTS.learn, 'growth.bonus.learn', LEARN_META[next.kind].emoji);
        else if (prev?.status === 'done' && next.status !== 'done') useCore.getState().revokeBonus(bid);
        if (prev && next.current > prev.current) touchGrowth(get, set);
        return next.id;
      };

      return {
        hydrated: false,
        tops: {},
        goals: {},
        learning: {},
        reviews: [],
        settings: DEFAULT_SETTINGS,
        activityDay: '',

        addTop: (title, day) => {
          const d = day ?? dayKeyOf();
          const cur = get().tops[d] ?? [];
          if (!title.trim() || cur.length >= TOP_MAX) return false;
          set((s) => ({ tops: { ...s.tops, [d]: [...cur, { id: uuid(), title: title.trim(), done: false }] } }));
          return true;
        },
        toggleTop: (id, day) => {
          const d = day ?? dayKeyOf();
          const list = (get().tops[d] ?? []).map((x) => (x.id === id ? { ...x, done: !x.done } : x));
          set((s) => ({ tops: { ...s.tops, [d]: list } }));
          const st = top3Done(list);
          const turnedOn = list.find((x) => x.id === id)?.done;
          if (turnedOn && st.all) touchGrowth(get, set);
          return { allDone: !!turnedOn && st.all };
        },
        removeTop: (id, day) => {
          const d = day ?? dayKeyOf();
          set((s) => ({ tops: { ...s.tops, [d]: (s.tops[d] ?? []).filter((x) => x.id !== id) } }));
        },
        carryOver: (sugg, day) => set((s) => ({ tops: applyCarry(s.tops, day ?? dayKeyOf(), sugg, uuid) })),

        saveGoal: (d) => {
          const prev = d.id ? get().goals[d.id] : undefined;
          const g: Goal = {
            id: prev?.id ?? d.id ?? uuid(),
            title: d.title.trim(),
            area: d.area ?? prev?.area ?? 'career',
            why: d.why ?? prev?.why,
            target: 'target' in d ? d.target : prev?.target,
            measure: d.measure ?? prev?.measure ?? 'number',
            unit: d.unit ?? prev?.unit,
            startValue: d.startValue ?? prev?.startValue ?? 0,
            targetValue: d.targetValue ?? prev?.targetValue,
            current: d.current ?? prev?.current ?? d.startValue ?? 0,
            milestones: d.milestones ?? prev?.milestones ?? [],
            checkins: d.checkins ?? prev?.checkins ?? [],
            createdAt: prev?.createdAt ?? new Date().toISOString(),
            doneDay: prev?.doneDay,
          };
          return commitGoal(g);
        },
        deleteGoal: (id) =>
          set((s) => {
            const goals = { ...s.goals };
            delete goals[id];
            return { goals };
          }),
        bumpGoal: (id, delta) => {
          const g = get().goals[id];
          if (!g) return;
          const cur = Math.max(0, Math.round(((g.current ?? 0) + delta) * 100) / 100);
          commitGoal({ ...g, current: cur });
        },
        toggleGoalMilestone: (goalId, mid) => {
          const g = get().goals[goalId];
          if (!g) return;
          commitGoal({ ...g, milestones: g.milestones.map((m) => (m.id === mid ? { ...m, done: !m.done } : m)) });
        },
        addCheckin: (goalId, note) => {
          const g = get().goals[goalId];
          if (!g || !note.trim()) return;
          commitGoal({
            ...g,
            checkins: [{ id: uuid(), dayKey: dayKeyOf(), note: note.trim(), value: g.measure === 'number' ? g.current : undefined }, ...g.checkins],
          });
        },

        saveLearn: (d) => {
          const prev = d.id ? get().learning[d.id] : undefined;
          const l: LearnItem = {
            id: prev?.id ?? d.id ?? uuid(),
            kind: d.kind ?? prev?.kind ?? 'book',
            title: d.title.trim(),
            total: Math.max(0, Math.round(d.total ?? prev?.total ?? 0)),
            current: Math.max(0, Math.round(d.current ?? prev?.current ?? 0)),
            status: d.status ?? prev?.status ?? 'active',
            createdAt: prev?.createdAt ?? new Date().toISOString(),
          };
          return commitLearn(l);
        },
        bumpLearn: (id, delta) => {
          const l = get().learning[id];
          if (!l) return;
          const current = Math.max(0, l.current + delta);
          commitLearn({ ...l, current, status: l.status === 'planned' && current > 0 ? 'active' : l.status === 'done' && delta < 0 ? 'active' : l.status });
        },
        deleteLearn: (id) =>
          set((s) => {
            const learning = { ...s.learning };
            delete learning[id];
            return { learning };
          }),

        saveReview: (r) => {
          const week = r.week ?? weekStartKey(dayKeyOf());
          const prev = get().reviews.find((x) => x.week === week);
          const rec: WeeklyReview = { id: prev?.id ?? uuid(), week, good: r.good.trim(), blockers: r.blockers.trim(), next: r.next.trim(), at: new Date().toISOString() };
          set((s) => ({ reviews: [rec, ...s.reviews.filter((x) => x.week !== week)].sort((a, b) => (a.week < b.week ? 1 : -1)) }));
          if (!prev) {
            award(`growth:review:${week}`, GROWTH_POINTS.review, 'growth.bonus.review', '🗓️');
            touchGrowth(get, set);
          }
        },
        setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
        reset: () => set({ tops: {}, goals: {}, learning: {}, reviews: [], settings: DEFAULT_SETTINGS, activityDay: '' }),
      };
    },
    {
      name: 'all2me-growth-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        tops: s.tops,
        goals: s.goals,
        learning: s.learning,
        reviews: s.reviews,
        settings: s.settings,
        activityDay: s.activityDay,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GrowthState>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) } };
      },
      onRehydrateStorage: () => () => {
        useGrowth.setState({ hydrated: true });
      },
    },
  ),
);
