import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { HabitRow } from '../../src/components/HabitRow';
import { Avatar, Bar, Btn, Card, Row, Screen, SectionTitle, Txt, tap } from '../../src/components/ui';
import { addDays, prettyDay, TR_DAYS_SHORT, weekdayOf, weekStartKey, parseDayKey } from '../../src/engine/dates';
import { currentStreak, isPlannedOn } from '../../src/engine/points';
import type { Habit } from '../../src/engine/types';
import { pointsOnDay, today as todayKey, useStore } from '../../src/store/store';
import { useTheme } from '../../src/theme';

function bucketOf(h: Habit): string {
  const tm = h.reminderTime ?? h.dueTime;
  if (!tm) return 'Gün içinde';
  const hr = Number(tm.split(':')[0]);
  if (hr < 12) return 'Sabah';
  if (hr < 18) return 'Öğleden sonra';
  return 'Akşam';
}
const ORDER = ['Sabah', 'Öğleden sonra', 'Akşam', 'Gün içinde'];

export default function Today() {
  const t = useTheme();
  const s = useStore();
  const me = s.me!;
  const t0 = todayKey();
  const [day, setDay] = useState(t0);
  const isToday = day === t0;
  const canBackfillDay = !isToday && day === addDays(t0, -1) && s.canBackfill();
  const editable = isToday || canBackfillDay;

  const weekStart = weekStartKey(day);
  const strip = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const myHabits = useMemo(() => Object.values(s.habits).filter((h) => h.ownerId === me.id && !h.archived), [s.habits, me.id]);
  const myComps = useMemo(() => Object.values(s.completions).filter((c) => c.userId === me.id), [s.completions, me.id]);
  const doneToday = useMemo(() => {
    const m: Record<string, (typeof myComps)[number]> = {};
    for (const c of myComps) if (c.dayKey === day) m[c.habitId] = c;
    return m;
  }, [myComps, day]);

  const planned = myHabits.filter((h) => isPlannedOn(h, day));
  const quota = myHabits.filter((h) => h.schedule.weeklyQuota);
  const doneCount = planned.filter((h) => doneToday[h.id]).length;
  const myPts = pointsOnDay(s, me.id, day);
  const partner = s.partner;
  const partnerPts = partner ? pointsOnDay(s, partner.id, day) : 0;

  const weekCount = (h: Habit) => {
    const ws = weekStartKey(day);
    const set = new Set(myComps.filter((c) => c.habitId === h.id && c.dayKey >= ws && c.dayKey <= addDays(ws, 6)).map((c) => c.dayKey));
    return set.size;
  };

  const groups = ORDER.map((name) => ({ name, items: planned.filter((h) => bucketOf(h) === name) })).filter((g) => g.items.length);

  const partnerHabits = partner
    ? Object.values(s.habits).filter((h) => h.ownerId === partner.id && !h.archived && isPlannedOn(h, day))
    : [];
  const partnerDone = new Set(
    Object.values(s.completions).filter((c) => c.userId === partner?.id && c.dayKey === day).map((c) => c.habitId),
  );

  const doComplete = (h: Habit) => {
    s.complete(h.id, day, { backfill: canBackfillDay });
  };

  const stepHabit = (h: Habit) => {
    const step = h.step ?? 1;
    const next = s.addProgress(h.id, day, step);
    if (h.target && next >= h.target) doComplete(h);
  };

  const pct = planned.length ? doneCount / planned.length : 0;
  const nudgesForMe = Object.values(s.nudges).filter((n) => n.to === me.id && !s.seenNudges[n.id]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt size={13} dim>{prettyDay(day)}</Txt>
          <Txt size={26} weight="800">{isToday ? `Merhaba ${me.name} 👋` : 'Geçmiş gün'}</Txt>
        </View>
        <Avatar emoji={me.emoji} color={me.color} />
      </Row>

      {nudgesForMe.length > 0 && (
        <Card style={{ marginTop: 12, backgroundColor: t.primarySoft }} onPress={() => s.markNudgesSeen()}>
          {nudgesForMe.slice(-2).map((n) => (
            <Txt key={n.id} weight="600">{n.kind === 'nudge' ? '👉' : '🎉'} {partner?.name ?? 'Partner'}: {n.text}</Txt>
          ))}
          <Txt size={12} dim style={{ marginTop: 4 }}>Kapatmak için dokun</Txt>
        </Card>
      )}

      {/* Hafta şeridi */}
      <Row style={{ marginTop: 14, justifyContent: 'space-between' }}>
        {strip.map((d) => {
          const on = d === day;
          const isT = d === t0;
          return (
            <Pressable key={d} onPress={() => { tap(); setDay(d); }} style={{ alignItems: 'center', width: 44, paddingVertical: 8, borderRadius: 14, backgroundColor: on ? t.primary : t.card, borderWidth: isT && !on ? 1.5 : 0, borderColor: t.primary }}>
              <Txt size={11} color={on ? '#fff' : undefined} dim={!on}>{TR_DAYS_SHORT[weekdayOf(d)]}</Txt>
              <Txt size={16} weight="700" color={on ? '#fff' : undefined}>{parseDayKey(d).getDate()}</Txt>
            </Pressable>
          );
        })}
      </Row>

      {/* Özet kartı */}
      <Card style={{ marginTop: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt size={13} dim>Bugünün puanı</Txt>
            <Txt size={34} weight="800" color={me.color}>{myPts} <Txt size={14} dim>SP</Txt></Txt>
          </View>
          {partner ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Txt size={13} dim>{partner.name}</Txt>
              <Txt size={34} weight="800" color={partner.color}>{partnerPts} <Txt size={14} dim>SP</Txt></Txt>
            </View>
          ) : (
            <Btn small kind="soft" label="Partner ekle" onPress={() => router.push('/pairing')} />
          )}
        </Row>
        {partner ? (
          <View style={{ marginTop: 10 }}>
            <Bar value={myPts + partnerPts === 0 ? 0.5 : myPts / (myPts + partnerPts)} color={me.color} bg={partner.color} height={10} />
            <Txt size={12} dim center style={{ marginTop: 6 }}>
              {myPts === partnerPts ? 'Başa baş!' : myPts > partnerPts ? `${me.name} ${myPts - partnerPts} SP önde` : `${partner.name} ${partnerPts - myPts} SP önde`}
            </Txt>
          </View>
        ) : null}
        <View style={{ marginTop: 12 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <Txt size={13} dim>Günlük görevler</Txt>
            <Txt size={13} weight="700">{doneCount}/{planned.length}</Txt>
          </Row>
          <Bar value={pct} color={t.success} />
        </View>
      </Card>

      {!editable && (
        <Txt size={12} dim center style={{ marginTop: 10 }}>
          Bu gün salt okunur. {day === addDays(t0, -1) ? 'Dünü "Unuttum hakkı"yla (haftada 1, 09:00\'a kadar, %70 puan) tamamlayabilirsin.' : ''}
        </Txt>
      )}
      {canBackfillDay && (
        <Card style={{ marginTop: 10, backgroundColor: t.primarySoft }}>
          <Txt weight="700">⏪ Unuttum hakkı aktif</Txt>
          <Txt size={12} dim>Dünün görevlerini %70 puanla işaretleyebilirsin (haftada 1 kez).</Txt>
        </Card>
      )}

      {planned.length === 0 && quota.length === 0 && (
        <Card style={{ marginTop: 16, alignItems: 'center' }}>
          <Txt size={40}>🌱</Txt>
          <Txt weight="700" style={{ marginTop: 6 }}>Bu gün için görev yok</Txt>
          <Btn label="Görev ekle" style={{ marginTop: 12 }} onPress={() => router.push('/templates')} />
        </Card>
      )}

      {groups.map((g) => (
        <View key={g.name}>
          <SectionTitle>{g.name}</SectionTitle>
          {g.items.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              dayKey={day}
              completion={doneToday[h.id]}
              progress={s.progress[`${h.id}|${day}`] ?? 0}
              streak={currentStreak(h, myComps, day)}
              readOnly={!editable}
              onComplete={() => doComplete(h)}
              onUndo={() => s.undo(h.id, day)}
              onStep={() => stepHabit(h)}
            />
          ))}
        </View>
      ))}

      {quota.length > 0 && (
        <View>
          <SectionTitle>Haftalık hedefler</SectionTitle>
          {quota.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              dayKey={day}
              completion={doneToday[h.id]}
              progress={s.progress[`${h.id}|${day}`] ?? 0}
              streak={Math.round(currentStreak(h, myComps, day) / 7)}
              weekCount={weekCount(h)}
              readOnly={!editable}
              onComplete={() => doComplete(h)}
              onUndo={() => s.undo(h.id, day)}
              onStep={() => stepHabit(h)}
            />
          ))}
        </View>
      )}

      {partner && partnerHabits.length > 0 && (
        <View>
          <SectionTitle>{partner.name} bugün</SectionTitle>
          {partnerHabits.map((h) => (
            <HabitRow key={h.id} habit={h} dayKey={day} readOnly maskPrivate progress={0} streak={0}
              completion={partnerDone.has(h.id) ? s.completions[`c:${h.id}:${day}`] : undefined} />
          ))}
        </View>
      )}

      <Btn kind="ghost" label="＋ Görev / şablon ekle" style={{ marginTop: 12 }} onPress={() => router.push('/templates')} />
    </Screen>
  );
}
