/**
 * Gelişim bildirimleri (grup 'growth'): hafta içi 08:30 "3 önemli işin", Cuma 17:00 haftalık değerlendirme.
 */
import type { Weekday } from '../../engine/types';
import { translate } from '../../i18n';
import { scheduleGroup, type NotifItem } from '../../lib/notifications';
import { useGrowth } from '../../store/slices/growth';
import type { GrowthSettings } from './types';

export function buildGrowthNotifs(settings: GrowthSettings): NotifItem[] {
  const out: NotifItem[] = [];
  if (settings.morningTop3) {
    for (const d of [0, 1, 2, 3, 4] as Weekday[]) {
      out.push({
        title: translate('growth.notif.topTitle'),
        body: translate('growth.notif.topBody'),
        url: '/growth?tab=today',
        trigger: { kind: 'weekly', weekday: d, hour: 8, minute: 30 },
      });
    }
  }
  if (settings.fridayReview) {
    out.push({
      title: translate('growth.notif.reviewTitle'),
      body: translate('growth.notif.reviewBody'),
      url: '/growth?tab=review',
      trigger: { kind: 'weekly', weekday: 4, hour: 17, minute: 0 },
    });
  }
  return out;
}

let timer: ReturnType<typeof setTimeout> | null = null;
export function syncGrowthNotifs() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void scheduleGroup('growth', buildGrowthNotifs(useGrowth.getState().settings));
  }, 800);
}

let started = false;
export function ensureGrowthNotifSync() {
  if (started) return;
  started = true;
  useGrowth.subscribe((s, p) => {
    if (s.settings !== p.settings) syncGrowthNotifs();
  });
  if (useGrowth.getState().hydrated) syncGrowthNotifs();
}
