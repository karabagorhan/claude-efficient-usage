import type { Loc } from '../../engine/types';
import { CATEGORIES, SECTIONS } from './categories';
import { BODY_TEMPLATES } from './templates-body';
import { HOME_TEMPLATES } from './templates-home';
import { ROUTINE_TEMPLATES } from './templates-routine';
import { LIFE_TEMPLATES } from './templates-life';
import { WORK_TEMPLATES } from './templates-work';
import { QUIZZES } from './quizzes';
import type { Category, CategoryId, Quiz, SectionId, Template } from './types';

export * from './types';
export { CATEGORIES, SECTIONS, QUIZZES };

export const TEMPLATES: Template[] = [...HOME_TEMPLATES, ...ROUTINE_TEMPLATES, ...WORK_TEMPLATES, ...BODY_TEMPLATES, ...LIFE_TEMPLATES];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
export const getTemplate = (id: string | undefined): Template | undefined => (id ? BY_ID.get(id) : undefined);
export const getQuiz = (id: string | undefined): Quiz | undefined => QUIZZES.find((q) => q.id === id);
export const getCategory = (id: string | undefined): Category | undefined => CATEGORIES.find((c) => c.id === id);
export const getSection = (id: string | undefined): { id: SectionId; name: Loc } | undefined => SECTIONS.find((s) => s.id === id);

export const templatesInCategory = (id: CategoryId): Template[] => TEMPLATES.filter((t) => t.cats.includes(id));
export const templatesInSection = (id: SectionId): Template[] => TEMPLATES.filter((t) => t.section === id);
export const FEATURED: Template[] = TEMPLATES.filter((t) => t.featured).slice(0, 6);

/** Benzer şablonlar: ortak kategori sayısına göre */
export function similarTo(t: Template, n = 6): Template[] {
  return TEMPLATES.filter((o) => o.id !== t.id)
    .map((o) => ({ o, score: o.cats.filter((c) => t.cats.includes(c)).length + (o.section === t.section ? 0.5 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.o);
}

/** Sağlık/beslenme/spor ile ilgili şablonlarda tıbbi not gösterilir */
export const needsMedicalNote = (t: Template): boolean =>
  t.cats.some((c) => c === 'food' || c === 'fitness' || c === 'evening' || c === 'selfcare' || c === 'focus' || c === 'health');
