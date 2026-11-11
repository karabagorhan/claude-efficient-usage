/**
 * "Verileri sıfırla": çekirdek + ayarlar + tüm cihaz dilimleri + `all2me-` AsyncStorage anahtarları + planlı bildirimler.
 * Tek giriş noktası; Ayarlar ekranı bunu kullanır. Yeni dilim eklenirse SLICES listesine ekle.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelGroups, NOTIF_GROUPS } from '../lib/notifications';
import { removeAllFromCalendar } from '../lib/calendar';
import { useCore } from './core';
import { useSettings } from './settings';
import { useAlarm } from './slices/alarm';
import { useCalendar } from './slices/calendar';
import { useChores } from './slices/chores';
import { useDrink } from './slices/drink';
import { useFavorites } from './slices/favorites';
import { useGrowth } from './slices/growth';
import { useLove } from './slices/love';
import { useMeals } from './slices/meals';
import { useMeditate } from './slices/meditate';
import { useMood } from './slices/mood';
import { useMotivation } from './slices/motivation';
import { usePlanner } from './slices/planner';
import { useProfile } from './slices/profile';
import { useReflection } from './slices/reflection';
import { useReportPrefs } from './slices/report';
import { useSleep } from './slices/sleep';
import { useSmoke } from './slices/smoke';
import { useSoundscape } from './slices/soundscape';
import { useStudy } from './slices/study';
import { useTimer } from './slices/timer';
import { useWheel } from './slices/wheel';
import { useWorkout } from './slices/workout';

/** Her dilimin `reset()`'i olan store'ları (getState().reset()). */
export const SLICES: Array<{ getState: () => { reset: () => void } }> = [
  useAlarm,
  useCalendar,
  useChores,
  useDrink,
  useFavorites,
  useGrowth,
  useLove,
  useMeals,
  useMeditate,
  useMood,
  useMotivation,
  usePlanner,
  useProfile,
  useReflection,
  useReportPrefs,
  useSleep,
  useSmoke,
  useSoundscape,
  useStudy,
  useTimer,
  useWheel,
  useWorkout,
];

/** Bellekteki tüm dilimleri varsayılana döndürür (depolamaya da varsayılan yazılır). */
export function resetAllSlices(): void {
  for (const s of SLICES) {
    try {
      s.getState().reset();
    } catch {}
  }
}

/** Uygulamadaki tüm kullanıcı verisini siler. Çekirdek sıfırlanınca kök koruma onboarding'e döner. */
export async function resetAllData(): Promise<void> {
  // önce bildirimler (alarm, su, sigara... hiçbir grup kalmasın)
  await cancelGroups(NOTIF_GROUPS).catch(() => {});
  // cihaz takvimindeki All2Me olayları (izin sorulmaz; izin yoksa atlanır)
  await removeAllFromCalendar().catch(() => {});
  resetAllSlices();
  useCore.getState().resetAll();
  useSettings.getState().resetSettings();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith('all2me-'));
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch {}
}
