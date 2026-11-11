/** Takvim seçimini uygular ve sonucu toast ile bildirir (web'de sessizce çıkar). */
import { calendarSupported, isInCalendar, removeCalendarKey, upsertCalendarEvents, type CalResult } from '../../lib/calendar';
import type { EventSpec } from '../../lib/calendarSpec';
import { useCore } from '../../store/core';

const toast = (r: CalResult, okKey: string) => {
  const key = r === 'ok' ? okKey : r === 'denied' ? 'settings.calendar.toast.denied' : r === 'unsupported' ? 'settings.calendar.toast.unsupported' : 'settings.calendar.toast.error';
  useCore.getState().pushToast({ key, emoji: r === 'ok' ? '📅' : '⚠️' });
};

/** on + specs -> yaz/güncelle; kapalıysa ve eşleme varsa kaldır. */
export async function applyCalendar(key: string, on: boolean, specs: EventSpec[]): Promise<void> {
  if (!calendarSupported()) return;
  if (on && specs.length > 0) toast(await upsertCalendarEvents(key, specs), 'settings.calendar.toast.saved');
  else if (isInCalendar(key)) toast(await removeCalendarKey(key), 'settings.calendar.toast.removed');
}

/** Kaynak silinince: sessizce kaldır. */
export function dropCalendar(key: string): void {
  if (isInCalendar(key)) void removeCalendarKey(key);
}
