// GEÇİCİ STUB — sahibi `study` ajanı bu dosyayı gerçek veriyle yeniden yazar. İmza değişmez.
export interface StudyDeadline { id: string; title: string; course?: string; due: string /* YYYY-MM-DD */; time?: string; type: string }
export interface StudySummary { next: StudyDeadline[]; overdue: number; dueThisWeek: number; weekMinutes: number; weekGoalMinutes: number }
export function useStudySummary(): StudySummary {
  return { next: [], overdue: 0, dueThisWeek: 0, weekMinutes: 0, weekGoalMinutes: 0 };
}
