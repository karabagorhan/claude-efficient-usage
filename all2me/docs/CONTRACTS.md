# All2Me — Geliştirici Sözleşmesi (CONTRACTS)

Ekran ajanları bu belgeyle, ortak kodu okumadan çalışabilmelidir. Ürün kuralları: `docs/SPEC.md`.
Ortak dosyalar (aşağıda **[ortak]**) değiştirilmez; eksik bir şey varsa raporla.

## 1. Klasör yapısı

```
app/                         expo-router rotaları (her dosya bir ekran)
  _layout.tsx                [ortak] kök Stack, hydrate kapısı, onboarding koruması, Boot, ToastHost
  (tabs)/_layout.tsx         [ortak] 5 sekme
  (tabs)/index|inspire|wheel|tools|profile.tsx, onboarding.tsx, ...   PLACEHOLDER → ekran ajanı tamamen yeniden yazar
src/
  engine/                    [ortak] saf TS: types, config, dates, points, levels, leaderboard, badges, streak
  store/core.ts              [ortak] çekirdek store (senkronlu)  → useCore
  store/settings.ts          [ortak] ayarlar dilimi              → useSettings
  store/slices/_example.ts   [ortak] dilim şablonu (kopyala)
  store/slices/<ad>.ts       ajan dilimleri (her ajan kendi dosyası)
  i18n/index.ts, types.ts, dates.ts   [ortak]
  i18n/locales/<ns>.ts       her ad alanı bir dosya; sahibi o ad alanının ajanı
  theme/index.ts             [ortak]
  components/                [ortak] ui.tsx, Mascot, Confetti, RingGauge, GradientScreen, ToastHost, TaskCard, Placeholder
  lib/                       [ortak] id, supabase, sync, notifications, routes, dev
  data/badges.ts             [ortak] rozetler (iki dilli)
  data/<ozellik>.ts          ajan içerik verisi (şablonlar, sözler, öneriler…) — Loc ile iki dilli
  features/<ozellik>/        ajanın ekrana özel bileşenleri/yardımcıları (çakışma olmasın diye)
tests/                       [ortak] engine.test.ts, store.test.ts  (npm test)
scripts/shots.mjs            web ekran görüntüsü (README)
```

İçe aktarma yolu göreli (`../../src/...`); `@/` takma adı yok.

## 2. Tema — `src/theme`

```ts
import { useTheme, PASTELS, pastelFor, pastelColor, GRADIENTS, radius, space, GUTTER, BUTTON_H, type, alpha, MOOD_COLORS } from '../src/theme';
const t = useTheme();           // ayar (system/light/dark) + cihaz teması
t.bg t.card t.cardAlt t.text t.textDim t.textFaint t.border
t.primary/t.onPrimary           // ana hap buton (açık: siyah/beyaz, koyu: beyaz/siyah)
t.coral t.purple t.pink t.blue t.orange t.success t.danger t.warn t.me t.partner
t.pastel.blue … t.pastel.yellow // koyu temada koyulaştırılmış; üstündeki yazı: t.onPastel
t.tabBar t.tabActive t.tabInactive t.overlay t.isDark
```
- `PastelKey = 'blue'|'green'|'purple'|'mint'|'peach'|'pink'|'yellow'`, `PASTEL_KEYS`. `pastelFor(i)` döngüsel seçer.
  `PASTELS[key] = {light, dark}`, `pastelColor(key, isDark)`.
- `GRADIENTS.wheel | action | streak | ai | lucky | celebrate` → `expo-linear-gradient` `colors` dizisi.
- `radius = {xs:8, sm:12, md:16, lg:22, xl:28, pill:999}`, `space = {xxs:2 … xxl:32}`, `GUTTER = 16`, `BUTTON_H = 56`.
- `type.display|h1|h2|h3|body|bodyBold|small|caption` (fontSize/fontWeight/lineHeight). `alpha('#RRGGBB', 0.3)`.
- Renkleri hex olarak sabit yazma; paletten al (gradyan/illüstrasyon renkleri hariç).

## 3. i18n — `src/i18n`

