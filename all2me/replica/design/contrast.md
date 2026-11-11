# Kontrast denetimi (replica-design / contrast.py) — önce / sonra

Tarih: 2026-11-11. Kaynak: `src/theme/index.ts` (light, dark, PASTELS, GRADIENTS) + ekranlarda sabit yazılmış,
tekrar eden renkler (`component-*`, kaynakları token dosyalarının `_sources` alanında).
Komut (repo dışından, yalıtılmış):

```
python3 -I replica-design/contrast.py replica/design/tokens.light.json
python3 -I replica-design/contrast.py replica/design/tokens.dark.json
```

Eşikler (WCAG 2.2 AA): normal metin 4.5, büyük metin (≥24px ya da ≥18.66px kalın) 3, UI sınırı/odak halkası 3.
Not: 12-14px kalın hap etiketleri (sekme "Çark" hapı, onboarding seviye hapları) büyük metin sayılmaz.

## Özet

| | çift | AA altında | exit |
|---|---|---|---|
| **Önce** açık | 42 | **26** | 1 |
| **Önce** koyu | 41 | **17** | 1 |
| **Sonra** açık | 54 | **0** | 0 |
| **Sonra** koyu | 45 | **0** | 0 |

"Sonra" token dosyaları uygulamadaki **gerçek kullanımı** ölçer: metin rengi olarak artık `*Text` rolleri kullanıldığı
için `danger/success/warn/purple`-zemin çiftleri yerine `dangerText/…`-zemin çiftleri; yeni yüzeyler (Araçlar afişleri,
şanslı kart bitişi, Harekete Geç "+N puan", Seri başlığı/afişi, koyu Seri başlığı) eklendi. Çift sayısı bu yüzden arttı.

## Yapılan değişiklikler (madde → çözüm → yeni oran)

| # | önce | çözüm (dosya) | sonra |
|---|---|---|---|
| 1 | açık `textFaint #A3A8B3` 2.24/2.38 (Yeni Görev başlığı, placeholder, notlar) | `textFaint → #6B7280`, `textDim → #5B6370` (ayrı ton korunur) — `src/theme/index.ts` | 4.54 bg / 4.83 card |
| 2 | açık `textDim` / card-alt 4.19 | `textDim → #5B6370` | 5.25 card-alt, 5.69 bg |
| 3 | açık `tabInactive` 2.38 | `#6B7280` | 4.83 |
| 4 | beyaz / pembe hap 2.30 (Çark sekmesi) | marka geçişi: `pink → #A93BC9` (orkide), beyaz yazı kalır — `app/(tabs)/_layout.tsx` | 5.05 |
| 5-8 | `danger` 3.53, `success` 2.14, `warn` 2.15, `purple` 4.11 metin olarak | yeni roller `dangerText #DC2626`, `successText #15803D`, `warnText #B45309`, `purpleText #6D4AE8` (koyu: dolgu değerleri / `#A994FF`); 25+ kullanım yeri `*Text`'e geçirildi (task, settings, pairing, study, growth, duel, badges, smoke, chores ✓ simgesi, rutin "+puan"…); `danger` dolgusu `#DC2626` | 4.53–5.53 (koyu 6.2–11.4) |
| 9 | onboarding seviye hapları beyaz/coral-warn-success 2.15–2.83 | hap yazısı `t.onAccent #14171A` — `app/onboarding.tsx`; ayrıca `Chip` renkli etkin durumda `onAccent` | 5.14 / 8.38 / 7.90 (koyu 7.33 / 10.78 / 9.36) |
| 10 | beyaz / danger buton 3.76 (koyu 2.77) | `onDanger` rolü (açık beyaz, koyu `#14171A`); sil/çık/sıfırla butonları ve geri sayım rozeti | 4.83 (koyu 6.50) |
| 11 | beyaz / `ai` 3.68–2.19, `lucky` 4.17 | `ai → #4F5BD5 → #6F55DD → #8E4FE0`, `lucky → #5B5BE0 → #6D4AE8`; FeatureCard üst satırındaki `opacity 0.9` kaldırıldı — `app/new-task.tsx` | 4.83–5.54 |
| 12 | beyaz / mor dolgu küçük yazı 4.38 | Araçlar afişi `#6D4AE8 → #8E4FE0 → #A93BC9`, söz afişi `#C2410C → #BE185D → #A93BC9`, alt satır opaklığı kaldırıldı; 100 İyilik kartları ve söz kartları koyu gradyan çiftlerine taşındı (`app/tools/love.tsx`, `src/data/quotes.ts`) | 4.83–6.04 |
| 13 | beyaz / turuncu Seri afişi 2.36 | afiş yazısı `#14171A` (iki temada); açık temada Seri başlığı da koyu — `app/streak.tsx` | 7.63 |
| 14 | Seri sayısı turuncu / krem 1.50 | açık temada `#C2410C` | 3.29 (büyük metin) |
| 15 | "day streak" 1.84 | `#B45309` | 4.52 |
| 16 | input sınırı `border` 1.24 | yeni `borderInput #858A95` (koyu `#6B7280`): `Field`, pasif `Chip`, anahtar (Switch) kapalı izi | 3.46 card / 3.25 bg (koyu 3.56 / 3.93) |
| 17-18 | koyu `textFaint` 3.21, `tabInactive` 3.05 | `#868D99`, `#7E8592` | 5.15–5.69, 4.87 |
| 19-20 | koyu beyaz / pembe 2.03, / mor 3.20 | pembe `#A93BC9` (iki tema); mor dolgu üstünde küçük yazı kalmadı | 5.05 |
| 21 | koyu input sınırı 1.29 | `borderInput #6B7280` | 3.56 |
| 22 | koyu temada sabit `#14171A` seçim halkası 1.47 | halka ve dolgu `t.onPastel`, ✓ `t.onPrimary` — `app/onboarding.tsx` | 10.4–11.9 |
| + | Harekete Geç "+N puan" (`purple` 4.11) | `#5B3FD6` (gradyanın açık ucu `#E9E2FF` üstünde) — `app/action.tsx` | 5.37 |
| + | İlham poster "SABAH/AKŞAM" etiketi vurgu rengiyle 2.1–3.9 | `INK` %72 — `src/features/inspire/TemplateCard.tsx` | ≥ 5.25 (12 poster zemininde karışım rengiyle ölçüldü) |
| + | Düello: kullanıcının seçtiği avatar rengi metin olarak (ör. turuncu 2.36) | yeni `readable(color, bg, min)` yardımcısı tonu koruyup koyulaştırır — `src/theme/index.ts`, `app/duel.tsx` | ≥ 4.5 (büyük sayı ≥ 3) |

