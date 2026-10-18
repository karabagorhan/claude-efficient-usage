/**
 * Arayüz testi (tarayıcıda, iPhone boyutunda): `node scripts/ui-test.js <dil> [--shots dizin]`
 *   Önce web paketi alınmalı: npx expo export --platform web --output-dir /tmp/web-out   (dizin: WEB_DIR)
 * Kontroller (her ekran için): taşma (yatay kaydırma, kutu dışına çıkan öğe), kesilen metin (…),
 * çevrilmemiş anahtar sızıntısı, Türkçe artığı (tr dışı dillerde), dil değiştirince anında güncelleme ve kalıcılık.
 * Çıkış kodu 1: en az bir HATA var. (UYARI = incelenmeli.)
 */
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const lang = process.argv[2] || 'en';
const shotsIdx = process.argv.indexOf('--shots');
const shots = shotsIdx > 0 ? process.argv[shotsIdx + 1] : null;
const WEB_DIR = process.env.WEB_DIR || '/tmp/web-out';
const PORT = 8800 + Math.floor(Math.random() * 100);
const NATIVE = { tr: 'Türkçe', en: 'English', de: 'Deutsch', ru: 'Русский', zh: '简体中文', es: 'Español', it: 'Italiano' };

const mime = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(WEB_DIR, p);
  if (!f.startsWith(WEB_DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
let k = 0; const now = Date.now();
const e = (n, amount, cat, note = '') => ({ id: 't' + k++, amount, cat, note, date: day(n), ts: now - n * 864e5 - 5 * 60000 + k });
// TEST VERİSİ (örnek; kullanıcının verisi değil)
const data = (language) => ({
  items: [
    e(0, 125.5, 'Market', 'Migros'), e(1, 860, 'Market', 'Weekly groceries'), e(3, 640, 'Market', 'Migros'), e(6, 1614.5, 'Market', 'Carrefour'),
    e(0, 85, 'Yeme-İçme', 'Coffee'), e(2, 420, 'Yeme-İçme', 'Dinner'), e(5, 675, 'Yeme-İçme', 'Restaurant'),
    e(4, 890, 'Eğlence', 'Concert'), e(7, 310, 'Ulaşım', 'Fuel'), e(9, 1250, 'Fatura', 'Electricity'), e(11, 380, 'Sağlık', 'Pharmacy'), e(12, 700, 'Giyim', 'Jacket'),
    e(35, 2100, 'Market'), e(38, 900, 'Eğlence'),
  ],
  subs: [
    { id: 'sub_a', name: 'Netflix', amount: 189.99, day: 1, freq: 'monthly', month: 0, cat: 'Eğlence', skip: '', type: 'yayin' },
    { id: 'sub_b', name: 'Spotify', amount: 99, day: 28, freq: 'monthly', month: 0, cat: 'Eğlence', skip: '', type: 'yayin' },
    { id: 'sub_c', name: 'Phone bill', amount: 450, day: 25, freq: 'monthly', month: 0, cat: 'Fatura', skip: '', type: 'iletisim' },
    { id: 'sub_d', name: 'iCloud', amount: 1200, day: 5, freq: 'yearly', month: 3, cat: 'Diğer', skip: '', type: 'yazilim' },
  ],
  settings: { budget: 10000, remind: false, remindHour: 21, subRemind: false, catBudgets: { 'Eğlence': 1000, 'Market': 3000 }, theme: 'noir', name: 'Test User', language },
});

const TR_WORDS = /\b(Bugün|Dün|Kaydet|Harcama|Harcamalar|Bütçe|Abonelik|Abonelikler|Ayarlar|Özet|Raporlar|Kategori|Tümü|işlem|aylık|yıllık|Vazgeç|Sil|Geri al|kaldı|aşıldı)\b/;
const KEY_LEAK = /\b(?:app|common|sheet|fab|title|fmt|date|month|monthShort|weekday|weekdayShort|ago|cat|subtype|menu|hero|tile|section|recent|insight|search|list|filter|empty|expense|reports|chart|subs|sub|budget|settings|toast|notif|xl|file)\.[A-Za-z0-9_.\-]+\b/;

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const base = `http://127.0.0.1:${PORT}/`;
  const exe = process.env.PW_CHROMIUM || [ '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' ].find((p) => fs.existsSync(p));
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [], warnings = [], pageErrors = [];
  page.on('pageerror', (er) => pageErrors.push(er.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) pageErrors.push(m.text()); });
  let pass = 0;
  const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('OK    ' + name); } else { errors.push(name + (detail ? ' — ' + detail : '')); console.log('HATA  ' + name + (detail ? ' — ' + detail : '')); } };
  const warn = (name, detail) => { warnings.push(name + ' — ' + detail); console.log('UYARI ' + name + ' — ' + detail); };
  const shot = async (n) => { if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `${lang}-${n}.png`) }); } };
  // Kaydırılan içeriğin tamamını görmek için uzun ekran görüntüsü (yalnızca --shots ile; ölçüler sonra geri alınır)
  const tallShot = async (n) => {
    if (!shots) return;
    await page.setViewportSize({ width: 390, height: 3200 }); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(shots, `${lang}-${n}-tam.png`) });
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400);
  };

  await page.goto(base);
  await page.evaluate((d) => localStorage.setItem('harcama-defteri:v1', JSON.stringify(d)), data(lang));
  await page.reload();
  await page.waitForFunction(() => document.body.innerText.length > 50, null, { timeout: 30000 });
  await page.waitForTimeout(1500);

  // Her ekranda: taşma, kesilme, anahtar sızıntısı, Türkçe artığı
  async function audit(name) {
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const W = window.innerWidth, out = { overflowX: document.documentElement.scrollWidth > W + 1, outside: [], truncated: [], text: document.body.innerText };
      document.querySelectorAll('div,span').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        const txt = (el.childNodes.length === 1 && el.firstChild.nodeType === 3) ? el.textContent.trim() : '';
        // Bilerek yatay kaydırılan kapsayıcıların (ör. kategori çipleri) içindeki öğeler taşma sayılmaz
        let inScroller = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.scrollWidth > p.clientWidth) { inScroller = true; break; }
        }
        if (txt && !inScroller && (b.right > W + 1 || b.left < -1)) out.outside.push(txt.slice(0, 40));
        if (txt && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') out.truncated.push(txt.slice(0, 50));
      });
      return out;
    });
    ok(`[${name}] yatay taşma yok`, !r.overflowX);
    ok(`[${name}] ekran dışına taşan metin yok`, r.outside.length === 0, r.outside.slice(0, 4).join(' | '));
    if (r.truncated.length) warn(`[${name}] kesilen (…) metin`, [...new Set(r.truncated)].slice(0, 6).join(' | '));
    const leak = r.text.match(KEY_LEAK);
    ok(`[${name}] çevrilmemiş anahtar sızmıyor`, !leak, leak ? leak[0] : '');
    // Yüzde işareti dilin sırasıyla: tr "%80", en "80%"
    const pctBad = lang === 'tr' ? r.text.match(/\d%(?!\w)/) : r.text.match(/%\d/);
    ok(`[${name}] yüzde biçimi dile uygun`, !pctBad, pctBad ? pctBad[0] : '');
    if (lang !== 'tr') {
      const trw = r.text.match(TR_WORDS), trc = r.text.match(/[ğĞıİşŞ]/);
      ok(`[${name}] Türkçe kelime kalmamış`, !trw, trw ? trw[0] : '');
      if (trc) warn(`[${name}] Türkçe harf (özel ad olabilir)`, trc[0]);
    }
    return r.text;
  }

  const menuBtn = () => page.locator('[role="button"][aria-label]').first();
  const goTo = async (n) => { await menuBtn().click(); await page.waitForTimeout(450); await page.locator('[role="menuitem"]').nth(n).click(); await page.waitForTimeout(500); };

  await audit('özet'); await shot('1-ozet'); await tallShot('1-ozet');
  await menuBtn().click(); await page.waitForTimeout(500);
  await audit('menü'); await shot('2-menu');
  await page.locator('[role="menuitem"]').nth(0).click(); await page.waitForTimeout(400);
  for (const [n, name] of [[2, 'harcamalar'], [3, 'raporlar'], [4, 'abonelikler'], [5, 'bütçe'], [6, 'ayarlar']]) {
    await goTo(n); await audit(name); await shot(`3-${name}`); await tallShot(`3-${name}`);
  }
  // Harcama formu ve abonelik formu
  await goTo(0);
  await page.getByText(/^\+\s+/).first().click(); await page.waitForTimeout(700);
  await audit('harcama formu'); await shot('4-harcama-formu');
  const amountField = page.locator(`input[aria-label="${lang === 'tr' ? 'Tutar' : 'Amount'}"]`);
  await amountField.fill('1,2,3');
  ok('hatalı tutar uyarısı gösteriliyor', await page.getByText(lang === 'tr' ? 'Geçerli bir tutar yaz.' : 'Enter a valid amount.').isVisible());
  await amountField.fill(lang === 'tr' ? '42,50' : '42.50');
  const dateField = page.locator(`input[aria-label="${lang === 'tr' ? 'Harcama tarihi, yıl-ay-gün' : 'Expense date, year-month-day'}"]`);
  await dateField.fill('2026-02-31');
  ok('geçersiz tarih uyarısı gösteriliyor', await page.getByText(lang === 'tr' ? 'Geçerli bir geçmiş tarih yaz: YYYY-AA-GG.' : 'Enter a valid past date: YYYY-MM-DD.').isVisible());
  await dateField.fill(day(0));
  await page.evaluate(() => {
    window.__originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'harcama-defteri:v1') throw new Error('Simulated storage failure');
      return window.__originalSetItem.call(this, key, value);
    };
  });
  await page.getByText(new RegExp(`^${lang === 'tr' ? 'Kaydet' : 'Save'} · `)).first().click();
  await page.waitForTimeout(350);
  ok('depolama hatası kullanıcıya gösteriliyor', await page.getByText(lang === 'tr' ? 'Kayıt telefona yazılamadı. Lütfen tekrar dene.' : 'Could not save on this device. Please try again.').isVisible());
  ok('depolama hatasında kayıt eklenmiyor', await page.evaluate(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).items.length === 14));
  await page.evaluate(() => { Storage.prototype.setItem = window.__originalSetItem; });
  await page.getByText(new RegExp(`^${lang === 'tr' ? 'Kaydet' : 'Save'} · `)).first().click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).items.length === 15);
  ok('harcama kalıcı kaydedildi', await page.evaluate(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).items.some((x) => x.amount === 42.5)));
  // Abonelik formu (Abonelikler ekranındaki "+ ..." düğmesi)
  await goTo(4);
  await page.getByText(/^\+\s+/).first().click(); await page.waitForTimeout(700);
  await page.keyboard.type('Gym membership'); await page.waitForTimeout(300);
  await audit('abonelik formu'); await shot('4-abonelik-formu'); await tallShot('4-abonelik-formu');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);

  // Dil değişimi: Ayarlar → dil → anında güncelleme, kalıcılık
  await goTo(6);
  const otherLang = lang === 'tr' ? 'en' : 'tr';
  const before = await page.evaluate(() => document.body.innerText);
  await page.getByText(NATIVE[otherLang], { exact: true }).click(); await page.waitForTimeout(700);
  const after = await page.evaluate(() => document.body.innerText);
  ok('dil değişince ekran anında güncelleniyor (yeniden başlatmadan)', before !== after);
  await shot('5-diger-dil');
  await page.getByText(NATIVE[lang], { exact: true }).click(); await page.waitForTimeout(700);
  const back = await page.evaluate(() => document.body.innerText);
  ok('dil geri alınınca metin yeniden eski dile dönüyor', back === before);
  await page.reload(); await page.waitForTimeout(2000);
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).settings.language);
  ok(`seçilen dil kalıcı kaydedildi (${lang})`, persisted === lang, persisted);
  const afterReload = await page.evaluate(() => document.body.innerText);
  ok('yeniden açılınca seçili dilde açılıyor', lang === 'tr' ? !/[A-Za-z]{4,} (spent|left)/.test(afterReload) : !TR_WORDS.test(afterReload));
  // Verilerin korunduğu
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).items.length);
  ok('dil değişimi harcama verisini bozmadı', kept === 15, String(kept));

  if (lang === 'en') {
    let delayRate = true;
    await page.route('**/kurlar/today.xml', async (route) => {
      if (delayRate) { delayRate = false; await new Promise((resolve) => setTimeout(resolve, 700)); }
      await route.fulfill({ status: 200, contentType: 'application/xml', body: '<Tarih_Date Tarih="17.10.2026"><Currency Kod="USD"><ForexBuying>39.9</ForexBuying><ForexSelling>40.0</ForexSelling></Currency></Tarih_Date>' });
    });
    await goTo(6);
    await page.getByText('USD · $', { exact: true }).click();
    await page.getByText('TRY · ₺', { exact: true }).click();
    await page.getByText('Ivory', { exact: true }).click();
    await page.waitForTimeout(900);
    ok('bekleyen USD isteği iptal edilebiliyor', await page.evaluate(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).settings.currency === 'TRY'));
    ok('kur beklenirken diğer ayar kaydediliyor', await page.evaluate(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).settings.theme === 'ivory'));
    await page.getByText('Noir', { exact: true }).click();
    await page.getByText('USD · $', { exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).settings.currency === 'USD');
    const usdData = await page.evaluate(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')));
    ok('TCMB satış kuru kaydedildi', usdData.settings.usdTryRate === 40 && usdData.settings.usdTryRateDate === '2026-10-17');
    ok('USD seçiminde TL harcamaları korunuyor', usdData.items.some((x) => x.amount === 125.5));
    await page.unroute('**/kurlar/today.xml');
    await page.route('**/kurlar/today.xml', (route) => route.abort());
    await page.getByText('Refresh TCMB rate', { exact: true }).click();
    await page.waitForTimeout(400);
    ok('kur erişimi yokken son kayıtlı kur korunuyor', await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('harcama-defteri:v1')).settings;
      return s.currency === 'USD' && s.usdTryRate === 40;
    }));
    await goTo(0);
    ok('özet USD kuruyla gösteriliyor', (await page.evaluate(() => document.body.innerText)).includes('$6.33'));
    await goTo(6);
    await page.getByText('TRY · ₺', { exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).settings.currency === 'TRY');
    await goTo(0);
    ok('TRY gösterimine geri dönüyor', (await page.evaluate(() => document.body.innerText)).includes('₺253.00'));
    await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('harcama-defteri:v1'));
      d.settings.remind = true;
      d.settings.remindHour = 21;
      localStorage.setItem('harcama-defteri:v1', JSON.stringify(d));
    });
    await page.reload();
    await page.waitForTimeout(1200);
    await goTo(6);
    ok('İngilizce hatırlatma 12 saat gösteriliyor', (await page.evaluate(() => document.body.innerText)).includes('9:00 PM'));
    await page.getByText('AM', { exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('harcama-defteri:v1')).settings.remindHour === 9);
    ok('AM seçimi kaydediliyor', (await page.evaluate(() => document.body.innerText)).includes('9:00 AM'));
  }

  ok('sayfa hatası yok', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  console.log(`\n${pass} kontrol geçti, ${errors.length} hata, ${warnings.length} uyarı`);
  await browser.close(); server.close();
  process.exit(errors.length ? 1 : 0);
})().catch((er) => { console.error('TEST HATASI', er); try { server.close(); } catch {} process.exit(2); });
