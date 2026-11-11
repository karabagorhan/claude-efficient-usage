/**
 * replica-test ortak yardımcıları: sunucu, Playwright, tohum verisi, hata yakalama, metin sözlüğü.
 * Test dosyaları (e2e/*.test.mjs) `export default [ {id, name, run}, ... ]` verir; çalıştırıcı run.mjs.
 * Selektörler: rol / etiket / görünür metin (i18n sözlüğünden `T()` ile). CSS sınıfı kullanılmaz.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHOTS = path.join(ROOT, 'shots', 'rtest');

// ---------------------------------------------------------------- playwright
export function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try {
    return req('playwright');
  } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
}

// ---------------------------------------------------------------- statik sunucu
export async function startServer(dist) {
  const DIST = path.resolve(ROOT, dist);
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error(`dist yok: ${DIST}`);
  const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(DIST, url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

// ---------------------------------------------------------------- i18n sözlüğü (kaynak dosyalardan)
let FLAT = null;
export async function loadDict() {
  if (FLAT) return FLAT;
  const { tsImport } = await import(pathToFileURL(path.join(ROOT, 'node_modules/tsx/dist/esm/api/index.mjs')).href);
  FLAT = { tr: {}, en: {} };
  const dir = path.join(ROOT, 'src/i18n/locales');
  const flatten = (prefix, d, out) => {
    for (const [k, v] of Object.entries(d)) (typeof v === 'string' ? (out[`${prefix}.${k}`] = v) : flatten(`${prefix}.${k}`, v, out));
  };
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.ts')) continue;
    const ns = f.replace(/\.ts$/, '');
    let m = await tsImport(path.join(dir, f), import.meta.url);
    m = m.default?.default ?? m.default;
    flatten(ns, m.tr, FLAT.tr);
    flatten(ns, m.en, FLAT.en);
  }
  return FLAT;
}
/** T('tr' | 'en')('ns.key', {n: 3}) -> metin (yer tutucular doldurulur). */
export function translator(dict, lang) {
  return (key, params) => {
    let s = dict[lang][key];
    if (s === undefined) throw new Error(`test: sözlükte anahtar yok (${lang}): ${key}`);
    return s.replace(/\{\{(\w+)\}\}/g, (m, p) => (params && params[p] !== undefined ? String(params[p]) : m));
  };
}
/** Yer tutuculu metinden gevşek regex (ör. 'Hedef {{n}} ml' -> /Hedef .+ ml/). */
export function rx(s, flags = 'i') {
  return new RegExp(s.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\{\w+\}\}/g, '.+'), flags);
}

// ---------------------------------------------------------------- tarih
const pad = (n) => String(n).padStart(2, '0');
export const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Uygulamanın gün anahtarı (03:00 sınırı). */
export const dayKeyOf = (ms) => fmtDate(new Date(ms - 3 * 3600 * 1000));
export const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n, 12);
  return fmtDate(dt);
};
export const weekdayOf = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return (new Date(y, m - 1, d, 12).getDay() + 6) % 7;
};

// ---------------------------------------------------------------- tohum verisi
/**
 * Tarayıcı saati: `at` = "YYYY-MM-DDTHH:MM" (yerel) verilirse Date o ana kaydırılır (zaman akmaya devam eder).
 * Varsayılan: bugün 12:00 yerel (gün sınırı / unuttum hakkı gibi saat bağımlılıklarından bağımsız).
 */
