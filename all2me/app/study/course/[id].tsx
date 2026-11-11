/**
 * Ders detayı ve ekle/düzenle (id = ders id ya da 'new'). SPEC §6.5.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { RingGauge } from '../../../src/components/RingGauge';
import { Card, Chip, EmptyState, Field, Header, IconButton, PillButton, Row, Screen, SectionHeader, Txt } from '../../../src/components/ui';
import { hhmmToMinutes } from '../../../src/engine/dates';
import { PASTEL_KEYS, type PastelKey, type Weekday } from '../../../src/engine/types';
import { courseProgress, upcoming } from '../../../src/features/study/calc';
import { slotsText } from '../../../src/features/study/format';
import { ensureStudyNotifSync } from '../../../src/features/study/notify';
import { DeadlineRow, TypePicker } from '../../../src/features/study/rows';
import { isClosed, ITEM_TYPES, TYPE_META, type ClassSlot } from '../../../src/features/study/types';
import { ConfirmDelete, Label, Stepper } from '../../../src/features/study/ui';
import { DAYS_SHORT, fmtTime, useLang, useT } from '../../../src/i18n';
import { routes } from '../../../src/lib/routes';
import { useStudy } from '../../../src/store/slices/study';
import { radius, useTheme } from '../../../src/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const toHHMM = (m: number) => `${pad(Math.floor((((m % 1440) + 1440) % 1440) / 60))}:${pad((((m % 1440) + 1440) % 1440) % 60)}`;

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const course = useStudy((s) => (isNew ? undefined : s.courses[id]));
  const hydrated = useStudy((s) => s.hydrated);
  const [editing, setEditing] = useState(isNew);
  const tr = useT();

  useEffect(() => {
    ensureStudyNotifSync();
  }, []);

  if (!isNew && !course) {
    return (
      <Screen header={<Header title={tr('study.course.title')} />}>
        {hydrated ? <EmptyState emoji="🔍" title={tr('study.course.notFound')} action={{ label: tr('common.btn.back'), onPress: () => router.back() }} /> : null}
      </Screen>
    );
  }
  if (editing) return <CourseForm id={isNew ? undefined : id} onDone={(newId) => (isNew ? router.replace(routes.studyCourse(newId)) : setEditing(false))} onCancel={() => (isNew ? router.back() : setEditing(false))} />;
  return <CourseDetail id={id} onEdit={() => setEditing(true)} />;
}

function CourseDetail({ id, onEdit }: { id: string; onEdit: () => void }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const course = useStudy((s) => s.courses[id]);
  const itemsMap = useStudy((s) => s.items);
  const toggleClosed = useStudy((s) => s.toggleClosed);
  const [picker, setPicker] = useState(false);
  const items = useMemo(() => Object.values(itemsMap).filter((i) => i.courseId === id), [itemsMap, id]);
  const pr = courseProgress(items);
  const groups = useMemo(
    () =>
      ITEM_TYPES.map((ty) => {
        const its = items.filter((i) => i.type === ty);
        return { ty, open: upcoming(its), closed: its.filter((i) => isClosed(i.status)) };
      }).filter((g) => g.open.length + g.closed.length > 0),
    [items],
  );
  if (!course) return null;

  return (
    <Screen header={<Header title={course.code || tr('study.course.title')} right={<IconButton icon="create-outline" label={tr('common.btn.edit')} onPress={onEdit} />} />}>
      <Card bg={t.pastel[course.pastel]}>
        <Row gap={14}>
          <View style={{ flex: 1 }}>
            {course.term ? (
              <Txt variant="small" weight="700" color={t.onPastel} style={{ opacity: 0.7 }}>
                {course.term}
              </Txt>
            ) : null}
            <Txt variant="h1" color={t.onPastel} numberOfLines={3}>
              {course.name}
            </Txt>
            {course.teacher ? <Txt color={t.onPastel}>{`👤 ${course.teacher}`}</Txt> : null}
          </View>
          <RingGauge value={pr.ratio} size={84} stroke={10} color={t.primary} track={t.card} label={`${pr.done}/${pr.total}`} />
        </Row>
        {course.slots.length ? (
          <Txt variant="small" color={t.onPastel} style={{ marginTop: 10 }}>
            {`🕘 ${slotsText(course, lang)}`}
          </Txt>
        ) : null}
      </Card>

      <PillButton label={tr('study.course.addItem')} icon="add" onPress={() => setPicker(true)} style={{ marginTop: 16 }} />

      {groups.length ? (
        groups.map((g) => (
          <View key={g.ty}>
            <SectionHeader title={`${TYPE_META[g.ty].emoji} ${tr(`study.typePlural.${g.ty}`)} · ${g.closed.length}/${g.open.length + g.closed.length}`} />
            {[...g.open, ...g.closed].map((it) => (
              <DeadlineRow key={it.id} item={it} course={course} hideCourse onPress={() => router.push(routes.studyItem(it.id))} onToggle={() => toggleClosed(it.id)} />
            ))}
          </View>
        ))
      ) : (
        <EmptyState emoji="🗒️" title={tr('study.course.noItems')} body={tr('study.course.noItemsBody')} />
      )}
      <TypePicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(type) => {
          setPicker(false);
          router.push(routes.studyItem('new', { type, courseId: id }));
        }}
      />
    </Screen>
  );
}

function CourseForm({ id, onDone, onCancel }: { id?: string; onDone: (id: string) => void; onCancel: () => void }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const existing = useStudy((s) => (id ? s.courses[id] : undefined));
  const count = useStudy((s) => Object.keys(s.courses).length);
  const saveCourse = useStudy((s) => s.saveCourse);
  const deleteCourse = useStudy((s) => s.deleteCourse);
  const [name, setName] = useState(existing?.name ?? '');
  const [code, setCode] = useState(existing?.code ?? '');
  const [teacher, setTeacher] = useState(existing?.teacher ?? '');
  const [term, setTerm] = useState(existing?.term ?? '');
  const [pastel, setPastel] = useState<PastelKey>(existing?.pastel ?? PASTEL_KEYS[count % PASTEL_KEYS.length]);
  const [slots, setSlots] = useState<ClassSlot[]>(existing?.slots ?? []);

  const updateSlot = (i: number, p: Partial<ClassSlot>) => setSlots((ss) => ss.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const addSlot = () =>
    setSlots((ss) => {
      const last = ss[ss.length - 1];
      return [...ss, { day: (last ? (last.day + 2) % 7 : 0) as Weekday, start: last?.start ?? '09:00', end: last?.end ?? '11:00' }];
    });
  const save = () => {
    if (!name.trim()) return;
    const newId = saveCourse({ id, name, code, teacher, term, pastel, slots });
    onDone(newId);
  };

  return (
    <Screen
      header={<Header left="close" onLeft={onCancel} title={id ? tr('study.course.edit') : tr('study.course.new')} />}
      padBottom={48}
    >
      <Field label={tr('study.course.name')} value={name} onChangeText={setName} placeholder={tr('study.course.namePh')} autoFocus={!id} />
      <Row gap={10}>
        <Field label={tr('study.course.code')} value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder={tr('study.course.codePh')} containerStyle={{ flex: 1 }} autoCapitalize="characters" />
        <Field label={tr('study.course.term')} value={term} onChangeText={setTerm} placeholder={tr('study.course.termPh')} containerStyle={{ flex: 1 }} />
      </Row>
      <Field label={tr('study.course.teacher')} value={teacher} onChangeText={setTeacher} placeholder={tr('study.course.teacherPh')} />

      <Label>{tr('study.course.color')}</Label>
      <Row gap={10} style={{ flexWrap: 'wrap' }}>
        {PASTEL_KEYS.map((k) => (
          <Pressable
            key={k}
            accessibilityLabel={k}
            onPress={() => setPastel(k)}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.pastel[k], borderWidth: pastel === k ? 3 : 1, borderColor: pastel === k ? t.text : t.border }}
          />
        ))}
      </Row>

      <Label>{tr('study.course.schedule')}</Label>
      {slots.map((s, i) => (
        <Card key={i} padding={12} style={{ marginBottom: 10 }}>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {DAYS_SHORT[lang].map((d, wd) => (
              <Pressable
                key={wd}
                onPress={() => updateSlot(i, { day: wd as Weekday })}
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: s.day === wd ? t.primary : t.cardAlt }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: s.day === wd ? t.onPrimary : t.text }}>{d}</Text>
              </Pressable>
            ))}
          </Row>
          <Row between style={{ marginTop: 10 }}>
            <Txt dim>{tr('study.course.start')}</Txt>
            <Stepper value={hhmmToMinutes(s.start)} step={30} min={0} max={1410} onChange={(v) => updateSlot(i, { start: toHHMM(v), end: v >= hhmmToMinutes(s.end) ? toHHMM(Math.min(1439, v + 60)) : s.end })} format={(v) => fmtTime(toHHMM(v), lang)} width={76} />
          </Row>
          <Row between style={{ marginTop: 8 }}>
            <Txt dim>{tr('study.course.end')}</Txt>
            <Stepper value={hhmmToMinutes(s.end)} step={30} min={hhmmToMinutes(s.start) + 30} max={1439} onChange={(v) => updateSlot(i, { end: toHHMM(v) })} format={(v) => fmtTime(toHHMM(v), lang)} width={76} />
          </Row>
          <Pressable onPress={() => setSlots((ss) => ss.filter((_, j) => j !== i))} style={{ alignSelf: 'flex-end', marginTop: 6, padding: 4 }}>
            <Txt variant="small" color={t.dangerText} weight="700">
              {tr('study.course.removeSlot')}
            </Txt>
          </Pressable>
        </Card>
      ))}
      <Chip label={tr('study.course.addSlot')} emoji="➕" onPress={addSlot} style={{ alignSelf: 'flex-start' }} />

      <PillButton label={tr('common.btn.save')} onPress={save} disabled={!name.trim()} style={{ marginTop: 24 }} />
      {id ? (
        <View style={{ marginTop: 12 }}>
          <ConfirmDelete
            label={tr('study.course.delete')}
            confirmLabel={tr('study.course.confirmDelete')}
            onConfirm={() => {
              deleteCourse(id);
              router.back();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
