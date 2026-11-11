import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Confetti } from '../src/components/Confetti';
import { Mascot } from '../src/components/Mascot';
import { RingGauge } from '../src/components/RingGauge';
import { Avatar, Bar, Chip, Field, IconButton, PastelCard, PillButton, Screen, Txt } from '../src/components/ui';
import { METRICS, QUESTIONS, metricLevel } from '../src/features/onboarding/questions';
import { QuestionArt } from '../src/features/onboarding/QuestionArt';
import { DEFAULT_SELECTED, rankStarter, type QuestionId } from '../src/features/onboarding/starter';
import { FOCUS_AREAS, FOCUS_EMOJI, buildFirstDay } from '../src/features/onboarding/firstDay';
import { QUIZ, quizResult, TYPE_ART } from '../src/features/onboarding/quiz';
import { QuizQuestionView, TimeStepper, TypeResultView } from '../src/features/onboarding/QuizParts';
import { PairingPanel, type PairResult } from '../src/features/pairing/PairingPanel';
import { fmtTime, L, useLang, useT, type Lang } from '../src/i18n';
import { uuid } from '../src/lib/id';
import { ensurePermission } from '../src/lib/notifications';
import { ensureSession, isBackendConfigured } from '../src/lib/supabase';
import { useCore } from '../src/store/core';
import { useSettings } from '../src/store/settings';
import { useProfile, type EnergyPeak, type FocusArea } from '../src/store/slices/profile';
import { GUTTER, radius, useTheme } from '../src/theme';

const AVATARS = ['🌟', '🦊', '🐼', '🐱', '🐶', '🦄', '🌈', '🍀', '🚀', '🌻', '🐳', '🍉'];
const COLORS = ['#7C5CFC', '#EE4D7E', '#A93BC9', '#3B6CF6', '#FF8A1F', '#34D399', '#F43F5E', '#14B8A6'];

type StepId = 'lang' | 'profile' | `q:${QuestionId}` | 'result' | 'rhythm' | 'energy' | 'focus' | `z:${number}` | 'type' | 'plan' | 'notif' | 'pair' | 'done';
const STEPS: StepId[] = [
  'lang',
  'profile',
  ...QUESTIONS.map((q) => `q:${q.id}` as StepId),
  'result',
  'rhythm',
  'energy',
  'focus',
  ...QUIZ.map((_, k) => `z:${k}` as StepId),
  'type',
  'plan',
  'notif',
  'pair',
  'done',
];
const PEAKS: Array<{ id: EnergyPeak; emoji: string; pastel: 'yellow' | 'peach' | 'purple' }> = [
  { id: 'morning', emoji: '🌅', pastel: 'yellow' },
  { id: 'noon', emoji: '☀️', pastel: 'peach' },
  { id: 'evening', emoji: '🌙', pastel: 'purple' },
];
/** Adım başına yaklaşık saniye (kalan süre göstergesi) */
const SEC_PER_STEP = 6;

