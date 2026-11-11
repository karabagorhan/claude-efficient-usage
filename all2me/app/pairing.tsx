import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Header, PillButton, Screen, Txt } from '../src/components/ui';
import { PairingPanel } from '../src/features/pairing/PairingPanel';
import { tErr, useT } from '../src/i18n';
import { syncNow, useSyncStatus } from '../src/lib/sync';
import { useCore } from '../src/store/core';
import { useTheme } from '../src/theme';

export default function PairingScreen() {
  const t = useTheme();
  const tr = useT();
  const meId = useCore((s) => s.me?.id);
  const pairId = useCore((s) => s.pairId);
  const code = useCore((s) => s.pairCode);
  const partner = useCore((s) => s.partner);
  const status = useSyncStatus();
  const [err, setErr] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const statusText =
    status.status === 'ok' ? tr('settings.sync.ok') : status.status === 'syncing' ? tr('settings.sync.syncing') : status.status === 'error' ? `${tr('settings.sync.error')}: ${tErr(tr, status.error ?? '')}` : tr('settings.sync.off');

  return (
    <Screen header={<Header left="close" title={tr('settings.pairing.title')} />}>
      {pairId ? (
        <View style={{ gap: 12 }}>
          <Card>
            <Txt variant="h3">{partner ? `💞 ${tr('settings.pairing.paired', { name: partner.name })}` : `⏳ ${tr('settings.pairing.waiting')}`}</Txt>
            {code ? (
              <>
                <Txt variant="small" dim style={{ marginTop: 12 }}>
                  {tr('settings.pairing.code')}
                </Txt>
                <Txt size={36} weight="800" style={{ letterSpacing: 6 }}>
                  {code}
                </Txt>
              </>
            ) : null}
            <Txt variant="small" dim style={{ marginTop: 12 }}>
              {tr('settings.pairing.syncLabel')}: {statusText}
            </Txt>
          </Card>
          <PillButton kind="outline" icon="sync" label={tr('settings.sync.now')} onPress={() => void syncNow()} />
          {confirmLeave ? (
            <Card>
              <Txt dim>{tr('settings.pairing.leaveWarn')}</Txt>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <PillButton style={{ flex: 1 }} kind="outline" small label={tr('common.btn.cancel')} onPress={() => setConfirmLeave(false)} />
                <PillButton
                  style={{ flex: 1 }}
                  small
                  color={t.danger}
                  textColor={t.onDanger}
                  label={tr('settings.pairing.leaveConfirm')}
                  onPress={() => {
                    useCore.getState().leavePair();
                    setConfirmLeave(false);
                  }}
                />
              </View>
            </Card>
          ) : (
            <PillButton kind="ghost" label={tr('settings.pairing.leave')} textColor={t.dangerText} onPress={() => setConfirmLeave(true)} />
          )}
        </View>
      ) : (
        <>
          <Txt variant="h1" style={{ marginBottom: 6 }}>
            {tr('settings.pairing.title')}
          </Txt>
          <Txt dim style={{ marginBottom: 16 }}>
            {tr('settings.pairing.subtitle')}
          </Txt>
          {err ? (
            <Txt color={t.dangerText} variant="small" style={{ marginBottom: 10 }}>
              {err}
            </Txt>
          ) : null}
          <PairingPanel
            allowDemo
            onDone={(r) => {
              if (meId && r.uid !== meId) {
                setErr(tr('settings.pairing.mismatch'));
                return;
              }
              useCore.getState().setPair(r.pairId, r.code);
              if (router.canGoBack()) router.back();
            }}
          />
        </>
      )}
    </Screen>
  );
}
