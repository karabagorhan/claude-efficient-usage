/**
 * Çekirdek mantık testleri: `npx tsx scripts/core-test.ts`
 * Tutar okuma/biçimleme, tarih adları, çoğul biçimleri ve abonelik türü tahmini; her dil için çalışır.
 */
import * as XLSX from 'xlsx';
import { parseTcmbUsdRate } from '../src/exchange';
import { CATALOGS, LANGS, Lang, fmtPercent, parseAmount, reminderHourLabel, setLanguage, setReminderPeriod, shiftReminderHour, t } from '../src/i18n';
import { fmtTL, guessSubType, dayLabel, monthLabel, shortDay, todayIso, subLabel, catName, CATS, SUB_TYPES, compact, amountText, addMonths, subStatus, Sub, setMoneyDisplay, displayMoneyValue } from '../src/lib';
import { defaultSettings, merge, mergeSettingsChange, normalize, validDate } from '../src/store';
import { launchMode } from '../src/deeplink';

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
eq('TCMB döviz satış kuru', parseTcmbUsdRate('<Tarih_Date Tarih="17.10.2026"><Currency Kod="USD"><ForexBuying>39.9000</ForexBuying><ForexSelling>40.0000</ForexSelling></Currency></Tarih_Date>'), { rate: 40, date: '2026-10-17' });
let badRateRejected = false;
try { parseTcmbUsdRate('<Tarih_Date Tarih="17.10.2026"><Currency Kod="USD"><ForexSelling>0</ForexSelling></Currency></Tarih_Date>'); } catch { badRateRejected = true; }
truthy('geçersiz TCMB kuru reddedilir', badRateRejected);
setMoneyDisplay('USD', 40);
eq('TL tutar USD gösterimi', fmtTL(1250.5), '$31.26');
eq('TL ana tutar korunur', fmtTL(1250.5, 2, 'TRY'), '₺1,250.50');
eq('grafik USD değeri', displayMoneyValue(200), 5);
setMoneyDisplay('TRY', 40);
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
// Tutar okuma kenar durumları (her iki dil)
setLanguage('tr');
eq('tr 1,250 (ondalık)', parseAmount('1,250'), 1.25);
eq('tr 0,5', parseAmount('0,5'), 0.5);
eq('tr .5', parseAmount('.5'), 0.5);
eq('tr 1,2,3 geçersiz', parseAmount('1,2,3'), 0);
eq('tr 1..2 geçersiz', parseAmount('1..2'), 0);
eq('tr 12,34,56 geçersiz', parseAmount('12,34,56'), 0);
eq('tr boşluk+₺', parseAmount(' ₺ 1 250,75 '), 1250.75);
eq('tr nbsp binlik', parseAmount('1 250'), 1250);
eq('tr çok büyük', parseAmount('12.345.678.901,23'), 12345678901.23);
eq('tr 1e5 geçersiz', parseAmount('1e5'), 0);
eq('tr 0.250 (ondalık, baş 0)', parseAmount('0.250'), 0.25);
eq('tr fmt büyük', fmtTL(12345678901.23), '₺12.345.678.901,23');
eq('tr compact Mn', compact(2500000), '2,5 Mn');
setLanguage('en');
eq('en 1.250 (ondalık)', parseAmount('1.250'), 1.25);
eq('en 0,5', parseAmount('0,5'), 0.5);
eq('en .5', parseAmount('.5'), 0.5);
eq('en 1,2,3 geçersiz', parseAmount('1,2,3'), 0);
eq('en boşluk+₺', parseAmount(' ₺ 1,250.75 '), 1250.75);
eq('en çok büyük', parseAmount('12,345,678,901.23'), 12345678901.23);
eq('en fmt büyük', fmtTL(12345678901.23), '₺12,345,678,901.23');
eq('en compact M', compact(2500000), '2.5M');
eq('en compact <1000', compact(999), '999');
// Kestirme bağlantısı her zaman Türkçe kurallarla okunur (dil İngilizceyken de)
eq('en dilinde tutar=1.250 → tr kuralı', parseAmount('1.250', 'tr'), 1250);
eq('en dilinde tutar=125,50 → tr kuralı', parseAmount('125,50', 'tr'), 125.5);
// Yüzde sırası
eq('en yüzde', fmtPercent(165), '165%');
eq('en hero.used', t('hero.used', { pct: 80 }), '80% used');
// İngilizce çoğullar: 1 tekil, 2/5/21 çoğul
eq('en list.count 1', t('list.count', { n: 1 }), '1 transaction');
eq('en list.count 2', t('list.count', { n: 2 }), '2 transactions');
eq('en list.count 21', t('list.count', { n: 21 }), '21 transactions');
eq('en sub.inDays 1', t('sub.inDays', { n: 1 }), 'in 1 day');
eq('en sub.inDays 5', t('sub.inDays', { n: 5 }), 'in 5 days');
eq('en toast.restored 1', t('toast.restored', { n: 1 }), '1 record added.');
eq('en ago.day 21', t('ago.day', { n: 21 }), '21 days ago');
setLanguage('tr');
eq('tr yüzde', fmtPercent(165), '%165');
eq('tr list.count 1', t('list.count', { n: 1 }), '1 işlem');
eq('tr list.count 21', t('list.count', { n: 21 }), '21 işlem');

