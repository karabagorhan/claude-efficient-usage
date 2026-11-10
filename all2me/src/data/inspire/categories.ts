import { l } from './helpers';
import type { Category, SectionId } from './types';

export const CATEGORIES: Category[] = [
  { id: 'cleaning', emoji: '🧽', pastel: 'blue', name: l('Temizlik Planları', 'Cleaning Plans') },
  { id: 'selfcare', emoji: '💖', pastel: 'pink', name: l('Kendime Bakım', 'Take Care of Myself') },
  { id: 'focus', emoji: '🧠', pastel: 'yellow', name: l('Odak ve Sakinlik', 'Focus & Calm') },
  { id: 'morning', emoji: '🌅', pastel: 'peach', name: l('Sabah Rutinleri', 'Morning Routines') },
  { id: 'work', emoji: '📚', pastel: 'green', name: l('İş ve Ders', 'Work & Study') },
  { id: 'food', emoji: '🥗', pastel: 'mint', name: l('Yemek', 'Food') },
  { id: 'fitness', emoji: '🏃', pastel: 'purple', name: l('Spor', 'Fitness') },
  { id: 'evening', emoji: '🌙', pastel: 'blue', name: l('Günün Sonu', 'End of Day') },
  { id: 'beauty', emoji: '💅', pastel: 'pink', name: l('Güzellik', 'Beauty') },
  { id: 'study', emoji: '🎓', pastel: 'green', name: l('Okul ve Kariyer', 'School & Career') },
  { id: 'health', emoji: '🌿', pastel: 'mint', name: l('Sağlıklı Yaşam', 'Healthy Living') },
];

/** Ana sayfadaki bölümlerin sırası ve başlıkları */
export const SECTIONS: { id: SectionId; name: import('../../engine/types').Loc }[] = [
  { id: 'popularCleaning', name: l('Popüler temizlik şablonları', 'Popular cleaning templates') },
  { id: 'organized', name: l('Düzenli ol', 'To be organized') },
  { id: 'work101', name: l('İş ve Ders 101', 'Work & Study 101') },
  { id: 'backToSchool', name: l('Okula dönüş', 'Back to school') },
  { id: 'foodTips', name: l('Yemek ipuçları', 'Food tips') },
  { id: 'fit', name: l('Fit ve harika', 'Fit & fabulous') },
  { id: 'endOfDay', name: l('Günün sonunda', 'At the end of the day') },
  { id: 'tips', name: l('Kaçırılmayacak ipuçları', 'Tips you cannot miss') },
  { id: 'beautyHello', name: l('Merhaba güzellik', 'Hello, beauty') },
];
