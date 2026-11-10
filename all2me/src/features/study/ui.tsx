/**
 * Okul ve gelişim ekranlarının ortak parçaları: geri sayım rozeti, tarih seçici (kendi takvim ızgarası),
 * sayı adımlayıcı, onaylı silme, onay dairesi, kontrol listesi düzenleyici, mini çubuk grafik, ayar satırı.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { addDays, fmtDate, parseDayKey, weekdayOf } from '../../engine/dates';
import { DAYS_LETTER, fmtDay, fmtTime, MONTHS, useLang, useT } from '../../i18n';
import { uuid } from '../../lib/id';
import { Chip, PillButton, Row, tap, Txt } from '../../components/ui';
import { alpha, radius, useTheme } from '../../theme';
import { today } from '../../store/core';
import { countdown, type CountdownTone } from './calc';

// ---------- Geri sayım rozeti ----------
export function toneColors(tone: CountdownTone, t: ReturnType<typeof useTheme>): { bg: string; fg: string } {
  switch (tone) {
    case 'overdue':
      return { bg: t.danger, fg: '#FFFFFF' };
    case 'today':
      return { bg: t.orange, fg: '#FFFFFF' };
    case 'tomorrow':
      return { bg: t.pastel.yellow, fg: t.onPastel };
    case 'soon':
      return { bg: t.pastel.blue, fg: t.onPastel };
    case 'closed':
      return { bg: t.pastel.green, fg: t.onPastel };
    default:
      return { bg: t.cardAlt, fg: t.textDim };
  }
}

export function CountdownBadge({ due, time, closed, small }: { due?: string; time?: string; closed?: boolean; small?: boolean }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const cd = countdown(due, time, today());
  const tone: CountdownTone = closed ? 'closed' : cd.tone;
  const c = toneColors(tone, t);
  const label = closed
    ? tr('study.cd.closed')
    : tr(cd.key, { ...(cd.params ?? {}), time: cd.params?.time ? fmtTime(cd.params.time, lang) : '' });
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: radius.pill, paddingHorizontal: small ? 8 : 10, paddingVertical: small ? 3 : 5 }}>
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: small ? 11 : 12 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ---------- Onay dairesi ----------
export function CheckCircle({ done, onPress, color, size = 28 }: { done: boolean; onPress: () => void; color?: string; size?: number }) {
  const t = useTheme();
  const c = color ?? t.success;
  return (
    <Pressable
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: done ? c : t.textFaint,
        backgroundColor: done ? c : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {done ? <Ionicons name="checkmark" size={size * 0.62} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

// ---------- Adımlayıcı ----------
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  format,
  width = 64,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
  width?: number;
}) {
  const t = useTheme();
  const btn = (icon: 'remove' | 'add', d: number) => (
    <Pressable
      hitSlop={6}
      onPress={() => {
        tap();
        onChange(Math.max(min, Math.min(max, Math.round((value + d) * 100) / 100)));
      }}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: t.cardAlt,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={t.text} />
    </Pressable>
  );
  return (
    <Row gap={6}>
      {btn('remove', -step)}
      <Txt variant="bodyBold" center style={{ minWidth: width }}>
        {format ? format(value) : String(value)}
      </Txt>
      {btn('add', step)}
    </Row>
  );
}

// ---------- Onaylı silme ----------
export function ConfirmDelete({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const t = useTheme();
  const tr = useT();
  const [ask, setAsk] = useState(false);
  if (!ask) return <PillButton label={label} kind="ghost" icon="trash-outline" textColor={t.danger} onPress={() => setAsk(true)} />;
  return (
    <View style={{ backgroundColor: alpha(t.danger, 0.1), borderRadius: radius.lg, padding: 14, gap: 10 }}>
      <Txt variant="bodyBold" center color={t.danger}>
        {confirmLabel}
      </Txt>
      <Row gap={10}>
        <PillButton small label={tr('common.btn.cancel')} kind="outline" onPress={() => setAsk(false)} style={{ flex: 1 }} />
        <PillButton small label={tr('common.btn.delete')} color={t.danger} textColor="#FFFFFF" onPress={onConfirm} style={{ flex: 1 }} />
      </Row>
    </View>
  );
}

// ---------- Ayar satırı ----------
export function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Row gap={12} style={{ paddingVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyBold">{label}</Txt>
        {sub ? (
          <Txt variant="small" dim>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          tap();
          onChange(v);
        }}
        trackColor={{ false: t.cardAlt, true: t.success }}
        thumbColor="#FFFFFF"
      />
    </Row>
  );
}

/** Küçük büyük harfli bölüm etiketi (form içinde). */
export function Label({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Txt variant="small" weight="700" dim style={[{ marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }, style]}>
      {children}
    </Txt>
  );
}

