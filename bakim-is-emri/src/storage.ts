import AsyncStorage from '@react-native-async-storage/async-storage';
import { IsEmri } from './types';

const KEY = 'is-emirleri-v1';

export async function yukle(): Promise<IsEmri[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as IsEmri[]) : [];
  } catch {
    return [];
  }
}

export async function kaydet(liste: IsEmri[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(liste));
}
