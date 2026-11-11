import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Card, Chip, EmptyState, Field, Header, IconButton, PillButton, Row, Screen, Txt, tap } from '../../src/components/ui';
import type { Weekday } from '../../src/engine/types';
import { nextAlarm, nextOccurrence, rescheduleAlarms } from '../../src/features/toolsb/alarmSchedule';
import { DAYS_SHORT, fmtTime, useLang, useT } from '../../src/i18n';
import { useAlarm, type AlarmItem } from '../../src/store/slices/alarm';
import { radius, useTheme } from '../../src/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const WEEK: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
interface Draft {
  id?: string;
  hour: number;
  minute: number;
  days: Weekday[];
  label: string;
  enabled: boolean;
}

export default function AlarmScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const alarms = useAlarm((s) => s.alarms);
  const hydrated = useAlarm((s) => s.hydrated);
  const save = useAlarm((s) => s.save);
  const toggle = useAlarm((s) => s.toggle);
  const remove = useAlarm((s) => s.remove);
  const setAll = useAlarm((s) => s.setAll);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tick, setTick] = useState(0);

  // açılışta geçmiş tek seferlik alarmları kapat; dakikada bir "x dk sonra" bilgisini tazele
  useEffect(() => {
    if (!hydrated) return;
    const n = Date.now();
    const stale = alarms.some((a) => a.enabled && a.days.length === 0 && a.onceAt && new Date(a.onceAt).getTime() <= n);
    if (stale) setAll(alarms.map((a) => (a.enabled && a.days.length === 0 && a.onceAt && new Date(a.onceAt).getTime() <= n ? { ...a, enabled: false } : a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // her değişiklikte bildirim grubunu yeniden kur
  useEffect(() => {
    if (hydrated) void rescheduleAlarms(alarms);
  }, [alarms, hydrated]);

  const sorted = useMemo(() => [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)), [alarms]);
  const nxt = useMemo(() => nextAlarm(alarms), [alarms, tick]);

  const inText = () => {
    if (!nxt) return t('alarm.nextNone');
    const mins = Math.max(1, Math.ceil((nxt.at.getTime() - Date.now()) / 60000));
    const d = Math.floor(mins / 1440);
    const h = Math.floor((mins % 1440) / 60);
    const m = mins % 60;
    const txt = d > 0 ? t('alarm.inDhm', { d, h, m }) : h > 0 ? t('alarm.inHm', { h, m }) : t('alarm.inM', { m });
    return t('alarm.next', { in: txt });
  };

  const daysText = (a: AlarmItem) =>
    a.days.length === 0 ? t('alarm.once') : a.days.length === 7 ? t('alarm.everyDay') : [...a.days].sort().map((d) => DAYS_SHORT[lang][d]).join(' ');

  const commit = () => {
    if (!draft) return;
    const onceAt = draft.days.length === 0 ? nextOccurrence(draft).toISOString() : undefined;
    save({ ...draft, label: draft.label.trim(), onceAt });
    setDraft(null);
  };

  const onToggle = (a: AlarmItem, v: boolean) => {
    tap();
    if (v && a.days.length === 0) save({ ...a, enabled: true, onceAt: nextOccurrence(a).toISOString() });
    else toggle(a.id, v);
  };

  // ---------- ekle / düzenle ----------
  if (draft) {
    const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p });
    const wrap = (v: number, max: number) => ((v % max) + max) % max;
    const Col = ({ label, value, onUp, onDown }: { label: string; value: number; onUp: () => void; onDown: () => void }) => (
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Txt variant="caption" dim>
          {label}
        </Txt>
        <IconButton icon="chevron-up" onPress={onUp} size={30} />
        <Txt size={64} weight="800" style={{ fontVariant: ['tabular-nums'] }}>
          {pad(value)}
        </Txt>
        <IconButton icon="chevron-down" onPress={onDown} size={30} />
      </View>
    );
    return (
      <Screen header={<Header title={draft.id ? t('alarm.editAlarm') : t('alarm.newAlarm')} left="close" onLeft={() => setDraft(null)} />}>
        <Card padding={16}>
          <Row>
            <Col label={t('alarm.hour')} value={draft.hour} onUp={() => set({ hour: wrap(draft.hour + 1, 24) })} onDown={() => set({ hour: wrap(draft.hour - 1, 24) })} />
            <Txt size={56} weight="800">
              :
            </Txt>
            <Col label={t('alarm.minute')} value={draft.minute} onUp={() => set({ minute: wrap(draft.minute + 1, 60) })} onDown={() => set({ minute: wrap(draft.minute - 1, 60) })} />
          </Row>
          <Txt variant="caption" dim style={{ marginTop: 6, marginBottom: 6 }}>
            {t('alarm.quick')}
          </Txt>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {[0, 15, 30, 45].map((m) => (
              <Chip key={m} label={`:${pad(m)}`} active={draft.minute === m} onPress={() => set({ minute: m })} />
            ))}
            <Chip label="+5" onPress={() => set({ minute: wrap(draft.minute + 5, 60) })} />
            <Chip label="-5" onPress={() => set({ minute: wrap(draft.minute - 5, 60) })} />
          </Row>
        </Card>

        <Txt variant="h3" style={{ marginTop: 18, marginBottom: 8 }}>
          {t('alarm.days')}
        </Txt>
        <Row gap={6}>
          {WEEK.map((d) => {
            const on = draft.days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => {
                  tap();
                  set({ days: on ? draft.days.filter((x) => x !== d) : [...draft.days, d].sort() as Weekday[] });
                }}
                style={{ flex: 1, height: 44, borderRadius: radius.pill, backgroundColor: on ? th.primary : th.card, borderWidth: 1, borderColor: on ? th.primary : th.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Txt variant="small" weight="700" color={on ? th.onPrimary : th.text}>
                  {DAYS_SHORT[lang][d].slice(0, 3)}
                </Txt>
              </Pressable>
            );
          })}
        </Row>
        <Txt variant="small" dim style={{ marginTop: 6 }}>
          {draft.days.length === 0 ? t('alarm.once') : draft.days.length === 7 ? t('alarm.everyDay') : ''}
        </Txt>

        <View style={{ marginTop: 14 }}>
          <Field label={t('alarm.label')} placeholder={t('alarm.labelPh')} value={draft.label} onChangeText={(label) => set({ label })} maxLength={40} />
        </View>

        <View style={{ gap: 10, marginTop: 20 }}>
          <PillButton label={t('common.btn.save')} onPress={commit} />
          {draft.id ? (
            <PillButton
              label={t('common.btn.delete')}
              kind="outline"
              onPress={() => {
                remove(draft.id!);
                setDraft(null);
              }}
            />
          ) : null}
        </View>
        <Txt variant="caption" faint center style={{ marginTop: 14 }}>
          {t('alarm.note')}
        </Txt>
      </Screen>
    );
  }

  // ---------- liste ----------
  return (
    <Screen header={<Header title={t('alarm.title')} />}>
      {sorted.length > 0 ? (
        <Card bg={th.pastel.yellow} padding={14} style={{ marginBottom: 14 }}>
          <Txt variant="bodyBold" color={th.onPastel}>
            ⏰ {inText()}
          </Txt>
        </Card>
      ) : null}
      {sorted.length === 0 ? (
        <EmptyState emoji="⏰" title={t('alarm.emptyTitle')} body={t('alarm.emptyBody')} />
      ) : (
        <View style={{ gap: 10 }}>
          {sorted.map((a) => (
            <Card key={a.id} padding={16}>
              <Row between>
                {/* Düzenleme alanı ile anahtar kardeş: anahtara dokunmak kartın düzenleme dokunuşuna sızmaz (BUG-006). */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('common.btn.edit')} ${fmtTime(`${pad(a.hour)}:${pad(a.minute)}`, lang)}`}
                  onPress={() => setDraft({ id: a.id, hour: a.hour, minute: a.minute, days: a.days, label: a.label, enabled: a.enabled })}
                  style={({ pressed }) => ({ flex: 1, paddingRight: 10, opacity: pressed ? 0.7 : 1 })}
                >
                  <Txt size={38} weight="800" dim={!a.enabled} style={{ fontVariant: ['tabular-nums'] }}>
                    {fmtTime(`${pad(a.hour)}:${pad(a.minute)}`, lang)}
                  </Txt>
                  <Txt variant="small" dim numberOfLines={1}>
                    {a.label ? `${a.label} · ` : ''}
                    {daysText(a)}
                  </Txt>
                </Pressable>
                <Switch
                  value={a.enabled}
                  onValueChange={(v) => onToggle(a, v)}
                  trackColor={{ true: th.success, false: th.borderInput }}
                  accessibilityLabel={`${fmtTime(`${pad(a.hour)}:${pad(a.minute)}`, lang)}${a.label ? ` ${a.label}` : ''}`}
                />
              </Row>
            </Card>
          ))}
        </View>
      )}
      <View style={{ marginTop: 20 }}>
        <PillButton
          label={t('alarm.add')}
          icon="add"
          onPress={() => {
            const d = new Date(Date.now() + 3600000);
            setDraft({ hour: d.getHours(), minute: 0, days: [], label: '', enabled: true });
          }}
        />
      </View>
      <Txt variant="caption" faint center style={{ marginTop: 14 }}>
        {t('alarm.note')}
      </Txt>
    </Screen>
  );
}
