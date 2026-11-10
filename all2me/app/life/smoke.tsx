import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Bar, Card, Chip, Header, IconButton, PillButton, Row, Screen, SectionHeader, Segmented, Spacer, Txt, press, success } from '../../src/components/ui';
import { RingGauge } from '../../src/components/RingGauge';
import { pickMessage } from '../../src/data/lifeMessages';
import { addDays, dayKeyOf, eachDay, weekdayOf } from '../../src/engine/dates';
import { smokeCloseDay, smokeLog, smokeResist } from '../../src/features/life/actions';
import {
  STREAK_MILESTONES, canCloseDay, dayCounts, elapsedParts, hardestHours, limitStreaks, moneyMilestonesFor, moneySaved, nextMilestone,
  nextReduction, planEndDay, reductionLimit, smokeTone, triggerCounts, unsmokedCount,
} from '../../src/features/life/calc';
import { DayBars, HourBars } from '../../src/features/life/charts';
import { fmtMoney, fmtNum, useNow } from '../../src/features/life/hooks';
import { notifySmoke } from '../../src/features/life/notify';
import { SmokeSetup } from '../../src/features/life/SmokeSetup';
import { SMOKE_TRIGGERS, TRIGGER_EMOJI, type SmokeTrigger } from '../../src/features/life/types';
import { HBar, MessageCard, Sheet, Stat, TimeStepper, ToggleRow } from '../../src/features/life/ui';
import { DAYS_SHORT, L, fmtDay, fmtTime, useLang, useT } from '../../src/i18n';
import { routes } from '../../src/lib/routes';
import { useSmoke } from '../../src/store/slices/smoke';
import { radius, useTheme } from '../../src/theme';

const CRAVING_MS = 5 * 60 * 1000;
const SUPPORT_HOURS = [9, 11, 13, 15, 17, 19, 21];

export default function SmokeScreen() {
  const t = useT();
  const hydrated = useSmoke((s) => s.hydrated);
  const plan = useSmoke((s) => s.plan);
  const pricing = useSmoke((s) => s.pricing);

  if (!hydrated) return <Screen header={<Header title={t('life.smoke.title')} large />}>{null}</Screen>;
  if (!plan) {
    return (
      <Screen header={<Header title={t('life.smoke.setup.title')} large />}>
        <SmokeSetup
          initialPlan={null}
          initialPricing={null}
          isEdit={false}
          onSave={(p, pr) => {
            useSmoke.getState().setup(p, pr);
            success();
          }}
        />
      </Screen>
    );
  }
  return <Dashboard plan={plan} pricing={pricing} />;
}