export function resolveNow(at) {
  if (at) return new Date(at).getTime();
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

export function makeSeed({ now, lang = 'tr', habits: extraHabits, onboarded = true, theme = 'light', units = 'ml', withHistory = true, partner = null, core = {}, settings = {}, slices = {}, noHabits = false } = {}) {
  const d = new Date(now - 3 * 3600 * 1000);
  const today = fmtDate(d);
  const daysAgo = (n) => fmtDate(new Date(d.getTime() - n * 86400000));
  const created = new Date(now - 10 * 86400000).toISOString();
  const en = lang === 'en';
  const me = { id: 'seed-me', name: en ? 'Alex' : 'Deniz', emoji: '🌟', color: '#7C5CFC', _u: now };
  const H = (id, title, icon, slot, pastel, extra = {}) => ({
    id, ownerId: me.id, title, icon, slot, pastel, difficulty: 'easy', kind: 'check', schedule: { days: [] },
    isPrivate: false, together: false, createdAt: created, archived: false, _u: now, ...extra,
  });
  let list = noHabits ? [] : [
    H('s1', en ? 'Make the bed' : 'Yatağı topla', '🛏️', 'morning', 'blue'),
    H('s2', en ? 'Eat breakfast' : 'Kahvaltı yap', '🍳', 'morning', 'green'),
    H('s3', en ? 'Drink water' : 'Su iç', '💧', 'anytime', 'mint', { kind: 'counter', target: 8, link: 'drink' }),
    H('s4', en ? 'Read 10 pages' : '10 sayfa oku', '📖', 'evening', 'purple', { difficulty: 'medium' }),
    H('s5', en ? 'Tidy the desk' : 'Masayı topla', '🧹', 'afternoon', 'peach'),
  ];
  if (extraHabits) list = list.concat(extraHabits.map((h) => H(h.id, h.title, h.icon ?? '⭐', h.slot ?? 'anytime', h.pastel ?? 'yellow', h.extra ?? {})));
  const completions = {};
  const events = {};
  const done = withHistory && !noHabits ? [['s1', today], ['s1', daysAgo(1)], ['s2', daysAgo(1)], ['s1', daysAgo(2)]] : [];
  for (const [h, day] of done) {
    const id = `c:${h}:${day}`;
    const at = new Date(`${day}T09:00:00`).toISOString();
    completions[id] = { id, habitId: h, userId: me.id, dayKey: day, completedAt: at, points: 10, base: 10, multiplier: 1, earlyBonus: 0, _u: now };
    events[`ev:${id}`] = { id: `ev:${id}`, userId: me.id, dayKey: day, type: 'completion', points: 10, refId: id, createdAt: at, label: list.find((x) => x.id === h).title, _u: now };
  }
  const state = {
    me: onboarded ? me : null, partner, pairId: null, pairCode: null, startedAt: created,
    habits: Object.fromEntries(list.map((h) => [h.id, h])), completions, events, nudges: {},
    badges: Object.fromEntries(['first', 'streak3'].map((b) => [`${me.id}:${b}`, { id: `${me.id}:${b}`, userId: me.id, badgeId: b, at: created, _u: now }])),
    progress: { [`s3|${today}`]: 3 }, activity: {}, backfillUsed: {}, dirty: {}, cursor: null, syncedOnce: false, seenNudges: {},
    ...core,
  };
  const init = {
    'all2me-core-v1': JSON.stringify({ state, version: 1 }),
    'all2me-settings-v1': JSON.stringify({ state: { units, notifications: true, onboarded, theme, lang, ...settings }, version: 1 }),
  };
  for (const [name, st] of Object.entries(slices)) init[`all2me-${name}-v1`] = JSON.stringify({ state: st, version: 1 });
  return { init, today, daysAgo, me };
}

// ---------------------------------------------------------------- oturum
/** Bilinen, zararsız konsol gürültüsü (uygulama hatası sayılmaz, ayrıca listelenir). */
const NOISE = [/Failed to load resource/i, /favicon/i, /net::ERR/i, /expo-notifications|ExpoPushTokenManager/i, /\[i18n\]/i];
/** Bu desenler HER durumda başarısızlık sayılır. */
export const FATAL = [/Maximum update depth/i, /getSnapshot/i, /Cannot update a component/i, /Too many re-renders/i];

export class Session {
  constructor(ctx, page, base, T, lang, meta) {
    Object.assign(this, { ctx, page, base, T, lang, meta, errors: [], warnings: [], shots: [] });
    page.on('pageerror', (e) => this.errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      const txt = m.text();
      if (FATAL.some((r) => r.test(txt))) return this.errors.push(`${m.type()}: ${txt}`);
      if (m.type() === 'error') {
        if (NOISE.some((r) => r.test(txt))) this.warnings.push(`error(noise): ${txt}`);
        else this.errors.push(`console.error: ${txt}`);
      } else if (m.type() === 'warning') this.warnings.push(`warning: ${txt}`);
    });
  }
  t(key, params) {
    return this.T(key, params);
  }
  /** i18n metnini gevşek regex'e çevirir. */
  r(key, flags) {
    return rx(this.T(key), flags);
  }
  text(key, params) {
    return this.page.getByText(this.T(key, params), { exact: false });
  }
  async goto(p, wait = 500) {
    await this.page.goto(this.base + p, { waitUntil: 'networkidle', timeout: 30000 });
    await this.page.waitForTimeout(wait);
  }
  /** SPA içi gezinme (sayfayı yeniden yüklemez: bellek durumu korunur). */
  async nav(p, wait = 400) {
    await this.page.evaluate((u) => {
      window.history.pushState({}, '', u);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, p);
    await this.page.waitForTimeout(wait);
  }
  /** Tarayıcı saatini ms kadar ileri alır (zamanlayıcı bitişi, ertesi gün vb.). */
  async advance(ms) {
    await this.page.evaluate((d) => {
      window.__rtOffset += d;
    }, ms);
    await this.page.waitForTimeout(300);
  }
  async reload(wait = 800) {
    await this.page.reload({ waitUntil: 'networkidle' });
    await this.page.waitForTimeout(wait);
  }
  async shot(name) {
    fs.mkdirSync(SHOTS, { recursive: true });
    const f = path.join(SHOTS, `${name}.png`);
    await this.page.screenshot({ path: f }).catch(() => {});
    this.shots.push(f);
    return f;
  }
  /** Görünür metne dokun (tam eşleşme; yoksa gevşek). nth: kaçıncı eşleşme. */
  async tap(text, { nth = 0, exact = true, timeout } = {}) {
    const loc = this.page.getByText(text, { exact }).filter({ visible: true });
    await loc.nth(nth).click({ timeout });
  }
  /** i18n anahtarı ile dokun. */
  async tapKey(key, params, opts) {
    return this.tap(this.T(key, params), opts);
  }
  /** Rol=button + ad ile dokun (ad: metin ya da RegExp). */
  async btn(name, { nth = 0, exact = false } = {}) {
    await this.page.getByRole('button', { name, exact }).filter({ visible: true }).nth(nth).click();
  }
  async fill(label, value) {
    const el = typeof label === 'string' ? this.page.getByLabel(label, { exact: false }) : this.page.getByLabel(label);
    await el.first().fill(value);
  }
  /** Metin görünür mü (tam ya da kısmi)? */
  async seen(text, { exact = false, timeout = 3000 } = {}) {
    try {
      await this.page.getByText(text, { exact }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }
  async expectText(text, msg, opts) {
    if (!(await this.seen(text, opts))) {
      const b = (await this.body()).replace(/\n+/g, ' | ').slice(0, 600);
      throw new Error(`${msg || 'metin görünmedi'}: "${text}" (sayfa: ${this.path()}) -> ${b}`);
    }
  }
  async expectGone(text, msg, { exact = false, timeout = 1500 } = {}) {
    await this.page.waitForTimeout(150);
    try {
      await this.page.getByText(text, { exact }).filter({ visible: true }).first().waitFor({ state: 'hidden', timeout });
    } catch {
      throw new Error(`${msg || 'metin hâlâ görünüyor'}: "${text}"`);
    }
  }
  path() {
    return this.page.url().replace(this.base, '');
  }
  /** Kalıcı durumu (AsyncStorage = localStorage) okur. */
  async store(name) {
    const raw = await this.page.evaluate((k) => window.localStorage.getItem(k), `all2me-${name}-v1`);
    return raw ? JSON.parse(raw).state : null;
  }
  /** Çekirdek deposundan bugünkü toplam puan (olaylardan; tarayıcı saatine göre gün anahtarı). */
  async points(day) {
    const s = await this.store('core');
    const d = day ?? (await this.page.evaluate(() => {
      const x = new Date(Date.now() - 3 * 3600 * 1000);
      const p = (n) => String(n).padStart(2, '0');
      return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
    }));
    return Object.values(s.events).filter((e) => e.dayKey === d && e.userId === s.me?.id).reduce((a, e) => a + e.points, 0);
  }
  async dayKey() {
    return this.page.evaluate(() => {
      const x = new Date(Date.now() - 3 * 3600 * 1000);
      const p = (n) => String(n).padStart(2, '0');
      return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
    });
  }
  async body() {
    return this.page.evaluate(() => document.body.innerText);
  }
  async scrollWidth() {
    return this.page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
  }
  /**
   * Yatay taşan görünür öğeler: sağ kenarı görüntü alanını aşan ve yatay kaydırılabilir bir atası OLMAYAN öğeler
   * (karusel gibi bilinçli yatay kaydırma sayılmaz). Boş dizi = temiz.
   */
  async overflowOffenders() {
    return this.page.evaluate(() => {
      const vw = window.innerWidth;
      const out = [];
      const scrollerX = (el) => {
        for (let n = el.parentElement; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1) return true;
        }
        return false;
      };
      // Atalardan biri overflow:hidden ise ve kendi sağ kenarı görüntü alanı içindeyse taşma görünmez (kırpılır).
      const clipped = (el) => {
        for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (/(hidden|clip)/.test(cs.overflowX) && n.getBoundingClientRect().right <= vw + 1) return true;
        }
        return false;
      };
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 1 && !scrollerX(el) && !clipped(el)) {
          const txt = (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40);
          out.push(`${el.tagName.toLowerCase()} right=${Math.round(r.right)} "${txt}"`);
          if (out.length >= 5) break;
        }
      }
      return out;
    });
  }
  /**
   * Düşük kontrastlı görünür metinler (WCAG oranı < min). Arka plan: en yakın opak ata arka planı (gradyan/görsel yoksa).
   * Yalnız metin düğümü taşıyan yaprak öğeler değerlendirilir.
   */
  async lowContrast(min = 2.0) {
    return this.page.evaluate((min) => {
      const parse = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
        return { r, g, b, a };
      };
      const lum = ({ r, g, b }) => {
        const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const bgOf = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; // gradyan: atla
          const c = parse(cs.backgroundColor);
          if (c && c.a > 0.95) return c;
        }
        return { r: 255, g: 255, b: 255, a: 1 };
      };
      const out = [];
      const seen = new Set();
      for (const el of document.body.querySelectorAll('*')) {
        if (!el.childNodes.length) continue;
        const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        if (!own || !/[\p{L}\p{N}]/u.test(own)) continue; // yalnız emoji/simge metni: renk anlamsız
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.3) continue;
        const fg = parse(cs.color);
        const bg = bgOf(el);
        if (!fg || !bg) continue;
        const L1 = lum(fg);
        const L2 = lum(bg);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        if (ratio < min) {
          const key = own.slice(0, 30);
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(`"${key}" ${ratio.toFixed(2)} fg=${cs.color} bg=rgb(${bg.r},${bg.g},${bg.b})`);
        }
      }
      return out.slice(0, 8);
    }, min);
  }
  /** Hata yok iddiası (pageerror, konsol hatası, FATAL desenleri). */
  assertClean() {
    if (this.errors.length) throw new Error(`Sayfa/konsol hataları:\n  ${[...new Set(this.errors)].slice(0, 6).join('\n  ')}`);
  }
}

