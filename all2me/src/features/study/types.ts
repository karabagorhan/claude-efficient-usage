/**
 * Okul / yüksek lisans veri tipleri ve tür meta bilgisi (saf TS — RN içe aktarması yok; testlerden de kullanılır).
 * Görünen adlar i18n'de: study.type.<tür>, study.status.<durum>, study.priority.<öncelik>.
 */
import type { PastelKey, Weekday } from '../../engine/types';

export const ITEM_TYPES = ['homework', 'reading', 'writing', 'exam', 'presentation', 'project', 'thesis'] as const;
export type StudyItemType = (typeof ITEM_TYPES)[number];

export const STATUSES = ['todo', 'doing', 'done', 'submitted'] as const;
export type StudyStatus = (typeof STATUSES)[number];

export const PRIORITIES = ['low', 'med', 'high'] as const;
export type StudyPriority = (typeof PRIORITIES)[number];

/** Zamanlayıcı dilimindeki çalışma etiketleri (Ders / Ödev / Makale). */
export type StudyTimerTag = 'lesson' | 'homework' | 'article';
export const STUDY_TAGS: StudyTimerTag[] = ['lesson', 'homework', 'article'];

export const TYPE_META: Record<StudyItemType, { emoji: string; pastel: PastelKey; points: number; tag: StudyTimerTag }> = {
  homework: { emoji: '📝', pastel: 'blue', points: 20, tag: 'homework' },
  reading: { emoji: '📖', pastel: 'purple', points: 15, tag: 'article' },
  writing: { emoji: '✍️', pastel: 'mint', points: 25, tag: 'article' },
  exam: { emoji: '🎯', pastel: 'pink', points: 30, tag: 'lesson' },
  presentation: { emoji: '🎤', pastel: 'peach', points: 20, tag: 'homework' },
  project: { emoji: '🧩', pastel: 'green', points: 30, tag: 'homework' },
  thesis: { emoji: '🎓', pastel: 'yellow', points: 40, tag: 'article' },
};

export const isItemType = (x: unknown): x is StudyItemType => typeof x === 'string' && (ITEM_TYPES as readonly string[]).includes(x);

export interface ClassSlot {
  day: Weekday;
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  teacher?: string;
  pastel: PastelKey;
  slots: ClassSlot[];
  term?: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface PaperInfo {
  authors?: string;
  year?: string;
  link?: string;
  pagesRead: number;
  pagesTotal: number;
  /** okuma geçişi: 0 = başlanmadı, 1-2-3 */
  pass: 0 | 1 | 2 | 3;
  summary?: string;
}

export interface StudyItem {
  id: string;
  type: StudyItemType;
  title: string;
  courseId?: string;
  /** YYYY-MM-DD */
  due?: string;
  /** HH:MM */
  time?: string;
  status: StudyStatus;
  priority: StudyPriority;
  estHours?: number;
  subtasks: Subtask[];
  notes?: string;
  paper?: PaperInfo;
  remind: { dayBefore: boolean; morning: boolean };
  createdAt: string;
  /** bitti/teslim edildi olduğu gün */
  doneDay?: string;
}

export interface ThesisMilestone {
  id: string;
  /** varsayılan aşama anahtarı (başlık i18n'den gelir) */
  key?: string;
  /** kullanıcı başlığı (varsa key'in yerine) */
  title?: string;
  target?: string;
  /** 0..100 */
  progress: number;
  done: boolean;
}

export interface StudyLog {
  id: string;
  dayKey: string;
  minutes: number;
  tag: StudyTimerTag;
}

export interface StudySettings {
  weekGoalHours: number;
  remindItems: boolean;
  weeklyPlan: boolean;
}

export const isClosed = (s: StudyStatus) => s === 'done' || s === 'submitted';
