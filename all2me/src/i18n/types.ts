import type { Loc } from '../engine/types';

export type Lang = 'tr' | 'en';
export const LANGS: readonly Lang[] = ['tr', 'en'];
export type { Loc };

/** Sözlük ağacı: iç içe nesneler, yapraklar metin. Anahtar = 'ns.a.b'. */
export interface Dict {
  [k: string]: string | Dict;
}
/** Her ad alanı dosyasının biçimi. */
export interface NamespaceFile {
  tr: Dict;
  en: Dict;
}
/** Çevrilecek ileti: store'lar metin değil bunu döndürür. */
export interface Msg {
  key: string;
  params?: MsgParams;
}
export type MsgParams = Record<string, string | number | Loc>;
