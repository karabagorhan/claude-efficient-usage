/** Çark sekmesi (SPEC §3.6): SVG çark, sınırsız çevirme, sonuç şeridi, Harekete Geç'e bağlanır. */
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, useWindowDimensions, View } from 'react-native';
import { Chip, Header, IconButton, PillButton, press, Row, success, Txt } from '../../src/components/ui';
import { GradientScreen } from '../../src/components/GradientScreen';
import { WHEEL_IDS } from '../../src/data/wheels';
import { CONFIG } from '../../src/engine/config';
import { WheelView, slicePastel, sliceName } from '../../src/features/wheel/WheelView';
import { norm, sliceAtRotation, targetRotation } from '../../src/features/wheel/math';
import { useLang, useT } from '../../src/i18n';
import { uuid } from '../../src/lib/id';
import { routes } from '../../src/lib/routes';
import { today, useCore } from '../../src/store/core';
import { slicesOf, useWheel } from '../../src/store/slices/wheel';
import { alpha, GUTTER, useTheme } from '../../src/theme';

const INK = '#14171A';
const SOFT = '#5A4A78';

export default function ScreenWheel() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 12, 400);

  const selected = useWheel((s) => s.selected);
  const custom = useWheel((s) => s.custom);
  const last = useWheel((s) => s.last);
  const select = useWheel((s) => s.select);
  const setLast = useWheel((s) => s.setLast);
  const resetWheel = useWheel((s) => s.resetWheel);
  const slices = slicesOf(custom, selected);

  const doneToday = useCore((s) => {
    const id = s.me?.id;
    if (!id) return 0;
    const d = today();
    let n = 0;
    for (const e of Object.values(s.events)) if (e.userId === id && e.type === 'bonus' && e.group === 'wheel' && e.dayKey === d) n++;
    return n;
  });

  const rotation = useRef(new Animated.Value(0)).current;
  const rotNow = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    rotation.stopAnimation();
  }, [rotation]);

  const shown = last && last.wheelId === selected ? slices.find((s) => s.id === last.sliceId) ?? null : null;

  const spin = useCallback(() => {
    if (spinning) return;
    const n = slices.length;
    // önce normalle: değer sınırsız büyümesin
    rotNow.current = norm(rotNow.current);
    rotation.setValue(rotNow.current);
    const k = Math.floor(Math.random() * n);
    const target = targetRotation(rotNow.current, k, n, 5 + Math.floor(Math.random() * 3), (Math.random() - 0.5) * 0.7);
    setSpinning(true);
    setConfirm(false);
    press();
    Animated.timing(rotation, { toValue: target, duration: 4600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      rotNow.current = target;
      if (!finished) {
        setSpinning(false);
        return;
      }
      // sonuç, durduğu açıdan okunur (işaretçinin altındaki dilim = gösterilen sonuç)
      const idx = sliceAtRotation(target, n);
      const hit = slices[idx];
      setLast({ wheelId: selected, sliceId: hit.id });
      setSpinning(false);
      success();
      timer.current = setTimeout(() => {
        router.push(
          routes.actionBonus({
            bonusId: `wheel:${uuid()}`,
            title: sliceName(hit, lang),
            emoji: hit.emoji,
            points: CONFIG.bonus.wheel.points,
            group: 'wheel',
            pastel: slicePastel(idx, n),
            source: 'wheel',
          }),
        );
      }, 700);
    });
  }, [spinning, slices, rotation, selected, lang, setLast]);

  const doReset = () => {
    resetWheel(selected);
    setConfirm(false);
  };

  return (
    <GradientScreen
      colors="wheel"
      scroll
      padBottom={24}
      header={
        <Header
          left="none"
          color="#FFFFFF"
          right={
            <Row gap={0}>
              <IconButton icon="refresh" color="#FFFFFF" label={t('wheel.reset')} onPress={() => !spinning && setConfirm((v) => !v)} />
              <IconButton icon="create-outline" color="#FFFFFF" label={t('wheel.edit')} onPress={() => !spinning && router.push(routes.wheelEdit(selected))} />
            </Row>
          }
        />
      }
    >
      <View style={{ alignItems: 'center', marginTop: 2 }}>
        <Txt variant="display" size={34} weight="800" color="#FFFFFF" center>
          {t(`wheel.title.${selected}`)}
        </Txt>
      </View>

      <Row gap={8} style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
        {WHEEL_IDS.map((id) => (
          <Chip key={id} label={t(`wheel.name.${id}`)} active={id === selected} onPress={() => !spinning && select(id)} />
        ))}
      </Row>

      <View style={{ alignItems: 'center', marginTop: 12, marginHorizontal: -GUTTER }}>
        <WheelView slices={slices} size={size} rotation={rotation} lang={lang} t={th} />
      </View>

      {confirm ? (
        <View style={{ marginHorizontal: -GUTTER, paddingVertical: 14, paddingHorizontal: GUTTER, backgroundColor: alpha('#FFFFFF', 0.7) }}>
          <Txt variant="bodyBold" color={INK} center>
            {t('wheel.resetTitle')}
          </Txt>
          <Txt variant="small" color={SOFT} center>
            {t('wheel.resetBody')}
          </Txt>
          <Row gap={10} style={{ marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <PillButton label={t('common.btn.cancel')} kind="outline" small onPress={() => setConfirm(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <PillButton label={t('common.btn.reset')} small onPress={doReset} />
            </View>
          </Row>
        </View>
      ) : (
        <View
          style={{
            marginHorizontal: -GUTTER,
            minHeight: 60,
            paddingHorizontal: GUTTER,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha('#FFFFFF', 0.55),
          }}
          accessibilityLiveRegion="polite"
        >
          {shown ? (
            <Row gap={10} style={{ justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>{shown.emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: INK, flexShrink: 1 }} numberOfLines={1}>
                {sliceName(shown, lang)}
              </Text>
            </Row>
          ) : (
            <Txt color={SOFT} center>
              {t('wheel.hint')}
            </Txt>
          )}
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <PillButton label={spinning ? t('wheel.spinning') : t('wheel.spin')} disabled={spinning} onPress={spin} />
      </View>
      <View style={{ marginTop: 12, alignItems: 'center', gap: 2 }}>
        <Txt variant="small" color={SOFT} center>
          {t('wheel.today', { n: Math.min(doneToday, CONFIG.bonus.wheel.perDay), max: CONFIG.bonus.wheel.perDay })}
        </Txt>
        <Txt variant="small" color={SOFT} center>
          {t('wheel.unlimited')}
        </Txt>
      </View>
    </GradientScreen>
  );
}

