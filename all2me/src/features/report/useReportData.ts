/**
 * Store'lardan ReportData üretir. zustand v5: her seçici yalnız mevcut referansı döndürür,
 * dizi/nesne türetme tek useMemo içinde yapılır (sonsuz render tuzağı yok).
 */
import { useMemo } from 'react';
import { today, useCore } from '../../store/core';
import { useChores } from '../../store/slices/chores';
import { useDrink } from '../../store/slices/drink';
import { useGrowth } from '../../store/slices/growth';
import { useMeals } from '../../store/slices/meals';
import { useMood } from '../../store/slices/mood';
import { useSleep } from '../../store/slices/sleep';
import { useSmoke } from '../../store/slices/smoke';
import { useStudy } from '../../store/slices/study';
import { useTimer } from '../../store/slices/timer';
import type { ReportData } from './calc';

export function useReportData(): ReportData {
  const meId = useCore((s) => s.me?.id ?? '');
  const partnerId = useCore((s) => s.partner?.id ?? null);
  const habits = useCore((s) => s.habits);
  const completions = useCore((s) => s.completions);
  const events = useCore((s) => s.events);
  const mood = useMood((s) => s.entries);
  const sleep = useSleep((s) => s.entries);
  const sleepGoalH = useSleep((s) => s.goalHours);
  const drink = useDrink((s) => s.entries);
  const drinkGoalMl = useDrink((s) => s.goalMl);
  const smokeLogs = useSmoke((s) => s.logs);
  const smokePlan = useSmoke((s) => s.plan);
  const smokePricing = useSmoke((s) => s.pricing);
  const smokeClosed = useSmoke((s) => s.closed);
  const meals = useMeals((s) => s.entries);
  const mealsGoal = useMeals((s) => s.goal);
  const choreLogs = useChores((s) => s.history);
  const studyItems = useStudy((s) => s.items);
  const studyLogs = useStudy((s) => s.logs);
  const studyGoalH = useStudy((s) => s.settings.weekGoalHours);
  const sessions = useTimer((s) => s.sessions);
  const tops = useGrowth((s) => s.tops);
  const day = today();

  return useMemo<ReportData>(
    () => ({
      meId,
      partnerId,
      today: day,
      habits: Object.values(habits),
      completions: Object.values(completions),
      events: Object.values(events),
      mood: Object.values(mood),
      sleep: Object.values(sleep),
      sleepGoalH,
      drink: Object.values(drink),
      drinkGoalMl,
      smokeLogs: Object.values(smokeLogs),
      smokePlan,
      smokePricing,
      smokeClosed,
      meals: Object.values(meals),
      mealsGoal,
      choreLogs: Object.values(choreLogs),
      studyItems: Object.values(studyItems),
      studyLogs: studyLogs ?? [],
      studyGoalH,
      timerSessions: sessions ?? [],
      tops,
    }),
    [meId, partnerId, day, habits, completions, events, mood, sleep, sleepGoalH, drink, drinkGoalMl, smokeLogs, smokePlan, smokePricing, smokeClosed, meals, mealsGoal, choreLogs, studyItems, studyLogs, studyGoalH, sessions, tops],
  );
}
