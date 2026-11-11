# Me+ (Me+ Lifestyle Routine / Daily Routine Planner, Enerjoy) — replica-entrepreneur raporu

Tarih: 2026-11-11 · Yöntem: `replica-entrepreneur` (SKILL.md, themes.json, reviews.py) · Uygulama koduna dokunulmadı.

## 0. Örneklem ve sınırlar (önce bunu oku)

- **Veri:** `replica/reviews.csv` = **1.494 yorum**; kaynak platform **1** (Apple App Store): 10 mağaza bölgesinin (us, gb, ca, au, in, ie, nz, za, sg, ph) resmi müşteri-yorumu RSS beslemesi (1.486 satır, 2022-08 → 2026-11-07) + App Store ürün sayfasında görünen 8 yorum (8 satır). Her satırın URL'si, o yorumun alındığı gerçek besleme sayfası (ya da ürün sayfası) adresidir; `review_id` sütunu yorumun Apple kimliğidir. **Besleme sayfaları 'en yeni' sırasındadır; yeni yorum geldikçe sayfa içeriği kayar** — bu yüzden ham JSON'lar da saklandı (scratchpad/entre/*.json).
- **Seçim:** Çekilen 2.627 benzersiz yorumdan İngilizce olan tüm 1-3 yıldızlılar + 4-5 yıldızlılardan metni ≥90 karakter ve içerik anahtar sözcüğü taşıyanlar alındı. Yani **düşük puanlar fazla temsil edilir**; mağaza genelindeki ortalama 4,80 (248.857 puan, Apple arama API'si) ile örneklem aynı şey değildir. Yüzdeler 'örneklemin yüzdesi'dir, kullanıcıların yüzdesi değil.
- **Kaynak sayısı hedefi (≥3) TUTMADI.** Bu oturumun ağ izin listesi yalnız `itunes.apple.com` ve `apps.apple.com` adreslerine erişime izin veriyor. Google Play, Reddit, Trustpilot, JustUseApp, Hacker News/Algolia, Product Hunt, appfollow, appgoblin, apppricinglab, screensdesign, web.archive.org denendi: **engelli** (DNS çözülmüyor ya da proxy 403). Arama özetlerindeki metinler alıntı olarak KULLANILMADI. Bu yüzden 'kaynak çeşitliliği' sütunu burada yalnızca besleme/ürün sayfası ayrımını gösterir; **gerçek çok-platform doğrulaması yok**. Aşağıdaki hiçbir tema 'iki bağımsız platformda görüldü' diye sunulamaz.
- **Tema sayıları anahtar-sözcük eşleşmesidir** (reviews.py + `themes_meplus.json`, bu depoya değil scratchpad'e yazıldı), elle sınıflandırma değildir; bir yorum birden çok temaya girer ve olumlu yorumlar da eşleşebilir. Sayıları yön göstergesi olarak oku. Alıntılar CSV'deki metnin birebir parçasıdır (üretim betiği her alıntıyı CSV'ye karşı doğruladı). Başlık ile gövde ' — ' ile birleştirilmiştir.
- Yorumcular All2Me için referans değil araştırma verisidir; yorumları açılış sayfasına koyma.

## 1. Şikâyet temaları (en çok → az)

reviews.py çıktısı (Me+'a uyarlanmış tema listesiyle). Sayı = eşleşen yorum, 'ince' = 3'ten az yorum ya da tek kaynak.

1494 reviews from 2 sources (app-store-listing, app-store-rss). 1494 had star ratings.

## What they hate

| rank | theme | score | reviews | share | avg stars | sources |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Too expensive / should be free | 153.5 | 350 | 23% | 3.1 | 2 |
| 2 | Free trial / charged immediately / cancel and refund trouble | 117.3 | 196 | 13% | 1.6 | 2 |
| 3 | Core features locked behind VIP (adding tasks, limit on tasks/goals, templates) | 83.3 | 134 | 9% | 2.5 | 2 |
| 4 | Reminders / alarms unreliable or too spammy | 30.2 | 77 | 5% | 3.1 | 2 |
| 5 | Misleading ads / not what was advertised | 29.1 | 47 | 3% | 1.5 | 2 |
| 6 | An update made it worse (paywalled what used to be free) (thin) | 25.0 | 38 | 2% | 2.3 | 1 |
| 7 | Bugs, crashes, won't load, sound/sync broken | 22.9 | 40 | 3% | 2.3 | 2 |
| 8 | Tasks out of order; can't edit, delete, reorder or complete ahead | 15.6 | 42 | 3% | 3.0 | 2 |
| 9 | Long onboarding questions + sales pitch before use | 14.6 | 28 | 2% | 1.8 | 2 |
| 10 | Kids / teens locked out (age, price, can't afford) | 12.5 | 37 | 2% | 3.6 | 2 |
| 11 | No reply from support / refund ignored | 6.5 | 11 | 1% | 1.4 | 2 |
| 12 | ADHD / diagnosis-style quiz felt misleading | 0.9 | 3 | 0% | 3.3 | 2 |

**Too expensive / should be free**
- "Have to pay!" (app-store-rss, 1*) https://itunes.apple.com/in/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json
- "$30 down the drain." (app-store-rss, 1*) https://itunes.apple.com/us/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json
- "Expensive task list." (app-store-rss, 1*) https://itunes.apple.com/ca/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json

**Free trial / charged immediately / cancel and refund trouble**
- "Scam — Not w" (app-store-rss, 1*) https://itunes.apple.com/ca/rss/customerreviews/page=5/id=1596403446/sortBy=mostRecent/json
- "What a scam!" (app-store-rss, 1*) https://itunes.apple.com/ca/rss/customerreviews/page=9/id=1596403446/sortBy=mostRecent/json
- "Confusing scam." (app-store-rss, 1*) https://itunes.apple.com/nz/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json

**Core features locked behind VIP (adding tasks, limit on tasks/goals, templates)**
- "Making us get VIP is not an excuse to make us do more!" (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json
- "You have to pay to use the app — There’s no free version." (app-store-rss, 1*) https://itunes.apple.com/ca/rss/customerreviews/page=9/id=1596403446/sortBy=mostRecent/json
- "Have to pay to use — There is no free trail or basic plan." (app-store-rss, 1*) https://itunes.apple.com/us/rss/customerreviews/page=9/id=1596403446/sortBy=mostRecent/json

**Reminders / alarms unreliable or too spammy**
- "This app spammed me with an alarm." (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=8/id=1596403446/sortBy=mostRecent/json
- "And they harass you with notifications." (app-store-rss, 1*) https://itunes.apple.com/us/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json
- "I mean it doesn’t give me notifications." (app-store-rss, 1*) https://itunes.apple.com/gb/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json

**Misleading ads / not what was advertised**
- "It’s a Trap!" (app-store-rss, 1*) https://itunes.apple.com/ph/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json
- "Misleading App" (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json
- "Refund policy is a lie." (app-store-listing, 1*) https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446

**An update made it worse (paywalled what used to be free)**
- "USED TO BE MY FAVE APP!!" (app-store-rss, 1*) https://itunes.apple.com/ph/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json
- "Money — I used to love this app a couple of years ago." (app-store-rss, 1*) https://itunes.apple.com/ca/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json
- "There are no Reminder Notifications After Recent Update." (app-store-rss, 1*) https://itunes.apple.com/in/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json

## What they ask for

| rank | theme | score | reviews | share | avg stars | sources |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Request: flexible scheduling (custom repeat, start date, own tasks, own order) | 49.0 | 108 | 7% | 3.0 | 2 |
| 2 | Request: calendar integration / sync / iPad / multi-device | 15.5 | 45 | 3% | 3.6 | 2 |

**Request: flexible scheduling (custom repeat, start date, own tasks, own order)**
- "Every month" (app-store-rss, 1*) https://itunes.apple.com/ca/rss/customerreviews/page=7/id=1596403446/sortBy=mostRecent/json
- "-personalise/customise my tasks" (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json
- "This works for every other app." (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=7/id=1596403446/sortBy=mostRecent/json

**Request: calendar integration / sync / iPad / multi-device**
- "My iPad cannot see the full screen — It just shows half a screen" (app-store-rss, 1*) https://itunes.apple.com/sg/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json
- "It’s not too different from using Outlook or some other basic reminder or calendar app." (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json
- "DONT BUY THIS — I DO NOT WANT TO PAY MONEY FOR THIS AS ID RATHER WATCH PAINT DRY THAN BUY YOUR STUPID MEMBERSHIP" (app-store-rss, 1*) https://itunes.apple.com/ca/rss/customerreviews/page=7/id=1596403446/sortBy=mostRecent/json

### 1.1 Elle seçilmiş bağlantılı alıntılar (tema başına)

**1. Çok pahalı / ücretsiz olmalı (350 yorum, %23, ort. 3,1★)**

- “why do I have to pay for unlimited tasks. Before it was perfectly fine I didn’t have to pay for unlimited tasks but now I do??” — 4★, CA, 2025-12-24, [app-store-rss #13551002993](https://itunes.apple.com/ca/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)
- “I selected a template according to what I saw in the ad for routine tracker and customized the same investing 30-45mins of my time” — 1★, IN, 2024-02-03, [app-store-rss #10897430924](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json)

**2. Ücretsiz deneme / hemen tahsilat / iptal-iade sorunu (196 yorum, %13, ort. 1,6★ — en öfkeli tema)**

- “Free 7-day trial is a lie — Why charging immediately? I haven't tried seven days yet.” — 1★, AU, 2024-05-08, [app-store-rss #11244863788](https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json)
- “I’ve asked for a refund and it got declined.” — 1★, AU, 2025-06-17, [app-store-rss #12784287304](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)
- “said 7 day free trail then proceeded to take $45.99 out my account straight away” — 1★, AU, 2024-05-05, [app-store-rss #11235083153](https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json)

**3. Temel özellikler VIP'e kilitli: 4-7 görev/alışkanlıktan sonra duvar, şablon, ekleme düğmesi (134 yorum, %9; açıkça 'görev sınırı' diyen 31, 8 mağazada)**

- “i can’t make 5 simple tasks without VIP popping up” — 4★, GB, 2026-01-17, [app-store-rss #13643425287](https://itunes.apple.com/gb/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)
- “you can’t have more than around 4 habits before you pay” — 4★, AU, 2026-03-23, [app-store-rss #13877919125](https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json)
- “I had only a few like around 7 maybe before I had to buy VIP to get more” — 4★, AU, 2025-09-22, [app-store-rss #13171063884](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)

**4. Hatırlatıcı / alarm güvenilmez ya da bunaltıcı (77 yorum; olumlu yorumlar da eşleşir, ort. 3,1★)**

- “when I set an alarm it only went off for the first couple of days and it just stops!” — 4★, AU, 2024-08-11, [app-store-rss #11598951313](https://itunes.apple.com/au/rss/customerreviews/page=8/id=1596403446/sortBy=mostRecent/json)
- “There are no Reminder Notifications After Recent Update.” — 1★, IN, 2024-08-11, [app-store-rss #11597164993](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json)
- “it has so many annoying pop ups with the alarm to do list check ins which aren’t helpful and make me not want to use it” — 2★, AU, 2026-05-14, [app-store-rss #14063329083](https://itunes.apple.com/au/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json)

**5. Reklamdaki gibi değil / yanıltıcı (47 yorum, ort. 1,5★)**

- “I selected a template according to what I saw in the ad for routine tracker and customized the same investing 30-45mins of my time” — 1★, IN, 2024-02-03, [app-store-rss #10897430924](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json)

**6. Güncelleme sonrası kötüleşti: eskiden ücretsiz olan kilitlendi (38 yorum, ince)**

- “I used to have this app in 2024 and I loved it, unlimited tasks and helped me keep a routine.” — 4★, GB, 2026-01-17, [app-store-rss #13643425287](https://itunes.apple.com/gb/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)
- “I just wish it allowed us to have unlimited habit tracking as it used to, for free” — 5★, IN, 2026-03-09, [app-store-rss #13830132278](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json)

**7. Hata, açılmıyor, yükleme (40 yorum)**

- “The app doesn't open, doesn't load anything, doesn't work.” — 1★, AU, 2025-11-11, [app-store-rss #13384562646](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)
- “Since the latest update no sound works anymore.” — 1★, NZ, 2023-04-12, [app-store-rss #9813283699](https://itunes.apple.com/nz/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)

**8. Görev sırası karışık; düzenleme/silme/öne alma yok (42 yorum)**

- “it’s not in the order you entered them” — 1★, US, 2025-11-18, [app-store-listing #13412807865](https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446)
- “HOW DO YOU DELETE TASKS HELP MEEEEEE” — 4★, AU, 2024-12-16, [app-store-rss #12071666198](https://itunes.apple.com/au/rss/customerreviews/page=6/id=1596403446/sortBy=mostRecent/json)
- “it still won’t let you COMPLETE items ahead of time” — 4★, US, 2024-08-11, [app-store-listing #11596132782](https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446)

**9. Uzun kurulum soruları + satış baskısı, uygulamayı görmeden ödeme (28 yorum, ort. 1,8★)**

- “I just went through a whole quiz/test thing, answering things, being excited to try my new app, BUT I HAVE TO PAY!?!?” — 2★, AU, 2025-05-12, [app-store-rss #12650415150](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)

**10. Çocuk/genç kullanıcı ödeyemiyor (37 yorum, ort. 3,6★; çoğu 'seviyorum ama ödeyemem')**

- “as a minor with no job, I obviously can’t pay that” — 4★, AU, 2026-03-23, [app-store-rss #13877919125](https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json)

**11. Ruh sağlığı testi teşhis gibi davranıyor, terapi reklamı/promosyon kodu (ince; elle bulundu, 3-4 yorum)**

- “it told me I had sever Depression and the gave me a promo code for better help. That’s not helping someone, that’s using someone” — 2★, AU, 2026-03-31, [app-store-rss #13906698702](https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json)
- “They constantly bombard you with ads for betterhelp therapy that they’ve partnered with.” — 1★, AU, 2024-06-20, [app-store-rss #11402732029](https://itunes.apple.com/au/rss/customerreviews/page=9/id=1596403446/sortBy=mostRecent/json)
- “None of this is evidence based and it’s all extremely misleading.” — 1★, AU, 2024-04-17, [app-store-rss #11171420400](https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json)

**12. Destek yanıt vermiyor / iade yok (11 yorum, ince; ort. 1,4★)**

- “they were totally unyielding with giving me my refund and getting rid of my access” — 1★, AU, 2025-12-29, [app-store-rss #13571523565](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)

## 2. Eksik olanlar (özellik istekleri)

| # | istek | kaç yorum (sezgisel) | örnek |
|---|---|---|---|
| 1 | Takvim / iPad / Apple Watch eşitleme, ev ekranı widget'ı | `calendar` 11, `widget` 20 (7 mağaza), `ipad|watch` birkaç | “Maybe an option for something similar to the Apple calendar format where you visually see where you blocked out specific times for which task or routine” — 5★, CA, 2026-04-17, [app-store-rss #13968568937](https://itunes.apple.com/ca/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json) |
| 2 | Esnek tekrar: başlangıç tarihi, '3 ayda bir', özel tekrar | ≥3 (ince) | “have a starting date on say, a Wednesday and then have it repeat every Wednesday” — 5★, AU, 2025-05-09, [app-store-rss #12638662372](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json) |
| 3 | Widget'tan işaretleme / etkileşimli widget | 3 (ince) | “we should be able to check off our list from the widgets without it taking up in the app” — 4★, CA, 2024-11-30, [app-store-rss #12010228356](https://itunes.apple.com/ca/rss/customerreviews/page=6/id=1596403446/sortBy=mostRecent/json) |
| 4 | Karanlık mod | 2 (ince) | “please add dark mode cuz my eyes hurt” — 3★, GB, 2025-02-06, [app-store-rss #12278975338](https://itunes.apple.com/gb/rss/customerreviews/page=8/id=1596403446/sortBy=mostRecent/json) |
| 5 | Birden çok izleyici / ruh hali pop-up'ını kapatma ayarı | 2 (ince) | “I wish there was a setting to get rid of the mood tracker that keeps popping up” — 4★, AU, 2024-12-07, [app-store-rss #12036156237](https://itunes.apple.com/au/rss/customerreviews/page=6/id=1596403446/sortBy=mostRecent/json) |
| 6 | Ücretsiz sürümde daha çok şablon / kütüphane içeriği | 3-4 (ince) | “There are very limited option in the library for gratitude and affirmation practices” — 2★, ZA, 2023-09-24, [app-store-rss #10401399711](https://itunes.apple.com/za/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json) |

## 3. Çözülmemiş işler (konumlandırma malzemesi)

- **'Parası olmayanlar'**: çocuk/genç/öğrenci/ADHD'li düşük bütçeli kullanıcı rutin istiyor ama duvara çarpıyor. “I like it, but I have a problem with it cause what if I don’t wanna pay money to make a stupid template or whatever Like what’s the point” — 3★, CA, 2026-07-09, [app-store-rss #14283505123](https://itunes.apple.com/ca/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json)
- **ADHD ve kaygılı kullanıcılar**: aracı çok seviyorlar ama ödeme + sıra karışıklığı + teşhis testi onları yoruyor/zarar veriyor. “The app will give you anxiety and make your ADHD worse.” — 1★, US, 2025-11-18, [app-store-listing #13412807865](https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446)
- **Yetişkin tonu**: 'çocuksu' arayüz ve sürekli bildirim şikâyeti. “I’d prefer a more adult like version.” — 3★, AU, 2025-07-28, [app-store-rss #12948645681](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)

## 4. En çok sevilenler (korunacaklar)

4-5★ alt kümesi (784 yorum; kümede ≥90 karakter ve anahtar sözcük filtresi var, yani sevgi sözcükleri fazla temsil edilir) üzerinde sözcük eşleşmesi:

| sevilen şey | eşleşen yorum (/784) |
|---|---|
| Alışkanlık / rutin kurma | 173 |
| DEHB / odak desteği | 147 |
| Motivasyon, 'rayda kalmak' | 99 |
| Eğlenceli / oyunlaştırma (rozet, ödül, seri) | 91 |
| Kendine bakım / ruh sağlığı | 82 |
| Şirin / renkli / estetik tasarım | 73 |
| Ev işleri / temizlik rutini | 63 |
| Kullanımı kolay | 53 |
| Hatırlatıcılar | 48 |
| Su takibi | 35 |
| Uyku | 31 |
| Ücretsiz sürüm yeterli / uygun fiyat | 30 |
| Ruh hali takibi | 21 |
| Meditasyon / olumlama | 21 |
| Widget | 17 |

Bağlantılı örnekler:

- “if you complete only 3/5 of your goals for the day you’re still rewarded for doing what you can and not just reprimanded for not doing it all.” — 5★, CA, 2025-04-08, [app-store-rss #12518013309](https://itunes.apple.com/ca/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json)
- “It makes being productive feel like a game, with a colorful, mood-lifting layout and endless ways to customize your routines.” — 5★, US, 2025-07-17, [app-store-listing #12903389349](https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446)
- “aesthetically pleasing which actually makes me wanna complete my tasks - for free!” — 5★, CA, 2024-12-10, [app-store-rss #12049234617](https://itunes.apple.com/ca/rss/customerreviews/page=6/id=1596403446/sortBy=mostRecent/json)
- “it has pomodoro timers, sleep trackers, workouts, music, background noise, tracks how much water you drink” — 5★, AU, 2025-11-04, [app-store-rss #13358465126](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json)
- “I love the mood check in, the journal entries, the ability to schedule notifications for certain things and the little bursts of motivation and applause for getting things done.” — 4★, CA, 2025-02-28, [app-store-rss #12365245203](https://itunes.apple.com/ca/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json)
- “I love the badge system (bronze, gold, silver)” — 5★, GB, 2025-08-28, [app-store-rss #13071525679](https://itunes.apple.com/gb/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json)
- “Highly recommended this app for teens who have ADHD of lacks of motivation.” — 5★, AU, 2024-05-24, [app-store-rss #11304434200](https://itunes.apple.com/au/rss/customerreviews/page=9/id=1596403446/sortBy=mostRecent/json)
- “Good app with a nice Home Screen widget to tick off my daily reminders instead of using apple reminders.” — 4★, GB, 2025-05-15, [app-store-rss #12658358815](https://itunes.apple.com/gb/rss/customerreviews/page=6/id=1596403446/sortBy=mostRecent/json)
- “the little spin wheel for choosing something for “self love”” — 5★, IN, 2026-03-09, [app-store-rss #13830132278](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json)
- “if you go to the fun chore wheel and spin it then you can press do it for later after it comes up with a chore” — 4★, NZ, 2025-12-30, [app-store-rss #13572063536](https://itunes.apple.com/nz/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json)

**Korunacak 5:** (1) rutin + 'bugün ne yapmalıyım' netliği ve alışkanlık kurma, (2) ADHD dostu, düşük sürtünmeli görev ekleme, (3) kısmi ilerlemeyi ödüllendiren, cezalandırmayan oyunlaştırma + rozet/seri, (4) renkli/şirin ama düzenli tasarım ve özelleştirme, (5) hepsi bir arada araçlar (su, uyku, ruh hali, günlük, meditasyon, egzersiz, çark). Bunlar All2Me'de zaten var (bkz. 5).

## 5. All2Me ile eşleme

All2Me kaynakları: `README.md`, `docs/SPEC.md`, `replica/features.csv`, ve hızlı kod doğrulaması (görev sırası, takvim, silme, 'öne tamamla'). Etiket: **çözülüyor** / **kısmen** / **çözülmüyor**.

| # | tema | All2Me durumu | düzeltme önerisi | Expo Go? | efor |
|---|---|---|---|---|---|
| 1 Fiyat / ücretsiz olmalı | **çözülüyor**: ücretli sürüm, kilit, paywall, reklam yok (SPEC §1, README). Tüm çark/yansıma/şablonlar açık. | Önlem değil, **mesaj**: onboarding ve mağaza metninde 'ücretsiz, deneme yok, kart istemez' görünür olsun (Onboarding 'Sonuç' ekranı + Ayarlar 'Hakkında'). | Evet | S |
| 2 Deneme/tahsilat/iade | **çözülüyor** (satılan bir şey yok). | Yok. Tek risk: ileride Supabase/bulut için ücret çıkarsa bunu hiç gizleme; 'nasıl para kazanmıyoruz' tek satır. | Evet | S |
| 3 Görev sınırı / VIP duvarı | **çözülüyor**: core store'da görev sınırı yok (features.csv 'Sınırsız alışkanlık'). | Yok. Çocuk/genç kullanıcı için 'kayıt yok, hesap yok' mesajı (bkz. 10). | Evet | S |
| 4 Hatırlatıcı/alarm güvenilmez, bunaltıcı | **kısmen**: bildirim grupları + ana anahtar var; ama alarm yerel bildirim (README 'Bilinen sınırlar'), gerçek cihazda denenmedi. Aşırı bildirim koruması (sessiz saat, günlük üst sınır) yok. | (a) Ayarlar > 'Hatırlatıcı sağlığı': izin durumu, test bildirimi, pil/rahatsız etme ipucu, alarm sınırının dürüst açıklaması. (b) Sessiz saatler + günlük en çok N bildirim + ertele. (c) Gerçek cihazda iOS+Android testi. | Evet (yerel bildirim; gerçek alarm saati değil) | M |
| 5 Reklam/vaat uyuşmazlığı | **çözülüyor**: reklam yok; sahte sosyal kanıt/istatistik koyulmadı (features.csv skip). | Mağaza metni gerçekle birebir: yalnız var olanı yaz; 'AI' deme (planlayıcı kural tabanlı). | Evet | S |
| 6 Güncelleme kötüleştirdi (eskiden ücretsiz) | **çözülüyor** yapı olarak (hiçbir şey kilitlenemez). | Taahhüt: 'bugün ücretsiz olan hep ücretsiz'. Ayrıca sürüm notlarında kırıcı değişiklik olmasın; veri sürümleme (store migrate) testi. | Evet | S |
| 7 Hata/açılmıyor | **kısmen**: birim testleri + typecheck var; gerçek cihaz ve uçtan uca Supabase testi yok (README). | Gerçek cihaz smoke testi + açılış hatası için hata sınırı (ErrorBoundary) ve 'Verileri koruyarak sıfırla' kurtarma ekranı. | Evet | M |
| 8 Görev sırası / düzenle-sil-öne tamamla | **kısmen**: görevler zaman dilimine göre (sabah/öğleden sonra/akşam/her zaman) gruplanıyor, grup içi sıralama kuralı bu çalışmada koddan doğrulanmadı, elle sıralama özelliği README/SPEC'te geçmiyor; silme düzenleyicide onaylı var ama keşfi zor; 'unuttum hakkı' yalnız dün için (ertesi gün 09:00'a kadar, haftada 1). | (a) Grup içinde hatırlatıcı saatine göre, sonra elle yukarı/aşağı sıra. (b) Rutin kartında kaydırma/uzun basma ile sil + geri al. (c) 'Önceden işaretle': yarın/hafta içi görevleri puansız ön-tamamla (puan suistimali olmasın). | Evet | M |
| 9 Uzun kurulum + satış baskısı | **kısmen**: 7 soru + sonuç + önerilen görevler + partner adımı (README); ödeme baskısı yok ama uzun. Ölçülmedi. | Her adımda 'Atla'; ilerleme çubuğu zaten var, toplam süre ('~1 dk') göster; ilk görevi eklemeden ana ekrana geçiş. Soruları sonradan Profil'den yap. | Evet | S |
| 10 Çocuk/genç ödeyemiyor | **çözülüyor** (ödeme yok) — ama çocuk kitlesi için veri/gizlilik sorusu var: Supabase eşleştirme isteğe bağlı, anonim giriş. | Mağaza yaş derecelendirmesi ve gizlilik metni: veriler cihazda, eşleşme isteğe bağlı. Ebeveyn notu. | Evet | S |
| 11 Teşhis gibi test + terapi reklamı | **çözülüyor**: tanı koyan test yok; 'tanı değildir' notu; mini testler yalnız şablon önerir (SPEC §1). | Korunacak ilke: terapi/yardım kaynakları yalnız bağlantı, iş ortaklığı yok; kriz durumunda ülkeye uygun yardım hattı bilgisi. 'Tanı değildir' etiketini testlerde de göster. | Evet | S |
| 12 Destek yok | **çözülmüyor**: README/SPEC'te destek/geri bildirim kanalı geçmiyor. | Ayarlar > 'Geri bildirim' (e-posta bağlantısı) ve uygulama içi 'hata bildir' (sürüm + cihaz bilgisi). Yanıt süresi vaadi verme. | Evet (mailto) | S |
| İstek: takvim/iPad/Watch eşitleme | **çözülmüyor**: `expo-calendar` bağımlılık ve app.json eklentisi olarak var ama kodda KULLANILMIYOR; eşitleme yalnız partner (Supabase). | Görevi/teslimi cihaz takvimine tek yönlü ekle ('Takvime ekle' düğmesi, hatırlatıcı saatiyle); isteğe bağlı JSON dışa/içe aktarım (paylaş menüsü) ile yedek. | Takvim: evet (expo-calendar Expo Go'da çalışır; izin metni hazır). Watch: hayır | M |
| İstek: esnek tekrar (başlangıç tarihi, 3 ayda bir) | **kısmen**: tekrar = haftanın günleri ya da haftalık kota (task/[id].tsx); 'her N hafta/ay' + çapa tarih yok. | Görev düzenleyiciye 'her N gün/hafta/ay, şu tarihten' seçeneği; seri/puan motoruna bağla. | Evet | M |
| İstek: widget / etkileşimli widget | **çözülmüyor**: Expo Go'da native widget yok (features.csv skip). | Gerçek çözüm geliştirme derlemesi (EAS + widget config plugin) gerektirir; Expo Go'da yapılamaz. Kısa vade: yok (widget istemeyenler için bildirimdeki günlük özet seçeneği düşünülebilir). | **Hayır** | L |
| İstek: karanlık mod | **çözülüyor**: açık/koyu tema (features.csv). | Koyu temada AA kontrast düzeltmeleri (replica/AUDIT.md #3-#9). | Evet | S |
| İstek: mood pop-up'ı kapat / daha çok şablon | **çözülüyor**: 62 şablon hepsi açık; ruh hali araç olarak duruyor; zorla pop-up açıldığına dair kodda kontrol yapılmadı. | Yok (korunacak). | Evet | — |

**Sevilenlerin All2Me'de karşılığı:** rutin panosu + sınırsız görev, çark (3 çark, sınırsız çevirme), rozet/seri/XP, su/uyku/ruh hali/meditasyon/egzersiz/yansıma/zamanlayıcı/alarm araçları, ml/oz seçimi, koyu tema. Ek kazanım: bir yorumcu suyu litreyle ölçemediğinden şikâyet ediyor: “you can’t choose litres to measure your water in-take for example” — 2★, ZA, 2023-09-24, [app-store-rss #10401399711](https://itunes.apple.com/za/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json) All2Me ml/oz sunuyor.

### 5.1 Öncelikli düzeltme listesi (en fazla 12)

| # | düzeltme | kanıt | efor | Expo Go |
|---|---|---|---|---|
| 1 | Hatırlatıcı sağlığı ekranı + sessiz saatler + günlük bildirim üst sınırı + gerçek cihaz testi | tema 4 (77 yorum) | M | Evet |
| 2 | Rutinde görev sırası: saate göre + elle sıra; kaydırarak sil + geri al | tema 8 (42 yorum) | M | Evet |
| 3 | 'Önceden işaretle' (ileri tarih, puansız) ve unuttum hakkını netleştir | tema 8 (listing yorumu #11596132782) | M | Evet |
| 4 | Her adımda atlanabilir, süresi gösterilen kısa onboarding | tema 9 (28 yorum, ort. 1,8★) | S | Evet |
| 5 | 'Hep ücretsiz, deneme yok' mesajı (onboarding sonu + Ayarlar + mağaza) | temalar 1-3 (350/196/134 yorum) | S | Evet |
| 6 | Cihaz takvimine tek yönlü ekle (expo-calendar zaten bağımlılık) | istek: takvim (11 yorum) | M | Evet |
| 7 | Esnek tekrar: her N gün/hafta/ay + çapa tarih | istek (#10518775457, #12638662372) | M | Evet |
| 8 | Açılış hata sınırı + kurtarma ekranı + gerçek cihaz smoke testi | tema 7 (40 yorum) | M | Evet |
| 9 | Terapi/yardım kaynakları iş ortaklığı olmadan; testlerde 'tanı değildir' | tema 11 (3-4 yorum, ince) | S | Evet |
| 10 | Geri bildirim/hata bildir bağlantısı (sürüm+cihaz bilgisi) | tema 12 (11 yorum) | S | Evet |
| 11 | JSON dışa/içe aktarım (yedek / cihaz değiştirme) | iPad-telefon eşitleme şikâyeti (ince) | M | Evet |
| 12 | Ev ekranı widget'ı (EAS derlemesi gerekir) | 20 yorum, 3 etkileşimli istek | L | Hayır |

### 5.2 Konumlandırma

**Seçenek 1 (önerilen):** *Rutin kurmaya çalışan ama ödeme duvarına çarpan öğrenciler, gençler ve DEHB'li kişiler için* **All2Me**, *Me+ tarzı şirin, renkli rutin + çark + araçlar paketini sınırsız görev, deneme süresi ve reklam olmadan, çevrimdışı ve iki kişilik yarışla sunar.* Kanıt: fiyat/duvar temaları 350 + 196 + 134 yorum (anahtar-sözcük, tek platform).

Seçenek 2: *Kendi rutinini ve bir partneri/arkadaşı ile birlikte yürütmek isteyenler için* All2Me, tek başına çalışan rutin uygulamalarının eksik bıraktığı iki kişilik yarış + senkronu sunar (kanıt: yorumlarda 'partner' isteği çok az; **zayıf, ince**; bu yüzden ikinci planda).

Seçenek 3: *Hatırlatıcısına güvenmek isteyen dağınık kullanıcılar için* All2Me, hatırlatıcı sağlığını görünür kılar (sessiz saat, test bildirimi, dürüst alarm sınırı) (kanıt: tema 4, 77 yorum; ama bu iddia gerçek cihaz testi yapılana kadar VERİLMEMELİ).

Marka notu: Me+ adını ya da logosunu mağaza/reklamda kullanma; karşılaştırma sayfası için hukuki görüş gerekir.

## 6. Özellik doğrulamaları (features.csv: partial / no / 'doğrulanmadı')

Kaynak türleri: (R) kullanıcı yorumu, bağlantılı; (L) App Store resmi arama API'si açıklaması: <https://itunes.apple.com/lookup?id=1596403446&country=us>. Ekran görüntüsü/uygulama içi doğrulama yapılamadı (uygulama kurulmadı).

| features.csv satırı | sonuç | kanıt |
|---|---|---|
| Uzun kişiselleştirme akışı (partial, doğrulanmadı) | **Kısmen doğrulandı**: uzun soru akışı var; 'uyku süresi seçimi', 'rutin önizlemesi', 'bildirim izni adımı' **doğrulanamadı** (hiçbir yorum anmıyor). | “answer a couple questions more than a couple like maybe 20” — 5★, AU, 2025-04-26, [app-store-rss #12588225921](https://itunes.apple.com/au/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json); “answering the questions at the beginning it makes it seem like I’m in a rough spot because I have a baby” — 2★, CA, 2024-06-21, [app-store-rss #11407562827](https://itunes.apple.com/ca/rss/customerreviews/page=9/id=1596403446/sortBy=mostRecent/json) |
| Onboarding sonu paywall ve çıkış teklifi (skip) | **Paywall doğrulandı; çıkış teklifi doğrulanamadı.** | “I just went through a whole quiz/test thing, answering things, being excited to try my new app, BUT I HAVE TO PAY!?!?” — 2★, AU, 2025-05-12, [app-store-rss #12650415150](https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json); “Well after u spend a good amount of time answering all the questions it says 1 week free trial” — 3★, US, 2023-10-01, [app-store-listing #10424965820](https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446) |
| Görev hatırlatıcıları (doğrulanmadı) | **Doğrulandı.** | “the ability to schedule notifications for certain things” — 4★, CA, 2025-02-28, [app-store-rss #12365245203](https://itunes.apple.com/ca/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json); “The reminders often prompt me to complete the tasks.” — 4★, CA, 2024-07-25, [app-store-rss #11533622703](https://itunes.apple.com/ca/rss/customerreviews/page=8/id=1596403446/sortBy=mostRecent/json) |
| Görev simgesi ve rengi özelleştirme (doğrulanmadı) | **Doğrulandı** (resmi açıklama + yorum). | (L) 'Build your own self-care schedule and daily routine planner with the icons and colors you choose!'; “More colours for tasks (maybe a colour wheel so people can make their own)” — 5★, CA, 2026-04-17, [app-store-rss #13968568937](https://itunes.apple.com/ca/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json) |
| Sınırsız alışkanlık (ücretli sürümde) (doğrulanmadı) | **Doğrulandı**; limit 4-7 arası bildirilmiş, eskiden ücretsiz sınırsızdı. | “you can’t have more than around 4 habits before you pay” — 4★, AU, 2026-03-23, [app-store-rss #13877919125](https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json); “I only get to put 5 before having to pay” — 3★, AU, 2026-06-27, [app-store-rss #14232722013](https://itunes.apple.com/au/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json); “I just wish it allowed us to have unlimited habit tracking as it used to, for free” — 5★, IN, 2026-03-09, [app-store-rss #13830132278](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1596403446/sortBy=mostRecent/json) |
| MBTI testiyle rutin önerisi (partial, doğrulanmadı) | **Mağaza açıklamasında var, yorumlarda hiç geçmiyor** (0 yorum). Uygulama içi 'rutin testleri' var. | (L) 'Take the MBTI test to find the routine and habits that suit you best.'; “the quizess to get the ‘ perfect routine ‘” — 2★, GB, 2025-08-14, [app-store-rss #13013852572](https://itunes.apple.com/gb/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json) |
| Fotoğraftan temizlik planı (AI) (skip, güvenilmez kaynak) | **Doğrulandı** (iki kullanıcı); jeton/hak sınırı ve hata bildirimi var, ücretli. | “take a pic of your room and it Neil give you a list to clean it etc” — 4★, CA, 2024-11-26, [app-store-rss #11994247054](https://itunes.apple.com/ca/rss/customerreviews/page=6/id=1596403446/sortBy=mostRecent/json); “I would use the AI task where you take a picture task list and it generates the whole list” — 1★, US, 2026-09-02, [app-store-rss #14502078285](https://itunes.apple.com/us/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json); “I have used up all my tokens” — 1★, US, 2026-09-02, [app-store-rss #14502078285](https://itunes.apple.com/us/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json) |
| Alarm (partial) | **Doğrulandı** ve güvenilmezlik şikâyeti var. | “timers, drink goals, sleep tracking, alarms and a place to record how you feel” — 5★, AU, 2026-04-01, [app-store-rss #13909891695](https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json); “when I set an alarm it only went off for the first couple of days and it just stops!” — 4★, AU, 2024-08-11, [app-store-rss #11598951313](https://itunes.apple.com/au/rss/customerreviews/page=8/id=1596403446/sortBy=mostRecent/json) |
| Ruh hali takvimi / istatistiği (doğrulanmadı) | **Ruh hali takibi doğrulandı; 'takvim/istatistik' görünümü doğrulanamadı.** | “I love the mood check in, the journal entries” — 4★, CA, 2025-02-28, [app-store-rss #12365245203](https://itunes.apple.com/ca/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json); “I love the features that let me track my stats” — 5★, GB, 2025-08-28, [app-store-rss #13071525679](https://itunes.apple.com/gb/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json) (genel istatistik, ruh hali demiyor) |
| 'Library' bölümü (skip, doğrulanmadı) | **Doğrulandı** (olumlama/şükran içerikleri, bazı listeler ücretli). | “There are very limited option in the library for gratitude and affirmation practices” — 2★, ZA, 2023-09-24, [app-store-rss #10401399711](https://itunes.apple.com/za/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json); “be able to download list from the library for free” — 5★, AU, 2024-05-02, [app-store-rss #11223534648](https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json) |
| Kilit ekranı / ana ekran widget'ları (skip, doğrulanmadı) | **Ana ekran widget'ı doğrulandı** (etkileşimsiz: tıklayınca uygulama açılır; Apple Watch widget'ı yok iddiası var). Kilit ekranı widget'ı doğrulanamadı. | “A shame you can’t tick up tasks from Home Screen, when you click widget it opens app” — 4★, GB, 2025-05-15, [app-store-rss #12658358815](https://itunes.apple.com/gb/rss/customerreviews/page=6/id=1596403446/sortBy=mostRecent/json); “you don’t have widgets for an Apple Watch” — 1★, AU, 2024-05-07, [app-store-rss #11243373789](https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json) |
| VIP abonelik, 7 gün deneme, paywall (skip) | **Doğrulandı.** Fiyat bölgeye göre değişiyor: (L) $39,99/yıl, $9,99/ay; yorumlarda $45,99/yıl (AU), $75/yıl, $13/ay (CA). | “said 7 day free trail then proceeded to take $45.99 out my account straight away” — 1★, AU, 2024-05-05, [app-store-rss #11235083153](https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json); “I cannot justify $75 a year or $13 a month” — 4★, CA, 2025-02-28, [app-store-rss #12365245203](https://itunes.apple.com/ca/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json) |
| Çark: '3 hak + geri sayım, fazlası ücretli' (yes) | **Çark ve 'self love' çarkı doğrulandı; '3 çevirme hakkı' yorumlarca doğrulanamadı.** Bir yorum çarkın ödeme duvarına götürdüğünü söylüyor. | “The only things I like about it are the spin the wheel” — 2★, GB, 2025-08-14, [app-store-rss #13013852572](https://itunes.apple.com/gb/rss/customerreviews/page=4/id=1596403446/sortBy=mostRecent/json); “spin the wheel type thing just to get you to pay” — 3★, IE, 2023-09-03, [app-store-rss #10329409279](https://itunes.apple.com/ie/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json) |
| Video içerikli bölüm / egzersiz videoları (skip) | **Doğrulandı**; çoğu kilitli. | “has fitness videos” — 4★, AU, 2025-01-07, [app-store-rss #12155686432](https://itunes.apple.com/au/rss/customerreviews/page=5/id=1596403446/sortBy=mostRecent/json); (R, listing) "most of the little workout videos are locked" — [App Store ürün sayfası, yorum #10145410930](https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446) |
| Tanı koyan psikolojik testler (skip) | **Doğrulandı** (depresyon testi, DEHB testi) ve kullanıcıyı rahatsız ediyor. | “it told me I had sever Depression” — 2★, AU, 2026-03-31, [app-store-rss #13906698702](https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json); “The AI ‘do you have ADHD’ quiz is terrible” — 1★, AU, 2024-04-17, [app-store-rss #11171420400](https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json); “ads for betterhelp therapy” — 1★, AU, 2024-06-20, [app-store-rss #11402732029](https://itunes.apple.com/au/rss/customerreviews/page=9/id=1596403446/sortBy=mostRecent/json) |
| Sosyal kanıt blokları (skip) | **Doğrulanamadı** (yorumlar anmıyor; mağaza metni 'Tens of millions of self-care advocates' diyor). | (L) 'Tens of millions of self-care advocates choose Me+' |

**Doğrulanamayan:** uyku süresi/rutin önizlemesi/bildirim izni onboarding adımları, çıkış teklifi, ruh hali takvimi, kilit ekranı widget'ı, çark '3 hak', sosyal kanıt blokları. Üçüncü taraf özet sitelerinin (appfollow vb.) erişilemediği için bu satırlar 'kanıt yok' kalır; features.csv'deki notlar yine geçerli.

## 7. Sonraki adım

Google Play, Reddit ve Trustpilot yorumlarını okumak için oturumun ağ izin listesine play.google.com, www.reddit.com, www.trustpilot.com ve www.justuseapp.com eklenmeli; sonra aynı betikle satırlar eklenip tema tablosu yeniden üretilebilir (reviews.py'yi aynı komutla çalıştır).

## Ek: 'Elle oku' listesi (reviews.py: hiçbir temaya girmeyen düşük puanlar)


Low ratings that matched no theme. Either noise, or a theme themes.json does not have yet. Often the most useful part.

- (app-store-rss, 2*) https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json: "Why does it do this — So yesterday I downloaded me + and the only goal it kept for today is stretch like why didn’t you keep my goals from the previous day"
- (app-store-rss, 2*) https://itunes.apple.com/au/rss/customerreviews/page=10/id=1596403446/sortBy=mostRecent/json: "Amazing app but — The app is amazing and all but I hate how if your not paying for it you get all these ads and all you can use is the schedule"
- (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json: "Huh — It was so confusing after I added 5things for the morning then it said I can’t add anymore and it’s soo body shaming like instead of saying be healthy it just lose weight there are soo many improvements that it can"
- (app-store-rss, 2*) https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json: "Using you — The app is a really good idea and has helped me stay organised for certain things but when I did the “ Deppresion test” it told me I had sever Depression and the gave me a promo code for better help. That’s n"
- (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json: "Annoying — It has great motivation but stops me from adding more then 6 tasks making me unable to use it for what I need"
- (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json: "English — The  goals aren’t in English so I can’t read it and the settings don’t do anything to that"
- (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=2/id=1596403446/sortBy=mostRecent/json: "Idk — IT ACTS LIKE MY TEACHER 💀🙏 i csnnot make plans on  time i have to make them last min i hste this sm delete"
- (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json: "Rubbish — Don’t waste your money. Badly designed and cumbersome to use"
- (app-store-rss, 2*) https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json: "I like it but it doesn’t let me have more space to add to my routine. — 3.5/5"
- (app-store-rss, 1*) https://itunes.apple.com/au/rss/customerreviews/page=3/id=1596403446/sortBy=mostRecent/json: "I’m really sad — I thought this was a free app and I heard good stuff about it and wanted to try it out but it wasn’t free and I got really disappointed especially since I wanted to try it"
