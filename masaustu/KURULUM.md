# Masaüstü Uygulamasına Kurulum

`dogal-yazim.zip` dosyası, Claude masaüstü uygulamasında (ve claude.ai'de) kullanılacak skill paketidir.

1. Bu klasördeki `dogal-yazim.zip` dosyasını bilgisayarınıza indirin.
2. Claude masaüstü uygulamasını açın: **Ayarlar (Settings) > Özellikler (Capabilities) > Skills**. Menü adları sürüme göre biraz değişebilir, "Customize" altında da olabilir.
3. **Skill yükle (Upload skill)** seçeneğine tıklayıp zip dosyasını seçin.
4. Skill listesinde `dogal-yazim` görünür ve açık olmalı.
5. Yeni bir sohbet başlatıp deneyin: "Müdüre TK-12 chiller yenileme onayı için kısa e-posta yaz."

Notlar:
- Zip içinde `ornekler.md` boş şablon olarak gelir. Gerçek yazı örneklerinizi eklemek isterseniz `.claude/skills/dogal-yazim/ornekler.md` dosyasını düzenleyip zip'i yeniden oluşturun veya Claude'dan oluşturmasını isteyin, sonra skill'i yeniden yükleyin.
- Masaüstü uygulamasının **Code** sekmesinde bu repoyu yerel klasör olarak açarsanız `.claude/skills/` altındaki skill zaten otomatik yüklenir. Zip yalnızca normal sohbetler için gerekir.
