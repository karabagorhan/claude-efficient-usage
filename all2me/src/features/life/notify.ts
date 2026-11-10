// Yerel bildirimler: her takipçi kendi grubunu (smoke | meals | chores) durumdan yeniden kurar.
import { pickMessage } from '../../data/lifeMessages';
import { L, translate } from '../../i18n';
import { parseHHMM, scheduleGroup, type NotifItem } from '../../lib/notifications';
import { routes } from '../../lib/routes';
import { useChores } from '../../store/slices/chores';
import { useMeals } from '../../store/slices/meals';
import { useSmoke } from '../../store/slices/smoke';
import type { Weekday } from '../../engine/types';

const hm = (s: string) => {
  const { hour, minute } = parseHHMM(s);
  return { hour: Number.isFinite(hour) ? hour : 9, minute: Number.isFinite(minute) ? minute : 0 };
};

export async function notifySmoke(): Promise<boolean> {
  const { plan, remind } = useSmoke.getState();
  const items: NotifItem[] = [];
  if (plan) {
    if (remind.support) {
      for (const h of remind.hours) {
        items.push({
          title: translate('life.smoke.notif.supportTitle'),
          body: L(pickMessage('smoke', 'mid', `n${h}`)),
          url: routes.life('smoke'),
          trigger: { kind: 'daily', hour: h, minute: 0 },
        });
      }
    }
    if (remind.closing) {
      items.push({
        title: translate('life.smoke.notif.closeTitle'),
        body: translate('life.smoke.notif.closeBody'),
        url: routes.life('smoke'),
        trigger: { kind: 'daily', ...hm(remind.closingTime) },
      });
    }
  }
  return scheduleGroup('smoke', items);
}

export async function notifyMeals(): Promise<boolean> {
  const { remind } = useMeals.getState();
  const items: NotifItem[] = [];
  if (remind.dinner) {
    items.push({
      title: translate('life.meals.notif.dinnerTitle'),
      body: translate('life.meals.notif.dinnerBody'),
      url: routes.life('meals'),
      trigger: { kind: 'daily', ...hm(remind.dinnerTime) },
    });
  }
  if (remind.prep) {
    items.push({
      title: translate('life.meals.notif.prepTitle'),
      body: translate('life.meals.notif.prepBody'),
      url: routes.life('meals'),
      trigger: { kind: 'weekly', weekday: remind.prepWeekday as Weekday, ...hm(remind.prepTime) },
    });
  }
  return scheduleGroup('meals', items);
}

/** Günlük kontrol + çalışan makine sayaçlarının bitiş bildirimleri (aynı grupta). */
export async function notifyChores(): Promise<boolean> {
  const { remind, flows } = useChores.getState();
  const items: NotifItem[] = [];
  if (remind.on) {
    items.push({
      title: translate('life.chores.notif.dailyTitle'),
      body: translate('life.chores.notif.dailyBody'),
      url: routes.life('chores'),
      trigger: { kind: 'daily', ...hm(remind.time) },
    });
  }
  const now = Date.now();
  (['laundry', 'dish'] as const).forEach((k) => {
    const end = flows[k].endsAt;
    if (end && end > now + 5000) {
      items.push({
        title: translate(`life.chores.notif.${k}Title`),
        body: translate(`life.chores.notif.${k}Body`),
        url: routes.life('chores'),
        trigger: { kind: 'date', date: new Date(end) },
      });
    }
  });
  return scheduleGroup('chores', items);
}
