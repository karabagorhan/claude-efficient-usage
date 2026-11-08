import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Btn, Card, Chip, Row, Screen, SectionTitle, Txt, success } from '../src/components/ui';
import { CATEGORIES, PACKS, TEMPLATES, categoryColor, templateToHabit } from '../src/data/templates';
import { CONFIG } from '../src/engine/config';
import { useStore } from '../src/store/store';
import { useTheme } from '../src/theme';

export default function Templates() {
  const t = useTheme();
  const me = useStore((s) => s.me)!;
  const habits = useStore((s) => s.habits);
  const add = useStore((s) => s.addHabitsFromTemplates);
  const [cat, setCat] = useState<string>('Hepsi');

  const have = useMemo(
    () => new Set(Object.values(habits).filter((h) => h.ownerId === me.id && !h.archived).map((h) => h.title)),
    [habits, me.id],
  );
  const list = TEMPLATES.filter((x) => cat === 'Hepsi' || x.category === cat);

  const addOne = (no: number) => {
    const tpl = TEMPLATES.find((x) => x.no === no)!;
    const n = add([templateToHabit(tpl, categoryColor(tpl.category))]);
    if (n) success();
  };

  const addPack = (id: string) => {
    const p = PACKS.find((x) => x.id === id)!;
    const n = add(p.items.map((no) => { const tpl = TEMPLATES.find((x) => x.no === no)!; return templateToHabit(tpl, categoryColor(tpl.category)); }));
    success();
    Alert.alert(p.name, n ? `${n} görev eklendi.` : 'Bu paketteki görevlerin hepsi zaten ekli.');
  };

  return (
    <Screen padBottom={40}>
      <SectionTitle>Hazır paketler</SectionTitle>
      {PACKS.map((p) => {
        const base = p.items.reduce((s, no) => s + CONFIG.basePoints[TEMPLATES.find((x) => x.no === no)!.difficulty], 0);
        return (
          <Card key={p.id} style={{ marginBottom: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt weight="700" size={16}>{p.emoji} {p.name}</Txt>
                <Txt size={12} dim>{p.blurb} · {p.items.length} görev · ~{base} SP</Txt>
              </View>
              <Btn small kind="soft" label="Paketi ekle" onPress={() => addPack(p.id)} />
            </Row>
          </Card>
        );
      })}

      <SectionTitle>Tüm görevler ({TEMPLATES.length})</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label="Hepsi" active={cat === 'Hepsi'} onPress={() => setCat('Hepsi')} />
        {CATEGORIES.map((c) => <Chip key={c.id} label={c.id} emoji={c.icon} color={c.color} active={cat === c.id} onPress={() => setCat(c.id)} />)}
      </View>

      {list.map((x) => {
        const has = have.has(x.title);
        return (
          <Pressable key={x.no} disabled={has} onPress={() => addOne(x.no)}>
            <Row style={{ backgroundColor: t.card, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: t.border, opacity: has ? 0.55 : 1 }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: categoryColor(x.category) + '26', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{x.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Txt weight="700" numberOfLines={1}>{x.title}</Txt>
                <Txt size={12} dim>
                  {CONFIG.basePoints[x.difficulty]} SP · {x.kind === 'timer' ? `${x.target} dk` : x.kind === 'counter' ? `Sayaç ${x.target}` : 'Evet/Hayır'}
                  {x.weeklyQuota ? ` · Haftada ${x.weeklyQuota}` : ''}{x.together ? ' · 💞' : ''}
                </Txt>
              </View>
              <Txt weight="800" color={has ? t.success : t.primary} size={20}>{has ? '✓' : '＋'}</Txt>
            </Row>
          </Pressable>
        );
      })}
    </Screen>
  );
}
