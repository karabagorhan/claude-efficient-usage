import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Bar, Card, Chip, Field, Header, IconButton, PillButton, Row, Screen, Segmented, Spacer, Txt, press, success } from '../../src/components/ui';
import { RingGauge } from '../../src/components/RingGauge';
import { pickMessage } from '../../src/data/lifeMessages';
import { addDays, dayKeyOf } from '../../src/engine/dates';
import { choreDone } from '../../src/features/life/actions';
import { choreCounts, choresTone, mostPostponed, sortChores, weeklyChoreScore, type ChoreState } from '../../src/features/life/calc';
import { choreName, useNow } from '../../src/features/life/hooks';
import { notifyChores } from '../../src/features/life/notify';
import { AREA_EMOJI, CHORE_AREAS, type Chore, type ChoreArea } from '../../src/features/life/types';
import { HBar, MessageCard, Sheet, Stepper, TimeStepper, ToggleRow } from '../../src/features/life/ui';
import { L, fmtDay, useLang, useT, type TFn } from '../../src/i18n';
import { useCore } from '../../src/store/core';
import { FLOW_STEPS, useChores, type FlowKind } from '../../src/store/slices/chores';
import { radius, useTheme, type PastelKey } from '../../src/theme';

type Tab = 'tasks' | 'flows' | 'stats';
const AREA_PASTEL: Record<ChoreArea, PastelKey> = { kitchen: 'peach', bath: 'blue', bedroom: 'purple', living: 'green', general: 'yellow', laundry: 'mint' };

export default function ChoresScreen() {
  const t = useT();
  const lang = useLang();
  const hydrated = useChores((s) => s.hydrated);
  const remind = useChores((s) => s.remind);
  const [tab, setTab] = useState<Tab>('tasks');
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    void notifyChores();
  }, [lang]);

  return (
    <Screen header={<Header title={t('life.chores.title')} large right={<IconButton icon="settings-outline" label={t('life.chores.settings.title')} onPress={() => setSettings(true)} />} />}>
      {!hydrated ? null : (
        <>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { id: 'tasks', label: t('life.chores.tab.tasks') },
              { id: 'flows', label: t('life.chores.tab.flows') },
              { id: 'stats', label: t('life.chores.tab.stats') },
            ]}
          />
          <Spacer h={14} />
          {tab === 'tasks' ? <TasksTab /> : tab === 'flows' ? <FlowsTab /> : <StatsTab />}
        </>
      )}
      <Sheet visible={settings} title={t('life.chores.settings.title')} onClose={() => setSettings(false)}>
        <ToggleRow
          label={t('life.chores.settings.daily')}
          hint={t('life.chores.settings.dailyHint')}
          value={remind.on}
          onChange={(v) => {
            useChores.getState().setRemind({ on: v });
            void notifyChores();
          }}
        />
        <TimeStepper
          label={t('life.chores.settings.time')}
          value={remind.time}
          disabled={!remind.on}
          onChange={(v) => {
            useChores.getState().setRemind({ time: v });
            void notifyChores();
          }}
        />
        <Txt variant="small" dim style={{ marginTop: 8 }}>
          {t('life.chores.settings.note')}
        </Txt>
      </Sheet>
    </Screen>
  );
}

// ------------------------------------------------------------------ İşler
function statusText(t: TFn, lang: 'tr' | 'en', st: ChoreState, diff: number, due: string): string {
  if (st === 'overdue') return t('life.chores.status.late', { n: -diff });
  if (st === 'today') return t('life.chores.status.today');
  if (st === 'soon') return diff === 1 ? t('life.chores.status.tomorrow') : t('life.chores.status.inDays', { n: diff });
  return fmtDay(due, lang, 'short');
}

