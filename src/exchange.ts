/** TCMB günlük kur bülteni. Tüm kalıcı parasal kayıtlar TL olarak kalır. */
export type UsdTryQuote = { rate: number; date: string };

export function parseTcmbUsdRate(xml: string): UsdTryQuote {
  const header = xml.match(/<Tarih_Date\b[^>]*\bTarih="(\d{2})\.(\d{2})\.(\d{4})"[^>]*>/i);
  const usd = xml.match(/<Currency\b[^>]*\bKod="USD"[^>]*>([\s\S]*?)<\/Currency>/i);
  const selling = usd?.[1].match(/<ForexSelling>\s*([\d.,]+)\s*<\/ForexSelling>/i);
  const rate = Number(selling?.[1].replace(',', '.'));
  if (!header || !Number.isFinite(rate) || rate <= 0 || rate >= 10000) throw new Error('Invalid TCMB USD quote');
  const date = `${header[3]}-${header[2]}-${header[1]}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Invalid TCMB date');
  return { rate, date };
}

export async function fetchTcmbUsdRate(): Promise<UsdTryQuote> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', { signal: controller.signal });
    if (!response.ok) throw new Error(`TCMB HTTP ${response.status}`);
    return parseTcmbUsdRate(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}
