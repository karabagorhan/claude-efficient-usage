/**
 * Araçlar B ortak parçaları (zamanlayıcı, meditasyon, egzersiz, ses ortamı, alarm).
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Txt } from '../../components/ui';
import { alpha, radius, useTheme } from '../../theme';
import { useT } from '../../i18n';

/** 125 sn -> "02:05" */
export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** active iken her `ms` milisaniyede Date.now() döndürür (zaman damgasına dayalı geri sayımlar için). */
export function useNow(active: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

/** Güncel değere her zaman erişmek için ref (aralık/zamanlayıcı geri çağrıları için). */
export function useLatest<T>(v: T) {
  const r = useRef(v);
  r.current = v;
  return r;
}

/** Sayısal özet kutucuğu */
export function StatTile({ value, label, bg }: { value: string; label: string; bg?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: bg ?? t.cardAlt, borderRadius: radius.md, padding: 14 }}>
      <Txt variant="h2" color={bg ? t.onPastel : undefined}>
        {value}
      </Txt>
      <Txt variant="caption" dim={!bg} color={bg ? alpha(t.onPastel, 0.75) : undefined}>
        {label}
      </Txt>
    </View>
  );
}

/** "Tıbbi tavsiye değildir" notu */
export function MedNote() {
  const t = useT();
  return (
    <Txt variant="caption" faint center style={{ marginTop: 16 }}>
      {t('common.medicalNote')}
    </Txt>
  );
}
