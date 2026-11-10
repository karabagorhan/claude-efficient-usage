/**
 * Derlenen geçici ekran. Ekran ajanı kendi rota dosyasını tamamen yeniden yazar.
 * <Placeholder name="tools/drink" />
 */
import { router, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useT } from '../i18n';
import { devSkipOnboarding } from '../lib/dev';
import { Mascot } from './Mascot';
import { Header, PillButton, Screen, Txt } from './ui';

export function Placeholder({
  name,
  title,
  devSkip,
  tab,
}: {
  /** Rota/dosya adı (geliştirici bilgisi) */
  name: string;
  /** Başlık (çevrilmiş) */
  title?: string;
  /** Onboarding için: "atla" butonu */
  devSkip?: boolean;
  /** Sekme ekranı: geri butonu yok */
  tab?: boolean;
}) {
  const t = useT();
  const path = usePathname();
  return (
    <Screen header={<Header title={title ?? name} left={tab || devSkip ? 'none' : 'back'} />}>
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Mascot mood="sleepy" size={140} />
        <Txt variant="h2" center style={{ marginTop: 16 }}>
          {title ?? name}
        </Txt>
        <Txt dim center style={{ marginTop: 6 }}>
          {t('common.state.comingSoon')}
        </Txt>
        <Txt faint variant="caption" center style={{ marginTop: 4 }}>
          {t('common.placeholder.route', { route: path || name })}
        </Txt>
        {devSkip ? (
          <PillButton
            label={t('common.placeholder.devSkip')}
            arrow
            style={{ marginTop: 28, alignSelf: 'stretch' }}
            onPress={() => {
              devSkipOnboarding();
              router.replace('/');
            }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

export default Placeholder;
