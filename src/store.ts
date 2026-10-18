import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isLang } from './i18n';
import { CATS, Expense, SUB_TYPES, Settings, Sub, guessSubType, todayIso } from './lib';

// Tüm veriler telefonda tek bir kayıt olarak tutulur (internet gerekmez).
const KEY = 'harcama-defteri:v1';

export type Data = { items: Expense[]; subs: Sub[]; settings: Settings };

const deviceLanguage = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('tr') ? 'tr' : 'en'; }
  catch { return 'tr'; }
})();
export const defaultSettings: Settings = { budget: 0, remind: false, remindHour: 21, subRemind: false, catBudgets: {}, theme: 'noir', name: '', language: deviceLanguage, currency: 'TRY', usdTryRate: 0, usdTryRateDate: '' };
const empty: Data = { items: [], subs: [], settings: defaultSettings };

export function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

const positiveMoney = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 1e12;

function num(v: unknown, d = 0) {
  return typeof v === 'number' && isFinite(v) ? v : d;
}
function str(v: unknown, d = '') {
  return typeof v === 'string' ? v : d;
}

/** Dışarıdan gelen (yedek dosyası, eski kayıt) veriyi güvenli biçime getirir. */
export function normalize(raw: any): Data {
  const items: Expense[] = (Array.isArray(raw?.items) ? raw.items : [])
    .filter((x: any) => x && positiveMoney(x.amount) && validDate(str(x.date)))
    .map((x: any) => ({
      id: str(x.id) || Math.random().toString(36).slice(2),
      amount: x.amount,
      cat: CATS.includes(x.cat) ? x.cat : 'Diğer',
      note: str(x.note),
      date: x.date,
      ts: num(x.ts),
      ...(x.sub ? { sub: str(x.sub), period: str(x.period) } : {}),
    }));
  const subs: Sub[] = (Array.isArray(raw?.subs) ? raw.subs : [])
    .filter((s: any) => s && positiveMoney(s.amount) && str(s.name).trim())
    .map((s: any) => ({
      id: str(s.id) || 'sub_' + Math.random().toString(36).slice(2),
      name: s.name,
      amount: s.amount,
      day: Math.min(31, Math.max(1, num(s.day, 1))),
      freq: s.freq === 'yearly' ? 'yearly' : 'monthly',
      month: Math.min(12, Math.max(1, num(s.month, 1))),
      cat: CATS.includes(s.cat) ? s.cat : 'Diğer',
      skip: str(s.skip),
      skipped: Array.isArray(s.skipped) ? s.skipped.filter((p: unknown) => typeof p === 'string').slice(-120) : [],
      created: validDate(str(s.created)) ? s.created : todayIso(),
      type: SUB_TYPES.some((x) => x.key === s.type) ? s.type : guessSubType(str(s.name)) ?? 'diger',
    }));
  const st = raw?.settings ?? {};
  const settings: Settings = {
    budget: Math.max(0, num(st.budget ?? raw?.budget)),
    remind: st.remind === true,
    remindHour: Math.min(23, Math.max(0, num(st.remindHour, 21))),
    subRemind: st.subRemind === true,
    theme: st.theme === 'ivory' || st.theme === 'system' ? st.theme : 'noir',
    name: typeof st.name === 'string' ? st.name.slice(0, 40) : '',
    language: isLang(st.language) ? st.language : 'tr',
    currency: st.currency === 'USD' && num(st.usdTryRate) > 0 ? 'USD' : 'TRY',
    usdTryRate: num(st.usdTryRate) > 0 ? num(st.usdTryRate) : 0,
    usdTryRateDate: validDate(str(st.usdTryRateDate)) ? st.usdTryRateDate : '',
    catBudgets: Object.fromEntries(
      CATS.filter((c) => positiveMoney(st.catBudgets?.[c])).map((c) => [c, st.catBudgets[c] as number]),
    ),
  };
  return { items, subs, settings };
}

/** Yedeği mevcut verinin üstüne ekler; aynı kimlikli kayıtlar tekrar eklenmez. */
export function merge(cur: Data, incoming: Data): { data: Data; added: number } {
  const ids = new Set(cur.items.map((x) => x.id));
  const newItems = incoming.items.filter((x) => {
    if (ids.has(x.id)) return false;
    ids.add(x.id);
    return true;
  });
  const subIds = new Set(cur.subs.map((s) => s.id));
  const newSubs = incoming.subs.filter((s) => {
    if (subIds.has(s.id)) return false;
    subIds.add(s.id);
    return true;
  });
  return {
    data: {
      items: cur.items.concat(newItems),
      subs: cur.subs.concat(newSubs),
      settings: { ...cur.settings, budget: cur.settings.budget || incoming.settings.budget, catBudgets: { ...incoming.settings.catBudgets, ...cur.settings.catBudgets } },
    },
    added: newItems.length + newSubs.length,
  };
}

/** Eski ekrandan gelen ayar değişimini en son kaydedilmiş ayarlara uygular. */
export function mergeSettingsChange(current: Settings, previous: Settings, next: Settings): Settings {
  const merged = { ...current };
  for (const key of Object.keys(next) as (keyof Settings)[]) {
    if (key !== 'catBudgets' && next[key] !== previous[key]) {
      (merged as unknown as Record<string, unknown>)[key] = next[key];
    }
  }
  if (next.catBudgets !== previous.catBudgets) {
    const budgets = { ...current.catBudgets };
    for (const cat of new Set([...Object.keys(previous.catBudgets), ...Object.keys(next.catBudgets)])) {
      if (previous.catBudgets[cat] !== next.catBudgets[cat]) {
        if (next.catBudgets[cat]) budgets[cat] = next.catBudgets[cat];
        else delete budgets[cat];
      }
    }
    merged.catBudgets = budgets;
  }
  return merged;
}

export function useAppData() {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState(false);
  const dataRef = useRef<Data | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const original = raw ? JSON.parse(raw) : null;
        const loaded = original ? normalize(original) : empty;
        if (original && (!Array.isArray(original.items) || !Array.isArray(original.subs) || loaded.items.length !== original.items.length || loaded.subs.length !== original.subs.length)) {
          throw new Error('Stored data contains invalid records');
        }
        dataRef.current = loaded;
        setData(loaded);
      })
      .catch(() => setLoadError(true));
  }, []);

  const update = useCallback((fn: (d: Data) => Data) => {
    const operation = writes.current.catch(() => {}).then(async () => {
      const prev = dataRef.current;
      if (!prev) throw new Error('Data is not loaded');
      const next = fn(prev);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      dataRef.current = next;
      setData(next);
    });
    writes.current = operation;
    return operation;
  }, []);

  return { data, loadError, update };
}