export default function OnboardingScreen() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const setLang = useSettings((s) => s.setLang);

  const [i, setI] = useState(0);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(AVATARS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, boolean>>>({});
  const [pair, setPair] = useState<PairResult | null>(null);
  const [quick, setQuick] = useState(false);
  const [wake, setWake] = useState('07:00');
  const [sleep, setSleep] = useState('23:00');
  const [rhythmSet, setRhythmSet] = useState(true);
  const [weekendDiff, setWeekendDiff] = useState(false);
  const [peak, setPeak] = useState<EnergyPeak | null>(null);
  const [focus, setFocus] = useState<FocusArea[]>([]);
  const [quiz, setQuiz] = useState<number[]>([]);
  const [dropped, setDropped] = useState<Record<string, boolean>>({});
  const [planSkipped, setPlanSkipped] = useState(false);
  const [notifDenied, setNotifDenied] = useState(false);
  const finishing = useRef(false);

  const step = STEPS[i];
  const total = STEPS.length - 1;

  const type = useMemo(() => quizResult(quiz), [quiz]);
  const rows = useMemo(
    () => buildFirstDay({ wake: rhythmSet ? wake : null, sleep: rhythmSet ? sleep : null, energyPeak: peak, focus, answers, type }),
    [rhythmSet, wake, sleep, peak, focus, answers, type],
  );
  const keptRows = planSkipped ? [] : rows.filter((r) => !dropped[r.id]);

  // 'type' adımı test yapılmadıysa atlanır (ileri ve geri)
  const move = (d: 1 | -1) =>
    setI((v) => {
      let n = Math.max(0, Math.min(v + d, STEPS.length - 1));
      if (STEPS[n] === 'type' && !type) n = Math.max(0, Math.min(n + d, STEPS.length - 1));
      return n;
    });
  const next = () => move(1);
  const back = () => {
    if (quick && step === 'profile') setQuick(false);
    move(-1);
  };
  const skipTo = (id: StepId) => setI(STEPS.indexOf(id));

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    let id = pair?.uid;
    if (!id) {
      try {
        id = isBackendConfigured ? await ensureSession() : uuid();
      } catch {
        id = uuid();
      }
    }
    const core = useCore.getState();
    core.setMe({ id, name: name.trim(), emoji, color });
    const drafts = quick
      ? rankStarter({})
          .slice(0, DEFAULT_SELECTED)
          .map((s) => ({ title: L(s.title, lang), icon: s.icon, slot: s.slot, pastel: s.pastel, difficulty: s.difficulty, kind: s.kind, target: s.target, link: s.link, source: 'onboarding' }))
      : keptRows.map((r) => ({
          title: L(r.title, lang),
          icon: r.emoji,
          slot: r.slot,
          reminderTime: r.time ?? undefined,
          pastel: r.pastel,
          difficulty: r.difficulty,
          kind: r.kind,
          target: r.target,
          link: r.link,
          source: 'onboarding',
        }));
    if (!quick) {
      useProfile.getState().save({
        wake: rhythmSet ? wake : null,
        sleep: rhythmSet ? sleep : null,
        weekendDiff: rhythmSet && weekendDiff,
        energyPeak: peak,
        focusAreas: focus,
        routineType: type,
        quizAnswers: type ? quiz : [],
      });
    }
    if (drafts.length) core.addHabitsFromTemplates(drafts);
    if (pair) core.setPair(pair.pairId, pair.code);
    useSettings.getState().setOnboarded(true);
  };

  useEffect(() => {
    if (step !== 'done') return;
    const h = setTimeout(() => void finish(), 3200);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const isQuestion = step.startsWith('q:');
  const qDef = isQuestion ? QUESTIONS.find((q) => `q:${q.id}` === step) : undefined;

  const header =
    step === 'done' ? null : (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER - 8, minHeight: 52, gap: 8 }}>
        <View style={{ width: 44 }}>{i > 0 ? <IconButton icon="arrow-undo-outline" label={tr('common.btn.back')} onPress={back} /> : null}</View>
        <View style={{ flex: 1 }}>
          <Bar value={(i + 1) / total} color={t.coral} height={6} />
        </View>
        <View style={{ minWidth: 56, alignItems: 'flex-end' }}>
          <Txt variant="caption" dim numberOfLines={1}>
            {tr('onboarding.time.left', { n: Math.max(1, Math.ceil(((total - i) * SEC_PER_STEP) / 60)) })}
          </Txt>
        </View>
      </View>
    );

  const Title = ({ children, sub, compact }: { children: string; sub?: string; compact?: boolean }) => (
    <View style={{ marginBottom: 18 }}>
      <Txt variant={compact ? 'h1' : 'display'} center role="header">
        {children}
      </Txt>
      {sub ? (
        <Txt dim center style={{ marginTop: 8 }}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );

  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;
  let scroll = true;

  if (step === 'lang') {
    body = (
      <>
        <Title sub={tr('onboarding.lang.hint')}>{tr('onboarding.lang.title')}</Title>
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Mascot mood="cheer" size={120} />
        </View>
        {(['tr', 'en'] as Lang[]).map((l) => {
          const on = lang === l;
          return (
            <Pressable
              key={l}
              accessibilityRole="button"
              onPress={() => setLang(l)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 18,
                marginBottom: 12,
                borderRadius: radius.lg,
                backgroundColor: t.card,
                borderWidth: 2,
                borderColor: on ? t.text : 'transparent',
              }}
            >
              <Text style={{ fontSize: 30 }}>{l === 'tr' ? '🇹🇷' : '🇬🇧'}</Text>
              <Txt variant="h3" style={{ flex: 1 }}>
                {tr(`onboarding.lang.${l}`)}
              </Txt>
              {on ? <Ionicons name="checkmark-circle" size={26} color={t.text} /> : null}
            </Pressable>
          );
        })}
      </>
    );
    footer = (
      <View>
        <PillButton label={tr('common.btn.next')} arrow onPress={next} />
        <PillButton
          kind="ghost"
          label={tr('onboarding.quick.start')}
          onPress={() => {
            setQuick(true);
            next();
          }}
        />
        <Txt variant="caption" faint center>
          {tr('onboarding.quick.hint')}
        </Txt>
      </View>
    );
  } else if (step === 'profile') {
    body = (
      <>
        <Title sub={tr('onboarding.profile.hint')}>{tr('onboarding.profile.title')}</Title>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Avatar emoji={emoji} color={color} size={96} />
        </View>
        <Field label={tr('onboarding.profile.nameLabel')} value={name} onChangeText={setName} placeholder={tr('onboarding.profile.namePlaceholder')} maxLength={24} />
        <Txt variant="small" weight="600" dim style={{ marginBottom: 8 }}>
          {tr('onboarding.profile.avatar')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {AVATARS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.card,
                borderWidth: 2,
                borderColor: e === emoji ? t.text : 'transparent',
              }}
            >
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <Txt variant="small" weight="600" dim style={{ marginBottom: 8 }}>
          {tr('onboarding.profile.color')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`${tr('onboarding.profile.color')} ${c}`}
              accessibilityState={{ selected: c === color }}
              onPress={() => setColor(c)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, borderWidth: 3, borderColor: c === color ? t.text : t.bg, alignItems: 'center', justifyContent: 'center' }}
            >
              {c === color ? <Ionicons name="checkmark" size={20} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
      </>
    );
    footer = quick ? (
      <PillButton label={tr('onboarding.quick.go')} arrow disabled={name.trim().length === 0} onPress={() => void finish()} />
    ) : (
      <PillButton label={tr('common.btn.next')} arrow disabled={name.trim().length === 0} onPress={next} />
    );
  } else if (qDef) {
    scroll = false;
    const answer = (v: boolean) => {
      setAnswers((a) => ({ ...a, [qDef.id]: v }));
      next();
    };
    body = (
      <View style={{ flex: 1 }}>
        <Title>{tr(`onboarding.q.${qDef.id}`)}</Title>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <QuestionArt q={qDef} />
        </View>
      </View>
    );
    footer = (
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 12 }}>
        <PillButton style={{ flex: 1 }} kind="outline" label={tr('onboarding.no')} onPress={() => answer(false)} />
        <PillButton style={{ flex: 1.3 }} label={tr('onboarding.yes')} onPress={() => answer(true)} />
      </View>
    );
  } else if (step === 'result') {
    const col = { low: t.coral, mid: t.warn, high: t.success } as const;
    body = (
      <>
        <Title compact>{tr('onboarding.result.title')}</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 }}>
          {METRICS.map((m) => {
            const r = metricLevel(answers, m.from);
            return (
              <View key={m.id} style={{ width: '48%', alignItems: 'center' }}>
                <RingGauge value={r.value} size={150} stroke={12} color={col[r.level]} track={t.cardAlt}>
                  <View style={{ alignItems: 'center', justifyContent: 'center', width: 118, height: 118, borderRadius: 59, backgroundColor: t.card }}>
                    <Text style={{ fontSize: 32 }}>{m.icon}</Text>
                    <Txt weight="700" size={13} center numberOfLines={1} style={{ marginTop: 2 }}>
                      {tr(`onboarding.result.metric.${m.id}`)}
                    </Txt>
                  </View>
                </RingGauge>
                <View style={{ backgroundColor: col[r.level], borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, marginTop: -16 }}>
                  <Txt weight="800" size={14} color={t.onAccent} numberOfLines={1}>
                    {tr(`onboarding.result.level.${r.level}`)}
                  </Txt>
                </View>
              </View>
            );
          })}
        </View>
        <Txt variant="small" dim center style={{ marginTop: 22 }}>
          {tr('onboarding.result.note')}
        </Txt>
        <Txt variant="caption" faint center style={{ marginTop: 6 }}>
          {tr('common.medicalNote')}
        </Txt>
      </>
    );
    footer = <PillButton label={tr('common.btn.next')} arrow onPress={next} />;
  } else if (step === 'rhythm') {
    body = (
      <>
        <Title sub={tr('onboarding.rhythm.hint')}>{tr('onboarding.rhythm.title')}</Title>
        <TimeStepper label={tr('onboarding.rhythm.wake')} icon="⏰" value={wake} onChange={(v) => { setRhythmSet(true); setWake(v); }} />
        <TimeStepper label={tr('onboarding.rhythm.sleep')} icon="🌙" value={sleep} onChange={(v) => { setRhythmSet(true); setSleep(v); }} />
        <Txt variant="bodyBold" style={{ marginTop: 8, marginBottom: 10 }}>
          {tr('onboarding.rhythm.weekend')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Chip label={tr('onboarding.rhythm.weekendSame')} active={!weekendDiff} onPress={() => setWeekendDiff(false)} />
          <Chip label={tr('onboarding.rhythm.weekendDiff')} active={weekendDiff} onPress={() => setWeekendDiff(true)} />
        </View>
        <Txt variant="caption" dim style={{ marginTop: 10 }}>
          {tr('onboarding.rhythm.weekendNote')}
        </Txt>
      </>
    );
    footer = (
      <View>
        <PillButton label={tr('common.btn.next')} arrow onPress={next} />
        <PillButton kind="ghost" label={tr('common.btn.skip')} onPress={() => { setRhythmSet(false); setWeekendDiff(false); next(); }} />
      </View>
    );
  } else if (step === 'energy') {
    body = (
      <>
        <Title sub={tr('onboarding.energy.hint')}>{tr('onboarding.energy.title')}</Title>
        {PEAKS.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" accessibilityState={{ selected: peak === p.id }} onPress={() => setPeak(p.id)} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: t.pastel[p.pastel], borderWidth: 2, borderColor: peak === p.id ? t.text : 'transparent' }}>
              <Text style={{ fontSize: 34 }}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Txt variant="h3" color={t.onPastel}>{tr(`onboarding.energy.${p.id}`)}</Txt>
                <Txt variant="small" color={t.onPastel}>{tr(`onboarding.energy.${p.id}Hint`)}</Txt>
              </View>
            </View>
          </Pressable>
        ))}
      </>
    );
    footer = (
      <View>
        <PillButton label={tr('common.btn.next')} arrow disabled={!peak} onPress={next} />
        <PillButton kind="ghost" label={tr('common.btn.skip')} onPress={() => { setPeak(null); next(); }} />
      </View>
    );
  } else if (step === 'focus') {
    body = (
      <>
        <Title sub={tr('onboarding.focus.hint')}>{tr('onboarding.focus.title')}</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {FOCUS_AREAS.map((f) => (
            <Chip
              key={f}
              emoji={FOCUS_EMOJI[f]}
              label={tr(`onboarding.focus.${f}`)}
              active={focus.includes(f)}
              onPress={() => setFocus((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]))}
            />
          ))}
        </View>
      </>
    );
    footer = (
      <View>
        <PillButton label={tr('common.btn.next')} arrow disabled={focus.length === 0} onPress={next} />
        <PillButton kind="ghost" label={tr('common.btn.skip')} onPress={() => { setFocus([]); next(); }} />
      </View>
    );
  } else if (step.startsWith('z:')) {
    scroll = false;
    const k = Number(step.slice(2));
    body = (
      <QuizQuestionView
        index={k}
        value={quiz[k]}
        onAnswer={(v) => {
          setQuiz((p) => {
            const n = [...p];
            n[k] = v;
            return n;
          });
          if (k === QUIZ.length - 1) skipTo('type');
          else next();
        }}
      />
    );
    footer = (
      <PillButton
        kind="ghost"
        label={tr('onboarding.quiz.skip')}
        onPress={() => {
          setQuiz([]);
          skipTo('plan');
        }}
      />
    );
  } else if (step === 'type') {
    body = type ? <TypeResultView type={type} /> : null;
    footer = <PillButton label={tr('common.btn.next')} arrow onPress={next} />;
  } else if (step === 'plan') {
    body = (
      <>
        <Title sub={tr('onboarding.plan.hint')}>{tr('onboarding.plan.title')}</Title>
        {rows.map((r) => {
          if (dropped[r.id]) return null;
          return (
            <PastelCard
              key={r.id}
              emoji={r.emoji}
              overline={r.time ? `${fmtTime(r.time, lang)}${r.minutes ? ` · ${tr('planner.min', { n: r.minutes })}` : ''}` : tr('onboarding.plan.anytime')}
              title={L(r.title, lang)}
              pastel={r.pastel}
              right={
                <IconButton
                  icon="close"
                  color={t.onPastel}
                  label={tr('onboarding.plan.remove', { title: L(r.title, lang) })}
                  onPress={() => setDropped((p) => ({ ...p, [r.id]: true }))}
                />
              }
            />
          );
        })}
        {keptRows.length === 0 ? (
          <Txt dim center>
            {tr('onboarding.plan.empty')}
          </Txt>
        ) : null}
        <Txt variant="caption" faint center style={{ marginTop: 6 }}>
          {tr('common.medicalNote')}
        </Txt>
      </>
    );
    footer = (
      <View>
        <PillButton label={keptRows.length > 0 ? tr('onboarding.tasks.addN', { n: keptRows.length }) : tr('onboarding.tasks.none')} arrow onPress={next} />
        {keptRows.length > 0 ? (
          <PillButton kind="ghost" label={tr('common.btn.skip')} onPress={() => { setPlanSkipped(true); next(); }} />
        ) : null}
      </View>
    );
  } else if (step === 'notif') {
    body = (
      <>
        <Title sub={tr('onboarding.notif.hint')}>{tr('onboarding.notif.title')}</Title>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 64 }}>🔔</Text>
        </View>
        {(['b1', 'b2', 'b3'] as const).map((b) => (
          <View key={b} style={{ flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={22} color={t.success} />
            <Txt style={{ flex: 1 }}>{tr(`onboarding.notif.${b}`)}</Txt>
          </View>
        ))}
        {notifDenied ? (
          <Txt variant="small" dim center style={{ marginTop: 10 }}>
            {tr('onboarding.notif.denied')}
          </Txt>
        ) : null}
      </>
    );
    footer = notifDenied ? (
      <PillButton label={tr('common.btn.next')} arrow onPress={next} />
    ) : (
      <View>
        <PillButton
          label={tr('onboarding.notif.allow')}
          onPress={() => {
            void ensurePermission().then((ok) => {
              if (ok) next();
              else setNotifDenied(true);
            });
          }}
        />
        <PillButton kind="ghost" label={tr('onboarding.notif.later')} onPress={next} />
      </View>
    );
  } else if (step === 'pair') {
    body = (
      <>
        <Title sub={tr('onboarding.pair.hint')}>{tr('onboarding.pair.title')}</Title>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Mascot mood="happy" size={110} />
        </View>
        <PairingPanel
          onDone={(r) => {
            setPair(r);
            next();
          }}
          onSkip={next}
        />
      </>
    );
  } else {
    scroll = false;
    body = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Mascot mood="cheer" size={150} />
        <Txt variant="display" center>
          {tr('onboarding.done.title')}
        </Txt>
        <Txt dim center>
          {tr('onboarding.done.hint')}
        </Txt>
        <View style={{ backgroundColor: t.cardAlt, borderRadius: radius.lg, padding: 14, marginHorizontal: 8 }}>
          <Txt variant="small" center>
            {tr('onboarding.free.note')}
          </Txt>
        </View>
      </View>
    );
    footer = <PillButton label={tr('onboarding.done.cta')} arrow onPress={() => void finish()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Screen scroll={false} header={header} padBottom={16}>
        {scroll ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{body}</View>
        )}
        {footer ? <View style={{ paddingTop: 8 }}>{footer}</View> : null}
      </Screen>
      {step === 'done' ? <Confetti fire={1} count={70} /> : null}
    </View>
  );
}
