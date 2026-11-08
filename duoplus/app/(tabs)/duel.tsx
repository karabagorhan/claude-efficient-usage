import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Avatar, Bar, Btn, Card, Row, Screen, Segmented, SectionTitle, Txt, tap } from '../../src/components/ui';
import { addDays, eachDay, monthKeyOf, parseDayKey, periodRange, prettyDay, TR_DAYS_SHORT, TR_MONTHS, weekdayOf } from '../../src/engine/dates';
import { championCounts, dayStats, standings } from '../../src/engine/leaderboard';
import type { Period } from '../../src/engine/types';
import { today as todayKey, useStore } from '../../src/store/store';
import { useTheme } from '../../src/theme';

const NUDGES = ['Hadi bugünkü görevlerini yap! 💪', 'Puan farkı kapanıyor, dikkat! 😏', 'Seni bekliyorum, birlikte başlayalım! 🙌'];
const CHEERS = ['Harikasın! 🎉', 'Bugün çok iyiydin 👏', 'Seninle gurur duyuyorum 💖'];

function periodLabel(period: Period, anchor: string) {
  const [from, to] = periodRange(period, anchor);
  if (period === 'day') return prettyDay(anchor);
  if (period === 'week') {
    const a = parseDayKey(from);
    const b = parseDayKey(to);
    return `${a.getDate()} ${TR_MONTHS[a.getMonth()]} – ${b.getDate()} ${TR_MONTHS[b.getMonth()]}`;
  }
  const d = parseDayKey(from);
  return `${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Duel() {
  const t = useTheme();
  const s = useStore();
  const me = s.me!;
  const partner = s.partner;
  const t0 = todayKey();
  const [period, setPeriod] = useState<Period>('day');
  const [anchor, setAnchor] = useState(t0);

  const events = useMemo(() => Object.values(s.events), [s.events]);
  const comps = useMemo(() => Object.values(s.completions), [s.completions]);

  const ids: [string, string] = [me.id, partner?.id ?? '__none__'];
  const st = useMemo(() => standings(period, anchor, ids, events, comps, t0), [period, anchor, events, comps, partner?.id, t0]);
  const [from, to] = periodRange(period, anchor);
  const isCurrent = t0 >= from && t0 <= to;

  const move = (dir: -1 | 1) => {
    tap();
    if (period === 'day') setAnchor(addDays(anchor, dir));
    else if (period === 'week') setAnchor(addDays(from, dir * 7));
    else setAnchor(dir < 0 ? addDays(from, -1) : addDays(to, 1));
  };
  const switchPeriod = (p: Period) => {
    setPeriod(p);
    setAnchor(t0);
  };

  const rowOf = (uid: string) => st.rows.find((r) => r.userId === uid)!;
  const mine = rowOf(me.id);
  const theirs = partner ? rowOf(partner.id) : { points: 0, tasks: 0, activeDays: 0, dayWins: 0, userId: '' };
  const total = mine.points + theirs.points;

  const days = eachDay(from, to);
  const myDays = useMemo(() => dayStats(me.id, events, comps, from, to), [events, comps, from, to, me.id]);
  const thDays = useMemo(() => (partner ? dayStats(partner.id, events, comps, from, to) : {}), [events, comps, from, to, partner?.id]);
  const maxDay = Math.max(1, ...days.map((d) => Math.max(myDays[d]?.points ?? 0, (thDays as any)[d]?.points ?? 0)));

  const firstDay = useMemo(() => {
    const all = [...events.map((e) => e.dayKey), ...comps.map((c) => c.dayKey)].sort();
    return all[0] ?? t0;
  }, [events, comps, t0]);
  const champs = useMemo(() => {
    if (!partner) return null;
    return {
      day: championCounts('day', ids, events, comps, firstDay, t0),
      week: championCounts('week', ids, events, comps, firstDay, t0),
      month: championCounts('month', ids, events, comps, firstDay, t0),
    };
  }, [events, comps, firstDay, t0, partner?.id]);

  const form = useMemo(() => {
    if (!partner) return [];
    return Array.from({ length: 7 }, (_, i) => addDays(t0, -(6 - i))).map((d) => {
      const r = standings('day', d, ids, events, comps, t0);
      return { d, res: r.winnerId === me.id ? 'W' : r.winnerId === partner.id ? 'L' : 'D' };
    });
  }, [events, comps, partner?.id, t0]);

  const feed = useMemo(() => {
    if (!partner) return [];
    return events
      .filter((e) => e.userId === partner.id && (e.type === 'completion' || e.type === 'perfect_day' || e.type === 'champion' || e.type === 'badge'))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
      .map((e) => {
        const habitId = e.refId?.split(':')[1];
        const priv = habitId ? s.habits[habitId]?.isPrivate : false;
        return { id: e.id, text: priv ? 'özel bir görevi bitirdi' : e.label ?? e.type, points: e.points, type: e.type, at: e.createdAt };
      });
  }, [events, partner?.id, s.habits]);

  const send = (kind: 'nudge' | 'cheer') => {
    const list = kind === 'nudge' ? NUDGES : CHEERS;
    const r = s.sendNudge(kind, list[Math.floor(Math.random() * list.length)]);
    Alert.alert(r.ok ? (kind === 'nudge' ? 'Dürtüldü 👉' : 'Tebrik gönderildi 🎉') : 'Olmadı', r.ok ? `${partner?.name} uygulamayı açınca görecek.` : r.reason);
  };

  if (!partner) {
    return (
      <Screen>
        <Txt size={26} weight="800">Yarış 🏆</Txt>
        <Card style={{ marginTop: 16, alignItems: 'center', paddingVertical: 28 }}>
          <Txt size={44}>💞</Txt>
          <Txt weight="700" size={17} style={{ marginTop: 8 }}>Henüz partnerin yok</Txt>
          <Txt dim center style={{ marginTop: 6 }}>
            Eşleşince günlük, haftalık ve aylık puan yarışını burada göreceksin.
          </Txt>
          <Btn label="Partnerle eşleş" style={{ marginTop: 16 }} onPress={() => router.push('/pairing')} />
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Txt weight="700">Senin puanların</Txt>
          <Txt dim size={13} style={{ marginTop: 4 }}>
            {periodLabel(period, anchor)}: {mine.points} SP · {mine.tasks} görev
          </Txt>
        </Card>
      </Screen>
    );
  }

  const winnerName = st.winnerId === me.id ? me.name : st.winnerId === partner.id ? partner.name : null;
  const banner = (() => {
    if (winnerName) return { text: `🏆 ${winnerName} ${period === 'day' ? 'Günün Şampiyonu' : period === 'week' ? 'Haftanın Yıldızı' : 'Ayın Efsanesi'}`, color: t.warn };
    if (st.tie && st.qualified) return { text: '🤝 Beraberlik', color: t.textDim };
    if (!st.qualified) return { text: 'Şampiyonluk için minimum eşik henüz sağlanmadı', color: t.textDim };
    return { text: '', color: t.textDim };
  })();
  const closed = to < t0;

  return (
    <Screen>
      <Txt size={26} weight="800">Yarış 🏆</Txt>
      <View style={{ marginTop: 12 }}>
        <Segmented<Period> value={period} onChange={switchPeriod} options={[{ id: 'day', label: 'Günlük' }, { id: 'week', label: 'Haftalık' }, { id: 'month', label: 'Aylık' }]} />
      </View>

      <Row style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <Pressable onPress={() => move(-1)} hitSlop={12}><Txt size={22} weight="700">‹</Txt></Pressable>
        <View style={{ alignItems: 'center' }}>
          <Txt weight="700">{periodLabel(period, anchor)}</Txt>
          <Txt size={12} dim>{isCurrent ? 'Devam ediyor' : closed ? 'Kapandı' : 'Gelecek'}</Txt>
        </View>
        <Pressable onPress={() => move(1)} hitSlop={12} disabled={isCurrent}><Txt size={22} weight="700" style={{ opacity: isCurrent ? 0.25 : 1 }}>›</Txt></Pressable>
      </Row>

      {/* Kafa kafaya */}
      <Card style={{ marginTop: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <PlayerCol p={me} pts={mine.points} lead={mine.points > theirs.points} />
          <Txt size={16} weight="800" dim>VS</Txt>
          <PlayerCol p={partner} pts={theirs.points} lead={theirs.points > mine.points} align="right" />
        </Row>
        <View style={{ marginTop: 14 }}>
          <Bar value={total === 0 ? 0.5 : mine.points / total} color={me.color} bg={partner.color} height={14} />
          <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
            <Txt size={12} dim>{total === 0 ? '50%' : Math.round((mine.points / total) * 100) + '%'}</Txt>
            <Txt size={12} dim>{total === 0 ? '50%' : Math.round((theirs.points / total) * 100) + '%'}</Txt>
          </Row>
        </View>
        {banner.text ? <Txt center weight="800" color={banner.color} style={{ marginTop: 8 }}>{banner.text}</Txt> : null}
        <Row style={{ justifyContent: 'space-around', marginTop: 12 }}>
          <Mini label="Görev" a={mine.tasks} b={theirs.tasks} />
          <Mini label="Aktif gün" a={mine.activeDays} b={theirs.activeDays} />
          {period !== 'day' ? <Mini label="Kazandığı gün" a={mine.dayWins} b={theirs.dayWins} /> : null}
        </Row>
      </Card>

      {/* Günlük dağılım */}
      {period !== 'day' && (
        <Card style={{ marginTop: 12 }}>
          <Txt weight="700" style={{ marginBottom: 10 }}>Gün gün karşılaştırma</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110 }}>
            {days.map((d) => {
              const a = myDays[d]?.points ?? 0;
              const b = (thDays as any)[d]?.points ?? 0;
              return (
                <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90 }}>
                    <View style={{ width: period === 'week' ? 12 : 3, height: Math.max(2, (a / maxDay) * 90), backgroundColor: me.color, borderRadius: 3 }} />
                    <View style={{ width: period === 'week' ? 12 : 3, height: Math.max(2, (b / maxDay) * 90), backgroundColor: partner.color, borderRadius: 3, marginLeft: 1 }} />
                  </View>
                  {period === 'week' ? <Txt size={10} dim style={{ marginTop: 4 }}>{TR_DAYS_SHORT[weekdayOf(d)]}</Txt> : null}
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Şampiyonluk rafı */}
      {champs && (
        <>
          <SectionTitle>Şampiyonluk rafı</SectionTitle>
          <Card>
            {(['day', 'week', 'month'] as const).map((p) => (
              <Row key={p} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
                <Txt weight="600">{p === 'day' ? '🥇 Günün Şampiyonu' : p === 'week' ? '🌠 Haftanın Yıldızı' : '🏅 Ayın Efsanesi'}</Txt>
                <Txt weight="800">
                  <Txt color={me.color} weight="800">{champs[p].wins[me.id] ?? 0}</Txt> – <Txt color={partner.color} weight="800">{champs[p].wins[partner.id] ?? 0}</Txt>
                  {champs[p].ties ? <Txt dim size={12}>  ({champs[p].ties} ber.)</Txt> : null}
                </Txt>
              </Row>
            ))}
            <Row style={{ marginTop: 8 }}>
              <Txt size={12} dim style={{ marginRight: 8 }}>Son 7 gün</Txt>
              {form.map((f) => (
                <View key={f.d} style={{ width: 22, height: 22, borderRadius: 11, marginRight: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: f.res === 'W' ? t.success : f.res === 'L' ? t.danger : t.cardAlt }}>
                  <Txt size={10} weight="800" color={f.res === 'D' ? t.textDim : '#fff'}>{f.res === 'W' ? 'K' : f.res === 'L' ? 'M' : '–'}</Txt>
                </View>
              ))}
            </Row>
          </Card>
        </>
      )}

      {/* Sosyal */}
      <SectionTitle>{partner.name} ile</SectionTitle>
      <Row style={{ gap: 8 }}>
        <Btn style={{ flex: 1 }} kind="soft" label="👉 Dürt" onPress={() => send('nudge')} />
        <Btn style={{ flex: 1 }} kind="soft" label="🎉 Tebrik et" onPress={() => send('cheer')} />
      </Row>

      {feed.length > 0 && (
        <>
          <SectionTitle>{partner.name} son hareketler</SectionTitle>
          <Card>
            {feed.map((f) => (
              <Row key={f.id} style={{ justifyContent: 'space-between', paddingVertical: 5 }}>
                <Txt numberOfLines={1} style={{ flex: 1 }}>
                  {f.type === 'champion' ? '🏆 ' : f.type === 'badge' ? '🎖️ ' : f.type === 'perfect_day' ? '✨ ' : '✅ '}{f.text}
                </Txt>
                <Txt weight="700" color={t.success}>{f.points > 0 ? `+${f.points}` : ''}</Txt>
              </Row>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

function PlayerCol({ p, pts, lead, align }: { p: { name: string; emoji: string; color: string }; pts: number; lead: boolean; align?: 'right' }) {
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start', flex: 1 }}>
      <Avatar emoji={p.emoji} color={p.color} size={48} />
      <Txt weight="700" style={{ marginTop: 6 }}>{p.name}</Txt>
      <Txt size={32} weight="800" color={p.color}>{pts}{lead ? ' 👑' : ''}</Txt>
      <Txt size={12} dim>SP</Txt>
    </View>
  );
}

function Mini({ label, a, b }: { label: string; a: number; b: number }) {
  const t = useTheme();
  const s = useStore.getState();
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt size={12} dim>{label}</Txt>
      <Txt weight="800"><Txt color={s.me?.color ?? t.me} weight="800">{a}</Txt> – <Txt color={s.partner?.color ?? t.partner} weight="800">{b}</Txt></Txt>
    </View>
  );
}
