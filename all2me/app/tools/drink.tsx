import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card, Chip, Field, Header, PillButton, Row, Screen, Txt, press, success } from '../../src/components/ui';
import { addDays, dayKeyOf, weekdayOf } from '../../src/engine/dates';
import { BarChart } from '../../src/features/tools/BarChart';
import { DropFill } from '../../src/features/tools/DropFill';
import { fromMl, goalStep, quickAmounts, toMl } from '../../src/features/tools/units';
import { DAYS_SHORT, fmtTime, useLang, useT } from '../../src/i18n';
import { scheduleGroup } from '../../src/lib/notifications';
import { routes } from '../../src/lib/routes';
import { myHabits, useCore } from '../../src/store/core';
import { useSettings } from '../../src/store/settings';
import { useDrink, type DrinkReminder } from '../../src/store/slices/drink';
import { radius, useTheme } from '../../src/theme';

function syncCore(totalMl: number, goalMl: number) {
  const core = useCore.getState();
  const habit = myHabits(core).find((h) => h.link === 'drink');
  const target = habit ? (habit.kind === 'check' ? 1 : (habit.target ?? 1)) : 1;
  const pct = Math.min(1, totalMl / goalMl);
  const value = pct >= 1 ? target : Math.floor(pct * target);
  const c = core.setLinkedProgress('drink', value);
  if (pct >= 1) core.completeLinked('drink');
  if (c && habit) core.pushToast('toast.completedTitle', { title: habit.title, points: c.points });
  const d = useDrink.getState();
  const day = dayKeyOf();
  if (totalMl > 0 && d.activityDay !== day) {
    core.logActivity('drink', day);
    d.markActivity(day);
  }
}

