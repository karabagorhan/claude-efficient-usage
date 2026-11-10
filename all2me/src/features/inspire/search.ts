import type { Loc } from '../../engine/types';
import { TEMPLATES, type Template } from '../../data/inspire';

/** Türkçe İ/ı dahil aksan ve büyük-küçük harf duyarsız normalleştirme */
export function norm(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim();
}

const both = (l: Loc) => `${norm(l.tr)} ${norm(l.en)}`;

const INDEX = TEMPLATES.map((t) => ({ t, title: both(t.title), items: t.items.map((i) => both(i.name)).join(' | ') }));

export function searchTemplates(q: string): Template[] {
  const n = norm(q);
  if (!n) return [];
  const words = n.split(' ');
  const hit = (s: string) => words.every((w) => s.includes(w));
  const byTitle = INDEX.filter((x) => hit(x.title)).map((x) => x.t);
  const rest = INDEX.filter((x) => !byTitle.includes(x.t) && (hit(x.items) || hit(`${x.title} ${x.items}`))).map((x) => x.t);
  return [...byTitle, ...rest];
}
