import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Bar, Header, PillButton, Row, Screen, Txt, tap } from '../src/components/ui';
import { BADGES, TIER_COLOR, type BadgeDef, type Tier } from '../src/data/badges';
import { fmtDay, L, useLang, useT } from '../src/i18n';
import { dayKeyOf } from '../src/engine/dates';
import { useCore } from '../src/store/core';
import { alpha, radius, useTheme } from '../src/theme';

const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'legendary'];

export default function BadgesScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const meId = useCore((s) => s.me?.id);
  const badgeRecs = useCore((s) => s.badges);
  const [sel, setSel] = useState<BadgeDef | null>(null);

  const earned = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of Object.values(badgeRecs)) if (r.userId === meId) m[r.badgeId] = r.at;
    return m;
  }, [badgeRecs, meId]);

  const count = BADGES.filter((b) => earned[b.id]).length;
  const tierStat = (tier: Tier) => ({
    got: BADGES.filter((b) => b.tier === tier && earned[b.id]).length,
    all: BADGES.filter((b) => b.tier === tier).length,
  });

  return (
    <Screen header={<Header title={t('profile.badges.title')} />}>
      <View style={{ backgroundColor: th.card, borderRadius: radius.lg, padding: 16, marginTop: 8 }}>
        <Row between>
          <Txt variant="h2">{t('profile.badges.progress', { n: count, total: BADGES.length })}</Txt>
          <Txt size={28}>🎖️</Txt>
        </Row>
        <View style={{ marginTop: 10 }}>
          <Bar value={count / BADGES.length} color={th.primary} height={10} />
        </View>
        <Row style={{ marginTop: 14, justifyContent: 'space-between' }}>
          {TIERS.map((tier) => {
            const s = tierStat(tier);
            return (
              <View key={tier} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: TIER_COLOR[tier] }} />
                <Txt size={12} dim style={{ marginTop: 4 }}>{t(`points.tier.${tier}`)}</Txt>
                <Txt weight="800">{s.got}/{s.all}</Txt>
              </View>
            );
          })}
        </Row>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginHorizontal: -5 }}>
        {BADGES.map((b) => {
          const got = !!earned[b.id];
          const hiddenLocked = !!b.hidden && !got;
          const color = TIER_COLOR[b.tier];
          return (
            <Pressable
              key={b.id}
              onPress={() => {
                tap();
                setSel(b);
              }}
              style={{ width: '33.333%', padding: 5 }}
              accessibilityLabel={hiddenLocked ? t('profile.badges.hiddenName') : L(b.name, lang)}
            >
              <View style={{ alignItems: 'center', backgroundColor: th.card, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 6, opacity: got ? 1 : 0.5 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 3,
                    borderColor: color,
                    backgroundColor: alpha(color, got ? 0.16 : 0.06),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt size={30}>{hiddenLocked ? '❔' : b.emoji}</Txt>
                </View>
                <Txt size={12} weight="700" center numberOfLines={2} style={{ marginTop: 8, minHeight: 32 }}>
                  {hiddenLocked ? t('profile.badges.hiddenName') : L(b.name, lang)}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={!!sel} transparent animationType="fade" onRequestClose={() => setSel(null)}>
        <Pressable style={{ flex: 1, backgroundColor: th.overlay, justifyContent: 'flex-end' }} onPress={() => setSel(null)}>
          {sel ? (
            <Pressable
              onPress={() => {}}
              style={{ backgroundColor: th.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 24, paddingBottom: 32, alignItems: 'center' }}
            >
              {(() => {
                const got = !!earned[sel.id];
                const hid = !!sel.hidden && !got;
                const color = TIER_COLOR[sel.tier];
                return (
                  <>
                    <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: color, backgroundColor: alpha(color, 0.14), alignItems: 'center', justifyContent: 'center', opacity: got ? 1 : 0.6 }}>
                      <Txt size={46}>{hid ? '❔' : sel.emoji}</Txt>
                    </View>
                    <Txt variant="h2" center style={{ marginTop: 12 }}>{hid ? t('profile.badges.hiddenName') : L(sel.name, lang)}</Txt>
                    <View style={{ backgroundColor: alpha(color, 0.15), borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 }}>
                      <Txt size={12} weight="700" color={color}>{t(`points.tier.${sel.tier}`)}</Txt>
                    </View>
                    <Txt dim center style={{ marginTop: 10 }}>{hid ? t('profile.badges.hiddenDesc') : L(sel.desc, lang)}</Txt>
                    <Txt weight="700" center color={got ? th.successText : th.textDim} style={{ marginTop: 10 }}>
                      {got ? t('profile.badges.earnedAt', { date: fmtDay(dayKeyOf(new Date(earned[sel.id])), lang, 'short') }) : t('profile.badges.notEarned')}
                    </Txt>
                    <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
                      <PillButton label={t('common.btn.close')} onPress={() => setSel(null)} />
                    </View>
                  </>
                );
              })()}
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </Screen>
  );
}
