/**
 * Yerel bildirim yardımcıları. Her özellik kendi GRUBUNU kullanır; bir grubu yeniden kurmak
 * diğer grupların bildirimlerine dokunmaz. ASLA cancelAllScheduledNotificationsAsync çağırma.
 *
 * Gruplar (sahipleri): 'habit' (çekirdek, bu dosya), 'drink', 'sleep', 'alarm', 'timer', 'mood'.
 * Bildirim `url` verisi taşıyorsa dokununca o rotaya gidilir (app/_layout.tsx).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit, Weekday } from '../engine/types';
import { translate } from '../i18n';
import { useSettings } from '../store/settings';

export type NotifGroup = 'habit' | 'drink' | 'sleep' | 'alarm' | 'timer' | 'mood' | (string & {});

export type NotifTrigger =
  /** Her gün HH:MM */
  | { kind: 'daily'; hour: number; minute: number }
  /** Haftalık; weekday 0 = Pazartesi ... 6 = Pazar (engine ile aynı) */
  | { kind: 'weekly'; weekday: Weekday; hour: number; minute: number }
  /** Tek sefer, belirli an */
  | { kind: 'date'; date: Date }
  /** N saniye sonra (repeats: iOS'ta en az 60 sn) */
  | { kind: 'interval'; seconds: number; repeats?: boolean };

export interface NotifItem {
  title: string;
  body?: string;
  trigger: NotifTrigger;
  /** Dokununca açılacak rota, ör. '/action?habitId=..' veya '/tools/drink' */
  url?: string;
  sound?: boolean;
}

let configured = false;
function configure() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const CHANNEL = 'reminders';

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    configure();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: translate('common.appName'),
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const res = await Notifications.requestPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

/** engine 0 = Pazartesi → expo 1 = Pazar ... 7 = Cumartesi */
const toExpoWeekday = (d: number) => ((d + 1) % 7) + 1;

function toTrigger(tr: NotifTrigger): Notifications.NotificationTriggerInput {
  const T = Notifications.SchedulableTriggerInputTypes;
  switch (tr.kind) {
    case 'daily':
      return { type: T.DAILY, hour: tr.hour, minute: tr.minute, channelId: CHANNEL };
    case 'weekly':
      return { type: T.WEEKLY, weekday: toExpoWeekday(tr.weekday), hour: tr.hour, minute: tr.minute, channelId: CHANNEL };
    case 'date':
      return { type: T.DATE, date: tr.date, channelId: CHANNEL };
    case 'interval':
      return { type: T.TIME_INTERVAL, seconds: Math.max(1, Math.round(tr.seconds)), repeats: tr.repeats, channelId: CHANNEL };
  }
}

/** Bir gruptaki tüm planlı bildirimleri iptal eder. */
export async function cancelGroup(group: NotifGroup): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if ((n.content.data as any)?.group === group) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  } catch {}
}

/**
 * Grubu verilen listeyle DEĞİŞTİRİR (önce grubu iptal eder). Ayarlarda bildirimler kapalıysa
 * yalnızca iptal eder. İzin yoksa false döner. Web'de no-op (false).
 */
export async function scheduleGroup(group: NotifGroup, items: NotifItem[]): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    configure();
    await cancelGroup(group);
    if (!useSettings.getState().notifications || items.length === 0) return true;
    if (!(await ensurePermission())) return false;
    for (const it of items) {
      await Notifications.scheduleNotificationAsync({
        content: { title: it.title, body: it.body, sound: it.sound ?? true, data: { group, url: it.url } },
        trigger: toTrigger(it.trigger),
      });
    }
    return true;
  } catch {
    return false;
  }
}

/** Tek bildirim ekler (grubu silmeden). Dönen kimlikle cancelOne çağrılabilir. */
export async function scheduleOne(group: NotifGroup, it: NotifItem): Promise<string | null> {
  if (Platform.OS === 'web' || !useSettings.getState().notifications) return null;
  try {
    configure();
    if (!(await ensurePermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: it.title, body: it.body, sound: it.sound ?? true, data: { group, url: it.url } },
      trigger: toTrigger(it.trigger),
    });
  } catch {
    return null;
  }
}

export async function cancelOne(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

/** "HH:MM" -> {hour, minute} */
export const parseHHMM = (s: string) => {
  const [hour, minute] = s.split(':').map(Number);
  return { hour, minute };
};

/** Görev hatırlatıcılarını ('habit' grubu) yeniden kurar. Dokununca Harekete Geç ekranı açılır. */
export async function rescheduleReminders(habits: Habit[]): Promise<void> {
  const items: NotifItem[] = [];
  for (const h of habits) {
    if (h.archived || !h.reminderTime) continue;
    const { hour, minute } = parseHHMM(h.reminderTime);
    const base = {
      title: `${h.icon} ${h.title}`,
      body: translate('task.reminderBody'),
      url: `/action?habitId=${encodeURIComponent(h.id)}&source=reminder`,
    };
    const days = h.schedule.days ?? [];
    if (h.schedule.weeklyQuota || days.length === 0 || days.length === 7) {
      items.push({ ...base, trigger: { kind: 'daily', hour, minute } });
    } else {
      for (const d of days) items.push({ ...base, trigger: { kind: 'weekly', weekday: d, hour, minute } });
    }
  }
  await scheduleGroup('habit', items);
}

/** Bildirime dokunulunca url verisini döndürür (app/_layout.tsx kullanır). */
export function onNotificationOpen(cb: (url: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  try {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = (r.notification.request.content.data as any)?.url;
      if (typeof url === 'string' && url) cb(url);
    });
    const last = Notifications.getLastNotificationResponse?.();
    const url = (last?.notification.request.content.data as any)?.url;
    if (typeof url === 'string' && url) {
      Notifications.clearLastNotificationResponse?.();
      setTimeout(() => cb(url), 0);
    }
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
