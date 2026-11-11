/**
 * Alarm zamanlama: Android'de `delivery: 'alarmClock'` (AlarmManager.setAlarmClock) + yüksek öncelikli
 * `alarm` kanalı; iOS'ta zamanında ses çalan yerel bildirim. İki platformda da "Ertele 5/10 dk" kategorisi.
 * Bildirim verisi `{ group: 'alarm', alarm: {id,hour,minute,label}, snooze? }` taşır; `url` KONMAZ,
 * dokunuşu bu dosyadaki `installAlarmResponder` yönetir (kök düzen Boot içinden kurulur) ve tam ekran
 * `/alarm-ring` ekranını açar. Web'de her şey no-op.
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import type { Weekday } from '../../engine/types';
import { translate } from '../../i18n';
import { ensurePermission } from '../../lib/notifications';
import { routes } from '../../lib/routes';
import type { AlarmItem } from '../../store/slices/alarm';
import { useSettings } from '../../store/settings';

export const ALARM_CHANNEL = 'alarm';
export const ALARM_CATEGORY = 'alarm';
export const SNOOZE_OPTIONS = [5, 10] as const;
const ACTION_SNOOZE = (m: number) => `snooze${m}`;

export interface AlarmPayload {
  id: string;
  hour: number;
  minute: number;
  label: string;
}

/** Verilen andan sonraki ilk oluşum (ms). Günler boşsa bir sonraki hh:mm. */
export function nextOccurrence(a: Pick<AlarmItem, 'hour' | 'minute' | 'days'>, from: Date = new Date()): Date {
  for (let add = 0; add <= 7; add++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + add, a.hour, a.minute, 0, 0);
    if (d.getTime() <= from.getTime()) continue;
    const wd = ((d.getDay() + 6) % 7) as Weekday;
    if (a.days.length === 0 || a.days.includes(wd)) return d;
  }
  return new Date(from.getTime() + 86400000);
}

/** Etkin alarmlar arasında en yakını (yoksa null). */
export function nextAlarm(alarms: AlarmItem[], from: Date = new Date()): { alarm: AlarmItem; at: Date } | null {
  let best: { alarm: AlarmItem; at: Date } | null = null;
  for (const a of alarms) {
    if (!a.enabled) continue;
    const at = nextOccurrence(a, from);
    if (!best || at < best.at) best = { alarm: a, at };
  }
  return best;
}

// ------------------------------------------------------------------ kanal + kategori

/** Android `alarm` kanalı: MAX önem, ses açık, rahatsız etmeyi aşma (kullanıcı izin verdiyse), alarm ses kullanımı. */
export async function setupAlarmChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL, {
      name: translate('alarm.channelName'),
      description: translate('alarm.channelDesc'),
      importance: Notifications.AndroidImportance.MAX,
      bypassDnd: true,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 500, 300, 500, 300, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
    });
  } catch {}
}

/** "Ertele 5 / 10 dk" eylemleri (iOS + Android). Dil değişince yeniden kurulsun diye her planlamada çağrılır. */
export async function setupAlarmCategory(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setNotificationCategoryAsync(
      ALARM_CATEGORY,
      SNOOZE_OPTIONS.map((m) => ({
        identifier: ACTION_SNOOZE(m),
        buttonTitle: translate('alarm.snoozeBtn', { n: m }),
        // uygulama kapalıyken de dinleyicinin tetiklenmesi için ön plana alır
        options: { opensAppToForeground: true },
      })),
    );
  } catch {}
}

// ------------------------------------------------------------------ tam zamanlı alarm izni (Android 12+)

export interface ExactAlarmStatus {
  /** Android'de tam zamanlı alarm izni yok (alarm yaklaşık zamanda çalabilir) */
  missing: boolean;
  /** Ayarlar ekranına yönlendirmek mümkün (uygulama izni bildirmişse) */
  canOpenSettings: boolean;
}

export async function exactAlarmStatus(): Promise<ExactAlarmStatus> {
  if (Platform.OS !== 'android') return { missing: false, canOpenSettings: false };
  try {
    const r = await Notifications.getExactAlarmPermissionsAsync();
    return { missing: !r.granted, canOpenSettings: !r.granted && r.canAskAgain !== false };
  } catch {
    return { missing: false, canOpenSettings: false };
  }
}

/** Sistem ayarlarındaki "Alarmlar ve hatırlatıcılar" ekranını açar; uygulama izni bildirmemişse reddeder (false). */
export async function openExactAlarmSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const r = await Notifications.requestExactAlarmPermissionsAsync();
    return r.granted;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ planlama

const toExpoWeekday = (d: number) => ((d + 1) % 7) + 1;
const delivery = () => (Platform.OS === 'android' ? ({ delivery: 'alarmClock' } as const) : {});
const chan = () => (Platform.OS === 'android' ? { channelId: ALARM_CHANNEL } : {});

const payloadOf = (a: AlarmItem): AlarmPayload => ({ id: a.id, hour: a.hour, minute: a.minute, label: a.label });

function contentFor(p: AlarmPayload, snooze: boolean): Notifications.NotificationContentInput {
  return {
    title: p.label ? `⏰ ${p.label}` : `⏰ ${translate('alarm.notifTitle')}`,
    body: translate(snooze ? 'alarm.notifSnoozed' : 'alarm.notifBody'),
    sound: true,
    categoryIdentifier: ALARM_CATEGORY,
    priority: Notifications.AndroidNotificationPriority.MAX,
    data: { group: 'alarm', alarm: p, snooze },
  };
}

