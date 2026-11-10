/**
 * Okul bildirimleri (grup 'study'). Her değişiklikte grubun tamamı yeniden kurulur:
 * öğe bazında 1 gün önce + aynı sabah (yalnız gelecek anlar), haftalık planlama Pazar 20:00.
 */
import { translate } from '../../i18n';
import { scheduleGroup, type NotifItem } from '../../lib/notifications';
import { routes } from '../../lib/routes';
import { useStudy } from '../../store/slices/study';
import { reminderTimes } from './calc';
import { TYPE_META, type StudyItem, type StudySettings } from './types';

/** iOS planlı bildirim sınırına (64) takılmamak için en yakın N öğe anı. */
const MAX_ITEM_NOTIFS = 40;

export function buildStudyNotifs(items: StudyItem[], settings: StudySettings, now: Date = new Date()): NotifItem[] {
  const out: NotifItem[] = [];
  if (settings.remindItems) {
    const all: Array<{ it: StudyItem; kind: 'dayBefore' | 'morning'; date: Date }> = [];
    for (const it of items) for (const r of reminderTimes(it, now)) all.push({ it, ...r });
    all.sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const { it, kind, date } of all.slice(0, MAX_ITEM_NOTIFS)) {
      out.push({
        title: `${TYPE_META[it.type].emoji} ${it.title}`,
        body: translate(kind === 'dayBefore' ? 'study.notif.dayBefore' : 'study.notif.morning', { time: it.time ?? '23:59' }),
        url: routes.studyItem(it.id),
        trigger: { kind: 'date', date },
      });
    }
  }
  if (settings.weeklyPlan) {
    out.push({
      title: translate('study.notif.planTitle'),
      body: translate('study.notif.planBody'),
      url: routes.study(),
      trigger: { kind: 'weekly', weekday: 6, hour: 20, minute: 0 },
    });
  }
  return out;
}

let timer: ReturnType<typeof setTimeout> | null = null;
export function syncStudyNotifs() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const s = useStudy.getState();
    void scheduleGroup('study', buildStudyNotifs(Object.values(s.items), s.settings));
  }, 800);
}

let started = false;
/** Ekranlar açılınca bir kez çağrılır: dilim değiştikçe bildirimleri yeniden kurar. */
export function ensureStudyNotifSync() {
  if (started) return;
  started = true;
  useStudy.subscribe((s, p) => {
    if (s.items !== p.items || s.settings !== p.settings) syncStudyNotifs();
  });
  if (useStudy.getState().hydrated) syncStudyNotifs();
}