function TasksTab() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const choresMap = useChores((s) => s.chores);
  const historyMap = useChores((s) => s.history);
  const [area, setArea] = useState<'all' | ChoreArea>('all');
  const [edit, setEdit] = useState<Chore | 'new' | null>(null);
  const day = dayKeyOf();

  const all = useMemo(() => Object.values(choresMap), [choresMap]);
  const history = useMemo(() => Object.values(historyMap), [historyMap]);
  const counts = choreCounts(all, day);
  const week = weeklyChoreScore(all, history, day);
  const msg = L(pickMessage('chores', choresTone(week.score, counts.overdue), day), lang);
  const sorted = useMemo(() => sortChores(all.filter((c) => area === 'all' || c.area === area), day), [all, area, day]);

  const groups: Array<{ st: ChoreState; color: string }> = [
    { st: 'overdue', color: th.coral },
    { st: 'today', color: th.orange },
    { st: 'soon', color: th.blue },
    { st: 'later', color: th.textDim },
  ];

  const doneIt = (c: Chore) => {
    press();
    if (choreDone(c.id)) {
      success();
      useCore.getState().pushToast('life.chores.toast.done', { name: choreName(c, lang) });
    }
  };

  return (
    <View>
      <MessageCard text={msg} pastel="blue" emoji="🧺" />
      <Spacer h={12} />
      <Card>
        <Row gap={14}>
          <RingGauge value={week.score / 100} size={96} stroke={10} color={th.success} label={`${week.score}%`} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">{t('life.chores.week.title')}</Txt>
            <Txt variant="small" dim>
              {t('life.chores.week.progress', { a: week.done, b: week.expected })}
            </Txt>
            <Row gap={8} style={{ marginTop: 8, flexWrap: 'wrap' }}>
              <Counter n={counts.overdue} label={t('life.chores.state.overdue')} color={th.coral} />
              <Counter n={counts.today} label={t('life.chores.state.today')} color={th.orange} />
              <Counter n={counts.soon} label={t('life.chores.state.soon')} color={th.blue} />
            </Row>
          </View>
        </Row>
      </Card>

      <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 14 }}>
        <Chip label={t('life.chores.area.all')} active={area === 'all'} onPress={() => setArea('all')} />
        {CHORE_AREAS.map((a) => (
          <Chip key={a} emoji={AREA_EMOJI[a]} label={t(`life.chores.area.${a}`)} active={area === a} onPress={() => setArea(a)} />
        ))}
      </Row>

      {groups.map(({ st, color }) => {
        const list = sorted.filter((c) => c.state === st);
        if (list.length === 0) return null;
        return (
          <View key={st} style={{ marginTop: 16 }}>
            <Row gap={8} style={{ marginBottom: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
              <Txt variant="h3">
                {t(`life.chores.state.${st}`)} · {list.length}
              </Txt>
            </Row>
            {list.map((c) => (
              <Card key={c.id} style={{ marginBottom: 8 }} padding={12} onPress={() => setEdit(c)}>
                <Row gap={12}>
                  <View style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: th.pastel[AREA_PASTEL[c.area]], alignItems: 'center', justifyContent: 'center' }}>
                    <Txt size={24}>{c.emoji}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyBold" numberOfLines={2}>
                      {choreName(c, lang)}
                    </Txt>
                    <Txt variant="small" color={st === 'overdue' ? th.coral : th.textDim} weight={st === 'overdue' ? '700' : undefined} numberOfLines={1}>
                      {statusText(t, lang, c.state, c.diff, c.due)} · {t('life.chores.every', { n: c.every })}
                    </Txt>
                  </View>
                  {st === 'overdue' || st === 'today' ? (
                    <IconButton icon="moon-outline" size={20} color={th.textDim} label={t('life.chores.postpone')} onPress={() => useChores.getState().postpone(c.id, day)} />
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common.btn.done')}
                    onPress={() => doneIt(c)}
                    style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: th.success, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="checkmark" size={22} color={th.success} />
                  </Pressable>
                </Row>
              </Card>
            ))}
          </View>
        );
      })}
      {sorted.length === 0 ? (
        <Txt dim center style={{ marginTop: 24 }}>
          {t('life.chores.empty')}
        </Txt>
      ) : null}

      <Spacer h={16} />
      <PillButton label={t('life.chores.addChore')} icon="add" onPress={() => setEdit('new')} />
      <EditSheet target={edit} onClose={() => setEdit(null)} />
    </View>
  );
}

function Counter({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <Row gap={4}>
      <Txt variant="bodyBold" color={color}>
        {n}
      </Txt>
      <Txt variant="small" dim>
        {label}
      </Txt>
    </Row>
  );
}