// Geçersiz yedek satırları ve tekrar kayıtlar.
truthy('geçerli artık gün', validDate('2024-02-29'));
eq('geçersiz takvim günü', validDate('2026-02-31'), false);
const sample = { id: 'a', amount: 25, cat: 'Market', note: '', date: todayIso(), ts: 1 };
eq('eski kayıt TL kalır', normalize({ items: [sample], subs: [], settings: { language: 'en' } }).items[0].amount, 25);
eq('eski ayar gösterimi TL kalır', normalize({ items: [sample], subs: [], settings: { language: 'en' } }).settings.currency, 'TRY');
eq('yedekli USD gösterimi korunur', normalize({ items: [sample], subs: [], settings: { currency: 'USD', usdTryRate: 40, usdTryRateDate: '2026-10-17' } }).settings.currency, 'USD');
eq('geçersiz tutar atılır', normalize({ items: [{ ...sample, amount: -25 }], subs: [] }).items.length, 0);
eq('geçersiz tarih atılır', normalize({ items: [{ ...sample, date: '2026-02-31' }], subs: [] }).items.length, 0);
const emptyData = { items: [], subs: [], settings: defaultSettings };
eq('yedekte tekrarlı kimlik tek eklenir', merge(emptyData, { ...emptyData, items: [sample, sample] }).data.items.length, 1);

