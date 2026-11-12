/**
 * Ayarlar > Hatırlatıcı sağlığı: bildirim izni, Android tam zamanlı alarm izni, deneme bildirimi,
 * gruplara göre planlı bildirim sayısı, sessiz saatler ve günlük üst sınır (src/lib/notifBudget.ts).
 * Web'de yerel bildirim yok: durum açıklanır, ayarlar yine kaydedilir.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Switch, View } from 'react-native';
import { Card, Chip, Header, PillButton, Row, Screen, Txt } from '../src/components/ui';
import { exactAlarmStatus, openExactAlarmSettings, type ExactAlarmStatus } from '../src/features/toolsb/alarmSchedule';
import { fmtTime, useLang, useT } from '../src/i18n';
import {
  getBudgetLog,
  openAppSettings,
  permissionInfo,
  requestPermission,
  scheduledCounts,
  sendTestNotification,
  type BudgetLog,
  type PermissionInfo,
} from '../src/lib/notifications';
import { resyncEverything } from '../src/lib/reminders';
import { useCore } from '../src/store/core';
import { DAILY_CAP_OPTIONS, useSettings } from '../src/store/settings';
import { useTheme } from '../src/theme';

const QUIET_STARTS = ['20:00', '21:00', '22:00', '23:00', '00:00'];
const QUIET_ENDS = ['06:00', '07:00', '08:00', '09:00'];
const GROUP_KEYS = ['habit', 'drink', 'sleep', 'alarm', 'timer', 'mood', 'smoke', 'meals', 'chores', 'study', 'growth', 'report', 'motivation', 'test'];
const groupKey = (g: string) => `settings.health.groups.${GROUP_KEYS.includes(g) ? g : 'other'}`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Txt variant="h3" style={{ marginBottom: 10, marginLeft: 4 }}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

export default function ReminderHealth() {
  const th = useTheme();
  const t = useT();
  const lang = useLang();
  const web = Platform.OS === 'web';
  const notifications = useSettings((s) => s.notifications);
  const setNotifications = useSettings((s) => s.setNotifications);
  const quiet = useSettings((s) => s.quietHours);
  const setQuiet = useSettings((s) => s.setQuietHours);
  const cap = useSettings((s) => s.dailyCap);
  const setCap = useSettings((s) => s.setDailyCap);

  const [perm, setPerm] = useState<PermissionInfo | null>(null);
  const [exact, setExact] = useState<ExactAlarmStatus>({ missing: false, canOpenSettings: false });
  const [exactMsg, setExactMsg] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [log, setLog] = useState<Record<string, BudgetLog>>({});
  const [testState, setTestState] = useState<'idle' | 'sent' | 'failed'>('idle');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setPerm(await permissionInfo());
    if (Platform.OS === 'android') setExact(await exactAlarmStatus());
    setCounts(await scheduledCounts());
    setLog(getBudgetLog());
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && void refresh());
    return () => sub.remove();
  }, [refresh]);

  // sessiz saat / üst sınır değişince hepsini yeniden kur (art arda dokunuşlarda bir kez)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (web) return;
    const id = setTimeout(() => {
      void resyncEverything().then(refresh);
    }, 600);
    return () => clearTimeout(id);
  }, [quiet.enabled, quiet.start, quiet.end, cap, web, refresh]);

  const resync = async () => {
    setBusy(true);
    try {
      await resyncEverything();
      await refresh();
      useCore.getState().pushToast({ key: 'settings.health.counts.resynced', emoji: '🔔' });
    } finally {
      setBusy(false);
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const groups = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const logLines: string[] = [];
  for (const [g, l] of Object.entries(log)) {
    const group = t(groupKey(g));
    if (l.quietSkipped) logLines.push(t('settings.health.log.quiet', { group, n: l.quietSkipped }));
    if (l.deferred) logLines.push(t('settings.health.log.deferred', { group, n: l.deferred }));
    if (l.capTrimmed) logLines.push(t('settings.health.log.cap', { group, n: l.capTrimmed }));
  }

  const permText = !perm ? '…' : t(`settings.health.perm.${perm.status}`);
  const permOk = perm?.status === 'granted';

  return (
    <Screen header={<Header title={t('settings.health.title')} />}>
      <Txt dim style={{ marginBottom: 16 }}>
        {t('settings.health.intro')}
      </Txt>
      {web ? (
        <Card bg={th.pastel.yellow} style={{ marginBottom: 16 }}>
          <Txt color={th.onPastel}>ℹ️ {t('settings.health.web')}</Txt>
        </Card>
      ) : null}

      <Section title={t('settings.health.perm.title')}>
        <Card>
          <Row between gap={12}>
            <Txt variant="bodyBold" style={{ flex: 1 }}>
              {permOk ? '🔔' : '🔕'} {permText}
            </Txt>
          </Row>
          {!web && perm && !permOk ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {perm.canAskAgain ? (
                <PillButton style={{ flex: 1 }} small label={t('settings.health.perm.ask')} onPress={() => void requestPermission().then(setPerm)} />
              ) : null}
              <PillButton style={{ flex: 1 }} small kind="outline" label={t('settings.health.perm.openSettings')} onPress={() => void openAppSettings()} />
            </View>
          ) : null}
          {!web && perm?.status === 'denied' && !perm.canAskAgain ? (
            <Txt variant="small" dim style={{ marginTop: 8 }}>
              {t('settings.health.perm.deniedHint')}
            </Txt>
          ) : null}
          <View style={{ height: 1, backgroundColor: th.border, marginVertical: 14 }} />
          <Row between gap={12}>
            <Txt dim style={{ flex: 1 }}>
              {notifications ? t('settings.health.masterOn') : t('settings.health.masterOff')}
            </Txt>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: th.success, false: th.borderInput }} accessibilityLabel={t('settings.reminders.label')} />
          </Row>
        </Card>
      </Section>

      {Platform.OS === 'android' ? (
        <Section title={t('settings.health.exact.title')}>
          <Card>
            <Txt variant="bodyBold">{exact.missing ? `⚠️ ${t('settings.health.exact.missing')}` : `⏰ ${t('settings.health.exact.ok')}`}</Txt>
            {exact.missing && exact.canOpenSettings ? (
              <View style={{ marginTop: 10 }}>
                <PillButton
                  small
                  label={t('settings.health.exact.open')}
                  onPress={() => void openExactAlarmSettings().then((ok) => (ok ? setExact({ missing: false, canOpenSettings: false }) : setExactMsg(true)))}
                />
              </View>
            ) : null}
            {exact.missing && (exactMsg || !exact.canOpenSettings) ? (
              <Txt variant="small" dim style={{ marginTop: 8 }}>
                {t('settings.health.exact.manual')}
              </Txt>
            ) : null}
          </Card>
        </Section>
      ) : null}

      <Section title={t('settings.health.test.title')}>
        <Card>
          <Txt dim>{t('settings.health.test.body')}</Txt>
          <View style={{ marginTop: 12 }}>
            <PillButton
              small
              icon="notifications-outline"
              disabled={web}
              label={t('settings.health.test.send')}
              onPress={() =>
                void sendTestNotification(5).then((id) => {
                  setTestState(id ? 'sent' : 'failed');
                  void refresh();
                })
              }
            />
          </View>
          {testState !== 'idle' ? (
            <Txt variant="small" color={testState === 'sent' ? th.successText : th.dangerText} weight="600" style={{ marginTop: 8 }}>
              {t(testState === 'sent' ? 'settings.health.test.sent' : 'settings.health.test.failed')}
            </Txt>
          ) : null}
        </Card>
      </Section>

      <Section title={t('settings.health.counts.title')}>
        <Card>
          {groups.length === 0 ? (
            <Txt dim>{t('settings.health.counts.empty')}</Txt>
          ) : (
            <>
              {groups.map(([g, n]) => (
                <Row key={g} between style={{ paddingVertical: 4 }}>
                  <Txt>{t(groupKey(g))}</Txt>
                  <Txt variant="bodyBold">{n}</Txt>
                </Row>
              ))}
              <Txt variant="small" dim style={{ marginTop: 6 }}>
                {t('settings.health.counts.total', { n: total })}
              </Txt>
            </>
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <PillButton style={{ flex: 1 }} small kind="outline" icon="refresh" label={t('settings.health.counts.refresh')} onPress={() => void refresh()} />
            <PillButton style={{ flex: 1 }} small icon="sync" loading={busy} disabled={web} label={t('settings.health.counts.resync')} onPress={() => void resync()} />
          </View>
          <Txt variant="caption" faint style={{ marginTop: 10 }}>
            {t('settings.health.log.title')}: {logLines.length ? '' : t('settings.health.log.none')}
          </Txt>
          {logLines.map((l) => (
            <Txt key={l} variant="caption" faint>
              • {l}
            </Txt>
          ))}
        </Card>
      </Section>

      <Section title={t('settings.health.quiet.title')}>
        <Card>
          <Row between gap={12}>
            <Txt variant="bodyBold" style={{ flex: 1 }}>
              🌙 {t('settings.health.quiet.range', { start: fmtTime(quiet.start, lang), end: fmtTime(quiet.end, lang) })}
            </Txt>
            <Switch value={quiet.enabled} onValueChange={(v) => setQuiet({ enabled: v })} trackColor={{ true: th.success, false: th.borderInput }} accessibilityLabel={t('settings.health.quiet.title')} />
          </Row>
          <Txt variant="small" dim style={{ marginTop: 6 }}>
            {t('settings.health.quiet.hint')}
          </Txt>
          {quiet.enabled ? (
            <>
              <Txt variant="small" weight="700" style={{ marginTop: 12, marginBottom: 6 }}>
                {t('settings.health.quiet.start')}
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {QUIET_STARTS.map((h) => (
                  <Chip key={h} label={fmtTime(h, lang)} active={quiet.start === h} onPress={() => setQuiet({ start: h })} />
                ))}
              </View>
              <Txt variant="small" weight="700" style={{ marginTop: 12, marginBottom: 6 }}>
                {t('settings.health.quiet.end')}
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {QUIET_ENDS.map((h) => (
                  <Chip key={h} label={fmtTime(h, lang)} active={quiet.end === h} onPress={() => setQuiet({ end: h })} />
                ))}
              </View>
            </>
          ) : null}
        </Card>
      </Section>

      <Section title={t('settings.health.cap.title')}>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DAILY_CAP_OPTIONS.map((n) => (
              <Chip key={n} label={n === 0 ? t('settings.health.cap.off') : t('settings.health.cap.n', { n })} active={cap === n} onPress={() => setCap(n)} />
            ))}
          </View>
          <Txt variant="small" dim style={{ marginTop: 10 }}>
            {t('settings.health.cap.hint')}
          </Txt>
        </Card>
      </Section>

      <Section title={t('settings.health.tips.title')}>
        <Card>
          <Txt variant="small">🌙 {t('settings.health.tips.dnd')}</Txt>
          <Txt variant="small" style={{ marginTop: 6 }}>
            🔋 {t('settings.health.tips.battery')}
          </Txt>
          <Txt variant="small" dim style={{ marginTop: 6 }}>
            ⏰ {t('settings.health.tips.honest')}
          </Txt>
        </Card>
      </Section>
    </Screen>
  );
}
