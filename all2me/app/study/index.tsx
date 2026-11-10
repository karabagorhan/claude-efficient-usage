/**
 * Okul / yüksek lisans panosu — SPEC §6.5. Sekmeler: Pano · Dersler · Okuma · Tez.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { RingGauge } from '../../src/components/RingGauge';
import { Bar, Card, Chip, EmptyState, Header, IconButton, PillButton, Row, Screen, SectionHeader, Segmented, Txt } from '../../src/components/ui';
import { thesisDef } from '../../src/data/thesisMilestones';
import { addDays, weekStartKey, weekdayOf } from '../../src/engine/dates';
import { courseProgress, dailyStudyMinutes, overdueCount, readingTotals, splitMinutes, studyCheerKey, studyMinutes, upcoming, weekDays, weekLoad, dueThisWeekCount } from '../../src/features/study/calc';
import { milestoneTitle, slotsText, useDuration } from '../../src/features/study/format';
import { ensureStudyNotifSync } from '../../src/features/study/notify';
import { DeadlineRow, PaperCard, TypePicker } from '../../src/features/study/rows';
import { isClosed, STUDY_TAGS, TYPE_META, type Course, type StudyItem, type StudyTimerTag, type ThesisMilestone } from '../../src/features/study/types';
import { CheckCircle, ConfirmDelete, CountdownBadge, DateField, Label, MiniBars, Stepper, ToggleRow } from '../../src/features/study/ui';
import { DAYS_SHORT, fmtDay, fmtTime, L, useLang, useT } from '../../src/i18n';
import { routes } from '../../src/lib/routes';
import { today } from '../../src/store/core';
import { useSettings } from '../../src/store/settings';
import { useStudy } from '../../src/store/slices/study';
import { minutesByTagOf, useTimer } from '../../src/store/slices/timer';
import { radius, useTheme } from '../../src/theme';

type Tab = 'board' | 'courses' | 'reading' | 'thesis';
const TABS: Tab[] = ['board', 'courses', 'reading', 'thesis'];

export default function StudyScreen() {
  const t = useTheme();
  const tr = useT();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'board');
  const [picker, setPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    ensureStudyNotifSync();
  }, []);

  const header = (
    <View>
      <Header
        title={tr('study.title')}
        large
        right={
          <>
            <IconButton icon={showSettings ? 'settings' : 'settings-outline'} label={tr('study.settings.title')} onPress={() => setShowSettings((s) => !s)} />
            <IconButton icon="add" bg={t.primary} color={t.onPrimary} size={22} label={tr('study.add.title')} onPress={() => setPicker(true)} />
          </>
        }
      />
      <Segmented
        value={tab}
        onChange={setTab}
        options={TABS.map((id) => ({ id, label: tr(`study.tab.${id}`) }))}
        style={{ marginHorizontal: 16, marginBottom: 8 }}
      />
    </View>
  );

  return (
    <Screen header={header} padBottom={48}>
      {showSettings ? <StudySettingsCard /> : null}
      {tab === 'board' ? <Board onAdd={() => setPicker(true)} goTab={setTab} /> : null}
      {tab === 'courses' ? <Courses /> : null}
      {tab === 'reading' ? <Reading /> : null}
      {tab === 'thesis' ? <Thesis /> : null}
      <TypePicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(type) => {
          setPicker(false);
          router.push(routes.studyItem('new', { type }));
        }}
      />
    </Screen>
  );
}

// ---------------- Ayarlar ----------------
function StudySettingsCard() {
  const t = useTheme();
  const tr = useT();
  const settings = useStudy((s) => s.settings);
  const setSettings = useStudy((s) => s.setSettings);
  const globalOn = useSettings((s) => s.notifications);
  return (
    <Card style={{ marginBottom: 12, borderWidth: 1, borderColor: t.border }}>
      <Txt variant="h3" style={{ marginBottom: 8 }}>
        {tr('study.settings.title')}
      </Txt>
      <Row between style={{ paddingVertical: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyBold">{tr('study.settings.weekGoal')}</Txt>
          <Txt variant="small" dim>
            {tr('study.settings.weekGoalSub')}
          </Txt>
        </View>
        <Stepper value={settings.weekGoalHours} min={1} max={80} onChange={(v) => setSettings({ weekGoalHours: v })} format={(v) => tr('study.hoursShort', { n: v })} width={56} />
      </Row>
      <ToggleRow label={tr('study.settings.remindItems')} sub={tr('study.settings.remindItemsSub')} value={settings.remindItems} onChange={(v) => setSettings({ remindItems: v })} />
      <ToggleRow label={tr('study.settings.weeklyPlan')} sub={tr('study.settings.weeklyPlanSub')} value={settings.weeklyPlan} onChange={(v) => setSettings({ weeklyPlan: v })} />
      {!globalOn ? (
        <Txt variant="small" color={t.warn} style={{ marginTop: 6 }}>
          {tr('study.settings.globalOff')}
        </Txt>
      ) : null}
    </Card>
  );
}

// ---------------- Ortak veri ----------------
function useStudyData() {
  const { itemsMap, courses, logs, thesis, goalH } = useStudy(
    useShallow((s) => ({ itemsMap: s.items, courses: s.courses, logs: s.logs, thesis: s.thesis, goalH: s.settings.weekGoalHours })),
  );
  const items = useMemo(() => Object.values(itemsMap), [itemsMap]);
  return { items, courses, logs, thesis, goalH };
}

const openItem = (id: string) => router.push(routes.studyItem(id));

// ---------------- Pano ----------------
function Board({ onAdd, goTab }: { onAdd: () => void; goTab: (t: Tab) => void }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const dur = useDuration();
  const { items, courses, logs, thesis, goalH } = useStudyData();
  const toggleClosed = useStudy((s) => s.toggleClosed);
  const addPages = useStudy((s) => s.addPages);
  const addLog = useStudy((s) => s.addLog);
  const sessions = useTimer((s) => s.sessions);
  const [showAll, setShowAll] = useState(false);
  const [tag, setTag] = useState<StudyTimerTag>('lesson');
  const day = today();

  const d = useMemo(() => {
    const from = weekStartKey(day);
    const to = addDays(from, 6);
    const days = weekDays(day);
    const tags = minutesByTagOf(sessions ?? [], from, to) as Partial<Record<string, number>>;
    const open = upcoming(items);
    return {
      open,
      overdue: overdueCount(items, day),
      dueWeek: dueThisWeekCount(items, day),
      dueToday: open.filter((i) => i.due === day).length,
      load: weekLoad(items, day),
      weekMin: studyMinutes(tags, logs, from, to),
      daily: dailyStudyMinutes(sessions ?? [], logs, days),
      closedWeek: items.filter((i) => isClosed(i.status) && i.doneDay && i.doneDay >= from).length,
      reading: items.filter((i) => i.type === 'reading' && !isClosed(i.status)).slice(0, 2),
      recent: items.filter((i) => isClosed(i.status)).sort((a, b) => ((a.doneDay ?? '') < (b.doneDay ?? '') ? 1 : -1)).slice(0, 3),
    };
  }, [items, logs, sessions, day]);

  const goalMin = goalH * 60;
  const cheer = studyCheerKey({ overdue: d.overdue, dueToday: d.dueToday, weekMinutes: d.weekMin, weekGoalMinutes: goalMin, closedThisWeek: d.closedWeek });
  const nextMs = thesis.find((m) => !m.done);
  const list = showAll ? d.open : d.open.slice(0, 6);

  const focus = () => {
    try {
      const st = useTimer.getState() as { setTag?: (x: StudyTimerTag) => void };
      st.setTag?.(tag);
    } catch {}
    router.push(routes.timer({ minutes: 25 }));
  };

  if (!items.length && !Object.keys(courses).length) {
    return (
      <View>
        <EmptyState emoji="🎓" title={tr('study.empty.title')} body={tr('study.empty.body')} action={{ label: tr('study.empty.cta'), onPress: onAdd }} />
        <PillButton label={tr('study.course.add')} kind="outline" icon="school-outline" onPress={() => router.push(routes.studyCourse('new'))} />
      </View>
    );
  }

  return (
    <View>
      <Txt dim style={{ marginTop: 4, marginBottom: 12 }}>
        {tr(cheer, { n: d.overdue || d.dueToday || d.closedWeek })}
      </Txt>

      {/* Özet döşemeleri */}
      <Row gap={10}>
        <StatTile value={String(d.overdue)} label={tr('study.stat.overdue')} bg={d.overdue ? t.danger : t.card} fg={d.overdue ? '#FFFFFF' : t.text} />
        <StatTile value={String(d.dueWeek)} label={tr('study.stat.dueWeek')} bg={t.pastel.blue} fg={t.onPastel} />
        <StatTile value={tr('study.hoursShort', { n: d.load.hours })} label={tr('study.stat.load')} bg={t.pastel.peach} fg={t.onPastel} />
      </Row>

      {/* Yaklaşan teslimler */}
      <SectionHeader
        title={tr('study.board.upcoming')}
        onSeeAll={d.open.length > 6 ? () => setShowAll((s) => !s) : undefined}
        seeAllLabel={showAll ? tr('study.board.less') : tr('study.board.all', { n: d.open.length })}
      />
      {list.length ? (
        list.map((it) => (
          <DeadlineRow key={it.id} item={it} course={it.courseId ? courses[it.courseId] : undefined} onPress={() => openItem(it.id)} onToggle={() => toggleClosed(it.id)} />
        ))
      ) : (
        <Card>
          <Txt center dim>
            {tr('study.board.allClear')}
          </Txt>
        </Card>
      )}

      {/* Çalışma süresi */}
      <SectionHeader title={tr('study.board.studyTime')} />
      <Card>
        <Row between style={{ alignItems: 'flex-end' }}>
          <View>
            <Txt variant="h1">{dur(d.weekMin)}</Txt>
            <Txt variant="small" dim>
              {tr('study.board.goalOf', { goal: dur(goalMin) })}
            </Txt>
          </View>
          <Txt variant="h3" color={d.weekMin >= goalMin ? t.success : t.purple}>
            {`%${Math.min(999, Math.round((d.weekMin / Math.max(1, goalMin)) * 100))}`}
          </Txt>
        </Row>
        <View style={{ marginTop: 10, marginBottom: 14 }}>
          <Bar value={d.weekMin / Math.max(1, goalMin)} color={d.weekMin >= goalMin ? t.success : t.purple} />
        </View>
        <MiniBars values={d.daily} labels={DAYS_SHORT[lang]} highlight={weekdayOf(day)} />
        <Label>{tr('study.board.tagLabel')}</Label>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {STUDY_TAGS.map((g) => (
            <Chip key={g} label={tr(`study.tag.${g}`)} active={tag === g} onPress={() => setTag(g)} />
          ))}
        </Row>
        <PillButton label={tr('study.board.focus')} icon="timer-outline" onPress={focus} style={{ marginTop: 14 }} />
        <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <Txt variant="small" dim style={{ marginRight: 2 }}>
            {tr('study.board.quickLog')}
          </Txt>
          {[15, 30, 60].map((m) => (
            <Chip key={m} label={`+${dur(m)}`} onPress={() => addLog(m, tag)} />
          ))}
        </Row>
      </Card>

      {/* Okuma */}
      {d.reading.length ? (
        <>
          <SectionHeader title={tr('study.board.reading')} onSeeAll={() => goTab('reading')} />
          {d.reading.map((it) => (
            <PaperCard key={it.id} item={it} onPress={() => openItem(it.id)} onPages={(n) => addPages(it.id, n)} />
          ))}
        </>
      ) : null}

      {/* Tez */}
      {nextMs ? (
        <>
          <SectionHeader title={tr('study.board.thesis')} onSeeAll={() => goTab('thesis')} />
          <Card onPress={() => goTab('thesis')} bg={t.pastel.yellow}>
            <Row gap={12}>
              <Text style={{ fontSize: 34 }}>{thesisDef(nextMs.key)?.emoji ?? '🎓'}</Text>
              <View style={{ flex: 1 }}>
                <Txt variant="small" color={t.onPastel}>
                  {tr('study.thesis.next')}
                </Txt>
                <Txt variant="h3" color={t.onPastel} numberOfLines={2}>
                  {milestoneTitle(nextMs, lang)}
                </Txt>
              </View>
              {nextMs.target ? <CountdownBadge due={nextMs.target} small /> : null}
            </Row>
            <View style={{ marginTop: 12 }}>
              <Bar value={nextMs.progress / 100} color={t.orange} bg={t.card} />
            </View>
          </Card>
        </>
      ) : null}

      {d.recent.length ? (
        <>
          <SectionHeader title={tr('study.board.recent')} />
          {d.recent.map((it) => (
            <DeadlineRow key={it.id} item={it} course={it.courseId ? courses[it.courseId] : undefined} onPress={() => openItem(it.id)} onToggle={() => toggleClosed(it.id)} />
          ))}
        </>
      ) : null}
    </View>
  );
}