```ts
import { useT, useLang, L, translate, tMsg, tErr, eventLabel, fmtDay, fmtTime, DAYS_SHORT, DAYS_LETTER, DAYS_LONG, MONTHS, MONTHS_SHORT, type Loc, type Lang } from '../src/i18n';
const t = useT();                 t('drink.title')   t('task.streak', { n: 3 })   // {{n}} yer tutucu
const lang = useLang();           L({ tr: 'Su', en: 'Water' }, lang)
translate('task.reminderBody')    // React dışı (bildirim metni vb.), geçerli dil
fmtDay('2026-11-10', lang)        // "10 Kasım Salı" / "Tuesday, November 10";  'short' | 'month' stilleri
fmtTime('07:30', lang)            // "07:30" / "7:30 AM"
DAYS_SHORT[lang][weekday]         // weekday 0 = Pazartesi (engine ile aynı)
```
- **Ekranda sabit metin yok.** Her metin sözlükten (`t`) ya da içerik verisinden (`L(loc, lang)`) gelir. Emoji serbest.
- Parametre değeri `Loc` olabilir; `t` onu dile göre çözer: `t('toast.newBadge', { name: badge.name })`.
- Eksik anahtar: diğer dile düşer, o da yoksa **anahtarın kendisi** görünür + geliştirmede bir kez `console.warn`.
- İngilizce tekil: `params.n === 1` iken `src/i18n/plurals.ts` (`EN_ONE`) içindeki tekil metin kullanılır ("1 day").
- Kullanıcı içeriği (görev adı) çevrilmez; şablondan eklenen görevin `title`'ı eklendiği andaki dilde saklanır.

