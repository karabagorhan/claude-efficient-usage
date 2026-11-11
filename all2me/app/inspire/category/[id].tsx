import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { EmptyState, Header, Screen } from '../../../src/components/ui';
import { getCategory, getSection, templatesInCategory, templatesInSection, type CategoryId, type SectionId } from '../../../src/data/inspire';
import { TemplateGrid } from '../../../src/features/inspire/TemplateGrid';
import { L, useLang, useT } from '../../../src/i18n';

export default function InspireCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const lang = useLang();
  const cat = getCategory(id);
  const sec = cat ? undefined : getSection(id);
  const name = cat?.name ?? sec?.name;
  const list = cat ? templatesInCategory(cat.id as CategoryId) : sec ? templatesInSection(sec.id as SectionId) : [];
  return (
    <Screen header={<Header title={name ? L(name, lang) : t('inspire.title')} subtitle={name ? t('inspire.templatesCount', { n: list.length }) : undefined} />}>
      {name ? <TemplateGrid items={list} /> : <EmptyState emoji="🔎" title={t('inspire.notFound')} body={t('inspire.notFoundBody')} />}
    </Screen>
  );
}
