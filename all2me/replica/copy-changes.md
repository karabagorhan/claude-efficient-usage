# Metin değişiklikleri (temiz-oda turu)

Tarih: 2026-11-11. Kaynak: `replica/brand-sweep.md` §3 + referans görüntülerle (s01–s17) satır satır karşılaştırma. Referansla birebir/çok yakın EN metinler ve onların TR çevirileri All2Me'nin kendi sesiyle yeniden yazıldı (kısa, sıcak, maskot Puf'un "birlikte" tonu). Genel sözcükler (Timer, Sleep, Water, Mood, Workout, Reflection, Continue, All…) ve SPEC'teki dört metrik adı (Öz-denetim / Konsantrasyon / Üretkenlik / Enerji) bilinçli olarak korundu.

**Toplam: 95 metin** (TR ve EN ayrı sayıldı; veri dosyalarında bir satır = bir TR+EN çifti). Ayrıca 3 yorum/README anması güncellendi. TR/EN anahtar eşitliği ve `src/i18n/plurals.ts` (EN tekil) denetimi: 0 hata.

| # | dosya | anahtar / yer | eski | yeni | neden |
|---|---|---|---|---|---|
| 1 | `locales/tools.ts` | tools.title (tr) | `'Kendine Bakım Araçları'` | `'Araç Kutun'` | s05 başlığının çevirisi |
| 2 | `locales/tools.ts` | tools.title (en) | `'Self-Care Tools'` | `'Your Toolbox'` | s05 başlık birebir |
| 3 | `locales/tools.ts` | tools.banner.love (tr) | `'Kendimi Sevmenin 100 Yolu'` | `'Kendine 100 İyilik'` | s05 afişin çevirisi |
| 4 | `locales/tools.ts` | tools.banner.love (en) | `'100 Ways to Love Myself'` | `'100 Small Kindnesses'` | s05 afiş birebir |
| 5 | `locales/tools.ts` | tools.mood.title (tr) | `'Nasıl hissediyorsun?'` | `'Bugünün modu?'` | s05 ruh hali kartı çevirisi |
| 6 | `locales/tools.ts` | tools.mood.sub (tr) | `'Kaydetmek için dokun'` | `'Bir yüz seç'` | s05 çevirisi |
| 7 | `locales/tools.ts` | tools.mood.title (en) | `'How do you feel?'` | `'Today’s vibe?'` | s05 birebir |
| 8 | `locales/tools.ts` | tools.mood.sub (en) | `'Tap to record'` | `'Pick a face'` | s05 birebir |
| 9 | `locales/tools.ts` | tools.drink.title (tr) | `'Su içme zamanı!'` | `'Bir yudum mola'` | s05 su kartı çevirisi |
| 10 | `locales/tools.ts` | tools.drink.sub (tr) | `'Su takibi ve günlük hatırlatıcılar'` | `'Bardakları say, hedefe yaklaş'` | s05 çevirisi |
| 11 | `locales/tools.ts` | tools.drink.title (en) | `'Time to drink water!'` | `'Sip break'` | s05 birebir |
| 12 | `locales/tools.ts` | tools.drink.sub (en) | `'Hydration tracker & daily reminders'` | `'Count the glasses, near the goal'` | s05 birebir |
| 13 | `locales/love.ts` | love.title (tr) | `'Kendimi Sevmenin 100 Yolu'` | `'Kendine 100 İyilik'` | s05 afişin çevirisi |
| 14 | `locales/love.ts` | love.title (en) | `'100 Ways to Love Myself'` | `'100 Small Kindnesses'` | s05 afiş birebir |
| 15 | `locales/love.ts` | love.doneMark (tr) | `'Yaptım ✓'` | `'Bugün yapıldı ✓'` | BUG-010: düğme değil, durum etiketi |
| 16 | `locales/love.ts` | love.doneMark (en) | `'Done ✓'` | `'Done today ✓'` | BUG-010: durum etiketi |
| 17 | `locales/drink.ts` | drink.reminder.notifTitle (tr) | `'Su içme zamanı!'` | `'Bir yudum mola 💧'` | s05 çevirisi |
| 18 | `locales/drink.ts` | drink.reminder.notifTitle (en) | `'Time to drink water!'` | `'Sip break 💧'` | s05 birebir |
| 19 | `locales/routine.ts` | routine.action.title (tr) | `'Harekete geçme zamanı!'` | `'Sıra sende!'` | s04 çevirisi |
| 20 | `locales/routine.ts` | routine.action.title (en) | `'Time to take action!'` | `'Your move!'` | s04 birebir |
| 21 | `locales/common.ts` | common.btn.done (tr) | `'Tamamlandı'` | `'Yaptım!'` | s04 "Mark as Done" çevirisi |
| 22 | `locales/common.ts` | common.btn.later (tr) | `'Sonra yap'` | `'Şimdi değil'` | s04 "Do It Later" çevirisi |
| 23 | `locales/common.ts` | common.btn.done (en) | `'Mark as done'` | `'I did it!'` | s04 birebir |
| 24 | `locales/common.ts` | common.btn.later (en) | `'Do it later'` | `'Not now'` | s04 birebir |
| 25 | `locales/wheel.ts` | wheel.title.chores (tr) | `'Eğlenceli Ev İşi Çarkı'` | `'Ev İşi Ruleti'` | s09 çevirisi |
| 26 | `locales/wheel.ts` | wheel.title.selfcare (tr) | `'Kendine Bakım Çarkı'` | `'Bakım Ruleti'` | aynı kalıp |
| 27 | `locales/wheel.ts` | wheel.title.move (tr) | `'Hareket Çarkı',` | `'Hareket Ruleti',` | aynı kalıp |
| 28 | `locales/wheel.ts` | wheel.spin (tr) | `'Hadi çevir'` | `'Çevir bakalım'` | s12 "Let's Spin" çevirisi |
| 29 | `locales/wheel.ts` | wheel.title.chores (en) | `'Fun Chore Wheel'` | `'Chore Roulette'` | s09 birebir |
| 30 | `locales/wheel.ts` | wheel.title.selfcare (en) | `'Self-Care Wheel'` | `'Pamper Roulette'` | aynı kalıp |
| 31 | `locales/wheel.ts` | wheel.title.move (en) | `'Move Wheel'` | `'Move Roulette'` | aynı kalıp |
| 32 | `locales/wheel.ts` | wheel.spin (en) | `"Let's Spin"` | `'Give it a whirl'` | s12 birebir |
| 33 | `locales/newtask.ts` | newtask.rename (tr) | `'Yeniden adlandırmak için dokun'` | `'Adını koymak için dokun'` | s10 çevirisi |
| 34 | `locales/newtask.ts` | newtask.rename (en) | `'Tap to rename'` | `'Tap here to name it'` | s10 birebir |
| 35 | `locales/newtask.ts` | newtask.planner.title (tr) | `'Gününü akıllı planla'` | `'Bugüne hazır bir plan al'` | s10 "Plan your day with AI" yakını |
| 36 | `locales/newtask.ts` | newtask.planner.title (en) | `'Plan your day smartly'` | `'Get a ready-made plan for today'` | s10 yakın |
| 37 | `locales/newtask.ts` | newtask.luckyCard (tr) | `{ overline: 'Küçük bir kendine bakım sürprizi', title: 'Şanslı görevini çevir' }` | `{ overline: 'Şansa bırak, kendini şımart', title: 'Şans kartını çek' }` | s10 çevirisi |
| 38 | `locales/newtask.ts` | newtask.luckyCard (en) | `{ overline: 'A fun little self-care surprise', title: 'Spin your lucky task' }` | `{ overline: 'Let chance pick a treat', title: 'Draw a lucky card' }` | s10 birebir |
| 39 | `locales/newtask.ts` | newtask.lucky.title (tr) | `'Şanslı görevini çevir',` | `'Şans kartını çek',` | s10 çevirisi |
| 40 | `locales/newtask.ts` | newtask.lucky.title (en) | `'Spin your lucky task',` | `'Draw a lucky card',` | s10 birebir |
| 41 | `locales/newtask.ts` | newtask.lucky.subtitle (tr) | `'Kendine küçük bir bakım molası ver'` | `'Desteden bir kart, sana küçük bir mola'` | "self-care" kalıbı |
| 42 | `locales/newtask.ts` | newtask.lucky.subtitle (en) | `'Give yourself a little self-care break'` | `'One card from the deck, one small break for you'` | "self-care" kalıbı |
| 43 | `locales/task.ts` | task.link.mood (en) | `'Mood check-in'` | `'Log my mood'` | s10 "Mood Check-In" birebir |
| 44 | `locales/task.ts` | task.link.mood (tr) | `'Ruh hali kaydı'` | `'Ruh halimi yaz'` | EN ile uyum |
| 45 | `locales/streak.ts` | streak.unit (tr) | `'günlük seri'` | `'gün üst üste'` | s16 "day streak" çevirisi |
| 46 | `locales/streak.ts` | streak.unit (en) | `'day streak'` | `'days in a row'` | s16 birebir (tekil: plurals.ts) |
| 47 | `locales/streak.ts` | streak.banner.great (tr) | `'İstikrar işe yarıyor. Parlamaya devam.'` | `'Gün gün birikiyor. Bu ateşi koru!'` | s16 afiş çevirisi |
| 48 | `locales/streak.ts` | streak.banner.great (en) | `'Consistency pays off. Keep shining.'` | `'Day by day, it adds up. Guard that flame!'` | s16 afiş birebir |
| 49 | `locales/streak.ts` | streak.calendar (tr) | `'Seri Takvimi'` | `'Alev Takvimi'` | s16 çevirisi |
| 50 | `locales/streak.ts` | streak.calendar (en) | `'Streak Calendar'` | `'Flame Calendar'` | s16 birebir |
| 51 | `locales/onboarding.ts` | onboarding.yes (tr) | `'Evet, hadi!'` | `'Evet, varım!'` | s02 "Sure! Let's go!" çevirisi |
| 52 | `locales/onboarding.ts` | onboarding.yes (en) | `'Sure! Let’s go!'` | `'Yes, I’m in!'` | s02/s03 birebir |
| 53 | `locales/onboarding.ts` | onboarding.no (tr) | `'Hayır',` | `'Şimdilik değil',` | buton çifti |
| 54 | `locales/onboarding.ts` | onboarding.no (en) | `'No',` | `'Not really',` | s02 birebir |
| 55 | `locales/onboarding.ts` | onboarding.q.organize (tr) | `'Gününü düzene sokmak ister misin?'` | `'Günlerin biraz daha planlı aksın mı?'` | s02 çevirisi |
| 56 | `locales/onboarding.ts` | onboarding.q.habits (tr) | `'İyi alışkanlıklar kazanmak ister misin?'` | `'Birkaç güzel alışkanlık edinelim mi?'` | s03 çevirisi |
| 57 | `locales/onboarding.ts` | onboarding.q.sleep (tr) | `'Daha iyi uyumak ister misin?'` | `'Sabahları daha dinç uyanmak ister misin?'` | aynı soru kalıbı |
| 58 | `locales/onboarding.ts` | onboarding.q.focus (tr) | `'Daha odaklı olmak ister misin?'` | `'Dikkatin daha az dağılsın mı?'` | aynı soru kalıbı |
| 59 | `locales/onboarding.ts` | onboarding.q.organize (en) | `'Do you want to organize your day?'` | `'Want your days to run on a plan?'` | s02 birebir |
| 60 | `locales/onboarding.ts` | onboarding.q.habits (en) | `'Do you want to build good habits?'` | `'Shall we grow a few good habits?'` | s03 birebir |
| 61 | `locales/onboarding.ts` | onboarding.q.sleep (en) | `'Do you want to sleep better?'` | `'Want to wake up more rested?'` | aynı soru kalıbı |
| 62 | `locales/onboarding.ts` | onboarding.q.focus (en) | `'Do you want to be more focused?'` | `'Want fewer distractions in your day?'` | aynı soru kalıbı |
| 63 | `locales/onboarding.ts` | onboarding.result.title (tr) | `'Kendimizi tanıdıkça en iyi hâlimize yaklaşırız'` | `'İşte başlangıç fotoğrafın'` | s01 açımlaması |
| 64 | `locales/onboarding.ts` | onboarding.result.title (en) | `'The better we know ourselves, the closer we get to our best'` | `'Your starting snapshot'` | s01 açımlaması; 4 satır sorunu |
| 65 | `locales/onboarding.ts` | onboarding.result.level (tr) | `{ low: 'Geliştirilebilir', mid: 'İyi', high: 'Harika' }` | `{ low: 'Gelişmeye açık', mid: 'Yolunda', high: 'Parlıyor' }` | s01 "Could be better" çevirisi |
| 66 | `locales/onboarding.ts` | onboarding.result.level (en) | `{ low: 'Could be better', mid: 'Good', high: 'Great' }` | `{ low: 'Room to grow', mid: 'On track', high: 'Shining' }` | s01 birebir |
| 67 | `locales/onboarding.ts` | onboarding.done.title (tr) | `'Çok iyi bir başlangıç!'` | `'Hazırız, birlikte büyüyelim!'` | s08 çevirisi |
| 68 | `locales/onboarding.ts` | onboarding.done.hint (tr) | `'Harika iş çıkardın. Rutinin seni bekliyor.'` | `'Rutinin hazır; ilk adım senden.'` | s08 "Well done" çevirisi |
| 69 | `locales/onboarding.ts` | onboarding.done.title (en) | `'A very good start!'` | `'All set, let’s grow together!'` | s08 yakın |
| 70 | `locales/onboarding.ts` | onboarding.done.hint (en) | `'Well done. Your routine is waiting.'` | `'Your routine is ready. The first step is yours.'` | s08 yakın |
| 71 | `src/data/reflections.ts` | reflection topic overeating | `['Aşırı yeme isteği geldiğinde', 'When you want to overeat'], ['Davranışın arkasındaki ihtiyaç', 'The need behind the behavior']` | `['Yemek teselliye dönünce', 'When food turns into comfort'], ['İsteğin asıl ne söylediği', 'What the craving is really asking for']` | s05 yansıma konusu birebir |
| 72 | `src/data/inspire/categories.ts` | category cleaning | `l('Temizlik Planları', 'Cleaning Plans')` | `l('Pırıl Pırıl Ev', 'Sparkling Home')` | s07 birebir |
| 73 | `src/data/inspire/categories.ts` | category selfcare | `l('Kendime Bakım', 'Take Care of Myself')` | `l('Kendini Şımart', 'Pamper Yourself')` | s07 birebir |
| 74 | `src/data/inspire/categories.ts` | category morning | `l('Sabah Rutinleri', 'Morning Routines')` | `l('Güne Merhaba', 'Hello, Morning')` | s07 birebir |
| 75 | `src/data/inspire/categories.ts` | category work | `l('İş ve Ders', 'Work & Study')` | `l('Masa Başı', 'At the Desk')` | s07 birebir |
| 76 | `src/data/inspire/categories.ts` | section popularCleaning | `l('Popüler temizlik şablonları', 'Popular cleaning templates')` | `l('Ev için favoriler', 'Home favorites')` | s07 birebir + EN kesilme |
| 77 | `src/data/inspire/categories.ts` | section organized | `l('Düzenli ol', 'To be organized')` | `l('Kolay düzen', 'Order made easy')` | s07 birebir |
| 78 | `src/data/inspire/categories.ts` | section work101 | `l('İş ve Ders 101', 'Work & Study 101')` | `l('İş günü takviyesi', 'Workday boosters')` | s13 birebir |
| 79 | `src/data/inspire/categories.ts` | section backToSchool | `l('Okula dönüş', 'Back to school')` | `l('Okul modu açık', 'School mode on')` | s13 birebir |
| 80 | `src/data/inspire/categories.ts` | section fit | `l('Fit ve harika', 'Fit & fabulous')` | `l('Hadi hareket', 'Get moving')` | s14 birebir |
| 81 | `src/data/inspire/categories.ts` | section endOfDay | `l('Günün sonunda', 'At the end of the day')` | `l('Gün biterken', 'Winding down')` | s17 birebir |
| 82 | `src/data/inspire/categories.ts` | section tips | `l('Kaçırılmayacak ipuçları', 'Tips you cannot miss')` | `l('Hayatı kolaylaştıranlar', 'Little life-savers')` | s15 açımlaması |
| 83 | `src/data/inspire/categories.ts` | section beautyHello | `l('Merhaba güzellik', 'Hello, beauty')` | `l('Işıltı köşesi', 'Glow corner')` | s15 birebir |
| 84 | `src/data/inspire/templates-home.ts` | template clean-home-basics | `l('Evi Temiz Tut', 'Keep a Clean Home')` | `l('Temiz Ev Temelleri', 'Tidy Home Basics')` | s07 "How to keep a clean home" |
| 85 | `src/data/suggestions.ts` | suggestion open-windows | `'Pencereleri aç', 'Open the windows'` | `'Odayı havalandır', 'Let fresh air in'` | s11 öneri listesi birebir |
| 86 | `src/data/suggestions.ts` | suggestion trim-nails | `'Tırnak kes', 'Trim nails'` | `'Tırnak bakımı', 'Nail care'` | s10 birebir |
| 87 | `src/data/suggestions.ts` | suggestion brush-hair | `'Saç tara', 'Brush hair'` | `'Saçını tara', 'Comb your hair'` | s11 birebir |
| 88 | `src/data/suggestions.ts` | suggestion tidy-desk | `'Masayı topla', 'Declutter desk'` | `'Masanı ferahlat', 'Clear the desk'` | s11 birebir |
| 89 | `src/data/suggestions.ts` | suggestion budget | `'Bütçemi kaydet', 'Record my budget'` | `'Günün harcamalarını yaz', 'Log today’s spending'` | s11 birebir |
| 90 | `src/data/suggestions.ts` | suggestion vitamins | `'İlaç / vitamin al', 'Take pills / vitamins'` | `'Vitamin / ilaç zamanı', 'Vitamins / meds time'` | s11 birebir |
| 91 | `src/data/wheels.ts` | wheel slice c5 | `'Lavabo temizle', 'Clean Sink'` | `'Lavaboyu parlat', 'Shine the Sink'` | s09 dilimi birebir |
| 92 | `src/data/wheels.ts` | wheel slice c9 | `'Ayakkabı diz', 'Arrange Shoes'` | `'Ayakkabıları sırala', 'Line Up Shoes'` | s09 dilimi birebir |
| 93 | `src/data/wheels.ts` | wheel slice c8 | `'Bulaşık makinesini boşalt', 'Empty Dishwasher'` | `'Makineyi boşalt', 'Unload Dishes'` | s09 "Empty Trash" kalıbı + kesilme |
| 94 | `src/data/quotes.ts` | quote consistency | `Q('Tutarlılık, yoğunluktan daha çok yol aldırır.', 'Consistency takes you farther than intensity.')` | `Q('Her gün biraz, bir günde çoktan iyidir.', 'A little every day beats a lot in one day.')` | s16 "Consistency pays off" ile aynı fikir/sözcük |
| 95 | `src/data/inspire/templates-body.ts` | şablon kalemi | `'Tırnakları kes', 'Trim nails'` | `'Tırnak bakımı', 'Nail care'` | #86 ile tutarlı (düzeltme turu sonu) |