// ---------- Kontrol listesi (alt görev / kilometre taşı) ----------
export interface CheckItem {
  id: string;
  title: string;
  done: boolean;
}
export function ChecklistEditor({
  items,
  onChange,
  placeholder,
  onChecked,
}: {
  items: CheckItem[];
  onChange: (items: CheckItem[]) => void;
  placeholder: string;
  /** bir öğe işaretlendiğinde (işaret kaldırmada değil) */
  onChecked?: (id: string) => void;
}) {
  const t = useTheme();
  const tr = useT();
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (!v) return;
    onChange([...items, { id: uuid(), title: v, done: false }]);
    setText('');
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const small = (icon: React.ComponentProps<typeof Ionicons>['name'], onPress: () => void, disabled?: boolean, label?: string) => (
    <Pressable accessibilityLabel={label} disabled={disabled} hitSlop={6} onPress={onPress} style={{ padding: 4, opacity: disabled ? 0.25 : 1 }}>
      <Ionicons name={icon} size={18} color={t.textDim} />
    </Pressable>
  );
  return (
    <View style={{ backgroundColor: t.card, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 6 }}>
      {items.map((s, i) => (
        <Row key={s.id} gap={10} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
          <CheckCircle
            size={24}
            done={s.done}
            onPress={() => {
              onChange(items.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)));
              if (!s.done) onChecked?.(s.id);
            }}
          />
          <Txt style={{ flex: 1, textDecorationLine: s.done ? 'line-through' : 'none' }} dim={s.done} numberOfLines={2}>
            {s.title}
          </Txt>
          {small('chevron-up', () => move(i, -1), i === 0, tr('study.a11y.up'))}
          {small('chevron-down', () => move(i, 1), i === items.length - 1, tr('study.a11y.down'))}
          {small('close', () => onChange(items.filter((x) => x.id !== s.id)), false, tr('common.btn.delete'))}
        </Row>
      ))}
      <Row gap={10} style={{ paddingVertical: 6 }}>
        <Ionicons name="add-circle-outline" size={24} color={t.textFaint} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          placeholder={placeholder}
          placeholderTextColor={t.textFaint}
          returnKeyType="done"
          blurOnSubmit={false}
          style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: 8 }}
        />
        {text.trim() ? <Chip label={tr('common.btn.add')} active onPress={add} /> : null}
      </Row>
    </View>
  );
}

// ---------- Mini çubuk grafik ----------
export function MiniBars({ values, labels, highlight, color, height = 64 }: { values: number[]; labels: string[]; highlight?: number; color?: string; height?: number }) {
  const t = useTheme();
  const max = Math.max(1, ...values);
  return (
    <Row gap={6} style={{ alignItems: 'flex-end' }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ height, width: '100%', justifyContent: 'flex-end' }}>
            <View
              style={{
                height: Math.max(4, (v / max) * height),
                borderRadius: 6,
                backgroundColor: v > 0 ? (i === highlight ? (color ?? t.purple) : alpha(color ?? t.purple, 0.45)) : t.cardAlt,
              }}
            />
          </View>
          <Txt variant="caption" faint={i !== highlight} weight={i === highlight ? '700' : undefined} style={{ marginTop: 4 }}>
            {labels[i]}
          </Txt>
        </View>
      ))}
    </Row>
  );
}

