#!/usr/bin/env node
/**
 * Telifsiz ortam seslerini sentezler (bağımlılıksız Node). Çıktı: assets/sounds/*.wav
 *   node scripts/gen-sounds.mjs          # üret
 *   node scripts/gen-sounds.mjs --check  # üretilmiş dosyaları sayısal olarak doğrula
 *
 * Mono, 22.05 kHz, 16-bit PCM WAV; her biri 10 sn; deterministik tohumlu PRNG (aynı çıktı her çalıştırmada).
 * Kusursuz döngü: gürültü/rastgele bileşenler N+X örnek üretilir, kuyruk (X örnek) başa eş güçlü çapraz geçişle
 * karıştırılır; tonal / zarf bileşenleri ise N örneğe tam sayı periyotla yazıldığından kendiliğinden döngülüdür.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const SECONDS = 10;
const N = SR * SECONDS;
const X = SR * 1; // çapraz geçiş uzunluğu (1 sn)
const L = N + X;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

// ---------- yardımcılar ----------
function rng(seed) {
  // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};
const TAU = 2 * Math.PI;
const alphaLP = (fc) => {
  const rc = 1 / (TAU * fc);
  const dt = 1 / SR;
  return dt / (rc + dt);
};
function lowpass(x, fc) {
  const a = alphaLP(fc);
  const y = new Float32Array(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    s += a * (x[i] - s);
    y[i] = s;
  }
  return y;
}
function highpass(x, fc) {
  const lp = lowpass(x, fc);
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] - lp[i];
  return y;
}
const white = (r, n) => {
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) y[i] = gauss(r);
  return y;
};
function pink(r, n) {
  // Paul Kellet'in ekonomik pembe gürültü süzgeci
  const y = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const w = r() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    y[i] = b0 + b1 + b2 + w * 0.1848;
  }
  return y;
}
function brown(r, n) {
  // sızıntılı integral (DC birikmesin)
  const y = new Float32Array(n);
  let s = 0;
  for (let i = 0; i < n; i++) {
    s = 0.998 * s + (r() * 2 - 1) * 0.1;
    y[i] = s;
  }
  return y;
}
const rms = (x) => {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
};
function scaleToRms(x, target) {
  const k = target / (rms(x) || 1);
  for (let i = 0; i < x.length; i++) x[i] *= k;
  return x;
}
/** Uzun akışı (L örnek) kusursuz döngülü N örneğe indirger (eş güçlü çapraz geçiş). */
function loopify(x) {
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = x[i];
  for (let i = 0; i < X; i++) {
    const p = (i + 0.5) / X; // 0..1
    const wHead = Math.sin((p * Math.PI) / 2); // artan
    const wTail = Math.cos((p * Math.PI) / 2); // azalan
    out[i] = x[i] * wHead + x[N + i] * wTail;
  }
  return out;
}
/** t ∈ [0,N) için tam periyotlu zarf: k = N süresindeki döngü sayısı */
const cyc = (k, phase = 0) => (i) => Math.sin(TAU * (k * i / N + phase));

