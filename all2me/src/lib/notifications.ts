/**
 * Yerel bildirim yardımcıları. Her özellik kendi GRUBUNU kullanır; bir grubu yeniden kurmak
 * diğer grupların bildirimlerine dokunmaz. ASLA cancelAllScheduledNotificationsAsync çağırma.
 *
 * Gruplar (sahipleri): 'habit' (çekirdek, bu dosya), 'drink', 'sleep', 'alarm', 'timer', 'mood',
 * 'smoke', 'meals', 'chores', 'study', 'growth', 'report'. Hepsini yeniden kurmak: src/lib/reminders.ts.
 * Bildirim `url` verisi taşıyorsa dokununca o rotaya gidilir (app/_layout.tsx).
 */
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { dayKeyOf, parseDayKey } from '../engine/dates';
import { nextPlannedDays, validEvery } from '../engine/points';
import type { Habit, Weekday } from '../engine/types';
import { translate } from '../i18n';
import { useSettings } from '../store/settings';
import { applyDailyCap, applyQuietHours, EXEMPT_GROUPS, type BudgetItem, type BudgetTrigger } from './notifBudget';

export type NotifGroup = 'habit' | 'drink' | 'sleep' | 'alarm' | 'timer' | 'mood' | (string & {});

/** Uygulamanın kullandığı tüm bildirim grupları ('test' = Hatırlatıcı sağlığı ekranındaki deneme bildirimi). */
export const NOTIF_GROUPS: NotifGroup[] = ['habit', 'drink', 'sleep', 'alarm', 'timer', 'mood', 'smoke', 'meals', 'chores', 'study', 'growth', 'report', 'test'];

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

// ------------------------------------------------------------------ sıra (yarış koşulu olmasın)
/** Planlama işlemleri tek tek çalışır: aynı anda iki grubun "hepsini oku → iptal et → kur" adımları karışmaz. */
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

// ------------------------------------------------------------------ tetikleyici kaydı (bütçe için)
/** Bildirim verisine yazılan kısa tetikleyici (bütçe hesabı platformdan bağımsız okuyabilsin). */
type Trig = { k: 'd'; h: number; m: number } | { k: 'w'; w: number; h: number; m: number } | { k: 't'; t: number } | { k: 'i'; s: number; r?: boolean };
const encodeTrig = (tr: NotifTrigger): Trig =>
  tr.kind === 'daily'
    ? { k: 'd', h: tr.hour, m: tr.minute }
    : tr.kind === 'weekly'
      ? { k: 'w', w: tr.weekday, h: tr.hour, m: tr.minute }
      : tr.kind === 'date'
        ? { k: 't', t: tr.date.getTime() }
        : { k: 'i', s: tr.seconds, r: tr.repeats };

function decodeTrig(n: Notifications.NotificationRequest): BudgetTrigger | null {
  const t = (n.content.data as any)?.trig as Trig | undefined;
  if (t && typeof t === 'object') {
    if (t.k === 'd') return { kind: 'daily', hour: t.h, minute: t.m };
    if (t.k === 'w') return { kind: 'weekly', weekday: t.w, hour: t.h, minute: t.m };
    if (t.k === 't') return { kind: 'date', date: new Date(t.t) };
    if (t.k === 'i') return { kind: 'interval', seconds: t.s, repeats: t.r };
  }
  // eski kayıtlar: platform tetikleyicisinden tahmin et
  const tr = n.trigger as any;
  if (!tr) return null;
  if (tr.type === 'daily' && typeof tr.hour === 'number') return { kind: 'daily', hour: tr.hour, minute: tr.minute ?? 0 };
  if (tr.type === 'weekly' && typeof tr.weekday === 'number') return { kind: 'weekly', weekday: (tr.weekday + 5) % 7, hour: tr.hour ?? 0, minute: tr.minute ?? 0 };
  if (tr.type === 'date' && (typeof tr.value === 'number' || tr.date)) return { kind: 'date', date: new Date(tr.value ?? tr.date) };
  if (tr.type === 'timeInterval' && typeof tr.seconds === 'number') return { kind: 'interval', seconds: tr.seconds, repeats: tr.repeats };
  return { kind: 'daily', hour: 12, minute: 0 }; // bilinmiyor: günde bir sayılır (temkinli)
}

const groupOf = (n: Notifications.NotificationRequest): string | null => {
  const g = (n.content.data as any)?.group;
  return typeof g === 'string' ? g : null;
};

