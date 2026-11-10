/** Tez için varsayılan kilometre taşları (iki dilli). offsetDays: bugünden önerilen hedef tarih. */
import type { Loc } from '../engine/types';

export interface ThesisMilestoneDef {
  key: string;
  emoji: string;
  title: Loc;
  hint: Loc;
  offsetDays: number;
}

export const THESIS_MILESTONES: ThesisMilestoneDef[] = [
  { key: 'topic', emoji: '💡', title: { tr: 'Konu seçimi', en: 'Choose a topic' }, hint: { tr: 'Danışmanla konuyu netleştir', en: 'Agree on the topic with your advisor' }, offsetDays: 14 },
  { key: 'proposal', emoji: '📄', title: { tr: 'Tez önerisi', en: 'Thesis proposal' }, hint: { tr: 'Öneri metnini yaz ve sun', en: 'Write and present the proposal' }, offsetDays: 45 },
  { key: 'literature', emoji: '📚', title: { tr: 'Literatür taraması', en: 'Literature review' }, hint: { tr: 'Kaynakları oku, özetle, sınıflandır', en: 'Read, summarise and organise sources' }, offsetDays: 90 },
  { key: 'method', emoji: '🧭', title: { tr: 'Yöntem', en: 'Methodology' }, hint: { tr: 'Araştırma tasarımını belirle', en: 'Define the research design' }, offsetDays: 120 },
  { key: 'data', emoji: '🗂️', title: { tr: 'Veri toplama', en: 'Data collection' }, hint: { tr: 'Veriyi topla ve düzenle', en: 'Collect and clean the data' }, offsetDays: 180 },
  { key: 'analysis', emoji: '📊', title: { tr: 'Analiz', en: 'Analysis' }, hint: { tr: 'Bulguları analiz et', en: 'Analyse the findings' }, offsetDays: 240 },
  { key: 'writing', emoji: '✍️', title: { tr: 'Yazım', en: 'Writing' }, hint: { tr: 'Bölümleri yaz, düzelt', en: 'Write and revise the chapters' }, offsetDays: 300 },
  { key: 'defense', emoji: '🎓', title: { tr: 'Savunma', en: 'Defense' }, hint: { tr: 'Sunumu hazırla, prova yap', en: 'Prepare and rehearse the talk' }, offsetDays: 365 },
];

export const thesisDef = (key?: string) => THESIS_MILESTONES.find((m) => m.key === key);
