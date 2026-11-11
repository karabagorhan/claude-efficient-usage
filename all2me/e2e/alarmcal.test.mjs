/** Gerçek alarm (ekle/düzenle/sil, çalma ekranı Kapat/Ertele) ve takvim düğmeleri (web'de desteklenmiyor açıklaması). */
import { assert } from './lib.mjs';

const hasSwitchDisabled = async (s, name) => {
  const sw = s.page.getByRole('switch', { name });
  return (await sw.count()) > 0 && (await sw.first().isDisabled());
};

export default [
  {
    id: 'AC-A1', name: 'alarm: ekle → listede (web notu: bildirim tabanlı); düzenle; sil', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/alarm', 800);
      await s.expectText(s.t('alarm.emptyTitle'));
      await s.btn(s.t('alarm.add'));
      await s.tap(':45');
      await s.tap('Sal', { exact: true });
      await s.page.getByPlaceholder(s.t('alarm.labelPh')).fill('Sabah koşusu');
      await s.expectText(s.t('alarm.noteIos'));
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      await s.expectText('Sabah koşusu');
      await s.expectText(':45');
      let a = Object.values((await s.store('alarm')).alarms);
      assert.equal(a.length, 1);
      assert.deepEqual(a[0].days, [1]);
      assert.equal(a[0].minute, 45);
      // düzenle: etiketi değiştir
      await s.tap('Sabah koşusu', { exact: false });
      await s.expectText(s.t('alarm.editAlarm'));
      await s.page.getByPlaceholder(s.t('alarm.labelPh')).fill('Akşam yürüyüşü');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(400);
      await s.expectText('Akşam yürüyüşü');
      a = Object.values((await s.store('alarm')).alarms);
      assert.equal(a.length, 1);
      assert.equal(a[0].label, 'Akşam yürüyüşü');
      // sil
      await s.tap('Akşam yürüyüşü', { exact: false });
      await s.btn(s.t('common.btn.delete'));
      await s.page.waitForTimeout(400);
      await s.expectText(s.t('alarm.emptyTitle'));
      assert.equal(Object.values((await s.store('alarm')).alarms).length, 0);
    },
  },
  {
    id: 'AC-A2', name: 'alarm çalma ekranı: önizleme açılır; mini görev; Kapat tek seferlik alarmı kapatır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/alarm', 800);
      await s.btn(s.t('alarm.add'));
      await s.page.getByPlaceholder(s.t('alarm.labelPh')).fill('İlaç');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      let a = Object.values((await s.store('alarm')).alarms);
      assert.equal(a[0].enabled, true);
      await s.btn(s.t('alarm.preview'));
      await s.page.waitForTimeout(600);
      await s.expectText(s.t('alarm.ring.title'));
      await s.expectText('İlaç');
      await s.shot('alarm-ring');
      // mini görev: 3 nefes
      for (let i = 0; i < 3; i++) await s.btn(s.t('alarm.ring.breath', { done: i, n: 3 }));
      await s.expectText(s.t('alarm.ring.breathDone'));
      await s.btn(s.t('alarm.ring.dismiss'));
      await s.page.waitForTimeout(600);
      await s.expectText(s.t('alarm.title'));
      a = Object.values((await s.store('alarm')).alarms);
      assert.equal(a[0].enabled, false, 'tek seferlik alarm Kapat ile devre dışı kalmalı');
    },
  },
  {
    id: 'AC-A3', name: 'alarm çalma ekranı: doğrudan rota; Ertele bildirim gösterir ve ekrandan çıkar; etiketsiz başlık', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/alarm-ring?hour=7&minute=30', 900);
      await s.expectText('7:30 AM');
      await s.expectText(s.t('alarm.ring.noLabel'));
      assert.equal(s.errors.length, 0, s.errors.join('\n'));
      await s.btn(s.t('alarm.ring.snooze', { n: 10 }));
      await s.expectText(s.t('alarm.ring.snoozedToast', { n: 10 }));
      await s.page.waitForTimeout(1200);
      assert.ok(!s.path().includes('alarm-ring'), 'Ertele sonrası ekran kapanmalı: ' + s.path());
    },
  },
  {
    id: 'AC-C1', name: 'takvim (web): öğe, ders, görev düğmeleri çökmez ve "desteklenmiyor" yazar', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/study/item/new', 800);
      await s.expectText(s.t('study.calendar.itemLabel'));
      await s.expectText(s.t('study.calendar.unsupported'));
      assert.ok(await hasSwitchDisabled(s, s.t('study.calendar.itemLabel')), 'anahtar devre dışı olmalı');
      await s.goto('/study/course/new', 800);
      await s.expectText(s.t('study.calendar.courseLabel'));
      await s.expectText(s.t('study.calendar.unsupported'));
      await s.goto('/task/new', 800);
      await s.expectText(s.t('newtask.calendar.label'));
      await s.expectText(s.t('newtask.calendar.unsupported'));
      assert.equal(s.errors.length, 0, s.errors.join('\n'));
    },
  },
  {
    id: 'AC-C2', name: 'takvim (web): ayarlarda Takvim bölümü "bağlı değil" + desteklenmiyor açıklaması; kaydetmek çökmez', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/settings', 800);
      await s.expectText(s.t('settings.calendar.title'));
      await s.expectText(s.t('settings.calendar.notConnected'));
      await s.expectText(s.t('settings.calendar.unsupported'));
      // öğeyi takvim anahtarına dokunmadan kaydet: web'de sorunsuz
      await s.goto('/study/item/new', 800);
      await s.page.locator('input').first().fill('Essay');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      const items = Object.values((await s.store('study')).items);
      assert.equal(items.length, 1);
      assert.equal(Object.keys((await s.store('calendar'))?.events ?? {}).length, 0);
      assert.equal(s.errors.length, 0, s.errors.join('\n'));
    },
  },
];
