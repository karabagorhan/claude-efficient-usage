/**
 * İş ve kişisel gelişim — SPEC §6.6. Sekmeler: Bugün · Hedefler · Öğrenme · Değerlendirme.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Confetti } from '../../src/components/Confetti';
import { Bar, Card, Chip, EmptyState, Field, Header, IconButton, PillButton, Row, Screen, SectionHeader, Segmented, Txt } from '../../src/components/ui';
import { addDays, weekStartKey, weekdayOf } from '../../src/engine/dates';
import { carryOverSuggestion, goalPercent, goalProgress, growthCheerKey, learnProgress, TOP_MAX, top3Done, weekTopDays } from '../../src/features/growth/calc';
import { ensureGrowthNotifSync } from '../../src/features/growth/notify';
import { AREA_META, LEARN_KINDS, LEARN_META, LEARN_STATUSES, type Goal, type LearnItem, type LearnKind } from '../../src/features/growth/types';
import { weekDays } from '../../src/features/study/calc';
import { useDuration } from '../../src/features/study/format';
import { CheckCircle, ConfirmDelete, CountdownBadge, Label, ToggleRow } from '../../src/features/study/ui';
import { DAYS_SHORT, fmtDay, useLang, useT } from '../../src/i18n';
import { routes } from '../../src/lib/routes';
import { today } from '../../src/store/core';
import { useSettings } from '../../src/store/settings';
import { useGrowth } from '../../src/store/slices/growth';
import { minutesByTagOf, useTimer } from '../../src/store/slices/timer';
import { radius, useTheme } from '../../src/theme';

type Tab = 'today' | 'goals' | 'learn' | 'review';
const TABS: Tab[] = ['today', 'goals', 'learn', 'review'];

export default function GrowthScreen() {
  const tr = useT();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'today');
  const [showSettings, setShowSettings] = useState(false);
  const t = useTheme();

  useEffect(() => {
    ensureGrowthNotifSync();
  }, []);
  useEffect(() => {
    if (TABS.includes(params.tab as Tab)) setTab(params.tab as Tab);
  }, [params.tab]);

  const header = (
    <View>
      <Header
        title={tr('growth.title')}
        large
        right={
          <>
            <IconButton icon={showSettings ? 'settings' : 'settings-outline'} label={tr('growth.settings.title')} onPress={() => setShowSettings((s) => !s)} />
            <IconButton icon="add" bg={t.primary} color={t.onPrimary} size={22} label={tr('growth.goal.add')} onPress={() => router.push(routes.growthGoal('new'))} />
          </>
        }
      />
      <Segmented value={tab} onChange={setTab} options={TABS.map((id) => ({ id, label: tr(`growth.tab.${id}`) }))} style={{ marginHorizontal: 16, marginBottom: 8 }} />
    </View>
  );

  return (
    <Screen header={header} padBottom={48}>
      {showSettings ? <GrowthSettingsCard /> : null}
      {tab === 'today' ? <Today goTab={setTab} /> : null}
      {tab === 'goals' ? <Goals /> : null}
      {tab === 'learn' ? <Learning /> : null}
      {tab === 'review' ? <Review /> : null}
    </Screen>
  );
}

function GrowthSettingsCard() {
  const t = useTheme();
  const tr = useT();
  const settings = useGrowth((s) => s.settings);
  const setSettings = useGrowth((s) => s.setSettings);
  const globalOn = useSettings((s) => s.notifications);
  return (
    <Card style={{ marginBottom: 12, borderWidth: 1, borderColor: t.border }}>
      <Txt variant="h3" style={{ marginBottom: 8 }}>
        {tr('growth.settings.title')}
      </Txt>
      <ToggleRow label={tr('growth.settings.morning')} sub={tr('growth.settings.morningSub')} value={settings.morningTop3} onChange={(v) => setSettings({ morningTop3: v })} />
      <ToggleRow label={tr('growth.settings.review')} sub={tr('growth.settings.reviewSub')} value={settings.fridayReview} onChange={(v) => setSettings({ fridayReview: v })} />
      {!globalOn ? (
        <Txt variant="small" color={t.warn} style={{ marginTop: 6 }}>
          {tr('growth.settings.globalOff')}
        </Txt>
      ) : null}
    </Card>
  );
}

// ---------------- Bugün ----------------
function Today({ goTab }: { goTab: (t: Tab) => void }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const dur = useDuration();
  const day = today();
  const { tops, goals, addTop, toggleTop, removeTop, carryOver } = useGrowth(
    useShallow((s) => ({ tops: s.tops, goals: s.goals, addTop: s.addTop, toggleTop: s.toggleTop, removeTop: s.removeTop, carryOver: s.carryOver })),
  );
  const sessions = useTimer((s) => s.sessions);
  const [text, setText] = useState('');
  const [burst, setBurst] = useState(0);
  const list = tops[day] ?? [];
  const st = top3Done(list);
  const sugg = useMemo(() => carryOverSuggestion(tops, day), [tops, day]);
  const days = weekDays(day);
  const weekDone = useMemo(() => weekTopDays(tops, days), [tops, days.join()]);
  const workMin = useMemo(() => {
    const from = weekStartKey(day);
    return Math.round((minutesByTagOf(sessions ?? [], from, addDays(from, 6)) as Partial<Record<string, number>>).work ?? 0);
  }, [sessions, day]);
  const active = useMemo(() => Object.values(goals).filter((g) => !g.doneDay).sort((a, b) => goalProgress(b) - goalProgress(a)).slice(0, 3), [goals]);
  const cheer = growthCheerKey({ top: st, activeGoals: active.length });

  const add = () => {
    if (addTop(text)) setText('');
  };
  const focus = () => {
    try {
      (useTimer.getState() as { setTag?: (x: 'work') => void }).setTag?.('work');
    } catch {}
    router.push(routes.timer({ minutes: 25 }));
  };

  return (
    <View>
      <Txt variant="small" dim style={{ marginTop: 4 }}>
        {fmtDay(day, lang)}
      </Txt>
      <Txt dim style={{ marginBottom: 12 }}>
        {tr(cheer)}
      </Txt>

      <Card bg={st.all ? t.pastel.green : t.card}>
        <Row between style={{ marginBottom: 8 }}>
          <Txt variant="h3">{tr('growth.top.title')}</Txt>
          <View style={{ backgroundColor: st.all ? t.success : t.cardAlt, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontWeight: '800', color: st.all ? '#FFFFFF' : t.text }}>{`${st.done}/${Math.max(TOP_MAX, st.total)}`}</Text>
          </View>
        </Row>
        {list.map((x, i) => (
          <Row key={x.id} gap={12} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}>
            <CheckCircle
              done={x.done}
              onPress={() => {
                const r = toggleTop(x.id);
                if (r.allDone) setBurst((b) => b + 1);
              }}
            />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold" dim={x.done} style={{ textDecorationLine: x.done ? 'line-through' : 'none' }} numberOfLines={2}>
                {x.title}
              </Txt>
              {x.from ? (
                <Txt variant="caption" faint>
                  {tr('growth.top.carried', { day: fmtDay(x.from, lang, 'short') })}
                </Txt>
              ) : null}
            </View>
            <Pressable hitSlop={8} onPress={() => removeTop(x.id)} accessibilityLabel={tr('common.btn.delete')}>
              <Text style={{ color: t.textFaint, fontSize: 18 }}>✕</Text>
            </Pressable>
          </Row>
        ))}
        {list.length < TOP_MAX ? (
          <Row gap={10} style={{ paddingTop: list.length ? 8 : 0 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: '800', color: t.textDim }}>{list.length + 1}</Text>
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={add}
              blurOnSubmit={false}
              returnKeyType="done"
              placeholder={tr(`growth.top.ph${list.length + 1}`)}
              placeholderTextColor={t.textFaint}
              style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: 10 }}
            />
            {text.trim() ? <Chip label={tr('common.btn.add')} active onPress={add} /> : null}
          </Row>
        ) : null}
        {st.all ? (
          <Txt variant="bodyBold" center style={{ marginTop: 10 }}>
            {tr('growth.top.allDone')}
          </Txt>
        ) : null}
      </Card>

      {sugg ? (
        <Card bg={t.pastel.peach} style={{ marginTop: 12 }}>
          <Txt variant="bodyBold" color={t.onPastel}>
            {sugg.from === addDays(day, -1) ? tr('growth.top.carryYesterday', { n: sugg.items.length }) : tr('growth.top.carryFrom', { n: sugg.items.length, day: fmtDay(sugg.from, lang, 'short') })}
          </Txt>
          {sugg.items.map((x) => (
            <Txt key={x.id} variant="small" color={t.onPastel} numberOfLines={1} style={{ marginTop: 4 }}>
              {`• ${x.title}`}
            </Txt>
          ))}
          <PillButton small label={tr('growth.top.carry')} icon="arrow-redo-outline" onPress={() => carryOver(sugg)} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
        </Card>
      ) : null}

      <SectionHeader title={tr('growth.week.title')} />
      <Card>
        <Row between>
          {days.map((d, i) => (
            <View key={d} style={{ alignItems: 'center', gap: 6 }}>
              <Txt variant="caption" faint={d !== day} weight={d === day ? '800' : undefined}>
                {DAYS_SHORT[lang][i]}
              </Txt>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: weekDone[i] ? t.success : t.cardAlt,
                  borderWidth: d === day ? 2 : 0,
                  borderColor: t.text,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: weekDone[i] ? '#FFFFFF' : t.textFaint, fontWeight: '800' }}>{weekDone[i] ? '✓' : '·'}</Text>
              </View>
            </View>
          ))}
        </Row>
        <Txt variant="small" dim style={{ marginTop: 12 }}>
          {tr('growth.week.topDays', { n: weekDone.filter(Boolean).length })}
        </Txt>
        <Row between style={{ marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyBold">{tr('growth.week.work', { d: dur(workMin) })}</Txt>
            <Txt variant="small" dim>
              {tr('growth.week.workSub')}
            </Txt>
          </View>
          <PillButton small label={tr('growth.week.focus')} icon="timer-outline" onPress={focus} />
        </Row>
      </Card>

      <SectionHeader title={tr('growth.goals.active')} onSeeAll={() => goTab('goals')} />
      {active.length ? (
        active.map((g) => <GoalCard key={g.id} g={g} compact />)
      ) : (
        <Card onPress={() => router.push(routes.growthGoal('new'))}>
          <Txt dim center>
            {tr('growth.goals.emptyShort')}
          </Txt>
        </Card>
      )}
      <Confetti fire={burst} />
    </View>
  );
}

// ---------------- Hedefler ----------------
function GoalCard({ g, compact }: { g: Goal; compact?: boolean }) {
  const t = useTheme();
  const tr = useT();
  const bumpGoal = useGrowth((s) => s.bumpGoal);
  const toggleM = useGrowth((s) => s.toggleGoalMilestone);
  const meta = AREA_META[g.area];
  const pct = goalPercent(g);
  const nextM = g.milestones.find((m) => !m.done);
  const done = !!g.doneDay;
  const measure =
    g.measure === 'number'
      ? `${g.current ?? 0} / ${g.targetValue ?? 0}${g.unit ? ` ${g.unit}` : ''}`
      : tr('growth.goal.msCount', { a: g.milestones.filter((m) => m.done).length, b: g.milestones.length });
  return (
    <Card bg={t.pastel[meta.pastel]} onPress={() => router.push(routes.growthGoal(g.id))} style={{ marginBottom: 12 }}>
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 32 }}>{done ? '🏆' : meta.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Txt variant="small" color={t.onPastel} style={{ opacity: 0.75 }}>
            {tr(`growth.area.${g.area}`)}
          </Txt>
          <Txt variant="h3" color={t.onPastel} numberOfLines={2}>
            {g.title}
          </Txt>
        </View>
        {g.target && !done ? <CountdownBadge due={g.target} small /> : null}
      </Row>
      <Row between style={{ marginTop: 12, marginBottom: 6 }}>
        <Txt variant="small" weight="700" color={t.onPastel}>
          {measure}
        </Txt>
        <Txt variant="small" weight="800" color={t.onPastel}>{tr('study.pct', { n: pct })}</Txt>
      </Row>
      <Bar value={pct / 100} color={done ? t.success : t.primary} bg={t.card} />
      {!compact && !done ? (
        <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
          {g.measure === 'number' ? (
            <>
              <Chip label={`+1${g.unit ? ` ${g.unit}` : ''}`} onPress={() => bumpGoal(g.id, 1)} />
              {(g.targetValue ?? 0) - (g.startValue ?? 0) >= 20 ? <Chip label={`+5${g.unit ? ` ${g.unit}` : ''}`} onPress={() => bumpGoal(g.id, 5)} /> : null}
              <Chip label="−1" onPress={() => bumpGoal(g.id, -1)} />
            </>
          ) : nextM ? (
            <Chip emoji="✓" label={nextM.title} onPress={() => toggleM(g.id, nextM.id)} style={{ maxWidth: '100%' }} />
          ) : null}
        </Row>
      ) : null}
    </Card>
  );
}

function Goals() {
  const tr = useT();
  const goals = useGrowth((s) => s.goals);
  const [showDone, setShowDone] = useState(false);
  const { active, done } = useMemo(() => {
    const all = Object.values(goals);
    return {
      active: all.filter((g) => !g.doneDay).sort((a, b) => (a.target ?? '9999').localeCompare(b.target ?? '9999')),
      done: all.filter((g) => g.doneDay).sort((a, b) => ((a.doneDay ?? '') < (b.doneDay ?? '') ? 1 : -1)),
    };
  }, [goals]);

  if (!active.length && !done.length) {
    return <EmptyState emoji="🎯" title={tr('growth.goals.emptyTitle')} body={tr('growth.goals.emptyBody')} action={{ label: tr('growth.goal.add'), onPress: () => router.push(routes.growthGoal('new')) }} />;
  }
  return (
    <View style={{ marginTop: 8 }}>
      {active.map((g) => (
        <GoalCard key={g.id} g={g} />
      ))}
      <PillButton label={tr('growth.goal.add')} kind="outline" icon="add" onPress={() => router.push(routes.growthGoal('new'))} />
      {done.length ? (
        <>
          <SectionHeader title={tr('growth.goals.done', { n: done.length })} onSeeAll={() => setShowDone((s) => !s)} seeAllLabel={showDone ? tr('growth.hide') : tr('growth.show')} />
          {showDone ? done.map((g) => <GoalCard key={g.id} g={g} compact />) : null}
        </>
      ) : null}
    </View>
  );
}

// ---------------- Öğrenme ----------------
function Learning() {
  const t = useTheme();
  const tr = useT();
  const learning = useGrowth((s) => s.learning);
  const saveLearn = useGrowth((s) => s.saveLearn);
  const [kind, setKind] = useState<LearnKind>('book');
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [adding, setAdding] = useState(false);
  const groups = useMemo(() => {
    const all = Object.values(learning).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return (['active', 'planned', 'done'] as const).map((st) => ({ st, list: all.filter((l) => l.status === st) })).filter((g) => g.list.length);
  }, [learning]);
  const empty = !groups.length;
  const add = () => {
    if (!title.trim()) return;
    saveLearn({ title, kind, total: parseInt(total, 10) || 0, current: 0, status: 'active' });
    setTitle('');
    setTotal('');
    setAdding(false);
  };

  return (
    <View style={{ marginTop: 8 }}>
      {empty && !adding ? (
        <EmptyState emoji="📚" title={tr('growth.learn.emptyTitle')} body={tr('growth.learn.emptyBody')} action={{ label: tr('growth.learn.add'), onPress: () => setAdding(true) }} />
      ) : null}
      {adding ? (
        <Card style={{ marginBottom: 12, borderWidth: 1, borderColor: t.border }}>
          <Txt variant="h3" style={{ marginBottom: 10 }}>
            {tr('growth.learn.add')}
          </Txt>
          <Row gap={8} style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            {LEARN_KINDS.map((k) => (
              <Chip key={k} emoji={LEARN_META[k].emoji} label={tr(`growth.kind.${k}`)} active={kind === k} onPress={() => setKind(k)} />
            ))}
          </Row>
          <Field value={title} onChangeText={setTitle} placeholder={tr(`growth.learn.ph.${kind}`)} autoFocus />
          <Field label={tr(`growth.learn.totalLabel.${kind}`)} value={total} onChangeText={(v) => setTotal(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="0" />
          <Row gap={10}>
            <PillButton small label={tr('common.btn.cancel')} kind="outline" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <PillButton small label={tr('common.btn.add')} onPress={add} disabled={!title.trim()} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : null}
      {groups.map((g) => (
        <View key={g.st}>
          <SectionHeader title={`${tr(`growth.lstatus.${g.st}`)} · ${g.list.length}`} style={{ marginTop: 12 }} />
          {g.list.map((l) => (
            <LearnCard key={l.id} l={l} />
          ))}
        </View>
      ))}
      {!empty && !adding ? <PillButton label={tr('growth.learn.add')} kind="outline" icon="add" onPress={() => setAdding(true)} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

function LearnCard({ l }: { l: LearnItem }) {
  const t = useTheme();
  const tr = useT();
  const { bumpLearn, saveLearn, deleteLearn } = useGrowth(useShallow((s) => ({ bumpLearn: s.bumpLearn, saveLearn: s.saveLearn, deleteLearn: s.deleteLearn })));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(l.title);
  const [total, setTotal] = useState(String(l.total || ''));
  const meta = LEARN_META[l.kind];
  const unit = tr(`growth.unit.${l.kind}`);
  const steps = l.kind === 'book' ? [10, 25] : [1];
  return (
    <Card bg={t.pastel[meta.pastel]} onPress={() => setOpen((o) => !o)} style={{ marginBottom: 12 }}>
      <Row gap={12}>
        <Text style={{ fontSize: 30 }}>{l.status === 'done' ? '✅' : meta.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Txt variant="small" color={t.onPastel} style={{ opacity: 0.75 }}>
            {tr(`growth.kind.${l.kind}`)}
          </Txt>
          <Txt variant="bodyBold" color={t.onPastel} numberOfLines={2}>
            {l.title}
          </Txt>
        </View>
      </Row>
      <Row between style={{ marginTop: 10, marginBottom: 6 }}>
        <Txt variant="small" weight="700" color={t.onPastel}>
          {l.total ? `${l.current} / ${l.total} ${unit}` : `${l.current} ${unit}`}
        </Txt>
        <Txt variant="small" weight="800" color={t.onPastel}>{tr('study.pct', { n: Math.round(learnProgress(l) * 100) })}</Txt>
      </Row>
      <Bar value={learnProgress(l)} color={l.status === 'done' ? t.success : t.primary} bg={t.card} />
      {l.status !== 'done' ? (
        <Row gap={8} style={{ marginTop: 12 }}>
          {steps.map((n) => (
            <Chip key={n} label={`+${n} ${unit}`} onPress={() => bumpLearn(l.id, n)} />
          ))}
          <Chip label={`−${steps[0]}`} onPress={() => bumpLearn(l.id, -steps[0])} />
        </Row>
      ) : null}
      {open ? (
        <View style={{ marginTop: 14, backgroundColor: t.card, borderRadius: radius.md, padding: 12 }}>
          <Field label={tr('growth.learn.name')} value={title} onChangeText={setTitle} onBlur={() => title.trim() && saveLearn({ id: l.id, title })} />
          <Field
            label={tr(`growth.learn.totalLabel.${l.kind}`)}
            value={total}
            onChangeText={(v) => setTotal(v.replace(/[^0-9]/g, ''))}
            onBlur={() => saveLearn({ id: l.id, title: l.title, total: parseInt(total, 10) || 0 })}
            keyboardType="number-pad"
          />
          <Label style={{ marginTop: 0 }}>{tr('growth.learn.status')}</Label>
          <Segmented value={l.status} onChange={(status) => saveLearn({ id: l.id, title: l.title, status, current: status === 'done' && l.total ? l.total : l.current })} options={LEARN_STATUSES.map((s) => ({ id: s, label: tr(`growth.lstatus.${s}`) }))} />
          <View style={{ marginTop: 10 }}>
            <ConfirmDelete label={tr('common.btn.delete')} confirmLabel={tr('growth.learn.confirmDelete')} onConfirm={() => deleteLearn(l.id)} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

// ---------------- Değerlendirme ----------------
function Review() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const day = today();
  const week = weekStartKey(day);
  const { reviews, saveReview, tops, goals } = useGrowth(useShallow((s) => ({ reviews: s.reviews, saveReview: s.saveReview, tops: s.tops, goals: s.goals })));
  const cur = reviews.find((r) => r.week === week);
  const [good, setGood] = useState(cur?.good ?? '');
  const [blockers, setBlockers] = useState(cur?.blockers ?? '');
  const [next, setNext] = useState(cur?.next ?? '');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (!cur) return;
    setGood(cur.good);
    setBlockers(cur.blockers);
    setNext(cur.next);
    // yalnız kayıt değişince (hydrate/başka kayıt) eşitle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);
  const isFriday = weekdayOf(day) === 4;
  const stats = useMemo(() => {
    const days = weekDays(day);
    return {
      topDays: weekTopDays(tops, days).filter(Boolean).length,
      goalsDone: Object.values(goals).filter((g) => g.doneDay && g.doneDay >= week).length,
      checkins: Object.values(goals).reduce((a, g) => a + g.checkins.filter((c) => c.dayKey >= week).length, 0),
    };
  }, [tops, goals, day, week]);
  const past = reviews.filter((r) => r.week !== week);
  const range = (w: string) => `${fmtDay(w, lang, 'short')} – ${fmtDay(addDays(w, 6), lang, 'short')}`;
  const dirty = good !== (cur?.good ?? '') || blockers !== (cur?.blockers ?? '') || next !== (cur?.next ?? '');

  return (
    <View style={{ marginTop: 8 }}>
      <Card bg={isFriday ? t.pastel.yellow : t.pastel.blue}>
        <Txt variant="small" color={t.onPastel}>
          {range(week)}
        </Txt>
        <Txt variant="h3" color={t.onPastel}>
          {isFriday ? tr('growth.review.friday') : tr('growth.review.title')}
        </Txt>
        <Txt variant="small" color={t.onPastel} style={{ marginTop: 6 }}>
          {tr('growth.review.stats', { a: stats.topDays, b: stats.goalsDone, c: stats.checkins })}
        </Txt>
      </Card>

      <Label>{`✅ ${tr('growth.review.good')}`}</Label>
      <Field value={good} onChangeText={setGood} placeholder={tr('growth.review.goodPh')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <Label style={{ marginTop: 4 }}>{`🧱 ${tr('growth.review.blockers')}`}</Label>
      <Field value={blockers} onChangeText={setBlockers} placeholder={tr('growth.review.blockersPh')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <Label style={{ marginTop: 4 }}>{`🎯 ${tr('growth.review.next')}`}</Label>
      <Field value={next} onChangeText={setNext} placeholder={tr('growth.review.nextPh')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <PillButton
        label={cur && !dirty ? tr('growth.review.saved') : tr('common.btn.save')}
        icon={cur && !dirty ? 'checkmark' : undefined}
        disabled={!(good.trim() || blockers.trim() || next.trim()) || (!!cur && !dirty)}
        onPress={() => saveReview({ good, blockers, next })}
      />

      <SectionHeader title={tr('growth.review.history')} />
      {past.length ? (
        past.map((r) => (
          <Card key={r.id} onPress={() => setOpen(open === r.id ? null : r.id)} style={{ marginBottom: 10 }}>
            <Row between>
              <Txt variant="bodyBold">{range(r.week)}</Txt>
              <Txt dim>{open === r.id ? '▲' : '▼'}</Txt>
            </Row>
            {open === r.id ? (
              <View style={{ marginTop: 8, gap: 8 }}>
                {r.good ? <Txt>{`✅ ${r.good}`}</Txt> : null}
                {r.blockers ? <Txt>{`🧱 ${r.blockers}`}</Txt> : null}
                {r.next ? <Txt>{`🎯 ${r.next}`}</Txt> : null}
              </View>
            ) : (
              <Txt variant="small" dim numberOfLines={1} style={{ marginTop: 4 }}>
                {r.good || r.next || r.blockers}
              </Txt>
            )}
          </Card>
        ))
      ) : (
        <Txt dim>{tr('growth.review.noHistory')}</Txt>
      )}
    </View>
  );
}