// ---------- Tarih seçici ----------
const pad = (n: number) => String(n).padStart(2, '0');
const shiftTime = (hhmm: string, dMin: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const tot = (((h * 60 + m + dMin) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(tot / 60))}:${pad(tot % 60)}`;
};

function monthGrid(year: number, month: number): Array<string | null> {
  const first = fmtDate(new Date(year, month, 1, 12));
  const lead = weekdayOf(first);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array.from({ length: lead }, () => null);
  for (let d = 0; d < days; d++) cells.push(addDays(first, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/**
 * Tarih (+ isteğe bağlı saat) alanı. Dokununca satır içi ay takvimi açılır.
 * Hızlı seçenekler: bugün, yarın, 1 hafta sonra. Saat: ±1 sa, ±5 dk ve hazır saatler.
 */
export function DateField({
  value,
  time,
  onChange,
  withTime = false,
  allowClear = true,
  placeholder,
  showCountdown = true,
}: {
  value?: string;
  time?: string;
  onChange: (day: string | undefined, time: string | undefined) => void;
  withTime?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  showCountdown?: boolean;
}) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const base = value ?? today();
  const [view, setView] = useState(() => {
    const d = parseDayKey(base);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const cells = useMemo(() => monthGrid(view.y, view.m), [view]);
  const td = today();
  const pick = (day: string | undefined, tm = time) => {
    onChange(day, day ? tm : undefined);
    if (day) {
      const d = parseDayKey(day);
      setView({ y: d.getFullYear(), m: d.getMonth() });
    }
  };
  const nav = (d: number) => setView((v) => {
    const m = v.m + d;
    return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
  });

  return (
    <View>
      <Pressable
        onPress={() => {
          tap();
          setOpen((o) => !o);
        }}
        style={{ backgroundColor: t.card, borderRadius: radius.md, borderWidth: 1, borderColor: open ? t.text : t.border, paddingHorizontal: 14, paddingVertical: 12 }}
      >
        <Row gap={10}>
          <Ionicons name="calendar-outline" size={20} color={t.text} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyBold" numberOfLines={1} dim={!value}>
              {value ? fmtDay(value, lang) : (placeholder ?? tr('study.date.pick'))}
            </Txt>
            {value && withTime ? (
              <Txt variant="small" dim>
                {time ? fmtTime(time, lang) : tr('study.date.noTime')}
              </Txt>
            ) : null}
          </View>
          {value && showCountdown ? <CountdownBadge due={value} time={time} small /> : null}
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.textDim} />
        </Row>
      </Pressable>

      {open ? (
        <View style={{ backgroundColor: t.card, borderRadius: radius.lg, padding: 14, marginTop: 8, borderWidth: 1, borderColor: t.border }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label={tr('common.day.today')} active={value === td} onPress={() => pick(td)} />
            <Chip label={tr('common.day.tomorrow')} active={value === addDays(td, 1)} onPress={() => pick(addDays(td, 1))} />
            <Chip label={tr('study.date.inWeek')} active={value === addDays(td, 7)} onPress={() => pick(addDays(td, 7))} />
            {allowClear && value ? <Chip label={tr('study.date.clear')} emoji="✕" onPress={() => pick(undefined)} /> : null}
          </View>

          <Row between style={{ marginTop: 14, marginBottom: 6 }}>
            <Pressable hitSlop={8} onPress={() => nav(-1)} accessibilityLabel={tr('study.a11y.prevMonth')} style={{ padding: 6 }}>
              <Ionicons name="chevron-back" size={20} color={t.text} />
            </Pressable>
            <Txt variant="bodyBold">{`${MONTHS[lang][view.m]} ${view.y}`}</Txt>
            <Pressable hitSlop={8} onPress={() => nav(1)} accessibilityLabel={tr('study.a11y.nextMonth')} style={{ padding: 6 }}>
              <Ionicons name="chevron-forward" size={20} color={t.text} />
            </Pressable>
          </Row>
          <View style={{ flexDirection: 'row' }}>
            {DAYS_LETTER[lang].map((d, i) => (
              <Txt key={i} variant="caption" faint center style={{ flex: 1 }}>
                {d}
              </Txt>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {cells.map((c, i) => {
              const sel = c === value;
              const isToday = c === td;
              return (
                <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 }}>
                  {c ? (
                    <Pressable
                      onPress={() => {
                        tap();
                        pick(c);
                      }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: sel ? t.primary : 'transparent',
                        borderWidth: isToday && !sel ? 1.5 : 0,
                        borderColor: t.text,
                      }}
                    >
                      <Text style={{ color: sel ? t.onPrimary : c < td ? t.textFaint : t.text, fontWeight: sel || isToday ? '800' : '500', fontSize: 15 }}>
                        {Number(c.slice(8))}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>

          {withTime && value ? (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12 }}>
              <Row between>
                <Txt variant="bodyBold">{tr('study.date.time')}</Txt>
                <Chip label={time ? tr('study.date.removeTime') : tr('study.date.addTime')} onPress={() => pick(value, time ? undefined : '23:59')} />
              </Row>
              {time ? (
                <>
                  <Row between style={{ marginTop: 10 }}>
                    <Txt dim>{tr('study.date.hour')}</Txt>
                    <Stepper value={Number(time.slice(0, 2))} min={-1} max={24} onChange={(v) => pick(value, shiftTime(time, (v - Number(time.slice(0, 2))) * 60))} format={() => time.slice(0, 2)} width={40} />
                  </Row>
                  <Row between style={{ marginTop: 8 }}>
                    <Txt dim>{tr('study.date.minute')}</Txt>
                    <Stepper value={Number(time.slice(3))} step={5} min={-5} max={64} onChange={(v) => pick(value, shiftTime(time, v - Number(time.slice(3))))} format={() => time.slice(3)} width={40} />
                  </Row>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {['09:00', '12:00', '17:00', '23:59'].map((h) => (
                      <Chip key={h} label={fmtTime(h, lang)} active={time === h} onPress={() => pick(value, h)} />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
          <PillButton small label={tr('common.btn.ok')} onPress={() => setOpen(false)} style={{ marginTop: 12 }} />
        </View>
      ) : null}
    </View>
  );
}
