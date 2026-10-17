export type Oncelik = 'Düşük' | 'Orta' | 'Yüksek';
export type Durum = 'Açık' | 'Devam Ediyor' | 'Kapalı';

export interface IsEmri {
  id: string;
  baslik: string;
  ekipman: string;
  aciklama: string;
  oncelik: Oncelik;
  durum: Durum;
  olusturma: string; // ISO tarih
}

export const ONCELIKLER: Oncelik[] = ['Düşük', 'Orta', 'Yüksek'];
export const DURUMLAR: Durum[] = ['Açık', 'Devam Ediyor', 'Kapalı'];

export const sonrakiDurum = (d: Durum): Durum =>
  DURUMLAR[(DURUMLAR.indexOf(d) + 1) % DURUMLAR.length];
