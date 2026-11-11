// Yaşam takipçilerinin çekirdek store ile köprüsü (puan, görev bağlantısı, etkinlik).
import { dayKeyOf } from '../../engine/dates';
import { useCore } from '../../store/core';
import { useChores } from '../../store/slices/chores';
import { useMeals } from '../../store/slices/meals';
import { useSmoke } from '../../store/slices/smoke';
import { notifyChores, notifyMeals, notifySmoke } from './notify';
import type { MealKind, MealSlot, SmokeTrigger } from './types';

const BONUS = { smokeResist: { points: 2, perDay: 5 }, chore: { points: 2, perDay: 6 } };

function completedToast(c: { points: number } | null, key: string) {
  if (c) useCore.getState().pushToast(key, { points: c.points });
}

/** Bir sigara kaydı; etkinlik günde bir kez sayılır. */
export function smokeLog(trigger?: SmokeTrigger) {
  const day = dayKeyOf();
  const s = useSmoke.getState();
  const e = s.log(trigger, day);
  if (s.activityDay !== day) {
    useCore.getState().logActivity('smoke', day);
    useSmoke.getState().markActivity(day);
  }
  return e;
}

/** "İstek geldi, içmedim" → direnme kaydı + küçük bonus (günde en çok 5). */
export function smokeResist(): { ok: boolean; capped: boolean } {
  const day = dayKeyOf();
  const s = useSmoke.getState();
  const r = s.resist(day);
  const res = useCore.getState().awardBonus({
    id: r.id,
    points: BONUS.smokeResist.points,
    labelKey: 'life.smoke.bonusLabel',
    group: 'smoke',
    perDay: BONUS.smokeResist.perDay,
    dayKey: day,
  });
  if (s.activityDay !== day) {
    useCore.getState().logActivity('smoke', day);
    useSmoke.getState().markActivity(day);
  }
  if (res.ok) useCore.getState().pushToast('life.smoke.toast.resisted', { n: res.event.points });
  else if (res.reason === 'cap') useCore.getState().pushToast('life.smoke.toast.cap', { n: BONUS.smokeResist.perDay });
  return { ok: res.ok, capped: !res.ok && res.reason === 'cap' };
}

/** "Bugün limitimde kaldım" */
export function smokeCloseDay() {
  const day = dayKeyOf();
  useSmoke.getState().closeDay(day);
  useCore.getState().logActivity('smokeOk', day);
  const c = useCore.getState().completeLinked('smoke', day);
  completedToast(c, 'life.smoke.toast.closed');
  if (!c) useCore.getState().pushToast('life.smoke.toast.closedNoTask');
}

export function mealLog(p: { slot: MealSlot; kind: MealKind; note?: string; amount?: number }) {
  const day = dayKeyOf();
  const s = useMeals.getState();
  const e = s.add({ ...p, dayKey: day });
  if (s.activityDay !== day) {
    useCore.getState().logActivity('meal', day);
    useMeals.getState().markActivity(day);
  }
  if (p.kind === 'fast') useCore.getState().logActivity('fastFood', day);
  if (p.kind === 'home') {
    const c = useCore.getState().completeLinked('meal', day);
    completedToast(c, 'life.meals.toast.homeDone');
  }
  return e;
}

/** İş yapıldı: son yapılma güncellenir, görev tamamlanır, küçük bonus. */
export function choreDone(id: string): boolean {
  const day = dayKeyOf();
  const s = useChores.getState();
  const log = s.done(id, day);
  if (!log) return false;
  const core = useCore.getState();
  const bonus = core.awardBonus({
    id: `chore:done:${id}:${day}`,
    points: BONUS.chore.points,
    labelKey: 'life.chores.bonusLabel',
    group: 'chore',
    perDay: BONUS.chore.perDay,
    dayKey: day,
  });
  // rozet sayacı: aynı işi aynı gün tekrar işaretlemek sayılmaz
  if (bonus.ok || bonus.reason !== 'duplicate') core.logActivity('choreDone', day);
  if (s.activityDay !== day) {
    core.logActivity('chore', day);
    useChores.getState().markActivity(day);
  }
  const c = core.completeLinked('chore', day);
  completedToast(c, 'life.chores.toast.linkedDone');
  return true;
}

/** Bildirimleri durumdan yeniden kur (dil değişince ya da ayar değişince çağır). */
export function resyncAllReminders() {
  void notifySmoke();
  void notifyMeals();
  void notifyChores();
}
