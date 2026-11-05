# Proje Notları

## LinkedIn skill'leri (`linkedin-skills/`, `.claude/skills/`)

Kullanıcı: Orhan Karabağ (linkedin.com/in/orhankarabag). Publora platform ID: `linkedin-LeRrZ6soRO`.

### Gönderi formatı (kalıcı kural)
Her LinkedIn gönderisi (post-writer, repurposer ve gönderi üreten tüm skill'ler) iki dilli hazırlanır:

1. Üstte **Türkçe** metin.
2. Altında tek satır `-----` ayıracı.
3. Onun altında aynı gönderinin **İngilizcesi**.

- İngilizce, Türkçenin kelime kelime çevirisi değil, aynı mesajın doğal İngilizce karşılığı olur.
- Rakamlar, isimler ve hashtag'ler iki sürümde aynı kalır.
- Hook (ilk 2-3 satır) iki dilde de "daha fazla gör" kesiminden önce etkili olmalı.
- Onay kartında tüm metin tek parça gösterilir; Publora'ya ayıracıyla birlikte tek gönderi olarak gider.
- Yorum ve yanıt taslakları için ayrıca belirtilmedikçe tek dil (gönderinin diliyle aynı) kullanılır.

### Güvenlik
- Hiçbir şey kullanıcı onayı olmadan yayınlanmaz.
- `.env` ve API anahtarları commit edilmez. Publora anahtarı ağ proxy'sinden eklenir; `.env`'de `proxy-injected` yer tutucusu durur.
