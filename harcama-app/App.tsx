import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportBackup, exportExcel, pickBackup } from './src/files';
import {
  CATS, Expense, Settings, Sub, addMonths, analyse, catIndex, dayLabel, fmtTL, fmtTL0, iso,
  monthLabel, monthlyCost, parseAmount, shortDay, subStatus, sum, todayIso, uid,
} from './src/lib';
import { ensurePermission, reschedule } from './src/notify';
import { ExpenseSheet, SettingsSheet, SubSheet } from './src/sheets';
import { merge, useAppData } from './src/store';
import { Theme, useTheme } from './src/theme';
import { Button, DailyChart, Label, Pill } from './src/ui';

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

type ExpenseSheetState = { key: number; initial: Expense | null; prefill?: { amount?: number; cat?: string } } | null;
type SubSheetState = { key: number; initial: Sub | null } | null;

// Kestirmeler / bağlantı: .../ekle?tutar=125,50&kategori=market
// "ekle" kanalına yayınlanan sürüm açılışta doğrudan Yeni harcama formunu gösterir (kestirme bağlantısı için).
const OPEN_ADD_ON_LAUNCH = process.env.EXPO_PUBLIC_OPEN_ADD === '1';

const SLUG: Record<string, string> = {
  market: 'Market', yeme: 'Yeme-İçme', ulasim: 'Ulaşım', fatura: 'Fatura',
  saglik: 'Sağlık', eglence: 'Eğlence', giyim: 'Giyim', diger: 'Diğer',
};

