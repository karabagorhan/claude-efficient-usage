import * as Notifications from 'expo-notifications';
import { t } from './i18n';
import { Expense, Settings, Sub, dueDate, fmtTL, iso } from './lib';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

let queue: Promise<void> = Promise.resolve();

/** iOS'un bekleyen bildirim sınırına sığan en yakın vadeleri kurar. */
async function schedule(settings: Settings, subs: Sub[], items: Expense[]) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.remind && !(settings.subRemind && subs.length)) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;

    if (settings.remind) {
      await Notifications.scheduleNotificationAsync({
        content: { title: t('app.name'), body: t('notif.daily') },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: settings.remindHour, minute: 0 },
      });
    }
    if (settings.subRemind) {
      const now = Date.now();
      const today = new Date();
      const due: { s: Sub; when: Date }[] = [];
      for (const s of subs) {
        for (let offset = 0; offset <= 12; offset++) {
          const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
          if (s.freq === 'yearly' && start.getMonth() + 1 !== s.month) continue;
          const target = dueDate(s, start.getFullYear(), start.getMonth());
          const when = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 10);
          const period = s.freq === 'yearly' ? String(start.getFullYear()) : iso(target).slice(0, 7);
          if (when.getTime() <= now || s.skip === period || s.skipped?.includes(period) || items.some((x) => x.sub === s.id && x.period === period)) continue;
          due.push({ s, when });
        }
      }
      due.sort((a, b) => a.when.getTime() - b.when.getTime());
      for (const { s, when } of due.slice(0, settings.remind ? 59 : 60)) {
        await Notifications.scheduleNotificationAsync({
          content: { title: t('notif.subTitle', { name: s.name }), body: t('notif.subBody', { amount: fmtTL(s.amount, 2, 'TRY') }) },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
      }
    }
}

export function reschedule(settings: Settings, subs: Sub[], items: Expense[]) {
  const next = queue.catch(() => {}).then(() => schedule(settings, subs, items));
  queue = next;
  return next;
}
