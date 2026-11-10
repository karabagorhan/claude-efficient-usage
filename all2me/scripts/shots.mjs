#!/usr/bin/env node
/**
 * Web önizleme ekran görüntüleri.
 *   npx expo export --platform web            # önce dist/ üret
 *   node scripts/shots.mjs [--seed] [--lang tr|en] [--theme light|dark] [--out shots] [--wait 1200] <rota>...
 * Rota biçimi: "/tools/drink" ya da "ad=/tools/drink" (çıktı shots/<ad>.png). Rota yoksa varsayılan liste.
 * --seed : localStorage'a demo durum yazar (profil, görevler, onboarded=true).
 * Playwright ön kuruludur (global); `playwright install` ÇALIŞTIRMA.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- argümanlar ----
const argv = process.argv.slice(2);
const opt = { seed: false, lang: null, theme: null, out: 'shots', dist: 'dist', wait: 1200, routes: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--seed') opt.seed = true;
  else if (a === '--lang') opt.lang = argv[++i];
  else if (a === '--theme') opt.theme = argv[++i];
  else if (a === '--out') opt.out = argv[++i];
  else if (a === '--dist') opt.dist = argv[++i];
  else if (a === '--wait') opt.wait = Number(argv[++i]);
  else opt.routes.push(a);
}
if (opt.routes.length === 0) opt.routes = ['routine=/', 'tools=/tools', 'wheel=/wheel'];
const routes = opt.routes.map((r) => {
  const [name, p] = r.includes('=') ? r.split('=') : [r.replace(/^\//, '').replace(/[/[\]]/g, '_') || 'root', r];
  return { name, path: p };
});

// ---- playwright ----
function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try {
    return req('playwright');
  } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
}
const { chromium } = loadPlaywright();

// ---- statik sunucu (SPA fallback) ----
const DIST = path.resolve(ROOT, opt.dist);
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`dist bulunamadı: ${DIST}. Önce: npx expo export --platform web`);
  process.exit(1);
}
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.join(DIST, url);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// ---- demo durum ----
function seedState() {
  const now = Date.now();
  const d = new Date(now - 3 * 3600 * 1000); // gün sınırı 03:00
  const pad = (n) => String(n).padStart(2, '0');
  const key = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const today = key(d);
  const daysAgo = (n) => key(new Date(d.getTime() - n * 86400000));
  const created = new Date(now - 10 * 86400000).toISOString();
  const me = { id: 'seed-me', name: opt.lang === 'en' ? 'Alex' : 'Deniz', emoji: '🌟', color: '#7C5CFC', _u: now };
  const H = (id, title, icon, slot, pastel, extra = {}) => ({
    id, ownerId: me.id, title, icon, slot, pastel, difficulty: 'easy', kind: 'check', schedule: { days: [] },
    isPrivate: false, together: false, createdAt: created, archived: false, _u: now, ...extra,
  });
  const en = opt.lang === 'en';
  const habits = [
    H('s1', en ? 'Make the bed' : 'Yatağı topla', '🛏️', 'morning', 'blue'),
    H('s2', en ? 'Eat breakfast' : 'Kahvaltı yap', '🍳', 'morning', 'green'),
    H('s3', en ? 'Drink water' : 'Su iç', '💧', 'anytime', 'mint', { kind: 'counter', target: 8, link: 'drink' }),
    H('s4', en ? 'Read 10 pages' : '10 sayfa oku', '📖', 'evening', 'purple', { difficulty: 'medium' }),
    H('s5', en ? 'Tidy the desk' : 'Masayı topla', '🧹', 'afternoon', 'peach'),
  ];
  const completions = {};
  const events = {};
  const done = [['s1', today], ['s1', daysAgo(1)], ['s2', daysAgo(1)], ['s1', daysAgo(2)]];
  for (const [h, day] of done) {
    const id = `c:${h}:${day}`;
    const at = new Date(`${day}T09:00:00`).toISOString();
    completions[id] = { id, habitId: h, userId: me.id, dayKey: day, completedAt: at, points: 10, base: 10, multiplier: 1, earlyBonus: 0, _u: now };
    events[`ev:${id}`] = { id: `ev:${id}`, userId: me.id, dayKey: day, type: 'completion', points: 10, refId: id, createdAt: at, label: habits.find((x) => x.id === h).title, _u: now };
  }
  return {
    core: {
      state: {
        me, partner: null, pairId: null, pairCode: null, startedAt: created,
        habits: Object.fromEntries(habits.map((h) => [h.id, h])), completions, events, nudges: {},
        // tohum verisinin hak ettiği rozetler önceden verilir ki açılışta toast ekranı örtmesin
        badges: Object.fromEntries(['first', 'streak3'].map((b) => [`${me.id}:${b}`, { id: `${me.id}:${b}`, userId: me.id, badgeId: b, at: created, _u: now }])),
        progress: { [`s3|${today}`]: 3 }, activity: {}, backfillUsed: {}, dirty: {}, cursor: null, syncedOnce: false, seenNudges: {},
      },
      version: 1,
    },
  };
}

const init = {};
if (opt.seed) init['all2me-core-v1'] = JSON.stringify(seedState().core);
if (opt.seed || opt.lang || opt.theme) {
  const settings = { units: 'ml', notifications: true, onboarded: opt.seed, theme: opt.theme || 'light' };
  if (opt.lang) settings.lang = opt.lang;
  init['all2me-settings-v1'] = JSON.stringify({ state: settings, version: 1 });
}

// ---- çekim ----
const outDir = path.resolve(ROOT, opt.out);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: opt.theme === 'dark' ? 'dark' : 'light' });
await context.addInitScript((kv) => {
  try {
    for (const [k, v] of Object.entries(kv)) window.localStorage.setItem(k, v);
  } catch {}
}, init);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
});
let failed = 0;
for (const r of routes) {
  try {
    await page.goto(base + r.path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(opt.wait);
    const file = path.join(outDir, `${r.name}.png`);
    await page.screenshot({ path: file });
    console.log(`📸 ${r.path} -> ${path.relative(ROOT, file)} (url: ${page.url().replace(base, '')})`);
  } catch (e) {
    failed++;
    console.error(`✗ ${r.path}: ${e.message}`);
  }
}
await browser.close();
server.close();
if (errors.length) {
  console.log(`\nKonsol uyarı/hataları (${errors.length}):`);
  for (const e of [...new Set(errors)].slice(0, 30)) console.log('  ' + e);
}
process.exit(failed ? 1 : 0);
