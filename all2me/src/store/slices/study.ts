/**
 * Okul / yüksek lisans dilimi (yalnız cihazda). Anahtar: all2me-study-v1.
 * Puan: öğe bitti/teslim → awardBonus(study:item:<id>, türe göre); geri alınırsa revokeBonus.
 * Alt görev / sayfa / çalışma kaydı → completeLinked('study') + günde bir logActivity('study').
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addDays, dayKeyOf } from '../../engine/dates';
import type { PastelKey } from '../../engine/types';
import { uuid } from '../../lib/id';
import { THESIS_MILESTONES } from '../../data/thesisMilestones';
import {
  isClosed,
  TYPE_META,
  type Course,
  type StudyItem,
  type StudyItemType,
  type StudyLog,
  type StudySettings,
  type StudyStatus,
  type StudyTimerTag,
  type ThesisMilestone,
} from '../../features/study/types';
import { useCore } from '../core';

export const STUDY_BONUS_PER_DAY = 5;
export const THESIS_MILESTONE_POINTS = 40;

export type StudyItemDraft = Partial<Omit<StudyItem, 'type' | 'title'>> & { type: StudyItemType; title: string };
export type CourseDraft = Partial<Course> & { name: string };

interface StudyState {
  hydrated: boolean;
  courses: Record<string, Course>;
  items: Record<string, StudyItem>;
  thesis: ThesisMilestone[];
  logs: StudyLog[];
  settings: StudySettings;
  /** logActivity('study') en son çağrılan gün */
  activityDay: string;

  saveCourse: (d: CourseDraft) => string;
  deleteCourse: (id: string) => void;
  saveItem: (d: StudyItemDraft) => string;
  deleteItem: (id: string) => void;
  setStatus: (id: string, status: StudyStatus) => void;
  /** Panodaki hızlı onay: açık → bitti, kapalı → yapılacak */
  toggleClosed: (id: string) => void;
  toggleSubtask: (itemId: string, subId: string) => void;
  addPages: (id: string, delta: number) => void;
  initThesis: () => void;
  saveMilestone: (m: Partial<ThesisMilestone> & { id?: string }) => string;
  deleteMilestone: (id: string) => void;
  moveMilestone: (id: string, dir: -1 | 1) => void;
  addLog: (minutes: number, tag: StudyTimerTag) => void;
  setSettings: (p: Partial<StudySettings>) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: StudySettings = { weekGoalHours: 10, remindItems: true, weeklyPlan: true };

const emptyItem = (d: StudyItemDraft): StudyItem => ({
  id: d.id ?? uuid(),
  type: d.type,
  title: d.title,
  courseId: d.courseId,
  due: d.due,
  time: d.time,
  status: d.status ?? 'todo',
  priority: d.priority ?? 'med',
  estHours: d.estHours,
  subtasks: d.subtasks ?? [],
  notes: d.notes,
  paper: d.paper,
  remind: d.remind ?? { dayBefore: true, morning: true },
  createdAt: d.createdAt ?? new Date().toISOString(),
  doneDay: d.doneDay,
});

// ---- çekirdek yan etkileri ----
function toastCompletion(c: ReturnType<ReturnType<typeof useCore.getState>['completeLinked']>) {
  if (!c) return;
  const core = useCore.getState();
  const h = core.habits[c.habitId];
  core.pushToast('toast.completedTitle', { title: h?.title ?? '', points: c.points });
}

/** Çalışma ilerlemesi: bağlı görevi tamamla + günde bir etkinlik kaydı. */
function touchStudy(get: () => StudyState, set: (p: Partial<StudyState>) => void) {
  const core = useCore.getState();
  const day = dayKeyOf();
  if (get().activityDay !== day) {
    core.logActivity('study', day);
    set({ activityDay: day });
  }
  toastCompletion(core.completeLinked('study', day));
}

