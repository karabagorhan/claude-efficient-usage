/** Geliştirme yardımcıları (yalnız placeholder/önizleme). Üretim akışı onboarding ekranıdır. */
import { translate } from '../i18n';
import { useCore } from '../store/core';
import { useSettings } from '../store/settings';
import { uuid } from './id';

/** Profil yoksa yerel bir profil oluşturur ve onboarded=true yapar. */
export function devSkipOnboarding() {
  const core = useCore.getState();
  if (!core.me) core.setMe({ id: uuid(), name: translate('points.me'), emoji: '🌟', color: '#7C5CFC' });
  useSettings.getState().setOnboarded(true);
}
