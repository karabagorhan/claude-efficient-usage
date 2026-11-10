/** Çark dilimi düzenleyici: yeniden adlandır, emoji değiştir, sil, ekle, varsayılana dön. */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Field, Header, IconButton, PillButton, Row, Screen, Spacer, Txt } from '../src/components/ui';
import { DEFAULT_WHEELS, MAX_SLICES, MIN_SLICES, type WheelId, type WheelSlice } from '../src/data/wheels';
import { sliceName } from '../src/features/wheel/WheelView';
import { useLang, useT } from '../src/i18n';
import { isWheelId, slicesOf, useWheel } from '../src/store/slices/wheel';
import { radius, useTheme } from '../src/theme';

const EMOJIS = [
  '🧽', '🧹', '🗑️', '🧺', '👕', '🧦', '🍽️', '🛏️', '🪟', '🌿', '💡', '🚰',
  '💧', '🧴', '🛁', '🧘', '📖', '📝', '🎵', '🫖', '💆', '😴', '🍎', '🥗',
  '🚶', '🤸', '💪', '🏃', '💃', '🪢', '🦵', '🧍', '☀️', '📞', '💌', '🎨',
];

export default function ScreenWheelEdit() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const params = useLocalSearchParams<{ wheelId?: string }>();
  const selected = useWheel((s) => s.selected);
  const custom = useWheel((s) => s.custom);
  const setSlices = useWheel((s) => s.setSlices);
  const resetWheel = useWheel((s) => s.resetWheel);
  const wheelId: WheelId = isWheelId(params.wheelId) ? params.wheelId : selected;
  const slices = slicesOf(custom, wheelId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const n = slices.length;

  const patch = (id: string, p: Partial<WheelSlice>) => setSlices(wheelId, slices.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const fallbackName = (s: WheelSlice) => DEFAULT_WHEELS[wheelId].find((d) => d.id === s.id)?.name;
  const remove = (id: string) => {
    if (n <= MIN_SLICES) return;
    setSlices(wheelId, slices.filter((s) => s.id !== id));
    setOpenId(null);
  };
  const add = () => {
    if (n >= MAX_SLICES) return;
    const id = `u${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    setSlices(wheelId, [...slices, { id, emoji: '✨', label: t('wheel.editor.newName') }]);
    setOpenId(id);
  };

  return (
    <Screen header={<Header left="close" title={t('wheel.editor.title')} subtitle={t(`wheel.name.${wheelId}`)} />}>
      <Txt dim variant="small" center>
        {t('wheel.editor.count', { n, min: MIN_SLICES, max: MAX_SLICES })}
      </Txt>
      <Spacer h={12} />
      {slices.map((s, i) => {
        const open = openId === s.id;
        return (
          <Card key={s.id} padding={12} bg={open ? th.cardAlt : undefined}>
            <Row gap={10}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('wheel.editor.emoji')}
                onPress={() => setOpenId(open ? null : s.id)}
                style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: th.pastel[(['blue', 'green', 'purple', 'mint', 'peach', 'pink', 'yellow'] as const)[i % 7]], alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 28 }}>{s.emoji}</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Field
                  value={s.label !== undefined ? s.label : sliceName(s, lang)}
                  placeholder={t('wheel.editor.namePlaceholder')}
                  maxLength={24}
                  onFocus={() => setOpenId(s.id)}
                  onChangeText={(v) => patch(s.id, { label: v })}
                  onBlur={() => {
                    if (!(s.label ?? '').trim()) patch(s.id, fallbackName(s) ? { label: undefined, name: fallbackName(s) } : { label: t('wheel.editor.newName') });
                  }}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <IconButton icon="trash-outline" color={n <= MIN_SLICES ? th.textFaint : th.danger} label={t('wheel.editor.remove')} onPress={() => remove(s.id)} />
            </Row>
            {open ? (
              <View style={{ marginTop: 12 }}>
                <Txt variant="caption" dim>
                  {t('wheel.editor.emoji')}
                </Txt>
                <Row gap={6} style={{ flexWrap: 'wrap', marginTop: 6 }}>
                  {EMOJIS.map((e) => (
                    <Pressable
                      key={e}
                      accessibilityRole="button"
                      onPress={() => patch(s.id, { emoji: e })}
                      style={{ width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: e === s.emoji ? th.primary : th.card }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </Pressable>
                  ))}
                </Row>
              </View>
            ) : null}
          </Card>
        );
      })}
      <Spacer h={12} />
      {n <= MIN_SLICES ? (
        <Txt variant="caption" dim center>
          {t('wheel.editor.minReached', { min: MIN_SLICES })}
        </Txt>
      ) : null}
      {n >= MAX_SLICES ? (
        <Txt variant="caption" dim center>
          {t('wheel.editor.maxReached', { max: MAX_SLICES })}
        </Txt>
      ) : null}
      <Spacer h={8} />
      <PillButton label={t('wheel.editor.add')} icon="add" disabled={n >= MAX_SLICES} onPress={add} />
      <Spacer h={10} />
      {confirm ? (
        <Card>
          <Txt variant="bodyBold" center>
            {t('wheel.resetTitle')}
          </Txt>
          <Txt dim variant="small" center>
            {t('wheel.editor.restoreBody')}
          </Txt>
          <Spacer h={10} />
          <Row gap={10}>
            <View style={{ flex: 1 }}>
              <PillButton label={t('common.btn.cancel')} kind="outline" small onPress={() => setConfirm(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <PillButton
                label={t('common.btn.reset')}
                small
                onPress={() => {
                  resetWheel(wheelId);
                  setConfirm(false);
                  setOpenId(null);
                }}
              />
            </View>
          </Row>
        </Card>
      ) : (
        <PillButton label={t('wheel.editor.restore')} kind="outline" onPress={() => setConfirm(true)} />
      )}
      <Spacer h={12} />
      <Txt variant="caption" faint center>
        {t('wheel.editor.userNote')}
      </Txt>
    </Screen>
  );
}
