# İnceleme 1 — Çekirdek, senkron, güvenlik (392e858..fca1271)
Karar: Düzeltmelerle. Kanıt betikleri: scratchpad/rv/a.ts, b.ts.

## Kritik
1. Senkron kuyruğu yarışı: pushDirty anahtarları başta alıp await sonrası koşulsuz clearDirty → itme sırasında yapılan geri alma (tombstone) partnere hiç gitmez (lib/sync.ts:32-54, core.ts:684-689). Çözüm: sürümlü dirty; yalnız aynı sürümse sil.
2. RLS yalnız owner_id'yi denetliyor; data.userId/ownerId/from/profil id doğrulanmıyor; applyRemote partner belgesini koşulsuz kabul ediyor → partner benim adıma -500 puan yazabildi (doğrulandı) (supabase/0001_init.sql:65-69, core.ts:664-679). Çözüm: sunucu tetikleyicisi + istemci denetimi + sahip-önekli kimlikler.

## Önemli
3. Haftalık kota bonusu kayboluyor (son gün tüm tamamlamalardan hesaplanıyor; recompute siliyor) (core.ts:300-307, points.ts:253-263) — doğrulandı.
4. createdAt.slice(0,10) UTC → EN/ABD kullanıcısında akşam eklenen görev bugün planlı görünmüyor (points.ts:36,74; core.ts:885) — doğrulandı.
5. Sıfırla / Eşleşmeden ayrıl sunucuya yansımıyor: üyelik kalıyor, yeniden eşleşme engelleniyor, silinen veri geri doğuyor (resetAll.ts:69-82, core.ts:339, SQL:17). Çözüm: leave_pair RPC + sıfırlamada signOut/leave.
6. Özel görevler partnere tam başlıkla senkronlanıyor (sync.ts:42, core.ts:485 label).
7. Her senkronda (~45 sn) görev bildirimleri baştan kuruluyor (applyRemote yeni habits nesnesi; _layout.tsx:39-42; pull gte cursor).
8. Tek reddedilen satır bütün upsert partisini kalıcı kilitliyor (sync.ts:50-53); partnerin aynı kimlikli tombstone'u yerel tamamlamamı siler (core.ts:673).
9. Şampiyonluk eksik partner verisiyle kalıcı veriliyor (core.ts:779-806).
10. Eşleşme kodu bruteforce'a açık: TTL yok, deneme sınırı yok, random() (SQL:72-114).

## Küçük
- DST + 03:00 sınırı (dates.ts:194-196) — ABD'de doğrulandı.
- Erken bonus 00:00-03:00 arası yanlış (points.ts:153-160) — doğrulandı.
- 03:00 öncesi hatırlatıcılar haftanın yanlış gününde (notifications.ts:395-398, calendarSpec.ts:385-396).
- Ayın 31'i: motor ↔ takvim RRULE uyuşmazlığı (calendarSpec.ts:369-383).
- Önceden işaretlenen tamamlama zorluk sınırına sayılıyor (core.ts:452).
- canBackfill 00:00-03:00 arası yanlış gün (core.ts:518-522); complete backfill gününü doğrulamıyor.
- Tombstone _u itme anında alınıyor (sync.ts:42).
- Cursor/commit görünürlüğü (sync.ts:71-72).
- Üye sınırı yarışı (SQL:41-51) FOR UPDATE.
- SQL betiği idempotent değil (SQL:62-69,120).
- iOS 64 bekleyen bildirim sınırı (notifications.ts:386-394, notifBudget.ts:227).
- Soğuk dokunuşta çift yönlendirme (notifications.ts:408-417).
- Oturum uyuşmazlığında senkron boşa dönüyor (sync.ts:139-143) → stop().
- settleChampions her realtime olayında pahalı (sync.ts:128) → debounce.
- Not: CONFIG.undoWindowMinutes uygulanmıyor (bilinçli mi? karar).
