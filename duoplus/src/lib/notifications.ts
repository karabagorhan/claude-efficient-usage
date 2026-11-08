import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from '../engine/types';

let configured = false;
function configure() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermission(): Promise<boolean> {
  try {
    configure();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Hatırlatıcılar',
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

/** expo: weekday 1 = Pazar ... 7 = Cumartesi. Bizim 0 = Pazartesi. */
const toExpoWeekday = (d: number) => ((d + 1) % 7) + 1;

/**
 * Tüm hatırlatıcıları yeniden kurar (iOS 64 bekleyen sınırı için görev başına tek
 * tekrarlayan tetikleyici kullanılır).
 */
export async function rescheduleReminders(habits: Habit[], enabled: boolean): Promise<void> {
  try {
    configure();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    const list = habits.filter((h) => !h.archived && h.reminderTime);
    if (list.length === 0) return;
    if (!(await ensurePermission())) return;
    for (const h of list) {
      const [hour, minute] = (h.reminderTime as string).split(':').map(Number);
      const content = { title: `${h.icon} ${h.title}`, body: 'Şimdi yapma zamanı. Puanı kap!', sound: false };
      const days = h.schedule.days ?? [];
      if (h.schedule.weeklyQuota || days.length === 0 || days.length === 7) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'reminders' },
        });
      } else {
        for (const d of days) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: toExpoWeekday(d),
              hour,
              minute,
              channelId: 'reminders',
            },
          });
        }
      }
    }
  } catch {
    // Expo Go / web'de bazı API'ler yoksa sessizce geç
  }
}