function StatTile({ value, label, bg, fg }: { value: string; label: string; bg: string; fg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 12, minHeight: 84 }}>
      <Text style={{ color: fg, fontSize: 24, fontWeight: '800' }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600', marginTop: 2, opacity: 0.85 }} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

// ---------------- Dersler ----------------
function Courses() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const { items, courses } = useStudyData();
  const day = today();
  const wd = weekdayOf(day);
  const list = useMemo(() => Object.values(courses).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)), [courses]);
  const todays = useMemo(
    () =>
      list
        .flatMap((c) => c.slots.filter((s) => s.day === wd).map((s) => ({ c, s })))
        .sort((a, b) => (a.s.start < b.s.start ? -1 : 1)),
    [list, wd],
  );

  if (!list.length) {
    return <EmptyState emoji="🏫" title={tr('study.course.emptyTitle')} body={tr('study.course.emptyBody')} action={{ label: tr('study.course.add'), onPress: () => router.push(routes.studyCourse('new')) }} />;
  }

  return (
    <View>
      {todays.length ? (
        <>
          <SectionHeader title={tr('study.course.today')} style={{ marginTop: 8 }} />
          <Card>
            {todays.map(({ c, s }, i) => (
              <Row key={`${c.id}${i}`} gap={12} style={{ paddingVertical: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.pastel[c.pastel], borderWidth: 1, borderColor: t.border }} />
                <Txt variant="bodyBold" style={{ width: 120 }}>{`${fmtTime(s.start, lang)}–${fmtTime(s.end, lang)}`}</Txt>
                <Txt style={{ flex: 1 }} numberOfLines={1}>
                  {c.name}
                </Txt>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title={tr('study.course.all', { n: list.length })} style={{ marginTop: todays.length ? 24 : 8 }} />
      {list.map((c) => {
        const its = items.filter((i) => i.courseId === c.id);
        const pr = courseProgress(its);
        const next = upcoming(its).find((i) => i.due);
        return (
          <Card key={c.id} bg={t.pastel[c.pastel]} onPress={() => router.push(routes.studyCourse(c.id))} style={{ marginBottom: 12 }}>
            <Row between style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                {c.code || c.term ? (
                  <Txt variant="small" weight="700" color={t.onPastel} style={{ opacity: 0.7 }}>
                    {[c.code, c.term].filter(Boolean).join(' · ')}
                  </Txt>
                ) : null}
                <Txt variant="h3" color={t.onPastel} numberOfLines={2}>
                  {c.name}
                </Txt>
                {c.teacher ? (
                  <Txt variant="small" color={t.onPastel} numberOfLines={1}>
                    {`👤 ${c.teacher}`}
                  </Txt>
                ) : null}
                {c.slots.length ? (
                  <Txt variant="small" color={t.onPastel} numberOfLines={2} style={{ marginTop: 2 }}>
                    {`🕘 ${slotsText(c, lang)}`}
                  </Txt>
                ) : null}
              </View>
              {next ? <CountdownBadge due={next.due} time={next.time} small /> : null}
            </Row>
            <Row between style={{ marginTop: 12, marginBottom: 6 }}>
              <Txt variant="small" weight="700" color={t.onPastel}>
                {tr('study.course.progress', { a: pr.done, b: pr.total })}
              </Txt>
              {next ? (
                <Txt variant="small" color={t.onPastel} numberOfLines={1} style={{ flex: 1, textAlign: 'right', marginLeft: 8 }}>
                  {`${TYPE_META[next.type].emoji} ${next.title}`}
                </Txt>
              ) : null}
            </Row>
            <Bar value={pr.ratio} color={t.primary} bg={t.card} />
          </Card>
        );
      })}
      <PillButton label={tr('study.course.add')} kind="outline" icon="add" onPress={() => router.push(routes.studyCourse('new'))} style={{ marginTop: 4 }} />
    </View>
  );
}

// ---------------- Okuma ----------------
type RFilter = 'all' | 'reading' | 'toread' | 'done';
function Reading() {
  const t = useTheme();
  const tr = useT();
  const { items } = useStudyData();
  const addPages = useStudy((s) => s.addPages);
  const [f, setF] = useState<RFilter>('all');
  const papers = useMemo(() => items.filter((i) => i.type === 'reading'), [items]);
  const totals = useMemo(() => readingTotals(items), [items]);
  const shown = useMemo(() => {
    const filtered = papers.filter((p) => {
      const closed = isClosed(p.status);
      if (f === 'done') return closed;
      if (f === 'reading') return !closed && (p.paper?.pagesRead ?? 0) > 0;
      if (f === 'toread') return !closed && (p.paper?.pagesRead ?? 0) === 0;
      return true;
    });
    return filtered.sort((a, b) => Number(isClosed(a.status)) - Number(isClosed(b.status)) || (a.due ?? '9999') .localeCompare(b.due ?? '9999'));
  }, [papers, f]);

  if (!papers.length) {
    return (
      <EmptyState
        emoji="📚"
        title={tr('study.reading.emptyTitle')}
        body={tr('study.reading.emptyBody')}
        action={{ label: tr('study.reading.add'), onPress: () => router.push(routes.studyItem('new', { type: 'reading' })) }}
      />
    );
  }

  return (
    <View>
      <Card style={{ marginTop: 8 }}>
        <Row gap={16}>
          <RingGauge value={totals.total ? totals.read / totals.total : 0} size={84} stroke={10} color={t.purple} label={`%${totals.total ? Math.round((totals.read / totals.total) * 100) : 0}`} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">{tr('study.reading.summary', { n: totals.papers, done: totals.finished })}</Txt>
            <Txt dim>{tr('study.reading.pages', { a: totals.read, b: totals.total })}</Txt>
          </View>
        </Row>
      </Card>
      <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 16, marginBottom: 12 }}>
        {(['all', 'reading', 'toread', 'done'] as RFilter[]).map((x) => (
          <Chip key={x} label={tr(`study.reading.f.${x}`)} active={f === x} onPress={() => setF(x)} />
        ))}
      </Row>
      {shown.map((it) => (
        <PaperCard key={it.id} item={it} onPress={() => openItem(it.id)} onPages={(n) => addPages(it.id, n)} />
      ))}
      {!shown.length ? (
        <Txt dim center style={{ marginVertical: 16 }}>
          {tr('study.reading.none')}
        </Txt>
      ) : null}
      <PillButton label={tr('study.reading.add')} kind="outline" icon="add" onPress={() => router.push(routes.studyItem('new', { type: 'reading' }))} />
    </View>
  );
}

// ---------------- Tez ----------------
function Thesis() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const { items, courses, thesis } = useStudyData();
  const initThesis = useStudy((s) => s.initThesis);
  const saveMilestone = useStudy((s) => s.saveMilestone);
  const toggleClosed = useStudy((s) => s.toggleClosed);
  const [editing, setEditing] = useState<string | null>(null);
  const chapters = useMemo(() => upcoming(items.filter((i) => i.type === 'thesis')).concat(items.filter((i) => i.type === 'thesis' && isClosed(i.status))), [items]);
  const avg = thesis.length ? thesis.reduce((a, m) => a + (m.done ? 100 : m.progress), 0) / thesis.length / 100 : 0;
  const doneN = thesis.filter((m) => m.done).length;
  const next = thesis.find((m) => !m.done);

  if (!thesis.length) {
    return (
      <View>
        <EmptyState emoji="🎓" title={tr('study.thesis.emptyTitle')} body={tr('study.thesis.emptyBody')} action={{ label: tr('study.thesis.useDefaults'), onPress: initThesis }} />
        <PillButton
          label={tr('study.thesis.addOwn')}
          kind="outline"
          icon="add"
          onPress={() => {
            const id = saveMilestone({ title: tr('study.thesis.newTitle'), progress: 0 });
            setEditing(id);
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <Card bg={t.pastel.yellow} style={{ marginTop: 8 }}>
        <Row gap={16}>
          <RingGauge value={avg} size={96} stroke={11} color={t.orange} track={t.card} label={`%${Math.round(avg * 100)}`} />
          <View style={{ flex: 1 }}>
            <Txt variant="small" color={t.onPastel}>
              {tr('study.thesis.overall', { a: doneN, b: thesis.length })}
            </Txt>
            <Txt variant="h3" color={t.onPastel} numberOfLines={2}>
              {next ? milestoneTitle(next, lang) : tr('study.thesis.allDone')}
            </Txt>
            {next?.target ? (
              <Txt variant="small" color={t.onPastel} style={{ marginTop: 2 }}>
                {tr('study.thesis.targetOn', { date: fmtDay(next.target, lang, 'short') })}
              </Txt>
            ) : null}
          </View>
        </Row>
      </Card>

      <SectionHeader title={tr('study.thesis.timeline')} />
      {thesis.map((m, i) => (
        <MilestoneRow key={m.id} m={m} first={i === 0} last={i === thesis.length - 1} current={m.id === next?.id} editing={editing === m.id} onEdit={() => setEditing(editing === m.id ? null : m.id)} />
      ))}
      <PillButton
        label={tr('study.thesis.addOwn')}
        kind="outline"
        icon="add"
        onPress={() => {
          const id = saveMilestone({ title: tr('study.thesis.newTitle'), progress: 0 });
          setEditing(id);
        }}
        style={{ marginTop: 8 }}
      />

      <SectionHeader title={tr('study.thesis.chapters')} />
      {chapters.map((it) => (
        <DeadlineRow key={it.id} item={it} course={it.courseId ? courses[it.courseId] : undefined} onPress={() => openItem(it.id)} onToggle={() => toggleClosed(it.id)} />
      ))}
      {!chapters.length ? (
        <Txt dim style={{ marginBottom: 12 }}>
          {tr('study.thesis.noChapters')}
        </Txt>
      ) : null}
      <PillButton label={tr('study.thesis.addChapter')} kind="outline" icon="add" onPress={() => router.push(routes.studyItem('new', { type: 'thesis' }))} />
    </View>
  );
}

function MilestoneRow({ m, first, last, current, editing, onEdit }: { m: ThesisMilestone; first: boolean; last: boolean; current: boolean; editing: boolean; onEdit: () => void }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const save = useStudy((s) => s.saveMilestone);
  const del = useStudy((s) => s.deleteMilestone);
  const move = useStudy((s) => s.moveMilestone);
  const [title, setTitle] = useState(milestoneTitle(m, lang));
  const def = thesisDef(m.key);
  const dotColor = m.done ? t.success : current ? t.purple : t.textFaint;
  return (
    <Row gap={12} style={{ alignItems: 'stretch' }}>
      <View style={{ width: 28, alignItems: 'center' }}>
        <View style={{ width: 2, height: 18, backgroundColor: first ? 'transparent' : t.border }} />
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: m.done ? t.success : t.card, borderWidth: 3, borderColor: dotColor, alignItems: 'center', justifyContent: 'center' }}>
          {m.done ? <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>✓</Text> : null}
        </View>
        <View style={{ width: 2, flex: 1, backgroundColor: last ? 'transparent' : t.border }} />
      </View>
      <View style={{ flex: 1, paddingBottom: 12 }}>
        <Card padding={14} onPress={onEdit} style={current ? { borderWidth: 1.5, borderColor: t.purple } : undefined}>
          <Row gap={10}>
            <Text style={{ fontSize: 24 }}>{def?.emoji ?? '📌'}</Text>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold" numberOfLines={2} dim={m.done}>
                {milestoneTitle(m, lang)}
              </Txt>
              <Txt variant="small" dim numberOfLines={1}>
                {m.target ? fmtDay(m.target, lang, 'short') : tr('study.thesis.noTarget')}
                {def && !m.title ? ` · ${L(def.hint, lang)}` : ''}
              </Txt>
            </View>
            {m.target && !m.done ? <CountdownBadge due={m.target} small /> : null}
          </Row>
          <Row gap={10} style={{ marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Bar value={m.done ? 1 : m.progress / 100} color={m.done ? t.success : t.orange} />
            </View>
            <Txt variant="small" weight="700" style={{ width: 40, textAlign: 'right' }}>{`%${m.done ? 100 : m.progress}`}</Txt>
          </Row>
          <Row gap={8} style={{ marginTop: 10 }}>
            <Chip label="−10" onPress={() => save({ id: m.id, progress: Math.max(0, m.progress - 10) })} />
            <Chip label="+10" onPress={() => save({ id: m.id, progress: m.progress + 10 })} />
            <View style={{ flex: 1 }} />
            <CheckCircle done={m.done} onPress={() => save({ id: m.id, done: !m.done })} />
          </Row>
          {editing ? (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 8 }}>
              <Label style={{ marginTop: 4 }}>{tr('study.thesis.name')}</Label>
              <TextInput
                value={title}
                onChangeText={setTitle}
                onEndEditing={() => save({ id: m.id, title })}
                onBlur={() => save({ id: m.id, title })}
                style={{ backgroundColor: t.bg, color: t.text, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 }}
              />
              <Label>{tr('study.thesis.target')}</Label>
              <DateField value={m.target} onChange={(d) => save({ id: m.id, target: d })} placeholder={tr('study.thesis.noTarget')} />
              <Row gap={8} style={{ marginTop: 12 }}>
                <Chip label={tr('study.a11y.up')} emoji="⬆️" onPress={() => move(m.id, -1)} />
                <Chip label={tr('study.a11y.down')} emoji="⬇️" onPress={() => move(m.id, 1)} />
              </Row>
              <View style={{ marginTop: 8 }}>
                <ConfirmDelete label={tr('study.thesis.delete')} confirmLabel={tr('study.thesis.confirmDelete')} onConfirm={() => del(m.id)} />
              </View>
            </View>
          ) : null}
        </Card>
      </View>
    </Row>
  );
}

