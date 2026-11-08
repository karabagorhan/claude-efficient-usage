import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Btn, Card, Row, Screen, Txt, success } from '../src/components/ui';
import { ARTICLES } from '../src/data/library';
import { TEMPLATES, categoryColor, templateToHabit } from '../src/data/templates';
import { useStore } from '../src/store/store';

export default function Library() {
  const [open, setOpen] = useState<string | null>(null);
  const add = useStore((s) => s.addHabitsFromTemplates);

  return (
    <Screen padBottom={40}>
      <Txt dim size={13} style={{ marginBottom: 8 }}>
        Kısa rehberler. Genel bilgi amaçlıdır, tıbbi tavsiye yerine geçmez.
      </Txt>
      {ARTICLES.map((a) => {
        const isOpen = open === a.id;
        return (
          <Card key={a.id} style={{ marginBottom: 10 }} onPress={() => setOpen(isOpen ? null : a.id)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt size={12} dim weight="700">{a.category.toUpperCase()} · {a.minutes} dk</Txt>
                <Txt weight="700" size={16} style={{ marginTop: 2 }}>{a.emoji} {a.title}</Txt>
              </View>
              <Txt dim size={18}>{isOpen ? '⌃' : '⌄'}</Txt>
            </Row>
            {isOpen && (
              <View style={{ marginTop: 10 }}>
                {a.body.map((p, i) => <Txt key={i} style={{ marginBottom: 8, lineHeight: 21 }}>• {p}</Txt>)}
                {a.suggest?.length ? (
                  <Btn
                    small
                    kind="soft"
                    label="Önerilen görevleri ekle"
                    onPress={() => {
                      const n = add(a.suggest!.map((no) => { const tpl = TEMPLATES.find((x) => x.no === no)!; return templateToHabit(tpl, categoryColor(tpl.category)); }));
                      success();
                      Alert.alert(n ? `${n} görev eklendi` : 'Hepsi zaten ekli');
                    }}
                  />
                ) : null}
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