// Geçmiş abonelik dönemi, güncel ayda kaybolmamalı.
const lastMonth = addMonths(todayIso().slice(0, 7), -1);
const subscription: Sub = { id: 's', name: 'Test', amount: 50, day: 1, freq: 'monthly', month: 0, cat: 'Diğer', skip: '', type: 'diger', created: lastMonth + '-01' };
eq('geçmiş ödenmemiş dönem bekler', subStatus(subscription, []).period, lastMonth);
eq('geçmiş dönem atlanınca güncel dönem bekler', subStatus({ ...subscription, skipped: [lastMonth] }, []).period, todayIso().slice(0, 7));
const currentPeriod = todayIso().slice(0, 7);
const dueLater = { ...subscription, day: 31, skipped: [lastMonth] };
eq('atlanmış güncel dönem, ödeme günü değişse de atlandı kalır', subStatus({ ...dueLater, skipped: [lastMonth, currentPeriod] }, []).state, 'skipped');
eq('ödenmiş güncel dönem, ödeme günü değişse de ödendi kalır', subStatus(dueLater, [{ ...sample, sub: 's', period: currentPeriod }]).state, 'paid');
if (Number(currentPeriod.slice(5)) > 1) {
  const annual: Sub = { ...subscription, freq: 'yearly', month: Number(currentPeriod.slice(5)) - 1, created: todayIso() };
  const status = subStatus(annual, []);
  eq('yeni yıllık abonelik eski vadesi atlandı sayılmaz', status.state, 'upcoming');
  eq('yeni yıllık abonelik gelecek yıla planlanır', status.period, String(Number(currentPeriod.slice(0, 4)) + 1));
}
if (Number(todayIso().slice(8)) > 1) {
  const annualSameMonth: Sub = { ...subscription, freq: 'yearly', month: Number(currentPeriod.slice(5)), day: 1, created: todayIso() };
  eq('yeni yıllık abonelik bu ayın eski vadesini bekleyen saymaz', subStatus(annualSameMonth, []).state, 'upcoming');
}
const nameChange = { ...defaultSettings, name: 'Ada' };
const languageChange = { ...defaultSettings, language: 'en' as const };
const savedName = mergeSettingsChange(defaultSettings, defaultSettings, nameChange);
const savedBoth = mergeSettingsChange(savedName, defaultSettings, languageChange);
eq('eşzamanlı ayar kayıtları adı korur', savedBoth.name, 'Ada');
eq('eşzamanlı ayar kayıtları dili uygular', savedBoth.language, 'en');
eq('İngilizce gece yarısı', reminderHourLabel(0, 'en'), '12:00 AM');
eq('İngilizce öğlen', reminderHourLabel(12, 'en'), '12:00 PM');
eq('İngilizce 21:00', reminderHourLabel(21, 'en'), '9:00 PM');
eq('Türkçe 21:00', reminderHourLabel(21, 'tr'), '21:00');
eq('İngilizce öğleden önce seçimi', setReminderPeriod(21, 'AM'), 9);
eq('İngilizce öğleden sonra seçimi', setReminderPeriod(0, 'PM'), 12);
eq('11 AM → 12 PM', shiftReminderHour(11, 1), 12);
eq('11 PM → 12 AM', shiftReminderHour(23, 1), 0);
eq('native harcama kestirmesi', launchMode('harcama://ekle?tutar=25'), 'ekle');
eq('native bütçe kestirmesi', launchMode('harcama://butce'), 'butce');
eq('Expo Go kestirmesi', launchMode('exp://example/?channel-name=ekle'), 'ekle');

// Excel: sayfa adları ≤31 karakter, yasak karakter yok ve xlsx kütüphanesi kabul ediyor; dosya adları geçerli
for (const li of LANGS) {
  setLanguage(li.code as Lang);
  const wb = XLSX.utils.book_new();
  for (const k of ['xl.sheet.expenses', 'xl.sheet.categories', 'xl.sheet.months', 'xl.sheet.subscriptions']) {
    const name = t(k);
    truthy(`${li.code} ${k} geçerli sayfa adı (${name})`, name.length >= 1 && name.length <= 31 && !/[\\/?*[\]:]/.test(name));
    let okAppend = true;
    try { XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[t('xl.date'), t('xl.amount')]]), name); } catch { okAppend = false; }
    truthy(`${li.code} ${k} xlsx kabul etti`, okAppend);
  }
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  truthy(`${li.code} xlsx yazıldı`, buf.byteLength > 1000);
  for (const [k, p] of [['file.excelMonth', { ym: '2026-10' }], ['file.excelAll', { date: '2026-10-18' }], ['file.backup', { date: '2026-10-18' }]] as const) {
    const f = t(k, p);
    truthy(`${li.code} ${k} dosya adı geçerli (${f})`, /^[A-Za-z0-9._-]+$/.test(f));
  }
}

// Türkçe ek hâlleri
setLanguage('tr');
eq('tr Susam kursu', guessSubType('Susam kursu'), 'egitim');
eq('tr Su faturası', guessSubType('Su faturası'), 'ev');
eq('tr Site aidatı', guessSubType('Site aidatı'), 'kira');
eq('tr Turkcell faturası', guessSubType('Turkcell faturası'), 'iletisim');

console.log(`${pass} geçti, ${fail} başarısız`);
process.exit(fail ? 1 : 0);
