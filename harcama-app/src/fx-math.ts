/** Pure currency operations; no network or storage side effects. */
export type Currency = 'TRY' | 'USD';
export type FxRate = { rate: number; date: string; fetchedAt: string; source: 'ECB / Frankfurter' };
export const isCurrency = (x: unknown): x is Currency => x === 'TRY' || x === 'USD';

export function isValidRate(value: unknown): value is FxRate {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<FxRate>;
  if (typeof r.rate !== 'number' || !Number.isFinite(r.rate) || r.rate <= 0 || r.rate >= 10000) return false;
  if (typeof r.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return false;
  const day = new Date(r.date + 'T00:00:00Z');
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== r.date) return false;
  return typeof r.fetchedAt === 'string' && Number.isFinite(Date.parse(r.fetchedAt)) && r.source === 'ECB / Frankfurter';
}

/** Convert original transaction currency to the requested display currency. Never mutate the record. */
export function convert(amount: number, from: Currency, to: Currency, fx: FxRate | null): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  if (!fx || !isValidRate(fx)) return null;
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents)) return null;
  const resultCents = from === 'USD' ? Math.round(cents * fx.rate) : Math.round(cents / fx.rate);
  return Number.isSafeInteger(resultCents) ? resultCents / 100 : null;
}
