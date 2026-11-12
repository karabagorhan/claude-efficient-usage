/**
 * Görev düzenleyici (SPEC §3.4). id = görev id'si ya da 'new' (URL parametreleriyle ön dolu, CONTRACTS §8).
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Card, Chip, Header, IconButton, PillButton, Row, Screen, Txt, tap, warn } from '../../src/components/ui';
import { CONFIG } from '../../src/engine/config';
import { addDays } from '../../src/engine/dates';
import { nextPlannedDays, validEvery } from '../../src/engine/points';
import {
  PASTEL_KEYS,
  type Difficulty,
  type EveryUnit,
  type Habit,
  type HabitKind,
  type HabitLink,
  type PastelKey,
  type Slot,
  type Weekday,
} from '../../src/engine/types';
import { applyCalendar, dropCalendar } from '../../src/features/calendar/apply';
import { CalendarRow } from '../../src/features/calendar/CalendarRow';
import { calKey, habitSpecs, isInCalendar } from '../../src/lib/calendar';
import { DAYS_SHORT, fmtDay, useLang, useT } from '../../src/i18n';
import { today, useCore, type HabitDraft } from '../../src/store/core';
import { radius, useTheme } from '../../src/theme';

const EMOJIS = [
  '✅', '💧', '🛏️', '🍳', '🪥', '💊', '🏃', '🧘', '📖', '✏️', '🧹', '🧺',
  '🍽️', '🪴', '💰', '📞', '🎯', '🧠', '🎧', '🌞', '🌙', '🍎', '🥗', '🚶',
  '🧴', '💅', '💇', '🪟', '🗑️', '🖥️', '📝', '🙏', '😊', '❤️', '⭐', '🔥',
];
const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'anytime'];
const KINDS: HabitKind[] = ['check', 'counter', 'timer'];
const DIFFS: Difficulty[] = ['mini', 'easy', 'medium', 'hard', 'epic'];
const QUICK_TIMES = ['07:00', '09:00', '12:00', '18:00', '21:00'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const LINKS: HabitLink[] = ['drink', 'mood', 'reflection', 'smoke', 'meal', 'chore', 'study', 'growth'];
const UNITS: EveryUnit[] = ['day', 'week', 'month'];
const EVERY_MAX: Record<EveryUnit, number> = { day: 90, week: 26, month: 12 };
type Mode = 'daily' | 'days' | 'quota' | 'every';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Yazarken "0830" -> "08:30" */
const maskTime = (raw: string) => {
  const d = raw.replace(/[^0-9]/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

function Label({ children }: { children: string }) {
  return (
    <Txt variant="bodyBold" style={{ marginTop: 22, marginBottom: 10 }}>
      {children}
    </Txt>
  );
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label?: string }) {
  const t = useTheme();
  return (
    <Row gap={14}>
      <IconButton icon="remove" size={22} bg={t.cardAlt} onPress={() => onChange(Math.max(min, value - 1))} />
      <Txt variant="h3" style={{ minWidth: 60, textAlign: 'center' }}>
        {label ?? String(value)}
      </Txt>
      <IconButton icon="add" size={22} bg={t.cardAlt} onPress={() => onChange(Math.min(max, value + 1))} />
    </Row>
  );
}

function TimeField({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  const t = useTheme();
  const tr = useT();
  const invalid = value.length > 0 && !TIME_RE.test(value);
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={(s) => onChange(maskTime(s))}
        placeholder={placeholder}
        placeholderTextColor={t.textFaint}
        keyboardType="number-pad"
        maxLength={5}
        style={{
          height: 52,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: invalid ? t.danger : t.border,
          backgroundColor: t.card,
          color: t.text,
          paddingHorizontal: 16,
          fontSize: 17,
          fontWeight: '600',
        }}
      />
      {invalid ? (
        <Txt variant="small" color={t.dangerText} style={{ marginTop: 6 }}>
          {tr('newtask.editor.reminderInvalid')}
        </Txt>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <Chip label={tr('newtask.editor.reminderNone')} active={value === ''} onPress={() => onChange('')} />
        {QUICK_TIMES.map((q) => (
          <Chip key={q} label={q} active={value === q} onPress={() => onChange(q)} />
        ))}
      </View>
    </View>
  );
}

export default function TaskEditor() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const params = useLocalSearchParams<Record<string, string>>();
  const id = one(params.id) ?? 'new';
  const existing = useCore((s) => (id !== 'new' ? s.habits[id] : undefined));
  const isNew = id === 'new' || !existing;

  const pick = <T extends string>(v: string | undefined, allowed: readonly T[]): T | undefined => (v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined);
  const initial = useMemo(() => {
    const h = existing;
    const p = {
      title: one(params.title),
      icon: one(params.icon),
      pastel: pick(one(params.pastel), PASTEL_KEYS),
      slot: pick(one(params.slot), SLOTS),
      kind: pick(one(params.kind), KINDS),
      target: Number(one(params.target)) || undefined,
      link: pick(one(params.link), LINKS),
      source: one(params.source),
      difficulty: pick(one(params.difficulty), DIFFS),
    };
    return {
      title: h?.title ?? p.title ?? '',
      icon: h?.icon ?? p.icon ?? '✅',
      pastel: (h?.pastel ?? p.pastel ?? 'blue') as PastelKey,
      slot: (h?.slot ?? p.slot ?? 'anytime') as Slot,
      kind: (h?.kind ?? p.kind ?? 'check') as HabitKind,
      target: h?.target ?? p.target ?? (p.kind === 'timer' ? 10 : 1),
      step: h?.step ?? 1,
      mode: (h?.schedule.weeklyQuota ? 'quota' : validEvery(h?.schedule.every) ? 'every' : h?.schedule.days?.length ? 'days' : 'daily') as Mode,
      days: (validEvery(h?.schedule.every) ? [] : (h?.schedule.days ?? [])) as Weekday[],
      quota: h?.schedule.weeklyQuota ?? 3,
      everyUnit: (validEvery(h?.schedule.every) ? h!.schedule.every!.unit : 'day') as EveryUnit,
      everyN: validEvery(h?.schedule.every) ? h!.schedule.every!.n : 2,
      everyAnchor: validEvery(h?.schedule.every) ? h!.schedule.every!.anchor : today(),
      everyDays: (validEvery(h?.schedule.every) ? (h?.schedule.days ?? []) : []) as Weekday[],
      difficulty: (h?.difficulty ?? p.difficulty ?? 'easy') as Difficulty,
      reminder: h?.reminderTime ?? '',
      due: h?.dueTime ?? '',
      isPrivate: h?.isPrivate ?? false,
      together: h?.together ?? false,
      link: (h?.link ?? p.link) as HabitLink | undefined,
      source: h?.source ?? p.source,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id, id]);

  const [title, setTitle] = useState(initial.title);
  const [icon, setIcon] = useState(initial.icon);
  const [pastel, setPastel] = useState<PastelKey>(initial.pastel);
  const [slot, setSlot] = useState<Slot>(initial.slot);
  const [kind, setKind] = useState<HabitKind>(initial.kind);
  const [target, setTarget] = useState(initial.target);
  const [step, setStep] = useState(initial.step);
  const [mode, setMode] = useState(initial.mode);
  const [days, setDays] = useState<Weekday[]>(initial.days);
  const [quota, setQuota] = useState(initial.quota);
  const [everyUnit, setEveryUnit] = useState<EveryUnit>(initial.everyUnit);
  const [everyN, setEveryN] = useState(initial.everyN);
  const [everyAnchor, setEveryAnchor] = useState(initial.everyAnchor);
  const [everyDays, setEveryDays] = useState<Weekday[]>(initial.everyDays);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [reminder, setReminder] = useState(initial.reminder);
  const [due, setDue] = useState(initial.due);
  const [isPrivate, setIsPrivate] = useState(initial.isPrivate);
  const [together, setTogether] = useState(initial.together);
  const [confirmDel, setConfirmDel] = useState(false);
  const [cal, setCal] = useState(() => (existing ? isInCalendar(calKey.habit(existing.id)) : false));

  const nameOk = title.trim().length > 0;
  const daysOk = mode !== 'days' || days.length > 0;
  const timesOk = (reminder === '' || TIME_RE.test(reminder)) && (due === '' || TIME_RE.test(due));
  const canSave = nameOk && daysOk && timesOk;

  const leave = () => {
    if (isNew && router.canDismiss()) router.dismissAll();
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const save = () => {
    if (!canSave) return;
    const draft: HabitDraft = {
      ...(existing ? { id: existing.id } : {}),
      title: title.trim(),
      icon: icon.trim() || '✅',
      pastel,
      slot,
      kind,
      target: kind === 'check' ? undefined : target,
      step: kind === 'counter' && step > 1 ? step : undefined,
      schedule:
        mode === 'quota'
          ? { days: [], weeklyQuota: quota }
          : mode === 'every'
            ? { days: everyUnit === 'week' ? [...everyDays].sort() : [], every: { unit: everyUnit, n: everyN, anchor: everyAnchor } }
            : { days: mode === 'days' ? [...days].sort() : [] },
      difficulty,
      reminderTime: reminder || undefined,
      dueTime: due || undefined,
      isPrivate,
      together,
      link: initial.link,
      source: initial.source,
    };
    const core = useCore.getState();
    const savedId = core.saveHabit(draft);
    void applyCalendar(calKey.habit(savedId), cal && reminder !== '', habitSpecs(savedId));
    core.pushToast('toast.saved');
    leave();
  };

  const remove = () => {
    if (!existing) return;
    warn();
    dropCalendar(calKey.habit(existing.id));
    useCore.getState().archiveHabit(existing.id);
    leave();
  };

  const toggleDay = (d: Weekday) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  const toggleEveryDay = (d: Weekday) => setEveryDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  // önizleme: sıradaki 3 planlı gün (bugünden ya da başlangıçtan)
  const nextDays = useMemo(() => {
    if (mode !== 'every') return [];
    const probe = {
      id: 'probe',
      createdAt: '2000-01-01T00:00:00.000Z',
      archived: false,
      schedule: { days: everyUnit === 'week' ? everyDays : [], every: { unit: everyUnit, n: everyN, anchor: everyAnchor } },
    } as unknown as Habit;
    const from = everyAnchor > today() ? everyAnchor : today();
    return nextPlannedDays(probe, from, 3, 800);
  }, [mode, everyUnit, everyN, everyAnchor, everyDays]);
  const everyLabelKey = everyUnit === 'day' ? 'task.schedule.everyDay' : everyUnit === 'week' ? 'task.schedule.everyWeek' : 'task.schedule.everyMonth';
  const bg = t.pastel[pastel];

  return (
    <Screen header={<Header left="close" title={isNew ? tr('newtask.editor.titleNew') : tr('newtask.editor.titleEdit')} />} padBottom={48}>
      {/* Önizleme + ad */}
      <Card bg={bg} padding={0} style={{ marginTop: 8 }}>
        <Row gap={14} style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
          <Text style={{ fontSize: 40, width: 48, textAlign: 'center' }}>{icon || '✅'}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={tr('task.namePlaceholder')}
            placeholderTextColor={t.isDark ? '#ffffff77' : '#14171A77'}
            maxLength={60}
            autoFocus={isNew && !title}
            style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: '800', color: t.onPastel, paddingVertical: 6 }}
          />
        </Row>
      </Card>
      {!nameOk ? (
        <Txt variant="small" dim style={{ marginTop: 6 }}>
          {tr('newtask.editor.nameRequired')}
        </Txt>
      ) : null}
      {initial.link ? (
        <Txt variant="small" dim style={{ marginTop: 8 }}>
          {tr('newtask.editor.linkedNote', { tool: tr(`task.link.${initial.link}`) })}
        </Txt>
      ) : null}

      <Label>{tr('task.emoji')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => {
              tap();
              setIcon(e);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: icon === e ? bg : t.card,
              borderWidth: 1.5,
              borderColor: icon === e ? t.primary : t.border,
            }}
          >
            <Text style={{ fontSize: 24 }}>{e}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={EMOJIS.includes(icon) ? '' : icon}
        onChangeText={(s) => setIcon(Array.from(s).slice(-2).join('') || icon)}
        placeholder={tr('newtask.editor.emojiCustom')}
        placeholderTextColor={t.textFaint}
        style={{ marginTop: 10, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, backgroundColor: t.card, color: t.text, paddingHorizontal: 14, fontSize: 18 }}
      />

      <Label>{tr('task.color')}</Label>
      <Row gap={10} style={{ flexWrap: 'wrap' }}>
        {PASTEL_KEYS.map((k) => (
          <Pressable
            key={k}
            accessibilityLabel={k}
            onPress={() => {
              tap();
              setPastel(k);
            }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.pastel[k], borderWidth: pastel === k ? 3 : 1, borderColor: pastel === k ? t.primary : t.border }}
          />
        ))}
      </Row>

      <Label>{tr('task.slot.label')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SLOTS.map((s) => (
          <Chip key={s} label={tr(`task.slot.${s}`)} active={slot === s} onPress={() => setSlot(s)} />
        ))}
      </View>

      <Label>{tr('task.schedule.label')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label={tr('task.schedule.daily')} active={mode === 'daily'} onPress={() => setMode('daily')} />
        <Chip label={tr('task.schedule.days')} active={mode === 'days'} onPress={() => setMode('days')} />
        <Chip label={tr('task.schedule.weeklyLabel')} active={mode === 'quota'} onPress={() => setMode('quota')} />
        <Chip label={tr('task.schedule.everyLabel')} active={mode === 'every'} onPress={() => setMode('every')} />
      </View>
      {mode === 'every' ? (
        <Card style={{ marginTop: 12 }}>
          <Txt variant="small" dim style={{ marginBottom: 8 }}>
            {tr('newtask.editor.everyEvery')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {UNITS.map((u) => (
              <Chip
                key={u}
                label={tr(`task.schedule.unit.${u}`)}
                active={everyUnit === u}
                onPress={() => {
                  setEveryUnit(u);
                  setEveryN((n) => Math.min(n, EVERY_MAX[u]));
                }}
              />
            ))}
          </View>
          <Stepper value={everyN} min={1} max={EVERY_MAX[everyUnit]} onChange={setEveryN} label={tr(everyLabelKey, { n: everyN })} />
          {everyUnit === 'week' ? (
            <View style={{ marginTop: 14 }}>
              <Txt variant="small" dim style={{ marginBottom: 8 }}>
                {tr('newtask.editor.everyWeekDays')}
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DAYS_SHORT[lang].map((d, i) => (
                  <Chip key={i} label={d} active={everyDays.includes(i as Weekday)} onPress={() => toggleEveryDay(i as Weekday)} />
                ))}
              </View>
            </View>
          ) : null}
          <Txt variant="small" dim style={{ marginTop: 14, marginBottom: 8 }}>
            {tr('newtask.editor.everyStart')}
          </Txt>
          <Row gap={10}>
            <IconButton icon="chevron-back" size={22} bg={t.cardAlt} label={tr('newtask.editor.prevDay')} onPress={() => setEveryAnchor((a) => addDays(a, -1))} />
            <Txt variant="bodyBold" center style={{ flex: 1 }}>
              {fmtDay(everyAnchor, lang)}
            </Txt>
            <IconButton icon="chevron-forward" size={22} bg={t.cardAlt} label={tr('newtask.editor.nextDay')} onPress={() => setEveryAnchor((a) => addDays(a, 1))} />
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <Chip label={tr('newtask.editor.today')} active={everyAnchor === today()} onPress={() => setEveryAnchor(today())} />
            <Chip label={tr('newtask.editor.tomorrow')} active={everyAnchor === addDays(today(), 1)} onPress={() => setEveryAnchor(addDays(today(), 1))} />
          </View>
          <Txt variant="small" dim style={{ marginTop: 10 }}>
            {everyUnit === 'month' ? tr('newtask.editor.everyMonthHint', { d: Number(everyAnchor.slice(8, 10)) }) : tr('newtask.editor.everyStartHint')}
          </Txt>
          {nextDays.length ? (
            <Txt variant="small" weight="700" style={{ marginTop: 8 }}>
              {tr('newtask.editor.everyNext', { days: nextDays.map((d) => fmtDay(d, lang, 'short')).join(' · ') })}
            </Txt>
          ) : null}
        </Card>
      ) : null}
      {mode === 'days' ? (
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DAYS_SHORT[lang].map((d, i) => (
              <Chip key={i} label={d} active={days.includes(i as Weekday)} onPress={() => toggleDay(i as Weekday)} />
            ))}
          </View>
          {days.length === 0 ? (
            <Txt variant="small" color={t.dangerText} style={{ marginTop: 6 }}>
              {tr('newtask.editor.daysNone')}
            </Txt>
          ) : null}
        </View>
      ) : null}
      {mode === 'quota' ? (
        <View style={{ marginTop: 12 }}>
          <Txt variant="small" dim style={{ marginBottom: 8 }}>
            {tr('newtask.editor.quota')}
          </Txt>
          <Stepper value={quota} min={1} max={7} onChange={setQuota} label={tr('task.schedule.weekly', { n: quota })} />
        </View>
      ) : null}

      <Label>{tr('task.kind.label')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {KINDS.map((k) => (
          <Chip
            key={k}
            label={tr(`task.kind.${k}`)}
            active={kind === k}
            onPress={() => {
              setKind(k);
              if (k === 'timer' && target < 5) setTarget(10);
              if (k === 'counter' && target > 50) setTarget(8);
            }}
          />
        ))}
      </View>
      {kind === 'counter' ? (
        <View style={{ marginTop: 12, gap: 14 }}>
          <View>
            <Txt variant="small" dim style={{ marginBottom: 8 }}>
              {tr('newtask.editor.goal')}
            </Txt>
            <Stepper value={target} min={1} max={50} onChange={setTarget} label={tr('newtask.editor.goalCount', { n: target })} />
          </View>
          <View>
            <Txt variant="small" dim style={{ marginBottom: 8 }}>
              {tr('newtask.editor.step')}
            </Txt>
            <Stepper value={step} min={1} max={Math.max(1, target)} onChange={setStep} />
          </View>
        </View>
      ) : null}
      {kind === 'timer' ? (
        <View style={{ marginTop: 12 }}>
          <Txt variant="small" dim style={{ marginBottom: 8 }}>
            {tr('newtask.editor.minutes')}
          </Txt>
          <Stepper value={target} min={1} max={240} onChange={setTarget} label={tr('common.unit.minutes', { n: target })} />
        </View>
      ) : null}

      <Label>{tr('task.difficulty.label')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DIFFS.map((d) => (
          <Chip key={d} label={`${tr(`task.difficulty.${d}`)} · ${tr('newtask.editor.points', { n: CONFIG.basePoints[d] })}`} active={difficulty === d} onPress={() => setDifficulty(d)} />
        ))}
      </View>

      <Label>{tr('task.reminder')}</Label>
      <TimeField value={reminder} onChange={setReminder} placeholder={tr('newtask.editor.reminderHint')} />

      <Label>{tr('newtask.editor.dueLabel')}</Label>
      <TimeField value={due} onChange={setDue} placeholder={tr('newtask.editor.reminderHint')} />
      <Txt variant="small" dim style={{ marginTop: 8 }}>
        {tr('newtask.editor.dueHint')}
      </Txt>

      <Card style={{ marginTop: 24 }}>
        <Row between gap={12}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyBold">{tr('task.private')}</Txt>
            <Txt variant="small" dim>
              {tr('newtask.editor.privateHint')}
            </Txt>
          </View>
          <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: t.purple, false: t.borderInput }} accessibilityLabel={tr('task.private')} />
        </Row>
        <View style={{ height: 1, backgroundColor: t.border, marginVertical: 14 }} />
        <Row between gap={12}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyBold">{tr('task.together')}</Txt>
            <Txt variant="small" dim>
              {tr('newtask.editor.togetherHint')}
            </Txt>
          </View>
          <Switch value={together} onValueChange={setTogether} trackColor={{ true: t.purple, false: t.borderInput }} accessibilityLabel={tr('task.together')} />
        </Row>
      </Card>

      <CalendarRow
        label={tr('newtask.calendar.label')}
        hint={tr('newtask.calendar.hint')}
        unsupported={tr('newtask.calendar.unsupported')}
        needs={reminder && TIME_RE.test(reminder) ? undefined : tr('newtask.calendar.needReminder')}
        value={cal}
        onChange={setCal}
      />

      <View style={{ marginTop: 28 }}>
        <PillButton label={tr('common.btn.save')} onPress={save} disabled={!canSave} />
      </View>

      {!isNew ? (
        confirmDel ? (
          <Card style={{ marginTop: 16 }}>
            <Txt variant="bodyBold" center>
              {tr('newtask.editor.deleteAsk')}
            </Txt>
            <Txt variant="small" dim center style={{ marginTop: 4, marginBottom: 14 }}>
              {tr('task.archiveConfirm')}
            </Txt>
            <PillButton label={tr('newtask.editor.deleteYes')} color={t.danger} textColor={t.onDanger} onPress={remove} />
            <View style={{ height: 10 }} />
            <PillButton label={tr('newtask.editor.keep')} kind="outline" onPress={() => setConfirmDel(false)} />
          </Card>
        ) : (
          <View style={{ marginTop: 12 }}>
            <PillButton label={tr('task.archive')} kind="ghost" textColor={t.dangerText} icon="trash-outline" onPress={() => setConfirmDel(true)} />
          </View>
        )
      ) : null}
    </Screen>
  );
}
