import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Switch, TextInput, View } from 'react-native';
import { Card, Header, PillButton, Row, Screen, Segmented, Txt } from '../src/components/ui';
import { buildDiagnostics, shareText } from '../src/lib/diagnostics';
import { calendarSupported, removeAllFromCalendar, syncAllToCalendar } from '../src/lib/calendar';
import { useCalendar } from '../src/store/slices/calendar';
import { fmtTime, tErr, useLang, useT } from '../src/i18n';
import { syncNow, useSyncStatus } from '../src/lib/sync';
import { routes } from '../src/lib/routes';
import { useCore } from '../src/store/core';
import { resetAllData } from '../src/store/resetAll';
import { useSettings, type TaskOrder, type ThemePref, type Units } from '../src/store/settings';
import { radius, useTheme } from '../src/theme';
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
  const calSupported = calendarSupported();
  const calId = useCalendar((c) => c.calendarId);
  const calCount = useCalendar((c) => Object.values(c.events).reduce((n, ids) => n + ids.length, 0));
  const [calBusy, setCalBusy] = useState(false);
  const [calConfirm, setCalConfirm] = useState(false);
  const calToast = (key: string, params?: Record<string, number>) => useCore.getState().pushToast({ key, params, emoji: key.endsWith('error') || key.endsWith('denied') ? '⚠️' : '📅' });
  const syncCal = async () => {
    setCalBusy(true);
    try {
      const r = await syncAllToCalendar();
      calToast(r.result === 'ok' ? 'settings.calendar.toast.synced' : `settings.calendar.toast.${r.result}`, { n: r.count });
    } finally {
      setCalBusy(false);
    }
  };
  const removeCal = async () => {
    setCalBusy(true);
    try {
      const r = await removeAllFromCalendar();
      calToast(r === 'ok' ? 'settings.calendar.toast.removed' : `settings.calendar.toast.${r}`);
    } finally {
      setCalBusy(false);
      setCalConfirm(false);
    }
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const [note, setNote] = useState('');
  const sendFeedback = async () => {
    const r = await shareText(buildDiagnostics({ note }), tr('settings.feedback.shareTitle'));
    if (r === 'copied') useCore.getState().pushToast({ key: 'settings.feedback.copied', emoji: '📋' });
    else if (r === 'failed') useCore.getState().pushToast({ key: 'settings.feedback.failed', emoji: '⚠️' });
  };

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
        <Card onPress={() => router.push(routes.settingsReminders())} style={{ marginTop: 10 }}>
          <Row between gap={12}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold">🩺 {tr('settings.health.open')}</Txt>
              <Txt variant="small" dim>
                {tr('settings.health.openHint')}
              </Txt>
            </View>
            <Txt variant="h3" dim>
              ›
            </Txt>
          </Row>
        </Card>
      </Section>

      <Section title={tr('settings.order.title')}>
        <Segmented<TaskOrder>
          value={s.taskOrder}
          onChange={(v) => s.setTaskOrder(v)}
          options={[
            { id: 'auto', label: tr('settings.order.auto') },
            { id: 'manual', label: tr('settings.order.manual') },
          ]}
        />
        <Txt variant="small" dim style={{ marginTop: 8, marginHorizontal: 4 }}>
          {tr('settings.order.hint')}
        </Txt>
      </Section>

      <Section title={tr('settings.calendar.title')}>
        <Card>
          <Txt variant="bodyBold">
            📅 {!calSupported ? tr('settings.calendar.notConnected') : calId ? tr('settings.calendar.connected') : tr('settings.calendar.notConnected')}
          </Txt>
          {calSupported && calId ? (
            <Txt variant="small" dim style={{ marginTop: 2 }}>
              {tr('settings.calendar.events', { n: calCount })}
            </Txt>
          ) : null}
          <Txt variant="small" dim style={{ marginTop: 6 }}>
            {calSupported ? tr('settings.calendar.hint') : tr('settings.calendar.unsupported')}
          </Txt>
          {calSupported ? (
            calConfirm ? (
              <View style={{ marginTop: 12 }}>
                <Txt>{tr('settings.calendar.removeWarn')}</Txt>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <PillButton style={{ flex: 1 }} small kind="outline" label={tr('common.btn.cancel')} onPress={() => setCalConfirm(false)} />
                  <PillButton style={{ flex: 1 }} small loading={calBusy} color={t.danger} textColor={t.onDanger} label={tr('settings.calendar.removeConfirm')} onPress={() => void removeCal()} />
                </View>
              </View>
            ) : (
              <>
                <Txt variant="caption" faint style={{ marginTop: 6 }}>
                  {tr('settings.calendar.syncHint')}
                </Txt>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <PillButton style={{ flex: 1 }} small icon="sync" loading={calBusy} label={tr('settings.calendar.syncAll')} onPress={() => void syncCal()} />
                  <PillButton style={{ flex: 1 }} small kind="outline" disabled={!calId && calCount === 0} label={tr('settings.calendar.remove')} onPress={() => setCalConfirm(true)} />
                </View>
              </>
            )
          ) : null}
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

      <Section title={tr('settings.support.title')}>
        <Card bg={t.pastel.mint}>
          <Txt color={t.onPastel}>{tr('settings.support.intro')}</Txt>
          {(['talk', 'pro', 'small'] as const).map((k, i) => (
            <Row key={k} gap={8} style={{ marginTop: 10, alignItems: 'flex-start' }}>
              <Txt color={t.onPastel}>{['💬', '🩺', '🌱'][i]}</Txt>
              <Txt variant="small" color={t.onPastel} style={{ flex: 1 }}>
                {tr(`settings.support.tips.${k}`)}
              </Txt>
            </Row>
          ))}
          <View style={{ marginTop: 12 }}>
            <PillButton small kind="outline" icon="leaf-outline" label={tr('settings.support.tips.breathe')} onPress={() => router.push(routes.tool('meditate'))} />
          </View>
          <View style={{ marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: t.card }}>
            <Txt variant="small" weight="700">
              🚨 {tr('settings.support.emergency')}
            </Txt>
          </View>
          <Txt variant="caption" color={t.onPastel} style={{ marginTop: 10 }}>
            {tr('settings.support.note')} {tr('common.medicalNote')}
          </Txt>
        </Card>
      </Section>

      <Section title={tr('settings.feedback.title')}>
        <Card>
          <Txt variant="small" dim>
            {tr('settings.feedback.hint')}
          </Txt>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={tr('settings.feedback.placeholder')}
            placeholderTextColor={t.textFaint}
            multiline
            maxLength={1000}
            accessibilityLabel={tr('settings.feedback.title')}
            style={{ marginTop: 10, minHeight: 72, borderRadius: radius.md, borderWidth: 1, borderColor: t.borderInput, backgroundColor: t.card, color: t.text, padding: 12, fontSize: 15, textAlignVertical: 'top' }}
          />
          <View style={{ marginTop: 10 }}>
            <PillButton small icon="share-outline" label={tr('settings.feedback.share')} onPress={() => void sendFeedback()} />
          </View>
        </Card>
      </Section>

      <Section title={tr('settings.about.title')}>
        <Card>
          <Txt variant="bodyBold">
            {tr('common.appName')} · {tr('settings.about.version', { v: version })}
          </Txt>
          <Txt style={{ marginTop: 8 }}>💚 {tr('settings.about.free')}</Txt>
          <Txt variant="small" dim style={{ marginTop: 6 }}>
            📱 {tr('settings.about.local')}
          </Txt>
          <Txt variant="small" dim style={{ marginTop: 6 }}>
            {tr('common.medicalNote')}
          </Txt>
        </Card>
      </Section>
    </Screen>
  );
}