## Yeni anahtarlar / davranışa bağlı metin değişiklikleri

| dosya | anahtar | TR | EN | neden |
|---|---|---|---|---|
| `locales/reflection.ts` | `reflection.deleteAsk` | Bu yansıma silinsin mi? Geri alınamaz. | Delete this reflection? This can’t be undone. | BUG-005 onaylı silme |
| `locales/reflection.ts` | `reflection.deleteYes` | Evet, sil | Yes, delete | BUG-005 |
| `locales/common.ts` | `common.a11y.increase / decrease` | Artır / Azalt | Increase / Decrease | BUG-009 Stepper ± düğme adları |
| `i18n/plurals.ts` | `streak.unit` (EN tekil) | — | day in a row | "days in a row" 1 için tekil (`app/streak.tsx` artık `{ n }` geçirir) |
| `locales/love.ts` | `love.undo` (mevcut, artık kullanılıyor) | İşareti kaldır | Remove mark | BUG-010: geri alma ayrı, görünür düğme |

## Dokümanlar

`docs/SPEC.md` (§3.1, 3.3, 3.4, 3.6, 3.7, 3.8, 3.10 metin örnekleri) ve `docs/CONTRACTS.md` (hazır buton metinleri, i18n örneği) yeni metinlerle güncellendi; SPEC §2'ye renklerin temaya taşındığı notu eklendi.

## Testlere yansıyan sabit metinler

Testler sözlükten okuduğu için çoğu kendiliğinden uydu. Veri dosyasından gelen sabit adlar elle güncellendi: `e2e/inspire.test.mjs` ("Evi Temiz Tut" → "Temiz Ev Temelleri", "Temizlik" → "Pırıl Pırıl Ev"), `e2e/tasks.test.mjs` ("Tırnak kes" → "Tırnak bakımı").

