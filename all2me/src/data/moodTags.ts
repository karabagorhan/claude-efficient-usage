import type { Loc } from '../i18n/types';

export interface MoodTag {
  id: string;
  emoji: string;
  name: Loc;
}

/** Ruh hali etiketleri (kayıtta yalnız id saklanır). */
export const MOOD_TAGS: MoodTag[] = [
  { id: 'calm', emoji: '😌', name: { tr: 'Sakin', en: 'Calm' } },
  { id: 'happy', emoji: '😊', name: { tr: 'Mutlu', en: 'Happy' } },
  { id: 'grateful', emoji: '🙏', name: { tr: 'Minnettar', en: 'Grateful' } },
  { id: 'motivated', emoji: '🔥', name: { tr: 'Motive', en: 'Motivated' } },
  { id: 'focused', emoji: '🎯', name: { tr: 'Odaklı', en: 'Focused' } },
  { id: 'proud', emoji: '🌟', name: { tr: 'Gururlu', en: 'Proud' } },
  { id: 'hopeful', emoji: '🌱', name: { tr: 'Umutlu', en: 'Hopeful' } },
  { id: 'excited', emoji: '🤩', name: { tr: 'Heyecanlı', en: 'Excited' } },
  { id: 'tired', emoji: '😴', name: { tr: 'Yorgun', en: 'Tired' } },
  { id: 'stressed', emoji: '😰', name: { tr: 'Stresli', en: 'Stressed' } },
  { id: 'anxious', emoji: '😟', name: { tr: 'Kaygılı', en: 'Anxious' } },
  { id: 'sad', emoji: '😢', name: { tr: 'Üzgün', en: 'Sad' } },
  { id: 'angry', emoji: '😠', name: { tr: 'Öfkeli', en: 'Angry' } },
  { id: 'lonely', emoji: '🫥', name: { tr: 'Yalnız', en: 'Lonely' } },
  { id: 'bored', emoji: '🥱', name: { tr: 'Sıkkın', en: 'Bored' } },
  { id: 'overwhelmed', emoji: '🌀', name: { tr: 'Bunalmış', en: 'Overwhelmed' } },
];

export const tagById = (id: string) => MOOD_TAGS.find((t) => t.id === id);
