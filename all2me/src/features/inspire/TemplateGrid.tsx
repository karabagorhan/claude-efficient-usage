import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Template } from '../../data/inspire';
import { GUTTER } from '../../theme';
import { TemplateCard } from './TemplateCard';

/** İki sütunlu şablon ızgarası */
export function TemplateGrid({ items }: { items: Template[] }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, 600);
  const gap = 12;
  const cw = Math.floor((W - GUTTER * 2 - gap) / 2);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {items.map((tpl) => (
        <TemplateCard key={tpl.id} tpl={tpl} width={cw} />
      ))}
    </View>
  );
}