// ---------- sesler ----------
const SOUNDS = {
  rain(r) {
    // yüksek geçiren gürültü + rastgele damla tıkları + hafif alçak yatak
    const bed = scaleToRms(highpass(white(r, L), 900), 0.1);
    const low = scaleToRms(lowpass(pink(r, L), 500), 0.035);
    const drops = new Float32Array(L);
    const density = 55; // damla/sn
    const count = Math.round((L / SR) * density);
    for (let d = 0; d < count; d++) {
      const start = Math.floor(r() * (L - 400));
      const f = 1500 + r() * 3000;
      const tau = 0.0008 + r() * 0.0025;
      const amp = 0.03 + r() * r() * 0.12;
      const len = Math.min(Math.floor(SR * tau * 7), L - start);
      for (let j = 0; j < len; j++) {
        const t = j / SR;
        drops[start + j] += amp * Math.exp(-t / tau) * Math.sin(TAU * f * t);
      }
    }
    const mix = new Float32Array(L);
    for (let i = 0; i < L; i++) mix[i] = bed[i] + low[i] + drops[i];
    return { stream: mix, level: 0.16 };
  },
  ocean(r) {
    // yavaş genlik zarflı kahverengi gürültü + köpük (zarfla birlikte yükselen yüksek frekans)
    const base = scaleToRms(lowpass(brown(r, L), 900), 1);
    const foam = scaleToRms(highpass(lowpass(white(r, L), 4000), 700), 1);
    // zarf periyodik olmalı değil (stream çapraz geçişli) ama dalga hissi için N içinde 2 tam döngü
    const e1 = cyc(2, 0.1);
    const e2 = cyc(3, 0.37);
    const mix = new Float32Array(L);
    for (let i = 0; i < L; i++) {
      const w = 0.5 + 0.5 * (0.75 * e1(i) + 0.25 * e2(i));
      const env = 0.18 + 0.82 * Math.pow(w, 1.6);
      mix[i] = base[i] * (0.35 + 0.65 * env) + foam[i] * 0.22 * Math.pow(env, 2.5);
    }
    return { stream: mix, level: 0.2 };
  },
  white(r) {
    return { stream: white(r, L), level: 0.12 };
  },
  pink(r) {
    return { stream: pink(r, L), level: 0.16 };
  },
  brown(r) {
    return { stream: brown(r, L), level: 0.22 };
  },
  fan(r) {
    // alçak geçiren gürültü + 50 Hz tabanlı hafif uğultu (tam periyotlu → kendiliğinden döngülü) + yavaş titreşim
    const air = scaleToRms(lowpass(white(r, L), 700), 1);
    const periodic = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      const wob = 1 + 0.08 * Math.sin(TAU * 0.5 * t); // 5 tam döngü
      periodic[i] = wob * (0.55 * Math.sin(TAU * 100 * t) + 0.28 * Math.sin(TAU * 200 * t + 0.6) + 0.12 * Math.sin(TAU * 300 * t + 1.1));
    }
    return { stream: air, periodic, periodicGain: 0.55, level: 0.16 };
  },
  stream(r) {
    // dere: bant geçiren akış + kısa yükselen "kabarcık" cıvıltıları
    const flow = scaleToRms(highpass(lowpass(white(r, L), 3500), 350), 0.08);
    const bubbles = new Float32Array(L);
    const count = Math.round((L / SR) * 55);
    for (let d = 0; d < count; d++) {
      const start = Math.floor(r() * (L - 2500));
      const f0 = 500 + r() * 1200;
      const sweep = 1.5 + r() * 2.5; // frekans çarpanı
      const dur = 0.02 + r() * 0.05;
      const amp = 0.02 + r() * 0.1;
      const len = Math.min(Math.floor(SR * dur), L - start);
      let ph = 0;
      for (let j = 0; j < len; j++) {
        const p = j / len;
        const f = f0 * (1 + (sweep - 1) * p);
        ph += (TAU * f) / SR;
        bubbles[start + j] += amp * Math.sin(Math.PI * p) * Math.sin(ph);
      }
    }
    const mix = new Float32Array(L);
    for (let i = 0; i < L; i++) mix[i] = flow[i] + bubbles[i];
    return { stream: mix, level: 0.16 };
  },
  wind(r) {
    // rüzgâr: alçak-orta bantlı gürültü, yavaş ve düzensiz esinti zarfı
    const body = scaleToRms(lowpass(highpass(white(r, L), 120), 900), 1);
    const whistle = scaleToRms(highpass(lowpass(white(r, L), 1800), 600), 1);
    const g1 = cyc(1, 0.2);
    const g2 = cyc(3, 0.55);
    const g3 = cyc(5, 0.9);
    const mix = new Float32Array(L);
    for (let i = 0; i < L; i++) {
      const w = 0.5 + 0.5 * (0.6 * g1(i) + 0.3 * g2(i) + 0.1 * g3(i));
      const env = 0.2 + 0.8 * w * w;
      mix[i] = body[i] * env + whistle[i] * 0.25 * env * env;
    }
    return { stream: mix, level: 0.17 };
  },
};