/** Son planlamalarda bütçe kurallarının etkisi (grup → sayılar). Hatırlatıcı sağlığı ekranı gösterir. */
export interface BudgetLog {
  /** sessiz saatte olduğu için kurulmayan tekrarlayan hatırlatıcı */
  quietSkipped: number;
  /** sessiz saatin sonuna ertelenen tek seferlik */
  deferred: number;
  /** günlük üst sınır nedeniyle kurulmayan / iptal edilen */
  capTrimmed: number;
  at: number;
}
const budgetLog: Record<string, BudgetLog> = {};
export const getBudgetLog = (): Record<string, BudgetLog> => ({ ...budgetLog });
const logBudget = (g: string, p: Partial<Omit<BudgetLog, 'at'>>, replace: boolean) => {
  const cur = replace ? { quietSkipped: 0, deferred: 0, capTrimmed: 0 } : (budgetLog[g] ?? { quietSkipped: 0, deferred: 0, capTrimmed: 0 });
  budgetLog[g] = {
    quietSkipped: cur.quietSkipped + (p.quietSkipped ?? 0),
    deferred: cur.deferred + (p.deferred ?? 0),
    capTrimmed: cur.capTrimmed + (p.capTrimmed ?? 0),
    at: Date.now(),
  };
};

async function scheduleRaw(group: string, it: NotifItem): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title: it.title, body: it.body, sound: it.sound ?? true, data: { group, url: it.url, trig: encodeTrig(it.trigger) } },
    trigger: toTrigger(it.trigger),
  });
}

async function cancelGroupRaw(group: string): Promise<Notifications.NotificationRequest[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const rest: Notifications.NotificationRequest[] = [];
  for (const n of all) {
    if (groupOf(n) === group) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    else rest.push(n);
  }
  return rest;
}

/** Bir gruptaki tüm planlı bildirimleri iptal eder. */
export function cancelGroup(group: NotifGroup): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  return serial(async () => {
    try {
      await cancelGroupRaw(group);
    } catch {}
  });
}

/** Birden çok grubu tek geçişte iptal eder (ör. bildirimler kapatılınca ya da veriler sıfırlanınca). */
export function cancelGroups(groups: NotifGroup[]): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  return serial(async () => {
    try {
      const set = new Set<string>(groups);
      const all = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of all) {
        const g = groupOf(n);
        if (g && set.has(g)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    } catch {}
  });
}

/**
 * Grubu verilen listeyle DEĞİŞTİRİR (önce grubu iptal eder). Ayarlarda bildirimler kapalıysa
 * yalnızca iptal eder. İzin yoksa false döner. Web'de no-op (false).
 * Sessiz saatler ve günlük üst sınır burada uygulanır (src/lib/notifBudget.ts); üst sınır aşılırsa
 * DİĞER gruplardaki düşük öncelikli planlı hatırlatıcılar da iptal edilebilir. Alarm/zamanlayıcı muaftır.
 */
