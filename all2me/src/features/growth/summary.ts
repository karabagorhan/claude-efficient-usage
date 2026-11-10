/**
 * Gelişim özeti — /life merkezi kullanır. İmza sabit (alan eklenebilir, çıkarılamaz).
 */
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGrowth } from '../../store/slices/growth';
import { today } from '../../store/core';
import { avgProgress, top3Done } from './calc';

export interface GrowthSummary {
  activeGoals: number;
  avgProgress: number /* 0..1 */;
  todayTop: { done: number; total: number };
  /** ek: bugünün önemli işleri (başlık + durum) */
  topTitles?: Array<{ title: string; done: boolean }>;
  hydrated?: boolean;
}

export function useGrowthSummary(): GrowthSummary {
  const day = today();
  const { goals, todayList, hydrated } = useGrowth(useShallow((s) => ({ goals: s.goals, todayList: s.tops[day], hydrated: s.hydrated })));
  return useMemo(() => {
    const active = Object.values(goals).filter((g) => !g.doneDay);
    const st = top3Done(todayList);
    return {
      activeGoals: active.length,
      avgProgress: avgProgress(active),
      todayTop: { done: st.done, total: st.total },
      topTitles: (todayList ?? []).map((x) => ({ title: x.title, done: x.done })),
      hydrated,
    };
  }, [goals, todayList, hydrated]);
}
