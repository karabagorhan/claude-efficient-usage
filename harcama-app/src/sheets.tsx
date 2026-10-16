import { ReactNode, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CATS, Expense, MONTHS, Settings, Sub, addDays, amountText, catIndex, dayLabel, parseAmount, todayIso, uid } from './lib';
import { FONTS, Theme } from './theme';
import { Button, CatIcon, Chip, Label, catIconName } from './ui';

function Sheet({ visible, title, onClose, children, t }: { visible: boolean; title: string; onClose: () => void; children: ReactNode; t: Theme }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.surface }}>
        <View style={st.head}>
          <Text style={[st.title, { color: t.fg }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={{ color: t.accent, fontSize: 17, fontWeight: '600' }}>Kapat</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({ label, children, t }: { label: string; children: ReactNode; t: Theme }) {
  return (
    <View style={{ gap: 6 }}>
      <Label t={t}>{label}</Label>
      {children}
    </View>
  );
}

function inputStyle(t: Theme, big = false) {
  return [st.input, big && st.big, { backgroundColor: t.bg, borderColor: t.line, color: t.fg }];
}

function CatChips({ value, onChange, t }: { value: string; onChange: (c: string) => void; t: Theme }) {
  return (
    <View style={st.chips}>
      {CATS.map((c) => (
        <Chip key={c} label={c} active={value === c} color={t.cats[catIndex(c)]} icon={catIconName(c)} onPress={() => onChange(c)} t={t} />
      ))}
    </View>
  );
}

/** Silme iki dokunuşla: yanlışlıkla silinmesin. */
function DeleteButton({ onDelete, t }: { onDelete: () => void; t: Theme }) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      label={armed ? 'Emin misin? Sil' : 'Sil'}
      kind={armed ? 'danger' : 'ghost'}
      onPress={() => (armed ? onDelete() : setArmed(true))}
      t={t}
    />
  );
}

