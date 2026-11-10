/**
 * Hedef ekle/düzenle (modal). id = hedef id ya da 'new'. SPEC §6.6.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Bar, Card, Chip, EmptyState, Field, Header, IconButton, PillButton, Row, Screen, Segmented, Txt } from '../../../src/components/ui';
import { goalPercent } from '../../../src/features/growth/calc';
import { ensureGrowthNotifSync } from '../../../src/features/growth/notify';
import { AREA_META, AREAS, isArea, type Goal } from '../../../src/features/growth/types';
import { ChecklistEditor, ConfirmDelete, DateField, Label, Stepper } from '../../../src/features/study/ui';
import { fmtDay, useLang, useT } from '../../../src/i18n';
import { routes } from '../../../src/lib/routes';
import { useGrowth, type GoalDraft } from '../../../src/store/slices/growth';
import { radius, useTheme } from '../../../src/theme';

const close = () => (router.canGoBack() ? router.back() : router.replace(routes.growth()));

const numOf = (s: string): number | undefined => {
  const n = parseFloat(s.replace(',', '.').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};
const numStr = (n?: number) => (n === undefined ? '' : String(n));

export default function GoalScreen() {
  const { id, area } = useLocalSearchParams<{ id: string; area?: string }>();
  const isNew = !id || id === 'new';
  const existing = useGrowth((s) => (isNew ? undefined : s.goals[id]));
  const hydrated = useGrowth((s) => s.hydrated);
  const tr = useT();
  useEffect(() => {
    ensureGrowthNotifSync();
  }, []);
  if (!isNew && !existing) {
    return (
      <Screen header={<Header left="close" onLeft={close} />}>
        {hydrated ? <EmptyState emoji="🔍" title={tr('growth.goal.notFound')} action={{ label: tr('common.btn.close'), onPress: close }} /> : null}
      </Screen>
    );
  }
  return <GoalForm key={existing?.id ?? 'new'} existing={existing} area={area} />;
}

function GoalForm({ existing, area }: { existing?: Goal; area?: string }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const { saveGoal, deleteGoal, addCheckin } = useGrowth(useShallow((s) => ({ saveGoal: s.saveGoal, deleteGoal: s.deleteGoal, addCheckin: s.addCheckin })));
  const live = useGrowth((s) => (existing ? s.goals[existing.id] : undefined));
  const [d, setD] = useState<GoalDraft>(() =>
    existing
      ? { ...existing, milestones: [...existing.milestones] }
      : { title: '', area: isArea(area) ? area : 'career', measure: 'number', startValue: 0, current: 0, milestones: [], checkins: [] },
  );
  const [startS, setStartS] = useState(numStr(d.startValue));
  const [targetS, setTargetS] = useState(numStr(d.targetValue));
  const [note, setNote] = useState('');
  const set = (p: Partial<GoalDraft>) => setD((x) => ({ ...x, ...p }));
  const canSave = d.title.trim().length > 0;
  const preview: Goal = { id: 'p', createdAt: '', area: 'career', measure: 'number', milestones: [], checkins: [], ...d, startValue: numOf(startS) ?? 0, targetValue: numOf(targetS) } as Goal;
  const pct = goalPercent(preview);

  const persist = () => {
    if (!canSave) return undefined;
    return saveGoal({ ...d, id: existing?.id, startValue: numOf(startS) ?? 0, targetValue: numOf(targetS), checkins: undefined });
  };
  const save = () => {
    if (persist()) close();
  };
  const checkin = () => {
    const gid = persist();
    if (gid && note.trim()) {
      addCheckin(gid, note);
      setNote('');
    }
  };
  const checkins = live?.checkins ?? [];

  return (
    <Screen
      padBottom={48}
      header={
        <Header
          left="close"
          onLeft={close}
          title={existing ? tr('growth.goal.edit') : tr('growth.goal.new')}
          right={<IconButton icon="checkmark" label={tr('common.btn.save')} onPress={save} color={canSave ? t.text : t.textFaint} />}
        />
      }
    >
      <Field label={tr('growth.goal.titleLabel')} value={d.title} onChangeText={(v) => set({ title: v })} placeholder={tr('growth.goal.titlePh')} autoFocus={!existing} />

      <Label style={{ marginTop: 4 }}>{tr('growth.goal.area')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AREAS.map((a) => (
          <Chip key={a} emoji={AREA_META[a].emoji} label={tr(`growth.area.${a}`)} active={d.area === a} onPress={() => set({ area: a })} />
        ))}
      </View>

      <Label>{tr('growth.goal.why')}</Label>
      <Field value={d.why ?? ''} onChangeText={(v) => set({ why: v })} placeholder={tr('growth.goal.whyPh')} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} containerStyle={{ marginBottom: 0 }} />

      <Label>{tr('growth.goal.target')}</Label>
      <DateField value={d.target} onChange={(day) => set({ target: day })} placeholder={tr('growth.goal.targetPh')} />

      <Label>{tr('growth.goal.measure')}</Label>
      <Segmented
        value={d.measure ?? 'number'}
        onChange={(measure) => set({ measure })}
        options={[
          { id: 'number', label: tr('growth.goal.measureNumber') },
          { id: 'milestones', label: tr('growth.goal.measureMilestones') },
        ]}
      />

      <Card bg={t.pastel[AREA_META[d.area ?? 'career'].pastel]} style={{ marginTop: 14 }}>
        <Row between style={{ marginBottom: 6 }}>
          <Txt variant="bodyBold" color={t.onPastel}>
            {tr('growth.goal.progress')}
          </Txt>
          <Txt variant="bodyBold" color={t.onPastel}>{tr('study.pct', { n: pct })}</Txt>
        </Row>
        <Bar value={pct / 100} color={t.primary} bg={t.card} />
      </Card>

      {d.measure === 'milestones' ? (
        <>
          <Label>{tr('growth.goal.milestones')}</Label>
          <ChecklistEditor items={d.milestones ?? []} onChange={(milestones) => set({ milestones })} placeholder={tr('growth.goal.milestonePh')} />
        </>
      ) : (
        <>
          <Row gap={10} style={{ marginTop: 14 }}>
            <Field label={tr('growth.goal.start')} value={startS} onChangeText={setStartS} keyboardType="decimal-pad" placeholder="0" containerStyle={{ flex: 1 }} onBlur={() => set({ startValue: numOf(startS) ?? 0 })} />
            <Field label={tr('growth.goal.targetValue')} value={targetS} onChangeText={setTargetS} keyboardType="decimal-pad" placeholder="10" containerStyle={{ flex: 1 }} onBlur={() => set({ targetValue: numOf(targetS) })} />
            <Field label={tr('growth.goal.unit')} value={d.unit ?? ''} onChangeText={(v) => set({ unit: v })} placeholder={tr('growth.goal.unitPh')} containerStyle={{ flex: 1 }} />
          </Row>
          <Row between>
            <Txt variant="bodyBold">{tr('growth.goal.current')}</Txt>
            <Stepper value={d.current ?? 0} step={1} min={0} onChange={(v) => set({ current: v, startValue: numOf(startS) ?? 0, targetValue: numOf(targetS) })} format={(v) => `${v}${d.unit ? ` ${d.unit}` : ''}`} width={84} />
          </Row>
        </>
      )}

      {existing ? (
        <>
          <Label style={{ marginTop: 24 }}>{tr('growth.goal.checkin')}</Label>
          <Card>
            <Txt variant="small" dim style={{ marginBottom: 8 }}>
              {tr('growth.goal.checkinSub')}
            </Txt>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={tr('growth.goal.checkinPh')}
              placeholderTextColor={t.textFaint}
              multiline
              style={{ minHeight: 64, color: t.text, fontSize: 16, backgroundColor: t.bg, borderRadius: radius.md, padding: 12, textAlignVertical: 'top' }}
            />
            <PillButton small label={tr('growth.goal.checkinAdd')} icon="chatbox-ellipses-outline" disabled={!note.trim()} onPress={checkin} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
            {checkins.length ? (
              <View style={{ marginTop: 14, gap: 10 }}>
                {checkins.slice(0, 20).map((c) => (
                  <View key={c.id} style={{ borderLeftWidth: 3, borderLeftColor: t.purple, paddingLeft: 10 }}>
                    <Txt variant="caption" dim>
                      {fmtDay(c.dayKey, lang, 'short')}
                      {c.value !== undefined ? ` · ${c.value}${live?.unit ? ` ${live.unit}` : ''}` : ''}
                    </Txt>
                    <Txt>{c.note}</Txt>
                  </View>
                ))}
              </View>
            ) : (
              <Txt variant="small" faint style={{ marginTop: 10 }}>
                {tr('growth.goal.noCheckins')}
              </Txt>
            )}
          </Card>
        </>
      ) : null}

      <PillButton label={tr('common.btn.save')} onPress={save} disabled={!canSave} style={{ marginTop: 24 }} />
      {existing ? (
        <View style={{ marginTop: 12 }}>
          <ConfirmDelete
            label={tr('growth.goal.delete')}
            confirmLabel={tr('growth.goal.confirmDelete')}
            onConfirm={() => {
              deleteGoal(existing.id);
              close();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