export default function DrinkScreen() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const units = useSettings((s) => s.units);
  const unit = t(`common.unit.${units}`);
  const entries = useDrink((s) => s.entries);
  const goalMl = useDrink((s) => s.goalMl);
  const reminder = useDrink((s) => s.reminder);
  const day = dayKeyOf();
  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const todayList = useMemo(
    () => Object.values(entries).filter((e) => e.dayKey === day).sort((a, b) => (a.at < b.at ? 1 : -1)),
    [entries, day],
  );
  const total = todayList.reduce((a, e) => a + e.ml, 0);
  const week = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const k = addDays(day, -i);
      const ml = Object.values(entries).reduce((a, e) => (e.dayKey === k ? a + e.ml : a), 0);
      out.push({ k, ml });
    }
    return out;
  }, [entries, day]);
  const avg = Math.round(week.reduce((a, w) => a + w.ml, 0) / 7);

  const add = (ml: number) => {
    press();
    useDrink.getState().add(ml);
    const s = useDrink.getState();
    const tot = Object.values(s.entries).reduce((a, e) => (e.dayKey === day ? a + e.ml : a), 0);
    syncCore(tot, s.goalMl);
    if (tot >= s.goalMl && total < s.goalMl) success();
  };
  const undo = () => {
    const d = useDrink.getState();
    if (!d.undoLast(day)) return;
    const tot = Object.values(useDrink.getState().entries).reduce((a, e) => (e.dayKey === day ? a + e.ml : a), 0);
    useCore.getState().setLinkedProgress('drink', 0);
    if (tot > 0) syncCore(tot, d.goalMl);
  };

  const q = quickAmounts(units);

  const applyReminder = async (r: DrinkReminder) => {
    useDrink.getState().setReminder(r);
    if (r === 0) {
      await scheduleGroup('drink', []);
      return;
    }
    const items = [];
    for (let h = 9; h <= 21; h += r) {
      items.push({
        title: t('drink.reminder.notifTitle'),
        body: t('drink.reminder.notifBody'),
        url: routes.tool('drink'),
        trigger: { kind: 'daily' as const, hour: h, minute: 0 },
      });
    }
    await scheduleGroup('drink', items);
  };
  useEffect(() => {
    // dil değişince bildirim metinleri güncellensin
    if (reminder) void applyReminder(reminder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const reminderOpts: Array<{ v: DrinkReminder; label: string }> = [
    { v: 0, label: t('drink.reminder.off') },
    { v: 1, label: t('drink.reminder.every', { n: 1 }) },
    { v: 2, label: t('drink.reminder.every', { n: 2 }) },
    { v: 3, label: t('drink.reminder.every', { n: 3 }) },
  ];

  const step = goalStep(units);
  const reached = total >= goalMl;

  return (
    <Screen header={<Header title={t('drink.title')} />}>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <View>
          <DropFill value={total / goalMl} size={190} />
          <View style={{ position: 'absolute', left: 0, right: 0, top: 80, alignItems: 'center' }}>
            <Txt variant="display" color={total / goalMl > 0.6 ? '#fff' : th.text}>
              {fromMl(total, units)}
            </Txt>
            <Txt variant="small" color={total / goalMl > 0.5 ? '#ffffffdd' : undefined} dim={total / goalMl <= 0.5}>
              {unit}
            </Txt>
          </View>
        </View>
        <Txt variant="bodyBold" style={{ marginTop: 6 }}>
          {reached ? t('drink.reached') : t('drink.remaining', { n: fromMl(goalMl - total, units), unit })}
        </Txt>
      </View>

      {/* Hedef */}
      <Card style={{ marginTop: 18 }}>
        <Row between>
          <View>
            <Txt variant="small" dim>
              {t('drink.goalTitle')}
            </Txt>
            <Txt variant="h3">{t('drink.amountOf', { a: fromMl(total, units), b: fromMl(goalMl, units), unit })}</Txt>
          </View>
          <Row gap={10}>
            {[-1, 1].map((d) => (
              <Pressable
                key={d}
                accessibilityLabel={t('drink.goalHint')}
                onPress={() => useDrink.getState().setGoal(goalMl + d * step)}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: th.cardAlt, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={d < 0 ? 'remove' : 'add'} size={22} color={th.text} />
              </Pressable>
            ))}
          </Row>
        </Row>
      </Card>

      {/* Hızlı ekleme */}
      <Row gap={10} style={{ marginTop: 14 }}>
        {[
          { label: t('drink.glass'), emoji: '🥛', ml: q.glass },
          { label: t('drink.bottle'), emoji: '🍼', ml: q.bottle },
        ].map((b) => (
          <Pressable
            key={b.label}
            onPress={() => add(b.ml)}
            style={({ pressed }) => ({ flex: 1, backgroundColor: th.pastel.blue, borderRadius: radius.lg, padding: 14, alignItems: 'center', opacity: pressed ? 0.8 : 1 })}
          >
            <Txt style={{ fontSize: 30 }}>{b.emoji}</Txt>
            <Txt variant="bodyBold" color={th.onPastel}>
              {b.label}
            </Txt>
            <Txt variant="caption" color={th.onPastel}>
              +{fromMl(b.ml, units)} {unit}
            </Txt>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setCustom((v) => !v)}
          style={({ pressed }) => ({ flex: 1, backgroundColor: th.pastel.mint, borderRadius: radius.lg, padding: 14, alignItems: 'center', opacity: pressed ? 0.8 : 1 })}
        >
          <Txt style={{ fontSize: 30 }}>➕</Txt>
          <Txt variant="bodyBold" color={th.onPastel}>
            {t('drink.custom')}
          </Txt>
          <Txt variant="caption" color={th.onPastel}>
            {unit}
          </Txt>
        </Pressable>
      </Row>
      {custom ? (
        <View style={{ marginTop: 12 }}>
          <Field
            label={t('drink.customTitle', { unit })}
            placeholder={t('drink.customPlaceholder')}
            keyboardType="numeric"
            value={customVal}
            onChangeText={setCustomVal}
          />
          <PillButton
            label={t('common.btn.add')}
            disabled={!Number(customVal)}
            onPress={() => {
              add(toMl(Number(customVal), units));
              setCustomVal('');
              setCustom(false);
            }}
          />
        </View>
      ) : null}
      {todayList.length ? (
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <PillButton label={t('drink.undo')} icon="arrow-undo" kind="ghost" small onPress={undo} />
        </View>
      ) : null}

      {/* Bugünün kayıtları */}
      <Txt variant="h3" style={{ marginTop: 18, marginBottom: 8 }}>
        {t('drink.todayLog')}
      </Txt>
      <Card padding={todayList.length ? 6 : 16}>
        {todayList.length === 0 ? (
          <Txt dim>{t('drink.empty')}</Txt>
        ) : (
          todayList.map((e, i) => (
            <Row
              key={e.id}
              between
              style={{ paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderColor: th.border }}
            >
              <Row gap={10}>
                <Txt>💧</Txt>
                <Txt variant="bodyBold">
                  {fromMl(e.ml, units)} {unit}
                </Txt>
              </Row>
              <Txt dim>{fmtTime(e.at.length ? `${String(new Date(e.at).getHours()).padStart(2, '0')}:${String(new Date(e.at).getMinutes()).padStart(2, '0')}` : '00:00', lang)}</Txt>
            </Row>
          ))
        )}
      </Card>

      {/* 7 gün */}
      <Txt variant="h3" style={{ marginTop: 22, marginBottom: 8 }}>
        {t('drink.week')}
      </Txt>
      <Card>
        <BarChart
          color={th.blue}
          goal={goalMl}
          data={week.map((w, i) => ({
            label: DAYS_SHORT[lang][weekdayOf(w.k)],
            value: w.ml,
            valueLabel: w.ml ? String(fromMl(w.ml, units)) : undefined,
            highlight: i === 6,
          }))}
        />
        <Txt variant="small" dim center style={{ marginTop: 10 }}>
          {t('drink.avg', { n: fromMl(avg, units), unit })}
        </Txt>
      </Card>

      {/* Hatırlatıcı */}
      <Txt variant="h3" style={{ marginTop: 22 }}>
        {t('drink.reminder.title')}
      </Txt>
      <Txt variant="small" dim style={{ marginBottom: 10 }}>
        {t('drink.reminder.hint')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {reminderOpts.map((o) => (
          <Chip key={o.v} label={o.label} active={reminder === o.v} onPress={() => void applyReminder(o.v)} />
        ))}
      </View>
      <Txt variant="caption" faint style={{ marginTop: 18 }}>
        {t('common.medicalNote')}
      </Txt>
    </Screen>
  );
}
