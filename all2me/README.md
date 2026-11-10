# All2Me

Günlük rutin + kendine bakım uygulaması (Expo SDK 58, expo-router, TypeScript). Şartname: `docs/SPEC.md`,
geliştirici sözleşmesi: `docs/CONTRACTS.md`.

## Komutlar

```bash
npm install
npx expo start            # geliştirme sunucusu (Expo Go)
npm test                  # motor + çekirdek store testleri (tsx)
npm run typecheck         # tsc --noEmit
npx expo export --platform web   # dist/ (web önizleme)
```

## Bulut (isteğe bağlı)

`.env.example` → `.env`; `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_KEY` doldurun, Supabase SQL
editöründe `supabase/0001_init.sql` çalıştırın, anonim girişi açın. Boşsa uygulama yerel modda çalışır.

## Ekran görüntüleri (web önizleme)

```bash
npx expo export --platform web
node scripts/shots.mjs --seed --lang tr "rutin=/" "araclar=/tools" "su=/tools/drink"
# → shots/rutin.png, shots/araclar.png, shots/su.png  (390x844)
```

Seçenekler:

| Seçenek | Anlam |
|---|---|
| `ad=/rota` ya da `/rota` | Çekilecek rota (çoklu). Ad verilmezse rotadan türetilir. Varsayılan: `/`, `/tools`, `/wheel` |
| `--seed` | localStorage'a demo durum yazar: profil, 5 görev, birkaç tamamlama, `onboarded=true` |
| `--lang tr\|en` | Arayüz dili (seed olmadan da çalışır; seed yoksa onboarding açılır) |
| `--theme light\|dark` | Tema (varsayılan light) |
| `--wait 1200` | Sayfa yüklendikten sonra bekleme (ms) |
| `--out shots` / `--dist dist` | Çıktı / export klasörü |

Betik `dist/`'i yerel bir HTTP sunucusuyla (SPA fallback) servis eder ve ön kurulu Playwright Chromium'u
kullanır (`playwright install` gerekmez). Konsol uyarı/hatalarını sonda listeler. `shots/` git'e girmez.
