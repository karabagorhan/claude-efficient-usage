/**
 * Bağımlılıksız i18n. Kullanım:
 *   const t = useT();              t('common.btn.save')  t('task.streak', { n: 3 })
 *   const lang = useLang();        L({ tr: 'Merhaba', en: 'Hello' })
 *   translate(key, params, lang)   // React dışı (bildirimler vb.)
 * Yeni ad alanı = locales/<ns>.ts + aşağıdaki NAMESPACES kaydı.
 */
import { useCallback } from 'react';
import { useSettings } from '../store/settings';
import type { Dict, Lang, Loc, Msg, MsgParams, NamespaceFile } from './types';

import alarm from './locales/alarm';
import common from './locales/common';
import drink from './locales/drink';
import duel from './locales/duel';
import inspire from './locales/inspire';
import love from './locales/love';
import meditate from './locales/meditate';
import mood from './locales/mood';
import motivation from './locales/motivation';
import newtask from './locales/newtask';
import onboarding from './locales/onboarding';
import planner from './locales/planner';
import points from './locales/points';
import profile from './locales/profile';
import reflection from './locales/reflection';
import routine from './locales/routine';
import settings from './locales/settings';
import sleep from './locales/sleep';
import soundscape from './locales/soundscape';
import streak from './locales/streak';
import tabs from './locales/tabs';
import task from './locales/task';
import timer from './locales/timer';
import toast from './locales/toast';
import tools from './locales/tools';
import wheel from './locales/wheel';
import workout from './locales/workout';

export * from './types';
export * from './dates';

const NAMESPACES: Record<string, NamespaceFile> = {
  alarm, common, drink, duel, inspire, love, meditate, mood, motivation, newtask, onboarding, planner, points,
  profile, reflection, routine, settings, sleep, soundscape, streak, tabs, task, timer, toast, tools, wheel, workout,
};

/** Düzleştirilmiş sözlük: 'ns.a.b' -> metin */
const FLAT: Record<Lang, Record<string, string>> = { tr: {}, en: {} };
function flatten(prefix: string, d: Dict, out: Record<string, string>) {
  for (const [k, v] of Object.entries(d)) {
    const key = `${prefix}.${k}`;
    if (typeof v === 'string') out[key] = v;
    else flatten(key, v, out);
  }
}
for (const [ns, file] of Object.entries(NAMESPACES)) {
  flatten(ns, file.tr, FLAT.tr);
  flatten(ns, file.en, FLAT.en);
}

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
const warned = new Set<string>();
function warnOnce(msg: string) {
  if (!isDev || warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[i18n] ${msg}`);
}

export const isLoc = (v: unknown): v is Loc =>
  typeof v === 'object' && v !== null && typeof (v as Loc).tr === 'string' && typeof (v as Loc).en === 'string';

/** Şu anki dil (React dışı okuma). Bileşende useLang() kullan. */
export const currentLang = (): Lang => useSettings.getState().lang;

/** İki dilli içerikten seçer. lang verilmezse geçerli dil. */
export function L(obj: Loc | string | undefined | null, lang: Lang = currentLang()): string {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.tr || obj.en || '';
}

/** Anahtar sözlükte var mı (her iki dilde de bakar). */
export const hasKey = (key: string): boolean => key in FLAT.tr || key in FLAT.en;

/** React dışı çeviri. Eksik anahtar: diğer dile düşer; o da yoksa anahtarın kendisi + bir kez uyarı. */
export function translate(key: string, params?: MsgParams, lang: Lang = currentLang()): string {
  let s = FLAT[lang][key];
  if (s === undefined) {
    const other = FLAT[lang === 'tr' ? 'en' : 'tr'][key];
    warnOnce(`missing key "${key}" for ${lang}`);
    s = other ?? key;
  }
  if (params) {
    s = s.replace(/\{\{(\w+)\}\}/g, (m, p: string) => {
      const v = params[p];
      if (v === undefined) return m;
      return isLoc(v) ? L(v, lang) : String(v);
    });
  }
  return s;
}

export type TFn = (key: string, params?: MsgParams) => string;

/** Geçerli dil (dil değişince yeniden çizer). */
export const useLang = (): Lang => useSettings((s) => s.lang);

/** Çeviri fonksiyonu; dil değişince yeni referans döner. */
export function useT(): TFn {
  const lang = useLang();
  return useCallback((key: string, params?: MsgParams) => translate(key, params, lang), [lang]);
}

/** Msg ({key, params}) çevirisi; store'lardan gelen toast/hata iletileri için. */
export const tMsg = (t: TFn, m: Msg): string => t(m.key, m.params);

/** Puan olayı etiketi: labelKey > label > 'points.event.<type>'. */
export function eventLabel(
  t: TFn,
  e: { type: string; label?: string; labelKey?: string; labelParams?: Record<string, string | number> },
): string {
  if (e.labelKey) return t(e.labelKey, e.labelParams);
  if (e.label) return e.label;
  return t(`points.event.${e.type}`);
}

/** Hata iletisi: bilinen anahtarsa çevir, değilse ham metni göster (sunucu mesajları). */
export const tErr = (t: TFn, message: string): string => (hasKey(message) ? t(message) : message);
