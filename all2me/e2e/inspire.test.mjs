/** F06 İlham (SPEC 3.7): şablon ekle (tek / hepsi), favori, arama (Türkçe İ/ı), kategori, test (quiz). Akıllı planlayıcı F07. */
import { assert, tapButtonWhere } from './lib.mjs';

const topRight = (b) => b.y < 100 && b.x > 300;

export default [
  {
    id: 'F06-H1', name: 'İlham sekmesi: başlık, kategori ikonları, bölümler, afiş görünür', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/inspire', 900);
      await s.expectText(s.t('inspire.title'));
      await s.expectText('Temizlik');
      await s.expectText('Evi Temiz Tut', 'şablon kartı');
      await s.shot('inspire-tab');
    },
  },
  {
    id: 'F06-H2', name: 'şablon detayı: tek madde ekle → "Eklendi"; "Hepsini rutine ekle" kalan maddeleri ekler; tekrar eklenmez', opts: { lang: 'tr', seedOpts: { noHabits: true, withHistory: false } },
    run: async (s) => {
      await s.goto('/inspire/clean-home-basics', 900);
      await s.expectText('Evi Temiz Tut');
      const addBtns = s.page.getByRole('button', { name: s.t('inspire.detail.add'), exact: true });
      const n0 = await addBtns.count();
      assert.ok(n0 >= 6, `madde sayısı ${n0}`);
      await addBtns.first().click();
      await s.page.waitForTimeout(400);
      let habits = Object.values((await s.store('core')).habits).filter((h) => h.source === 'inspire:clean-home-basics');
      assert.equal(habits.length, 1);
      assert.equal(await addBtns.count(), n0 - 1, 'eklenen madde "Eklendi" durumuna geçmeli');
      await s.btn(s.t('inspire.detail.addAll'));
      await s.page.waitForTimeout(400);
      habits = Object.values((await s.store('core')).habits).filter((h) => h.source === 'inspire:clean-home-basics');
      assert.equal(habits.length, n0, `hepsi eklenmeli, tekrar yok (${habits.length} / ${n0})`);
      await s.expectText(s.t('inspire.detail.allAdded'));
      await s.shot('inspire-detail-added');
      // ana ekranda görünür
      await s.goto('/', 700);
      const first = habits[0].title;
      await s.expectText(first, 'rutinde görünmeli', { exact: true });
    },
  },
  {
    id: 'F06-H3', name: 'favori: kalbe dokun → Favoriler listesinde; tekrar dokun → kalkar', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/inspire/clean-home-basics', 800);
      await tapButtonWhere(s, topRight);
      await s.page.waitForTimeout(300);
      let fav = (await s.store('favorites')).favorites;
      assert.deepEqual(fav, ['clean-home-basics']);
      await s.goto('/inspire/favorites', 700);
      await s.expectText('Evi Temiz Tut');
      await s.expectText(s.t('inspire.templatesCount', { n: 1 }));
      await s.shot('inspire-favorites');
      await s.goto('/inspire/clean-home-basics', 700);
      await tapButtonWhere(s, topRight);
      await s.page.waitForTimeout(300);
      fav = (await s.store('favorites')).favorites;
      assert.deepEqual(fav, []);
      await s.goto('/inspire/favorites', 700);
      await s.expectText(s.t('inspire.favorites.emptyTitle'), 'boş durum');
    },
  },
  {
    id: 'F06-E1', name: 'arama: Türkçe İ/ı ve aksan duyarsız (ODEV, ödev, SINAV, ısınma/ISINMA, GECESİ, şükran)', opts: { lang: 'tr' },
    run: async (s) => {
      const cases = [['ODEV', 'Ödev Rutini'], ['ödev', 'Ödev Rutini'], ['SINAV', 'Sınav Haftası'], ['sinav', 'Sınav Haftası'], ['GECESİ', 'Şükran Gecesi'], ['GECESI', 'Şükran Gecesi'], ['SUKRAN', 'Şükran Gecesi'], ['yavaslama', 'Yavaşlama Saati'], ['YAVAŞLAMA', 'Yavaşlama Saati'], ['cAmasir', 'Çamaşır Günü Planı']];
      await s.goto('/inspire/search', 700);
      const f = s.page.getByPlaceholder(s.t('inspire.search.placeholder'));
      for (const [q, want] of cases) {
        await f.fill(q);
        await s.page.waitForTimeout(350);
        if (!(await s.seen(want, { exact: false, timeout: 1500 }))) {
          throw new Error(`"${q}" araması "${want}" şablonunu bulmalı; sayfa: ${(await s.body()).replace(/\n+/g, ' | ').slice(0, 300)}`);
        }
      }
      await s.shot('inspire-search');
    },
  },
  {
    id: 'F06-E2', name: 'arama: sonuç yok → boş durum; boşluklar/emoji/çok uzun sorgu çökmez; ?q= parametresi', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/inspire/search?q=zzzxxqq', 800);
      await s.expectText(s.t('inspire.search.noResults'));
      const f = s.page.getByPlaceholder(s.t('inspire.search.placeholder'));
      await f.fill('   ');
      await s.page.waitForTimeout(300);
      await f.fill('😀😀 ' + 'a'.repeat(300));
      await s.page.waitForTimeout(300);
      await s.expectText(s.t('inspire.search.noResults'));
      await f.fill('');
      await s.expectText(s.t('inspire.search.suggestions'), 'öneriler dönmeli');
      await s.goto('/inspire/search?q=%C4%B0%C5%9E', 800); // "İŞ"
      await s.expectText(s.t('inspire.templatesCount', { n: 1 }).replace('1', ''), 'sonuç sayısı gösterilmeli', { exact: false });
    },
  },
  {
    id: 'F06-E3', name: 'arama: madde adıyla da bulur; EN dilinde İngilizce başlıkla bulur', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/inspire/search', 700);
      const f = s.page.getByPlaceholder(s.t('inspire.search.placeholder'));
      await f.fill('Weekly reset');
      await s.expectText('The Weekly Reset');
      await f.fill('stretch');
      await s.expectText('10-Minute Stretch');
    },
  },
  {
    id: 'F06-E4', name: 'kategori sayfası: kategori şablonları listelenir ve karta dokununca detay açılır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/inspire/category/cleaning', 800);
      await s.expectText('Evi Temiz Tut');
      await s.tap('Evi Temiz Tut');
      await s.page.waitForURL(/\/inspire\/clean-home-basics/);
      await s.expectText(s.t('inspire.detail.addAll'));
    },
  },
  {
    id: 'F06-E5', name: 'olmayan şablon / test / kategori kimliği: "bulunamadı" boş durumu, çökme yok', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/inspire/yok-boyle-sablon', 700);
      await s.expectText(s.t('inspire.notFound'));
      await s.goto('/inspire/quiz/yok', 700);
      await s.expectText(s.t('inspire.quiz.notFound'));
    },
  },
  {
    id: 'F06-Q1', name: 'test (quiz): 7 soruyu yanıtla → sonuç + öneri şablonları + tanı değildir notu; sonuç saklanır; tekrar çöz', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/inspire/quiz/morning-person', 900);
      for (let i = 1; i <= 7; i++) {
        await s.expectText(s.t('inspire.quiz.question', { i, n: 7 }));
        const opts = s.page.getByRole('button').filter({ visible: true }).filter({ hasNotText: new RegExp(`${s.t('common.btn.back')}|^$`) });
        // seçenekler: Pressable button'lar (ilk 3-4)
        await opts.nth(1).click().catch(async () => opts.first().click());
        await s.page.waitForTimeout(150);
      }
      await s.expectText(s.t('inspire.quiz.result'), 'sonuç ekranı');
      await s.expectText(s.t('inspire.quiz.notDiagnosis'));
      await s.shot('inspire-quiz-result');
      const q = (await s.store('favorites')).quizResults['morning-person'];
      assert.ok(q && q.resultId, 'sonuç saklanmalı');
      await s.btn(s.t('inspire.quiz.again'));
      await s.expectText(s.t('inspire.quiz.question', { i: 1, n: 7 }), 'baştan başlamalı');
    },
  },
  {
    id: 'F06-Q2', name: 'test (quiz): Geri butonu önceki soruya döner (EN)', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/inspire/quiz/clutter-type', 800);
      const opts = s.page.getByRole('button').filter({ visible: true });
      await opts.nth(1).click();
      await s.expectText(s.t('inspire.quiz.question', { i: 2, n: 7 }));
      await s.btn(s.t('common.btn.back'));
      await s.expectText(s.t('inspire.quiz.question', { i: 1, n: 7 }));
    },
  },
];