function Dashboard({ plan, pricing }: { plan: NonNullable<ReturnType<typeof useSmoke.getState>['plan']>; pricing: ReturnType<typeof useSmoke.getState>['pricing'] }) {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const logsMap = useSmoke((s) => s.logs);
  const resistsMap = useSmoke((s) => s.resists);
  const closed = useSmoke((s) => s.closed);
  const craving = useSmoke((s) => s.craving);
  const startedAt = useSmoke((s) => s.startedAt);
  const remind = useSmoke((s) => s.remind);
  const [range, setRange] = useState<'7' | '30'>('7');
  const [settings, setSettings] = useState(false);
  const [editPlan, setEditPlan] = useState(false);

  const now = useNow(craving ? 1000 : 30000);
  const nowDate = useMemo(() => new Date(now), [now]);
  const day = dayKeyOf(nowDate);

  const logs = useMemo(() => Object.values(logsMap), [logsMap]);
  const counts = useMemo(() => dayCounts(logs), [logs]);
  const count = counts[day] ?? 0;
  const limit = reductionLimit(plan, day);
  const tomorrowLimit = reductionLimit(plan, addDays(day, 1));
  const isClosed = !!closed[day];
  const resistedToday = useMemo(() => Object.values(resistsMap).filter((r) => r.dayKey === day).length, [resistsMap, day]);

  // yeniden bildirim kurulumu (dil değişince metinler güncellensin)
  useEffect(() => {
    if (remind.support || remind.closing) void notifySmoke();
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // son sigara
  const lastLog = useMemo(() => [...logs].sort((a, b) => (a.at < b.at ? 1 : -1))[0], [logs]);
  const sinceMs = now - new Date(lastLog?.at ?? startedAt ?? now).getTime();
  const parts = elapsedParts(sinceMs);
  const sinceText =
    parts.d > 0 ? t('life.smoke.elapsedD', { d: parts.d, h: parts.h }) : parts.h > 0 ? t('life.smoke.elapsedH', { h: parts.h, m: parts.m }) : t('life.smoke.elapsedM', { m: parts.m });
  const lastToday = lastLog && lastLog.dayKey === day ? lastLog : null;

  // istatistikler
  const upTo = isClosed ? day : addDays(day, -1);
  const unsmoked = unsmokedCount(plan, counts, upTo);
  const saved = moneySaved(unsmoked, pricing.packPrice, pricing.packSize);
  const streaks = limitStreaks(plan, counts, day, isClosed);
  const totalResists = Object.keys(resistsMap).length;
  const hours = useMemo(() => hardestHours(logs), [logs]);
  const trig = useMemo(() => triggerCounts(logs), [logs]);
  const money = (n: number) => fmtMoney(n, pricing.currency, lang);

  const n = range === '7' ? 7 : 30;
  const bars = useMemo(
    () =>
      eachDay(addDays(day, -(n - 1)), day).map((k) => ({
        label: n === 7 ? DAYS_SHORT[lang][weekdayOf(k)] : String(Number(k.slice(8))),
        value: counts[k] ?? 0,
        limit: k >= plan.startDay ? reductionLimit(plan, k) : undefined,
        highlight: k === day,
      })),
    [n, day, counts, plan, lang],
  );

  const tone = smokeTone(count, limit);
  const msg = L(pickMessage('smoke', tone, day), lang);
  const ringColor = count > limit ? th.coral : count === limit ? th.warn : th.success;
  const canClose = canCloseDay(nowDate);
  const next = nextReduction(plan, day);

  const addCig = () => {
    press();
    smokeLog();
    if (useSmoke.getState().craving) useSmoke.getState().stopCraving();
  };
  const startCraving = () => useSmoke.getState().startCraving(Date.now() + CRAVING_MS);
  const remaining = craving ? Math.max(0, craving - now) : 0;
  const mmss = `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}`;

  const moneyMs = moneyMilestonesFor(pricing.currency);
  const moneyM = nextMilestone(moneyMs, saved);
  const streakM = nextMilestone(STREAK_MILESTONES, streaks.best);

  return (
    <Screen
      header={<Header title={t('life.smoke.title')} large right={<IconButton icon="settings-outline" label={t('life.smoke.settings.title')} onPress={() => setSettings(true)} />} />}
    >
      <MessageCard text={msg} pastel="mint" emoji="🌱" />
      <Spacer h={12} />

      {/* Bugün */}
      <Card>
        <Row gap={16}>
          <RingGauge value={limit > 0 ? count / limit : count > 0 ? 1 : 0} size={148} stroke={14} color={ringColor} label={`${count}/${limit}`} sublabel={t('life.smoke.todayCount')} />
          <View style={{ flex: 1 }}>
            <Txt variant="small" dim>
              {lastLog ? t('life.smoke.sinceLast') : t('life.smoke.sinceStart')}
            </Txt>
            <Txt variant="h2" numberOfLines={2}>
              {sinceText}
            </Txt>
            <Spacer h={8} />
            <Txt variant="small" dim>
              {t('life.smoke.limitToday', { n: limit })}
            </Txt>
            <Txt variant="small" dim>
              {t('life.smoke.limitTomorrow', { n: tomorrowLimit })}
            </Txt>
            {resistedToday > 0 ? (
              <Txt variant="small" color={th.success} weight="700">
                {t('life.smoke.resistedToday', { n: resistedToday })}
              </Txt>
            ) : null}
          </View>
        </Row>
      </Card>

      {/* Hızlı kayıt */}
      <Spacer h={12} />
      <PillButton label={t('life.smoke.logOne')} icon="add-circle-outline" onPress={addCig} />
      {lastToday ? (
        <Card style={{ marginTop: 12 }}>
          <Row between>
            <Txt variant="bodyBold">{t('life.smoke.lastEntry', { time: fmtTime(new Date(lastToday.at).toTimeString().slice(0, 5), lang) })}</Txt>
            <Chip label={t('task.undo')} onPress={() => useSmoke.getState().undoLast(day)} />
          </Row>
          <Txt variant="small" dim style={{ marginTop: 2, marginBottom: 8 }}>
            {t('life.smoke.triggerAsk')}
          </Txt>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {SMOKE_TRIGGERS.map((k) => (
              <Chip
                key={k}
                emoji={TRIGGER_EMOJI[k]}
                label={t(`life.smoke.trigger.${k}`)}
                active={lastToday.trigger === k}
                onPress={() => useSmoke.getState().setTrigger(lastToday.id, lastToday.trigger === k ? undefined : (k as SmokeTrigger))}
              />
            ))}
          </Row>
        </Card>
      ) : null}

      {/* İstek geldi */}
      <Spacer h={12} />
      {craving ? (
        <Card bg={th.pastel.purple}>
          <Txt variant="small" color={th.onPastel}>
            {t('life.smoke.craving.title')}
          </Txt>
          <Txt variant="display" color={th.onPastel} center style={{ marginVertical: 4 }}>
            {mmss}
          </Txt>
          <Bar value={1 - remaining / CRAVING_MS} color={th.purple} height={10} />
          <Txt variant="body" color={th.onPastel} center style={{ marginTop: 10 }}>
            {remaining > 0 ? t('life.smoke.craving.hold') : t('life.smoke.craving.done')}
          </Txt>
          <Spacer h={12} />
          <PillButton label={t('life.smoke.craving.breathe')} kind="outline" icon="leaf-outline" onPress={() => router.push(routes.tool('meditate'))} />
          <Spacer h={8} />
          <PillButton
            label={t('life.smoke.craving.resisted')}
            onPress={() => {
              const r = smokeResist();
              useSmoke.getState().stopCraving();
              if (r.ok) success();
            }}
          />
          <Spacer h={4} />
          <PillButton label={t('life.smoke.craving.smoked')} kind="ghost" onPress={addCig} />
        </Card>
      ) : (
        <PillButton label={t('life.smoke.craving.start')} kind="outline" icon="hand-left-outline" onPress={startCraving} />
      )}

      {/* Günü kapat */}
      <Spacer h={12} />
      <Card bg={isClosed ? th.pastel.green : undefined}>
        {isClosed ? (
          <Txt variant="bodyBold" color={th.onPastel}>
            ✅ {t('life.smoke.closedDone')}
          </Txt>
        ) : count > limit ? (
          <>
            <Txt variant="bodyBold">{t('life.smoke.overTitle')}</Txt>
            <Txt dim>{t('life.smoke.overBody')}</Txt>
          </>
        ) : (
          <>
            <Txt variant="bodyBold">{t('life.smoke.closeTitle')}</Txt>
            <Txt variant="small" dim style={{ marginBottom: 10 }}>
              {canClose ? t('life.smoke.closeHint', { n: count, limit }) : t('life.smoke.closeLater')}
            </Txt>
            <PillButton
              label={t('life.smoke.closeBtn')}
              disabled={!canClose}
              onPress={() => {
                smokeCloseDay();
                success();
              }}
            />
          </>
        )}
      </Card>

      {/* İstatistik */}
      <Spacer h={20} />
      <SectionHeader title={t('life.smoke.stats.title')} />
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { id: '7', label: t('life.smoke.stats.days7') },
          { id: '30', label: t('life.smoke.stats.days30') },
        ]}
      />
      <Card style={{ marginTop: 12 }}>
        <DayBars data={bars} color={th.purple} over={th.coral} />
        <Txt variant="caption" dim style={{ marginTop: 8 }}>
          {t('life.smoke.stats.legend')}
        </Txt>
      </Card>

      <Row gap={12} style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <Stat emoji="🚭" value={fmtNum(unsmoked, lang)} label={t('life.smoke.stats.unsmoked')} pastel="mint" />
        <Stat emoji="💰" value={money(saved)} label={t('life.smoke.stats.saved')} pastel="yellow" />
      </Row>
      <Row gap={12} style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <Stat emoji="🔥" value={t('life.smoke.stats.daysN', { n: streaks.current })} label={t('life.smoke.stats.streak')} pastel="peach" />
        <Stat emoji="🏅" value={t('life.smoke.stats.daysN', { n: streaks.best })} label={t('life.smoke.stats.best')} pastel="blue" />
      </Row>
      <Row gap={12} style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <Stat emoji="✋" value={fmtNum(totalResists, lang)} label={t('life.smoke.stats.resists')} pastel="purple" />
        <Stat emoji="📉" value={t('life.smoke.stats.perDayNow', { n: limit })} label={t('life.smoke.stats.limitNow')} pastel="pink" />
      </Row>

      {/* Plan */}
      <Card style={{ marginTop: 12 }}>
        <Row between>
          <Txt variant="h3">{t('life.smoke.plan.title')}</Txt>
          <Chip label={t('common.btn.edit')} onPress={() => setEditPlan(true)} />
        </Row>
        <Txt dim style={{ marginTop: 6 }}>
          {t('life.smoke.plan.summary', { a: plan.startPerDay, b: plan.goalPerDay, n: plan.everyDays })}
        </Txt>
        <Txt dim>{next ? t('life.smoke.plan.next', { date: fmtDay(next.day, lang, 'short'), n: next.limit }) : t('life.smoke.plan.atGoal')}</Txt>
        {!next ? null : <Txt dim>{t('life.smoke.plan.end', { date: fmtDay(planEndDay(plan), lang, 'short'), n: plan.goalPerDay })}</Txt>}
      </Card>

      {/* Tetikleyiciler */}
      <Card style={{ marginTop: 12 }}>
        <Txt variant="h3" style={{ marginBottom: 6 }}>
          {t('life.smoke.stats.triggers')}
        </Txt>
        {trig.length === 0 ? (
          <Txt dim>{t('life.smoke.stats.triggersEmpty')}</Txt>
        ) : (
          trig.map((x) => <HBar key={x.trigger} emoji={TRIGGER_EMOJI[x.trigger]} label={t(`life.smoke.trigger.${x.trigger}`)} value={x.count} max={trig[0].count} color={th.purple} />)
        )}
      </Card>

      {/* En zor saatler */}
      <Card style={{ marginTop: 12 }}>
        <Txt variant="h3">{t('life.smoke.stats.hours')}</Txt>
        {hours.top.length === 0 ? (
          <Txt dim style={{ marginTop: 4 }}>
            {t('life.smoke.stats.hoursEmpty')}
          </Txt>
        ) : (
          <>
            <Txt dim style={{ marginTop: 4, marginBottom: 10 }}>
              {t('life.smoke.stats.hoursTop', { list: hours.top.map((h) => fmtTime(`${String(h).padStart(2, '0')}:00`, lang)).join(', ') })}
            </Txt>
            <HourBars hist={hours.hist} top={hours.top} color={th.coral} />
          </>
        )}
      </Card>

      {/* Kilometre taşları */}
      <Card style={{ marginTop: 12 }}>
        <Txt variant="h3" style={{ marginBottom: 10 }}>
          {t('life.smoke.milestones.title')}
        </Txt>
        <Txt variant="bodyBold">{t('life.smoke.milestones.money')}</Txt>
        <Row gap={8} style={{ flexWrap: 'wrap', marginVertical: 8 }}>
          {moneyMs.map((m) => (
            <Chip key={m} label={`${moneyM.reached.includes(m) ? '✓ ' : ''}${fmtMoney(m, pricing.currency, lang)}`} active={moneyM.reached.includes(m)} color={th.success} />
          ))}
        </Row>
        {moneyM.next ? (
          <>
            <Bar value={saved / moneyM.next} color={th.success} />
            <Txt variant="small" dim style={{ marginTop: 4 }}>
              {t('life.smoke.milestones.next', { v: money(moneyM.next - saved) })}
            </Txt>
          </>
        ) : null}
        <Spacer h={12} />
        <Txt variant="bodyBold">{t('life.smoke.milestones.streak')}</Txt>
        <Row gap={8} style={{ flexWrap: 'wrap', marginVertical: 8 }}>
          {STREAK_MILESTONES.map((m) => (
            <Chip key={m} label={`${streakM.reached.includes(m) ? '✓ ' : ''}${t('life.smoke.stats.daysN', { n: m })}`} active={streakM.reached.includes(m)} color={th.coral} />
          ))}
        </Row>
        {streakM.next ? (
          <>
            <Bar value={streaks.current / streakM.next} color={th.coral} />
            <Txt variant="small" dim style={{ marginTop: 4 }}>
              {t('life.smoke.milestones.nextDays', { n: streakM.next - streaks.current })}
            </Txt>
          </>
        ) : null}
      </Card>

      <Spacer h={16} />
      <Txt variant="caption" dim center>
        {t('life.smoke.supportNote')} {t('common.medicalNote')}
      </Txt>

      <SettingsSheet visible={settings} onClose={() => setSettings(false)} />
      <Sheet visible={editPlan} title={t('life.smoke.plan.edit')} onClose={() => setEditPlan(false)}>
        <SmokeSetup
          initialPlan={plan}
          initialPricing={pricing}
          isEdit
          onSave={(p, pr) => {
            useSmoke.getState().setup(p, pr);
            setEditPlan(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const remind = useSmoke((s) => s.remind);
  const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<typeof remind>) => {
    useSmoke.getState().setRemind(patch);
    void notifySmoke();
  };
  const toggleHour = (h: number) => set({ hours: remind.hours.includes(h) ? remind.hours.filter((x) => x !== h) : [...remind.hours, h].sort((a, b) => a - b) });
  return (
    <Sheet visible={visible} title={t('life.smoke.settings.title')} onClose={onClose}>
      <Txt variant="h3">{t('life.smoke.settings.reminders')}</Txt>
      <ToggleRow label={t('life.smoke.settings.support')} hint={t('life.smoke.settings.supportHint')} value={remind.support} onChange={(v) => set({ support: v })} />
      {remind.support ? (
        <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: 8 }}>
          {SUPPORT_HOURS.map((h) => (
            <Chip key={h} label={fmtTime(`${String(h).padStart(2, '0')}:00`, lang)} active={remind.hours.includes(h)} onPress={() => toggleHour(h)} />
          ))}
        </Row>
      ) : null}
      <ToggleRow label={t('life.smoke.settings.closing')} hint={t('life.smoke.settings.closingHint')} value={remind.closing} onChange={(v) => set({ closing: v })} />
      <TimeStepper label={t('life.smoke.settings.closingTime')} value={remind.closingTime} disabled={!remind.closing} onChange={(v) => set({ closingTime: v })} />
      <Txt variant="small" dim style={{ marginTop: 6 }}>
        {t('life.smoke.settings.notifNote')}
      </Txt>

      <Spacer h={20} />
      <Txt variant="h3">{t('life.smoke.settings.data')}</Txt>
      <Spacer h={8} />
      {confirm ? (
        <View style={{ backgroundColor: th.pastel.pink, borderRadius: radius.lg, padding: 14 }}>
          <Txt variant="bodyBold" color={th.onPastel}>
            {t('life.smoke.settings.resetWarn')}
          </Txt>
          <Spacer h={10} />
          <PillButton
            label={t('life.smoke.settings.resetConfirm')}
            color={th.danger}
            onPress={() => {
              useSmoke.getState().reset();
              void notifySmoke();
              setConfirm(false);
              onClose();
            }}
          />
          <Spacer h={6} />
          <PillButton label={t('common.btn.cancel')} kind="ghost" onPress={() => setConfirm(false)} />
        </View>
      ) : (
        <PillButton label={t('life.smoke.settings.reset')} kind="outline" onPress={() => setConfirm(true)} />
      )}
    </Sheet>
  );
}