export function scheduleGroup(group: NotifGroup, items: NotifItem[]): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(false);
  return serial(async () => {
    try {
      configure();
      const others = await cancelGroupRaw(group);
      const st = useSettings.getState();
      if (!st.notifications || items.length === 0) {
        logBudget(group, {}, true);
        return true;
      }
      if (!(await ensurePermission())) return false;
      const fresh: BudgetItem<{ item?: NotifItem; id?: string }>[] = items.map((it) => ({ group, trigger: it.trigger as BudgetTrigger, ref: { item: it } }));
      const quiet = applyQuietHours(fresh, st.quietHours);
      const existing: BudgetItem<{ item?: NotifItem; id?: string }>[] = [];
      for (const n of others) {
        const g = groupOf(n);
        if (!g || EXEMPT_GROUPS.has(g)) continue;
        const tr = decodeTrig(n);
        if (tr) existing.push({ group: g, trigger: tr, ref: { id: n.identifier } });
      }
      const cap = applyDailyCap([...existing, ...quiet.kept], st.dailyCap);
      let ownTrimmed = 0;
      for (const t of cap.trimmed) {
        if (t.ref.id) {
          await Notifications.cancelScheduledNotificationAsync(t.ref.id);
          logBudget(t.group, { capTrimmed: 1 }, false);
        } else ownTrimmed++;
      }
      logBudget(group, { quietSkipped: quiet.skipped.length, deferred: quiet.deferred, capTrimmed: ownTrimmed }, true);
      for (const k of cap.kept) {
        if (!k.ref.item) continue;
        await scheduleRaw(group, { ...k.ref.item, trigger: k.trigger as NotifTrigger });
      }
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Tek bildirim ekler (grubu silmeden). Dönen kimlikle cancelOne çağrılabilir. Sessiz saatler ve günlük
 * üst sınır uygulanır (muaf gruplar hariç): tekrarlayan ve sessiz saatte ise ya da sınır doluysa null.
 */
export function scheduleOne(group: NotifGroup, it: NotifItem): Promise<string | null> {
  if (Platform.OS === 'web' || !useSettings.getState().notifications) return Promise.resolve(null);
  return serial(async () => {
    try {
      configure();
      if (!(await ensurePermission())) return null;
      let item = it;
      if (!EXEMPT_GROUPS.has(group)) {
        const st = useSettings.getState();
        const q = applyQuietHours([{ group, trigger: it.trigger as BudgetTrigger, ref: 0 }], st.quietHours);
        if (!q.kept.length) {
          logBudget(group, { quietSkipped: 1 }, false);
          return null;
        }
        item = { ...it, trigger: q.kept[0].trigger as NotifTrigger };
        const all = await Notifications.getAllScheduledNotificationsAsync();
        const existing: BudgetItem<number>[] = [];
        for (const n of all) {
          const g = groupOf(n);
          const tr = g && !EXEMPT_GROUPS.has(g) ? decodeTrig(n) : null;
          if (g && tr) existing.push({ group: g, trigger: tr, ref: 0 });
        }
        // yeni öğe en sona: sınır doluysa yalnız kendisi düşer (planlı olanlar iptal edilmez)
        const cap = applyDailyCap([...existing.map((e) => ({ ...e, group: 'habit' })), { group, trigger: item.trigger as BudgetTrigger, ref: 1 }], st.dailyCap);
        if (cap.trimmed.some((x) => x.ref === 1)) {
          logBudget(group, { capTrimmed: 1 }, false);
          return null;
        }
      }
      return await scheduleRaw(group, item);
    } catch {
      return null;
    }
  });
}

// ------------------------------------------------------------------ Hatırlatıcı sağlığı
export interface PermissionInfo {
  /** 'web' = bu platformda yerel bildirim yok */
  status: 'granted' | 'denied' | 'undetermined' | 'web';
  /** sistem tekrar sorabilir mi (hayırsa kullanıcı ayarlardan açmalı) */
  canAskAgain: boolean;
}

export async function permissionInfo(): Promise<PermissionInfo> {
  if (Platform.OS === 'web') return { status: 'web', canAskAgain: false };
  try {
    const p = await Notifications.getPermissionsAsync();
    return { status: p.granted ? 'granted' : p.status === 'denied' ? 'denied' : 'undetermined', canAskAgain: p.canAskAgain !== false };
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

/** İzni ister (sistem penceresi); sonucu döner. */
export async function requestPermission(): Promise<PermissionInfo> {
  await ensurePermission();
  return permissionInfo();
}

/** Uygulamanın sistem ayarları sayfasını açar. */
export async function openAppSettings(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}

/** Planlı bildirim sayısı (grup → adet). Web'de boş. */
export async function scheduledCounts(): Promise<Record<string, number>> {
  if (Platform.OS === 'web') return {};
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const out: Record<string, number> = {};
    for (const n of all) {
      const g = groupOf(n) ?? 'other';
      out[g] = (out[g] ?? 0) + 1;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * `seconds` saniye sonra deneme bildirimi ('test' grubu; sessiz saat / üst sınır uygulanmaz,
 * ana anahtar kapalı olsa da kullanıcı açıkça istediği için kurulur). İzin yoksa null.
 */
export function sendTestNotification(seconds = 5): Promise<string | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  return serial(async () => {
    try {
      configure();
      if (!(await ensurePermission())) return null;
      return await scheduleRaw('test', {
        title: translate('settings.health.test.notifTitle'),
        body: translate('settings.health.test.notifBody'),
        trigger: { kind: 'interval', seconds },
      });
    } catch {
      return null;
    }
  });
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
    if (!h.schedule.weeklyQuota && validEvery(h.schedule.every)) {
      // esnek tekrar: sonraki planlı günler için tek seferlik bildirimler (en çok 8, 120 gün içinde)
      const now = new Date();
      for (const day of nextPlannedDays(h, dayKeyOf(now), 9, 120)) {
        const d = parseDayKey(day);
        // 03:00 gün sınırı: 00:00-02:59 arası hatırlatıcı takvimde ertesi güne düşer
        const at = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (hour < 3 ? 1 : 0), hour, minute, 0, 0);
        if (at.getTime() > now.getTime() && items.filter((x) => x.url === base.url).length < 8) items.push({ ...base, trigger: { kind: 'date', date: at } });
      }
    } else if (h.schedule.weeklyQuota || days.length === 0 || days.length === 7) {
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