/** Ham i18n anahtarı (`ns.key`) görünür metinde mi? Bilinen ad alanı öneklerine bakar. */
export const NS = ['alarm', 'common', 'drink', 'duel', 'growth', 'inspire', 'life', 'study', 'love', 'meditate', 'mood', 'motivation', 'newtask', 'onboarding', 'planner', 'points', 'profile', 'reflection', 'routine', 'settings', 'sleep', 'soundscape', 'streak', 'tabs', 'task', 'timer', 'toast', 'tools', 'wheel', 'workout'];
export function rawKeys(text) {
  const re = new RegExp(`(?<![\\w./@-])(?:${NS.join('|')})\\.[a-z][A-Za-z0-9]*(?:\\.[A-Za-z0-9]+)*`, 'g');
  return [...new Set((text.match(re) || []).filter((m) => !/\.(com|org|net|io|app)$/i.test(m)))];
}

export async function openSession(env, opts = {}) {
  const { lang = 'tr', theme = 'light', seed = true, at, width = 390, height = 844, seedOpts = {}, extraInit = {}, storage = true } = opts;
  const now = resolveNow(at);
  const ctx = await env.browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: theme === 'dark' ? 'dark' : 'light', locale: lang === 'tr' ? 'tr-TR' : 'en-US' });
  const offset = now - Date.now();
  const sd = makeSeed({ now, lang, theme, ...seedOpts });
  const init = seed ? { ...sd.init, ...extraInit } : { 'all2me-settings-v1': JSON.stringify({ state: { lang, theme, onboarded: false, units: 'ml', notifications: true }, version: 1 }), ...extraInit };
  await ctx.addInitScript(
    ({ kv, offset, once }) => {
      // Tarayıcı saatini kaydır (zaman akmaya devam eder); window.__rtOffset ile sonradan ileri alınabilir.
      window.__rtOffset = offset;
      const RD = Date;
      // eslint-disable-next-line no-global-assign
      Date = class extends RD {
        constructor(...a) {
          if (a.length === 0) super(RD.now() + window.__rtOffset);
          else super(...a);
        }
        static now() {
          return RD.now() + window.__rtOffset;
        }
      };
      // Tohum yalnız ilk yüklemede yazılır; yenilemede kullanıcının değiştirdiği durum korunur.
      try {
        if (!window.localStorage.getItem('__rtest_seeded')) {
          for (const [k, v] of Object.entries(kv)) window.localStorage.setItem(k, v);
          window.localStorage.setItem('__rtest_seeded', '1');
        }
      } catch {}
    },
    { kv: init, offset, once: true },
  );
  const page = await ctx.newPage();
  const s = new Session(ctx, page, env.base, translator(env.dict, lang), lang, { now, today: sd.today, seed: sd });
  s.now = now;
  return s;
}

