import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card, Chip, Field, Header, IconButton, PillButton, Row, Screen, Txt, success } from '../../src/components/ui';
import { MOOD_TAGS } from '../../src/data/moodTags';
import { addDays, daysInMonth, dayKeyOf, monthStartKey, weekdayOf } from '../../src/engine/dates';
import { MoodFace, moodColor } from '../../src/features/tools/MoodFace';
import { DAYS_LETTER, L, fmtDay, useLang, useT } from '../../src/i18n';
import { useCore } from '../../src/store/core';
import { useMood } from '../../src/store/slices/mood';
import { alpha, radius, useTheme } from '../../src/theme';

export default function MoodScreen() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const today = dayKeyOf();
  const entries = useMood((s) => s.entries);
  const existing = entries[today];
  const [level, setLevel] = useState(existing?.level ?? 0);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [monthAnchor, setMonthAnchor] = useState(monthStartKey(today));

  const save = () => {
    if (!level) return;
    useMood.getState().save({ level, tags, note }, today);
    const core = useCore.getState();
    const c = core.completeLinked('mood');
    if (!existing) core.logActivity('mood', today);
    core.pushToast('mood.saved');
    if (c) core.pushToast('toast.completed', { points: c.points });
    success();
  };

  const cells = useMemo(() => {
    const first = monthStartKey(monthAnchor);
    const lead = weekdayOf(first);
    const n = daysInMonth(first);
    const out: Array<string | null> = Array(lead).fill(null);
    for (let i = 0; i < n; i++) out.push(addDays(first, i));
    return out;
  }, [monthAnchor]);

  const nextMonth = () => setMonthAnchor(addDays(monthStartKey(monthAnchor), daysInMonth(monthAnchor)));
  const prevMonth = () => setMonthStartKeySafe(addDays(monthAnchor, -1));
  function setMonthStartKeySafe(k: string) {
    setMonthAnchor(monthStartKey(k));
  }

  const recent = useMemo(() => Object.values(entries).sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1)).slice(0, 7), [entries]);
  const last30 = Object.values(entries).filter((e) => e.dayKey > addDays(today, -30));
  const avg = last30.length ? last30.reduce((a, e) => a + e.level, 0) / last30.length : 0;
  const canNext = monthAnchor < monthStartKey(today);

  return (
    <Screen insetTop={false} header={<Header left="close" title={t('mood.title')} />}>
      <Txt variant="h1" center style={{ marginTop: 4 }}>
        {t('mood.question')}
      </Txt>
      <Row between style={{ marginTop: 18 }}>
        {[1, 2, 3, 4, 5].map((l) => (
          <Pressable key={l} onPress={() => setLevel(l)} style={{ alignItems: 'center', opacity: level && level !== l ? 0.45 : 1 }}>
            <MoodFace level={l} size={level === l ? 62 : 54} ring={level === l ? th.text : undefined} />
          </Pressable>
        ))}
      </Row>
      <Txt variant="h3" center style={{ marginTop: 12, minHeight: 24, color: level ? undefined : th.textFaint }}>
        {level ? t(`mood.level.${level}`) : ' '}
      </Txt>

      <Txt variant="h3" style={{ marginTop: 18 }}>
        {t('mood.tags')}
      </Txt>
      <Txt variant="small" dim style={{ marginBottom: 10 }}>
        {t('mood.tagsHint')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MOOD_TAGS.map((tg) => (
          <Chip
            key={tg.id}
            emoji={tg.emoji}
            label={L(tg.name, lang)}
            active={tags.includes(tg.id)}
            onPress={() => setTags((p) => (p.includes(tg.id) ? p.filter((x) => x !== tg.id) : [...p, tg.id]))}
          />
        ))}
      </View>

      <Field
        label={t('mood.note')}
        placeholder={t('mood.notePlaceholder')}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={280}
        containerStyle={{ marginTop: 18 }}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />
      <PillButton label={existing ? t('mood.update') : t('mood.saveToday')} disabled={!level} onPress={save} />

      {/* Takvim */}
      <Txt variant="h2" style={{ marginTop: 28, marginBottom: 10 }}>
        {t('mood.calendar')}
      </Txt>
      <Card>
        <Row between>
          <IconButton icon="chevron-back" onPress={prevMonth} size={22} />
          <Txt variant="bodyBold">{fmtDay(monthAnchor, lang, 'month')}</Txt>
          <IconButton icon="chevron-forward" onPress={canNext ? nextMonth : () => {}} size={22} color={canNext ? th.text : th.textFaint} />
        </Row>
        <Row style={{ marginTop: 8 }}>
          {DAYS_LETTER[lang].map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Txt variant="caption" dim>
                {d}
              </Txt>
            </View>
          ))}
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {cells.map((k, i) => {
            const e = k ? entries[k] : undefined;
            return (
              <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 }}>
                {k ? (
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: e ? moodColor(e.level) : th.cardAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: k === today ? 2 : 0,
                      borderColor: th.text,
                    }}
                  >
                    <Txt variant="caption" weight="700" color={e ? '#14171A' : th.textDim}>
                      {Number(k.slice(8))}
                    </Txt>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Row between>
          <View>
            <Txt variant="small" dim>
              {t('mood.avg30')}
            </Txt>
            <Txt variant="h2">{last30.length ? t('mood.avgValue', { n: avg.toFixed(1) }) : '–'}</Txt>
          </View>
          <Txt variant="small" dim>
            {last30.length ? t('mood.entries', { n: last30.length }) : t('mood.noAvg')}
          </Txt>
        </Row>
      </Card>

      <Txt variant="h2" style={{ marginTop: 24, marginBottom: 10 }}>
        {t('mood.recent')}
      </Txt>
      {recent.length === 0 ? (
        <Txt dim>{t('mood.none')}</Txt>
      ) : (
        recent.map((e) => (
          <View key={e.dayKey} style={{ backgroundColor: alpha(moodColor(e.level), th.isDark ? 0.25 : 0.2), borderRadius: radius.lg, padding: 12, marginBottom: 8, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <MoodFace level={e.level} size={42} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold">
                {fmtDay(e.dayKey, lang, 'short')} · {t(`mood.level.${e.level}`)}
              </Txt>
              {e.tags.length ? (
                <Txt variant="small" dim numberOfLines={1}>
                  {e.tags.map((id) => L(MOOD_TAGS.find((x) => x.id === id)?.name, lang)).join(', ')}
                </Txt>
              ) : null}
              {e.note ? (
                <Txt variant="small" numberOfLines={2}>
                  {e.note}
                </Txt>
              ) : null}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
