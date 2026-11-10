import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Chip, EmptyState, Field, Header, Row, Screen, Txt } from '../../src/components/ui';
import { searchTemplates } from '../../src/features/inspire/search';
import { TemplateGrid } from '../../src/features/inspire/TemplateGrid';
import { useT } from '../../src/i18n';
import { useFavorites } from '../../src/store/slices/favorites';

export default function InspireSearch() {
  const t = useT();
  const { q: qp } = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(typeof qp === 'string' ? qp : '');
  const recent = useFavorites((s) => s.recent);
  const addRecent = useFavorites((s) => s.addRecent);
  const clearRecent = useFavorites((s) => s.clearRecent);
  const results = useMemo(() => searchTemplates(q), [q]);
  const sugg = ['s1', 's2', 's3', 's4', 's5', 's6'].map((k) => t(`inspire.search.${k}`));
  const has = q.trim().length > 0;

  return (
    <Screen header={<Header title={t('inspire.searchLabel')} />}>
      <Field
        value={q}
        onChangeText={setQ}
        placeholder={t('inspire.search.placeholder')}
        returnKeyType="search"
        autoCorrect={false}
        onSubmitEditing={() => addRecent(q)}
        containerStyle={{ marginBottom: 12 }}
      />
      {has ? (
        results.length ? (
          <View onTouchEnd={() => addRecent(q)}>
            <Txt dim style={{ marginBottom: 12 }}>
              {t('inspire.templatesCount', { n: results.length })}
            </Txt>
            <TemplateGrid items={results} />
          </View>
        ) : (
          <EmptyState emoji="🔎" title={t('inspire.search.noResults')} body={t('inspire.search.noResultsBody')} />
        )
      ) : (
        <View>
          {recent.length ? (
            <View style={{ marginBottom: 20 }}>
              <Row between style={{ marginBottom: 10 }}>
                <Txt variant="h3">{t('inspire.search.recent')}</Txt>
                <Pressable onPress={clearRecent} hitSlop={8}>
                  <Txt variant="bodyBold" dim>
                    {t('inspire.search.clear')}
                  </Txt>
                </Pressable>
              </Row>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {recent.map((r) => (
                  <Chip key={r} label={r} emoji="🕘" onPress={() => setQ(r)} />
                ))}
              </View>
            </View>
          ) : null}
          <Txt variant="h3" style={{ marginBottom: 10 }}>
            {t('inspire.search.suggestions')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sugg.map((s) => (
              <Chip key={s} label={s} onPress={() => setQ(s)} />
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}
