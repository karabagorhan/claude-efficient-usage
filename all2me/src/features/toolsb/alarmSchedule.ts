import type { Weekday } from '../../engine/types';
import { translate } from '../../i18n';
import { scheduleGroup, type NotifItem } from '../../lib/notifications';
import type { AlarmItem } from '../../store/slices/alarm';

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

/** Tüm etkin alarmları 'alarm' grubuna kurar (grubu değiştirir). */
export async function rescheduleAlarms(alarms: AlarmItem[]): Promise<boolean> {
  const items: NotifItem[] = [];
  for (const a of alarms) {
    if (!a.enabled) continue;
    const base = { title: a.label ? `⏰ ${a.label}` : `⏰ ${translate('alarm.notifTitle')}`, body: translate('alarm.notifBody'), url: '/tools/alarm' };
    if (a.days.length === 0) {
      const date = a.onceAt ? new Date(a.onceAt) : nextOccurrence(a);
      if (date.getTime() > Date.now()) items.push({ ...base, trigger: { kind: 'date', date } });
    } else if (a.days.length === 7) {
      items.push({ ...base, trigger: { kind: 'daily', hour: a.hour, minute: a.minute } });
    } else {
      for (const d of a.days) items.push({ ...base, trigger: { kind: 'weekly', weekday: d, hour: a.hour, minute: a.minute } });
    }
  }
  return scheduleGroup('alarm', items);
}
