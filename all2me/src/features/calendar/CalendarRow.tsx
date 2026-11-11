/**
 * "Takvime ekle" anahtarı. Web'de de görünür ama devre dışıdır ve nedenini yazar (çökmez).
 * Metinler çağıran ekranın ad alanından gelir.
 */
import React from 'react';
import { Switch, View } from 'react-native';
import { Card, Row, Txt } from '../../components/ui';
import { calendarSupported } from '../../lib/calendar';
import { useTheme } from '../../theme';

export function CalendarRow({
  label,
  hint,
  unsupported,
  needs,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  unsupported: string;
  /** doluysa anahtar kapalı ve bu açıklama gösterilir (ör. önce tarih seç) */
  needs?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  const supported = calendarSupported();
  const blocked = !supported || !!needs;
  return (
    <Card style={{ marginTop: 16 }}>
      <Row between gap={12}>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyBold">📅 {label}</Txt>
          <Txt variant="small" dim style={{ marginTop: 2 }}>
            {!supported ? unsupported : needs ? needs : hint}
          </Txt>
        </View>
        <Switch
          value={blocked ? false : value}
          disabled={blocked}
          onValueChange={onChange}
          trackColor={{ true: t.success, false: t.borderInput }}
          accessibilityLabel={label}
        />
      </Row>
    </Card>
  );
}
