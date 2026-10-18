/** Expo Go bağlantıları ve bağımsız uygulamanın harcama:// bağlantıları. */
export function launchMode(u: string | null | undefined): 'ekle' | 'butce' | null {
  if (!u) return null;
  const native = /^harcama:\/{0,3}(ekle|butce)(?:[/?#]|$)/.exec(u);
  if (native) return native[1] as 'ekle' | 'butce';
  if (/[?&]channel-name=ekle(?:[&#]|$)/.test(u) || /\/--\/ekle(?:[/?#]|$)/.test(u)) return 'ekle';
  if (/[?&]channel-name=butce(?:[&#]|$)/.test(u) || /\/--\/butce(?:[/?#]|$)/.test(u)) return 'butce';
  return null;
}
