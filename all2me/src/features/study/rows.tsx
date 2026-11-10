/** Okul listelerinde kullanılan satır/kart bileşenleri ve tür seçici. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Bar, Chip, IconTile, PillButton, Row, Txt } from '../../components/ui';
import { useT } from '../../i18n';
import { radius, useTheme } from '../../theme';
import { itemProgress } from './calc';
import { CheckCircle, CountdownBadge } from './ui';
import { isClosed, ITEM_TYPES, TYPE_META, type Course, type StudyItem, type StudyItemType } from './types';

export function DeadlineRow({
  item,
  course,
  onPress,
  onToggle,
  hideCourse,
}: {
  item: StudyItem;
  course?: Course;
  onPress: () => void;
  onToggle: () => void;
  hideCourse?: boolean;
}) {
  const t = useTheme();
  const tr = useT();
  const closed = isClosed(item.status);
  const p = itemProgress(item);
  const stripe = t.pastel[course?.pastel ?? TYPE_META[item.type].pastel];
  const sub = [
    !hideCourse && course ? (course.code || course.name) : null,
    tr(`study.typeShort.${item.type}`),
    item.estHours ? tr('study.hoursShort', { n: item.estHours }) : null,
    item.subtasks.length ? `${item.subtasks.filter((s) => s.done).length}/${item.subtasks.length}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: t.card,
        borderRadius: radius.lg,
        marginBottom: 10,
        flexDirection: 'row',
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ width: 6, backgroundColor: stripe }} />
      <Row gap={12} style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
        <CheckCircle done={closed} onPress={onToggle} />
        <View style={{ flex: 1 }}>
          <Row gap={6}>
            <Text style={{ fontSize: 16 }}>{TYPE_META[item.type].emoji}</Text>
            <Txt variant="bodyBold" numberOfLines={2} style={{ flex: 1, textDecorationLine: closed ? 'line-through' : 'none' }} dim={closed}>
              {item.title}
            </Txt>
            {item.priority === 'high' && !closed ? <Ionicons name="flag" size={14} color={t.danger} /> : null}
          </Row>
          <Txt variant="small" dim numberOfLines={1} style={{ marginTop: 2 }}>
            {sub}
          </Txt>
          {p > 0 && !closed ? (
            <View style={{ marginTop: 8 }}>
              <Bar value={p} height={5} color={t.purple} />
            </View>
          ) : null}
        </View>
        {item.due || closed ? <CountdownBadge due={item.due} time={item.time} closed={closed} small /> : null}
      </Row>
    </Pressable>
  );
}

export function PaperCard({ item, onPress, onPages }: { item: StudyItem; onPress: () => void; onPages: (delta: number) => void }) {
  const t = useTheme();
  const tr = useT();
  const pp = item.paper ?? { pagesRead: 0, pagesTotal: 0, pass: 0 as const };
  const closed = isClosed(item.status);
  const meta = [pp.authors, pp.year].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: t.pastel.purple, borderRadius: radius.lg, padding: 16, marginBottom: 12, opacity: pressed ? 0.92 : 1 })}>
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 30 }}>{closed ? '✅' : '📄'}</Text>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyBold" color={t.onPastel} numberOfLines={2}>
            {item.title}
          </Txt>
          {meta ? (
            <Txt variant="small" color={t.onPastel} numberOfLines={1} style={{ opacity: 0.75 }}>
              {meta}
            </Txt>
          ) : null}
        </View>
        {item.due && !closed ? <CountdownBadge due={item.due} time={item.time} small /> : null}
      </Row>
      <Row between style={{ marginTop: 12, marginBottom: 6 }}>
        <Txt variant="small" weight="700" color={t.onPastel}>
          {pp.pagesTotal > 0 ? tr('study.reading.pages', { a: pp.pagesRead, b: pp.pagesTotal }) : tr('study.reading.pagesOnly', { a: pp.pagesRead })}
        </Txt>
        <Row gap={4}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: radius.pill,
                backgroundColor: pp.pass >= n ? t.primary : 'transparent',
                borderWidth: 1,
                borderColor: t.onPastel,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: pp.pass >= n ? t.onPrimary : t.onPastel }}>{tr('study.reading.passN', { n })}</Text>
            </View>
          ))}
        </Row>
      </Row>
      <Bar value={pp.pagesTotal > 0 ? pp.pagesRead / pp.pagesTotal : closed ? 1 : 0} color={t.purple} bg={t.card} />
      {!closed ? (
        <Row gap={8} style={{ marginTop: 12 }}>
          <Chip label={tr('study.reading.plusPages', { n: 5 })} onPress={() => onPages(5)} />
          <Chip label={tr('study.reading.plusPages', { n: 10 })} onPress={() => onPages(10)} />
          <Chip label={tr('study.reading.minusPages', { n: 5 })} onPress={() => onPages(-5)} />
        </Row>
      ) : null}
    </Pressable>
  );
}

/** Tür seçimi (hızlı ekle). */
export function TypePicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (type: StudyItemType) => void }) {
  const t = useTheme();
  const tr = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.overlay, justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, paddingBottom: 32 }}>
          <Txt variant="h2" style={{ marginBottom: 4 }}>
            {tr('study.add.title')}
          </Txt>
          <Txt dim style={{ marginBottom: 16 }}>
            {tr('study.add.body')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
            {ITEM_TYPES.map((ty) => (
              <IconTile key={ty} emoji={TYPE_META[ty].emoji} label={tr(`study.typeShort.${ty}`)} pastel={TYPE_META[ty].pastel} size={64} onPress={() => onPick(ty)} style={{ width: '25%' }} />
            ))}
          </View>
          <PillButton label={tr('common.btn.cancel')} kind="outline" onPress={onClose} style={{ marginTop: 20 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
