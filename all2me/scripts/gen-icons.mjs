#!/usr/bin/env node
/**
 * Uygulama ikonu, uyarlanabilir Android ikonu, açılış (splash) görseli ve favicon üretir.
 * Kaynak: aşağıdaki özgün SVG'ler (maskot "Puf" bulutu + All2Me). Playwright/Chromium ile PNG'ye çizer.
 *   node scripts/gen-icons.mjs
 * Playwright ön kuruludur (global); `playwright install` gerekmez.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try {
    return req('playwright');
  } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
}

// ---- Puf (120x120 görünüm kutusu; src/components/Mascot.tsx ile aynı karakter, neşeli hâli) ----
const INK = '#2B2340';
const puf = ({ body = '#FFFFFF', shade = '#D9CCFF', star = true } = {}) => `
  ${star ? `<path d="M60 34 Q57 26 60 20" stroke="${shade}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M60 6 L63.5 13.5 L71.5 14.5 L65.5 20 L67 28 L60 24 L53 28 L54.5 20 L48.5 14.5 L56.5 13.5 Z" fill="#FFD34E" stroke="#F2B705" stroke-width="1.5" stroke-linejoin="round"/>` : ''}
  <g fill="${body}">
    <ellipse cx="18" cy="50" rx="8" ry="12" transform="rotate(-30 18 50)"/>
    <ellipse cx="102" cy="50" rx="8" ry="12" transform="rotate(30 102 50)"/>
    <circle cx="38" cy="66" r="24"/><circle cx="60" cy="52" r="28"/><circle cx="83" cy="66" r="23"/>
    <ellipse cx="60" cy="80" rx="42" ry="24"/>
  </g>
  <ellipse cx="60" cy="98" rx="34" ry="6" fill="${shade}" opacity="0.55"/>
  <ellipse cx="39" cy="75" rx="6.5" ry="4" fill="#FF9DCB" opacity="0.8"/>
  <ellipse cx="81" cy="75" rx="6.5" ry="4" fill="#FF9DCB" opacity="0.8"/>
  <circle cx="48" cy="65" r="5.5" fill="${INK}"/><circle cx="72" cy="65" r="5.5" fill="${INK}"/>
  <circle cx="49.8" cy="63.2" r="1.7" fill="#fff"/><circle cx="73.8" cy="63.2" r="1.7" fill="#fff"/>
  <path d="M52 75 Q60 88 68 75 Z" fill="#E2557B" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;

/** Yalnız siluet (Android tek renkli ikon): bulut + yıldız, tek renk */
const pufMono = () => `
  <g fill="#000">
    <path d="M60 6 L63.5 13.5 L71.5 14.5 L65.5 20 L67 28 L60 24 L53 28 L54.5 20 L48.5 14.5 L56.5 13.5 Z"/>
    <ellipse cx="18" cy="50" rx="8" ry="12" transform="rotate(-30 18 50)"/>
    <ellipse cx="102" cy="50" rx="8" ry="12" transform="rotate(30 102 50)"/>
    <circle cx="38" cy="66" r="24"/><circle cx="60" cy="52" r="28"/><circle cx="83" cy="66" r="23"/>
    <ellipse cx="60" cy="80" rx="42" ry="24"/>
  </g>
  <g fill="#fff">
    <circle cx="48" cy="65" r="5.5"/><circle cx="72" cy="65" r="5.5"/>
    <path d="M52 75 Q60 88 68 75 Z"/>
  </g>`;

const BG = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8B6CFF"/><stop offset="0.55" stop-color="#7C5CFC"/><stop offset="1" stop-color="#FF7AE0"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.42" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
</defs>`;

/** 1024 kare: tam dolu zemin (iOS saydamlık kabul etmez) */
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${BG}
  <rect width="1024" height="1024" fill="url(#g)"/>
  <circle cx="512" cy="470" r="420" fill="url(#glow)"/>
  <g transform="translate(152 150) scale(6)">${puf()}</g>
</svg>`;

/** Android uyarlanabilir ön plan: güvenli alan (ortadaki %66) içinde, saydam zemin */
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(272 262) scale(4)">${puf()}</g>
</svg>`;
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${BG}
  <rect width="1024" height="1024" fill="url(#g)"/><circle cx="512" cy="480" r="400" fill="url(#glow)"/>
</svg>`;
const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(272 262) scale(4)">${pufMono()}</g>
</svg>`;

/** Açılış: Puf + yazı, saydam zemin (app.json backgroundColor üzerinde çizilir); koyu tema için açık yazılı eşi */
const splashSvg = (ink) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(212 90) scale(5)">${puf({ body: '#D9CCFF', shade: '#C3B1FF' })}</g>
  <text x="512" y="900" text-anchor="middle" font-family="Arial Rounded MT Bold, Nunito, Arial, Helvetica, sans-serif" font-size="150" font-weight="800" fill="${ink}" letter-spacing="-2">All<tspan fill="#7C5CFC">2</tspan>Me</text>
</svg>`;

/** Favicon 48: sadeleştirilmiş (yıldızsız) yüz, yuvarlak köşeli zemin */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 120 120">${BG}
  <rect width="120" height="120" rx="28" fill="url(#g)"/>
  <g transform="translate(6 2) scale(0.9)">${puf({ star: false })}</g>
</svg>`;

const jobs = [
  { file: 'icon.png', svg: iconSvg, size: 1024, transparent: false },
  { file: 'android-icon-foreground.png', svg: fgSvg, size: 1024, transparent: true },
  { file: 'android-icon-background.png', svg: bgSvg, size: 1024, transparent: false },
  { file: 'android-icon-monochrome.png', svg: monoSvg, size: 1024, transparent: true },
  { file: 'splash-icon.png', svg: splashSvg('#14171A'), size: 1024, transparent: true },
  { file: 'splash-icon-dark.png', svg: splashSvg('#F5F5FA'), size: 1024, transparent: true },
  { file: 'favicon.png', svg: faviconSvg, size: 48, transparent: true },
];

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const j of jobs) {
  await page.setViewportSize({ width: j.size, height: j.size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${j.svg}</body></html>`);
  await page.locator('svg').screenshot({ path: path.join(OUT, j.file), omitBackground: j.transparent });
  console.log(`🎨 assets/${j.file} (${j.size}px)`);
}
await browser.close();
