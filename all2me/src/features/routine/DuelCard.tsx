/** Rutin: bugünkü yarış kartı (ben vs partner) ya da "Partner ekle". */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Avatar, Card, Row, Txt } from '../../components/ui';
import { useT } from '../../i18n';
import { routes } from '../../lib/routes';
import type { Profile } from '../../store/core';
import { radius, useTheme } from '../../theme';

export function DuelCard({ me, partner, myPts, partnerPts }: { me: Profile; partner: Profile | null; myPts: number; partnerPts: number }) {
  const t = useTheme();
  const tr = useT();
  if (!partner) {
    return (
      <Card onPress={() => router.push(routes.pairing())} style={{ marginBottom: 16 }}>
        <Row gap={12}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person-add-outline" size={22} color={t.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyBold">{tr('routine.duel.addPartner')}</Txt>
            <Txt variant="small" dim>
              {tr('routine.duel.addPartnerBody')}
            </Txt>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.textDim} />
        </Row>
      </Card>
    );
  }
  const total = myPts + partnerPts;
  const share = total > 0 ? myPts / total : 0.5;
  const status = myPts === partnerPts ? tr('routine.duel.tie') : myPts > partnerPts ? tr('routine.duel.leadYou') : tr('routine.duel.leadPartner', { name: partner.name });
  return (
    <Card onPress={() => router.push(routes.duel())} style={{ marginBottom: 16 }}>
      <Row between style={{ marginBottom: 12 }}>
        <Txt variant="bodyBold">{tr('routine.duel.title')}</Txt>
        <Row gap={4}>
          <Txt variant="small" dim>
            {status}
          </Txt>
          <Ionicons name="chevron-forward" size={16} color={t.textDim} />
        </Row>
      </Row>
      <Row between>
        <Row gap={8} style={{ flexShrink: 1 }}>
          <Avatar emoji={me.emoji} color={me.color} size={36} />
          <View>
            <Txt variant="caption" dim numberOfLines={1}>
              {tr('routine.duel.you')}
            </Txt>
            <Txt variant="h3">{myPts}</Txt>
          </View>
        </Row>
        <Row gap={8} style={{ flexShrink: 1 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt variant="caption" dim numberOfLines={1}>
              {partner.name}
            </Txt>
            <Txt variant="h3">{partnerPts}</Txt>
          </View>
          <Avatar emoji={partner.emoji} color={partner.color} size={36} />
        </Row>
      </Row>
      <View style={{ flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', marginTop: 12, backgroundColor: t.cardAlt }}>
        <View style={{ flex: share, backgroundColor: t.me }} />
        <View style={{ width: 2, backgroundColor: t.card }} />
        <View style={{ flex: 1 - share, backgroundColor: t.partner }} />
      </View>
    </Card>
  );
}