## Kalan istisnalar (gerekçeli)

- `border` (#E6E6EF / koyu #2A2F3C, 1.24 / 1.29): yalnız **dekoratif** ayırıcı/kart kenarı ve sayfa noktası; bileşeni
  tanımlamak için gerekli bir sınır değil (WCAG 1.4.11 kapsamı dışı). Etkileşimli sınırlar `borderInput`'a taşındı.
- Gradyan üstü metin tek durak renginde ölçüldü; `action` gradyanının üst durağı `#7C5CFC` üstündeki 40px başlık 4.38
  (büyük metin, eşik 3 → geçer). Başlık kısaltıldığı için ("Sıra sende!" / "Your move!") ikinci satır açık bölgeye inmiyor.
- Çark dilimleri (pastel zemin + `onPastel`) ve çark çerçevesi (#17A398) dekoratif; dilim yazısı `onPastel` ile ≥ 11.9.
- Kullanıcının seçtiği renkler grafik/çubuk dolgusu olarak (metin değil) olduğu gibi kullanılıyor; metin olduklarında `readable()`.
- Uygulama ikonu gradyanı (`scripts/gen-icons.mjs`) metin taşımaz.

## Sonra — açık tema ham çıktı

```
  AAA   16.88:1  text                     on bg                   
  AAA   17.99:1  text                     on card                 
  AAA   15.59:1  text                     on card-alt             
  AA     5.69:1  text-dim                 on bg                   
  AA     6.06:1  text-dim                 on card                 
  AA     5.25:1  text-dim                 on card-alt             
  AA     4.54:1  text-faint               on bg                   
  AA     4.83:1  text-faint               on card                 
  AAA   17.99:1  on-primary               on primary              
  AAA   12.68:1  on-pastel                on pastel-blue          
  AAA   13.70:1  on-pastel                on pastel-green         
  AAA   11.97:1  on-pastel                on pastel-purple        
  AAA   13.98:1  on-pastel                on pastel-mint          
  AAA   12.67:1  on-pastel                on pastel-peach         
  AAA   12.35:1  on-pastel                on pastel-pink          
  AAA   14.16:1  on-pastel                on pastel-yellow        
  AAA   17.99:1  tab-active               on tab-bar              
  AA     4.83:1  tab-inactive             on tab-bar              
  AA     5.05:1  component-on-color       on pink                 
  AA     4.53:1  danger-text              on bg                   
  AA     4.83:1  danger-text              on card                 
  AA     4.71:1  success-text             on bg                   
  AA     5.02:1  success-text             on card                 
  AA     4.71:1  warn-text                on bg                   
  AA     5.02:1  warn-text                on card                 
  AA     5.19:1  purple-text              on bg                   
  AA     5.53:1  purple-text              on card                 
  AA     4.83:1  on-danger                on danger               
  AA     5.14:1  on-accent                on coral                
  AAA    8.38:1  on-accent                on warn                 
  AAA    7.90:1  on-accent                on success              
  AAA    7.63:1  on-accent                on orange               
  AA     5.54:1  component-on-color       on gradient-ai-start    
  AA     5.22:1  component-on-color       on gradient-ai-mid      
  AA     4.83:1  component-on-color       on gradient-ai-end      
  AA     5.23:1  component-on-color       on gradient-lucky-start 
  AA     5.53:1  component-on-color       on gradient-lucky-end   
  AA     5.53:1  component-on-color       on gradient-love-start  
  AA     4.83:1  component-on-color       on gradient-love-mid    
  AA     5.05:1  component-on-color       on gradient-love-end    
  AA     5.18:1  component-on-color       on gradient-quote-start 
  AA     6.04:1  component-on-color       on gradient-quote-mid   
  AA     5.05:1  component-on-color       on gradient-quote-end   
  AAA    5.05:1  component-on-color       on gradient-wheel-top   large
  AA     4.38:1  component-on-color       on gradient-action-top  large
  AA     6.82:1  component-wheel-soft     on gradient-wheel-bottom 
  AA     3.29:1  component-streak-number  on gradient-streak-mid  large
  AAA    4.52:1  component-streak-unit    on gradient-streak-cream large
  AAA    7.63:1  component-ink            on orange               
  AAA    7.63:1  component-ink            on gradient-streak-top  
  AA     5.37:1  component-action-earned  on gradient-action-light 
  PASS   3.46:1  border-input             on card                 ui
  PASS   3.25:1  border-input             on bg                   ui
  PASS   5.02:1  success-text             on card                 ui

  54 pairs, 0 failing AA
```

## Sonra — koyu tema ham çıktı

```
  AAA   17.28:1  text                     on bg                   
  AAA   15.63:1  text                     on card                 
  AAA   13.54:1  text                     on card-alt             
  AAA    7.49:1  text-dim                 on bg                   
  AA     6.77:1  text-dim                 on card                 
  AA     5.87:1  text-dim                 on card-alt             
  AA     5.69:1  text-faint               on bg                   
  AA     5.15:1  text-faint               on card                 
  AAA   17.28:1  on-primary               on primary              
  AAA   10.96:1  on-pastel                on pastel-blue          
  AAA   10.36:1  on-pastel                on pastel-green         
  AAA   11.68:1  on-pastel                on pastel-purple        
  AAA   10.52:1  on-pastel                on pastel-mint          
  AAA   10.88:1  on-pastel                on pastel-peach         
  AAA   11.93:1  on-pastel                on pastel-pink          
  AAA    9.26:1  on-pastel                on pastel-yellow        
  AAA   16.42:1  tab-active               on tab-bar              
  AA     4.87:1  tab-inactive             on tab-bar              
  AA     5.05:1  component-on-color       on pink                 
  AA     6.87:1  danger-text              on bg                   
  AA     6.22:1  danger-text              on card                 
  AAA    9.89:1  success-text             on bg                   
  AAA    8.95:1  success-text             on card                 
  AAA   11.39:1  warn-text                on bg                   
  AAA   10.30:1  warn-text                on card                 
  AAA    7.58:1  purple-text              on bg                   
  AA     6.85:1  purple-text              on card                 
  AA     6.50:1  on-danger                on danger               
  AAA    7.33:1  on-accent                on coral                
  AAA   10.78:1  on-accent                on warn                 
  AAA    9.36:1  on-accent                on success              
  AAA    8.71:1  on-accent                on orange               
  AA     5.54:1  component-on-color       on gradient-ai-start    
  AA     4.83:1  component-on-color       on gradient-ai-end      
  AA     5.23:1  component-on-color       on gradient-lucky-start 
  AA     5.53:1  component-on-color       on gradient-lucky-end   
  AAA    5.05:1  component-on-color       on gradient-wheel-top   large
  AAA    4.54:1  orange                   on gradient-streak-dark-mid large
  AAA    5.96:1  component-streak-unit    on gradient-streak-dark-mid large
  AA     4.66:1  component-on-color       on gradient-streak-dark-top 
  AAA    7.63:1  component-ink            on gradient-streak-banner 
  PASS   3.56:1  border-input             on card                 ui
  PASS   3.93:1  border-input             on bg                   ui
  PASS  10.96:1  on-pastel                on pastel-blue          ui
  PASS  10.36:1  on-pastel                on pastel-green         ui

  45 pairs, 0 failing AA
```

---

# ÖNCE (ilk denetim, değişiklikten önce)

## Açık tema — ham çıktı

```
  AAA   16.88:1  text                     on bg                   
  AAA   17.99:1  text                     on card                 
  AAA   15.59:1  text                     on card-alt             
  AA     4.54:1  text-dim                 on bg                   
  AA     4.83:1  text-dim                 on card                 
  FAIL   4.19:1  text-dim                 on card-alt             
  FAIL   2.24:1  text-faint               on bg                   
  FAIL   2.38:1  text-faint               on card                 
  FAIL   2.24:1  text-faint               on bg                   large
  AAA   17.99:1  on-primary               on primary              
  AAA   13.69:1  on-pastel                on pastel-blue          
  AAA   15.23:1  on-pastel                on pastel-green         
  AAA   13.44:1  on-pastel                on pastel-purple        
  AAA   14.85:1  on-pastel                on pastel-mint          
  AAA   14.38:1  on-pastel                on pastel-peach         
  AAA   13.68:1  on-pastel                on pastel-pink          
  AAA   15.21:1  on-pastel                on pastel-yellow        
  AAA   17.99:1  tab-active               on tab-bar              
  FAIL   2.38:1  tab-inactive             on tab-bar              
  FAIL   2.30:1  component-on-color       on pink                 
  FAIL   3.53:1  danger                   on bg                   
  FAIL   3.76:1  danger                   on card                 
  FAIL   2.14:1  success                  on bg                   
  FAIL   2.28:1  success                  on card                 
  FAIL   2.15:1  warn                     on card                 
  FAIL   3.76:1  component-on-color       on danger               
  FAIL   2.28:1  component-on-color       on success              
  FAIL   2.83:1  component-on-color       on coral                
  FAIL   2.15:1  component-on-color       on warn                 
  FAIL   4.38:1  component-on-color       on purple               
  FAIL   3.68:1  component-on-color       on gradient-ai-start    
  FAIL   2.19:1  component-on-color       on gradient-ai-end      
  FAIL   4.17:1  component-on-color       on gradient-lucky-start 
  FAIL   2.36:1  component-on-color       on orange               
  FAIL   2.30:1  component-on-color       on gradient-wheel-top   large
  AA     4.38:1  component-on-color       on gradient-action-top  large
  AA     6.67:1  component-wheel-soft     on gradient-wheel-bottom 
  FAIL   1.50:1  orange                   on gradient-streak-mid  large
  FAIL   1.84:1  component-streak-unit    on gradient-streak-cream large
  FAIL   4.11:1  purple                   on bg                   
  FAIL   1.24:1  border                   on card                 ui
  FAIL   1.16:1  border                   on bg                   ui

  42 pairs, 26 failing AA
```

## Koyu tema — ham çıktı

```
  AAA   17.28:1  text                     on bg                   
  AAA   15.63:1  text                     on card                 
  AAA   13.54:1  text                     on card-alt             
  AAA    7.49:1  text-dim                 on bg                   
  AA     6.77:1  text-dim                 on card                 
  AA     5.87:1  text-dim                 on card-alt             
  FAIL   3.21:1  text-faint               on bg                   
  FAIL   2.90:1  text-faint               on card                 
  AA     3.21:1  text-faint               on bg                   large
  AAA   17.28:1  on-primary               on primary              
  AAA   11.12:1  on-pastel                on pastel-blue          
  AAA   10.33:1  on-pastel                on pastel-green         
  AAA   11.56:1  on-pastel                on pastel-purple        
  AAA   10.46:1  on-pastel                on pastel-mint          
  AAA   10.48:1  on-pastel                on pastel-peach         
  AAA   11.61:1  on-pastel                on pastel-pink          
  AAA    8.95:1  on-pastel                on pastel-yellow        
  AAA   16.42:1  tab-active               on tab-bar              
  FAIL   3.05:1  tab-inactive             on tab-bar              
  FAIL   2.03:1  component-on-color       on pink                 
  AA     6.87:1  danger                   on bg                   
  AA     6.22:1  danger                   on card                 
  AAA    9.89:1  success                  on bg                   
  AAA    8.95:1  success                  on card                 
  AAA   10.30:1  warn                     on card                 
  FAIL   2.77:1  component-on-color       on danger               
  FAIL   1.92:1  component-on-color       on success              
  FAIL   2.44:1  component-on-color       on coral                
  FAIL   1.67:1  component-on-color       on warn                 
  FAIL   3.20:1  component-on-color       on purple               
  FAIL   3.68:1  component-on-color       on gradient-ai-start    
  FAIL   2.19:1  component-on-color       on gradient-ai-end      
  FAIL   4.17:1  component-on-color       on gradient-lucky-start 
  FAIL   2.30:1  component-on-color       on gradient-wheel-top   large
  AAA    4.54:1  orange                   on gradient-streak-dark-mid large
  AAA    5.96:1  component-streak-unit    on gradient-streak-dark-mid large
  AA     5.94:1  purple                   on bg                   
  FAIL   1.29:1  border                   on card                 ui
  FAIL   1.42:1  border                   on bg                   ui
  FAIL   1.47:1  component-ink            on pastel-blue          ui
  FAIL   1.58:1  component-ink            on pastel-green         ui

  41 pairs, 17 failing AA
```

## Başarısız çiftler ve öneriler (düzeltme yapılmadı)

Öneri değerleri aynı araçla tek çift modunda ölçüldü (`contrast.py "#fg" "#bg"`).

| # | tema | çift | oran | nerede | öneri | öneri oranı |
|---|---|---|---|---|---|---|
| 1 | açık | text-faint `#A3A8B3` / bg, card | 2.24 / 2.38 | Yeni Görev başlığı "New Task" + "Tap to rename", medicalNote altyazıları, input placeholder (24 yerde `faint`) | Okunması gereken metinde `textDim` kullan; `textFaint`'i yalnız devre dışı/dekoratif öğeye bırak. Ya da `textFaint` → `#6B7280` düzeyine yaklaştır (ayrı ton kalmaz). | `#6B7280`: 4.54 bg / 4.83 card |
| 2 | açık | text-dim `#6B7280` / card-alt `#EEEEF6` | 4.19 | segment/boş bar yüzeyindeki ikincil metin | `textDim` → `#5B6370` | 5.25 card-alt |
| 3 | açık | tab-inactive `#A3A8B3` / tab-bar | 2.38 | pasif sekme etiketleri (12px) | `tabInactive` → `#6B7280` | 4.83 |
| 4 | açık | beyaz / pink `#FF7AE0` | 2.30 | ortadaki "Çark/Wheel" hap etiketi (`app/(tabs)/_layout.tsx`) ve çark başlığı (gradyan üstü, büyük) | Etikette yazıyı `#14171A` yap (hap pembe kalsın) ya da hap zeminini `#C2189A` yap | 7.81 / 5.40 |
| 5 | açık | danger `#EF4444` / bg, card | 3.53 / 3.76 | gecikmiş teslim, hata metinleri (11 yerde metin rengi) | `danger` → `#DC2626` (bg 4.53) ya da `#B91C1C` | 4.53 / 6.47 |
| 6 | açık | success `#22C55E` / bg, card | 2.14 / 2.28 | "+puan" metni (rutin, yarış, sigara) | metin için `#15803D` (dolgu rengi olarak `#22C55E` kalabilir; ayrı `successText` rolü) | 4.71 / 5.02 |
| 7 | açık | warn `#F59E0B` / card | 2.15 | uyarı metinleri | metin için `#B45309` | 5.02 |
| 8 | açık | purple `#7C5CFC` / bg | 4.11 | Harekete Geç "+N puan", vurgu metni | metin için `#6D4AE8` | 5.19 |
| 9 | iki tema | beyaz / coral, warn, success | 2.83 / 2.15 / 2.28 (koyu: 2.44 / 1.67 / 1.92) | onboarding sonuç ekranı seviye hapları (`app/onboarding.tsx`, 14px/800) | Hap yazısını `#14171A` yap; renkler aynı kalabilir | 6.36 / 8.38 / 7.90 (koyu: 7.37 / 10.78 / 9.36) |
| 10 | iki tema | beyaz / danger | 3.76 (koyu 2.77) | sil/tehlike butonu yazısı | açık: `#DC2626` zemin; koyu: yazıyı `#14171A` | 4.83 / 6.50 |
| 11 | iki tema | beyaz / gradyan `ai` (`#5B7CFA`→`#F08BEA`), `lucky` (`#6C6CF0`) | 3.68 / 2.19 / 4.17 | Yeni Görev: "Gününü akıllı planla", "Şanslı görevini çevir" kartları (18px kalın başlık + 14px üst satır) | `ai` gradyanının açık ucunu koyulaştır (ör. `#4F5BD5`→`#8E4FE0`) ya da yazıyı koyu yap; `lucky` başlangıcı `#5B5BE0` | 5.54 / 4.83 / 5.23 |
| 12 | açık | beyaz / purple `#7C5CFC` | 4.38 | araçlar afişi, mor dolgu üstü küçük yazılar (büyük başlıklar geçer) | küçük yazıda `#6D4AE8` zemin ya da yazıyı büyüt | 5.53 |
| 13 | açık | beyaz / orange `#FF8A1F` | 2.36 | Seri ekranı teşvik afişi (h3 18px kalın, beyaz) | yazıyı `#14171A` yap ya da afiş zeminini `#C2410C` yap | 7.63 / 5.18 |
| 14 | açık | orange `#FF8A1F` / streak-mid `#FFC37A` (büyük) | 1.50 | Seri ekranındaki büyük gün sayısı | sayıyı `#C2410C` yap (büyük metin eşiği 3) | 3.29 |
| 15 | açık | streak-unit `#F5A35A` / krem `#FFF1E0` (büyük) | 1.84 | "gün serisi / day streak" | `#B45309` | 4.52 |
| 16 | açık | border `#E6E6EF` / card, bg (ui) | 1.24 / 1.16 | `Field` input çerçevesi (`src/components/ui.tsx`), pasif Chip çerçevesi | ayrı `borderInput` rolü: `#8A8F9A` (kart sınırları için `border` kalsın) | 3.24 (card) |
| 17 | koyu | text-faint `#5E6472` / bg, card | 3.21 / 2.90 | aynı yerler (madde 1) | `#868D99` | 5.15 card |
| 18 | koyu | tab-inactive `#5E6472` / tab-bar | 3.05 | pasif sekme etiketleri | `#7E8592` | 4.87 |
| 19 | koyu | beyaz / pink `#FF8FE6` | 2.03 | "Çark" hap etiketi | yazıyı `#14171A` | 8.84 |
| 20 | koyu | beyaz / purple `#957BFF` | 3.20 | mor dolgu üstü yazılar | yazıyı `#14171A` ya da zemini `#7C3AED` | 5.62 / 5.70 |
| 21 | koyu | border `#2A2F3C` / card, bg (ui) | 1.29 / 1.42 | input çerçevesi | `borderInput` `#6B7280` | 3.56 |
| 22 | koyu | ink `#14171A` / koyu pastel (ui) | 1.47 / 1.58 | onboarding "Senin için seçtiklerimiz" adımındaki seçim halkası (`app/onboarding.tsx` sabit `#14171A`) — koyu temada görünmüyor | sabit `#14171A` yerine `t.onPastel` | (onPastel/pastel 8.9-11.6) |

Geçen ama sınırda: açık `text-dim` / bg 4.54 (eşik 4.5) — madde 2'deki `#5B6370` iki zeminde de rahat geçer.

Öncelik: 1, 3, 4, 9, 13-15 ve 16 en sık görülen ekranlarda (Yeni Görev, sekme çubuğu, onboarding, Seri); hepsi
`src/theme/index.ts` rol değerleri + 4-5 sabit renk değişikliğiyle kapanır. Bir değer değiştikten sonra iki token
dosyası güncellenip `contrast.py` yeniden çalıştırılmalı.
