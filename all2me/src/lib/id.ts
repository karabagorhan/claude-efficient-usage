import * as Crypto from 'expo-crypto';

export const uuid = (): string => Crypto.randomUUID();

/** Tamamlama kimliği deterministik: aynı görev + gün tek kayıt = çift sayım yok. */
export const completionId = (habitId: string, dayKey: string) => `c:${habitId}:${dayKey}`;