/** Bu cihazda planlı alarm bildirimleri (grup 'alarm'); `snoozed` = ertelemeler. */
async function pendingAlarmNotifs() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.filter((n) => (n.content.data as any)?.group === 'alarm');
}

/**
 * Tüm etkin alarmları 'alarm' grubuna kurar. Önceki alarm bildirimlerini (erteleme olmayanları) iptal eder;
 * bekleyen ertelemeler korunur. Bildirimler ayarlarda kapalıysa yalnız iptal. İzin yoksa false.
 */
export async function rescheduleAlarms(alarms: AlarmItem[]): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    for (const n of await pendingAlarmNotifs()) {
      if (!(n.content.data as any)?.snooze) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    const active = alarms.filter((a) => a.enabled);
    if (!useSettings.getState().notifications || active.length === 0) return true;
    if (!(await ensurePermission())) return false;
    await setupAlarmChannel();
    await setupAlarmCategory();
    const T = Notifications.SchedulableTriggerInputTypes;
    for (const a of active) {
      const content = contentFor(payloadOf(a), false);
      const base = { ...chan(), ...delivery() };
      if (a.days.length === 0) {
        const date = a.onceAt ? new Date(a.onceAt) : nextOccurrence(a);
        if (date.getTime() > Date.now()) await Notifications.scheduleNotificationAsync({ content, trigger: { type: T.DATE, date, ...base } });
      } else if (a.days.length === 7) {
        await Notifications.scheduleNotificationAsync({ content, trigger: { type: T.DAILY, hour: a.hour, minute: a.minute, ...base } });
      } else {
        for (const d of a.days) {
          await Notifications.scheduleNotificationAsync({ content, trigger: { type: T.WEEKLY, weekday: toExpoWeekday(d), hour: a.hour, minute: a.minute, ...base } });
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** `minutes` dakika sonrasına tek seferlik erteleme kurar; planlanan anı döner (web/izin yoksa yine de an döner, null değil). */
export async function snoozeAlarm(p: AlarmPayload, minutes: number): Promise<Date> {
  const date = new Date(Date.now() + minutes * 60000);
  if (Platform.OS === 'web') return date;
  try {
    if (!useSettings.getState().notifications || !(await ensurePermission())) return date;
    await setupAlarmChannel();
    await setupAlarmCategory();
    await cancelSnoozes(p.id);
    await Notifications.scheduleNotificationAsync({
      content: contentFor(p, true),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, ...chan(), ...delivery() },
    });
  } catch {}
  return date;
}

/** Bir alarmın bekleyen ertelemelerini iptal eder. */
export async function cancelSnoozes(alarmId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    for (const n of await pendingAlarmNotifs()) {
      const d = n.content.data as any;
      if (d?.snooze && d?.alarm?.id === alarmId) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  } catch {}
}

/** Bildirim çekmecesindeki alarm bildirimlerini kapatır. */
export async function dismissPresentedAlarms(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const shown = await Notifications.getPresentedNotificationsAsync();
    for (const n of shown) {
      if ((n.request.content.data as any)?.group === 'alarm') await Notifications.dismissNotificationAsync(n.request.identifier);
    }
  } catch {}
}

// ------------------------------------------------------------------ yanıt dinleyicisi

let ringOpen = false;
/** Alarm ekranı kendini açık/kapalı olarak işaretler (ön planda üst üste açılmasın). */
export const setRingOpen = (v: boolean) => {
  ringOpen = v;
};
const handled = new Set<string>();

let pushedAt = 0;
const openRing = (p: AlarmPayload) => {
  if (ringOpen || Date.now() - pushedAt < 3000) return;
  pushedAt = Date.now();
  router.push(routes.alarmRing({ alarmId: p.id, hour: p.hour, minute: p.minute, label: p.label }) as any);
};

function payloadFrom(n: Notifications.Notification): AlarmPayload | null {
  const d = n.request.content.data as any;
  if (d?.group !== 'alarm' || !d.alarm || typeof d.alarm.hour !== 'number') return null;
  return { id: String(d.alarm.id), hour: d.alarm.hour, minute: d.alarm.minute, label: String(d.alarm.label ?? '') };
}

async function onResponse(r: Notifications.NotificationResponse, delayMs: number) {
  const p = payloadFrom(r.notification);
  if (!p) return;
  const key = `${r.notification.request.identifier}:${r.actionIdentifier}:${r.notification.date}`;
  if (handled.has(key)) return;
  handled.add(key);
  const snooze = SNOOZE_OPTIONS.find((m) => r.actionIdentifier === ACTION_SNOOZE(m));
  if (snooze) {
    await snoozeAlarm(p, snooze);
    await dismissPresentedAlarms();
    return;
  }
  setTimeout(() => openRing(p), delayMs);
}

/**
 * Alarm bildirimi: dokunuş → tam ekran alarm; "Ertele" eylemi → erteleme kurulur; uygulama açıkken
 * bildirim gelirse alarm ekranı kendiliğinden açılır. Soğuk açılışta son yanıt da işlenir. Web'de no-op.
 */
export function installAlarmResponder(): () => void {
  if (Platform.OS === 'web') return () => {};
  try {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => void onResponse(r, 0));
    const recv = Notifications.addNotificationReceivedListener((n) => {
      const p = payloadFrom(n);
      if (p) openRing(p);
    });
    const last = Notifications.getLastNotificationResponse?.();
    if (last && payloadFrom(last.notification)) {
      Notifications.clearLastNotificationResponse?.();
      void onResponse(last, 700);
    }
    return () => {
      sub.remove();
      recv.remove();
    };
  } catch {
    return () => {};
  }
}