function Main() {
  const t = useTheme();
  const st = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { data, update } = useAppData();
  const [ym, setYm] = useState(todayIso().slice(0, 7));
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [expSheet, setExpSheet] = useState<ExpenseSheetState>(null);
  const [subSheet, setSubSheet] = useState<SubSheetState>(null);
  const [settingsKey, setSettingsKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = Linking.useLinkingURL();

  const toast = (m: string) => {
    setToastMsg(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  // Bağlantıyla açılınca formu doldur
  useEffect(() => {
    if (!url) return;
    const { path, queryParams } = Linking.parse(url);
    if (!path || !path.replace(/^\/+/, '').startsWith('ekle')) return;
    const amount = parseAmount(String(queryParams?.tutar ?? ''));
    const cat = SLUG[String(queryParams?.kategori ?? '').toLowerCase()];
    setExpSheet({ key: Date.now(), initial: null, prefill: { amount: amount || undefined, cat } });
  }, [url]);

  // Kestirme sürümü: açılışta ve arka plandan her dönüşte formu aç (zaten açık bir form varsa dokunma)
  const anySheetOpen = useRef(false);
  anySheetOpen.current = !!expSheet || !!subSheet || settingsOpen;
  useEffect(() => {
    if (!OPEN_ADD_ON_LAUNCH) return;
    setExpSheet({ key: Date.now(), initial: null });
    let wasBackground = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') wasBackground = true;
      if (state === 'active' && wasBackground) {
        wasBackground = false;
        if (!anySheetOpen.current) setExpSheet({ key: Date.now(), initial: null });
      }
    });
    return () => sub.remove();
  }, []);

  // Bildirimleri veri değiştikçe yeniden kur (art arda değişikliklerde bir kez)
  useEffect(() => {
    if (!data) return;
    const h = setTimeout(() => reschedule(data.settings, data.subs, data.items), 1200);
    return () => clearTimeout(h);
  }, [data]);

  if (!data) {
    return (
      <View style={[st.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  const { items, subs, settings } = data;
  const a = analyse(items, ym);
  const monthItems = items.filter((x) => x.date.slice(0, 7) === ym);
  const today = todayIso();
  const budget = settings.budget;

  /* ---------- Eylemler ---------- */
  const saveExpense = (e: Expense) => {
    const isNew = !items.some((x) => x.id === e.id);
    update((d) => ({ ...d, items: d.items.filter((x) => x.id !== e.id).concat([e]) }));
    setExpSheet(null);
    setYm(e.date.slice(0, 7));
    toast(isNew ? 'Harcama eklendi.' : 'Harcama güncellendi.');
  };
  const deleteExpense = (id: string) => {
    update((d) => ({ ...d, items: d.items.filter((x) => x.id !== id) }));
    setExpSheet(null);
    toast('Harcama silindi.');
  };
  const saveSub = (s: Sub) => {
    update((d) => ({ ...d, subs: d.subs.filter((x) => x.id !== s.id).concat([s]) }));
    setSubSheet(null);
  };
  const deleteSub = (id: string) => {
    update((d) => ({ ...d, subs: d.subs.filter((x) => x.id !== id) }));
    setSubSheet(null);
  };
  const paySub = (s: Sub) => {
    const sst = subStatus(s, items);
    const e: Expense = { id: uid(), amount: s.amount, cat: s.cat, note: s.name, date: iso(sst.due), ts: Date.now(), sub: s.id, period: sst.period };
    update((d) => ({ ...d, items: d.items.concat([e]) }));
    toast(`${s.name} harcamalara eklendi.`);
  };
  const skipSub = (s: Sub) => {
    const period = subStatus(s, items).period;
    update((d) => ({ ...d, subs: d.subs.map((x) => (x.id === s.id ? { ...x, skip: period } : x)) }));
  };
  const changeSettings = async (next: Settings) => {
    const turnedOn = (next.remind && !settings.remind) || (next.subRemind && !settings.subRemind);
    update((d) => ({ ...d, settings: next }));
    if (next.budget !== settings.budget) toast(next.budget ? 'Bütçe kaydedildi.' : 'Bütçe kaldırıldı.');
    if (turnedOn && !(await ensurePermission())) {
      toast('Bildirim izni yok. iPhone Ayarlar > Expo Go > Bildirimler bölümünden açabilirsin.');
    }
  };
  const doExport = async (which: string | null) => {
    try {
      const ok = await exportExcel(items, subs, which);
      if (!ok) toast(which ? 'Bu ay aktarılacak harcama yok.' : 'Henüz aktarılacak harcama yok.');
    } catch {
      toast('Excel dosyası oluşturulamadı.');
    }
  };
  const doBackup = async () => {
    try {
      await exportBackup(data);
    } catch {
      toast('Yedek dosyası oluşturulamadı.');
    }
  };
  const doRestore = async () => {
    try {
      const incoming = await pickBackup();
      if (!incoming) return;
      let added = 0;
      update((d) => {
        const r = merge(d, incoming);
        added = r.added;
        return r.data;
      });
      setTimeout(() => toast(added ? `${added} kayıt eklendi.` : 'Yedekteki kayıtlar zaten var.'), 50);
    } catch (e) {
      toast(e instanceof Error && e.message.includes('yedeği') ? e.message : 'Dosya okunamadı. Harcama Defteri yedeği seçtiğinden emin ol.');
    }
  };

  /* ---------- Analiz kutuları ---------- */
  const tiles: { label: string; value: string; sub?: React.ReactNode }[] = [];
  if (!monthItems.length) {
    ['Günlük ortalama', 'Geçen aya göre', 'En yoğun gün', a.isCur ? 'Ay sonu tahmini' : 'İşlem sayısı'].forEach((l) => tiles.push({ label: l, value: '—' }));
  } else {
    tiles.push({ label: 'Günlük ortalama', value: fmtTL0(a.avg), sub: <Text style={st.tileSub}>{a.elapsed} güne göre</Text> });
    if (a.prevSame > 0) {
      const r = Math.round(((a.curSame - a.prevSame) / a.prevSame) * 100);
      tiles.push({
        label: 'Geçen aya göre',
        value: `${r > 0 ? '+' : r < 0 ? '−' : ''}%${Math.abs(r)}`,
        sub: <Pill kind={r > 0 ? 'up' : r < 0 ? 'down' : 'flat'} label={r > 0 ? 'daha fazla' : r < 0 ? 'daha az' : 'aynı'} t={t} />,
      });
    } else {
      tiles.push({ label: 'Geçen aya göre', value: '—', sub: <Text style={st.tileSub}>Geçen ay kayıt yok</Text> });
    }
    tiles.push({ label: 'En yoğun gün', value: fmtTL0(a.perDay[a.topDay!]), sub: <Text style={st.tileSub}>{shortDay(a.topDay!)}</Text> });
    if (a.isCur) {
      tiles.push({
        label: 'Ay sonu tahmini',
        value: fmtTL0(a.projection),
        sub: budget ? <Pill kind={a.projection > budget ? 'up' : 'down'} label={a.projection > budget ? 'bütçeyi aşar' : 'bütçe içinde'} t={t} /> : <Text style={st.tileSub}>bu hızla giderse</Text>,
      });
    } else {
      tiles.push({ label: 'İşlem sayısı', value: String(monthItems.length), sub: <Text style={st.tileSub}>ortalama {fmtTL0(a.total / monthItems.length)}</Text> });
    }
  }

  /* ---------- Kategoriler ---------- */
  const by: Record<string, number> = {};
  const cnt: Record<string, number> = {};
  monthItems.forEach((x) => {
    by[x.cat] = (by[x.cat] || 0) + x.amount;
    cnt[x.cat] = (cnt[x.cat] || 0) + 1;
  });
  const catRows = Object.keys(by).sort((p, q) => by[q] - by[p]);

  /* ---------- Abonelikler ---------- */
  const rank = { pending: 0, upcoming: 1, paid: 2, skipped: 2 };
  const subRows = subs
    .map((s) => ({ s, x: subStatus(s, items) }))
    .sort((p, q) => rank[p.x.state] - rank[q.x.state] || ('next' in p.x ? p.x.next : p.x.due).getTime() - ('next' in q.x ? q.x.next : q.x.due).getTime());
  const subMonthly = subs.reduce((s, x) => s + monthlyCost(x), 0);

  /* ---------- Liste ---------- */
  const shown = monthItems.filter((x) => (!filterCat || x.cat === filterCat) && (!filterDay || x.date === filterDay));
  const groups: Record<string, Expense[]> = {};
  shown.forEach((x) => (groups[x.date] = groups[x.date] || []).push(x));
  const days = Object.keys(groups).sort().reverse();

  const left = budget - a.total;

  return (
    <View style={st.root}>
      <StatusBar style={t.statusBar} />
      <ScrollView contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 110 }]}>
        {/* Başlık ve ay seçici */}
        <View style={st.header}>
          <Text style={st.h1}>Harcama Defteri</Text>
          <Pressable onPress={() => { setSettingsKey(Date.now()); setSettingsOpen(true); }} hitSlop={10} accessibilityRole="button">
            <Text style={st.link}>Ayarlar</Text>
          </Pressable>
        </View>
        <View style={st.months}>
          <Pressable style={st.mBtn} onPress={() => { setYm(addMonths(ym, -1)); setFilterDay(null); }} accessibilityLabel="Önceki ay">
            <Text style={st.mBtnTxt}>‹</Text>
          </Pressable>
          <Text style={st.mLabel}>{monthLabel(ym)}</Text>
          <Pressable
            style={[st.mBtn, { opacity: a.isCur ? 0.35 : 1 }]}
            disabled={a.isCur}
            onPress={() => { setYm(addMonths(ym, 1)); setFilterDay(null); }}
            accessibilityLabel="Sonraki ay"
          >
            <Text style={st.mBtnTxt}>›</Text>
          </Pressable>
        </View>

        {/* Özet */}
        <View style={st.hero}>
          <View>
            <Label t={t} color={t.accentFg}>{a.isCur ? 'Bugün harcanan' : 'Günlük ortalama'}</Label>
            <Text style={st.heroBig}>{a.isCur ? fmtTL(sum(items.filter((x) => x.date === today))) : fmtTL(a.avg)}</Text>
          </View>
          <View style={st.heroRow}>
            <View>
              <Label t={t} color={t.accentFg}>{a.isCur ? 'Bu ay' : 'Ay toplamı'}</Label>
              <Text style={st.heroMid}>{fmtTL(a.total)}</Text>
            </View>
            <Pressable onPress={() => { setSettingsKey(Date.now()); setSettingsOpen(true); }} hitSlop={8}>
              <Text style={st.heroLink}>{budget ? `Bütçe: ${fmtTL0(budget)}` : 'Bütçe belirle'}</Text>
            </Pressable>
          </View>
          {budget ? (
            <View style={{ gap: 8 }}>
              <View style={st.track}>
                <View style={[st.fill, { width: `${Math.min(100, (a.total / budget) * 100)}%`, backgroundColor: a.total > budget ? t.warnSoft : t.accentFg }]} />
              </View>
              <View style={st.heroRow}>
                <Text style={st.heroSmall}>{left >= 0 ? `${fmtTL0(left)} kaldı` : `${fmtTL0(-left)} aşıldı`}</Text>
                <Text style={st.heroSmall}>
                  {a.isCur && left > 0 ? `kalan günlerde günde ${fmtTL0(left / (a.dim - a.elapsed + 1))}` : `%${Math.round((a.total / budget) * 100)} kullanıldı`}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Analiz kutuları */}
        <View style={st.tiles}>
          {tiles.map((x) => (
            <View key={x.label} style={st.tile}>
              <Label t={t}>{x.label}</Label>
              <Text style={st.tileVal}>{x.value}</Text>
              {x.sub}
            </View>
          ))}
        </View>

        {/* Abonelikler */}
        <View style={st.card}>
          <View style={st.cardHead}>
            <Label t={t}>Abonelikler</Label>
            <Pressable style={st.addBtn} onPress={() => setSubSheet({ key: Date.now(), initial: null })}>
              <Text style={{ color: t.fg, fontWeight: '600', fontSize: 14 }}>+ Abonelik</Text>
            </Pressable>
          </View>
          {subs.length ? (
            <>
              <View style={st.subSum}>
                <View><Text style={st.subSumVal}>{fmtTL(subMonthly)}</Text><Text style={st.tileSub}>aylık</Text></View>
                <View><Text style={st.subSumVal}>{fmtTL0(subMonthly * 12)}</Text><Text style={st.tileSub}>yıllık</Text></View>
                {budget ? <View><Text style={st.subSumVal}>%{Math.round((subMonthly / budget) * 100)}</Text><Text style={st.tileSub}>bütçenin</Text></View> : null}
              </View>
              {subRows.map(({ s, x }, i) => (
                <View key={s.id} style={[st.subWrap, i > 0 && st.topLine]}>
                  <Pressable onPress={() => setSubSheet({ key: Date.now(), initial: s })} style={st.subRow} accessibilityLabel={`${s.name}, düzenle`}>
                    <View style={[st.dot, { backgroundColor: t.cats[catIndex(s.cat)] }]} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={st.itemCat}>{s.name}</Text>
                      <View style={st.metaRow}>
                        <Text style={st.meta}>{s.freq === 'yearly' ? `Yıllık · ${s.day} ${monthLabel(`2000-${String(s.month).padStart(2, '0')}`).split(' ')[0]}` : `Her ay ${s.day}. gün`}</Text>
                        {x.state === 'pending' ? <Pill kind="up" label={`Bekliyor · ${shortDay(iso(x.due))}`} t={t} /> : null}
                        {x.state === 'upcoming' ? <Pill kind="flat" label={`${x.days} gün sonra`} t={t} /> : null}
                        {x.state === 'paid' || x.state === 'skipped' ? (
                          <Pill kind={x.state === 'paid' ? 'down' : 'flat'} label={`${x.state === 'paid' ? 'Ödendi' : 'Atlandı'} · sonraki ${shortDay(iso(x.next))}`} t={t} />
                        ) : null}
                      </View>
                    </View>
                    <Text style={st.itemAmt}>
                      {fmtTL(s.amount)}
                      <Text style={st.meta}>/{s.freq === 'yearly' ? 'yıl' : 'ay'}</Text>
                    </Text>
                  </Pressable>
                  {x.state === 'pending' ? (
                    <View style={st.subAct}>
                      <Button label="Ödendi olarak işaretle" onPress={() => paySub(s)} t={t} style={st.smallBtn} />
                      <Button label="Bu dönemi atla" kind="ghost" onPress={() => skipSub(s)} t={t} style={st.smallBtn} />
                    </View>
                  ) : null}
                </View>
              ))}
            </>
          ) : (
            <Text style={st.meta}>Netflix, Spotify, telefon, spor salonu gibi düzenli ödemelerini ekle. Ödeme günü gelince burada onayını bekler.</Text>
          )}
        </View>

        {/* Günlük grafik */}
        <View style={st.card}>
          <View style={st.cardHead}>
            <Label t={t}>Günlük harcama</Label>
            <View style={st.legend}>
              <View style={st.legendItem}><View style={[st.dash, { borderColor: t.muted }]} /><Text style={st.legendTxt}>Ortalama</Text></View>
              {budget ? <View style={st.legendItem}><View style={[st.dash, { borderColor: t.warn }]} /><Text style={st.legendTxt}>Günlük bütçe</Text></View> : null}
            </View>
          </View>
          <DailyChart a={a} ym={ym} budget={budget} selected={filterDay} onSelect={(d) => setFilterDay(filterDay === d ? null : d)} t={t} />
          <Text style={st.meta}>
            {filterDay ? `${dayLabel(filterDay)}: ${fmtTL(a.perDay[filterDay] || 0)}` : 'Bir güne dokunarak o günün harcamalarını listele.'}
          </Text>
        </View>

        {/* Kategoriler */}
        <View style={st.card}>
          <View style={st.cardHead}>
            <Label t={t}>Kategorilere göre</Label>
            {monthItems.length ? <Label t={t}>{`${monthItems.length} işlem`}</Label> : null}
          </View>
          {catRows.length ? (
            <>
              <View style={st.stack}>
                {catRows.map((c) => (
                  <View key={c} style={{ flex: by[c], backgroundColor: t.cats[catIndex(c)] }} />
                ))}
              </View>
              {catRows.map((c, i) => (
                <Pressable
                  key={c}
                  onPress={() => setFilterCat(filterCat === c ? null : c)}
                  style={[st.catRow, i > 0 && st.topLine, filterCat === c && { backgroundColor: t.accentSoft, borderRadius: 10 }]}
                  accessibilityState={{ selected: filterCat === c }}
                >
                  <View style={[st.dot, { backgroundColor: t.cats[catIndex(c)] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.itemCat}>{c}</Text>
                    <Text style={st.meta}>%{Math.round((by[c] / a.total) * 100)} · {cnt[c]} işlem</Text>
                  </View>
                  <Text style={st.itemAmt}>{fmtTL(by[c])}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            <Text style={st.meta}>Bu ay henüz harcama yok.</Text>
          )}
        </View>

        {/* Filtreler */}
        {filterCat || filterDay ? (
          <View style={st.filters}>
            <Label t={t}>Filtre</Label>
            {filterCat ? (
              <Pressable style={st.fchip} onPress={() => setFilterCat(null)}><Text style={st.fchipTxt}>{filterCat} ✕</Text></Pressable>
            ) : null}
            {filterDay ? (
              <Pressable style={st.fchip} onPress={() => setFilterDay(null)}><Text style={st.fchipTxt}>{shortDay(filterDay)} ✕</Text></Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Liste */}
        {days.length ? (
          <>
            <Text style={[st.meta, { paddingHorizontal: 4 }]}>Yanlış girdiğin bir harcamayı düzeltmek için üzerine dokun.</Text>
            {days.map((d) => {
              const its = groups[d].sort((p, q) => q.ts - p.ts);
              return (
                <View key={d} style={{ gap: 6 }}>
                  <View style={st.dayHead}>
                    <Label t={t}>{dayLabel(d)}</Label>
                    <Label t={t}>{fmtTL(sum(its))}</Label>
                  </View>
                  <View style={st.items}>
                    {its.map((x, i) => (
                      <Pressable
                        key={x.id}
                        onPress={() => setExpSheet({ key: Date.now(), initial: x })}
                        style={({ pressed }) => [st.item, i > 0 && st.topLine, pressed && { backgroundColor: t.bg }]}
                        accessibilityLabel={`${x.cat} ${fmtTL(x.amount)}, düzenle`}
                      >
                        <View style={[st.dot, { backgroundColor: t.cats[catIndex(x.cat)] }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={st.itemCat}>{x.cat}</Text>
                          {x.note ? <Text style={st.meta}>{x.note}</Text> : null}
                        </View>
                        <Text style={st.itemAmt}>{fmtTL(x.amount)}</Text>
                        <Text style={[st.meta, { fontSize: 18 }]}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <View style={st.empty}>
            <Text style={st.emptyTitle}>{monthItems.length ? 'Eşleşen harcama yok' : 'Defter boş'}</Text>
            <Text style={[st.meta, { textAlign: 'center' }]}>
              {monthItems.length ? 'Filtreyi kaldırarak tüm ayı görebilirsin.' : 'İlk harcamanı eklemek için aşağıdaki düğmeye dokun.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Alt düğme */}
      <View style={[st.fabBar, { paddingBottom: insets.bottom + 10 }]}>
        <Button label="+ Harcama ekle" kind="dark" onPress={() => setExpSheet({ key: Date.now(), initial: null })} t={t} style={{ height: 56, borderRadius: 18 }} />
      </View>

      {toastMsg ? (
        <View pointerEvents="none" style={[st.toast, { bottom: insets.bottom + 82 }]}>
          <Text style={{ color: t.bg, fontSize: 14, textAlign: 'center' }}>{toastMsg}</Text>
        </View>
      ) : null}

      {expSheet ? (
        <ExpenseSheet
          key={expSheet.key}
          visible
          initial={expSheet.initial}
          prefill={expSheet.prefill}
          onSave={saveExpense}
          onDelete={deleteExpense}
          onClose={() => setExpSheet(null)}
          t={t}
        />
      ) : null}
      {subSheet ? (
        <SubSheet key={subSheet.key} visible initial={subSheet.initial} onSave={saveSub} onDelete={deleteSub} onClose={() => setSubSheet(null)} t={t} />
      ) : null}
      {settingsOpen ? (
        <SettingsSheet
          key={settingsKey}
          visible
          settings={settings}
          onChange={changeSettings}
          onExport={doExport}
          onBackup={doBackup}
          onRestore={doRestore}
          ym={ym}
          monthName={monthLabel(ym).split(' ')[0]}
          onClose={() => setSettingsOpen(false)}
          t={t}
        />
      ) : null}
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    scroll: { paddingHorizontal: 16, gap: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    h1: { fontSize: 26, fontWeight: '800', color: t.fg, letterSpacing: -0.5 },
    link: { color: t.accent, fontSize: 16, fontWeight: '600' },
    months: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mBtn: { width: 44, height: 40, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
    mBtnTxt: { fontSize: 22, color: t.fg, lineHeight: 26 },
    mLabel: { fontSize: 17, fontWeight: '600', color: t.fg },
    hero: { backgroundColor: t.accent, borderRadius: 24, padding: 20, gap: 14 },
    heroBig: { color: t.accentFg, fontSize: 42, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'], letterSpacing: -1 },
    heroMid: { color: t.accentFg, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
    heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 },
    heroLink: { color: t.accentFg, fontSize: 14, textDecorationLine: 'underline' },
    heroSmall: { color: t.accentFg, fontSize: 14, fontVariant: ['tabular-nums'] },
    track: { height: 8, borderRadius: 99, backgroundColor: t.heroTrack, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 99 },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tile: { width: '48.5%', flexGrow: 1, flexBasis: '45%', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 18, padding: 14, gap: 4 },
    tileVal: { fontSize: 21, fontWeight: '700', color: t.fg, fontVariant: ['tabular-nums'] },
    tileSub: { fontSize: 13, color: t.muted },
    card: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 20, padding: 16, gap: 12 },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    addBtn: { borderWidth: 1, borderColor: t.line, backgroundColor: t.bg, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 12 },
    subSum: { flexDirection: 'row', gap: 24 },
    subSumVal: { fontSize: 19, fontWeight: '700', color: t.fg, fontVariant: ['tabular-nums'] },
    subWrap: { gap: 10, paddingVertical: 10 },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    subAct: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingLeft: 20 },
    smallBtn: { height: 38, borderRadius: 12, paddingHorizontal: 12 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
    topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
    legend: { flexDirection: 'row', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendTxt: { fontSize: 12, color: t.muted },
    dash: { width: 14, height: 0, borderTopWidth: 2, borderStyle: 'dashed' },
    stack: { flexDirection: 'row', height: 14, borderRadius: 99, overflow: 'hidden', gap: 2 },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 4 },
    dot: { width: 10, height: 10, borderRadius: 3 },
    filters: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    fchip: { backgroundColor: t.fg, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 },
    fchipTxt: { color: t.bg, fontSize: 14, fontWeight: '500' },
    dayHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    items: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 18, overflow: 'hidden' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
    itemCat: { fontSize: 16, fontWeight: '500', color: t.fg },
    itemAmt: { fontSize: 16, fontWeight: '600', color: t.fg, fontVariant: ['tabular-nums'] },
    meta: { fontSize: 13, color: t.muted },
    empty: { alignItems: 'center', paddingVertical: 28, gap: 4 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: t.fg },
    fabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, backgroundColor: t.bg },
    toast: { position: 'absolute', alignSelf: 'center', maxWidth: '90%', backgroundColor: t.fg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16 },
  });
}
