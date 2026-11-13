# Araç Seçim Rehberi

Bu rehber dört aracı kapsıyor: **anthropics/skills**, **Context7**, **Superpowers** ve **Playwright**. Her birinin hangi işte kullanılacağını, hangi işte kapalı tutulacağını ve maliyete etkisini özetliyor.

Temel kural şu: **Her aracı her yerde açık tutma. Projeye göre aç.** Açık olan her plugin, MCP sunucusu ve skill, işe yarasa da yaramasa da her mesajda bağlama ek token bindirir.

---

## 1. Hızlı karar tablosu

| Proje / iş türü | anthropics/skills (doküman) | Context7 | Superpowers | Playwright |
|---|:-:|:-:|:-:|:-:|
| Excel / Word / PowerPoint / PDF işi | ✅ | ❌ | ❌ | ❌ |
| Tek dosyalık basit script (CSV, Excel otomasyonu) | ✅ (gerekirse) | ✅ | ❌ | ❌ |
| Uygulama geliştirme (web, masaüstü, API) | ❌ | ✅ | ✅ | ✅ (CLI) |
| Web arayüzü testi / web'den veri çekme | ❌ | ❌ | ❌ | ✅ (CLI) |
| Hızlı soru-cevap, metin yazma | ❌ | ❌ | ❌ | ❌ |

Bu tablo `sablonlar/` klasöründeki iki şablona karşılık geliyor:
- **`sablonlar/ofis-projesi`**: Yalnızca doküman skill'leri açık. Diğer araçlar açıkça kapalı.
- **`sablonlar/uygulama-projesi`**: Superpowers ve Context7 açık. Playwright CLI ile kullanılır.

---

## 2. Araçlar tek tek

### anthropics/skills, doküman skill'leri (`xlsx`, `docx`, `pptx`, `pdf`)
- **Ne zaman:** Bir Excel, Word, PowerPoint ya da PDF dosyası okunacak, üretilecek veya düzenlenecekse.
- **Maliyet:** Düşük. Skill'ler kademeli yüklenir: bağlamda sürekli yalnızca ad ve açıklama durur, gövde ancak iş geldiğinde okunur.
- **Dikkat:** claude.ai hesabınızda bu skill'ler zaten `anthropic-skills:xlsx` gibi isimlerle açıksa plugin'i **ikinci kez kurmayın**. Aynı skill iki kez listelenir ve açıklama maliyeti ikiye katlanır.
- **Kendi skill'leriniz:** Birbiriyle örtüşen skill'leri birleştirin, açıklamaları kısa ve birbirinden ayrışan tutun. Yeni skill yazarken `skill-creator` skill'inden yararlanın.

### Context7: güncel kütüphane dokümantasyonu
- **Ne zaman:** Kod bir kütüphane ya da API kullanıyorsa (pandas, openpyxl, python-pptx, React, Next.js, FastAPI gibi).
- **Ne zaman değil:** Kod dışı işler ve standart dil özellikleri.
- **Maliyet:** Her sorgu bağlama dokümantasyon ekler. Buna karşılık eski API'den doğan "çalışmadı, düzelt" döngülerini keser ve kod işlerinde net tasarruf sağlar.
- **Kullanım:** Prompt'un sonuna `use context7` yazın. Daha ucuz kullanım için kütüphane kimliğini ve sürümü de verin:
  `pandas 2.2 ile ... use library /pandas-dev/pandas`
- **API anahtarı:** Ücretsizdir ve kullanım limitini yükseltir: <https://context7.com/dashboard>

### Superpowers: planlı geliştirme yöntemi
- **Ne zaman:** Birden fazla dosyaya yayılan, birkaç saat sürecek uygulama işleri.
- **Ne zaman değil:** Ofis işleri, tek script, küçük düzeltmeler.
- **Maliyet:** **Yüksek.** Her oturumun başında bir hook yaklaşık 3 KB'lık talimat metnini bağlama ekler. Ardından brainstorming turları, plan yazımı, alt-ajanlar ve review döngüleri gelir. Büyük işlerde bu maliyet daha az hata ve daha az tekrar olarak geri döner; küçük işlerde ise boşa gider.
- **İpucu:** Uygulama projesinde küçük bir iş yapacaksanız mesajın başına "brainstorming ve plan gerekmez, doğrudan düzelt" yazın.

### Playwright: tarayıcı otomasyonu
- **Ne zaman:** Web arayüzü testi, web portalından veri çekme, sayfayı PDF olarak kaydetme, form doldurma.
- **Tercih: CLI + skill.** Microsoft da kodlama ajanları için bunu öneriyor. MCP sürümü bütün araç tanımlarını ve sayfanın erişilebilirlik ağacını her adımda bağlama yükler; CLI sürümü yüklemez.
  Önce CLI'yi kurun:
  ```bash
  npm install -g @playwright/cli@latest
  ```
  Sonra projenin klasöründe skill'i kurun:
  ```bash
  playwright-cli install --skills
  ```
- **MCP ne zaman:** Uzun süreli, keşfe dayalı ya da kendini onaran test akışlarında. Bu durumda yalnızca o projeye ekleyin:
  ```bash
  claude mcp add playwright --scope project npx @playwright/mcp@latest
  ```
- **Alternatif:** Giriş gerektiren siteler için kendi Chrome oturumunuzla çalışan Claude in Chrome daha pratik olabilir.

---

## 3. Maliyet kuralları (özet)

1. **Global'de en az araç.** Plugin ve MCP'leri kullanıcı seviyesinde değil, proje seviyesinde (`.claude/settings.json`) açın.
2. **Aynı aracın skill/CLI sürümü varsa MCP yerine onu seçin.**
3. **Kullanmadığınız MCP'yi kapatın.** Claude Code içinde `/mcp` komutuyla.
4. **`CLAUDE.md` kısa olsun.** Her oturumda baştan sona okunur; her satırı her mesajda ödersiniz.
5. **Aynı skill'i iki kaynaktan yüklemeyin.** Hesap skill'i ile plugin skill'i çakışmasın.
6. **Ağır yöntemi (Superpowers) yalnızca ağır işe açın.**
