/**
 * Okul öğesi ekle/düzenle (modal). id = öğe id ya da 'new'; yeni öğede courseId? ve type? ön dolu. SPEC §6.5.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Chip, EmptyState, Field, Header, IconButton, PillButton, Row, Screen, Segmented, Txt } from '../../../src/components/ui';
import { applyCalendar, dropCalendar } from '../../../src/features/calendar/apply';
import { CalendarRow } from '../../../src/features/calendar/CalendarRow';
import { calKey, isInCalendar, itemSpec } from '../../../src/lib/calendar';
import { ensureStudyNotifSync } from '../../../src/features/study/notify';
import { isItemType, ITEM_TYPES, PRIORITIES, STATUSES, TYPE_META, type PaperInfo, type StudyItem, type StudyItemType } from '../../../src/features/study/types';
import { ChecklistEditor, ConfirmDelete, DateField, Label, Stepper } from '../../../src/features/study/ui';
import { useT } from '../../../src/i18n';
import { routes } from '../../../src/lib/routes';
import { useStudy, type StudyItemDraft } from '../../../src/store/slices/study';
import { useTheme } from '../../../src/theme';

const close = () => (router.canGoBack() ? router.back() : router.replace(routes.study()));
const PRIORITY_EMOJI = { low: '🟢', med: '🟡', high: '🔴' } as const;

function makeDraft(existing: StudyItem | undefined, type?: string, courseId?: string): StudyItemDraft {
  if (existing) return { ...existing, subtasks: [...existing.subtasks], paper: existing.paper ? { ...existing.paper } : undefined };
  const ty: StudyItemType = isItemType(type) ? type : 'homework';
  return {
    type: ty,
    title: '',
    courseId: courseId || undefined,
    status: 'todo',
    priority: 'med',
    subtasks: [],
    remind: { dayBefore: true, morning: true },
    paper: ty === 'reading' ? { pagesRead: 0, pagesTotal: 0, pass: 0 } : undefined,
  };
}

export default function StudyItemScreen() {
  const params = useLocalSearchParams<{ id: string; courseId?: string; type?: string }>();
  const isNew = !params.id || params.id === 'new';
  const existing = useStudy((s) => (isNew ? undefined : s.items[params.id]));
  const hydrated = useStudy((s) => s.hydrated);
  const tr = useT();

  useEffect(() => {
    ensureStudyNotifSync();
  }, []);

  if (!isNew && !existing) {
    return (
      <Screen header={<Header left="close" onLeft={close} />}>
        {hydrated ? <EmptyState emoji="🔍" title={tr('study.item.notFound')} action={{ label: tr('common.btn.close'), onPress: close }} /> : null}
      </Screen>
    );
  }
  return <ItemForm key={existing?.id ?? 'new'} existing={existing} type={params.type} courseId={params.courseId} />;
}

function ItemForm({ existing, type, courseId }: { existing?: StudyItem; type?: string; courseId?: string }) {
  const t = useTheme();
  const tr = useT();
  const { courses, saveItem, deleteItem } = useStudy(useShallow((s) => ({ courses: s.courses, saveItem: s.saveItem, deleteItem: s.deleteItem })));
  const courseList = useMemo(() => Object.values(courses).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)), [courses]);
  const [d, setD] = useState<StudyItemDraft>(() => makeDraft(existing, type, courseId));
  const set = (p: Partial<StudyItemDraft>) => setD((x) => ({ ...x, ...p }));
  const paper: PaperInfo = d.paper ?? { pagesRead: 0, pagesTotal: 0, pass: 0 };
  const setPaper = (p: Partial<PaperInfo>) => setD((x) => ({ ...x, paper: { ...(x.paper ?? { pagesRead: 0, pagesTotal: 0, pass: 0 }), ...p } }));
  const remind = d.remind ?? { dayBefore: true, morning: true };
  const isReading = d.type === 'reading';
  const canSave = d.title.trim().length > 0;
  const [cal, setCal] = useState(() => (existing ? isInCalendar(calKey.item(existing.id)) : false));

  const save = () => {
    if (!canSave) return;
    const out: StudyItemDraft = { ...d, paper: isReading ? { ...paper, pagesRead: paper.pagesTotal > 0 ? Math.min(paper.pagesRead, paper.pagesTotal) : paper.pagesRead } : d.paper };
    const savedId = saveItem(out);
    const spec = itemSpec(savedId);
    void applyCalendar(calKey.item(savedId), cal, spec ? [spec] : []);
    close();
  };

  const num = (s: string) => {
    const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <Screen
      padBottom={48}
      header={
        <Header
          left="close"
          onLeft={close}
          title={existing ? tr('study.item.edit') : tr('study.item.new')}
          right={<IconButton icon="checkmark" label={tr('common.btn.save')} onPress={save} color={canSave ? t.text : t.textFaint} />}
        />
      }
    >
      <Label style={{ marginTop: 4 }}>{tr('study.item.type')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ITEM_TYPES.map((ty) => (
          <Chip
            key={ty}
            emoji={TYPE_META[ty].emoji}
            label={tr(`study.type.${ty}`)}
            active={d.type === ty}
            onPress={() => set({ type: ty, paper: ty === 'reading' ? (d.paper ?? { pagesRead: 0, pagesTotal: 0, pass: 0 }) : d.paper })}
          />
        ))}
      </View>

      <Label>{tr('study.item.titleLabel')}</Label>
      <Field value={d.title} onChangeText={(v) => set({ title: v })} placeholder={tr(`study.ph.${d.type}`)} autoFocus={!existing} containerStyle={{ marginBottom: 0 }} />

      {courseList.length ? (
        <>
          <Label>{tr('study.item.course')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label={tr('study.item.noCourse')} active={!d.courseId} onPress={() => set({ courseId: undefined })} />
            {courseList.map((c) => (
              <Chip key={c.id} label={c.code || c.name} active={d.courseId === c.id} onPress={() => set({ courseId: c.id })} />
            ))}
          </View>
        </>
      ) : null}

      <Label>{tr('study.item.due')}</Label>
      <DateField value={d.due} time={d.time} withTime onChange={(due, time) => set({ due, time })} placeholder={tr('study.item.duePh')} />

      <CalendarRow
        label={tr('study.calendar.itemLabel')}
        hint={tr('study.calendar.itemHint')}
        unsupported={tr('study.calendar.unsupported')}
        needs={d.due ? undefined : tr('study.calendar.itemNeedDue')}
        value={cal}
        onChange={setCal}
      />

      <Label>{tr('study.item.status')}</Label>
      <Segmented value={d.status ?? 'todo'} onChange={(status) => set({ status })} options={STATUSES.map((s) => ({ id: s, label: tr(`study.statusShort.${s}`) }))} />

      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Label>{tr('study.item.priority')}</Label>
          <Row gap={6}>
            {PRIORITIES.map((p) => (
              <Chip key={p} label={tr(`study.priority.${p}`)} emoji={PRIORITY_EMOJI[p]} active={d.priority === p} onPress={() => set({ priority: p })} style={{ paddingHorizontal: 10 }} />
            ))}
          </Row>
        </View>
      </Row>

      <Label>{tr('study.item.est')}</Label>
      <Row between>
        <Txt dim style={{ flex: 1 }}>
          {tr('study.item.estSub')}
        </Txt>
        <Stepper value={d.estHours ?? 0} step={0.5} min={0} max={200} onChange={(v) => set({ estHours: v || undefined })} format={(v) => tr('study.hoursShort', { n: v })} width={64} />
      </Row>

      {isReading ? (
        <>
          <Label>{tr('study.paper.section')}</Label>
          <Field label={tr('study.paper.authors')} value={paper.authors ?? ''} onChangeText={(v) => setPaper({ authors: v })} placeholder={tr('study.paper.authorsPh')} />
          <Row gap={10}>
            <Field label={tr('study.paper.year')} value={paper.year ?? ''} onChangeText={(v) => setPaper({ year: v.replace(/[^0-9]/g, '').slice(0, 4) })} keyboardType="number-pad" placeholder="2024" containerStyle={{ width: 100 }} />
            <Field label={tr('study.paper.link')} value={paper.link ?? ''} onChangeText={(v) => setPaper({ link: v.trim() })} autoCapitalize="none" placeholder="10.1000/xyz" containerStyle={{ flex: 1 }} />
          </Row>
          <Row gap={10}>
            <Field label={tr('study.paper.read')} value={String(paper.pagesRead || '')} onChangeText={(v) => setPaper({ pagesRead: num(v) })} keyboardType="number-pad" placeholder="0" containerStyle={{ flex: 1 }} />
            <Field label={tr('study.paper.total')} value={String(paper.pagesTotal || '')} onChangeText={(v) => setPaper({ pagesTotal: num(v) })} keyboardType="number-pad" placeholder="0" containerStyle={{ flex: 1 }} />
          </Row>
          <Row gap={8} style={{ marginTop: -4 }}>
            {[5, 10, 20].map((n) => (
              <Chip key={n} label={tr('study.reading.plusPages', { n })} onPress={() => setPaper({ pagesRead: paper.pagesTotal ? Math.min(paper.pagesTotal, paper.pagesRead + n) : paper.pagesRead + n })} />
            ))}
          </Row>
          <Label>{tr('study.paper.pass')}</Label>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {([0, 1, 2, 3] as const).map((n) => (
              <Chip key={n} label={n === 0 ? tr('study.paper.pass0') : tr('study.reading.passN', { n })} active={paper.pass === n} onPress={() => setPaper({ pass: n })} />
            ))}
          </Row>
          <Txt variant="small" dim style={{ marginTop: 6 }}>
            {tr(`study.paper.passHint${paper.pass}`)}
          </Txt>
          <Label>{tr('study.paper.summary')}</Label>
          <Field value={paper.summary ?? ''} onChangeText={(v) => setPaper({ summary: v })} placeholder={tr('study.paper.summaryPh')} multiline style={{ minHeight: 96, textAlignVertical: 'top' }} />
        </>
      ) : null}

      <Label>{tr('study.item.subtasks')}</Label>
      <ChecklistEditor items={d.subtasks ?? []} onChange={(subtasks) => set({ subtasks })} placeholder={tr('study.item.subtaskPh')} />

      <Label>{tr('study.item.notes')}</Label>
      <Field value={d.notes ?? ''} onChangeText={(v) => set({ notes: v })} placeholder={tr('study.item.notesPh')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />

      <Label style={{ marginTop: 4 }}>{tr('study.item.remind')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip emoji="🔔" label={tr('study.remind.dayBefore')} active={remind.dayBefore} onPress={() => set({ remind: { ...remind, dayBefore: !remind.dayBefore } })} />
        <Chip emoji="☀️" label={tr('study.remind.morning')} active={remind.morning} onPress={() => set({ remind: { ...remind, morning: !remind.morning } })} />
        <Chip emoji="🔕" label={tr('study.remind.off')} active={!remind.dayBefore && !remind.morning} onPress={() => set({ remind: { dayBefore: false, morning: false } })} />
      </View>
      {!d.due && (remind.dayBefore || remind.morning) ? (
        <Txt variant="small" dim style={{ marginTop: 6 }}>
          {tr('study.remind.needDate')}
        </Txt>
      ) : null}

      <PillButton label={tr('common.btn.save')} onPress={save} disabled={!canSave} style={{ marginTop: 28 }} />
      {existing ? (
        <View style={{ marginTop: 12 }}>
          <ConfirmDelete
            label={tr('study.item.delete')}
            confirmLabel={tr('study.item.confirmDelete')}
            onConfirm={() => {
              dropCalendar(calKey.item(existing.id));
              deleteItem(existing.id);
              close();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
