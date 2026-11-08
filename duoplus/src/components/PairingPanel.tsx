import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';
import { createPairRaw, isBackendConfigured, joinPairRaw } from '../lib/sync';
import { useTheme } from '../theme';
import { Btn, Card, Field, Txt } from './ui';

export interface PairResult {
  uid: string;
  pairId: string;
  code: string | null;
}

export function PairingPanel({
  onDone,
  onSkip,
  skipLabel,
}: {
  onDone: (r: PairResult) => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const t = useTheme();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [created, setCreated] = useState<PairResult | null>(null);

  if (!isBackendConfigured) {
    return (
      <Card>
        <Txt weight="700">Bulut kurulu değil</Txt>
        <Txt dim size={13} style={{ marginTop: 6 }}>
          İki kişinin birbirinin puanını görmesi için Supabase bağlantısı gerekir. README'deki 4 adımı tamamlayıp
          .env dosyasına URL ve anahtarı ekleyin. O zamana kadar uygulama yerel modda çalışır (Profil → Demo partner ile
          yarış ekranını deneyebilirsiniz).
        </Txt>
        {onSkip ? <Btn label={skipLabel ?? 'Yerel modda devam et'} onPress={onSkip} style={{ marginTop: 12 }} /> : null}
      </Card>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: any) {
      setErr(e?.message ?? 'Bir hata oluştu');
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'create' && created) {
    return (
      <Card>
        <Txt weight="700" size={16}>Eşleşme kodun</Txt>
        <Txt size={40} weight="800" center style={{ letterSpacing: 8, marginVertical: 14, color: t.primary }}>
          {created.code}
        </Txt>
        <Txt dim size={13} center>
          Bu kodu partnerine gönder. O da uygulamayı açıp "Kod ile katıl" diyecek.
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Btn style={{ flex: 1 }} kind="soft" label="Kopyala" onPress={() => Clipboard.setStringAsync(created.code ?? '')} />
          <Btn
            style={{ flex: 1 }}
            kind="soft"
            label="Paylaş"
            onPress={() => Share.share({ message: `DuoPlus eşleşme kodum: ${created.code}` })}
          />
        </View>
        <Btn label="Devam et" onPress={() => onDone(created)} style={{ marginTop: 10 }} />
      </Card>
    );
  }

  if (mode === 'join') {
    return (
      <Card>
        <Field
          label="Partnerinin gönderdiği 6 haneli kod"
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          placeholder="ABC234"
          style={{ letterSpacing: 6, fontSize: 24, textAlign: 'center' }}
        />
        {err ? <Txt color={t.danger} size={13} style={{ marginBottom: 8 }}>{err}</Txt> : null}
        <Btn
          label={busy ? 'Katılınıyor…' : 'Katıl'}
          disabled={busy || code.length !== 6}
          onPress={() =>
            run(async () => {
              const r = await joinPairRaw(code);
              onDone({ ...r, code });
            })
          }
        />
        <Btn kind="ghost" label="Geri" onPress={() => setMode('choose')} style={{ marginTop: 8 }} />
      </Card>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {err ? <Txt color={t.danger} size={13}>{err}</Txt> : null}
      <Btn
        label="Yeni eşleşme oluştur (kod ver)"
        disabled={busy}
        onPress={() =>
          run(async () => {
            const r = await createPairRaw();
            setCreated({ uid: r.uid, pairId: r.pairId, code: r.code });
            setMode('create');
          })
        }
      />
      <Btn kind="soft" label="Kod ile katıl" disabled={busy} onPress={() => setMode('join')} />
      {busy ? <ActivityIndicator color={t.primary} /> : null}
      {onSkip ? <Btn kind="ghost" label={skipLabel ?? 'Şimdilik tek başıma'} onPress={onSkip} /> : null}
    </View>
  );
}
