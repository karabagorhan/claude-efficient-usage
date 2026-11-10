// Hızlı ev yemeği fikirleri (iki dilli). Malzemeler alışveriş listesini besler.
import type { Loc } from '../engine/types';

export type IdeaMeal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealIdea {
  id: string;
  emoji: string;
  name: Loc;
  /** hazırlık süresi (dk) */
  mins: number;
  meals: IdeaMeal[];
  items: Loc[];
}

const l = (tr: string, en: string): Loc => ({ tr, en });

/** Ortak malzeme sözlüğü (alışveriş listesinde aynı malzeme birleşir; anahtar = tr metni). */
const I = {
  egg: l('Yumurta', 'Eggs'),
  bread: l('Ekmek', 'Bread'),
  cheese: l('Peynir', 'Cheese'),
  tomato: l('Domates', 'Tomatoes'),
  cucumber: l('Salatalık', 'Cucumber'),
  oats: l('Yulaf', 'Oats'),
  milk: l('Süt', 'Milk'),
  banana: l('Muz', 'Bananas'),
  yogurt: l('Yoğurt', 'Yogurt'),
  honey: l('Bal', 'Honey'),
  pasta: l('Makarna', 'Pasta'),
  rice: l('Pirinç', 'Rice'),
  bulgur: l('Bulgur', 'Bulgur'),
  lentil: l('Kırmızı mercimek', 'Red lentils'),
  chickpea: l('Haşlanmış nohut', 'Cooked chickpeas'),
  chicken: l('Tavuk göğsü', 'Chicken breast'),
  mince: l('Kıyma', 'Ground meat'),
  tuna: l('Ton balığı', 'Canned tuna'),
  onion: l('Soğan', 'Onions'),
  garlic: l('Sarımsak', 'Garlic'),
  pepper: l('Biber', 'Bell peppers'),
  potato: l('Patates', 'Potatoes'),
  carrot: l('Havuç', 'Carrots'),
  zucchini: l('Kabak', 'Zucchini'),
  eggplant: l('Patlıcan', 'Eggplant'),
  spinach: l('Ispanak', 'Spinach'),
  lettuce: l('Marul', 'Lettuce'),
  lemon: l('Limon', 'Lemons'),
  paste: l('Salça', 'Tomato paste'),
  tortilla: l('Lavaş / tortilla', 'Tortillas'),
  broccoli: l('Brokoli', 'Broccoli'),
  mushroom: l('Mantar', 'Mushrooms'),
  corn: l('Mısır', 'Corn'),
  apple: l('Elma', 'Apples'),
  nuts: l('Ceviz / fındık', 'Walnuts / hazelnuts'),
  peanut: l('Fıstık ezmesi', 'Peanut butter'),
  flour: l('Un', 'Flour'),
  parsley: l('Maydanoz', 'Parsley'),
  olive: l('Zeytin', 'Olives'),
};

