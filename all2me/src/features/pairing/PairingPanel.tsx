/** Eşleştirme paneli: kod üret / kodla katıl; bulut yoksa açıklama (+ yerel modda demo partner). */
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';
import { Card, Field, PillButton, Txt } from '../../components/ui';
import { tErr, useT } from '../../i18n';
import { createPairRaw, isBackendConfigured, joinPairRaw } from '../../lib/sync';
import { useCore } from '../../store/core';
import { useTheme } from '../../theme';
import { DEMO_ID, removeDemoPartner, seedDemoPartner } from './demo';

export interface PairResult {
  uid: string;
  pairId: string;
  code: string | null;
}

export function PairingPanel({
  onDone,
  onSkip,
  skipLabel,
  allowDemo,
}: {
  onDone: (r: PairResult) => void;
  onSkip?: () => void;
  skipLabel?: string;
  /** Yerel modda "Demo partner ekle" (profil gerekir; onboarding'de kapalı) */
  allowDemo?: boolean;
}) {
  const t = useTheme();
  const tr = useT();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [created, setCreated] = useState<PairResult | null>(null);
  const [copied, setCopied] = useState(false);
  const demoOn = useCore((s) => s.partner?.id === DEMO_ID);

  if (!isBackendConfigured) {
    return (
      <View style={{ gap: 12 }}>
        <Card>
          <Txt variant="h3">{tr('settings.pairing.notConfiguredTitle')}</Txt>
          <Txt dim style={{ marginTop: 6 }}>
            {tr('settings.pairing.notConfiguredBody')}
          </Txt>
        </Card>
        {allowDemo ? (
          <Card>
            <Txt variant="h3">{tr('settings.pairing.demoTitle')}</Txt>
            <Txt dim style={{ marginTop: 6, marginBottom: 12 }}>
              {tr('settings.pairing.demoBody')}
            </Txt>
            <PillButton
              kind={demoOn ? 'outline' : 'primary'}
              label={demoOn ? tr('settings.pairing.demoRemove') : tr('settings.pairing.demoAdd')}
              onPress={() => (demoOn ? removeDemoPartner() : seedDemoPartner(tr('settings.pairing.demoName')))}
            />
          </Card>
        ) : null}
        {onSkip ? <PillButton label={skipLabel ?? tr('settings.pairing.localContinue')} onPress={onSkip} /> : null}
      </View>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: any) {
      setErr(tErr(tr, e?.message ?? tr('settings.pairing.error')));
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'create' && created) {
    return (
      <Card>
        <Txt variant="h3" center>
          {tr('settings.pairing.yourCode')}
        </Txt>
        <Txt size={40} weight="800" center style={{ letterSpacing: 8, marginVertical: 14 }}>
          {created.code}
        </Txt>
        <Txt dim variant="small" center>
          {tr('settings.pairing.codeHint')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <PillButton
            style={{ flex: 1 }}
            kind="outline"
            small
            icon="copy-outline"
            label={copied ? tr('settings.pairing.copied') : tr('common.btn.copy')}
            onPress={() => {
              void Clipboard.setStringAsync(created.code ?? '');
              setCopied(true);
            }}
          />
          <PillButton
            style={{ flex: 1 }}
            kind="outline"
            small
            icon="share-outline"
            label={tr('common.btn.share')}
            onPress={() => {
              try {
                void Share.share({ message: tr('settings.pairing.shareMessage', { code: created.code ?? '' }) }).catch(() => {});
              } catch {}
            }}
          />
        </View>
        <PillButton label={tr('common.btn.next')} onPress={() => onDone(created)} style={{ marginTop: 12 }} />
      </Card>
    );
  }

  if (mode === 'join') {
    return (
      <Card>
        <Field
          label={tr('settings.pairing.joinLabel')}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          placeholder="ABC234"
          style={{ letterSpacing: 6, fontSize: 24, textAlign: 'center' }}
        />
        {err ? (
          <Txt color={t.dangerText} variant="small" style={{ marginBottom: 8 }}>
            {err}
          </Txt>
        ) : null}
        <PillButton
          label={busy ? tr('settings.pairing.joining') : tr('settings.pairing.joinBtn')}
          disabled={busy || code.length !== 6}
          onPress={() =>
            run(async () => {
              const r = await joinPairRaw(code);
              onDone({ ...r, code });
            })
          }
        />
        <PillButton kind="ghost" label={tr('settings.pairing.back')} onPress={() => setMode('choose')} style={{ marginTop: 8 }} />
      </Card>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {err ? (
        <Txt color={t.dangerText} variant="small">
          {err}
        </Txt>
      ) : null}
      <PillButton
        label={tr('settings.pairing.create')}
        disabled={busy}
        onPress={() =>
          run(async () => {
            const r = await createPairRaw();
            setCreated({ uid: r.uid, pairId: r.pairId, code: r.code });
            setMode('create');
          })
        }
      />
      <PillButton kind="outline" label={tr('settings.pairing.join')} disabled={busy} onPress={() => setMode('join')} />
      {busy ? <ActivityIndicator color={t.text} /> : null}
      {onSkip ? <PillButton kind="ghost" label={skipLabel ?? tr('settings.pairing.alone')} onPress={onSkip} /> : null}
    </View>
  );
}
