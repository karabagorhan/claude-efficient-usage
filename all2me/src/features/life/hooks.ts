import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_BY_KEY } from '../../data/chores';
import { L, type Lang } from '../../i18n';
import type { Chore, Currency } from './types';

/**
 * Canlı "şimdi" (epoch ms). Aralık temizlenir; uygulama arka plana gidince durur, öne gelince hemen tazelenir.
 */
export function useNow(intervalMs = 30000, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) clearInterval(id);
      id = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    start();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        setNow(Date.now());
        start();
      } else stop();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [intervalMs, active]);
  return now;
}

export const defaultCurrency = (lang: Lang): Currency => (lang === 'tr' ? 'TRY' : 'USD');

/** Intl.NumberFormat ile para biçimi (Intl yoksa basit yedek). */
export function fmtMoney(n: number, currency: Currency, lang: Lang): string {
  const v = Math.round(n * 100) / 100;
  try {
    return new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 2,
    }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

export const fmtNum = (n: number, lang: Lang): string => {
  try {
    return new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US').format(n);
  } catch {
    return String(n);
  }
};

export const choreName = (c: Chore, lang: Lang): string => c.name ?? (c.key && DEFAULT_BY_KEY[c.key] ? L(DEFAULT_BY_KEY[c.key].name, lang) : c.id);

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const clampHHMM = (min: number): string => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};
export const hhmmToMin = (s: string): number => {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
