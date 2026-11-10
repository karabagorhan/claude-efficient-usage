/** Akıllı planlayıcı (SPEC §3.12): çevrimdışı, kural tabanlı gün planı. */
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bar, Chip, Header, IconButton, PillButton, Row, Screen, Spacer, Txt } from '../src/components/ui';
import type { PlanArea } from '../src/data/plannerPool';
import { BLOCKS, generatePlan, totalMinutes, type PlanAnswers, type PlanEnergy, type PlanItem, type PlanMinutes } from '../src/features/planner/plan';
import { fmtTime, L, useLang, useT } from '../src/i18n';
import type { Difficulty, PastelKey } from '../src/engine/types';
import { useCore } from '../src/store/core';
import { usePlanner } from '../src/store/slices/planner';
import { radius, useTheme } from '../src/theme';

const AREAS: PlanArea[] = ['home', 'work', 'study', 'health', 'wellness', 'self'];
const AREA_PASTEL: Record<PlanArea, PastelKey> = { home: 'peach', work: 'blue', study: 'purple', health: 'green', wellness: 'mint', self: 'pink' };
const ENERGIES: PlanEnergy[] = ['low', 'mid', 'high'];
const ENERGY_EMOJI: Record<PlanEnergy, string> = { low: '🌙', mid: '🌤️', high: '☀️' };
const MINUTES: PlanMinutes[] = [15, 30, 60, 90];
const WAKES = ['05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'];
const STEPS = 4;
const DEFAULTS: PlanAnswers = { wake: '07:00', energy: 'mid', areas: [], minutes: 60 };

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export default function ScreenPlanner() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const saved = usePlanner((s) => s.answers);
  const setSaved = usePlanner((s) => s.setAnswers);
  const [step, setStep] = useState(0);
  const [a, setA] = useState<PlanAnswers>(saved ?? DEFAULTS);
  const [items, setItems] = useState<PlanItem[]>([]);

  const make = (avoid: string[] = []) => setItems(generatePlan(a, newSeed(), avoid));
  const next = () => {
    if (step < STEPS - 1) return setStep(step + 1);
    setSaved(a);
    make();
    setStep(STEPS);
  };
  const toggleArea = (ar: PlanArea) => setA((p) => ({ ...p, areas: p.areas.includes(ar) ? p.areas.filter((x) => x !== ar) : [...p.areas, ar] }));

  const addAll = () => {
    const diff = (i: PlanItem): Difficulty => (i.task.minutes <= 3 ? 'mini' : i.task.effort === 1 ? 'easy' : i.task.effort === 2 ? 'medium' : 'hard');
    const n = useCore.getState().addHabitsFromTemplates(
      items.map((i) => ({
        title: L(i.task.title, lang),
        icon: i.task.emoji,
        slot: i.block,
        reminderTime: i.time,
        pastel: AREA_PASTEL[i.task.area],
        difficulty: diff(i),
        source: 'planner',
      })),
    );
    useCore.getState().pushToast(n > 0 ? { key: 'toast.added', params: { n } } : { key: 'toast.nothingAdded' });
    router.back();
  };

  const left = step === STEPS ? undefined : step > 0 ? 'back' : 'close';
  const header = (
    <Header
      title={t('planner.title')}
      left={left ?? 'close'}
      onLeft={step > 0 && step < STEPS ? () => setStep(step - 1) : undefined}
    />
  );

  if (step === STEPS) {
    const total = totalMinutes(items);
    return (
      <Screen header={header}>
        <Txt variant="h1">{t('planner.result.title')}</Txt>
        <Txt dim>{t('planner.result.summary', { n: items.length, min: total })}</Txt>
        <Spacer h={12} />
        {items.length === 0 ? (
          <Txt dim center>
            {t('planner.result.empty')}
          </Txt>
        ) : null}
        {BLOCKS.map((b) => {
          const list = items.filter((i) => i.block === b);
          if (!list.length) return null;
          return (
            <View key={b} style={{ marginBottom: 12 }}>
              <Txt variant="h3" style={{ marginBottom: 8 }}>
                {t(`planner.block.${b}`)}
              </Txt>
              {list.map((i) => (
                <View key={i.id} style={{ marginBottom: 8 }}>
                  <View style={{ backgroundColor: th.pastel[AREA_PASTEL[i.task.area]], borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 30 }}>{i.task.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Txt variant="caption" color={th.onPastel}>
                        {fmtTime(i.time, lang)} · {t('planner.min', { n: i.task.minutes })}
                      </Txt>
                      <Txt variant="bodyBold" color={th.onPastel}>
                        {L(i.task.title, lang)}
                      </Txt>
                    </View>
                    <IconButton icon="close" color={th.onPastel} label={t('planner.remove')} onPress={() => setItems((p) => p.filter((x) => x.id !== i.id))} />
                  </View>
                </View>
              ))}
            </View>
          );
        })}
        <Txt variant="caption" dim center>
          {t('common.medicalNote')}
        </Txt>
        <Spacer h={12} />
        <PillButton label={t('planner.addToRoutine')} disabled={items.length === 0} onPress={addAll} />
        <Spacer h={10} />
        <PillButton label={t('planner.regenerate')} kind="outline" icon="refresh" onPress={() => make(items.map((i) => i.id))} />
        <Spacer h={6} />
        <PillButton label={t('planner.editAnswers')} kind="ghost" onPress={() => setStep(0)} />
      </Screen>
    );
  }

  const q = ['wake', 'energy', 'areas', 'minutes'][step];
  return (
    <Screen header={header}>
      <Txt variant="caption" dim>
        {t('planner.step', { n: step + 1, total: STEPS })}
      </Txt>
      <Spacer h={6} />
      <Bar value={(step + 1) / STEPS} color={th.primary} />
      <Spacer h={18} />
      <Txt variant="h1">{t(`planner.q.${q}`)}</Txt>
      {q === 'areas' || q === 'minutes' ? (
        <Txt dim style={{ marginTop: 4 }}>
          {t(`planner.q.${q}Hint`)}
        </Txt>
      ) : null}
      <Spacer h={18} />

      {q === 'wake' ? (
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {WAKES.map((w) => (
            <Chip key={w} label={fmtTime(w, lang)} active={a.wake === w} onPress={() => setA({ ...a, wake: w })} />
          ))}
        </Row>
      ) : null}

      {q === 'energy'
        ? ENERGIES.map((e) => (
            <Pressable key={e} onPress={() => setA({ ...a, energy: e })} style={{ marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: radius.lg,
                  backgroundColor: th.pastel[e === 'low' ? 'purple' : e === 'mid' ? 'yellow' : 'peach'],
                  borderWidth: 2,
                  borderColor: a.energy === e ? th.primary : 'transparent',
                }}
              >
                <Text style={{ fontSize: 34 }}>{ENERGY_EMOJI[e]}</Text>
                <View style={{ flex: 1 }}>
                  <Txt variant="h3" color={th.onPastel}>
                    {t(`planner.energy.${e}`)}
                  </Txt>
                  <Txt variant="small" color={th.onPastel}>
                    {t(`planner.energy.${e}Hint`)}
                  </Txt>
                </View>
              </View>
            </Pressable>
          ))
        : null}

      {q === 'areas'
        ? AREAS.map((ar) => {
            const on = a.areas.includes(ar);
            return (
              <Pressable key={ar} onPress={() => toggleArea(ar)} style={{ marginBottom: 10 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: radius.lg,
                    backgroundColor: th.pastel[AREA_PASTEL[ar]],
                    borderWidth: 2,
                    borderColor: on ? th.primary : 'transparent',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyBold" color={th.onPastel}>
                      {t(`planner.area.${ar}`)}
                    </Txt>
                    {ar === 'wellness' ? (
                      <Txt variant="caption" color={th.onPastel}>
                        {t('planner.area.wellnessHint')}
                      </Txt>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 22 }}>{on ? '✅' : '⚪'}</Text>
                </View>
              </Pressable>
            );
          })
        : null}

      {q === 'minutes' ? (
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {MINUTES.map((m) => (
            <Chip key={m} label={t(`planner.minutes.m${m}`)} active={a.minutes === m} onPress={() => setA({ ...a, minutes: m })} />
          ))}
        </Row>
      ) : null}

      <Spacer h={24} />
      <PillButton label={t('common.btn.next')} arrow onPress={next} />
    </Screen>
  );
}