function EditSheet({ target, onClose }: { target: Chore | 'new' | null; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const cur = target && target !== 'new' ? target : null;
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧹');
  const [area, setArea] = useState<ChoreArea>('general');
  const [every, setEvery] = useState(7);
  useEffect(() => {
    if (target === 'new') {
      setName('');
      setEmoji('🧹');
      setArea('general');
      setEvery(7);
    } else if (target) {
      setName(choreName(target, lang));
      setEmoji(target.emoji);
      setArea(target.area);
      setEvery(target.every);
    }
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  const custom = !cur || !cur.key;
  const valid = !custom || name.trim().length > 0;
  return (
    <Sheet visible={target !== null} title={cur ? t('life.chores.edit.title') : t('life.chores.edit.newTitle')} onClose={onClose}>
      {custom ? (
        <Field label={t('life.chores.edit.name')} value={name} onChangeText={setName} placeholder={t('life.chores.edit.namePh')} />
      ) : (
        <Txt variant="h3">{name}</Txt>
      )}
      <Spacer h={10} />
      <Field label={t('life.chores.edit.emoji')} value={emoji} onChangeText={(v) => setEmoji(Array.from(v).slice(-2).join(''))} maxLength={4} />
      <Spacer h={10} />
      <Txt variant="bodyBold">{t('life.chores.edit.area')}</Txt>
      <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 8 }}>
        {CHORE_AREAS.map((a) => (
          <Chip key={a} emoji={AREA_EMOJI[a]} label={t(`life.chores.area.${a}`)} active={area === a} onPress={() => setArea(a)} />
        ))}
      </Row>
      <Stepper label={t('life.chores.edit.every')} hint={t('life.chores.edit.everyHint')} value={every} min={1} max={90} onChange={setEvery} />
      <Spacer h={8} />
      <PillButton
        label={t('common.btn.save')}
        disabled={!valid}
        onPress={() => {
          useChores.getState().upsert({ id: cur?.id, name: name.trim(), emoji: emoji || '🧹', area, every });
          onClose();
        }}
      />
      {cur ? (
        <>
          <Spacer h={8} />
          <PillButton
            kind="outline"
            label={t('common.btn.delete')}
            onPress={() => {
              useChores.getState().remove(cur.id);
              onClose();
            }}
          />
        </>
      ) : null}
    </Sheet>
  );
}

// ------------------------------------------------------------------ Çamaşır ve bulaşık akışı
function finishStep(key: string) {
  const c = useChores.getState().chores[`d:${key}`];
  if (c) choreDone(c.id);
}

function FlowsTab() {
  const flows = useChores((s) => s.flows);
  const running = flows.laundry.endsAt !== null || flows.dish.endsAt !== null;
  const now = useNow(1000, running);
  return (
    <View style={{ gap: 14 }}>
      <FlowCard kind="laundry" emoji="🧺" pastel="mint" now={now} />
      <FlowCard kind="dish" emoji="🍽️" pastel="peach" now={now} />
    </View>
  );
}

function FlowCard({ kind, emoji, pastel, now }: { kind: FlowKind; emoji: string; pastel: PastelKey; now: number }) {
  const t = useT();
  const th = useTheme();
  const f = useChores((s) => s.flows[kind]);
  const steps = FLOW_STEPS[kind];
  const idle = f.step < 0;
  const set = (patch: Partial<typeof f>) => {
    useChores.getState().setFlow(kind, patch);
    void notifyChores();
  };
  const advance = () => {
    press();
    finishStep(steps[f.step]);
    if (f.step + 1 >= steps.length) {
      set({ step: -1, endsAt: null });
      success();
      useCore.getState().pushToast(`life.chores.flow.${kind}.finished`);
    } else set({ step: f.step + 1, endsAt: null });
  };
  const remaining = f.endsAt ? Math.max(0, f.endsAt - now) : 0;
  const mm = `${Math.floor(remaining / 3600000) > 0 ? `${Math.floor(remaining / 3600000)}:` : ''}${String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}`;
  const machineStep = f.step === 0;

  return (
    <Card bg={th.pastel[pastel]}>
      <Row gap={12}>
        <Txt size={34}>{emoji}</Txt>
        <View style={{ flex: 1 }}>
          <Txt variant="h3" color={th.onPastel}>
            {t(`life.chores.flow.${kind}.title`)}
          </Txt>
          <Txt variant="small" color={th.onPastel}>
            {t(`life.chores.flow.${kind}.hint`)}
          </Txt>
        </View>
      </Row>

      <View style={{ marginTop: 14, gap: 8 }}>
        {steps.map((key, i) => {
          const state = idle ? 'todo' : i < f.step ? 'done' : i === f.step ? 'now' : 'todo';
          return (
            <Row key={key} gap={10}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: state === 'done' ? th.success : state === 'now' ? th.primary : 'transparent',
                  borderWidth: state === 'todo' ? 1.5 : 0,
                  borderColor: th.onPastel,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {state === 'done' ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Txt variant="small" weight="800" color={state === 'now' ? th.onPrimary : th.onPastel}>
                    {i + 1}
                  </Txt>
                )}
              </View>
              <Txt variant={state === 'now' ? 'bodyBold' : 'body'} color={th.onPastel} style={{ opacity: state === 'todo' ? 0.7 : 1 }}>
                {t(`life.chores.flow.step.${key}`)}
              </Txt>
            </Row>
          );
        })}
      </View>

      <Spacer h={14} />
      {idle ? (
        <PillButton label={t(`life.chores.flow.${kind}.start`)} onPress={() => set({ step: 0, endsAt: null })} />
      ) : (
        <View>
          {machineStep ? (
            f.endsAt ? (
              <View style={{ backgroundColor: th.card, borderRadius: radius.lg, padding: 14, marginBottom: 10 }}>
                <Txt variant="small" dim>
                  {remaining > 0 ? t('life.chores.flow.running') : t('life.chores.flow.finishedMachine')}
                </Txt>
                <Txt variant="display">{remaining > 0 ? mm : '✓'}</Txt>
                <PillButton small kind="outline" label={t('life.chores.flow.cancelTimer')} onPress={() => set({ endsAt: null })} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
              </View>
            ) : (
              <View style={{ backgroundColor: th.card, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 10 }}>
                <Stepper label={t('life.chores.flow.minutes')} value={f.minutes} min={10} max={300} step={10} onChange={(v) => set({ minutes: v })} format={(v) => `${v} ${t('common.unit.min')}`} />
                <PillButton small label={t('life.chores.flow.startMachine')} icon="timer-outline" onPress={() => set({ endsAt: Date.now() + f.minutes * 60000 })} style={{ marginBottom: 8 }} />
              </View>
            )
          ) : null}
          <PillButton label={f.step + 1 >= steps.length ? t('life.chores.flow.finish') : t('life.chores.flow.nextStep')} onPress={advance} />
          <PillButton small kind="ghost" label={t('life.chores.flow.reset')} onPress={() => set({ step: -1, endsAt: null })} style={{ marginTop: 6 }} />
        </View>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ Özet
function StatsTab() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const choresMap = useChores((s) => s.chores);
  const historyMap = useChores((s) => s.history);
  const day = dayKeyOf();
  const all = useMemo(() => Object.values(choresMap), [choresMap]);
  const history = useMemo(() => Object.values(historyMap), [historyMap]);
  const week = weeklyChoreScore(all, history, day);
  const top = mostPostponed(all, 5);

  const byArea = useMemo(() => {
    const from = addDays(day, -6);
    const out: Record<string, number> = {};
    for (const h of history) {
      if (h.dayKey < from) continue;
      const c = choresMap[h.choreId];
      if (c) out[c.area] = (out[c.area] ?? 0) + 1;
    }
    return out;
  }, [history, choresMap, day]);
  const maxArea = Math.max(1, ...Object.values(byArea));
  const totalDone = all.reduce((a, c) => a + c.doneCount, 0);

  return (
    <View>
      <Card>
        <Row gap={16}>
          <RingGauge value={week.score / 100} size={120} stroke={12} color={th.success} label={`${week.score}`} sublabel={t('life.chores.stats.score')} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">{t('life.chores.week.title')}</Txt>
            <Txt dim>{t('life.chores.week.progress', { a: week.done, b: week.expected })}</Txt>
            <Txt variant="small" dim style={{ marginTop: 6 }}>
              {t('life.chores.stats.total', { n: totalDone })}
            </Txt>
          </View>
        </Row>
        <Spacer h={10} />
        <Bar value={week.score / 100} color={th.success} height={10} />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Txt variant="h3" style={{ marginBottom: 6 }}>
          {t('life.chores.stats.byArea')}
        </Txt>
        {CHORE_AREAS.map((a) => (
          <HBar key={a} emoji={AREA_EMOJI[a]} label={t(`life.chores.area.${a}`)} value={byArea[a] ?? 0} max={maxArea} color={th.blue} />
        ))}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Txt variant="h3" style={{ marginBottom: 6 }}>
          {t('life.chores.stats.postponed')}
        </Txt>
        {top.length === 0 ? (
          <Txt dim>{t('life.chores.stats.postponedEmpty')}</Txt>
        ) : (
          top.map((c) => <HBar key={c.id} emoji={c.emoji} label={choreName(c, lang)} value={c.postponed} max={top[0].postponed} color={th.orange} />)
        )}
      </Card>
    </View>
  );
}
