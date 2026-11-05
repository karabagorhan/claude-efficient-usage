# LinkedIn Skills - Kurulum Notu

Kaynak: https://github.com/sergebulaev/linkedin-skills (MIT)

Bu klasör upstream paketin kopyasıdır. 12 skill `.claude/skills/` altından
sembolik bağlantıyla yüklenir; bu repoyu açan her Claude Code oturumunda aktiftir.

## Şu an çalışan mod: sadece taslak
API anahtarı olmadan skill'ler taslak üretir, siz LinkedIn'e yapıştırırsınız.
Doğrulama: `python3 linkedin-skills/scripts/selftest.py`

## İsteğe bağlı: otomatik yayın / okuma
1. `cp linkedin-skills/.env.example linkedin-skills/.env` ve değerleri doldurun
   (`.env` .gitignore ile korunur, asla commit etmeyin).
   - `PUBLORA_API_KEY`, `LINKEDIN_PLATFORM_ID`: onaylı gönderi/yorumu yayınlar
   - `APIFY_TOKEN`: gönderi, yorum ve etkileşimleri otomatik okur
   - `PIXFARO_TOKEN`: görsel üretir
2. `pip install requests python-dotenv`
3. `python3 linkedin-skills/scripts/check_config.py`

## Önerilen başlangıç sırası
1. "linkedin-interviewer ile beni röportaj yap" (Story Bank)
2. "LinkedIn profilimi optimize et"
3. "7 günlük LinkedIn içerik planı çıkar"
