import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { Row, Txt, tap } from '../../components/ui';
import { fmtTime, useLang } from '../../i18n';
import { alpha, radius, useTheme, type PastelKey } from '../../theme';
import { clampHHMM, hhmmToMin } from './hooks';

/** Alttan açılan sayfa (Modal). */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel={title} onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: t.overlay }} />
        <View style={{ backgroundColor: t.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%', paddingTop: 16 }}>
          <Row between style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <Txt variant="h2" numberOfLines={1} style={{ flex: 1 }}>
              {title}
            </Txt>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={20} color={t.text} />
            </Pressable>
          </Row>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: 4 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const RoundBtn = ({ icon, onPress, disabled, label }: { icon: 'add' | 'remove'; onPress: () => void; disabled?: boolean; label: string }) => {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.cardAlt, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}
    >
      <Ionicons name={icon} size={22} color={t.text} />
    </Pressable>
  );
};

/** Etiket + sayı artır/azalt. */
export function Stepper({
  label,
  hint,
  value,
  min = 0,
  max = 999,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <Row between style={{ paddingVertical: 8 }}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Txt variant="bodyBold">{label}</Txt>
        {hint ? (
          <Txt variant="small" dim>
            {hint}
          </Txt>
        ) : null}
      </View>
      <Row gap={10}>
        <RoundBtn icon="remove" label={`${label} -`} disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} />
        <View style={{ minWidth: 40, alignItems: 'center' }}>
          <Txt variant="h3">{format ? format(value) : String(value)}</Txt>
        </View>
        <RoundBtn icon="add" label={`${label} +`} disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} />
      </Row>
    </Row>
  );
}

/** Aç/kapa satırı. */
export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Row between style={{ paddingVertical: 8 }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Txt variant="bodyBold">{label}</Txt>
        {hint ? (
          <Txt variant="small" dim>
            {hint}
          </Txt>
        ) : null}
      </View>
      <Switch value={value} onValueChange={(v) => onChange(v)} trackColor={{ true: t.success, false: t.border }} accessibilityLabel={label} />
    </Row>
  );
}

/** HH:MM saat seçici: 30 dk adımlı −/+ */
export function TimeStepper({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const lang = useLang();
  return (
    <Row between style={{ paddingVertical: 6, opacity: disabled ? 0.4 : 1 }}>
      <Txt variant="body" dim style={{ flex: 1 }}>
        {label}
      </Txt>
      <Row gap={10}>
        <RoundBtn icon="remove" label={`${label} -`} disabled={disabled} onPress={() => onChange(clampHHMM(hhmmToMin(value) - 30))} />
        <View style={{ minWidth: 76, alignItems: 'center' }}>
          <Txt variant="h3">{fmtTime(value, lang)}</Txt>
        </View>
        <RoundBtn icon="add" label={`${label} +`} disabled={disabled} onPress={() => onChange(clampHHMM(hhmmToMin(value) + 30))} />
      </Row>
    </Row>
  );
}

/** Küçük istatistik karosu. */
export function Stat({ emoji, value, label, pastel }: { emoji: string; value: string; label: string; pastel: PastelKey }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 140, backgroundColor: t.pastel[pastel], borderRadius: radius.lg, padding: 14 }}>
      <Txt size={22}>{emoji}</Txt>
      <Txt variant="h2" color={t.onPastel} numberOfLines={1} style={{ marginTop: 4 }}>
        {value}
      </Txt>
      <Txt variant="small" color={alpha(t.onPastel, 0.7)}>
        {label}
      </Txt>
    </View>
  );
}

/** Günün teşvik mesajı kartı. */
export function MessageCard({ text, pastel = 'mint', emoji = '💬' }: { text: string; pastel?: PastelKey; emoji?: string }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.pastel[pastel], borderRadius: radius.lg, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <Txt size={26}>{emoji}</Txt>
      <Txt variant="bodyBold" color={t.onPastel} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}

/** Basit yatay çubuk satırı (emoji + etiket + sayı). */
export function HBar({ emoji, label, value, max, color }: { emoji?: string; label: string; value: number; max: number; color: string }) {
  const t = useTheme();
  const pct = max > 0 ? Math.max(0.04, value / max) : 0;
  return (
    <Row gap={10} style={{ marginVertical: 5 }}>
      <View style={{ width: 128, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {emoji ? <Txt size={16}>{emoji}</Txt> : null}
        <Txt variant="small" numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </Txt>
      </View>
      <View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: t.cardAlt, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 7 }} />
      </View>
      <Txt variant="bodyBold" style={{ width: 28, textAlign: 'right' }}>
        {value}
      </Txt>
    </Row>
  );
}
