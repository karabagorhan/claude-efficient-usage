import AsyncStorage from '@react-native-async-storage/async-storage';

/** ECB reference rate, delivered via Frankfurter: 1 USD = rate TRY. Not an intraday trading quote. */
import { FxRate, isValidRate } from './fx-math';
export { Currency, FxRate, isCurrency, isValidRate, convert } from './fx-math';
const CACHE_KEY = 'harcama-defteri:fx-usd-try:v1';
const ENDPOINT = 'https://api.frankfurter.dev/v2/providers/ecb/rate/usd/try';

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

