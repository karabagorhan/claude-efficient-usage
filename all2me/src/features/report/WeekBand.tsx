/**
 * Rutin panosunda yalnız Pazartesi / Pazar günleri görünen, kapatılabilir "Haftanı gör" bandı.
 * Pazartesi geçen haftanın, Pazar bu haftanın raporunu açar. Kapatma durumu: slices/report.ts.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Txt, tap } from '../../components/ui';
import { weekdayOf } from '../../engine/dates';
import { useT } from '../../i18n';
import { routes } from '../../lib/routes';
import { today, useCore } from '../../store/core';
import { useReportPrefs } from '../../store/slices/report';
import { radius, useTheme } from '../../theme';
import { shiftWeek, weekStartOf } from './calc';

export function WeekBand() {
  const th = useTheme();
  const t = useT();
  const day = today();
  const dismissed = useReportPrefs((s) => s.bannerDismissedDay);
  const hydrated = useReportPrefs((s) => s.hydrated);
  const hasAny = useCore((s) => Object.keys(s.completions).length > 0);
  const wd = weekdayOf(day);
  if (!hydrated || !hasAny || dismissed === day || (wd !== 0 && wd !== 6)) return null;
  const monday = wd === 0;
  const week = monday ? shiftWeek(weekStartOf(day), -1) : weekStartOf(day);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: th.pastel.blue, borderRadius: radius.lg, marginTop: 12, paddingLeft: 14, paddingRight: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('report.band.title')}
        onPress={() => {
          tap();
          router.push(routes.report(week));
        }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}
      >
        <Txt size={24}>📊</Txt>
        <View style={{ flex: 1 }}>
          <Txt weight="800" color={th.onPastel}>{t('report.band.title')}</Txt>
          <Txt size={12} color={th.onPastel}>{t(monday ? 'report.band.bodyMon' : 'report.band.bodySun')}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={18} color={th.onPastel} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('report.band.close')}
        onPress={() => {
          tap();
          useReportPrefs.getState().dismissBanner(day);
        }}
        hitSlop={8}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="close" size={20} color={th.onPastel} />
      </Pressable>
    </View>
  );
}
