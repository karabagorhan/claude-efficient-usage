import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { PairingPanel, type PairResult } from '../src/components/PairingPanel';
import { Btn, Card, Chip, Field, Screen, Txt } from '../src/components/ui';
import { GOALS, HABIT_COLORS, PACKS, TEMPLATES, templateToHabit } from '../src/data/templates';
import { uuid } from '../src/lib/id';
import { ensureSession, isBackendConfigured } from '../src/lib/supabase';
import { useStore } from '../src/store/store';
import { useTheme } from '../src/theme';

const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🦄', '🐙', '🦉', '🐧', '🐸', '🌟', '🔥'];

export default function Onboarding() {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(AVATARS[0]);
  const [color, setColor] = useState(HABIT_COLORS[6]);
  const [goals, setGoals] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const finish = async (pair: PairResult | null) => {
    setBusy(true);
    setErr(null);
    try {
      let uid = pair?.uid;
      if (!uid) uid = isBackendConfigured ? await ensureSession() : uuid();
      const store = useStore.getState();
      store.setMe({ id: uid, name: name.trim() || 'Ben', emoji, color });
      const packIds = new Set<string>();
      goals.forEach((g) => GOALS.find((x) => x.id === g)?.packs.forEach((p) => packIds.add(p)));
      const nos = new Set<number>();
      packIds.forEach((p) => PACKS.find((x) => x.id === p)?.items.forEach((n) => nos.add(n)));
      const items = TEMPLATES.filter((x) => nos.has(x.no) && !x.weeklyQuota).slice(0, 7);
      useStore.getState().addHabitsFromTemplates(items.map((x) => templateToHabit(x, color)));
      if (pair) useStore.getState().setPair(pair.pairId, pair.code);
      // me set edilince kök yönlendirme otomatik (tabs)'a geçer
    } catch (e: any) {
      setErr(e?.message ?? 'Hata');
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <Screen scroll={false} style={{ justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} size="large" />
        {err ? <Txt color={t.danger} center style={{ marginTop: 12 }}>{err}</Txt> : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt size={13} dim weight="700" style={{ marginTop: 8 }}>ADIM {step + 1} / 3</Txt>

      {step === 0 && (
        <View>
          <Txt size={30} weight="800" style={{ marginTop: 8 }}>DuoPlus'a hoş geldin 👋</Txt>
          <Txt dim style={{ marginTop: 6, marginBottom: 20 }}>
            Günlük rutinlerini tamamla, puan topla, partnerinle yarış. Önce seni tanıyalım.
          </Txt>
          <Field label="Adın" value={name} onChangeText={setName} placeholder="Örn. Orhan" maxLength={20} />
          <Txt size={13} dim weight="600" style={{ marginBottom: 8 }}>Avatarın</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {AVATARS.map((a) => (
              <Pressable key={a} onPress={() => setEmoji(a)} style={{ width: 52, height: 52, margin: 4, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: emoji === a ? color + '40' : t.cardAlt, borderWidth: emoji === a ? 2 : 0, borderColor: color }}>
                <Text style={{ fontSize: 26 }}>{a}</Text>
              </Pressable>
            ))}
          </View>
          <Txt size={13} dim weight="600" style={{ marginBottom: 8 }}>Rengin</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
            {HABIT_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={{ width: 36, height: 36, margin: 5, borderRadius: 18, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: t.text }} />
            ))}
          </View>
          <Btn label="Devam" disabled={name.trim().length < 2} onPress={() => setStep(1)} />
        </View>
      )}

      {step === 1 && (
        <View>
          <Txt size={26} weight="800" style={{ marginTop: 8 }}>Hedeflerin neler?</Txt>
          <Txt dim style={{ marginTop: 6, marginBottom: 16 }}>Sana uygun başlangıç rutinleri önereceğiz (sonra değiştirebilirsin).</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {GOALS.map((g) => (
              <Chip key={g.id} emoji={g.emoji} label={g.label} active={goals.includes(g.id)} color={color} onPress={() => setGoals((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))} />
            ))}
          </View>
          <Btn label="Devam" style={{ marginTop: 20 }} onPress={() => setStep(2)} />
          <Btn kind="ghost" label="Geri" style={{ marginTop: 8 }} onPress={() => setStep(0)} />
        </View>
      )}

      {step === 2 && (
        <View>
          <Txt size={26} weight="800" style={{ marginTop: 8 }}>Partnerinle eşleş 💞</Txt>
          <Txt dim style={{ marginTop: 6, marginBottom: 16 }}>
            Biriniz kod üretir, diğeri kodu girer. Sonra birbirinizin puanlarını ve günlük/haftalık/aylık sıralamayı görürsünüz.
          </Txt>
          <PairingPanel onDone={(r) => finish(r)} onSkip={() => finish(null)} />
          <Btn kind="ghost" label="Geri" style={{ marginTop: 8 }} onPress={() => setStep(1)} />
        </View>
      )}
    </Screen>
  );
}
