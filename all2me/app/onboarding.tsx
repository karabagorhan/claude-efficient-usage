import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Confetti } from '../src/components/Confetti';
import { Mascot } from '../src/components/Mascot';
import { RingGauge } from '../src/components/RingGauge';
import { Avatar, Bar, Field, IconButton, PastelCard, PillButton, Screen, Txt } from '../src/components/ui';
import { METRICS, QUESTIONS, metricLevel } from '../src/features/onboarding/questions';
import { QuestionArt } from '../src/features/onboarding/QuestionArt';
import { DEFAULT_SELECTED, rankStarter, type QuestionId } from '../src/features/onboarding/starter';
import { PairingPanel, type PairResult } from '../src/features/pairing/PairingPanel';
import { L, useLang, useT, type Lang } from '../src/i18n';
import { uuid } from '../src/lib/id';
import { ensureSession, isBackendConfigured } from '../src/lib/supabase';
import { useCore } from '../src/store/core';
import { useSettings } from '../src/store/settings';
import { GUTTER, radius, useTheme } from '../src/theme';

const AVATARS = ['🌟', '🦊', '🐼', '🐱', '🐶', '🦄', '🌈', '🍀', '🚀', '🌻', '🐳', '🍉'];
const COLORS = ['#7C5CFC', '#EE4D7E', '#A93BC9', '#3B6CF6', '#FF8A1F', '#34D399', '#F43F5E', '#14B8A6'];

type StepId = 'lang' | 'profile' | `q:${QuestionId}` | 'result' | 'tasks' | 'pair' | 'done';
const STEPS: StepId[] = ['lang', 'profile', ...QUESTIONS.map((q) => `q:${q.id}` as StepId), 'result', 'tasks', 'pair', 'done'];

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
  const [picked, setPicked] = useState<Record<string, boolean> | null>(null);
  const [pair, setPair] = useState<PairResult | null>(null);
  const finishing = useRef(false);

  const step = STEPS[i];
  const total = STEPS.length - 1;
  const ranked = useMemo(() => rankStarter(answers), [answers]);
  const selected = picked ?? Object.fromEntries(ranked.map((s, idx) => [s.id, idx < DEFAULT_SELECTED]));
  const nSelected = ranked.filter((s) => selected[s.id]).length;

  const next = () => setI((v) => Math.min(v + 1, STEPS.length - 1));
  const back = () => setI((v) => Math.max(v - 1, 0));

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
    const drafts = ranked
      .filter((s) => selected[s.id])
      .map((s) => ({
        title: L(s.title, lang),
        icon: s.icon,
        slot: s.slot,
        pastel: s.pastel,
        difficulty: s.difficulty,
        kind: s.kind,
        target: s.target,
        link: s.link,
        source: 'onboarding',
      }));
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
        <View style={{ width: 44 }} />
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
    footer = <PillButton label={tr('common.btn.next')} arrow onPress={next} />;
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
    footer = <PillButton label={tr('common.btn.next')} arrow disabled={name.trim().length === 0} onPress={next} />;
  } else if (qDef) {
    scroll = false;
    const answer = (v: boolean) => {
      setAnswers((a) => ({ ...a, [qDef.id]: v }));
      setPicked(null);
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
  } else if (step === 'tasks') {
    body = (
      <>
        <Title sub={tr('onboarding.tasks.hint')}>{tr('onboarding.tasks.title')}</Title>
        {ranked.map((s) => {
          const on = !!selected[s.id];
          return (
            <PastelCard
              key={s.id}
              emoji={s.icon}
              overline={tr(`task.slot.${s.slot}`)}
              title={L(s.title, lang)}
              pastel={s.pastel}
              onPress={() => setPicked({ ...selected, [s.id]: !on })}
              right={
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? t.onPastel : 'transparent',
                    borderWidth: 2,
                    borderColor: t.onPastel,
                  }}
                >
                  {on ? <Ionicons name="checkmark" size={18} color={t.onPrimary} /> : null}
                </View>
              }
            />
          );
        })}
      </>
    );
    footer = <PillButton label={nSelected > 0 ? tr('onboarding.tasks.addN', { n: nSelected }) : tr('onboarding.tasks.none')} arrow onPress={next} />;
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