function render(name, seed) {
  const r = rng(seed);
  const g = SOUNDS[name](r);
  const loop = loopify(g.stream);
  scaleToRms(loop, g.level);
  if (g.periodic) {
    const target = g.periodicGain * g.level; // tonal bileşenin RMS'i, gürültü RMS'ine oranla
    const prms = rms(g.periodic);
    for (let i = 0; i < N; i++) loop[i] += (g.periodic[i] / prms) * target;
  }
  // DC'yi al, tepe değeri ≤ 0.9'a sığdır
  let mean = 0;
  for (let i = 0; i < N; i++) mean += loop[i];
  mean /= N;
  let peak = 0;
  for (let i = 0; i < N; i++) {
    loop[i] -= mean;
    peak = Math.max(peak, Math.abs(loop[i]));
  }
  if (peak > 0.9) for (let i = 0; i < N; i++) loop[i] *= 0.9 / peak;
  return loop;
}

function wavBuffer(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}

// ---------- doğrulama ----------
function readWav(file) {
  const b = fs.readFileSync(file);
  const ok = b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WAVE' && b.toString('ascii', 12, 16) === 'fmt ' && b.toString('ascii', 36, 40) === 'data';
  const fmt = b.readUInt16LE(20), ch = b.readUInt16LE(22), sr = b.readUInt32LE(24), bits = b.readUInt16LE(34);
  const dataLen = b.readUInt32LE(40);
  const n = dataLen / 2;
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = b.readInt16LE(44 + i * 2) / 32768;
  const headerOk = ok && fmt === 1 && ch === 1 && bits === 16 && b.readUInt32LE(4) === b.length - 8 && dataLen === b.length - 44;
  return { size: b.length, headerOk, sr, ch, bits, n, s };
}

function check() {
  let total = 0;
  let allOk = true;
  const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.wav')).sort();
  console.log('dosya        boyut(KB)  sn     başlık  tepe   RMS    |s[0]-s[N-1]|  ort|Δ|   oran   RMS(son50ms)/RMS(ilk50ms)');
  for (const f of files) {
    const w = readWav(path.join(OUT, f));
    total += w.size;
    let peak = 0, dsum = 0;
    for (let i = 0; i < w.n; i++) {
      peak = Math.max(peak, Math.abs(w.s[i]));
      if (i > 0) dsum += Math.abs(w.s[i] - w.s[i - 1]);
    }
    const meanD = dsum / (w.n - 1);
    const seam = Math.abs(w.s[0] - w.s[w.n - 1]);
    const win = Math.round(SR * 0.05);
    const head = rms(w.s.subarray(0, win));
    const tail = rms(w.s.subarray(w.n - win));
    // ek yerini iç bölgedeki en büyük komşu farkıyla da kıyasla
    let maxD = 0;
    for (let i = 1; i < w.n; i++) maxD = Math.max(maxD, Math.abs(w.s[i] - w.s[i - 1]));
    const sec = w.n / w.sr;
    const good = w.headerOk && w.sr === SR && sec >= 8 && sec <= 12 && w.size <= 550 * 1024 && seam <= maxD && Math.abs(Math.log(tail / head)) < 0.5;
    if (!good) allOk = false;
    console.log(
      `${f.padEnd(12)} ${(w.size / 1024).toFixed(0).padStart(8)}  ${sec.toFixed(2)}  ${w.headerOk ? 'OK    ' : 'HATA  '}  ${peak.toFixed(2)}  ${rms(w.s).toFixed(3)}  ${seam.toFixed(4)}          ${meanD.toFixed(4)}   ${(seam / meanD).toFixed(2)}x   ${(tail / head).toFixed(2)}   max|Δ|=${maxD.toFixed(3)} ${good ? '' : '<-- SORUN'}`,
    );
  }
  console.log(`toplam: ${(total / 1024 / 1024).toFixed(2)} MB (${files.length} dosya)  ${total <= 4 * 1024 * 1024 ? 'OK (<=4 MB)' : 'FAZLA'}`);
  if (!allOk) process.exitCode = 1;
}

// ---------- ana ----------
if (process.argv.includes('--check')) {
  check();
} else {
  fs.mkdirSync(OUT, { recursive: true });
  const names = Object.keys(SOUNDS);
  names.forEach((name, idx) => {
    const samples = render(name, 1000 + idx * 7919);
    fs.writeFileSync(path.join(OUT, `${name}.wav`), wavBuffer(samples));
    console.log(`yazıldı: assets/sounds/${name}.wav`);
  });
  check();
}
