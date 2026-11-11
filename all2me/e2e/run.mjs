#!/usr/bin/env node
/**
 * Tüm e2e testlerini çalıştırır (düz Node + node:assert; @playwright/test yok).
 *
 *   npx expo export --platform web --output-dir dist-rtest   # yoksa betik kendisi üretir (--build ile zorla)
 *   node e2e/run.mjs [--dist dist-rtest] [--jobs 3] [--build] [--keep-going] [filtre ...]
 *
 * Filtre: test kimliği ya da dosya adı parçası (ör. `node e2e/run.mjs tasks F05 smoke`).
 * Ekran görüntüleri: shots/rtest/ . Sonuç özeti: shots/rtest/results.json .
 * Çıkış kodu: tüm testler geçtiyse 0, aksi halde 1.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDict, loadPlaywright, openSession, ROOT, SHOTS, startServer } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = { dist: 'dist-rtest', jobs: 3, build: false, filters: [], timeout: 90000 };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dist') opt.dist = argv[++i];
  else if (a === '--jobs') opt.jobs = Number(argv[++i]);
  else if (a === '--build') opt.build = true;
  else if (a === '--timeout') opt.timeout = Number(argv[++i]);
  else opt.filters.push(a.toLowerCase());
}

if (opt.build || !fs.existsSync(path.join(ROOT, opt.dist, 'index.html'))) {
  console.log(`> expo export (${opt.dist}) ...`);
  execSync(`npx expo export --platform web --output-dir ${opt.dist}`, { cwd: ROOT, stdio: 'inherit' });
}

const files = fs.readdirSync(path.dirname(new URL(import.meta.url).pathname)).filter((f) => f.endsWith('.test.mjs')).sort();
const all = [];
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname), f)).href);
  for (const t of mod.default) all.push({ ...t, file: f.replace('.test.mjs', '') });
}
const selected = all.filter((t) => opt.filters.length === 0 || opt.filters.some((q) => t.id.toLowerCase().includes(q) || t.file.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)));
if (!selected.length) {
  console.error('Eşleşen test yok.');
  process.exit(2);
}

fs.mkdirSync(SHOTS, { recursive: true });
const { chromium } = loadPlaywright();
const server = await startServer(opt.dist);
const browser = await chromium.launch();
const env = { browser, base: server.base, dict: await loadDict() };

const results = [];
let idx = 0;
async function runOne(t) {
  const t0 = Date.now();
  let s;
  let status = 'pass';
  let err = null;
  try {
    s = await openSession(env, t.opts || {});
    s.page.setDefaultTimeout(8000);
    await Promise.race([
      (async () => {
        await t.run(s, env);
        if (!t.allowErrors) s.assertClean();
      })(),
      new Promise((_, rej) => setTimeout(() => rej(new Error(`zaman aşımı (${opt.timeout} ms)`)), opt.timeout)),
    ]);
  } catch (e) {
    status = 'fail';
    err = e;
    if (s) await s.shot(`FAIL-${t.id}`);
  } finally {
    if (s) await s.ctx.close().catch(() => {});
  }
  const ms = Date.now() - t0;
  const r = { id: t.id, name: t.name, file: t.file, status, ms, error: err ? String(err.message || err).split('\n').slice(0, 8).join('\n') : null, warnings: s ? [...new Set(s.warnings)].slice(0, 5) : [], knownBug: t.knownBug || null };
  results.push(r);
  console.log(`${status === 'pass' ? 'OK  ' : 'FAIL'} ${t.id.padEnd(14)} ${t.name} (${ms} ms)${err ? `\n       ${r.error.replace(/\n/g, '\n       ')}` : ''}`);
}
async function worker() {
  while (idx < selected.length) await runOne(selected[idx++]);
}
await Promise.all(Array.from({ length: Math.max(1, opt.jobs) }, worker));
await browser.close();
server.close();

results.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.status === 'fail');
console.log(`\n=== ${results.length} test: ${results.length - failed.length} geçti, ${failed.length} kaldı ===`);
for (const f of failed) console.log(` - ${f.id} ${f.name}${f.knownBug ? `  [bilinen: ${f.knownBug}]` : ''}`);
const warn = new Set(results.flatMap((r) => r.warnings));
if (warn.size) console.log(`\nKonsol uyarıları (bilgi, ${warn.size} tür):\n  ${[...warn].slice(0, 12).join('\n  ')}`);
process.exit(failed.length ? 1 : 0);