// ---------------------------------------------------------------- iddia yardımcıları
export { default as assert } from 'node:assert/strict';

// ---------------------------------------------------------------- ortak akış yardımcıları
/** Rutin ekranındaki bugünkü puan rozeti (aria-label "Bugünkü puan: N"). */
export async function dayPts(s) {
  const lab = await s.page.locator('[aria-label]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')).filter((l) => /\d/.test(l || '')));
  const re = /(?:Bugünkü puan|Points today|Today.s points)\D*(\d+)/i;
  for (const l of lab) {
    const m = l.match(re);
    if (m) return Number(m[1]);
  }
  throw new Error(`puan rozeti bulunamadı (${lab.slice(0, 5).join(' | ')})`);
}
/** Çekirdek deposundaki tamamlama sayısı (geri alınanlar silindiği için doğrudan sayı). */
export async function completionsOn(s, day) {
  const c = await s.store('core');
  return Object.values(c.completions).filter((x) => x.dayKey === (day ?? s.meta.today) && !x.undone);
}
export async function events(s) {
  return Object.values((await s.store('core')).events);
}
/** Hızlı yeni görev: /task/new ekranını doldurup kaydeder. */
export async function createTask(s, title, { kind, slot, target } = {}) {
  await s.goto('/task/new', 500);
  await s.page.getByPlaceholder(s.t('task.namePlaceholder')).fill(title);
  if (kind) await s.tap(s.t(`task.kind.${kind}`));
  if (slot) await s.tap(s.t(`task.slot.${slot}`), { nth: 0 });
  await s.btn(s.t('common.btn.save'));
  await s.page.waitForTimeout(600);
}