function bonusFor(it: StudyItem) {
  const core = useCore.getState();
  const meta = TYPE_META[it.type];
  const r = core.awardBonus({
    id: `study:item:${it.id}`,
    points: meta.points,
    labelKey: `study.bonus.${it.type}`,
    group: 'study',
    perDay: STUDY_BONUS_PER_DAY,
  });
  if (r.ok) core.pushToast({ key: 'toast.bonus', params: { emoji: meta.emoji, points: r.event.points } });
  else if (r.reason === 'cap') core.pushToast('toast.bonusCap', { n: STUDY_BONUS_PER_DAY });
}

/** Durum değişiminin puan etkisi. */
function settleStatus(prev: StudyItem | undefined, next: StudyItem) {
  const was = prev ? isClosed(prev.status) : false;
  const now = isClosed(next.status);
  if (!was && now) bonusFor(next);
  else if (was && !now) useCore.getState().revokeBonus(`study:item:${next.id}`);
}

/** İlerleme kaydı oldu mu (yeni işaretlenen alt görev ya da artan sayfa). */
function progressed(prev: StudyItem | undefined, next: StudyItem): boolean {
  const doneSubs = (x?: StudyItem) => x?.subtasks.filter((s) => s.done).length ?? 0;
  if (doneSubs(next) > doneSubs(prev)) return true;
  if ((next.paper?.pagesRead ?? 0) > (prev?.paper?.pagesRead ?? 0)) return true;
  if ((next.paper?.pass ?? 0) > (prev?.paper?.pass ?? 0)) return true;
  return false;
}