### Ad alanı dosya kalıbı (yalnız kendi dosyanı doldur)
```ts
// src/i18n/locales/drink.ts
export default {
  tr: { title: 'Su Takibi', goal: 'Hedef {{n}} {{unit}}', reminder: { title: 'Su içme zamanı!' } },
  en: { title: 'Hydration', goal: 'Goal {{n}} {{unit}}', reminder: { title: 'Time to drink water!' } },
};
// kullanım: t('drink.goal', { n: 2000, unit: t('common.unit.ml') })   t('drink.reminder.title')
```
`tr` ve `en` aynı anahtarlara sahip olmalı. Kayıtlı ad alanları (index.ts'de, hepsi mevcut):
- Dolu (ortak): `common` (btn.*, day.*, unit.*, greeting.*, state.*, errors.*, medicalNote), `tabs`, `task`
  (slot.*, difficulty.*, kind.*, schedule.*, link.*, progress, streak, private…), `points` (event.*, champion.*,
  period.*, level.*, tier.*, levelN, dayStreak…), `toast`.
- Boş iskelet (sahipleri doldurur): `onboarding routine newtask wheel planner inspire tools drink sleep mood
  reflection love motivation timer meditate workout soundscape alarm profile streak duel settings`.
- Yeni ad alanı gerekiyorsa (ör. `action`, `stats`, `badges`) mevcut en yakın ad alanında alt ağaç kullan
  (ör. `routine.action.*`) ya da raporla; `i18n/index.ts` ortak dosyadır.
- Hazır buton metinleri: `common.btn.done` (Tamamlandı / Mark as done), `common.btn.later` (Sonra yap / Do it later),
  `common.btn.save|cancel|close|next|back|skip|add|addAll|edit|delete|reset|yes|no|start|stop|seeAll`.

## 4. Ortak bileşenler — `src/components`

```tsx
import { Screen, Header, Txt, PillButton, IconButton, Card, PastelCard, IconTile, Chip, Segmented, Bar, Avatar,
         Field, Row, Spacer, SectionHeader, EmptyState, tap, press, success, warn, haptics, type IconName } from '../src/components/ui';
import { Mascot } from '../src/components/Mascot';            // mood: 'happy'|'cheer'|'sleepy', size, color?, shade?
import { Confetti } from '../src/components/Confetti';
import { RingGauge } from '../src/components/RingGauge';
import { GradientScreen } from '../src/components/GradientScreen';
import { TaskCard } from '../src/components/TaskCard';
```

| Bileşen | İmza (önemli proplar) |
|---|---|
| `Screen` | `{children, scroll=true, padBottom=32, insetTop=true, bg?, header?: ReactNode, style?, contentStyle?}` — güvenli alan + yatay 16 boşluk; `header` kaydırılmaz |
| `Header` | `{title?, subtitle?, left='back'\|'close'\|'none', onLeft?, right?: ReactNode, color?, large?}` — varsayılan sol: `router.back()` (geçmiş yoksa `/`) |
| `Txt` | `{variant='body'\|'display'\|'h1'\|'h2'\|'h3'\|'bodyBold'\|'small'\|'caption', size?, weight?, dim?, faint?, color?, center?, numberOfLines?}` |
| `PillButton` | `{label, onPress, kind='primary'\|'outline'\|'ghost', arrow?, icon?: IconName, disabled?, loading?, small?, color?, textColor?}` — h56 tam yuvarlak |
| `IconButton` | `{icon, onPress, color?, bg?, size=24, label?}` |
| `Card` | `{children, onPress?, onLongPress?, bg?, padding=16}` — beyaz, r22 |
| `PastelCard` | `{title, emoji?, overline?, pastel='blue', bg?, right='chevron'\|'none'\|ReactNode, onPress?, onLongPress?}` (s10) |
| `IconTile` | `{emoji, label, pastel? \| bg?, size=76, onPress?}` (s05) |
| `Chip` | `{label, active?, onPress?, emoji?, color?}` |
| `Segmented<T>` | `{value: T, options: {id: T, label}[], onChange}` |
| `Bar` | `{value: 0..1, color?, height=8, bg?}` (animasyonlu) |
| `SectionHeader` | `{title, onSeeAll?, seeAllLabel?}` — sağda "Tümü ›" |
| `Field` | `TextInputProps & {label?, containerStyle?}` |
| `Row` | `{children, gap?, between?, style?}` |
| `EmptyState` | `{title, body?, mood='happy', emoji?, action?: {label, onPress}}` — maskotlu |
| `Avatar` | `{emoji, color, size=44}` |
| `RingGauge` | `{value: 0..1, size=120, stroke=12, color?, track?, label?, sublabel?, children?}` (s01) |
| `GradientScreen` | `{colors: keyof GRADIENTS \| string[], header?, scroll=false, padBottom, start?, end?, contentStyle?}` |
| `Confetti` | `{fire: number\|boolean, count=48, duration=2400, onDone?}` — `fire` değişince patlar; mutlak, dokunmayı engellemez |
| `TaskCard` | `{habit, done, progress?, streak?, points?, overline?, masked?, readOnly?, onPress?, onLongPress?, onToggle?}` |
| `Placeholder` | `{name, title?, devSkip?, tab?}` — yalnız stub'lar için |

Örnekler:
```tsx
<Screen header={<Header title={t('drink.title')} right={<IconButton icon="settings-outline" onPress={...} />} />}>
  <PastelCard emoji="💧" overline={t('task.progress', { done: 3, target: 8 })} title={t('task.link.drink')} pastel="blue" onPress={...} />
  <SectionHeader title={t('tools.reflection')} onSeeAll={() => router.push(routes.tool('reflection'))} />
  <PillButton label={t('common.btn.done')} onPress={done} />
  <PillButton label={t('common.btn.later')} kind="outline" onPress={() => router.back()} />
</Screen>

<GradientScreen colors="action" header={<Header left="close" />}>
  <Mascot mood="cheer" size={160} />
  <Confetti fire={burst} />
</GradientScreen>

<TaskCard habit={h} done={isDone(s, h.id, day)} progress={progressOf(s, h.id, day)} onPress={() => toggle(h)} onLongPress={() => router.push(routes.editTask(h.id))} />
```
Haptik: `tap()` hafif, `press()` orta, `success()`, `warn()` (web'de no-op). PillButton/Chip/IconTile zaten `tap()` çağırır.
İkonlar: emoji + `@expo/vector-icons` `Ionicons` + `react-native-svg`. Gradyan: `expo-linear-gradient`. Ses: `expo-audio`.

## 5. Çekirdek store — `src/store/core.ts` (`useCore`)

Partnerle senkronlanan veri. Persist anahtarı `all2me-core-v1`. Gün anahtarı `YYYY-MM-DD`, gün sınırı 03:00
(`today()` / `dayKeyOf()` kullan; `toISOString().slice(0,10)` KULLANMA).

### Tipler (`src/engine/types.ts`)
```ts
Habit { id; ownerId; title; icon /*emoji*/; slot: 'morning'|'afternoon'|'evening'|'anytime'; pastel: PastelKey;
        link?: 'drink'|'mood'|'reflection'; source?: string /* 'inspire:<id>' | 'wheel:<id>' | 'newtask:suggest' | 'planner' | 'onboarding' */;
        category?; color? /*eski*/; difficulty: 'mini'|'easy'|'medium'|'hard'|'epic'; kind: 'check'|'counter'|'timer';
        target? /*sayaç hedefi / dakika*/; step?; schedule: { days: Weekday[] /*boş = her gün, 0=Pzt*/; weeklyQuota? };
        reminderTime? 'HH:MM'; dueTime? 'HH:MM'; isPrivate; together; createdAt ISO; archived }
Completion { id 'c:<habitId>:<day>'; habitId; userId; dayKey; completedAt; points; base; multiplier; earlyBonus }
PointEvent { id; userId; dayKey; type: 'completion'|'perfect_day'|'almost_perfect'|'weekly_bonus'|'badge'|'champion'|'nudge'|'penalty'|'bonus';
             points; refId?; label? /*kullanıcı metni*/; labelKey? /*i18n*/; labelParams?; group? }
Loc { tr: string; en: string }
```

### Durum alanları
`hydrated, me: Profile|null {id,name,emoji,color}, partner, pairId, pairCode, startedAt, habits{}, completions{}, events{},
badges{} (BadgeRec {badgeId, at}), nudges{}, progress{'<habitId>|<day>': number}, activity{kind:{count, days}},
toasts: Toast[] ({key, params?, emoji?}), dirty, cursor, syncedOnce, seenNudges, backfillUsed`.

### Aksiyonlar (`useCore.getState().x(...)` ya da `const x = useCore(s => s.x)`)
| Aksiyon | Açıklama |
|---|---|
| `setMe({id,name,emoji,color})` | Profil (onboarding: `id: uuid()` from `src/lib/id`) |
| `saveHabit(draft: HabitDraft): id` | Ekle/güncelle. `HabitDraft` = `{title, icon}` zorunlu, gerisi varsayılan (`habitDefaults`: easy, check, her gün, anytime, blue, özel değil). `id` verilirse günceller |
| `archiveHabit(id)` | "Sil" = arşivle (geçmiş puan kalır) |
| `addHabitsFromTemplates(drafts[]): number` | Toplu ekle; aynı başlıklı aktif görev varsa atlar; eklenen sayıyı döner |
| `complete(habitId, dayKey?, {backfill?}): Completion\|null` | Puanlar; çift sayım yok (null). Mükemmel gün, rozet otomatik |
| `undo(habitId, dayKey?)` | Geri alır; bonuslar yeniden hesaplanır |
| `addProgress(habitId, dayKey, delta): number` | Sayaç ilerlemesi (tamamlamaz; hedefe ulaşınca `complete` çağır) |
| `canBackfill(): boolean` | "Unuttum hakkı" (dün için, 09:00'a kadar, haftada 1) → `complete(id, dün, {backfill:true})` |
| `completeLinked(link, dayKey?): Completion\|null` | Bu türde bağlı aktif görev(ler) varsa günü tamamlar (sayaçsa ilerlemeyi hedefe çeker). Yoksa / zaten tamamsa `null` |
| `setLinkedProgress(link, value, dayKey?): Completion\|null` | Bağlı görev(ler)in ilerlemesini `value` yapar; `value >= target` (check için 1) olunca tamamlar |
| `awardBonus({id, points, label?, labelKey?, dayKey?, group?, perDay?})` | Görev dışı puan (çark, şanslı görev). `→ {ok:true, event} \| {ok:false, reason:'duplicate'\|'cap'\|'no_profile'}`. Aynı `id` ikinci kez puan vermez; `group`+`perDay` günlük tavan; puan 0..50 kırpılır; liderliğe sayılır |
| `revokeBonus(id)` | Bonusu geri alır |
| `logActivity(kind, dayKey?)` | `kind: 'mood'\|'reflection'\|'focus'\|'meditate'\|'workout'\|'drink'\|'sleep'\|'love'` — rozetleri besler (mood7: 7 farklı gün, journal10: 10 yansıma, focus10, breath10=meditate). Araç kaydı yapıldığında **bir kez** çağır |
| `dayStreak(): number`, `activeDays(): Set<string>` | Anlık değer (reaktif değil) |
| `sendNudge('nudge'\|'cheer', text): {ok, reason?: Msg}` | `reason` çevrilir: `tMsg(t, reason)` |
| `pushToast('toast.saved', params?)` ya da `pushToast({key, params, emoji})` | Üstte toast (ToastHost çevirir) |
| `setPair, leavePair, resetAll, markNudgesSeen, settleChampions, checkBadges` | Eşleştirme/profil ekranları |

### Seçiciler ve hook'lar
```ts
import { useCore, today, myHabits, habitsOnDay, habitsBySlot, isDone, progressOf, pointsOnDay, totalsFor,
         selectDayStreak, selectTodayPoints, useDayStreak, useActiveDays, useHabitsOnDay, makeHabit, habitDefaults } from '../src/store/core';
const streak = useDayStreak();                 // number
const days = useActiveDays();                  // Set<string> (memo'lu) — Seri Takvimi
const list = useHabitsOnDay(day);              // Habit[] (memo'lu)
const slots = habitsBySlot(list);              // {morning, afternoon, evening, anytime}
const pts = useCore(selectTodayPoints);        // number
const { sp, xp } = totalsFor(useCore.getState(), me.id);   // levelFromXp(xp) → {level, titleKey, progress}
```
**Tuzak:** `useCore(s => Object.values(s.habits))` gibi her çağrıda YENİ nesne/dizi döndüren seçici sonsuz render
döngüsü yapar (zustand v5). İlkel değer seç, `useShallow` (`zustand/react/shallow`) ya da `useMemo` kullan veya
yukarıdaki hook'ları kullan. Bütün durumu almak (`useCore()`) çalışır ama her değişimde yeniden çizer.

Liderlik/şampiyonluk: `standings(period, anchor, [me.id, partner.id], events, completions, today())` (`src/engine/leaderboard`),
`championCounts(...)`, `dayStats(...)`. Seviye: `levelFromXp(xp)` (`src/engine/levels`) → `t(info.titleKey)`.
Rozetler: `BADGES` (`src/data/badges`, `name/desc: Loc`, `tier`, `hidden?`), `TIER_COLOR`. Olay etiketi: `eventLabel(t, e)`.
Puan sabitleri: `CONFIG` (`src/engine/config`), ör. `CONFIG.bonus.wheel = {points: 10, perDay: 5}`, `CONFIG.bonus.lucky = {points: 10, perDay: 3}`.

## 6. Ayarlar — `src/store/settings.ts` (`useSettings`, anahtar `all2me-settings-v1`)
`{hydrated, lang: 'tr'|'en', units: 'ml'|'oz', theme: 'system'|'light'|'dark', notifications: boolean, onboarded: boolean}`
+ `setLang, setUnits, setTheme, setNotifications, setOnboarded, resetSettings`. Toplu sıfırlama: `resetAllData()`
(`src/store/resetAll.ts`; yeni dilim eklenirse `SLICES` listesine ekle). İlk açılışta `lang` cihaz dilinden
(`deviceLang()`: tr değilse en). Onboarding bitince: `useCore.getState().setMe(...)` **ve** `useSettings.getState().setOnboarded(true)`
— kök koruma ikisine bakar ve kendiliğinden ana sekmelere geçer. "Verileri sıfırla": `useCore.getState().resetAll()` +
`resetSettings()` + her dilimin `reset()`'i.

## 7. Dilimler — `src/store/slices/<ad>.ts`
`src/store/slices/_example.ts` kalıbını kopyala: `create` + `persist` + `createJSONStorage(() => AsyncStorage)`, anahtar
`all2me-<ad>-v1`, `hydrated` bayrağı (`onRehydrateStorage` içinde true), `partialize` ile yalnız veri, bir `reset()`.
Dilim verisi yalnız cihazda kalır (senkron yok). Önerilen adlar: `drink, sleep, mood, reflection, alarm, wheel, favorites
(inspire), love, motivation, timer, workout, soundscape, planner`. Bir dilim başka ajanın dilimini import etmez; çekirdeğe
yalnız aksiyonlarla dokunur (`completeLinked`, `setLinkedProgress`, `logActivity`, `awardBonus`, `saveHabit`).

## 8. Rotalar ve parametreler — URL'leri `routes` ile kur (`src/lib/routes.ts`)

```ts
import { router } from 'expo-router';
import { routes } from '../src/lib/routes';
router.push(routes.actionBonus({ bonusId: `wheel:${uuid()}`, title: L(slice.name, lang), emoji: slice.emoji, points: CONFIG.bonus.wheel.points, group: 'wheel', pastel: 'pink', source: 'wheel' }));
const { habitId } = useLocalSearchParams<{ habitId?: string }>();
```

| Rota | Sunum | Parametreler |
|---|---|---|
| `/` (Rutin), `/inspire`, `/wheel`, `/tools`, `/profile` | sekme | — |
| `/onboarding` | korumalı (yalnız `!(me && onboarded)`) | — |
| `/new-task` | modal | — |
| `/task/[id]` | modal | `id` = görev id **veya** `new`; `new` iken ön doldurma: `title, icon, pastel, slot, kind, target, link, source` (`routes.createTask`) |
| `/action` | fullScreenModal, fade | **A) gerçek görev:** `habitId` (+ `source`). Tamamlandı → `complete(habitId)`. **B) bonus:** `bonusId, title, emoji, points, group ('wheel'\|'lucky')` (+ `pastel`, `source`). Tamamlandı → `awardBonus({id: bonusId, points: Number(points), label: title, group, perDay: CONFIG.bonus[group].perDay})`; `reason:'cap'` → `pushToast('toast.bonusCap', {n})`. İkisinde de "Sonra yap"/✕ → `router.back()`; başarıda konfeti + kısa gecikmeyle `router.back()`. `title` çağıran tarafından görünen dilde verilir |
| `/lucky` | modal | — (sonucu `/action` B moduyla açar, `group:'lucky'`) |
| `/planner` | modal | — (planı `addHabitsFromTemplates` ile ekler, `source:'planner'`) |
| `/streak` | modal | — |
| `/duel` | kart | `period?` = `day\|week\|month` |
| `/pairing` | modal | — |
| `/stats`, `/badges`, `/settings` | kart | — |
| `/wheel-edit` | modal | `wheelId?` |
| `/inspire/[id]` | kart | şablon id |
| `/inspire/category/[id]` | kart | kategori id |
| `/inspire/favorites` | kart | — |
| `/inspire/search` | kart | `q?` |
| `/inspire/quiz/[id]` | modal | test id |
| `/tools/timer` | kart | `habitId?` (bitince `complete`), `minutes?`, `tag?` (`focus\|lesson\|homework\|article\|work`) |
| `/tools/drink, sleep, reflection, meditate, workout, motivation, soundscape, alarm, love` | kart | — |
| `/tools/reflection-write` | modal | `topicId?` |
| `/tools/mood` | modal | — |

Tüm Stack ekranlarında `headerShown: false`: her ekran kendi `Header`'ını çizer. Yeni rota dosyası eklemek gerekirse
çalışır (varsayılan seçeneklerle) ama kök `_layout.tsx`'e kayıt için raporla. Sekme ekranları `Header left="none"` kullanır.

## 9. Bağlı görev mekanizması
- Görev `link: 'drink'|'mood'|'reflection'` taşır (Yeni Görev sayfasındaki "Su iç", "Ruh hali kaydı", "Yansıma" kartları
  bu alanla `saveHabit` eder; su için `kind:'counter', target: <bardak/hedef>`; diğerleri `kind:'check'`).
- Araç ekranı kayıt yaptığında: Ruh hali → `completeLinked('mood')`; Yansıma kaydı → `completeLinked('reflection')`;
  Su → her bardakta `setLinkedProgress('drink', <bugünkü bardak sayısı>)` (hedefe ulaşınca kendiliğinden tamamlar)
  ya da günlük hedefe ulaşınca `completeLinked('drink')`. Ayrıca `logActivity(kind)`.
- Dönen `Completion` varsa ekran `pushToast('toast.completedTitle', {title: habit.title, points: c.points})` gösterebilir.
- Rutin'de bağlı göreve dokunmak aracı açar (`routes.tool('drink')` …) — elle tamamlama da serbesttir.

## 10. Bildirimler — `src/lib/notifications.ts`
```ts
scheduleGroup(group, items: NotifItem[]): Promise<boolean>   // grubu DEĞİŞTİRİR (önce yalnız o grubu iptal eder)
scheduleOne(group, item): Promise<string|null>;  cancelOne(id);  cancelGroup(group);  ensurePermission();  parseHHMM('07:30')
NotifItem = { title, body?, url? /*dokununca açılır*/, sound?, trigger:
  {kind:'daily', hour, minute} | {kind:'weekly', weekday /*0=Pzt*/, hour, minute} | {kind:'date', date} | {kind:'interval', seconds, repeats?} }
```
- Gruplar (`NOTIF_GROUPS`): `habit` (çekirdek; görev hatırlatıcıları otomatik, dokununca `/action?habitId=`), `drink`, `sleep`,
  `alarm`, `timer`, `mood`, `smoke`, `meals`, `chores`, `study`, `growth` — her özellik yalnız kendi grubunu yönetir.
  **`cancelAllScheduledNotificationsAsync` çağırma.** Toplu iptal: `cancelGroups(groups)`. Kök düzen bildirim anahtarı
  kapanınca tüm grupları iptal eder; açılınca / dil değişince `resyncAllReminders()` (`src/lib/reminders.ts`) kullanılan
  takipçileri yeniden kurar — yeni grup eklenirse oraya da ekle.
- Metinler `translate('ns.key')` ile, kurulum anındaki dilde. Ayarlarda bildirimler kapalıysa `scheduleGroup` yalnız iptal eder.
- Web'de bildirim API'leri no-op (false/null döner); ekran bunu hata saymasın.

## 11. Doğrulama
- `npx tsc --noEmit` (kendi dosyaların 0 hata), `npm test`.
- Web önizleme: `npx expo export --platform web && node scripts/shots.mjs --seed --lang tr "ad=/rota"` → `shots/ad.png`.
  `--lang en` ile İngilizceyi de kontrol et (eksik anahtar ekranda `ns.key` olarak görünür).

## 12. Yapılmayacaklar
- Ortak dosyaları (`[ortak]`), `package.json`, başka ajanın dosyalarını/ad alanını/dilimini değiştirme; `npm/expo install` yapma.
- Sabit kullanıcı metni (TR ya da EN) yazma; store'da görünen metin saklama (anahtar + parametre sakla).
- "Me+" adı/logo/maskot/metin, referans görselleri, sahte istatistik/sosyal kanıt, tanı koyan testler, kilit/paywall/reklam,
  "yapay zekâ" iddiası (planlayıcının adı "Akıllı planlayıcı").
- Native modül gerektiren paket (Expo Go'da çalışmalı). Ağ isteği/API anahtarı (Supabase senkronu hariç).
- `Date#toISOString().slice(0,10)` ile gün anahtarı; Pazar-başlangıçlı gün dizini (engine: 0 = Pazartesi).
- `git add/commit/push`.
