import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Header, IconButton, PillButton, Row, Screen, Txt, Card, Chip, Bar, tap } from '../../src/components/ui';
import { MAX_MIX, SOUNDS } from '../../src/data/sounds';
import { MedNote, fmtClock } from '../../src/features/toolsb';
import { applyVolume, stopAll, setSleepTimer, toggleSound, useSoundEngine } from '../../src/features/toolsb/soundEngine';
import { L, useLang, useT } from '../../src/i18n';
import { useSoundscape } from '../../src/store/slices/soundscape';
import { pastelColor, radius, useTheme } from '../../src/theme';

const SLEEP = [15, 30, 60];

export default function SoundscapeScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const volume = useSoundscape((s) => s.volume);
  const setVolume = useSoundscape((s) => s.setVolume);
  const { active, sleepMs } = useSoundEngine();
  const [trackW, setTrackW] = React.useState(0);

  const changeVol = (v: number) => {
    const nv = Math.max(0, Math.min(1, v));
    setVolume(nv);
    applyVolume(nv);
  };
  const sleepMin = sleepMs > 0 ? Math.ceil(sleepMs / 60000) : 0;

  return (
    <Screen header={<Header title={t('soundscape.title')} />}>
      <Txt dim style={{ marginBottom: 14 }}>
        {t('soundscape.intro', { n: MAX_MIX })}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {SOUNDS.map((s) => {
          const on = active.includes(s.id);
          const bg = pastelColor(s.pastel, th.isDark);
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                tap();
                toggleSound(s.id);
              }}
              style={{
                width: '47.8%',
                backgroundColor: bg,
                borderRadius: radius.lg,
                padding: 16,
                height: 124,
                justifyContent: 'space-between',
                borderWidth: 3,
                borderColor: on ? th.onPastel : 'transparent',
              }}
            >
              <Row between>
                <Txt size={38}>{s.emoji}</Txt>
                {on ? (
                  <View style={{ backgroundColor: th.onPastel, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Txt variant="caption" color={bg}>
                      ♪ {t('soundscape.playing')}
                    </Txt>
                  </View>
                ) : null}
              </Row>
              <Txt variant="h3" color={th.onPastel} numberOfLines={2}>
                {L(s.name, lang)}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ marginTop: 18 }}>
        <Row between>
          <Txt variant="bodyBold">{t('soundscape.volume')}</Txt>
          <Txt dim>{Math.round(volume * 100)}%</Txt>
        </Row>
        <Row gap={10} style={{ marginTop: 10 }}>
          <IconButton icon="volume-low" onPress={() => changeVol(volume - 0.1)} label="-" />
          <Pressable
            style={{ flex: 1, height: 36, justifyContent: 'center' }}
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
            onPress={(e) => trackW > 0 && changeVol(e.nativeEvent.locationX / trackW)}
          >
            <Bar value={volume} color={th.primary} height={10} />
          </Pressable>
          <IconButton icon="volume-high" onPress={() => changeVol(volume + 0.1)} label="+" />
        </Row>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Row between>
          <Txt variant="bodyBold">{t('soundscape.sleepTimer')}</Txt>
          <Txt dim>{sleepMs > 0 ? t('soundscape.sleepIn', { time: fmtClock(sleepMs / 1000) }) : t('soundscape.sleepOff')}</Txt>
        </Row>
        <Row gap={8} style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <Chip label={t('soundscape.sleepOff')} active={sleepMin === 0} onPress={() => setSleepTimer(0)} />
          {SLEEP.map((m) => (
            <Chip key={m} label={t('common.unit.minutes', { n: m })} onPress={() => setSleepTimer(m)} />
          ))}
        </Row>
      </Card>

      <View style={{ marginTop: 16 }}>
        <PillButton label={t('soundscape.stopAll')} kind="outline" icon="stop" onPress={stopAll} disabled={active.length === 0} />
      </View>
      <Txt variant="caption" faint center style={{ marginTop: 12 }}>
        {t('soundscape.synth')}
        {Platform.OS === 'web' ? ` ${t('soundscape.webNote')}` : ''}
      </Txt>
      <MedNote />
    </Screen>
  );
}
