import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** Yapılandırma yoksa uygulama "yerel mod"da çalışır. */
export const isBackendConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isBackendConfigured
  ? createClient(url as string, key as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;

/** Anonim oturum açar (yoksa) ve kullanıcı id'sini döndürür. */
export async function ensureSession(): Promise<string> {
  if (!supabase) throw new Error('common.errors.notConfigured');
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: res, error } = await supabase.auth.signInAnonymously();
  if (error || !res.user) throw new Error(error?.message ?? 'common.errors.anonFailed');
  return res.user.id;
}
