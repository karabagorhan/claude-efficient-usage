# İnceleme 3 — Araçlar ve yaşam takibi (superpowers requesting-code-review, 392e858..fca1271)
Karar: Düzeltmelerle. Kritik: yok.

## Önemli
1. Sigara: gün kapatıldıktan sonra limit aşılırsa kapanış + bağlı görev + smokeOk geri alınmıyor; ekran hâlâ "kapandı" (features/life/actions.ts:47-54, app/life/smoke.tsx:119-123, 226-231).
2. Alarm yeniden kurulumu sıraya alınmamış (serial kuyruğu yok) → hızlı aç/kapa'da kapatılmış alarm çalabilir / çift bildirim (features/toolsb/alarmSchedule.ts:150-180, app/tools/alarm.tsx:61-63).
3. Alarm silinince/kapatılınca bekleyen ertelemeler iptal edilmiyor (alarmSchedule.ts:153-154, alarm.tsx:88-92, 165-171) → cancelSnoozes(id).
4. Yansıma silinince bağlı görev geri alınmıyor (app/tools/reflection-write.tsx:46-51) → undoLinked('reflection').
5. Odak zamanlayıcısı durumu yalnız bileşende; ekrandan çıkınca oturum ve bildirim sessizce kayboluyor (app/tools/timer.tsx:49-57, 88) → durumu dilime taşı, bildirimi unmount'ta iptal etme.
6. Kayıt girilmeyen günler "0 sigara" sayılıyor → içilmeyen sigara/para/seri şişiyor (features/life/calc.ts:62-67, 75-96) → yalnız kapatılmış ya da etkileşimli günleri say.

## Küçük
- eachDay 800 gün sınırı → uzun dönem sigara istatistiği/seri bozulur (seriyi sondan geriye say).
- Sigara sıfırlaması sonrası direnme bonus id çakışması (slices/smoke.ts:94-99).
- Erteleme kurulmasa da "ertelendi" toast'u (alarmSchedule.ts:187, alarm-ring.tsx:70).
- Su hedefi değişince bağlı görev yeniden değerlendirilmiyor (drink.tsx:137).
- Özel su miktarı üst sınır yok, "1,5" reddediliyor (drink.tsx:188-195).
- Türkçe binlik ayırıcı fiyatı bozuyor: "1.250" → 1,25 (SmokeSetup.tsx:12-15, meals.tsx:88).
- Para birimi değişince eski yemek tutarları yeniden etiketleniyor.
- Ev işinde geri alma yok; silinen işin geçmişi haftalık skora sayılıyor (slices/chores.ts:98-103).
- Rozet sayaçları şişirilebiliyor (love işaret aç/kapa, yansıma sil/ekle).
- Meditasyon/egzersiz arka plan/duraklatma süresini sayıyor (meditate.tsx:38, workout.tsx:62).
- Pomodoro arka plandan dönüşte gecikmeli ilerliyor (timer.tsx:122-144).
- reminders.ts:61 notifyChores yalnız geçmiş doluysa çağrılıyor → koşul remind.on olmalı.
- actions.ts:113-117 kullanılmayan yinelenen resyncAllReminders.
- quotes.ts:71 sınırda sağlık ifadesi.
- Uyku kaydı 03:00 öncesi önceki günün üzerine yazılıyor.
