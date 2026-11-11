/**
 * Web'de çok sekme (BUG-007): bir sekme kalıcı durumu yazınca diğer sekmeler `storage` olayıyla aynı
 * store'u depodan yeniden yükler. Böylece eski bellek durumu yeni yazımı ezmez (son yazan kazanır sorunu).
 * Yerel uygulamada (tek süreç) etkisizdir.
 */
import { Platform } from 'react-native';
import { useCore } from '../store/core';
import { SLICES } from '../store/resetAll';
import { useSettings } from '../store/settings';

type Persisted = { persist?: { getOptions: () => { name?: string }; rehydrate: () => Promise<void> | void } };

let installed = false;

export function installTabSync(): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || installed) return () => {};
  installed = true;
  const stores = [useCore, useSettings, ...SLICES] as unknown as Persisted[];
  const byKey = new Map<string, Persisted>();
  for (const s of stores) {
    const name = s.persist?.getOptions().name;
    if (name) byKey.set(name, s);
  }
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.storageArea !== window.localStorage) return;
    const s = byKey.get(e.key);
    if (s?.persist) void s.persist.rehydrate();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('storage', onStorage);
    installed = false;
  };
}
