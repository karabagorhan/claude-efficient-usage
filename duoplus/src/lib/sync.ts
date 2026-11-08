import { AppState } from 'react-native';
import { create } from 'zustand';
import { useStore, type DocKind, type RemoteDoc } from '../store/store';
import { ensureSession, isBackendConfigured, supabase } from './supabase';

interface SyncStatus {
  status: 'off' | 'syncing' | 'ok' | 'error';
  error?: string;
  lastAt?: number;
}
export const useSyncStatus = create<SyncStatus>(() => ({ status: 'off' }));

const setStatus = (s: SyncStatus) => useSyncStatus.setState(s, true);

function getDoc(kind: DocKind, id: string): any | undefined {
  const s = useStore.getState();
  switch (kind) {
    case 'habit': return s.habits[id];
    case 'completion': return s.completions[id];
    case 'event': return s.events[id];
    case 'badge': return s.badges[id];
    case 'nudge': return s.nudges[id];
    case 'profile': return s.me && `profile:${s.me.id}` === id ? s.me : undefined;
  }
}

let pushing = false;
export async function pushDirty(): Promise<void> {
  const st = useStore.getState();
  if (!supabase || !st.pairId || !st.me || pushing) return;
  const keys = Object.keys(st.dirty).slice(0, 300);
  if (keys.length === 0) return;
  pushing = true;
  try {
    const rows: any[] = [];
    const sent: string[] = [];
    for (const key of keys) {
      const [kind, ...rest] = key.split('|');
      const id = rest.join('|');
      const deleted = st.dirty[key] === 1;
      const data = deleted ? { _u: Date.now() } : getDoc(kind as DocKind, id);
      if (!data) {
        sent.push(key); // yerelde yok olmuş, kuyruktan at
        continue;
      }
      rows.push({ pair_id: st.pairId, id, kind, owner_id: st.me.id, data, deleted });
      sent.push(key);
    }
    if (rows.length) {
      const { error } = await supabase.from('docs').upsert(rows, { onConflict: 'pair_id,id' });
      if (error) throw new Error(error.message);
    }
    useStore.getState().clearDirty(sent);
    setStatus({ status: 'ok', lastAt: Date.now() });
  } catch (e: any) {
    setStatus({ status: 'error', error: e?.message ?? String(e), lastAt: Date.now() });
  } finally {
    pushing = false;
  }
}

let pulling = false;
export async function pull(): Promise<void> {
  const st = useStore.getState();
  if (!supabase || !st.pairId || pulling) return;
  pulling = true;
  try {
    let cursor = st.cursor;
    for (let page = 0; page < 20; page++) {
      let q = supabase.from('docs').select('id,kind,owner_id,data,deleted,updated_at').eq('pair_id', st.pairId).order('updated_at', { ascending: true }).limit(500);
      if (cursor) q = q.gte('updated_at', cursor);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      useStore.getState().applyRemote(data as RemoteDoc[]);
      const last = data[data.length - 1].updated_at as string;
      const advanced = last !== cursor;
      cursor = last;
      useStore.getState().setCursor(cursor);
      if (data.length < 500 || !advanced) break;
    }
    useStore.getState().markSynced();
    useStore.getState().settleChampions();
    useStore.getState().checkBadges();
    setStatus({ status: 'ok', lastAt: Date.now() });
  } catch (e: any) {
    setStatus({ status: 'error', error: e?.message ?? String(e), lastAt: Date.now() });
  } finally {
    pulling = false;
  }
}

export async function syncNow() {
  setStatus({ ...useSyncStatus.getState(), status: 'syncing' });
  await pushDirty();
  await pull();
  await pushDirty();
}

let stop: (() => void) | null = null;

/** Eşleşme varsa gerçek zamanlı + periyodik senkronu başlatır. */
export function startSync(): () => void {
  stop?.();
  const st = useStore.getState();
  if (!supabase || !st.pairId) {
    setStatus({ status: 'off' });
    return () => {};
  }
  const pairId = st.pairId;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedulePush = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void pushDirty(), 700);
  };

  const unsubStore = useStore.subscribe((s, prev) => {
    if (s.dirty !== prev.dirty && Object.keys(s.dirty).length > 0) schedulePush();
  });

  const channel = supabase
    .channel(`docs:${pairId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: `pair_id=eq.${pairId}` }, (payload: any) => {
      const row = payload.new;
      if (!row || !row.id) return;
      useStore.getState().applyRemote([row as RemoteDoc]);
      useStore.getState().settleChampions();
    })
    .subscribe();

  const sub = AppState.addEventListener('change', (a) => {
    if (a === 'active') void syncNow();
  });
  const interval = setInterval(() => void syncNow(), 45000);

  void (async () => {
    try {
      const uid = await ensureSession();
      if (uid !== useStore.getState().me?.id) {
        setStatus({ status: 'error', error: 'Oturum kimliği değişti (anonim hesap kaybolmuş olabilir).' });
        return;
      }
    } catch (e: any) {
      setStatus({ status: 'error', error: e?.message ?? String(e) });
      return;
    }
    await syncNow();
  })();

  stop = () => {
    unsubStore();
    sub.remove();
    clearInterval(interval);
    if (timer) clearTimeout(timer);
    void supabase?.removeChannel(channel);
    stop = null;
  };
  return stop;
}

// ---------- Eşleşme akışları ----------

const joinError = (m: string) => {
  if (m.includes('invalid_code')) return 'Kod geçersiz.';
  if (m.includes('pair_full')) return 'Bu eşleşme dolu (2 kişi).';
  if (m.includes('already_paired')) return 'Bu hesap başka bir eşleşmede.';
  return m;
};

/** Anonim oturum + yeni eşleşme. Profil yazmaz; çağıran setMe/setPair yapar. */
export async function createPairRaw(): Promise<{ uid: string; pairId: string; code: string }> {
  if (!supabase) throw new Error('Bulut yapılandırılmadı');
  const uid = await ensureSession();
  const { data, error } = await supabase.rpc('create_pair');
  if (error) throw new Error(joinError(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  return { uid, pairId: row.pair_id as string, code: row.code as string };
}

export async function joinPairRaw(code: string): Promise<{ uid: string; pairId: string }> {
  if (!supabase) throw new Error('Bulut yapılandırılmadı');
  const uid = await ensureSession();
  const { data, error } = await supabase.rpc('join_pair', { p_code: code.trim().toUpperCase() });
  if (error) throw new Error(joinError(error.message));
  return { uid, pairId: data as string };
}

export { isBackendConfigured };
