/**
 * Kök hata sınırı + kurtarma ekranı. Kök düzeni (app/_layout.tsx) sarar; bir ekran çizilirken hata olursa
 * beyaz ekran yerine özgün bir kurtarma ekranı gösterir:
 *   1) "Yeniden dene" (sınırı sıfırlar),
 *   2) "Hata ayrıntısını paylaş" (sürüm/platform/dil + hata iletisi; paylaşım menüsü ya da pano),
 *   3) son çare "Verileri sıfırla…" — ne silineceğini açıkça yazan onay adımıyla.
 * Bu ekran kendi başına ayakta kalmalı: tema/çeviri yardımcıları hata verse de düz değerlere düşer.
 */
import React from 'react';
import { Appearance, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { translate } from '../i18n';
import { buildDiagnostics, shareText } from '../lib/diagnostics';
import { resetAllData } from '../store/resetAll';
import { useSettings } from '../store/settings';
import { dark, light, radius, type Palette } from '../theme';

const tx = (key: string) => {
  try {
    return translate(key);
  } catch {
    return key;
  }
};

function palette(): Palette {
  try {
    const pref = useSettings.getState().theme;
    const isDark = pref === 'dark' || (pref === 'system' && Appearance.getColorScheme() === 'dark');
    return isDark ? dark : light;
  } catch {
    return light;
  }
}

function Btn({ label, onPress, kind = 'primary', p, danger }: { label: string; onPress: () => void; kind?: 'primary' | 'outline'; p: Palette; danger?: boolean }) {
  const bg = kind === 'primary' ? (danger ? p.danger : p.primary) : 'transparent';
  const fg = kind === 'primary' ? (danger ? p.onDanger : p.onPrimary) : danger ? p.dangerText : p.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: radius.pill,
        backgroundColor: bg,
        borderWidth: kind === 'outline' ? 1.5 : 0,
        borderColor: danger ? p.dangerText : p.text,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        marginTop: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: fg, fontWeight: '800', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

interface State {
  error: Error | null;
  confirmReset: boolean;
  busy: boolean;
  msg: string | null;
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, confirmReset: false, busy: false, msg: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      console.warn('[all2me] ekran hatası yakalandı:', error?.message, info?.componentStack?.split('\n').slice(0, 4).join(' '));
    } catch {}
  }

  retry = () => this.setState({ error: null, confirmReset: false, msg: null });

  share = async () => {
    const e = this.state.error;
    const text = buildDiagnostics({ error: e ? { message: e.message, stack: e.stack } : null });
    const r = await shareText(text, tx('settings.feedback.shareTitle'));
    this.setState({ msg: r === 'copied' ? tx('common.recovery.copied') : r === 'failed' ? tx('settings.feedback.failed') : null });
  };

  reset = async () => {
    this.setState({ busy: true });
    try {
      await resetAllData();
    } catch {}
    this.setState({ busy: false, error: null, confirmReset: false, msg: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    const p = palette();
    const e = this.state.error;
    return (
      <View style={{ flex: 1, backgroundColor: p.bg }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'web' ? 40 : 72, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <Text style={{ fontSize: 56, textAlign: 'center' }}>🧯</Text>
          <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '900', color: p.text, textAlign: 'center', marginTop: 8 }}>
            {tx('common.recovery.title')}
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 23, color: p.textDim, textAlign: 'center', marginTop: 10 }}>{tx('common.recovery.body')}</Text>

          <View style={{ marginTop: 18 }}>
            <Btn p={p} label={tx('common.recovery.retry')} onPress={this.retry} />
            <Btn p={p} kind="outline" label={tx('common.recovery.share')} onPress={() => void this.share()} />
          </View>
          {this.state.msg ? <Text style={{ color: p.textDim, textAlign: 'center', marginTop: 10 }}>{this.state.msg}</Text> : null}

          <View style={{ backgroundColor: p.card, borderRadius: radius.lg, padding: 14, marginTop: 20 }}>
            <Text style={{ color: p.textDim, fontSize: 13, fontWeight: '700' }}>{tx('common.recovery.details')}</Text>
            <Text selectable numberOfLines={4} style={{ color: p.text, fontSize: 13, marginTop: 4 }}>
              {String(e?.message ?? e)}
            </Text>
          </View>

          <View style={{ backgroundColor: p.card, borderRadius: radius.lg, padding: 16, marginTop: 20, borderWidth: 1, borderColor: p.border }}>
            <Text style={{ color: p.text, fontSize: 17, fontWeight: '800' }}>{tx('common.recovery.resetTitle')}</Text>
            <Text style={{ color: p.textDim, fontSize: 14, lineHeight: 20, marginTop: 4 }}>{tx('common.recovery.resetBody')}</Text>
            {this.state.confirmReset ? (
              <>
                <Text style={{ color: p.dangerText, fontSize: 14, lineHeight: 20, marginTop: 10, fontWeight: '600' }}>{tx('common.recovery.resetWarn')}</Text>
                <Btn p={p} danger label={this.state.busy ? '…' : tx('common.recovery.resetConfirm')} onPress={() => void this.reset()} />
                <Btn p={p} kind="outline" label={tx('common.recovery.resetCancel')} onPress={() => this.setState({ confirmReset: false })} />
              </>
            ) : (
              <Btn p={p} kind="outline" danger label={tx('common.recovery.resetBtn')} onPress={() => this.setState({ confirmReset: true })} />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
}

/**
 * Yalnız web e2e testi için: localStorage `__all2me_crash_test` = '1' iken çizimde hata fırlatır
 * (kurtarma ekranını gerçek bir hatayla denemek için). Yerel uygulamada hiçbir şey yapmaz.
 */
export function CrashProbe() {
  if (Platform.OS === 'web') {
    let on = false;
    try {
      on = typeof window !== 'undefined' && window.localStorage?.getItem('__all2me_crash_test') === '1';
    } catch {}
    if (on) throw new Error('crash probe (e2e)');
  }
  return null;
}
