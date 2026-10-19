import { convert, Currency, FxRate } from './fx';
import { Data } from './store';

export function projectData(data: Data, target: Currency, fx: FxRate | null): Data | null {
  const items = [];
  for (const item of data.items) {
    const amount = convert(item.amount, item.currency ?? 'TRY', target, fx);
    if (amount === null) return null;
    items.push({ ...item, amount, currency: target });
  }
  const subs = [];
  for (const sub of data.subs) {
    const amount = convert(sub.amount, sub.currency ?? 'TRY', target, fx);
    if (amount === null) return null;
    subs.push({ ...sub, amount, currency: target });
  }
  const old = data.settings;
  const from = old.budgetCurrency ?? 'TRY';
  const budget = old.budget ? convert(old.budget, from, target, fx) : 0;
  if (budget === null) return null;
  const catBudgets: Record<string, number> = {};
  for (const [cat, value] of Object.entries(old.catBudgets)) {
    const amount = convert(value, from, target, fx);
    if (amount === null) return null;
    catBudgets[cat] = amount;
  }
  return { items, subs, settings: { ...old, currency: target, budget, catBudgets, budgetCurrency: target } };
}
