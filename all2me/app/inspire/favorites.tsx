import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { EmptyState, Header, Screen } from '../../src/components/ui';
import { getTemplate, type Template } from '../../src/data/inspire';
import { TemplateGrid } from '../../src/features/inspire/TemplateGrid';
import { useT } from '../../src/i18n';
import { useFavorites } from '../../src/store/slices/favorites';

export default function InspireFavorites() {
  const t = useT();
  const ids = useFavorites((s) => s.favorites);
  const items = useMemo(() => ids.map((i) => getTemplate(i)).filter((x): x is Template => !!x), [ids]);
  return (
    <Screen header={<Header title={t('inspire.favorites.title')} subtitle={items.length ? t('inspire.templatesCount', { n: items.length }) : undefined} />}>
      {items.length ? (
        <TemplateGrid items={items} />
      ) : (
        <EmptyState
          emoji="💜"
          title={t('inspire.favorites.emptyTitle')}
          body={t('inspire.favorites.emptyBody')}
          action={{ label: t('inspire.favorites.browse'), onPress: () => (router.canGoBack() ? router.back() : router.replace('/inspire')) }}
        />
      )}
    </Screen>
  );
}
