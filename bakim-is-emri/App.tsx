import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { kaydet, yukle } from './src/storage';
import {
  DURUMLAR,
  Durum,
  IsEmri,
  ONCELIKLER,
  Oncelik,
  sonrakiDurum,
} from './src/types';

const ONCELIK_RENK: Record<Oncelik, string> = {
  Düşük: '#2e7d32',
  Orta: '#ed8b00',
  Yüksek: '#c62828',
};
const DURUM_RENK: Record<Durum, string> = {
  Açık: '#1565c0',
  'Devam Ediyor': '#ed8b00',
  Kapalı: '#6b7280',
};

export default function App() {
  const [liste, setListe] = useState<IsEmri[]>([]);
  const [hazir, setHazir] = useState(false);
  const [filtre, setFiltre] = useState<Durum | 'Tümü'>('Tümü');
  const [formAcik, setFormAcik] = useState(false);

  useEffect(() => {
    yukle().then((l) => {
      setListe(l);
      setHazir(true);
    });
  }, []);

  useEffect(() => {
    if (hazir) kaydet(liste);
  }, [liste, hazir]);

  const gorunen = useMemo(
    () => (filtre === 'Tümü' ? liste : liste.filter((i) => i.durum === filtre)),
    [liste, filtre],
  );

  const ekle = (yeni: Omit<IsEmri, 'id' | 'durum' | 'olusturma'>) => {
    setListe((l) => [
      {
        ...yeni,
        id: Date.now().toString(),
        durum: 'Açık',
        olusturma: new Date().toISOString(),
      },
      ...l,
    ]);
    setFormAcik(false);
  };

  const durumDegistir = (id: string) =>
    setListe((l) =>
      l.map((i) => (i.id === id ? { ...i, durum: sonrakiDurum(i.durum) } : i)),
    );

  const sil = (id: string) =>
    Alert.alert('Silinsin mi?', 'Bu iş emri kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setListe((l) => l.filter((i) => i.id !== id)),
      },
    ]);

  const sayi = (d: Durum) => liste.filter((i) => i.durum === d).length;

  return (
    <SafeAreaView style={s.kok}>
      <StatusBar style="dark" />
      <View style={s.baslikSatiri}>
        <Text style={s.baslik}>Bakım İş Emirleri</Text>
        <Text style={s.ozet}>
          {sayi('Açık')} açık · {sayi('Devam Ediyor')} devam · {sayi('Kapalı')} kapalı
        </Text>
      </View>

      <View style={s.filtreSatiri}>
        {(['Tümü', ...DURUMLAR] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFiltre(f)}
            style={[s.filtre, filtre === f && s.filtreSecili]}
          >
            <Text style={[s.filtreYazi, filtre === f && s.filtreYaziSecili]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={gorunen}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.liste}
        ListEmptyComponent={
          <Text style={s.bos}>
            {hazir ? 'İş emri yok. Sağ alttaki + ile ekle.' : 'Yükleniyor…'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={s.kart}>
            <View style={s.kartUst}>
              <Text style={s.kartBaslik}>{item.baslik}</Text>
              <View style={[s.rozet, { backgroundColor: ONCELIK_RENK[item.oncelik] }]}>
                <Text style={s.rozetYazi}>{item.oncelik}</Text>
              </View>
            </View>
            {!!item.ekipman && <Text style={s.ekipman}>⚙ {item.ekipman}</Text>}
            {!!item.aciklama && <Text style={s.aciklama}>{item.aciklama}</Text>}
            <Text style={s.tarih}>
              {new Date(item.olusturma).toLocaleDateString('tr-TR')}
            </Text>
            <View style={s.kartAlt}>
              <Pressable
                onPress={() => durumDegistir(item.id)}
                style={[s.durumDugme, { borderColor: DURUM_RENK[item.durum] }]}
              >
                <Text style={[s.durumYazi, { color: DURUM_RENK[item.durum] }]}>
                  {item.durum} ›
                </Text>
              </Pressable>
              <Pressable onPress={() => sil(item.id)}>
                <Text style={s.sil}>Sil</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable style={s.fab} onPress={() => setFormAcik(true)}>
        <Text style={s.fabYazi}>+</Text>
      </Pressable>

      <YeniForm acik={formAcik} onKapat={() => setFormAcik(false)} onEkle={ekle} />
    </SafeAreaView>
  );
}

function YeniForm({
  acik,
  onKapat,
  onEkle,
}: {
  acik: boolean;
  onKapat: () => void;
  onEkle: (i: Omit<IsEmri, 'id' | 'durum' | 'olusturma'>) => void;
}) {
  const [baslik, setBaslik] = useState('');
  const [ekipman, setEkipman] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [oncelik, setOncelik] = useState<Oncelik>('Orta');

  const gonder = () => {
    if (!baslik.trim()) {
      Alert.alert('Başlık gerekli');
      return;
    }
    onEkle({
      baslik: baslik.trim(),
      ekipman: ekipman.trim(),
      aciklama: aciklama.trim(),
      oncelik,
    });
    setBaslik('');
    setEkipman('');
    setAciklama('');
    setOncelik('Orta');
  };

  return (
    <Modal visible={acik} animationType="slide" onRequestClose={onKapat}>
      <SafeAreaView style={s.kok}>
        <KeyboardAvoidingView
          style={s.form}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Text style={s.baslik}>Yeni İş Emri</Text>
          <TextInput
            style={s.girdi}
            placeholder="Başlık (ör. Pompa rulman değişimi)"
            value={baslik}
            onChangeText={setBaslik}
          />
          <TextInput
            style={s.girdi}
            placeholder="Ekipman / Tag (ör. P-101)"
            value={ekipman}
            onChangeText={setEkipman}
          />
          <TextInput
            style={[s.girdi, s.cokSatir]}
            placeholder="Açıklama"
            value={aciklama}
            onChangeText={setAciklama}
            multiline
          />
          <Text style={s.etiket}>Öncelik</Text>
          <View style={[s.filtreSatiri, s.formFiltre]}>
            {ONCELIKLER.map((o) => (
              <Pressable
                key={o}
                onPress={() => setOncelik(o)}
                style={[s.filtre, oncelik === o && s.filtreSecili]}
              >
                <Text style={[s.filtreYazi, oncelik === o && s.filtreYaziSecili]}>{o}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.formAlt}>
            <Pressable style={s.ikincil} onPress={onKapat}>
              <Text style={s.ikincilYazi}>Vazgeç</Text>
            </Pressable>
            <Pressable style={s.birincil} onPress={gonder}>
              <Text style={s.birincilYazi}>Kaydet</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  kok: { flex: 1, backgroundColor: '#f5f6f8' },
  baslikSatiri: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  baslik: { fontSize: 24, fontWeight: '700', color: '#111827' },
  ozet: { marginTop: 4, color: '#6b7280' },
  filtreSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  filtre: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#e5e7eb' },
  filtreSecili: { backgroundColor: '#1f2937' },
  filtreYazi: { color: '#374151' },
  filtreYaziSecili: { color: '#fff' },
  liste: { padding: 16, paddingBottom: 96, gap: 12 },
  bos: { textAlign: 'center', color: '#6b7280', marginTop: 48 },
  kart: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6, elevation: 1 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  kartBaslik: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  rozet: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  rozetYazi: { color: '#fff', fontSize: 12, fontWeight: '600' },
  ekipman: { color: '#374151' },
  aciklama: { color: '#4b5563' },
  tarih: { color: '#9ca3af', fontSize: 12 },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  durumDugme: { borderWidth: 1, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 12 },
  durumYazi: { fontWeight: '600' },
  sil: { color: '#c62828' },
  fab: { position: 'absolute', right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabYazi: { color: '#fff', fontSize: 30, lineHeight: 34 },
  form: { flex: 1, padding: 16, gap: 12 },
  girdi: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cokSatir: { minHeight: 90, textAlignVertical: 'top' },
  formFiltre: { paddingHorizontal: 0 },
  etiket: { fontWeight: '600', color: '#374151' },
  formAlt: { flexDirection: 'row', gap: 12, marginTop: 8 },
  birincil: { flex: 1, backgroundColor: '#1f2937', borderRadius: 10, padding: 14, alignItems: 'center' },
  birincilYazi: { color: '#fff', fontWeight: '600' },
  ikincil: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 10, padding: 14, alignItems: 'center' },
  ikincilYazi: { color: '#374151', fontWeight: '600' },
});
