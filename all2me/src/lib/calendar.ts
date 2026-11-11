/**
 * Cihaz takvimi (expo-calendar, legacy API). "All2Me" adlı ayrı bir takvim bulunur/oluşturulur ve olaylar
 * yalnız oraya yazılır. Bizim kimliğimiz -> takvim olay kimlikleri eşlemesi `useCalendar` diliminde tutulur
 * (idempotent: aynı anahtar tekrar yazılınca olaylar güncellenir, çoğalmaz). Web'de her şey no-op ('unsupported').
 * Saf kısım (olay alanları, tarih/saat, tekrar): ./calendarSpec.ts (tests/calendar.test.ts).
 */
import { Platform } from 'react-native';
import { useCalendar } from '../store/slices/calendar';
import { useCore, myHabits } from '../store/core';
import { useStudy } from '../store/slices/study';
import { isClosed } from '../features/study/types';
import { translate } from '../i18n';
import { calKey, courseEventSpecs, dueEventSpec, habitEventSpecs, type EventSpec } from './calendarSpec';

export * from './calendarSpec';

export type CalResult = 'ok' | 'unsupported' | 'denied' | 'error';

export const CALENDAR_NAME = 'All2Me';

/** Bu cihaz takvim yazabilir mi (web'de hayır) */
export const calendarSupported = (): boolean => Platform.OS === 'ios' || Platform.OS === 'android';

const load = () => import('expo-calendar/legacy');
type Cal = Awaited<ReturnType<typeof load>>;

