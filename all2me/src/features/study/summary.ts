/**
 * Okul özeti — /life merkezi kullanır. İmza sabit (alan eklenebilir, çıkarılamaz).
 * zustand v5: seçiciler yalnız mevcut referansları döndürür (useShallow), türetme useMemo'da.
 */
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { addDays, weekStartKey } from '../../engine/dates';
import { useStudy } from '../../store/slices/study';
import { minutesByTagOf, useTimer } from '../../store/slices/timer';
import { today } from '../../store/core';
import { dueThisWeekCount, overdueCount, studyMinutes, upcoming, weekLoad } from './calc';
import { TYPE_META } from './types';

export interface StudyDeadline {
  id: string;
  title: string;
  course?: string;
  due: string /* YYYY-MM-DD */;
  time?: string;
  type: string;
  /** ek: tür emojisi */
  emoji?: string;
}
export interface StudySummary {
  next: StudyDeadline[];
  overdue: number;
  dueThisWeek: number;
  weekMinutes: number;
  weekGoalMinutes: number;
  /** ek: bu haftanın kalan tahmini yükü (saat) */
  weekLoadHours?: number;
  /** ek: hydrate bitti mi */
  hydrated?: boolean;
}

export function useStudySummary(): StudySummary {
  const { items, courses, logs, goalH, hydrated } = useStudy(
    useShallow((s) => ({ items: s.items, courses: s.courses, logs: s.logs, goalH: s.settings.weekGoalHours, hydrated: s.hydrated })),
  );
  const sessions = useTimer((s) => s.sessions);
  const day = today();
  return useMemo(() => {
    const list = Object.values(items);
    const from = weekStartKey(day);
    const to = addDays(from, 6);
    const tags = minutesByTagOf(sessions ?? [], from, to) as Partial<Record<string, number>>;
    const next = upcoming(list)
      .filter((it) => !!it.due)
      .slice(0, 3)
      .map((it) => ({
        id: it.id,
        title: it.title,
        course: it.courseId ? courses[it.courseId]?.name : undefined,
        due: it.due as string,
        time: it.time,
        type: it.type,
        emoji: TYPE_META[it.type].emoji,
      }));
    return {
      next,
      overdue: overdueCount(list, day),
      dueThisWeek: dueThisWeekCount(list, day),
      weekMinutes: studyMinutes(tags, logs, from, to),
      weekGoalMinutes: Math.round(goalH * 60),
      weekLoadHours: weekLoad(list, day).hours,
      hydrated,
    };
  }, [items, courses, logs, goalH, sessions, day, hydrated]);
}
