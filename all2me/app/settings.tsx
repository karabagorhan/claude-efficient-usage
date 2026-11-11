import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { Card, Header, PillButton, Row, Screen, Segmented, Txt } from '../src/components/ui';
import { fmtTime, tErr, useLang, useT } from '../src/i18n';
import { syncNow, useSyncStatus } from '../src/lib/sync';
import { routes } from '../src/lib/routes';
import { useCore } from '../src/store/core';
import { resetAllData } from '../src/store/resetAll';
import { useSettings, type ThemePref, type Units } from '../src/store/settings';
import { useTheme } from '../src/theme';
import type { Lang } from '../src/i18n';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Txt variant="h3" style={{ marginBottom: 10, marginLeft: 4 }}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const s = useSettings();
  const pairId = useCore((c) => c.pairId);
  const pairCode = useCore((c) => c.pairCode);
  const partnerName = useCore((c) => c.partner?.name);
  const sync = useSyncStatus();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const resetAll = async () => {
    setBusy(true);
    try {
      await resetAllData();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  const syncText =
    sync.status === 'ok'
      ? tr('settings.sync.ok')
      : sync.status === 'syncing'
        ? tr('settings.sync.syncing')
        : sync.status === 'error'
          ? `${tr('settings.sync.error')}: ${tErr(tr, sync.error ?? '')}`
          : tr('settings.sync.off');
  const lastAt = sync.lastAt ? fmtTime(new Date(sync.lastAt).toTimeString().slice(0, 5), lang) : null;

  return (
    <Screen header={<Header title={tr('settings.title')} />}>
      <Section title={tr('settings.language')}>
        <Segmented<Lang>
          value={lang}
          onChange={(v) => s.setLang(v)}
          options={[
            { id: 'tr', label: tr('onboarding.lang.tr') },
            { id: 'en', label: tr('onboarding.lang.en') },
          ]}
        />
      </Section>

      <Section title={tr('settings.units')}>
        <Segmented<Units>
          value={s.units}
          onChange={(v) => s.setUnits(v)}
          options={[
            { id: 'ml', label: tr('common.unit.ml') },
            { id: 'oz', label: tr('common.unit.oz') },
          ]}
        />
      </Section>

      <Section title={tr('settings.theme.label')}>
        <Segmented<ThemePref>
          value={s.theme}
          onChange={(v) => s.setTheme(v)}
          options={[
            { id: 'system', label: tr('settings.theme.system') },
            { id: 'light', label: tr('settings.theme.light') },
            { id: 'dark', label: tr('settings.theme.dark') },
          ]}
        />
      </Section>

      <Section title={tr('settings.reminders.label')}>
        <Card>
          <Row between gap={12}>
            <Txt dim style={{ flex: 1 }}>
              {tr('settings.reminders.hint')}
            </Txt>
            <Switch value={s.notifications} onValueChange={s.setNotifications} trackColor={{ true: t.success, false: t.borderInput }} accessibilityLabel={tr('settings.reminders.label')} />
          </Row>
        </Card>
      </Section>

      <Section title={tr('settings.partner.title')}>
        <Card>
          <Txt variant="bodyBold">
            {pairId ? (partnerName ? tr('settings.partner.paired', { name: partnerName }) : tr('settings.partner.waiting')) : tr('settings.partner.none')}
          </Txt>
          {pairId && pairCode ? (
            <Row between style={{ marginTop: 10 }}>
              <Txt variant="small" dim>
                {tr('settings.partner.code')}
              </Txt>
              <Txt weight="800" size={20} style={{ letterSpacing: 4 }}>
                {pairCode}
              </Txt>
            </Row>
          ) : null}
          {pairId ? (
            <View style={{ marginTop: 10 }}>
              <Row between>
                <Txt variant="small" dim>
                  {tr('settings.sync.label')}
                </Txt>
                <Txt variant="small" weight="600" color={sync.status === 'error' ? t.dangerText : t.text} numberOfLines={2} style={{ flexShrink: 1, textAlign: 'right' }}>
                  {syncText}
                </Txt>
              </Row>
              {lastAt ? (
                <Txt variant="caption" faint style={{ marginTop: 4 }}>
                  {tr('settings.sync.lastAt', { time: lastAt })}
                </Txt>
              ) : null}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <PillButton
              style={{ flex: 1 }}
              small
              kind="outline"
              label={pairId ? tr('settings.partner.manage') : tr('settings.partner.add')}
              onPress={() => router.push(routes.pairing())}
            />
            {pairId ? <PillButton style={{ flex: 1 }} small icon="sync" label={tr('settings.sync.now')} onPress={() => void syncNow()} /> : null}
          </View>
        </Card>
      </Section>

      <Section title={tr('settings.data.title')}>
        {confirm ? (
          <Card>
            <Txt>{tr('settings.data.warn')}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <PillButton style={{ flex: 1 }} small kind="outline" label={tr('common.btn.cancel')} onPress={() => setConfirm(false)} />
              <PillButton style={{ flex: 1 }} small loading={busy} color={t.danger} textColor={t.onDanger} label={tr('settings.data.confirm')} onPress={() => void resetAll()} />
            </View>
          </Card>
        ) : (
          <PillButton kind="outline" icon="trash-outline" label={tr('settings.data.reset')} textColor={t.dangerText} onPress={() => setConfirm(true)} />
        )}
      </Section>

      <Section title={tr('settings.about.title')}>
        <Card>
          <Txt variant="bodyBold">
            {tr('common.appName')} · {tr('settings.about.version', { v: version })}
          </Txt>
          <Txt variant="small" dim style={{ marginTop: 6 }}>
            {tr('common.medicalNote')}
          </Txt>
        </Card>
      </Section>
    </Screen>
  );
}
