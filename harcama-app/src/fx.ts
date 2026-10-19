import AsyncStorage from '@react-native-async-storage/async-storage';

/** ECB reference rate, delivered via Frankfurter: 1 USD = rate TRY. Not an intraday trading quote. */
export type Currency = 'TRY' | 'USD';
export type FxRate = { rate: number; date: string; fetchedAt: string; source: 'ECB / Frankfurter' };
export const isCurrency = (x: unknown): x is Currency => x === 'TRY' || x === 'USD';
const CACHE_KEY = 'harcama-defteri:fx-usd-try:v1';
const ENDPOINT = 'https://api.frankfurter.dev/v2/providers/ecb/rate/usd/try';

export function isValidRate(value: unknown): value is FxRate {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<FxRate>;
  return typeof r.rate === 'number' && Number.isFinite(r.rate) && r.rate > 0 &&
    typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
    typeof r.fetchedAt === 'string' && Number.isFinite(Date.parse(r.fetchedAt)) &&
    r.source === 'ECB / Frankfurter';
}

export async function readCachedRate(): Promise<FxRate | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isValidRate(parsed) ? parsed : null;
  } catch { return null; }
}

export async function fetchCurrentRate(): Promise<FxRate> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(ENDPOINT, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('FX HTTP ' + response.status);
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') throw new Error('Invalid FX response');
    const data = body as Record<string, unknown>;
    const rate: FxRate = { rate: Number(data.rate), date: String(data.date), fetchedAt: new Date().toISOString(), source: 'ECB / Frankfurter' };
    if (data.base !== 'USD' || data.quote !== 'TRY' || !isValidRate(rate)) throw new Error('Invalid FX quote');
    // Prevent unexpectedly stale or future-dated upstream data from silently replacing cache.
    const age = Date.now() - Date.parse(rate.date + 'T00:00:00Z');
    if (age < -86400000 || age > 10 * 86400000) throw new Error('Stale FX quote');
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rate));
    return rate;
  } finally { clearTimeout(timer); }
}

/** Convert original transaction currency to the requested display currency. Never mutate the original record. */
export function convert(amount: number, from: Currency, to: Currency, fx: FxRate | null): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  if (!fx || !isValidRate(fx)) return null;
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents)) return null;
  const resultCents = from === 'USD' ? Math.round(cents * fx.rate) : Math.round(cents / fx.rate);
  return Number.isSafeInteger(resultCents) ? resultCents / 100 : null;
}