const DAYS = { tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
/** Haftalık şeritte verilen gün anahtarını seçer (gün kısaltmasına dokunur). */
export async function selectWeekDay(s, key) {
  await s.tap(DAYS[s.lang][weekdayOf(key)], { exact: true });
  await s.page.waitForTimeout(300);
}

/** Verilen koşula uyan ilk görünür role=button öğesine dokunur (ör. adsız ikon düğmesi). pred(box, label) */
export async function tapButtonWhere(s, pred) {
  const btns = s.page.getByRole('button').filter({ visible: true });
  const n = await btns.count();
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i);
    const box = await b.boundingBox();
    if (!box) continue;
    const label = (await b.getAttribute('aria-label')) || (await b.innerText().catch(() => ''));
    if (pred(box, label)) {
      await b.click();
      return true;
    }
  }
  throw new Error('koşula uyan düğme yok');
}

/**
 * Erişilebilir adı olmayan etkileşimli öğeler: role=button / checkbox / switch, <button>, <input>, <textarea>.
 * Ad = aria-label | aria-labelledby | görünür metin | title | (input için) placeholder / ilişkili label.
 */
export async function nameless(s) {
  return s.page.evaluate(() => {
    const out = [];
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const sel = '[role=button],[role=checkbox],[role=switch],button,input,textarea,a[href]';
    for (const el of document.querySelectorAll(sel)) {
      if (!vis(el)) continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      const lbl = el.getAttribute('aria-label') || '';
      const lby = el.getAttribute('aria-labelledby');
      const txt = (el.innerText || '').trim();
      const ph = el.getAttribute('placeholder') || '';
      const title = el.getAttribute('title') || '';
      const assoc = el.id && document.querySelector(`label[for="${el.id}"]`);
      const emojiOnly = txt && !/[\p{L}\p{N}]/u.test(txt);
      if (lbl || lby || title || assoc) continue;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (ph) continue;
        out.push(`${el.tagName.toLowerCase()}[${el.type || ''}] adsız`);
        continue;
      }
      if (el.getAttribute('role') === 'switch' || (el.tagName === 'INPUT' && el.type === 'checkbox')) { out.push('switch adsız'); continue; }
      if (!txt || emojiOnly) {
        const r = el.getBoundingClientRect();
        out.push(`${el.getAttribute('role') || el.tagName.toLowerCase()} adsız @${Math.round(r.x)},${Math.round(r.y)} ${emojiOnly ? '(yalnız emoji "' + txt + '")' : ''}`);
      }
    }
    return out;
  });
}