async function hasPermission(C: Cal, ask: boolean): Promise<boolean> {
  try {
    const cur = await C.getCalendarPermissionsAsync();
    if (cur.granted) return true;
    if (!ask || cur.canAskAgain === false) return false;
    return (await C.requestCalendarPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** "All2Me" takviminin kimliği; yoksa oluşturur. İzin yoksa null. */
async function ensureCalendar(C: Cal): Promise<string | null> {
  const st = useCalendar.getState();
  const all = await C.getCalendarsAsync(C.EntityTypes.EVENT);
  if (st.calendarId && all.some((c) => c.id === st.calendarId)) return st.calendarId;
  const found = all.find((c) => c.title === CALENDAR_NAME && c.allowsModifications);
  if (found) {
    st.setCalendarId(found.id);
    return found.id;
  }
  let source: import('expo-calendar/legacy').Source;
  if (Platform.OS === 'ios') {
    source = (await C.getDefaultCalendarAsync()).source;
  } else {
    source = { isLocalAccount: true, name: CALENDAR_NAME, type: C.SourceType.LOCAL };
  }
  const id = await C.createCalendarAsync({
    title: CALENDAR_NAME,
    name: CALENDAR_NAME,
    color: '#7C5CFC',
    entityType: C.EntityTypes.EVENT,
    sourceId: source.id,
    source,
    ownerAccount: Platform.OS === 'android' ? CALENDAR_NAME : undefined,
    accessLevel: C.CalendarAccessLevel.OWNER,
  });
  st.setCalendarId(id);
  return id;
}

const tz = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

function toDetails(C: Cal, s: EventSpec) {
  return {
    title: s.title,
    notes: s.notes ?? '',
    startDate: s.startDate,
    endDate: s.endDate,
    allDay: false,
    timeZone: tz(),
    alarms: s.alarmOffsets.map((m) => ({ relativeOffset: m })),
    recurrenceRule: s.recurrence
      ? { frequency: s.recurrence.frequency === 'daily' ? C.Frequency.DAILY : C.Frequency.WEEKLY, interval: s.recurrence.interval, endDate: s.recurrence.endDate }
      : null,
  };
}

async function safeDelete(C: Cal, id: string) {
  try {
    await C.deleteEventAsync(id, { futureEvents: true });
  } catch {
    // olay kullanıcı tarafından zaten silinmiş olabilir
  }
}

/**
 * Anahtar için olayları yazar (varsa günceller, fazlasını siler, eksiğini ekler). Boş liste = kaldır.
 * `ask` false ise izin sorulmaz (yalnız izin varsa çalışır).
 */
export async function upsertCalendarEvents(key: string, specs: EventSpec[], ask = true): Promise<CalResult> {
  if (!calendarSupported()) return 'unsupported';
  if (specs.length === 0) return removeCalendarKey(key);
  try {
    const C = await load();
    if (!(await hasPermission(C, ask))) return 'denied';
    const calId = await ensureCalendar(C);
    if (!calId) return 'error';
    const old = useCalendar.getState().events[key] ?? [];
    const next: string[] = [];
    for (let i = 0; i < specs.length; i++) {
      const details = toDetails(C, specs[i]);
      let id: string | null = null;
      if (old[i]) {
        try {
          id = await C.updateEventAsync(old[i], details, { futureEvents: true });
        } catch {
          id = null; // takvimden silinmiş: yeniden oluştur
        }
      }
      next.push(id ?? (await C.createEventAsync(calId, details)));
    }
    for (const extra of old.slice(specs.length)) await safeDelete(C, extra);
    useCalendar.getState().setEvents(key, next);
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Anahtarın olaylarını takvimden siler ve eşlemeyi temizler. İzin yoksa yalnız eşlemeyi temizler. */
export async function removeCalendarKey(key: string): Promise<CalResult> {
  const ids = useCalendar.getState().events[key];
  if (!ids) return 'ok';
  if (!calendarSupported()) {
    useCalendar.getState().removeKey(key);
    return 'unsupported';
  }
  try {
    const C = await load();
    if (await hasPermission(C, false)) for (const id of ids) await safeDelete(C, id);
    useCalendar.getState().removeKey(key);
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Bu anahtar takvimde mi (eşleme var mı) */
export const isInCalendar = (key: string): boolean => Boolean(useCalendar.getState().events[key]);

/** Bütün All2Me olaylarını ve All2Me takvimini siler (izin sorulmaz). Veri sıfırlamada da çağrılır. */
export async function removeAllFromCalendar(): Promise<CalResult> {
  const st = useCalendar.getState();
  const ids = Object.values(st.events).flat();
  if (!calendarSupported()) {
    st.reset();
    return 'unsupported';
  }
  if (!st.calendarId && ids.length === 0) return 'ok';
  try {
    const C = await load();
    if (await hasPermission(C, false)) {
      for (const id of ids) await safeDelete(C, id);
      if (st.calendarId) {
        try {
          await C.deleteCalendarAsync(st.calendarId);
        } catch {}
      }
    }
    st.reset();
    return 'ok';
  } catch {
    return 'error';
  }
}

// ------------------------------------------------------------------ kaynak verilerden olay üretimi

export function itemSpec(id: string): EventSpec | null {
  const it = useStudy.getState().items[id];
  if (!it || !it.due) return null;
  const course = it.courseId ? useStudy.getState().courses[it.courseId] : undefined;
  return dueEventSpec({ title: it.title, due: it.due, time: it.time, notes: course ? course.code || course.name : undefined });
}

export function courseSpecs(id: string): EventSpec[] {
  const c = useStudy.getState().courses[id];
  if (!c || c.slots.length === 0) return [];
  return courseEventSpecs({ title: c.code ? `${c.code} ${c.name}` : c.name, notes: c.teacher, slots: c.slots });
}

export function habitSpecs(id: string): EventSpec[] {
  const h = useCore.getState().habits[id];
  if (!h || h.archived || !h.reminderTime) return [];
  return habitEventSpecs({
    title: `${h.icon} ${h.title}`,
    time: h.reminderTime,
    days: h.schedule.days ?? [],
    weeklyQuota: Boolean(h.schedule.weeklyQuota),
    notes: translate('task.reminderBody'),
  });
}

export interface SyncSummary {
  result: CalResult;
  count: number;
}

/**
 * Eşlenen her şeyi güncel veriden yeniden yazar; kaynağı silinmiş/uygunsuz olanları kaldırır. Ek olarak
 * teslim tarihli açık okul öğelerini ve saatli dersleri ekler. Görev (habit) yalnız zaten eşlenmişse güncellenir.
 */
export async function syncAllToCalendar(): Promise<SyncSummary> {
  if (!calendarSupported()) return { result: 'unsupported', count: 0 };
  const jobs: Array<[string, EventSpec[]]> = [];
  const study = useStudy.getState();
  for (const it of Object.values(study.items)) {
    if (!it.due) continue;
    const mapped = isInCalendar(calKey.item(it.id));
    if (isClosed(it.status) && !mapped) continue;
    const s = itemSpec(it.id);
    if (s) jobs.push([calKey.item(it.id), isClosed(it.status) ? [] : [s]]);
  }
  for (const c of Object.values(study.courses)) {
    const specs = courseSpecs(c.id);
    if (specs.length || isInCalendar(calKey.course(c.id))) jobs.push([calKey.course(c.id), specs]);
  }
  const alive = new Set(myHabits(useCore.getState()).map((h) => h.id));
  for (const key of Object.keys(useCalendar.getState().events)) {
    if (key.startsWith('habit:')) jobs.push([key, alive.has(key.slice(6)) ? habitSpecs(key.slice(6)) : []]);
    else if (key.startsWith('item:') && !study.items[key.slice(5)]) jobs.push([key, []]);
    else if (key.startsWith('course:') && !study.courses[key.slice(7)]) jobs.push([key, []]);
  }
  const seen = new Set<string>();
  let count = 0;
  let first: CalResult = 'ok';
  for (const [key, specs] of jobs) {
    if (seen.has(key)) continue;
    seen.add(key);
    const r = await upsertCalendarEvents(key, specs);
    if (r === 'denied' || r === 'error') {
      first = r;
      if (r === 'denied') break;
    } else count += specs.length;
  }
  return { result: first, count };
}