/* ---------- Harcama ekle / düzenle ---------- */
export function ExpenseSheet({ visible, initial, prefill, frequent = [], onSave, onDelete, onClose, t }: {
  visible: boolean;
  initial: Expense | null;
  prefill?: { amount?: number; cat?: string };
  frequent?: { cat: string; note: string; amount: number }[];
  onSave: (e: Expense) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  t: Theme;
}) {
  const [amount, setAmount] = useState(initial ? amountText(initial.amount) : prefill?.amount ? amountText(prefill.amount) : '');
  const [cat, setCat] = useState(initial?.cat ?? prefill?.cat ?? CATS[0]);
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const value = parseAmount(amount);
  const isToday = date >= todayIso();

  const save = () => {
    if (!value) return;
    const e: Expense = { id: initial?.id ?? uid(), amount: value, cat, note: note.trim(), date, ts: initial?.ts ?? Date.now() };
    if (initial?.sub) {
      e.sub = initial.sub;
      e.period = initial.period;
    }
    onSave(e);
  };

  return (
    <Sheet visible={visible} title={initial ? 'Harcamayı düzenle' : 'Yeni harcama'} onClose={onClose} t={t}>
      {!initial && frequent.length ? (
        <Field label="Sık girdiklerin" t={t}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="always">
            {frequent.map((f) => (
              <Pressable
                key={f.cat + f.note}
                onPress={() => { setCat(f.cat); setNote(f.note); setAmount(amountText(f.amount)); }}
                style={({ pressed }) => [st.freq, { backgroundColor: t.bg, borderColor: t.line, opacity: pressed ? 0.7 : 1 }]}
              >
                <CatIcon cat={f.cat} t={t} size={28} />
                <View>
                  <Text style={{ color: t.fg, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{f.note}</Text>
                  <Text style={{ color: t.muted, fontSize: 12 }}>₺{amountText(f.amount)}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Field>
      ) : null}
      <Field label="Tutar (₺)" t={t}>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={t.muted}
          autoFocus={!initial}
          style={inputStyle(t, true)}
          accessibilityLabel="Tutar"
        />
      </Field>
      <Field label="Kategori" t={t}>
        <CatChips value={cat} onChange={setCat} t={t} />
      </Field>
      <Field label="Not" t={t}>
        <TextInput value={note} onChangeText={setNote} placeholder="İsteğe bağlı, ör. Simit ve çay" placeholderTextColor={t.muted} style={inputStyle(t)} />
      </Field>
      <Field label="Tarih" t={t}>
        <View style={st.chips}>
          <Chip label="Bugün" active={date === todayIso()} onPress={() => setDate(todayIso())} t={t} />
          <Chip label="Dün" active={date === addDays(todayIso(), -1)} onPress={() => setDate(addDays(todayIso(), -1))} t={t} />
          <Chip label="2 gün önce" active={date === addDays(todayIso(), -2)} onPress={() => setDate(addDays(todayIso(), -2))} t={t} />
        </View>
        <View style={[st.stepper, { backgroundColor: t.bg, borderColor: t.line }]}>
          <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={8} style={st.stepBtn} accessibilityLabel="Önceki gün">
            <Text style={[st.stepTxt, { color: t.fg }]}>‹</Text>
          </Pressable>
          <Text style={{ color: t.fg, fontSize: 16, fontWeight: '500' }}>{dayLabel(date)}</Text>
          <Pressable onPress={() => !isToday && setDate(addDays(date, 1))} hitSlop={8} style={[st.stepBtn, { opacity: isToday ? 0.3 : 1 }]} accessibilityLabel="Sonraki gün">
            <Text style={[st.stepTxt, { color: t.fg }]}>›</Text>
          </Pressable>
        </View>
      </Field>
      <View style={st.actions}>
        {initial ? <DeleteButton onDelete={() => onDelete(initial.id)} t={t} /> : null}
        <Button label="Kaydet" onPress={save} disabled={!value} t={t} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

/* ---------- Abonelik ekle / düzenle ---------- */
export function SubSheet({ visible, initial, onSave, onDelete, onClose, t }: {
  visible: boolean; initial: Sub | null; onSave: (s: Sub) => void; onDelete: (id: string) => void; onClose: () => void; t: Theme;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? amountText(initial.amount) : '');
  const [freq, setFreq] = useState<Sub['freq']>(initial?.freq ?? 'monthly');
  const [day, setDay] = useState(String(initial?.day ?? new Date().getDate()));
  const [month, setMonth] = useState(initial?.month ?? new Date().getMonth() + 1);
  const [cat, setCat] = useState(initial?.cat ?? 'Eğlence');
  const value = parseAmount(amount);
  const d = parseInt(day, 10);
  const valid = !!name.trim() && !!value && d >= 1 && d <= 31;

  const save = () => {
    if (!valid) return;
    onSave({ id: initial?.id ?? 'sub_' + uid(), name: name.trim(), amount: value, day: d, freq, month: freq === 'yearly' ? month : 0, cat, skip: initial?.skip ?? '' });
  };

  return (
    <Sheet visible={visible} title={initial ? 'Aboneliği düzenle' : 'Yeni abonelik'} onClose={onClose} t={t}>
      <Field label="Ad" t={t}>
        <TextInput value={name} onChangeText={setName} placeholder="ör. Netflix, telefon faturası" placeholderTextColor={t.muted} autoFocus={!initial} style={inputStyle(t)} />
      </Field>
      <Field label="Tutar (₺)" t={t}>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={t.muted} style={inputStyle(t, true)} />
      </Field>
      <Field label="Sıklık" t={t}>
        <View style={st.chips}>
          <Chip label="Aylık" active={freq === 'monthly'} onPress={() => setFreq('monthly')} t={t} />
          <Chip label="Yıllık" active={freq === 'yearly'} onPress={() => setFreq('yearly')} t={t} />
        </View>
      </Field>
      <Field label="Ödeme günü (1–31)" t={t}>
        <TextInput value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} style={inputStyle(t)} />
      </Field>
      {freq === 'yearly' ? (
        <Field label="Ödeme ayı" t={t}>
          <View style={st.chips}>
            {MONTHS.map((m, i) => (
              <Chip key={m} label={m.slice(0, 3)} active={month === i + 1} onPress={() => setMonth(i + 1)} t={t} />
            ))}
          </View>
        </Field>
      ) : null}
      <Field label="Kategori" t={t}>
        <CatChips value={cat} onChange={setCat} t={t} />
      </Field>
      <View style={st.actions}>
        {initial ? <DeleteButton onDelete={() => onDelete(initial.id)} t={t} /> : null}
        <Button label="Kaydet" onPress={save} disabled={!valid} t={t} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

/* ---------- Ayarlar ekranı: bütçe, bildirimler, dışa/içe aktarma ---------- */
export function SettingsPanel({ settings, focusBudget, onChange, onExport, onBackup, onRestore, ym, monthName, t }: {
  settings: Settings;
  focusBudget?: boolean;
  onChange: (s: Settings) => void;
  onExport: (ym: string | null) => void;
  onBackup: () => void;
  onRestore: () => void;
  ym: string;
  monthName: string;
  t: Theme;
}) {
  const [budget, setBudget] = useState(settings.budget ? amountText(settings.budget) : '');
  const row = [st.row, { borderColor: t.line }];
  return (
    <View style={{ gap: 22 }}>
      <Field label="Aylık bütçe (₺)" t={t}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            value={budget}
            onChangeText={setBudget}
            keyboardType="decimal-pad"
            placeholder="Bütçe yok"
            placeholderTextColor={t.muted}
            autoFocus={focusBudget}
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => onChange({ ...settings, budget: parseAmount(budget) })}
            style={[...inputStyle(t), { flex: 1 }]}
            accessibilityLabel="Aylık bütçe"
          />
          <Button label="Kaydet" onPress={() => { Keyboard.dismiss(); onChange({ ...settings, budget: parseAmount(budget) }); }} t={t} style={{ height: 48 }} />
        </View>
      </Field>
      <Field label="Görünüm" t={t}>
        <View style={st.chips}>
          <Chip label="Noir" icon="moon-outline" active={settings.theme === 'noir'} onPress={() => onChange({ ...settings, theme: 'noir' })} t={t} />
          <Chip label="Fildişi" icon="sunny-outline" active={settings.theme === 'ivory'} onPress={() => onChange({ ...settings, theme: 'ivory' })} t={t} />
          <Chip label="Telefona göre" icon="phone-portrait-outline" active={settings.theme === 'system'} onPress={() => onChange({ ...settings, theme: 'system' })} t={t} />
        </View>
      </Field>

      <View style={{ gap: 0 }}>
        <Label t={t}>Kategori limitleri (aylık)</Label>
        <Text style={{ color: t.muted, fontSize: 14, lineHeight: 20, paddingVertical: 6 }}>
          Bir kategoride limitin %80'ine gelince Özet ve Raporlar'da uyarı görürsün. Boş bırakılan kategori limitsizdir.
        </Text>
        {CATS.map((c) => (
          <CatLimitRow key={c} cat={c} value={settings.catBudgets[c] || 0} t={t}
            onChange={(v) => {
              const next = { ...settings.catBudgets };
              if (v) next[c] = v; else delete next[c];
              onChange({ ...settings, catBudgets: next });
            }} />
        ))}
      </View>

      <View style={{ gap: 0 }}>
        <Label t={t}>Bildirimler</Label>
        <View style={row}>
          <Text style={[st.rowTxt, { color: t.fg }]}>Akşam hatırlatması</Text>
          <Switch value={settings.remind} onValueChange={(v) => onChange({ ...settings, remind: v })} trackColor={{ true: t.accent }} />
        </View>
        {settings.remind ? (
          <View style={row}>
            <Text style={[st.rowTxt, { color: t.fg }]}>Saat</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable hitSlop={10} onPress={() => onChange({ ...settings, remindHour: (settings.remindHour + 23) % 24 })} accessibilityLabel="Bir saat erken">
                <Text style={[st.stepTxt, { color: t.fg }]}>‹</Text>
              </Pressable>
              <Text style={{ color: t.fg, fontSize: 16, fontVariant: ['tabular-nums'] }}>{String(settings.remindHour).padStart(2, '0')}:00</Text>
              <Pressable hitSlop={10} onPress={() => onChange({ ...settings, remindHour: (settings.remindHour + 1) % 24 })} accessibilityLabel="Bir saat geç">
                <Text style={[st.stepTxt, { color: t.fg }]}>›</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <View style={row}>
          <Text style={[st.rowTxt, { color: t.fg }]}>Abonelik ödeme günü uyarısı</Text>
          <Switch value={settings.subRemind} onValueChange={(v) => onChange({ ...settings, subRemind: v })} trackColor={{ true: t.accent }} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Label t={t}>Excel</Label>
        <Button label={`${monthName} ayını Excel'e aktar`} kind="ghost" onPress={() => onExport(ym)} t={t} />
        <Button label="Tümünü Excel'e aktar" kind="ghost" onPress={() => onExport(null)} t={t} />
      </View>

      <View style={{ gap: 10 }}>
        <Label t={t}>Yedek</Label>
        <Text style={{ color: t.muted, fontSize: 14, lineHeight: 20 }}>
          Web sürümünden aldığın yedeği buradan yükleyebilirsin. Aynı kayıtlar iki kez eklenmez.
        </Text>
        <Button label="Yedek al" kind="ghost" onPress={onBackup} t={t} />
        <Button label="Yedekten geri yükle" kind="ghost" onPress={onRestore} t={t} />
      </View>
    </View>
  );
}

function CatLimitRow({ cat, value, onChange, t }: { cat: string; value: number; onChange: (v: number) => void; t: Theme }) {
  const [text, setText] = useState(value ? amountText(value) : '');
  const commit = () => {
    const v = parseAmount(text);
    if (v !== value) onChange(v);
  };
  return (
    <View style={[st.row, { borderColor: t.line }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <CatIcon cat={cat} t={t} size={30} />
        <Text style={[st.rowTxt, { color: t.fg }]}>{cat}</Text>
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        onEndEditing={commit}
        onBlur={commit}
        keyboardType="decimal-pad"
        placeholder="Limit yok"
        placeholderTextColor={t.muted}
        style={[st.limitInput, { backgroundColor: t.bg, borderColor: t.line, color: t.fg }]}
        accessibilityLabel={`${cat} aylık limiti`}
      />
    </View>
  );
}

const st = StyleSheet.create({
  freq: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, maxWidth: 200 },
  limitInput: { width: 110, height: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, fontSize: 16, textAlign: 'right' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontFamily: FONTS.display },
  body: { padding: 20, gap: 18, paddingBottom: 48 },
  input: { height: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 17 },
  big: { height: 64, fontSize: 32, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stepper: { height: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  stepBtn: { width: 40, alignItems: 'center' },
  stepTxt: { fontSize: 24, lineHeight: 28 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTxt: { fontSize: 16, flexShrink: 1, paddingRight: 12 },
});
