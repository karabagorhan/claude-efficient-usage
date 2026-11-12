/**
 * Tanı metni (geri bildirim / hata ayrıntısı) ve paylaşım. E-posta adresi yok: kullanıcı paylaşım menüsünden
 * istediği uygulamayı seçer. Kişisel veri (görev adları, notlar, ad) EKLENMEZ; yalnız sürüm, güncelleme kimliği,
 * platform, dil, tarih + kullanıcının yazdığı kısa not ve (varsa) hata iletisi/yığını.
 */
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Platform, Share } from 'react-native';
import { translate } from '../i18n';
import { useSettings } from '../store/settings';

function updateId(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const U = require('expo-updates');
    const id = U?.updateId;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

export interface DiagInput {
  note?: string;
  error?: { message?: string; stack?: string } | null;
  now?: Date;
}

export function buildDiagnostics(d: DiagInput = {}): string {
  const T = (k: string) => translate(`settings.feedback.lines.${k}`);
  let lang = 'tr';
  try {
    lang = useSettings.getState().lang;
  } catch {}
  const version = Constants.expoConfig?.version ?? '?';
  const upd = updateId();
  const os = `${Platform.OS} ${String(Platform.Version ?? '')}`.trim();
  const lines = [
    `— ${T('header')} —`,
    `${T('version')}: ${version}`,
    `${T('update')}: ${upd ?? T('updateNone')}`,
    `${T('platform')}: ${os}`,
    `${T('lang')}: ${lang}`,
    `${T('date')}: ${(d.now ?? new Date()).toISOString()}`,
  ];
  const note = (d.note ?? '').trim();
  if (note) lines.push('', `${T('note')}: ${note.slice(0, 1000)}`);
  if (d.error) {
    lines.push('', `${T('error')}: ${String(d.error.message ?? '').slice(0, 500)}`);
    if (d.error.stack) lines.push(String(d.error.stack).split('\n').slice(0, 12).join('\n'));
  }
  return lines.join('\n');
}

/**
 * Paylaşım menüsünü açar; açılamazsa (ör. web'de Web Share API yoksa) metni panoya kopyalar.
 * Dönüş: 'shared' | 'copied' | 'failed'.
 */
export async function shareText(message: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  const canWebShare = Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function');
  if (canWebShare) {
    try {
      await Share.share({ message, title });
      return 'shared';
    } catch {}
  }
  try {
    await Clipboard.setStringAsync(message);
    return 'copied';
  } catch {
    return 'failed';
  }
}
