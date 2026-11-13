# İnceleme 2 — Kullanıcı akışı ekranları (392e858..fca1271)
Karar: Düzeltmelerle. Kritik: yok.

## Önemli
1. Gece yarısı geçişinde Rutin "bugün" bayat kalıyor → dün tam puanla tamamlanıyor, unuttum hakkı kuralları atlanıyor (app/(tabs)/index.tsx:58,74,90,128-136). Çözüm: useToday() (AppState + gece yarısı), completeNow'da taze today().
2. Çark: sonuçtan sonraki 700 ms'de yeniden çevirince iki /action ve iki bonus (app/(tabs)/wheel.tsx:57-94).
3. Şanslı kart: aynı karttan tekrar tekrar bonus (her dokunuşta yeni uuid) + çift dokunuşta iki modal (app/lucky.tsx:75-87).
4. Görev düzenleyici Kaydet'e çift dokunuş yinelenen görev + takvim kaydı (app/task/[id].tsx:195-225).
5. Hatırlatıcı ayarları ekrandan 600 ms içinde çıkılırsa yeniden kurulum iptal oluyor (app/settings-reminders.tsx:76-87) → flush.
6. TaskCard erişilebilirliği: ana kart ve onay dairesinde role/label/checked yok (src/components/TaskCard.tsx:55,97).
7. createdAt.slice(0,10) UTC (core.ts:885, points.ts:36) — İnceleme 1 #4 ile aynı.

## Küçük
- a11y: PillButton disabled durumu; WeekStrip/planner/duel/streak/profile/badges Pressable rolleri ve selected; Stepper etiketleri; renk düğmeleri ham anahtar/hex okutuyor; emoji seçici etiketleri; wheel-edit devre dışı silme.
- action.tsx:52,83 bonus puanı URL'den → CONFIG.bonus[group].points kullan.
- planner.tsx:58 "Rutinime ekle" Yeni Görev modalına dönüyor (dismissAll ile tutarlı değil).
- task/[id].tsx:306 özel emoji kırpma ZWJ'yi bozuyor; :446 step > target kaydedilebiliyor.
- wheel-edit.tsx:73-75 odaklanmak çarkı "özel" yapıyor; :43 yeni dilim adı dile sabitleniyor.
- lucky.tsx:55-60 animasyon unmount'ta durmuyor.
- TaskMenu.tsx:65-68 kapanırken boş alt sayfa.
- settings.tsx:46-54, settings-reminders.tsx:89-98 async hatalar sessiz.
- index.tsx:95 backfillOk memo 09:00'da bayat.
