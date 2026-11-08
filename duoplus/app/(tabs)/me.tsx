import { router } from 'expo-router';
import React from 'react';
import { Alert, Switch, View } from 'react-native';
import { Avatar, Bar, Btn, Card, Row, Screen, SectionTitle, Txt } from '../../src/components/ui';
import { BADGES, TIER_COLOR } from '../../src/data/badges';
import { levelFromXp } from '../../src/engine/levels';
import { isDemoPartner, removeDemoPartner, seedDemoPartner } from '../../src/lib/demo';
import { syncNow, useSyncStatus } from '../../src/lib/sync';
import { isBackendConfigured } from '../../src/lib/supabase';
import { totalsFor, useStore } from '../../src/store/store';
import { useTheme } from '../../src/theme';

export default function Me() {
  const t = useTheme();
  const s = useStore();
  const me = s.me!;
  const { xp, sp } = totalsFor(s, me.id);
  const lv = levelFromXp(xp);
  const mine = Object.values(s.badges).filter((b) => b.userId === me.id);
  const have = new Set(mine.map((b) => b.badgeId));
  const sync = useSyncStatus();
  const partnerTot = s.partner ? totalsFor(s, s.partner.id) : null;
  const partnerLv = partnerTot ? levelFromXp(partnerTot.xp) : null;

  const reset = () =>
    Alert.alert('Her şey sıfırlansın mı?', 'Bu cihazdaki tüm veri silinir. (Bulutta kalan veri partnerinde durur.)', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sıfırla', style: 'destructive', onPress: () => s.resetAll() },
    ]);

  return (
    <Screen>
      <Card>
        <Row>
          <Avatar emoji={me.emoji} color={me.color} size={64} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Txt size={22} weight="800">{me.name}</Txt>
            <Txt dim>Seviye {lv.level} · {lv.title}</Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt size={22} weight="800" color={me.color}>{sp}</Txt>
            <Txt size={11} dim>toplam SP</Txt>
          </View>
        </Row>
        <View style={{ marginTop: 12 }}>
          <Bar value={lv.progress} color={me.color} height={10} />
          <Txt size={12} dim style={{ marginTop: 6 }}>{lv.xp} / {lv.nextLevelXp} XP → Seviye {lv.level + 1}</Txt>
        </View>
        {s.partner && partnerLv ? (
          <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
            <Row>
              <Avatar emoji={s.partner.emoji} color={s.partner.color} size={30} />
              <Txt style={{ marginLeft: 8 }}>{s.partner.name} · Seviye {partnerLv.level}</Txt>
            </Row>
            <Txt weight="700" color={s.partner.color}>{partnerTot!.sp} SP</Txt>
          </Row>
        ) : null}
      </Card>

      <SectionTitle>Araçlar</SectionTitle>
      <Row style={{ gap: 8, flexWrap: 'wrap' }}>
        <Btn style={{ flexGrow: 1, minWidth: '45%' }} kind="soft" label="🍅 Odak" onPress={() => router.push('/focus')} />
        <Btn style={{ flexGrow: 1, minWidth: '45%' }} kind="soft" label="🌬️ Nefes" onPress={() => router.push('/breathe')} />
        <Btn style={{ flexGrow: 1, minWidth: '45%' }} kind="soft" label="😊 Ruh hali" onPress={() => router.push('/mood')} />
        <Btn style={{ flexGrow: 1, minWidth: '45%' }} kind="soft" label="📚 Kütüphane" onPress={() => router.push('/library')} />
      </Row>

      <SectionTitle>Rozetler ({have.size}/{BADGES.length})</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {BADGES.map((b) => {
          const on = have.has(b.id);
          const hidden = b.hidden && !on;
          return (
            <Card
              key={b.id}
              onPress={() => Alert.alert(hidden ? '???' : b.name, hidden ? 'Gizli rozet. Keşfetmen gerek.' : b.desc)}
              style={{ width: '31.5%', margin: '0.9%', alignItems: 'center', padding: 8, opacity: on ? 1 : 0.4, borderColor: on ? TIER_COLOR[b.tier] : t.border, borderWidth: on ? 2 : 1 }}
            >
              <Txt size={26}>{hidden ? '❔' : b.emoji}</Txt>
              <Txt size={11} weight="700" center numberOfLines={2} style={{ marginTop: 2 }}>{hidden ? 'Gizli' : b.name}</Txt>
            </Card>
          );
        })}
      </View>

      <SectionTitle>Eşleşme ve senkron</SectionTitle>
      <Card>
        <Txt weight="700">{s.partner ? `💞 ${s.partner.name} ile eşleşmiş` : s.pairId ? '⏳ Partner bekleniyor' : 'Eşleşme yok'}</Txt>
        {s.pairCode ? <Txt size={13} dim style={{ marginTop: 4 }}>Kod: {s.pairCode}</Txt> : null}
        <Txt size={12} dim style={{ marginTop: 4 }}>
          Bulut: {isBackendConfigured ? 'bağlı' : 'kurulu değil (yerel mod)'}
          {s.pairId ? ` · ${sync.status === 'ok' ? 'güncel ✅' : sync.status === 'syncing' ? 'eşitleniyor…' : sync.status === 'error' ? `hata: ${sync.error}` : 'beklemede'}` : ''}
        </Txt>
        <Row style={{ gap: 8, marginTop: 10 }}>
          {!s.pairId && isBackendConfigured ? <Btn style={{ flex: 1 }} small label="Eşleş" onPress={() => router.push('/pairing')} /> : null}
          {s.pairId ? <Btn style={{ flex: 1 }} small kind="soft" label="Şimdi eşitle" onPress={() => void syncNow()} /> : null}
          {s.pairId ? <Btn style={{ flex: 1 }} small kind="ghost" label="Detay" onPress={() => router.push('/pairing')} /> : null}
        </Row>
        {!isBackendConfigured && !s.pairId ? (
          isDemoPartner() ? (
            <Btn small kind="ghost" label="Demo partneri kaldır" style={{ marginTop: 10 }} onPress={removeDemoPartner} />
          ) : (
            <Btn small kind="soft" label="🤖 Demo partner ekle (dene)" style={{ marginTop: 10 }} onPress={seedDemoPartner} />
          )
        ) : null}
      </Card>

      <SectionTitle>Ayarlar</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt weight="600">⏰ Hatırlatıcılar</Txt>
            <Txt size={12} dim>Görevlerde belirlediğin saatte bildirim</Txt>
          </View>
          <Switch value={s.settings.notifications} onValueChange={(v) => s.setSettings({ notifications: v })} />
        </Row>
      </Card>
      <Txt size={12} dim style={{ marginTop: 10 }}>
        Gün sınırı 03:00 · Hafta Pazartesi başlar · Puanlar kurallara göre cihazda hesaplanır, çift sayım engellenir.
      </Txt>
      <Btn kind="danger" label="Verileri sıfırla" style={{ marginTop: 16 }} onPress={reset} />
    </Screen>
  );
}
