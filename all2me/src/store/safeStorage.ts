/**
 * Kalıcı durum (zustand persist) için dayanıklı depolama yardımcıları.
 *
 * - `safeJSONStorage()`: AsyncStorage'dan okunan değer bozuk JSON ise (ya da beklenen `{state}` biçiminde
 *   değilse) dilim ÇÖKMEZ: konsola uyarı yazılır, ham değer `<anahtar>-corrupt` anahtarına yedeklenir ve
 *   varsayılan durumla devam edilir. Yazma/silme hataları da yutulur (uyarı).
 * - `safeMerge`: kalıcı alanlar varsayılanla tür olarak uyuşmuyorsa (ör. nesne beklenirken dizi/null/metin)
 *   o alan atlanır ve varsayılan kalır. İşlevler hiçbir zaman ezilmez.
 *
 * Kullanım: `persist(..., { name, storage: safeJSONStorage(), merge: safeMerge, ... })`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

const warn = (msg: string, e?: unknown) => {
  try {
    console.warn(`[all2me] ${msg}`, e instanceof Error ? e.message : (e ?? ''));
  } catch {}
};

/** Ham metni ayrıştırır; bozuksa null (saf; test edilir). */
export function parseStored<S>(raw: string | null): { ok: true; value: StorageValue<S> | null } | { ok: false } {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  try {
    const v = JSON.parse(raw);
    if (v === null) return { ok: true, value: null };
    if (typeof v !== 'object' || Array.isArray(v) || typeof v.state !== 'object' || v.state === null || Array.isArray(v.state)) return { ok: false };
    return { ok: true, value: v as StorageValue<S> };
  } catch {
    return { ok: false };
  }
}

export function safeJSONStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (name) => {
      let raw: string | null = null;
      try {
        raw = await AsyncStorage.getItem(name);
      } catch (e) {
        warn(`depolama okunamadı (${name}); varsayılanla devam`, e);
        return null;
      }
      const r = parseStored<S>(raw);
      if (r.ok) return r.value;
      warn(`bozuk kayıt yok sayıldı (${name}); ham değer ${name}-corrupt anahtarına yedeklendi`);
      try {
        if (raw) await AsyncStorage.setItem(`${name}-corrupt`, raw);
      } catch {}
      return null;
    },
    setItem: async (name, value) => {
      try {
        await AsyncStorage.setItem(name, JSON.stringify(value));
      } catch (e) {
        warn(`depolamaya yazılamadı (${name})`, e);
      }
    },
    removeItem: async (name) => {
      try {
        await AsyncStorage.removeItem(name);
      } catch (e) {
        warn(`depolamadan silinemedi (${name})`, e);
      }
    },
  };
}

const kindOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/** Kalıcı durumu geçerli (varsayılan) durumun üstüne güvenle birleştirir (saf; test edilir). */
export function safeMerge<T>(persisted: unknown, current: T): T {
  if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) return current;
  const out: any = { ...(current as any) };
  for (const [k, v] of Object.entries(persisted as Record<string, unknown>)) {
    const cur = (current as any)[k];
    if (typeof cur === 'function') continue;
    // varsayılanı null/undefined olan alanlar (ör. me, plan) her türü kabul eder
    if (cur !== null && cur !== undefined && v !== undefined && kindOf(cur) !== kindOf(v)) {
      warn(`kalıcı alan türü uyuşmadı, varsayılan kullanıldı: ${k} (${kindOf(v)} ≠ ${kindOf(cur)})`);
      continue;
    }
    out[k] = v;
  }
  return out as T;
}
