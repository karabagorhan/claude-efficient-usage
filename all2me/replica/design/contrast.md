# Kontrast denetimi (replica-design / contrast.py)

Tarih: 2026-11-11. Kaynak: `src/theme/index.ts` (light, dark, PASTELS, GRADIENTS) + ekranlarda sabit yazılmış,
tekrar eden renkler (`component-*`, kaynakları token dosyalarının `_sources` alanında).
Komut (repo dışından, yalıtılmış):

```
python3 -I replica-design/contrast.py replica/design/tokens.light.json
python3 -I replica-design/contrast.py replica/design/tokens.dark.json
```

Eşikler (WCAG 2.2 AA): normal metin 4.5, büyük metin (≥24px ya da ≥18.66px kalın) 3, UI sınırı/odak halkası 3.
Not: 12-14px kalın hap etiketleri (sekme "Çark" hapı, onboarding seviye hapları) büyük metin sayılmaz.

**Sonuç: açık tema 42 çiftin 26'sı, koyu tema 41 çiftin 17'si AA'yı geçemiyor. İki dosya da exit 1.**
Çekirdek okuma çiftleri (metin/zemin, metin/kart, ana buton, pastel kart üstü metin, etkin sekme) iki temada
da AAA. Başarısızlıklar ikincil gri tonlar, anlamsal renklerin metin olarak kullanımı, beyaz-yazılı renkli
haplar/gradyan kartlar ve input sınırında toplanıyor.

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
