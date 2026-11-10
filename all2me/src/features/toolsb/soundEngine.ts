/**
 * Ses ortamı motoru — oynatıcılar MODÜL düzeyinde tutulur; ekrandan çıkınca çalmaya devam eder.
 * Web önizlemede tarayıcı otomatik çalmayı engelleyebilir: tüm çağrılar try/catch içinde, çökmez.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { MAX_MIX, SOUNDS } from '../../data/sounds';
import { useSoundscape } from '../../store/slices/soundscape';

const players = new Map<string, AudioPlayer>();
let order: string[] = []; // en eski -> en yeni
let sleepAt = 0;
let sleepTimer: ReturnType<typeof setTimeout> | null = null;
let modeSet = false;
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

const masterVolume = () => useSoundscape.getState().volume;

async function ensureMode() {
  if (modeSet) return;
  modeSet = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' });
  } catch {}
}

function stopOne(id: string) {
  const p = players.get(id);
  players.delete(id);
  order = order.filter((x) => x !== id);
  if (!p) return;
  try {
    p.pause();
  } catch {}
  try {
    p.remove();
  } catch {}
}

export function isPlaying(id: string) {
  return players.has(id);
}
export const activeIds = () => [...order];

export function toggleSound(id: string): void {
  if (players.has(id)) {
    stopOne(id);
    if (players.size === 0) clearSleep();
    emit();
    return;
  }
  const def = SOUNDS.find((s) => s.id === id);
  if (!def) return;
  while (order.length >= MAX_MIX) stopOne(order[0]);
  try {
    void ensureMode();
    const p = createAudioPlayer(def.source as any);
    p.loop = true;
    p.volume = masterVolume();
    players.set(id, p);
    order.push(id);
    try {
      const r: any = p.play();
      if (r && typeof r.catch === 'function') r.catch(() => {});
    } catch {}
  } catch {
    // oynatıcı kurulamadı (ör. web'de desteklenmiyor): sessizce yoksay
  }
  emit();
}

export function applyVolume(v: number) {
  players.forEach((p) => {
    try {
      p.volume = v;
    } catch {}
  });
}

export function stopAll() {
  [...players.keys()].forEach(stopOne);
  clearSleep();
  emit();
}

function clearSleep() {
  if (sleepTimer) clearTimeout(sleepTimer);
  sleepTimer = null;
  sleepAt = 0;
}

/** minutes: 0 = kapat */
export function setSleepTimer(minutes: number) {
  clearSleep();
  if (minutes > 0) {
    sleepAt = Date.now() + minutes * 60000;
    sleepTimer = setTimeout(() => stopAll(), minutes * 60000);
  }
  emit();
}
export const sleepRemainingMs = () => (sleepAt ? Math.max(0, sleepAt - Date.now()) : 0);

/** Motor durumuna abone olur (çalan sesler, uyku zamanlayıcısı); saniyede bir de tazeler. */
export function useSoundEngine() {
  const [, setN] = useState(0);
  useEffect(() => {
    const l = () => setN((n) => n + 1);
    listeners.add(l);
    const id = setInterval(l, 1000);
    return () => {
      listeners.delete(l);
      clearInterval(id);
    };
  }, []);
  return { version, active: activeIds(), sleepMs: sleepRemainingMs() };
}
