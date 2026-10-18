/**
 * Çekirdek mantık testleri: `npx tsx scripts/core-test.ts`
 * Tutar okuma/biçimleme, tarih adları, çoğul biçimleri ve abonelik türü tahmini; her dil için çalışır.
 */
import { CATALOGS, LANGS, Lang, parseAmount, setLanguage, t } from '../src/i18n';
import { fmtTL, guessSubType, dayLabel, monthLabel, shortDay, todayIso, subLabel, catName, CATS, SUB_TYPES, compact, amountText } from '../src/lib';

let fail = 0, pass = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.log(`FAIL ${name}: beklenen ${JSON.stringify(want)}, bulunan ${JSON.stringify(got)}`); }
};
const truthy = (name: string, v: unknown) => { if (v) pass++; else { fail++; console.log(`FAIL ${name}`); } };

// Tutar okuma
setLanguage('tr');
eq('tr 1.250,50', parseAmount('1.250,50'), 1250.5);
eq('tr 125,5', parseAmount('125,5'), 125.5);
eq('tr 1.250 (binlik)', parseAmount('1.250'), 1250);
eq('tr 125.5 (ondalık)', parseAmount('125.5'), 125.5);
eq('tr 1.250.000', parseAmount('1.250.000'), 1250000);
eq('tr ₺ 40', parseAmount('₺ 40'), 40);
eq('tr abc', parseAmount('abc'), 0);
eq('tr 0', parseAmount('0'), 0);
eq('tr boş', parseAmount(''), 0);
eq('tr -5', parseAmount('-5'), 0);
setLanguage('en');
eq('en 1,250.50', parseAmount('1,250.50'), 1250.5);
eq('en 1,250 (binlik)', parseAmount('1,250'), 1250);
eq('en 125,5 (ondalık)', parseAmount('125,5'), 125.5);
eq('en 125.50', parseAmount('125.50'), 125.5);
eq('en 1,250,000.75', parseAmount('1,250,000.75'), 1250000.75);
eq('en 1.250,50 (karışık)', parseAmount('1.250,50'), 1250.5);
eq('en fmt', fmtTL(1250.5), '₺1,250.50');
eq('en fmt0', fmtTL(1250, 0), '₺1,250');
eq('en neg', fmtTL(-40), '−₺40.00');
eq('en compact', compact(1500), '1.5K');
eq('en amountText', amountText(125.5), '125.5');
setLanguage('tr');
eq('tr fmt', fmtTL(1250.5), '₺1.250,50');
eq('tr compact', compact(1500), '1,5 B');
eq('tr amountText', amountText(125.5), '125,5');

for (const li of LANGS) {
  const lang = li.code as Lang;
  setLanguage(lang);
  const cat = CATALOGS[lang];
  // Ay / gün adları eksiksiz
  for (let i = 0; i < 12; i++) { truthy(`${lang} month.${i}`, cat['month.' + i]); truthy(`${lang} monthShort.${i}`, cat['monthShort.' + i]); }
  for (let i = 0; i < 7; i++) { truthy(`${lang} weekday.${i}`, cat['weekday.' + i]); truthy(`${lang} weekdayShort.${i}`, cat['weekdayShort.' + i]); }
  CATS.forEach((c) => truthy(`${lang} cat.${c}`, cat['cat.' + c]));
  SUB_TYPES.forEach((s) => truthy(`${lang} subtype.${s.key}`, cat['subtype.' + s.key]));
  // Biçimler
  truthy(`${lang} dayLabel bugün`, dayLabel(todayIso()) === t('date.today'));
  truthy(`${lang} monthLabel yıl içerir`, monthLabel('2026-10').includes('2026'));
  truthy(`${lang} shortDay`, shortDay('2026-10-05').includes('5'));
  // Çoğul: n=1 ve n=5 farklı/geçerli metin üretir, {n} yer tutucusu kalmaz
  for (const k of ['list.count', 'ago.min', 'sub.inDays', 'subs.countShare', 'toast.restored', 'insight.freeDays', 'search.results', 'tile.avgSub', 'subs.pendingCount', 'reports.catLine']) {
    for (const n of [0, 1, 2, 5, 21]) {
      const s = t(k, { n, pct: 10 });
      truthy(`${lang} ${k} n=${n} dolu`, s && !/\{\w+\}/.test(s) && s !== k);
    }
  }
  truthy(`${lang} subLabel`, subLabel('yayin') !== 'subtype.yayin');
  truthy(`${lang} catName`, catName('Market') !== 'cat.Market');
  // Abonelik türü tahmini (marka adları her dilde)
  eq(`${lang} Netflix`, guessSubType('Netflix'), 'yayin');
  eq(`${lang} Spotify Premium`, guessSubType('Spotify Premium'), 'yayin');
  eq(`${lang} iCloud+`, guessSubType('iCloud+'), 'yazilim');
  eq(`${lang} Bilinmeyen`, guessSubType('Zzzq'), null);
}
// Türkçe ek hâlleri
setLanguage('tr');
eq('tr Susam kursu', guessSubType('Susam kursu'), 'egitim');
eq('tr Su faturası', guessSubType('Su faturası'), 'ev');
eq('tr Site aidatı', guessSubType('Site aidatı'), 'kira');
eq('tr Turkcell faturası', guessSubType('Turkcell faturası'), 'iletisim');

console.log(`${pass} geçti, ${fail} başarısız`);
process.exit(fail ? 1 : 0);
