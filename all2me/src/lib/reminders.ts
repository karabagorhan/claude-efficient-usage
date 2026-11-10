/**
 * Tüm bildirim gruplarını cihazdaki durumdan yeniden kurar / iptal eder.
 * Kök düzen (Boot) bunu dil değişince ve bildirim ana anahtarı değişince çağırır;
 * yalnızca kullanıcının gerçekten kullandığı (verisi ya da hatırlatıcısı olan) takipçiler kurulur,
 * böylece kullanılmayan bir özellik için izin istenmez. 'habit' grubunu Boot ayrıca yönetir.
 */
import { buildGrowthNotifs } from '../features/growth/notify';
import { notifyChores, notifyMeals, notifySmoke } from '../features/life/notify';
import { buildStudyNotifs } from '../features/study/notify';
import { rescheduleAlarms } from '../features/toolsb/alarmSchedule';
import { translate } from '../i18n';
import { useAlarm } from '../store/slices/alarm';
import { useChores } from '../store/slices/chores';
import { useDrink, type DrinkReminder } from '../store/slices/drink';
import { useGrowth } from '../store/slices/growth';
import { useMeals } from '../store/slices/meals';
import { useSleep } from '../store/slices/sleep';
import { useSmoke } from '../store/slices/smoke';
import { useStudy } from '../store/slices/study';
import { cancelGroups, NOTIF_GROUPS, parseHHMM, scheduleGroup, type NotifItem } from './notifications';
import { routes } from './routes';

/** Su hatırlatıcıları: 09:00-21:00 arası her `every` saatte bir (0 = kapalı). */
export function buildDrinkNotifs(every: DrinkReminder): NotifItem[] {
  if (!every) return [];
  const items: NotifItem[] = [];
  for (let h = 9; h <= 21; h += every) {
    items.push({
      title: translate('drink.reminder.notifTitle'),
      body: translate('drink.reminder.notifBody'),
      url: routes.tool('drink'),
      trigger: { kind: 'daily', hour: h, minute: 0 },
    });
  }
  return items;
}

/** Yatma hatırlatıcısı ('HH:MM' ya da kapalı). */
export function buildSleepNotifs(time: string | null): NotifItem[] {
  if (!time) return [];
  const { hour, minute } = parseHHMM(time);
  return [
    { title: translate('sleep.reminder.notifTitle'), body: translate('sleep.reminder.notifBody'), url: routes.tool('sleep'), trigger: { kind: 'daily', hour, minute } },
  ];
}

/** Kullanılan takipçilerin gruplarını yeniden kurar ('habit' hariç). */
export async function resyncAllReminders(): Promise<void> {
  const jobs: Array<Promise<unknown>> = [];
  const drink = useDrink.getState().reminder;
  if (drink) jobs.push(scheduleGroup('drink', buildDrinkNotifs(drink)));
  const bed = useSleep.getState().bedReminder;
  if (bed) jobs.push(scheduleGroup('sleep', buildSleepNotifs(bed)));
  const alarms = useAlarm.getState().alarms;
  if (alarms.length) jobs.push(rescheduleAlarms(alarms));
  if (useSmoke.getState().plan) jobs.push(notifySmoke());
  const meals = useMeals.getState().remind;
  if (meals.dinner || meals.prep) jobs.push(notifyMeals());
  if (Object.keys(useChores.getState().history).length) jobs.push(notifyChores());
  const study = useStudy.getState();
  if (Object.keys(study.items).length) jobs.push(scheduleGroup('study', buildStudyNotifs(Object.values(study.items), study.settings)));
  const g = useGrowth.getState();
  if (Object.keys(g.goals).length || Object.keys(g.tops).length || Object.keys(g.learning).length || g.reviews.length) {
    jobs.push(scheduleGroup('growth', buildGrowthNotifs(g.settings)));
  }
  await Promise.all(jobs.map((j) => j.catch(() => {})));
}

/** Bildirimler kapatılınca: 'habit' dahil uygulamanın bütün grupları iptal edilir. */
export const cancelAllReminders = () => cancelGroups(NOTIF_GROUPS);
