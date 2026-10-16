import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Expense, MONTHS, Sub, iso, monthLabel, sum } from './lib';
import { Data, normalize } from './store';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const TL_FMT = '#,##0.00 "₺"';

/** Dosyayı geçici klasöre yazıp iOS paylaşım menüsünü açar (Dosyalar'a Kaydet, Mail, WhatsApp...). */
async function share(name: string, content: string | Uint8Array, mimeType: string, UTI: string) {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  await f.write(content);
  await Sharing.shareAsync(f.uri, { mimeType, UTI, dialogTitle: name });
}

// Excel tarih seri numarası (saat dilimi kaymasını önlemek için UTC ile)
function xlDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5;
}

function sheet(data: unknown[][], widths: number[], formats: Record<string, string>) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = 1; r <= range.e.r; r++) {
    for (const col of Object.keys(formats)) {
      const c = ws[col + (r + 1)];
      if (c && typeof c.v === 'number') c.z = formats[col];
    }
  }
  ws['!cols'] = widths.map((wch) => ({ wch }));
  return ws;
}

/** ym verilirse o ay, verilmezse tüm kayıtlar. Harcama yoksa false döner. */
export async function exportExcel(items: Expense[], subs: Sub[], ym: string | null) {
  const rows = items
    .filter((x) => !ym || x.date.slice(0, 7) === ym)
    .sort((p, q) => (p.date < q.date ? -1 : p.date > q.date ? 1 : p.ts - q.ts));
  if (!rows.length) return false;
  const wb = XLSX.utils.book_new();
  const total = sum(rows);

  const d1: unknown[][] = [['Tarih', 'Kategori', 'Not', 'Tutar', 'Abonelik']];
  rows.forEach((x) => d1.push([xlDate(x.date), x.cat, x.note, x.amount, x.sub ? 'Evet' : '']));
  d1.push([], ['', '', 'Toplam', total]);
  XLSX.utils.book_append_sheet(wb, sheet(d1, [12, 14, 34, 14, 10], { A: 'dd.mm.yyyy', D: TL_FMT }), 'Harcamalar');

  const by: Record<string, number> = {};
  const cnt: Record<string, number> = {};
  rows.forEach((x) => {
    by[x.cat] = (by[x.cat] || 0) + x.amount;
    cnt[x.cat] = (cnt[x.cat] || 0) + 1;
  });
  const d2: unknown[][] = [['Kategori', 'Tutar', 'Pay', 'İşlem']];
  Object.keys(by)
    .sort((p, q) => by[q] - by[p])
    .forEach((c) => d2.push([c, by[c], by[c] / total, cnt[c]]));
  d2.push(['Toplam', total, 1, rows.length]);
  XLSX.utils.book_append_sheet(wb, sheet(d2, [16, 14, 8, 8], { B: TL_FMT, C: '0.0%' }), 'Kategoriler');

  if (!ym) {
    const bm: Record<string, number> = {};
    rows.forEach((x) => (bm[x.date.slice(0, 7)] = (bm[x.date.slice(0, 7)] || 0) + x.amount));
    const d3: unknown[][] = [['Ay', 'Toplam']];
    Object.keys(bm).sort().forEach((m) => d3.push([monthLabel(m), bm[m]]));
    XLSX.utils.book_append_sheet(wb, sheet(d3, [16, 14], { B: TL_FMT }), 'Aylar');
  }

  if (subs.length) {
    const d4: unknown[][] = [['Ad', 'Tutar', 'Sıklık', 'Ödeme günü', 'Kategori', 'Aylık karşılığı']];
    subs.forEach((s) => {
      const yearly = s.freq === 'yearly';
      d4.push([s.name, s.amount, yearly ? 'Yıllık' : 'Aylık', yearly ? `${s.day} ${MONTHS[s.month - 1]}` : `Her ay ${s.day}`, s.cat, yearly ? s.amount / 12 : s.amount]);
    });
    XLSX.utils.book_append_sheet(wb, sheet(d4, [22, 14, 8, 14, 14, 16], { B: TL_FMT, F: TL_FMT }), 'Abonelikler');
  }

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const name = ym ? `harcamalar-${ym}.xlsx` : `harcamalar-tumu-${iso(new Date())}.xlsx`;
  await share(name, new Uint8Array(out), XLSX_MIME, 'org.openxmlformats.spreadsheetml.sheet');
  return true;
}

/** Tüm verinin yedeği (web sürümüyle aynı biçim). */
export async function exportBackup(data: Data) {
  const body = JSON.stringify({ app: 'harcama-defteri', version: 1, exportedAt: new Date().toISOString(), ...data }, null, 1);
  await share(`harcama-yedek-${iso(new Date())}.json`, body, 'application/json', 'public.json');
}

/** Kullanıcının seçtiği yedek dosyasını okur. İptal edilirse null. Geçersiz dosyada hata fırlatır. */
export async function pickBackup(): Promise<Data | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'public.json', 'text/plain'], copyToCacheDirectory: true });
  if (r.canceled) return null;
  const text = await new File(r.assets[0].uri).text();
  const raw = JSON.parse(text);
  if (!raw || (!Array.isArray(raw.items) && !Array.isArray(raw.subs))) throw new Error('Bu dosya bir Harcama Defteri yedeği değil.');
  return normalize(raw);
}