export const useStudy = create<StudyState>()(
  persist(
    (set, get) => {
      const commitItem = (next: StudyItem) => {
        const prev = get().items[next.id];
        if (isClosed(next.status) && !next.doneDay) next = { ...next, doneDay: dayKeyOf() };
        if (!isClosed(next.status) && next.doneDay) next = { ...next, doneDay: undefined };
        set((s) => ({ items: { ...s.items, [next.id]: next } }));
        settleStatus(prev, next);
        const closedNow = !!prev && !isClosed(prev.status) && isClosed(next.status);
        if (progressed(prev, next) || closedNow) touchStudy(get, set);
        return next.id;
      };

      return {
        hydrated: false,
        courses: {},
        items: {},
        thesis: [],
        logs: [],
        settings: DEFAULT_SETTINGS,
        activityDay: '',

        saveCourse: (d) => {
          const prev = d.id ? get().courses[d.id] : undefined;
          const c: Course = {
            id: d.id ?? uuid(),
            name: d.name.trim(),
            code: d.code?.trim() || undefined,
            teacher: d.teacher?.trim() || undefined,
            pastel: (d.pastel ?? prev?.pastel ?? 'blue') as PastelKey,
            slots: d.slots ?? prev?.slots ?? [],
            term: d.term?.trim() || undefined,
            createdAt: prev?.createdAt ?? new Date().toISOString(),
          };
          set((s) => ({ courses: { ...s.courses, [c.id]: c } }));
          return c.id;
        },
        deleteCourse: (id) =>
          set((s) => {
            const courses = { ...s.courses };
            delete courses[id];
            const items: Record<string, StudyItem> = {};
            for (const [k, v] of Object.entries(s.items)) items[k] = v.courseId === id ? { ...v, courseId: undefined } : v;
            return { courses, items };
          }),

        saveItem: (d) => {
          const prev = d.id ? get().items[d.id] : undefined;
          const next = emptyItem({ ...prev, ...d, createdAt: prev?.createdAt ?? d.createdAt });
          next.title = next.title.trim();
          return commitItem(next);
        },
        deleteItem: (id) =>
          set((s) => {
            const items = { ...s.items };
            delete items[id];
            return { items };
          }),
        setStatus: (id, status) => {
          const it = get().items[id];
          if (it) commitItem({ ...it, status });
        },
        toggleClosed: (id) => {
          const it = get().items[id];
          if (!it) return;
          if (isClosed(it.status)) commitItem({ ...it, status: 'todo' });
          else
            commitItem({
              ...it,
              status: 'done',
              paper: it.paper && it.type === 'reading' ? { ...it.paper, pagesRead: Math.max(it.paper.pagesRead, it.paper.pagesTotal) } : it.paper,
            });
        },
        toggleSubtask: (itemId, subId) => {
          const it = get().items[itemId];
          if (!it) return;
          commitItem({ ...it, subtasks: it.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) });
        },
        addPages: (id, delta) => {
          const it = get().items[id];
          if (!it) return;
          const p = it.paper ?? { pagesRead: 0, pagesTotal: 0, pass: 0 as const };
          const max = p.pagesTotal > 0 ? p.pagesTotal : Infinity;
          const pagesRead = Math.max(0, Math.min(max, p.pagesRead + delta));
          const status: StudyStatus = it.status === 'todo' && pagesRead > 0 ? 'doing' : it.status;
          commitItem({ ...it, status, paper: { ...p, pass: p.pass === 0 && pagesRead > 0 ? 1 : p.pass, pagesRead } });
        },

        initThesis: () => {
          if (get().thesis.length) return;
          const t0 = dayKeyOf();
          set({
            thesis: THESIS_MILESTONES.map((m) => ({ id: uuid(), key: m.key, target: addDays(t0, m.offsetDays), progress: 0, done: false })),
          });
        },
        saveMilestone: (m) => {
          const list = get().thesis;
          const prev = m.id ? list.find((x) => x.id === m.id) : undefined;
          const progress = Math.max(0, Math.min(100, Math.round(m.progress ?? prev?.progress ?? 0)));
          let done = m.done ?? prev?.done ?? false;
          if (m.progress !== undefined && m.done === undefined) done = progress >= 100;
          const next: ThesisMilestone = {
            id: prev?.id ?? m.id ?? uuid(),
            key: m.key ?? prev?.key,
            title: m.title !== undefined ? m.title.trim() || undefined : prev?.title,
            target: 'target' in m ? m.target : prev?.target,
            progress: done ? 100 : progress >= 100 ? 99 : progress,
            done,
          };
          set({ thesis: prev ? list.map((x) => (x.id === next.id ? next : x)) : [...list, next] });
          const core = useCore.getState();
          const bid = `study:thesis:${next.id}`;
          if (!prev?.done && next.done) {
            const r = core.awardBonus({ id: bid, points: THESIS_MILESTONE_POINTS, labelKey: 'study.bonus.milestone', group: 'study', perDay: STUDY_BONUS_PER_DAY });
            if (r.ok) core.pushToast({ key: 'toast.bonus', params: { emoji: '🎓', points: r.event.points } });
            else if (r.reason === 'cap') core.pushToast('toast.bonusCap', { n: STUDY_BONUS_PER_DAY });
          } else if (prev?.done && !next.done) core.revokeBonus(bid);
          if (prev && next.progress > prev.progress) touchStudy(get, set);
          return next.id;
        },
        deleteMilestone: (id) => set((s) => ({ thesis: s.thesis.filter((x) => x.id !== id) })),
        moveMilestone: (id, dir) =>
          set((s) => {
            const i = s.thesis.findIndex((x) => x.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= s.thesis.length) return {};
            const thesis = [...s.thesis];
            [thesis[i], thesis[j]] = [thesis[j], thesis[i]];
            return { thesis };
          }),

        addLog: (minutes, tag) => {
          set((s) => ({ logs: [...s.logs, { id: uuid(), dayKey: dayKeyOf(), minutes: Math.max(1, Math.round(minutes)), tag }].slice(-500) }));
          touchStudy(get, set);
        },
        setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
        reset: () => set({ courses: {}, items: {}, thesis: [], logs: [], settings: DEFAULT_SETTINGS, activityDay: '' }),
      };
    },
    {
      name: 'all2me-study-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        courses: s.courses,
        items: s.items,
        thesis: s.thesis,
        logs: s.logs,
        settings: s.settings,
        activityDay: s.activityDay,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StudyState>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) } };
      },
      onRehydrateStorage: () => () => {
        useStudy.setState({ hydrated: true });
      },
    },
  ),
);
