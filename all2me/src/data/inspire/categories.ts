import { l } from './helpers';
import type { Category, SectionId } from './types';

export const CATEGORIES: Category[] = [
  { id: 'cleaning', emoji: '🧽', pastel: 'blue', name: l('Pırıl Pırıl Ev', 'Sparkling Home') },
  { id: 'selfcare', emoji: '💖', pastel: 'pink', name: l('Kendini Şımart', 'Pamper Yourself') },
  { id: 'focus', emoji: '🧠', pastel: 'yellow', name: l('Odak ve Sakinlik', 'Focus & Calm') },
  { id: 'morning', emoji: '🌅', pastel: 'peach', name: l('Güne Merhaba', 'Hello, Morning') },
  { id: 'work', emoji: '📚', pastel: 'green', name: l('Masa Başı', 'At the Desk') },
  { id: 'food', emoji: '🥗', pastel: 'mint', name: l('Yemek', 'Food') },
  { id: 'fitness', emoji: '🏃', pastel: 'purple', name: l('Spor', 'Fitness') },
  { id: 'evening', emoji: '🌙', pastel: 'blue', name: l('Günün Sonu', 'End of Day') },
  { id: 'beauty', emoji: '💅', pastel: 'pink', name: l('Güzellik', 'Beauty') },
  { id: 'study', emoji: '🎓', pastel: 'green', name: l('Okul ve Kariyer', 'School & Career') },
  { id: 'health', emoji: '🌿', pastel: 'mint', name: l('Sağlıklı Yaşam', 'Healthy Living') },
];

/** Ana sayfadaki bölümlerin sırası ve başlıkları */
export const SECTIONS: { id: SectionId; name: import('../../engine/types').Loc }[] = [
  { id: 'popularCleaning', name: l('Ev için favoriler', 'Home favorites') },
  { id: 'organized', name: l('Kolay düzen', 'Order made easy') },
  { id: 'work101', name: l('İş günü takviyesi', 'Workday boosters') },
  { id: 'backToSchool', name: l('Okul modu açık', 'School mode on') },
  { id: 'foodTips', name: l('Yemek ipuçları', 'Food tips') },
  { id: 'fit', name: l('Hadi hareket', 'Get moving') },
  { id: 'endOfDay', name: l('Gün biterken', 'Winding down') },
  { id: 'tips', name: l('Hayatı kolaylaştıranlar', 'Little life-savers') },
  { id: 'beautyHello', name: l('Işıltı köşesi', 'Glow corner') },
];
