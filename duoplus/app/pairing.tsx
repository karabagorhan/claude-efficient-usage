import { router } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { PairingPanel } from '../src/components/PairingPanel';
import { Btn, Card, Screen, Txt } from '../src/components/ui';
import { useSyncStatus } from '../src/lib/sync';
import { useStore } from '../src/store/store';

export default function Pairing() {
  const me = useStore((s) => s.me)!;
  const pairId = useStore((s) => s.pairId);
  const code = useStore((s) => s.pairCode);
  const partner = useStore((s) => s.partner);
  const setPair = useStore((s) => s.setPair);
  const status = useSyncStatus();

  if (pairId) {
    return (
      <Screen>
        <Card>
          <Txt weight="700" size={16}>{partner ? `💞 ${partner.name} ile eşleştin` : '⏳ Partner bekleniyor'}</Txt>
          {code ? (
            <>
              <Txt dim size={13} style={{ marginTop: 8 }}>Eşleşme kodu</Txt>
              <Txt size={36} weight="800" style={{ letterSpacing: 6 }}>{code}</Txt>
            </>
          ) : null}
          <Txt size={12} dim style={{ marginTop: 8 }}>
            Senkron: {status.status === 'ok' ? 'güncel ✅' : status.status === 'syncing' ? 'eşitleniyor…' : status.status === 'error' ? `hata: ${status.error}` : 'kapalı'}
          </Txt>
        </Card>
        <Btn kind="ghost" label="Kapat" style={{ marginTop: 12 }} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt size={22} weight="800" style={{ marginBottom: 6 }}>Partnerle eşleş</Txt>
      <Txt dim style={{ marginBottom: 16 }}>Birinizin ürettiği kodu diğeri girer.</Txt>
      <PairingPanel
        onDone={(r) => {
          if (r.uid !== me.id) {
            Alert.alert('Oturum uyuşmazlığı', 'Bu cihazdaki profil başka bir oturumla oluşturulmuş. Profil → Sıfırla yapıp yeniden başlayın.');
            return;
          }
          setPair(r.pairId, r.code);
          router.back();
        }}
      />
    </Screen>
  );
}