export const MEAL_IDEAS: MealIdea[] = [
  { id: 'menemen', emoji: '🍳', name: l('Menemen', 'Turkish scrambled eggs'), mins: 15, meals: ['breakfast', 'dinner'], items: [I.egg, I.tomato, I.pepper, I.onion] },
  { id: 'oats', emoji: '🥣', name: l('Meyveli yulaf', 'Fruity oatmeal'), mins: 5, meals: ['breakfast'], items: [I.oats, I.milk, I.banana, I.honey] },
  { id: 'omelette', emoji: '🧀', name: l('Peynirli omlet', 'Cheese omelette'), mins: 10, meals: ['breakfast'], items: [I.egg, I.cheese, I.parsley] },
  { id: 'toast', emoji: '🥪', name: l('Peynirli tost', 'Grilled cheese toast'), mins: 10, meals: ['breakfast', 'snack'], items: [I.bread, I.cheese, I.tomato] },
  { id: 'yogurtbowl', emoji: '🥛', name: l('Yoğurtlu kase', 'Yogurt bowl'), mins: 5, meals: ['breakfast', 'snack'], items: [I.yogurt, I.honey, I.nuts, I.banana] },
  { id: 'peanutbanana', emoji: '🍌', name: l('Fıstık ezmeli muzlu ekmek', 'Peanut butter banana toast'), mins: 5, meals: ['breakfast', 'snack'], items: [I.bread, I.peanut, I.banana] },
  { id: 'veggieomelette', emoji: '🥚', name: l('Sebzeli omlet', 'Veggie omelette'), mins: 12, meals: ['breakfast', 'lunch', 'dinner'], items: [I.egg, I.pepper, I.tomato, I.onion] },
  { id: 'spinachegg', emoji: '🥬', name: l('Ispanaklı yumurta', 'Spinach and eggs'), mins: 15, meals: ['breakfast', 'lunch', 'dinner'], items: [I.spinach, I.egg, I.onion] },
  { id: 'smoothie', emoji: '🥤', name: l('Muzlu smoothie', 'Banana smoothie'), mins: 5, meals: ['breakfast', 'snack'], items: [I.banana, I.milk, I.oats] },
  { id: 'tunasalad', emoji: '🥗', name: l('Ton balıklı salata', 'Tuna salad'), mins: 10, meals: ['lunch', 'dinner'], items: [I.tuna, I.lettuce, I.tomato, I.cucumber, I.lemon] },
  { id: 'chickensalad', emoji: '🥗', name: l('Tavuklu salata', 'Chicken salad'), mins: 15, meals: ['lunch', 'dinner'], items: [I.chicken, I.lettuce, I.cucumber, I.corn, I.lemon] },
  { id: 'chickpeasalad', emoji: '🫘', name: l('Nohutlu salata', 'Chickpea salad'), mins: 10, meals: ['lunch', 'dinner'], items: [I.chickpea, I.cucumber, I.tomato, I.lemon, I.parsley] },
  { id: 'tunasandwich', emoji: '🥪', name: l('Ton balıklı sandviç', 'Tuna sandwich'), mins: 10, meals: ['lunch', 'snack'], items: [I.tuna, I.bread, I.lettuce, I.tomato] },
  { id: 'pasta', emoji: '🍝', name: l('Domates soslu makarna', 'Tomato pasta'), mins: 20, meals: ['lunch', 'dinner'], items: [I.pasta, I.paste, I.garlic, I.cheese] },
  { id: 'mushroompasta', emoji: '🍄', name: l('Mantarlı makarna', 'Mushroom pasta'), mins: 20, meals: ['lunch', 'dinner'], items: [I.pasta, I.mushroom, I.garlic, I.cheese] },
  { id: 'wrap', emoji: '🌯', name: l('Tavuklu dürüm', 'Chicken wrap'), mins: 20, meals: ['lunch', 'dinner'], items: [I.chicken, I.tortilla, I.lettuce, I.yogurt] },
  { id: 'quesadilla', emoji: '🌮', name: l('Peynirli quesadilla', 'Cheese quesadilla'), mins: 10, meals: ['lunch', 'dinner', 'snack'], items: [I.tortilla, I.cheese, I.pepper] },
  { id: 'pitapizza', emoji: '🍕', name: l('Lavaş pizza', 'Flatbread pizza'), mins: 15, meals: ['lunch', 'dinner'], items: [I.tortilla, I.paste, I.cheese, I.mushroom] },
  { id: 'lentilsoup', emoji: '🍲', name: l('Mercimek çorbası', 'Lentil soup'), mins: 25, meals: ['lunch', 'dinner'], items: [I.lentil, I.onion, I.carrot, I.potato, I.lemon] },
  { id: 'veggiesoup', emoji: '🥣', name: l('Sebze çorbası', 'Vegetable soup'), mins: 30, meals: ['lunch', 'dinner'], items: [I.carrot, I.potato, I.zucchini, I.onion] },
  { id: 'ricechicken', emoji: '🍗', name: l('Tavuklu pilav', 'Chicken and rice'), mins: 30, meals: ['lunch', 'dinner'], items: [I.chicken, I.rice, I.onion] },
  { id: 'eggrice', emoji: '🍚', name: l('Yumurtalı pilav', 'Egg fried rice'), mins: 15, meals: ['lunch', 'dinner'], items: [I.rice, I.egg, I.corn] },
  { id: 'bulgur', emoji: '🍚', name: l('Domatesli bulgur pilavı', 'Tomato bulgur pilaf'), mins: 20, meals: ['lunch', 'dinner'], items: [I.bulgur, I.paste, I.onion, I.pepper] },
  { id: 'stirfry', emoji: '🥦', name: l('Tavuklu sebze sote', 'Chicken veggie stir-fry'), mins: 20, meals: ['lunch', 'dinner'], items: [I.chicken, I.broccoli, I.carrot, I.pepper] },
  { id: 'veggiesaute', emoji: '🥘', name: l('Sebze sote', 'Sautéed vegetables'), mins: 20, meals: ['lunch', 'dinner'], items: [I.zucchini, I.pepper, I.onion, I.tomato] },
  { id: 'eggplantmince', emoji: '🍆', name: l('Patlıcanlı kıyma sote', 'Eggplant and ground meat sauté'), mins: 30, meals: ['dinner'], items: [I.eggplant, I.mince, I.paste, I.onion] },
  { id: 'meatballs', emoji: '🧆', name: l('Tavada köfte ve salata', 'Pan-fried meatballs and salad'), mins: 30, meals: ['dinner'], items: [I.mince, I.onion, I.lettuce, I.tomato] },
  { id: 'bakedchicken', emoji: '🍗', name: l('Fırında tavuk ve sebze', 'Oven chicken and vegetables'), mins: 35, meals: ['dinner'], items: [I.chicken, I.potato, I.carrot, I.onion] },
  { id: 'potatobake', emoji: '🥔', name: l('Fırında peynirli patates', 'Cheesy baked potatoes'), mins: 35, meals: ['dinner'], items: [I.potato, I.cheese, I.garlic] },
  { id: 'fritters', emoji: '🥒', name: l('Kabak mücver', 'Zucchini fritters'), mins: 25, meals: ['lunch', 'dinner'], items: [I.zucchini, I.egg, I.flour, I.parsley, I.cheese] },
  { id: 'applenuts', emoji: '🍎', name: l('Elma ve ceviz', 'Apple and walnuts'), mins: 2, meals: ['snack'], items: [I.apple, I.nuts] },
  { id: 'carrotdip', emoji: '🥕', name: l('Havuç çubukları ve yoğurt sosu', 'Carrot sticks with yogurt dip'), mins: 5, meals: ['snack'], items: [I.carrot, I.yogurt, I.garlic] },
  { id: 'cucumberolive', emoji: '🥒', name: l('Peynir, salatalık ve zeytin tabağı', 'Cheese, cucumber and olive plate'), mins: 5, meals: ['breakfast', 'snack'], items: [I.cheese, I.cucumber, I.olive, I.bread] },
];

export const IDEA_BY_ID: Record<string, MealIdea> = Object.fromEntries(MEAL_IDEAS.map((m) => [m.id, m]));
