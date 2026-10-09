#!/usr/bin/env python3
"""
Polisan Kimya - Merkezi İşletme Yönetim Sistemi
Ana Excel Dosyası Oluşturma Scripti
Kaynak dosyalar analiz edilerek oluşturulmuştur.
"""

import openpyxl
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side
)
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.worksheet.datavalidation import DataValidation
import pandas as pd
from datetime import datetime, date
import os, re, math

# ============================================================
# CONFIG
# ============================================================
SOURCE_DIR = '/root/.claude/uploads/2c4fe597-18f7-5ee1-ab4d-47353707d29a'
SCRATCH    = '/tmp/claude-0/-home-user-claude-efficient-usage/2c4fe597-18f7-5ee1-ab4d-47353707d29a/scratchpad'
OUT_FILE   = os.path.join(SCRATCH, 'Polisan_Merkezi_Yonetim_Sistemi.xlsx')
TODAY_STR  = '09.10.2026'
TODAY_DATE = date(2026, 10, 9)

def d(dmy: str):
    """Parse 'DD.MM.YYYY' string to date object for writing as real Excel date."""
    day, month, year = dmy.split('.')
    return date(int(year), int(month), int(day))

# ============================================================
# COLORS
# ============================================================
C_DARK_BLUE   = '1F3864'
C_MED_BLUE    = '2E75B6'
C_LIGHT_BLUE  = 'BDD7EE'
C_XLITE_BLUE  = 'DEEAF1'
C_DARK_GRAY   = '404040'
C_LIGHT_GRAY  = 'F2F2F2'
C_WHITE       = 'FFFFFF'
C_BLACK       = '000000'
C_RED_LIGHT   = 'FFC7CE'
C_RED_TEXT    = '9C0006'
C_GREEN_LIGHT = 'C6EFCE'
C_GREEN_TEXT  = '375623'
C_AMBER_LIGHT = 'FFEB9C'
C_AMBER_TEXT  = '9C6500'
C_BLUE_LIGHT  = 'DDEBF7'
C_ORANGE      = 'F4B942'
C_INPUT       = 'FFF2CC'   # yellow for input cells

# ============================================================
# STYLE HELPERS
# ============================================================
def fnt(bold=False, size=10, color=C_BLACK, italic=False):
    return Font(name='Arial', bold=bold, size=size, color=color, italic=italic)

def fill(color):
    return PatternFill(fill_type='solid', fgColor=color)

def border_thin():
    s = Side(style='thin', color='CCCCCC')
    return Border(left=s, right=s, top=s, bottom=s)

def border_medium():
    m = Side(style='medium', color='999999')
    return Border(left=m, right=m, top=m, bottom=m)

def align(h='left', v='center', wrap=True):
    return Alignment(horizontal=h, vertical=v, wrap_text=wrap)

def style_header(ws, row, col, text, bg=C_DARK_BLUE, fg=C_WHITE, bold=True,
                 size=10, h_align='center'):
    c = ws.cell(row=row, column=col, value=text)
    c.font   = fnt(bold=bold, size=size, color=fg)
    c.fill   = fill(bg)
    c.border = border_thin()
    c.alignment = align(h=h_align)
    return c

def style_data(ws, row, col, value=None, bg=None, bold=False,
               h_align='left', num_fmt=None):
    c = ws.cell(row=row, column=col, value=value)
    c.font   = fnt(bold=bold)
    c.fill   = fill(bg) if bg else PatternFill()
    c.border = border_thin()
    c.alignment = align(h=h_align)
    if num_fmt:
        c.number_format = num_fmt
    return c

def add_title_row(ws, text, row=1, colspan=None, bg=C_DARK_BLUE, size=13):
    """Full-width title row."""
    c = ws.cell(row=row, column=1, value=text)
    c.font      = fnt(bold=True, size=size, color=C_WHITE)
    c.fill      = fill(bg)
    c.alignment = align(h='center')
    c.border    = border_thin()
    if colspan:
        ws.merge_cells(start_row=row, start_column=1,
                       end_row=row,   end_column=colspan)
    ws.row_dimensions[row].height = 28
    return c

def write_headers(ws, row, headers, bg=C_MED_BLUE, fg=C_WHITE, start_col=1):
    for i, h in enumerate(headers):
        style_header(ws, row, start_col + i, h, bg=bg, fg=fg)
    ws.row_dimensions[row].height = 30

def freeze(ws, cell='A3'):
    ws.freeze_panes = cell

def set_col_widths(ws, widths):
    for col, w in widths.items():
        ws.column_dimensions[col].width = w

def make_table(ws, name, ref, style='TableStyleMedium2'):
    tbl = Table(displayName=name, ref=ref)
    ts  = TableStyleInfo(name=style, showFirstColumn=False,
                         showLastColumn=False, showRowStripes=True)
    tbl.tableStyleInfo = ts
    ws.add_table(tbl)

def dv_list(ws, formula1, sqref):
    """Add dropdown data validation."""
    dv = DataValidation(type='list', formula1=formula1,
                        allow_blank=True, showErrorMessage=True)
    dv.error      = 'Lütfen listeden seçin'
    dv.errorTitle = 'Geçersiz Giriş'
    ws.add_data_validation(dv)
    dv.sqref = sqref

# ============================================================
# LOAD SOURCE DATA
# ============================================================
def clean(v):
    if v is None: return ''
    s = str(v).strip()
    if s in ('nan', 'NaT', 'None', 'NaN'): return ''
    return s

def load_tanks():
    tf = os.path.join(SOURCE_DIR, 'b7ed2fda-Polisan_Kimya_Tank_Verileri_2026.xlsx')
    standard_sheets = {
        'Tank Listesİ'             : 'Gümüş Tesisi',
        'ADR Tank Sahası'          : 'ADR Tank Sahası',
        'Reçine Mamul Tank'        : 'Reçine Tesisi',
        'Dilovası - Yapı Kim Tank' : 'Dilovası Yapı Kim.',
        'Aus Tank Sahası'          : 'AUS Tank Sahası',
        'Reçine Yardımcı Tanklar'  : 'Reçine Yardımcı',
    }
    rows = []
    for sname, tesis in standard_sheets.items():
        try:
            df = pd.read_excel(tf, sheet_name=sname)
        except Exception:
            continue
        for _, r in df.iterrows():
            if pd.isna(r.get('SN', '')): continue
            rows.append({
                'Kaynak'        : sname,
                'Tesis'         : tesis,
                'SN'            : clean(r.get('SN','')),
                'Tank_Adi'      : clean(r.get('Tank No','')),
                'Tank_No_ID'    : clean(r.get('TANK NO','')),
                'Hacim_m3'      : clean(r.get('Hacim m3','')),
                'Kimyasal'      : clean(r.get('TANK İÇİNDEKİ KİMYASAL','')),
                'Tank_Tipi'     : clean(r.get('Ayaklı / Ayaksız tank','')),
                'Standart'      : clean(r.get('Standart','')).replace('\n',' / '),
                'Periyot'       : clean(r.get('Periyodu','')).replace('\n',' / '),
                'Son_Kontrol'   : clean(r.get('Kontrol Tarihi','')),
                'Sonraki_Kontrol': clean(r.get('Bir sonraki Kontrol Tarihi','')),
                'Durum'         : clean(r.get('Durumu','')),
                'Aciklama'      : clean(r.get('Açıklama','')),
                'Rapor_No'      : '',
                'Malzeme'       : '',
            })
    # Yardımcı İşl. - different format
    try:
        df2 = pd.read_excel(tf, sheet_name='Yardımcı İşl. - Tank Envanteri', header=2)
        for _, r in df2.iterrows():
            if pd.isna(r.get('No','')): continue
            rows.append({
                'Kaynak'        : 'Yardımcı İşl.',
                'Tesis'         : clean(r.get('Tesis / Kategori','')),
                'SN'            : clean(r.get('No','')),
                'Tank_Adi'      : clean(r.get('Ekipman Adı','')),
                'Tank_No_ID'    : '',
                'Hacim_m3'      : clean(r.get('Kapasite','')),
                'Kimyasal'      : clean(r.get('Depolanan Sıvı','')),
                'Tank_Tipi'     : '',
                'Standart'      : clean(r.get('Muayene Standardı','')),
                'Periyot'       : 'Yıllık',
                'Son_Kontrol'   : clean(r.get('Muayene Tarihi','')),
                'Sonraki_Kontrol': '',
                'Durum'         : '',
                'Aciklama'      : '',
                'Rapor_No'      : clean(r.get('Muayene Rapor No','')),
                'Malzeme'       : clean(r.get('Malzeme','')),
            })
    except Exception as e:
        print(f'Warn Yardımcı: {e}')
    return rows

def load_hazop():
    hf = os.path.join(SOURCE_DIR,
        'd23d334d-HAZOP_Aksiyonlar_Excel_Aksiyon_Listesi_20260923_151212.xlsx')
    df = pd.read_excel(hf, sheet_name='AKSIYON_LISTESI')
    df = df[df['AKSİYON_NO'].notna() & (df['AKSİYON_NO'] != '')].copy()
    rows = []
    for _, r in df.iterrows():
        rows.append({
            'Aksiyon_No'   : clean(r.get('AKSİYON_NO','')),
            'Firma'        : clean(r.get('Firma_K_Adı','')),
            'Tesis'        : clean(r.get('TESİS','')),
            'Unite'        : clean(r.get('ÜNİTE','')),
            'Ekipman_Tipi' : clean(r.get('Ekipman_Tipi','')),
            'Ekipman_Tag'  : clean(r.get('Ekipman_Tag_Numarası','')),
            'Node_No'      : clean(r.get('NODE_NO','')),
            'HAZOP_No'     : clean(r.get('HAZOP_NO','')),
            'Neden'        : clean(r.get('OLASI_NEDEN','')),
            'Sonuc'        : clean(r.get('OLASI_SONUÇLAR','')),
            'Aksiyon_Turu' : clean(r.get('AKSİYON_TÜRÜ','')),
            'Aksiyon'      : clean(r.get('AKSİYON','')),
        })
    return rows

def load_finance():
    ff = os.path.join(SOURCE_DIR,
        '01a2a3fd-Final_-_Orhan_KARABA__-_Mekanik__Elektrik.xlsx')
    df = pd.read_excel(ff, sheet_name='Fatura Bazlı Detay')
    rows = []
    for _, r in df.iterrows():
        rows.append({
            'Masraf_Yeri_Kodu': clean(r.get('Masraf yeri','')),
            'Masraf_Yeri'     : clean(r.get('Masraf yeri: Uzun metin','')),
            'Ana_Hesap_Kodu'  : clean(r.get('Ana hesap','')),
            'Gider_Adi'       : clean(r.get('Ana hesap: Uzun metin','')),
            'Tutar_TRY'       : r.get('Şirket kodu para birimi değeri', 0),
            'Belge_No'        : clean(r.get('Belge numarası','')),
            'Kayit_Tarihi'    : clean(r.get('Kayıt tarihi','')),
            'Belge_Tarihi'    : clean(r.get('Belge tarihi','')),
            'Metin'           : clean(r.get('Metin','')),
            'Kullanici'       : clean(r.get('Kullanıcı adı','')),
            'Satici'          : clean(r.get('Satıcı hesabı: Ad 1','')),
            'Siparis_No'      : clean(r.get('Sipariş','')),
            'Siparis_Adi'     : clean(r.get('Sipariş: Kısa metin','')),
        })
    return rows

print("Loading source data...")
tanks    = load_tanks()
hazop    = load_hazop()
finance  = load_finance()
print(f"  Tanks: {len(tanks)}, HAZOP actions: {len(hazop)}, Finance records: {len(finance)}")

# ============================================================
# BUILD WORKBOOK
# ============================================================
wb = Workbook()
wb.remove(wb.active)   # remove default sheet

# ============================================================
# SHEET 1: Kaynak_Dosyalar
# ============================================================
ws_k = wb.create_sheet('Kaynak_Dosyalar')
add_title_row(ws_k, 'KAYNAK DOSYA ENVANTERİ', colspan=8)
headers_k = ['Dosya_ID','Dosya_Adı','Dosya_Türü','Modül','Sayfa / Kapsam',
              'Kayıt_Sayısı','İçerik_Özeti','Veri_Kalitesi_Notu']
write_headers(ws_k, 2, headers_k, bg=C_MED_BLUE)
source_data = [
    ['KYN-001','HAZOP_Aksiyonlar_Excel_Aksiyon_Listesi_20260923_151212.xlsx',
     'HAZOP Aksiyon Listesi','Risk & Aksiyon',
     'HAZOP_Aksiyonlar_Excel / AKSIYON_LISTESI / AKSIYON_KONTROL',
     f'{len(hazop)} aksiyon',
     'Gümüş Tesisi HAZOP çalışmasından elde edilen aksiyon listesi. '
     'AKSİYON_NO sütunuyla her aksiyon numaralandırılmış.',
     'Ekipman tag bilgisi bazı satırlarda boş; sorumlu/termin verisi mevcut değil.'],
    ['KYN-002','Final_-_Orhan_KARABA-_Mekanik_Elektrik.xlsx',
     'SAP Maliyet Verisi','Bütçe & Maliyet',
     'Fatura Bazlı Detay (585 kayıt) + 12 özet sayfa',
     f'{len(finance)} fatura kaydı',
     'Oca-Mar 2025 dönemi SAP fiili giderleri. Masraf yeri, ana hesap ve '
     'belge bazında detaylı. 13 farklı maliyet merkezi.',
     'Planlanan/bütçe değeri yok; yalnızca gerçekleşen. Mart 2025 eksik dönem.'],
    ['KYN-003','Polisan_Kimya_Tank_Verileri_2026.xlsx',
     'Tank Envanteri','Tank Envanteri',
     '7 sayfa (Tank Listesi + 6 alan)',
     f'{len(tanks)} tank',
     'Polisan Kimya tüm tank envanteri. Kontrol tarihi, standart, '
     'kapasite, kimyasal ve durum bilgileri mevcut.',
     '"Uygun Değil" tanklar için yalnızca "Out of service raporu yok" notu var; '
     'kapanış tarihi, sorumlu yok.'],
    ['KYN-004','Pilot_Reaktor_Tasınma_Maliyeti.xlsx',
     'Proje Maliyet Analizi','Projeler',
     'ÖZET / GİRDİLER / MALİYET / ZAMAN',
     '1 proje, ~80 kalem',
     'Pilot reaktör odasının taşınma maliyet analizi. '
     'Doküman: POL-MBO-PRT-2026-001 Rev.01. Toplam: 2.129.489 TL (KDV hariç).',
     'Elektrik kalemi (6. bölüm) sıfır; bilgi bekleniyor. Süreler varsayımlı.'],
    ['KYN-005','POL-MBO-ADS-2026-002_Rev02.xlsx',
     'Yatırım Fizibilite','Projeler',
     '0-Ozet / 1-Hacim / 2-Hidrolik / 3-Ortak / 4-Senaryo / 5-Riskler',
     '4 senaryo karşılaştırması',
     'Reçine Tesisi Reaktör Acil Durum Drain Sistemi. '
     'Senaryo A (Yerüstü 50m³) önerilen: ~40,3 M TL CAPEX. '
     'Doküman: POL-MBO-ADS-2026-002 Rev.02.',
     'AACE Class 4 tahmin (-%20/+%30). Hiçbir kalem alınmış teklif değil.'],
]
for i, row in enumerate(source_data):
    r = 3 + i
    for j, val in enumerate(row):
        style_data(ws_k, r, j+1, value=val, bg=C_XLITE_BLUE if i%2==0 else None)
set_col_widths(ws_k, {'A':12,'B':45,'C':22,'D':22,'E':40,'F':18,'G':60,'H':60})
make_table(ws_k, 'tbl_Kaynak', f'A2:H{2+len(source_data)}',
           style='TableStyleLight2')
freeze(ws_k, 'A3')

# ============================================================
# SHEET 2: Tanimlar (Reference Lists)
# ============================================================
ws_t = wb.create_sheet('Tanimlar')
add_title_row(ws_t, 'TANIMLAR VE REFERANS LİSTELER', colspan=14)

# Durum
style_header(ws_t,2,1,'PROJE DURUM', bg=C_MED_BLUE, size=9)
proje_durum = ['Planlama','Onay Bekliyor','Devam Ediyor','Askıya Alındı',
               'Tamamlandı','İptal']
for i,v in enumerate(proje_durum):
    style_data(ws_t, 3+i, 1, value=v, bg=C_XLITE_BLUE if i%2==0 else None)

style_header(ws_t,2,2,'TANK DURUM', bg=C_MED_BLUE, size=9)
tank_durum = ['Uygun','Uygun Değil','Uygunsuz','Kullanım Dışı /Uygun',
              'Kontrolü yok','Bilgi Bekleniyor']
for i,v in enumerate(tank_durum):
    style_data(ws_t, 3+i, 2, value=v)

style_header(ws_t,2,3,'RİSK SEVİYESİ', bg=C_MED_BLUE, size=9)
risk_seviye = ['KRİTİK','YÜKSEK','ORTA','DÜŞÜK']
for i,v in enumerate(risk_seviye):
    style_data(ws_t, 3+i, 3, value=v)

style_header(ws_t,2,4,'ÖNCELİK', bg=C_MED_BLUE, size=9)
oncelik = ['1-Acil','2-Yüksek','3-Orta','4-Düşük']
for i,v in enumerate(oncelik):
    style_data(ws_t, 3+i, 4, value=v)

style_header(ws_t,2,5,'AKSIYON DURUM', bg=C_MED_BLUE, size=9)
aks_durum = ['Açık','Devam Ediyor','Gecikmiş','Tamamlandı','İptal']
for i,v in enumerate(aks_durum):
    style_data(ws_t, 3+i, 5, value=v)

style_header(ws_t,2,6,'TESİS', bg=C_MED_BLUE, size=9)
tesisler = ['Gümüş Tesisi','ADR Tank Sahası','Reçine Tesisi',
            'Dilovası Yapı Kim.','AUS Tank Sahası','Reçine Yardımcı',
            'Yardımcı İşl.','Ortak Alan']
for i,v in enumerate(tesisler):
    style_data(ws_t, 3+i, 6, value=v)

style_header(ws_t,2,7,'PROJE KATEGORİSİ', bg=C_MED_BLUE, size=9)
prj_kat = ['Yatırım','Bakım-Onarım','İyileştirme','Revizyon',
           'Güvenlik','Çevre','Altyapı','Ar-Ge']
for i,v in enumerate(prj_kat):
    style_data(ws_t, 3+i, 7, value=v)

style_header(ws_t,2,8,'MASRAF YERLERİ', bg=C_MED_BLUE, size=9)
masraf_yerleri = ['ALT YAPI HIZMETLERI','ELEKTRİK ATÖLYESİ',
                  'JENERATOR HİZMETLERİ','KAZAN DAİRESİ',
                  'KOMPRESÖR HİZMETLERİ','TEKNİK ORTAK HİZM.',
                  'TEKNİK AMBAR','SU ÜRETİM','SU ARITMA',
                  'MEKANİK ATÖLYE','DİĞER']
for i,v in enumerate(masraf_yerleri):
    style_data(ws_t, 3+i, 8, value=v)

style_header(ws_t,2,9,'STANDARTLAR', bg=C_MED_BLUE, size=9)
standartlar = ['API 650','API 653','API 510',
               'TS EN 12285-2','API 510 / API 653',
               'IEC 60079-32-1','AACE Class 4']
for i,v in enumerate(standartlar):
    style_data(ws_t, 3+i, 9, value=v)

style_header(ws_t,2,10,'HORTUM DURUM', bg=C_MED_BLUE, size=9)
hortum_durum = ['Aktif','Bakımda','Kullanım Dışı','Değişim Gerekli','Hurdaya Ayrıldı']
for i,v in enumerate(hortum_durum):
    style_data(ws_t, 3+i, 10, value=v)

style_header(ws_t,2,11,'MUAYENEPERİYOT', bg=C_MED_BLUE, size=9)
muayene_periyot = ['Yıllık','3 Yıllık','5 Yıllık','10 Yıllık',
                   'Out of service 10 yıl / In Service 5 yıl']
for i,v in enumerate(muayene_periyot):
    style_data(ws_t, 3+i, 11, value=v)

style_header(ws_t,2,12,'PARA BİRİMİ', bg=C_MED_BLUE, size=9)
para = ['TRY','USD','EUR']
for i,v in enumerate(para):
    style_data(ws_t, 3+i, 12, value=v)

set_col_widths(ws_t, {c:22 for c in 'ABCDEFGHIJKLMN'})
ws_t.column_dimensions['E'].width = 20
ws_t.column_dimensions['G'].width = 24
ws_t.column_dimensions['H'].width = 28
ws_t.column_dimensions['K'].width = 38

# ============================================================
# SHEET 3: Projeler
# ============================================================
ws_p = wb.create_sheet('Projeler')
add_title_row(ws_p, 'PROJE YÖNETİM TABLOSU', colspan=30)

prj_headers = [
    'PRJ_ID','Proje_Adı','Tesis','Kategori','Açıklama / Kapsam',
    'Teknik_Gerekçe','Fayda','Öncelik','Risk_Seviyesi',
    'Sorumlu','Talep_Tarihi',
    'Plan_Baslangic','Plan_Bitis','Ger_Baslangic','Ger_Bitis',
    'Aşama','İlerleme_%',
    'Plan_Butce_TL','Teklif_TL','Siparis_TL','Ger_Harcama_TL',
    'Kalan_Butce_TL','Butce_Sapmasi_%',
    'Belge_No','Durum','Sonraki_Aksiyon','Aks_Sorumlu',
    'Aks_Termin','Gecikme_Nedeni','Son_Guncelleme'
]
write_headers(ws_p, 2, prj_headers)

# Real projects from source files
today_str2 = '09.10.2026'
proje_data = [
    # PRJ-2026-001: Pilot Reaktör Taşınması
    ['PRJ-2026-001',
     'Pilot Reaktör Odası Taşınması',
     'Reçine Tesisi',
     'Taşıma / Yeniden Düzenleme',
     'Pilot reaktör odasının (yemekhane yanı) Ar-Ge arkasındaki alana taşınması',
     'Mevcut pilot reaktör odası konumu operasyonel açıdan uygun değil; '
     'kapasite ve güvenlik gerekliliklerini karşılamıyor.',
     'İşletme güvenliğinin artırılması, proses verimliliği ve ar-ge '
     'kapasitesinin iyileştirilmesi',
     '2-Yüksek','ORTA',
     'Orhan KARABA',
     '01.09.2026','01.10.2026','01.12.2026',
     '','',
     'Planlama / Maliyet Analizi',
     10,
     2129488.9, 2129488.9, 0, 0,
     '=R3-T3',
     '=IFERROR((T3-R3)/R3,"")',
     'POL-MBO-PRT-2026-001 Rev.01',
     'Devam Ediyor',
     'Elektrik bağlantısı kapsamının netleştirilmesi (Kalem 6 sıfır); '
     'kot ölçümü ve mühendislik onayı',
     'Orhan KARABA',
     '30.10.2026',
     '',
     today_str2],
    # PRJ-2026-002: ADS Sistemi
    ['PRJ-2026-002',
     'Reçine Tesisi Reaktör Acil Durum Drain (Dump) Sistemi',
     'Reçine Tesisi',
     'Güvenlik / Yatırım',
     'Reçine tesisi reaktörlerinin (R-101 ile R-106) acil durum boşaltma '
     'sistemi kurulumu. 50 m³ nominal dump tankı ve bağlantı hatları.',
     'HAZOP çalışmasında reaktör acil boşaltma altyapısı eksikliği kritik '
     'risk olarak tespit edildi. LOPA gereksinimleri karşılanmalı.',
     'Yangın/patlama riski eliminasyonu, düzenleyici uyumluluk, '
     'operasyonel güvenilirlik artışı',
     '1-Acil','KRİTİK',
     'Orhan KARABA',
     '01.09.2026','01.11.2026','30.06.2027',
     '','',
     'Fizibilite / Senaryo Analizi',
     15,
     40300000, 0, 0, 0,
     '=R4-T4',
     '=IFERROR((T4-R4)/R4,"")',
     'POL-MBO-ADS-2026-002 Rev.02',
     'Devam Ediyor',
     'Kot etüdü ve DN200 kollektör mesafe ölçümü; '
     'Senaryo A vs B final karar; HAZOP revizyonu; tedarikçi teklif toplama',
     'Orhan KARABA',
     '30.10.2026',
     'UF reaktör hacmi ve fenolik swell doğrulanmadan hacim kesinleşmez',
     today_str2],
]

for i, row in enumerate(proje_data):
    r = 3 + i
    for j, val in enumerate(row):
        bg = C_XLITE_BLUE if i % 2 == 0 else None
        c = ws_p.cell(row=r, column=j+1)
        c.border = border_thin()
        c.font   = fnt()
        if bg: c.fill = fill(bg)
        c.alignment = align(h='left')
        if isinstance(val, str) and val.startswith('='):
            c.value = val
        elif j == 16:  # ilerleme %
            c.value = val/100 if isinstance(val, (int,float)) else val
            c.number_format = '0%'
        elif j in (17,18,19,20):  # TL columns
            c.value = val
            c.number_format = '#,##0.00'
            c.alignment = align(h='right')
        elif j == 22:  # sapma %
            c.value = val
            c.number_format = '0.0%' if not isinstance(val, str) else '@'
        else:
            c.value = val

# Freeze and column widths
freeze(ws_p, 'C3')
set_col_widths(ws_p, {
    'A':14,'B':45,'C':20,'D':22,'E':50,'F':50,'G':40,
    'H':14,'I':14,'J':20,'K':14,'L':14,'M':14,'N':14,'O':14,
    'P':28,'Q':14,'R':18,'S':18,'T':18,'U':18,'V':18,'W':14,
    'X':28,'Y':18,'Z':50,'AA':20,'AB':14,'AC':40,'AD':14,
})
make_table(ws_p, 'tbl_Projeler', f'A2:AD{2+len(proje_data)}',
           style='TableStyleMedium9')

# Conditional formatting for Durum column (Y)
ws_p.conditional_formatting.add(
    f'Y3:Y{2+len(proje_data)}',
    FormulaRule(formula=['$Y3="Tamamlandı"'],
                fill=fill(C_GREEN_LIGHT), font=fnt(color=C_GREEN_TEXT)))
ws_p.conditional_formatting.add(
    f'Y3:Y{2+len(proje_data)}',
    FormulaRule(formula=['$Y3="Devam Ediyor"'],
                fill=fill(C_BLUE_LIGHT)))

# ============================================================
# SHEET 4: Proje_Aksiyonlar
# ============================================================
ws_pa = wb.create_sheet('Proje_Aksiyonlar')
add_title_row(ws_pa, 'PROJE AKSİYONLARI', colspan=14)
pa_headers = [
    'AKS_ID','PRJ_ID','Proje_Adı','Aksiyon_Açıklaması','Kategori',
    'Sorumlu','Acilis_Tarihi','Termin','Durum',
    'Öncelik','Tamamlanma_Tarihi','Gecikme_Gun','Notlar','Son_Güncelleme'
]
write_headers(ws_pa, 2, pa_headers)

DATE_FMT = 'DD.MM.YYYY'
pa_data = [
    # PRJ-2026-001 aksiyonları
    ['PA-001','PRJ-2026-001','=IFERROR(INDEX(Projeler!B:B,MATCH(B3,Projeler!A:A,0)),"")','Elektrik bağlantısı kapsamı netleştirilecek (kablo metrajı, pano konumu belirlenmeli)','Mühendislik / Kapsam','Orhan KARABA',d('01.10.2026'),d('30.10.2026'),'Açık','1-Acil',None,'=IF(OR(I3="Tamamlandı",I3="İptal"),"",IF(TODAY()-H3>0,TODAY()-H3,""))','Elektrik kapsamı netleşmeden maliyet analizi tamamlanamaz',TODAY_DATE],
    ['PA-002','PRJ-2026-001','=IFERROR(INDEX(Projeler!B:B,MATCH(B4,Projeler!A:A,0)),"")','Betopan demontaj birim fiyatı teyidi (PH.INS.035 yarı fiyatı varsayım)','Teknik / Sözleşme','Orhan KARABA',d('01.10.2026'),d('30.10.2026'),'Açık','2-Yüksek',None,'=IF(OR(I4="Tamamlandı",I4="İptal"),"",IF(TODAY()-H4>0,TODAY()-H4,""))','Açık madde: protokolde demontaj pozu yok',TODAY_DATE],
    ['PA-003','PRJ-2026-001','=IFERROR(INDEX(Projeler!B:B,MATCH(B5,Projeler!A:A,0)),"")','İzolasyon demontajı yevmiye sayısı doğrulanacak (6 vs 8 yevmiye açıklığı)','Teknik / Kapsam','Orhan KARABA',d('01.10.2026'),d('31.10.2026'),'Açık','3-Orta',None,'=IF(OR(I5="Tamamlandı",I5="İptal"),"",IF(TODAY()-H5>0,TODAY()-H5,""))','Kullanıcı 6 yevmiye verdi; maliyet hesabında 8 kullanıldı',TODAY_DATE],
    ['PA-004','PRJ-2026-001','=IFERROR(INDEX(Projeler!B:B,MATCH(B6,Projeler!A:A,0)),"")','Yüklenici teklif alınması (en az 3 tedarikçi)','Satın Alma','Orhan KARABA',d('01.11.2026'),d('01.12.2026'),'Açık','2-Yüksek',None,'=IF(OR(I6="Tamamlandı",I6="İptal"),"",IF(TODAY()-H6>0,TODAY()-H6,""))','Mevcut maliyet AACE Class 4 tahmin',TODAY_DATE],
    # PRJ-2026-002 aksiyonları
    ['PA-005','PRJ-2026-002','=IFERROR(INDEX(Projeler!B:B,MATCH(B7,Projeler!A:A,0)),"")','Kot etüdü: reaktör dip nozulu ile dump tankı yükseklik farkı ≥4m doğrulanacak','Mühendislik / Saha','Orhan KARABA',d('09.10.2026'),d('30.10.2026'),'Açık','1-Acil',None,'=IF(OR(I7="Tamamlandı",I7="İptal"),"",IF(TODAY()-H7>0,TODAY()-H7,""))','Senaryo A için kritik: kot <4m ise yerçekimiyle çalışmaz',TODAY_DATE],
    ['PA-006','PRJ-2026-002','=IFERROR(INDEX(Projeler!B:B,MATCH(B8,Projeler!A:A,0)),"")','R-105/R-106 dolu hacmi ve R-101/R-102 çalışma hacminin teyidi','Proses / Mühendislik','Orhan KARABA',d('09.10.2026'),d('31.10.2026'),'Açık','1-Acil',None,'=IF(OR(I8="Tamamlandı",I8="İptal"),"",IF(TODAY()-H8>0,TODAY()-H8,""))','50 m³ tank hacmi bu verilere göre seçildi',TODAY_DATE],
    ['PA-007','PRJ-2026-002','=IFERROR(INDEX(Projeler!B:B,MATCH(B9,Projeler!A:A,0)),"")','ARC/VSP2 kalorimetre (fenolik) → DIERS hesabı','Güvenlik / Test','Orhan KARABA',d('01.11.2026'),d('01.02.2027'),'Açık','1-Acil',None,'=IF(OR(I9="Tamamlandı",I9="İptal"),"",IF(TODAY()-H9>0,TODAY()-H9,""))','UF reaktör swell fenolik 1,25 varsayımı doğrulanmadan hacim kesinleşmez',TODAY_DATE],
    ['PA-008','PRJ-2026-002','=IFERROR(INDEX(Projeler!B:B,MATCH(B10,Projeler!A:A,0)),"")','DN200 kollektör güzergah saha ölçümü (25m kabul edildi)','Mühendislik / Saha','Orhan KARABA',d('09.10.2026'),d('31.10.2026'),'Açık','2-Yüksek',None,'=IF(OR(I10="Tamamlandı",I10="İptal"),"",IF(TODAY()-H10>0,TODAY()-H10,""))','Her 10m ek hat süreyi ~%8 artırır',TODAY_DATE],
    ['PA-009','PRJ-2026-002','=IFERROR(INDEX(Projeler!B:B,MATCH(B11,Projeler!A:A,0)),"")','HAZOP revizyonu: kollektör fail-safe mantığı ve ürün karışımı uyumluluğu','Güvenlik / HAZOP','Orhan KARABA',d('01.11.2026'),d('01.12.2026'),'Açık','1-Acil',None,'=IF(OR(I11="Tamamlandı",I11="İptal"),"",IF(TODAY()-H11>0,TODAY()-H11,""))','',TODAY_DATE],
    ['PA-010','PRJ-2026-002','=IFERROR(INDEX(Projeler!B:B,MATCH(B12,Projeler!A:A,0)),"")','Tank / dump vanası / kaplama için 3 tedarikçiden teklif alınması','Satın Alma','Orhan KARABA',d('01.11.2026'),d('01.12.2026'),'Açık','2-Yüksek',None,'=IF(OR(I12="Tamamlandı",I12="İptal"),"",IF(TODAY()-H12>0,TODAY()-H12,""))','Hiçbir kalem alınmış teklif değil; AACE Class 4',TODAY_DATE],
    ['PA-011','PRJ-2026-002','=IFERROR(INDEX(Projeler!B:B,MATCH(B13,Projeler!A:A,0)),"")','Tie-in işlerinin planlı TAM penceresine alınması','Planlama / TAM','Orhan KARABA',d('01.11.2026'),d('01.01.2027'),'Açık','2-Yüksek',None,'=IF(OR(I13="Tamamlandı",I13="İptal"),"",IF(TODAY()-H13>0,TODAY()-H13,""))','',TODAY_DATE],
]

for i, row in enumerate(pa_data):
    r = 3 + i
    for j, val in enumerate(row):
        c = ws_pa.cell(row=r, column=j+1)
        c.border = border_thin()
        c.font   = fnt()
        c.alignment = align(h='left')
        if isinstance(val, str) and val.startswith('='):
            c.value = val
        elif j in (6, 7, 10, 13):  # date columns: Acilis, Termin, Tamamlanma, Son_Guncelleme
            c.value = val
            if isinstance(val, date):
                c.number_format = 'DD.MM.YYYY'
        elif j == 11:  # gecikme gün
            c.value = val
            c.number_format = '0'
        else:
            c.value = val

freeze(ws_pa, 'D3')
set_col_widths(ws_pa, {
    'A':12,'B':14,'C':40,'D':60,'E':20,'F':20,
    'G':14,'H':14,'I':16,'J':14,'K':14,'L':14,'M':50,'N':14
})
make_table(ws_pa, 'tbl_PrjAks', f'A2:N{2+len(pa_data)}')

# Conditional formatting: gecikmiş
ws_pa.conditional_formatting.add(
    f'I3:I{2+len(pa_data)}',
    FormulaRule(formula=[f'=AND($I3<>"Tamamlandı",$I3<>"İptal",TODAY()>$H3)'],
                fill=fill(C_RED_LIGHT), font=fnt(color=C_RED_TEXT)))

# ============================================================
# SHEET 5: Gunluk_Is_Takibi
# ============================================================
ws_g = wb.create_sheet('Gunluk_Is_Takibi')
add_title_row(ws_g, 'GÜNLÜK İŞ VE AKSİYON TAKİBİ', colspan=16)
g_headers = [
    'IS_ID','İş_Açıklaması','İlgili_PRJ','Ekipman_Tag',
    'İş_Kategorisi','Talep_Eden','Sorumlu',
    'Acilis_Tarihi','Termin','Öncelik','Durum',
    'Bekleme_Nedeni','Son_İşlem','Sonraki_Adım',
    'Tamamlanma','Notlar'
]
write_headers(ws_g, 2, g_headers)

g_sample = [
    ['IS-001','Tank havuzu sızdırmazlık ve statik yük raporu alınacak (T-303 çevresi)',
     'PRJ-2026-002','T-303','Teknik İnceleme / Rapor','HAZOP Ekibi','Orhan KARABA',
     '23.09.2026','30.10.2026','1-Acil','Açık',
     'HAZOP A-003 aksiyonundan kaynaklanıyor',
     '','Muayene firmasına talep gönderilecek','',''],
    ['IS-002','LS-02 SIL sertifikalı seviye transmitteri T-303\'e kurulumu',
     'PRJ-2026-002','T-303 / LS-02','Enstrüman Montajı','HAZOP Ekibi','Orhan KARABA',
     '23.09.2026','31.12.2026','1-Acil','Açık',
     'Cihaz temin ve montaj programı bekleniyor',
     '','Teknik şartname hazırlanacak; tedarikçi araştırması','',''],
    ['IS-003','Metanol tankı (T-303) kumlamalı boya bakımı',
     '','T-303 / Metanol Tankı','Mekanik Bakım','Bakım Mühendisi','Orhan KARABA',
     '01.10.2026','31.03.2027','2-Yüksek','Açık',
     'Bütçe onayı bekleniyor',
     'Tank muayene raporunda "korozyon çok şiddetli" notu var',
     'Bütçe talebini hazırla; iş izni planla','',''],
    ['IS-004','UFC+FA Geçiş Tankı tavan korkulukları revizyonu',
     '','UFC+FA Geçiş Tankı (602)','Mekanik Bakım','Bakım Mühendisi','Orhan KARABA',
     '01.10.2026','31.12.2026','3-Orta','Açık',
     '',
     'Kontrol raporunda "tavan korkulukları revizyon gerekli" notu var',
     'Ölçüm ve çizim hazırlanacak; iş izni','',''],
    ['IS-005','Formaldehit tankları (201-502) Out-of-service muayene raporu eksikliği',
     '','FORMALDEHİT TANKI 201/301/302/501/502/101/300',
     'Muayene / Uygunluk','Teknik Güvenlik','Orhan KARABA',
     '01.10.2026','31.12.2026','1-Acil','Açık',
     'Akredite muayene firması program bekleniyor',
     '7 tank uygun değil; sadece in-service raporu mevcut',
     'Muayene firmasına yazı gönderilecek; out-of-service takvim belirlenecek','',''],
    ['IS-006','ADS projesi senaryo A/B final karar ve onay',
     'PRJ-2026-002','','Proje Kararı','Yönetim','Orhan KARABA',
     '01.10.2026','15.11.2026','1-Acil','Açık',
     'Kot etüdü sonucu bekleniyor (PA-005)',
     '',
     'Kot etüdü tamamlanınca yönetime sunum yapılacak','',''],
]
for i, row in enumerate(g_sample):
    r = 3 + i
    for j, val in enumerate(row):
        bg = C_XLITE_BLUE if i%2==0 else None
        style_data(ws_g, r, j+1, value=val, bg=bg)
# leave empty rows for data entry
for r in range(3+len(g_sample), 3+len(g_sample)+20):
    for j in range(1,17):
        style_data(ws_g, r, j, bg=C_INPUT if j in (8,9) else None)
        if j in (10,11):
            pass

freeze(ws_g, 'B3')
set_col_widths(ws_g, {
    'A':12,'B':55,'C':14,'D':20,'E':22,'F':20,'G':20,
    'H':14,'I':14,'J':14,'K':16,'L':40,'M':40,'N':40,'O':14,'P':40
})
nrow = 3 + len(g_sample) + 20
make_table(ws_g, 'tbl_GunlukIs', f'A2:P{nrow}')
ws_g.conditional_formatting.add(
    f'K3:K{nrow}',
    FormulaRule(formula=[f'=AND($K3<>"Tamamlandı",$K3<>"İptal",TODAY()>$I3)'],
                fill=fill(C_RED_LIGHT), font=fnt(color=C_RED_TEXT)))

# ============================================================
# SHEET 6: Tank_Envanteri
# ============================================================
ws_tk = wb.create_sheet('Tank_Envanteri')
add_title_row(ws_tk, 'TANK ENVANTERİ — TÜM TESİSLER', colspan=20)
tk_headers = [
    'TANK_ID','Kaynak_Sayfa','Tesis','SN','Tank_Adı','Tank_No_ID',
    'Hacim_m3','Kimyasal','Tank_Tipi','Malzeme',
    'Standart','Muayene_Periyot',
    'Son_Kontrol','Sonraki_Kontrol','Kalan_Gun','Uyarı_Durumu',
    'Durum','Rapor_No','Açıklama','Son_Güncelleme'
]
write_headers(ws_tk, 2, tk_headers)

for i, t in enumerate(tanks):
    r = 3 + i
    tank_id = f'T-{(i+1):03d}'
    # Calculate days remaining
    son_kontrol_raw = t['Son_Kontrol']
    sonraki_raw = t['Sonraki_Kontrol']

    row_vals = [
        tank_id,
        t['Kaynak'],
        t['Tesis'],
        t['SN'],
        t['Tank_Adi'],
        t['Tank_No_ID'],
        t['Hacim_m3'],
        t['Kimyasal'],
        t['Tank_Tipi'],
        t['Malzeme'],
        t['Standart'],
        t['Periyot'],
        t['Son_Kontrol'],
        t['Sonraki_Kontrol'],
        '',  # Kalan gün - hesaplanacak formula
        '',  # Uyarı
        t['Durum'],
        t['Rapor_No'],
        t['Aciklama'],
        TODAY_STR,
    ]
    for j, val in enumerate(row_vals):
        c = ws_tk.cell(row=r, column=j+1)
        c.border = border_thin()
        c.font   = fnt(size=9)
        c.alignment = align(h='left', wrap=False)
        if j == 6 and val:  # Hacim
            try:
                c.value = float(str(val).replace('m³','').strip())
                c.number_format = '#,##0.0'
            except Exception:
                c.value = val
        else:
            c.value = val

# Add formula for Kalan_Gun (column 15, O)
# and Uyarı_Durumu (column 16, P)
# Sonraki_Kontrol is column 14 (N)
for i in range(len(tanks)):
    r = 3 + i
    # Kalan gün: if N has a date, compute N - TODAY
    n_col = get_column_letter(14)
    o_col = get_column_letter(15)
    p_col = get_column_letter(16)
    ws_tk.cell(row=r, column=15).value = f'=IFERROR(IF({n_col}{r}="","",DATEVALUE(TEXT({n_col}{r},"DD.MM.YYYY"))-TODAY()),"Tarih Yok")'
    ws_tk.cell(row=r, column=16).value = (
        f'=IFERROR(IF({n_col}{r}="","Tarih Yok",'
        f'IF(DATEVALUE(TEXT({n_col}{r},"DD.MM.YYYY"))<TODAY(),"GECİKMİŞ",'
        f'IF(DATEVALUE(TEXT({n_col}{r},"DD.MM.YYYY"))-TODAY()<=30,"30 GÜN İÇİNDE",'
        f'IF(DATEVALUE(TEXT({n_col}{r},"DD.MM.YYYY"))-TODAY()<=90,"90 GÜN İÇİNDE","Takvimdeyiz")'
        f'))),"Tarih Kontrol")'
    )

freeze(ws_tk, 'E3')
set_col_widths(ws_tk, {
    'A':10,'B':22,'C':22,'D':6,'E':40,'F':10,
    'G':10,'H':22,'I':18,'J':16,'K':30,'L':30,
    'M':24,'N':18,'O':12,'P':16,
    'Q':22,'R':22,'S':50,'T':14
})
nrow_tk = 2 + len(tanks)
make_table(ws_tk, 'tbl_Tank', f'A2:T{nrow_tk}', style='TableStyleMedium9')

# Conditional formatting for Durum (Q)
ws_tk.conditional_formatting.add(
    f'Q3:Q{nrow_tk}',
    FormulaRule(formula=['$Q3="Uygun Değil"'],
                fill=fill(C_RED_LIGHT), font=fnt(color=C_RED_TEXT, size=9)))
ws_tk.conditional_formatting.add(
    f'Q3:Q{nrow_tk}',
    FormulaRule(formula=['$Q3="Uygunsuz"'],
                fill=fill(C_RED_LIGHT), font=fnt(color=C_RED_TEXT, size=9)))
ws_tk.conditional_formatting.add(
    f'Q3:Q{nrow_tk}',
    FormulaRule(formula=['$Q3="Uygun"'],
                fill=fill(C_GREEN_LIGHT), font=fnt(color=C_GREEN_TEXT, size=9)))
# Uyarı sütunu (P) renklendirme
ws_tk.conditional_formatting.add(
    f'P3:P{nrow_tk}',
    FormulaRule(formula=['$P3="GECİKMİŞ"'],
                fill=fill(C_RED_LIGHT), font=fnt(color=C_RED_TEXT, bold=True, size=9)))
ws_tk.conditional_formatting.add(
    f'P3:P{nrow_tk}',
    FormulaRule(formula=['$P3="30 GÜN İÇİNDE"'],
                fill=fill(C_AMBER_LIGHT), font=fnt(color=C_AMBER_TEXT, size=9)))

# ============================================================
# SHEET 7: Tank_Muayene_Log
# ============================================================
ws_tm = wb.create_sheet('Tank_Muayene_Log')
add_title_row(ws_tm, 'TANK MUAYENİ VE KONTROL KAYIT DEFTERİ', colspan=14)
tm_headers = [
    'LOG_ID','TANK_ID','Tank_Adı','Muayene_Tarihi','Muayene_Türü',
    'Muayene_Kurulusu','Rapor_No','Bulgular',
    'Önerilen_Aksiyonlar','Bir_Sonraki_Tarih','Durum',
    'Maliyet_TL','İlgili_PRJ','Notlar'
]
write_headers(ws_tm, 2, tm_headers)
# 3 sample rows from tank data
sample_tm = [
    ['LOG-001','T-012','METANOL TANKI (303)','25.08.2025','API 653 Out-of-Service','Akredite Muayene Firması','','Tank komple mekanik bakıma alınmalı; kumlama-boya; korozyon oluşumu çok şiddetli','Kumlama boya yaptırılacak; korozyon derinlik ölçümü','28.08.2030','Tamamlandı','','',''],
    ['LOG-002','T-033','ADBLUE-1 (AUS 32)','25.08.2025','API 653','Akredite Muayene Firması','','Korkuluk ve merdivenler kumlama boya yapılması gerekli','Korkuluk kumlama boya','28.08.2030','Tamamlandı','','',''],
    ['LOG-003','T-001','ANA KOSTİK TANKI (st61m3)','24.03.2025','Yıllık Kontrol','Akredite Muayene Firması','','Uygun','','24.03.2026','Tamamlandı','','',''],
]
for i, row in enumerate(sample_tm):
    r = 3 + i
    for j, val in enumerate(row):
        style_data(ws_tm, r, j+1, value=val, bg=C_XLITE_BLUE if i%2==0 else None)
for r in range(3+len(sample_tm), 3+len(sample_tm)+20):
    for j in range(1,15):
        style_data(ws_tm, r, j, bg=C_INPUT if j in (4,) else None)

freeze(ws_tm, 'C3')
set_col_widths(ws_tm, {
    'A':10,'B':10,'C':40,'D':16,'E':22,'F':30,'G':20,
    'H':55,'I':55,'J':16,'K':14,'L':16,'M':14,'N':40
})
nrow_tm = 2 + len(sample_tm) + 20
make_table(ws_tm, 'tbl_TankMuayene', f'A2:N{nrow_tm}')

# ============================================================
# SHEET 8: Dolum_Hortumlari
# ============================================================
ws_dh = wb.create_sheet('Dolum_Hortumlari')
add_title_row(ws_dh, 'DOLUM HORTUMLARI VE TRANSFER EKİPMANLARI', colspan=22)
dh_headers = [
    'HORTUM_ID','Etiket/Seri_No','Tesis','Dolum_Noktası','Kimyasal',
    'Hortum_Tipi','İç_Malzeme','Dış_Malzeme','Çap_mm','Uzunluk_m',
    'Bağlantı_Tipi','Basınç_Sınıfı_bar','Kim_Uyumluluk',
    'Üretici','Üretim_Tarihi','Devreye_Tarihi',
    'Son_Kontrol','Sonraki_Kontrol','Durum',
    'Hasar_Kaydı','Son_Değişim_Tarihi','Notlar'
]
write_headers(ws_dh, 2, dh_headers)
dh_note = ws_dh.cell(row=3, column=1,
    value='Bu sayfa boş şablon olarak sunulmuştur. '
          'Gerçek hortum verilerini aşağıya giriniz.')
dh_note.font = fnt(italic=True, color='808080')
ws_dh.merge_cells('A3:V3')
for r in range(4, 4+30):
    for j in range(1, 23):
        style_data(ws_dh, r, j, bg=C_INPUT if j in (17,18) else None)
freeze(ws_dh, 'E3')
set_col_widths(ws_dh, {
    'A':12,'B':18,'C':20,'D':22,'E':22,'F':18,'G':18,'H':18,
    'I':10,'J':12,'K':16,'L':16,'M':20,'N':22,'O':16,'P':16,
    'Q':16,'R':16,'S':16,'T':30,'U':16,'V':40
})
make_table(ws_dh, 'tbl_Hortum', f'A2:V{2+30}')

# ============================================================
# SHEET 9: Ekipman_Envanteri
# ============================================================
ws_ek = wb.create_sheet('Ekipman_Envanteri')
add_title_row(ws_ek, 'EKİPMAN ENVANTERİ', colspan=18)
ek_headers = [
    'EKP_ID','Ekipman_Kodu','Ekipman_Adı','Ekipman_Tipi','Tesis',
    'Sistem','Üretici','Model','Seri_No','Teknik_Özellikler',
    'Son_Bakım','Sonraki_Bakım','Bakım_Sıklığı','Durum',
    'Açık_Bakım_Bildirimleri','Bakım_Maliyet_TL',
    'İlgili_PRJ','Doküman_Linki'
]
write_headers(ws_ek, 2, ek_headers)
ek_note = ws_ek.cell(row=3, column=1,
    value='Bu sayfa boş şablon olarak sunulmuştur. '
          'SAP ekipman numaralarını koruyarak verilerinizi giriniz.')
ek_note.font = fnt(italic=True, color='808080')
ws_ek.merge_cells('A3:R3')
for r in range(4, 4+40):
    for j in range(1, 19):
        style_data(ws_ek, r, j)
freeze(ws_ek, 'C3')
set_col_widths(ws_ek, {
    'A':12,'B':18,'C':40,'D':20,'E':20,'F':22,
    'G':22,'H':20,'I':18,'J':40,'K':14,'L':14,
    'M':16,'N':18,'O':30,'P':16,'Q':14,'R':30
})
make_table(ws_ek, 'tbl_Ekipman', f'A2:R{2+40}')

# ============================================================
# SHEET 10: Bakim_Gecmisi
# ============================================================
ws_bk = wb.create_sheet('Bakim_Gecmisi')
add_title_row(ws_bk, 'BAKIM VE ONARIM GEÇMİŞİ', colspan=12)
bk_headers = [
    'BAK_ID','EKP_ID','Ekipman_Adı','TANK_ID','Tank_Adı',
    'Bakım_Tarihi','Bakım_Türü','Yapan / Firma','Açıklama',
    'Maliyet_TL','İş_Emri_No','Notlar'
]
write_headers(ws_bk, 2, bk_headers)
for r in range(3, 3+30):
    for j in range(1, 13):
        style_data(ws_bk, r, j)
freeze(ws_bk, 'C3')
set_col_widths(ws_bk, {
    'A':12,'B':12,'C':35,'D':10,'E':35,
    'F':14,'G':22,'H':25,'I':55,'J':18,'K':18,'L':40
})
make_table(ws_bk, 'tbl_BakimGecmisi', f'A2:L{2+30}')

# ============================================================
# SHEET 11: Butce_Maliyet  (585 SAP records)
# ============================================================
ws_bm = wb.create_sheet('Butce_Maliyet')
add_title_row(ws_bm, 'BÜTÇE, MALİYET VE FİNANSAL TAKİP', colspan=16)

# Sub-header: data source info
ws_bm.cell(row=2, column=1,
    value='Kaynak: SAP Fatura Bazlı Detay — Ocak-Mart 2025 gerçekleşen giderler')
ws_bm.cell(row=2, column=1).font = fnt(italic=True, color='606060')
ws_bm.merge_cells('A2:P2')

bm_headers = [
    'KAY_ID','Masraf_Yeri_Kodu','Masraf_Yeri_Adı','Ana_Hesap_Kodu',
    'Gider_Kategorisi','Tutar_TRY','Para_Birimi',
    'Belge_No','Kayıt_Tarihi','Belge_Tarihi','Metin',
    'Kullanıcı','Satıcı_Adı','Sipariş_No','Sipariş_Adı','PRJ_ID'
]
write_headers(ws_bm, 3, bm_headers)

for i, f_row in enumerate(finance):
    r = 4 + i
    # Determine PRJ_ID: match order/project codes
    prj_id = ''
    sip = str(f_row.get('Siparis_No','')).strip()
    sip_adi = str(f_row.get('Siparis_Adi','')).strip().upper()
    if sip and sip not in ('', 'nan'):
        prj_id = ''  # Can be linked manually

    row_vals = [
        f'KAY-{(i+1):04d}',
        f_row['Masraf_Yeri_Kodu'],
        f_row['Masraf_Yeri'],
        f_row['Ana_Hesap_Kodu'],
        f_row['Gider_Adi'],
        f_row['Tutar_TRY'],
        'TRY',
        f_row['Belge_No'],
        f_row['Kayit_Tarihi'],
        f_row['Belge_Tarihi'],
        f_row['Metin'],
        f_row['Kullanici'],
        f_row['Satici'],
        f_row['Siparis_No'],
        f_row['Siparis_Adi'],
        prj_id,
    ]
    for j, val in enumerate(row_vals):
        c = ws_bm.cell(row=r, column=j+1)
        c.border = border_thin()
        c.font   = fnt(size=9)
        c.alignment = align(h='left', wrap=False)
        if j == 5:  # Tutar
            try:
                c.value = float(val) if val not in ('', None) else 0
            except Exception:
                c.value = 0
            c.number_format = '#,##0.00 ₺'
            c.alignment = align(h='right')
        elif j in (8, 9):  # Tarihler
            c.value = val
        else:
            c.value = val

# Monthly summary table - append after data
summary_start = 4 + len(finance) + 3
ws_bm.cell(row=summary_start, column=1,
    value='MASRAF YERİ BAZLI ÖZET (Ocak-Mart 2025, TRY)').font = fnt(bold=True, color=C_WHITE)
ws_bm.cell(row=summary_start, column=1).fill = fill(C_DARK_BLUE)
ws_bm.merge_cells(f'A{summary_start}:F{summary_start}')

# Get unique cost centers and totals
df_fin_local = pd.DataFrame(finance)
if len(df_fin_local) > 0:
    summary = df_fin_local.groupby('Masraf_Yeri')['Tutar_TRY'].sum().sort_values(ascending=False)
    style_header(ws_bm, summary_start+1, 1, 'Masraf Yeri')
    style_header(ws_bm, summary_start+1, 2, 'Toplam TRY', h_align='right')
    style_header(ws_bm, summary_start+1, 3, 'Pay %', h_align='right')
    total = summary.sum()
    for k, (my, tutar) in enumerate(summary.items()):
        r2 = summary_start + 2 + k
        style_data(ws_bm, r2, 1, value=my)
        c = ws_bm.cell(row=r2, column=2, value=tutar)
        c.number_format = '#,##0.00 ₺'
        c.alignment = align(h='right')
        c.border = border_thin()
        c.font = fnt(size=9)
        c = ws_bm.cell(row=r2, column=3, value=tutar/total if total else 0)
        c.number_format = '0.0%'
        c.alignment = align(h='right')
        c.border = border_thin()
        c.font = fnt(size=9)
    r_total = summary_start + 2 + len(summary)
    c = ws_bm.cell(row=r_total, column=1, value='TOPLAM')
    c.font = fnt(bold=True)
    c.border = border_thin()
    c = ws_bm.cell(row=r_total, column=2, value=total)
    c.number_format = '#,##0.00 ₺'
    c.font = fnt(bold=True)
    c.alignment = align(h='right')
    c.border = border_thin()

freeze(ws_bm, 'E4')
set_col_widths(ws_bm, {
    'A':12,'B':16,'C':30,'D':16,'E':35,
    'F':18,'G':8,'H':14,'I':14,'J':14,
    'K':20,'L':14,'M':35,'N':18,'O':35,'P':14
})
nrow_bm = 3 + len(finance)
make_table(ws_bm, 'tbl_BudgetDetail', f'A3:P{nrow_bm}', style='TableStyleLight2')

# ============================================================
# SHEET 12: Satin_Alma
# ============================================================
ws_sa = wb.create_sheet('Satin_Alma')
add_title_row(ws_sa, 'SATIN ALMA VE TEDARİK TAKİBİ', colspan=16)
sa_headers = [
    'SAT_ID','Talep_No','Talep_Tarihi','Malzeme_Hizmet','Miktar','Birim',
    'Teklif_Durum','Siparis_No','Tedarikçi',
    'Plan_Teslim_Tarihi','Ger_Teslim_Tarihi',
    'Siparis_Tutari_TL','Kabul_Durumu','Gecikme_Nedeni',
    'PRJ_ID','Notlar'
]
write_headers(ws_sa, 2, sa_headers)
# Sample procurement rows from known projects
sa_sample = [
    ['SAT-001','','','LS-02 SIL sertifikalı seviye transmitteri (T-303 için)',2,'Adet',
     'Teklif Bekleniyor','','',
     '30.11.2026','','','Bekliyor','',
     'PRJ-2026-002','HAZOP A-002 aksiyonu kapsamında'],
    ['SAT-002','','','Muayene hizmeti — Out-of-service raporu (Formaldehit tankları)',1,'Lot',
     'Teklif Hazırlanıyor','','Akredite Muayene Firması',
     '31.12.2026','','','Bekliyor','',
     '','Uygun Değil 7 tank için out-of-service muayenesi'],
    ['SAT-003','','','İskele hizmeti (Pilot Reaktör taşınması)',1,'Lot',
     'Maliyet Analizinde','','',
     '01.12.2026','','61695.0','Bekliyor','',
     'PRJ-2026-001','POL-MBO-PRT-2026-001 Rev.01 kalem 3.8'],
]
for i, row in enumerate(sa_sample):
    r = 3 + i
    for j, val in enumerate(row):
        style_data(ws_sa, r, j+1, value=val, bg=C_XLITE_BLUE if i%2==0 else None)
for r in range(3+len(sa_sample), 3+len(sa_sample)+20):
    for j in range(1, 17):
        style_data(ws_sa, r, j)
freeze(ws_sa, 'D3')
set_col_widths(ws_sa, {
    'A':10,'B':14,'C':14,'D':45,'E':10,'F':10,
    'G':18,'H':16,'I':30,'J':16,'K':16,
    'L':18,'M':18,'N':30,'O':14,'P':40
})
make_table(ws_sa, 'tbl_SatinAlma', f'A2:P{2+len(sa_sample)+20}')

# ============================================================
# SHEET 13: Risk_Uygunsuzluk  (HAZOP 619 + tank issues)
# ============================================================
ws_ru = wb.create_sheet('Risk_Uygunsuzluk')
add_title_row(ws_ru, 'TEKNİK UYGUNSUZLUKLAR, RİSKLER VE HAZOP AKSİYONLARI', colspan=18)

ws_ru.cell(row=2, column=1,
    value=f'Kaynak: HAZOP Aksiyon Listesi (23.09.2026) — {len(hazop)} aksiyon + tank muayene uygunsuzlukları')
ws_ru.cell(row=2, column=1).font = fnt(italic=True, color='606060')
ws_ru.merge_cells('A2:R2')

ru_headers = [
    'UYG_ID','Kaynak','Firma','Tesis','Ünite',
    'Ekipman_Tag','Node_No','HAZOP_No',
    'Aksiyon_Türü','Olası_Neden','Olası_Sonuç',
    'Aksiyon_Açıklaması','Risk_Seviyesi','Sorumlu',
    'Termin','Durum','Kapama_Tarihi','Notlar'
]
write_headers(ws_ru, 3, ru_headers)

# First add tank "Uygun Değil" items as non-HAZOP risk records
tank_risk_rows = []
for i, t in enumerate(tanks):
    if t['Durum'].lower() in ('uygun değil','uygunsuz','kontrolü yok'):
        tank_risk_rows.append({
            'Aksiyon_No' : f'TANK-{(i+1):03d}',
            'Kaynak'     : 'Tank Muayene',
            'Firma'      : 'POLİSAN',
            'Tesis'      : t['Tesis'],
            'Unite'      : '',
            'Ekipman_Tag': t['Tank_No_ID'] or t['Tank_Adi'],
            'Node_No'    : '',
            'HAZOP_No'   : '',
            'Aksiyon_Turu': 'Muayene Uygunsuzluğu',
            'Neden'      : f'Durum: {t["Durum"]}',
            'Sonuc'      : 'Periyodik muayene yetersizliği; teknik uygunsuzluk riski',
            'Aksiyon'    : t['Aciklama'],
            'Risk_Seviyesi': 'YÜKSEK' if t['Durum'].lower() == 'uygun değil' else 'ORTA',
            'Sorumlu'    : 'Orhan KARABA',
            'Termin'     : '31.12.2026',
            'Durum'      : 'Açık',
            'Kapama'     : '',
            'Notlar'     : f'Tank: {t["Tank_Adi"]} | Hacim: {t["Hacim_m3"]} m³',
        })

# Then HAZOP records
for i, h_row in enumerate(hazop):
    risk = 'YÜKSEK'
    tur = h_row.get('Aksiyon_Turu','')
    if '3. IPL' in tur or 'SIS' in tur:
        risk = 'KRİTİK'
    elif '4. IPL' in tur or 'Fiziksel' in tur:
        risk = 'ORTA'
    tank_risk_rows.append({
        'Aksiyon_No' : h_row['Aksiyon_No'],
        'Kaynak'     : 'HAZOP 2026',
        'Firma'      : h_row.get('Firma','POLİSANK'),
        'Tesis'      : h_row.get('Tesis',''),
        'Unite'      : h_row.get('Unite',''),
        'Ekipman_Tag': h_row.get('Ekipman_Tag',''),
        'Node_No'    : h_row.get('Node_No',''),
        'HAZOP_No'   : h_row.get('HAZOP_No',''),
        'Aksiyon_Turu': tur,
        'Neden'      : h_row.get('Neden',''),
        'Sonuc'      : h_row.get('Sonuc',''),
        'Aksiyon'    : h_row.get('Aksiyon',''),
        'Risk_Seviyesi': risk,
        'Sorumlu'    : 'Orhan KARABA',
        'Termin'     : '',
        'Durum'      : 'Açık',
        'Kapama'     : '',
        'Notlar'     : '',
    })

for i, rr in enumerate(tank_risk_rows):
    r = 4 + i
    vals = [
        rr['Aksiyon_No'], rr['Kaynak'], rr['Firma'],
        rr['Tesis'], rr['Unite'], rr['Ekipman_Tag'],
        rr['Node_No'], rr['HAZOP_No'], rr['Aksiyon_Turu'],
        rr['Neden'], rr['Sonuc'], rr['Aksiyon'],
        rr['Risk_Seviyesi'], rr['Sorumlu'],
        rr['Termin'], rr['Durum'], rr['Kapama'], rr['Notlar'],
    ]
    for j, val in enumerate(vals):
        c = ws_ru.cell(row=r, column=j+1)
        c.border = border_thin()
        c.font   = fnt(size=9)
        c.alignment = align(h='left', wrap=False)
        c.value = str(val)[:500] if val else ''

freeze(ws_ru, 'D4')
set_col_widths(ws_ru, {
    'A':12,'B':14,'C':12,'D':18,'E':12,'F':18,'G':8,'H':10,
    'I':24,'J':50,'K':50,'L':60,'M':12,'N':16,
    'O':14,'P':14,'Q':14,'R':30
})
nrow_ru = 3 + len(tank_risk_rows)
make_table(ws_ru, 'tbl_Risk', f'A3:R{nrow_ru}', style='TableStyleMedium9')

# Color coding for Risk column (M)
ws_ru.conditional_formatting.add(
    f'M4:M{nrow_ru}',
    FormulaRule(formula=['$M4="KRİTİK"'],
                fill=fill(C_RED_LIGHT), font=fnt(color=C_RED_TEXT, bold=True, size=9)))
ws_ru.conditional_formatting.add(
    f'M4:M{nrow_ru}',
    FormulaRule(formula=['$M4="YÜKSEK"'],
                fill=fill(C_AMBER_LIGHT), font=fnt(color=C_AMBER_TEXT, size=9)))

# ============================================================
# SHEET 14: Dokuman_Yonetimi
# ============================================================
ws_dok = wb.create_sheet('Dokuman_Yonetimi')
add_title_row(ws_dok, 'DOKÜMAN VE TEKNİK REFERANS YÖNETİMİ', colspan=12)
dok_headers = [
    'DOK_ID','Doküman_Adı','Tür','İlgili_PRJ','İlgili_Ekipman',
    'Revizyon','Tarih','Dosya_Yolu_veya_Linki',
    'Durum','Hazırlayan','Açıklama','Son_Güncelleme'
]
write_headers(ws_dok, 2, dok_headers)
dok_sample = [
    ['DOK-001','Pilot Reaktör Odası Taşınma Maliyet Analizi','Maliyet Analizi','PRJ-2026-001','',
     'Rev.01','21.09.2026','POL-MBO-PRT-2026-001_Rev01.xlsx',
     'Geçerli','Mekanik Bakım Onarım','AACE Class 4 maliyet tahmini; elektrik kapsamı eksik','09.10.2026'],
    ['DOK-002','Reçine Tesisi Reaktör Acil Durum Drain Sistemi Senaryo Karşılaştırması','Yatırım Fizibilite','PRJ-2026-002','',
     'Rev.02','Eylül 2026','POL-MBO-ADS-2026-002_Rev02.xlsx',
     'Geçerli','Mekanik Bakım Onarım Yöneticiliği','C1/C2 kalem kırılımı eklendi; 150 TL yuvarlama düzeltildi','09.10.2026'],
    ['DOK-003','Gümüş Tesisi HAZOP Aksiyon Listesi','HAZOP Raporu','','',
     '','23.09.2026','HAZOP_Aksiyonlar_Excel_Aksiyon_Listesi_20260923_151212.xlsx',
     'Geçerli','','619 aksiyon; Gümüş Tesisi kapsamı','09.10.2026'],
    ['DOK-004','Polisan Kimya Tank Verileri 2026','Envanter','','Tüm Tanklar',
     '','2026','Polisan_Kimya_Tank_Verileri_2026.xlsx',
     'Geçerli','','139 tank; 7 sayfa; kontrol tarihleri ve durum bilgisi','09.10.2026'],
    ['DOK-005','Mekanik-Elektrik Maliyet Raporu (SAP)','SAP Mali Rapor','','',
     '','Ocak-Mart 2025','Final_-_Orhan_KARABA-_Mekanik_Elektrik.xlsx',
     'Geçerli','Orhan KARABA','585 fatura kaydı; 13 maliyet merkezi; Ocak-Mart 2025','09.10.2026'],
]
for i, row in enumerate(dok_sample):
    r = 3 + i
    for j, val in enumerate(row):
        style_data(ws_dok, r, j+1, value=val, bg=C_XLITE_BLUE if i%2==0 else None)
for r in range(3+len(dok_sample), 3+len(dok_sample)+20):
    for j in range(1, 13):
        style_data(ws_dok, r, j)
freeze(ws_dok, 'B3')
set_col_widths(ws_dok, {
    'A':10,'B':55,'C':22,'D':14,'E':20,'F':10,'G':14,
    'H':50,'I':14,'J':18,'K':55,'L':14
})
make_table(ws_dok, 'tbl_Dokuman', f'A2:L{2+len(dok_sample)+20}')

# ============================================================
# SHEET 15: Veri_Kalitesi
# ============================================================
ws_vk = wb.create_sheet('Veri_Kalitesi')
add_title_row(ws_vk, 'VERİ KALİTESİ KONTROL RAPORU', colspan=8)
vk_headers = [
    'VK_ID','Kaynak_Dosya','Sayfa','Kayıt_Ref','Sorun_Türü',
    'Açıklama','Durum','Öneri'
]
write_headers(ws_vk, 2, vk_headers)
vk_data = [
    # Tank issues
    ['VK-001','Tank Verileri','Tank Listesİ','SN:3,4,5,6,7,8,9','Muayene Eksikliği',
     '7 Formaldehit tankı "Uygun Değil" — sadece in-service raporu var, '
     'out-of-service raporu eksik',
     'Açık','Akredite muayene firmasına taşeron yazı gönderilmeli'],
    ['VK-002','Tank Verileri','Tank Listesİ','SN:11','Tarih Eksik',
     'Fenol tankı (T-702) sonraki kontrol tarihi boş; durumu "Uygunsuz"',
     'Açık','Muayene planı ivediyle oluşturulmalı'],
    ['VK-003','Tank Verileri','Tank Listesİ','SN:14','Muayene Yapılamadı',
     'Kondens tankı (T-704) muayenesi korozyon nedeniyle yapılamadı; '
     'kumlama boya gerekiyor',
     'Açık','Kumlama-boya iş emri açılmalı; muayene yeniden takvimlendirilmeli'],
    ['VK-004','Tank Verileri','Tank Listesİ','SN:16','Kontrol Yok',
     'Su tankı (T-102) 2018\'den bu yana kontrol yapılmamış',
     'Açık','Acil muayene planlanmalı; teknik durum değerlendirmesi yapılmalı'],
    ['VK-005','Tank Verileri','Yardımcı İşl.','No:5,6,9-23','Tarih Eksik',
     'Yardımcı tankların çoğunda muayene tarihi ve rapor no yok',
     'Açık','Yardımcı işletme mühendisleriyle veri tamamlama toplantısı'],
    ['VK-006','Maliyet Raporu','Fatura Bazlı Detay','Tüm kayıtlar','Dönem Eksik',
     'Yalnızca Ocak-Mart 2025 mevcut; Nisan 2025 ve sonrası yok. '
     'Bütçe karşılaştırması yapılamıyor.',
     'Açık','Tam yıl SAP verisi istenecek; bütçe planı ile eşleştirilecek'],
    ['VK-007','Maliyet Raporu','Fatura Bazlı Detay','Tüm kayıtlar','Bütçe Karşılaştırması Yok',
     'Planlanan bütçe değerleri mevcut değil; '
     'yalnızca gerçekleşen giderler var',
     'Açık','Yıllık bütçe tablosu ayrıca temin edilmeli'],
    ['VK-008','HAZOP Aksiyon','AKSIYON_LISTESI','Tüm aksiyonlar','Sorumlu Eksik',
     '619 HAZOP aksiyonunun hiçbirinde sorumlu kişi veya termin tarihi yok',
     'Açık','Proje sahibi aksiyonları gözden geçirip sorumlu atamalı'],
    ['VK-009','Pilot Reaktör','GİRDİLER','Kalem 6','Varsayım',
     'Betopan demontaj birim fiyatı protokolde yok; çelik montaj/demontaj '
     'oranından türetildi (%50)',
     'Açık','Sözleşme revizyonunda fiyat netleştirilmeli'],
    ['VK-010','ADS Sistemi','5-Riskler','KRİTİK maddeler','Teknik Veri Eksik',
     'UF reaktör dolu hacmi ve fenolik swell (ARC/VSP2) doğrulanmadan '
     '50 m³ hacim kesinleşemiyor',
     'Açık','Reaktör proses verileri temin edilmeli; kalorimetre testi yapılmalı'],
]
for i, row in enumerate(vk_data):
    r = 3 + i
    for j, val in enumerate(row):
        bg = C_RED_LIGHT if j == 5 and 'Eksik' in val else (C_XLITE_BLUE if i%2==0 else None)
        style_data(ws_vk, r, j+1, value=val, bg=bg)
freeze(ws_vk, 'B3')
set_col_widths(ws_vk, {
    'A':10,'B':35,'C':20,'D':25,'E':22,
    'F':70,'G':14,'H':60
})
make_table(ws_vk, 'tbl_VeriKalite', f'A2:H{2+len(vk_data)}')
ws_vk.conditional_formatting.add(
    f'G3:G{2+len(vk_data)}',
    FormulaRule(formula=['$G3="Açık"'],
                fill=fill(C_AMBER_LIGHT), font=fnt(color=C_AMBER_TEXT)))

# ============================================================
# SHEET 16: DASHBOARD  (created last so formulas reference other sheets)
# ============================================================
ws_d = wb.create_sheet('Dashboard', 0)  # Insert at beginning
ws_d.sheet_view.showGridLines = False

# Title
ws_d.merge_cells('A1:N1')
c = ws_d['A1']
c.value = 'POLİSAN KİMYA — MERKEZİ İŞLETME YÖNETİM PANELİ'
c.font  = Font(name='Arial', bold=True, size=16, color=C_WHITE)
c.fill  = fill(C_DARK_BLUE)
c.alignment = Alignment(horizontal='center', vertical='center')
ws_d.row_dimensions[1].height = 36

# Sub-title row
ws_d.merge_cells('A2:N2')
c = ws_d['A2']
c.value = f'Güncelleme: {TODAY_STR}   |   Hazırlayan: Orhan KARABA   |   Tüm veriler kaynak dosyalardan derlenmiştir'
c.font  = Font(name='Arial', size=10, color='606060', italic=True)
c.alignment = Alignment(horizontal='center', vertical='center')
ws_d.row_dimensions[2].height = 18

# Column widths for dashboard
for col in 'ABCDEFGHIJKLMN':
    ws_d.column_dimensions[col].width = 16
ws_d.column_dimensions['A'].width = 22
ws_d.column_dimensions['B'].width = 22
ws_d.column_dimensions['E'].width = 22
ws_d.column_dimensions['F'].width = 22
ws_d.column_dimensions['I'].width = 22
ws_d.column_dimensions['J'].width = 22

def dash_kpi_box(ws, title_row, val_row, col, title, formula_or_val,
                 title_bg=C_MED_BLUE, val_bg=C_WHITE,
                 val_fmt=None, val_bold=True, span=2):
    """Create a KPI box spanning `span` columns."""
    end_col = col + span - 1
    # Title row
    ws.merge_cells(start_row=title_row, start_column=col,
                   end_row=title_row, end_column=end_col)
    c = ws.cell(row=title_row, column=col, value=title)
    c.font  = fnt(bold=True, size=9, color=C_WHITE)
    c.fill  = fill(title_bg)
    c.alignment = align(h='center')
    c.border = border_thin()
    ws.row_dimensions[title_row].height = 20
    # Value row
    ws.merge_cells(start_row=val_row, start_column=col,
                   end_row=val_row, end_column=end_col)
    c = ws.cell(row=val_row, column=col,
                value=formula_or_val if isinstance(formula_or_val, str)
                and formula_or_val.startswith('=') else formula_or_val)
    c.font  = fnt(bold=val_bold, size=18, color=C_DARK_BLUE)
    c.fill  = fill(val_bg)
    c.alignment = align(h='center')
    c.border = border_thin()
    if val_fmt:
        c.number_format = val_fmt
    ws.row_dimensions[val_row].height = 38
    return c

# ---- Section 1: PROJE ÖZETI (row 4-7) ----
ws_d.merge_cells('A4:N4')
c = ws_d['A4']
c.value = '▶  PROJE ÖZETİ'
c.font  = fnt(bold=True, size=11, color=C_WHITE)
c.fill  = fill(C_DARK_BLUE)
c.alignment = align(h='left')
c.border = border_thin()
ws_d.row_dimensions[4].height = 22

# KPI boxes for projects
n_prj = len(proje_data)
# Count active = "Devam Ediyor"
n_active = sum(1 for p in proje_data if p[24] == 'Devam Ediyor')
dash_kpi_box(ws_d, 5, 6, 1, 'TOPLAM PROJE', n_prj, span=2)
dash_kpi_box(ws_d, 5, 6, 3, 'DEVAM EDEN', n_active, title_bg='2E75B6', span=2)
dash_kpi_box(ws_d, 5, 6, 5, 'TAMAMLANAN',
             f'=COUNTIF(Projeler!Y:Y,"Tamamlandı")', span=2)
dash_kpi_box(ws_d, 5, 6, 7, 'PLANLANAN BÜTÇE (TL)',
             sum(p[17] for p in proje_data if isinstance(p[17],(int,float))),
             span=3, val_fmt='#,##0', title_bg='2E75B6')
dash_kpi_box(ws_d, 5, 6, 10, 'GERÇEKLEŞİN (TL)',
             0, span=2, val_fmt='#,##0')
dash_kpi_box(ws_d, 5, 6, 12, 'AKSİYON SAYISI',
             len(pa_data), span=2, title_bg='2E75B6')
ws_d.row_dimensions[7].height = 8

# ---- Section 2: TANK DURUMU (row 8-11) ----
ws_d.merge_cells('A8:N8')
c = ws_d['A8']
c.value = '▶  TANK ENVANTERİ DURUMU'
c.font  = fnt(bold=True, size=11, color=C_WHITE)
c.fill  = fill(C_DARK_BLUE)
c.alignment = align(h='left')
c.border = border_thin()
ws_d.row_dimensions[8].height = 22

# Count tanks by status from source
n_tanks_total = len(tanks)
n_uygun = sum(1 for t in tanks if t['Durum'].lower().startswith('uygun') and 'değil' not in t['Durum'].lower() and 'uygunsuz' not in t['Durum'].lower())
n_uygunsuz = sum(1 for t in tanks if 'değil' in t['Durum'].lower() or 'uygunsuz' in t['Durum'].lower())
n_belirsiz = n_tanks_total - n_uygun - n_uygunsuz

dash_kpi_box(ws_d, 9, 10, 1, 'TOPLAM TANK', n_tanks_total, span=2)
dash_kpi_box(ws_d, 9, 10, 3, 'UYGUN',
             f'=COUNTIF(Tank_Envanteri!Q:Q,"Uygun")',
             title_bg='375623', val_bg=C_GREEN_LIGHT, span=2)
dash_kpi_box(ws_d, 9, 10, 5, 'UYGUN DEĞİL / UYGUNSUZ',
             f'=COUNTIFS(Tank_Envanteri!Q:Q,"Uygun Değil")+COUNTIFS(Tank_Envanteri!Q:Q,"Uygunsuz")',
             title_bg='9C0006', val_bg=C_RED_LIGHT, span=3)
dash_kpi_box(ws_d, 9, 10, 8, 'GECİKMİŞ KONTROL',
             f'=COUNTIF(Tank_Envanteri!P:P,"GECİKMİŞ")',
             title_bg='9C6500', val_bg=C_AMBER_LIGHT, span=2)
dash_kpi_box(ws_d, 9, 10, 10, '30 GÜN İÇİNDE',
             f'=COUNTIF(Tank_Envanteri!P:P,"30 GÜN İÇİNDE")',
             title_bg='2E75B6', span=2)
dash_kpi_box(ws_d, 9, 10, 12, '90 GÜN İÇİNDE',
             f'=COUNTIF(Tank_Envanteri!P:P,"90 GÜN İÇİNDE")',
             title_bg='2E75B6', span=2)
ws_d.row_dimensions[11].height = 8

# ---- Section 3: RİSK & HAZOP (row 12-15) ----
ws_d.merge_cells('A12:N12')
c = ws_d['A12']
c.value = '▶  RİSK, UYGUNSUZLUK VE HAZOP AKSİYONLARI'
c.font  = fnt(bold=True, size=11, color=C_WHITE)
c.fill  = fill(C_DARK_BLUE)
c.alignment = align(h='left')
c.border = border_thin()
ws_d.row_dimensions[12].height = 22

n_hazop = len(hazop)
n_tank_risk = sum(1 for t in tanks if 'değil' in t['Durum'].lower() or 'uygunsuz' in t['Durum'].lower())
n_kritik = sum(1 for h in hazop if 'SIS' in h.get('Aksiyon_Turu','') or '3. IPL' in h.get('Aksiyon_Turu',''))

dash_kpi_box(ws_d, 13, 14, 1, 'TOPLAM RİSK KAYDI',
             f'=COUNTA(Risk_Uygunsuzluk!A:A)-3', span=2)
dash_kpi_box(ws_d, 13, 14, 3, 'HAZOP AKSİYONU', n_hazop, span=2)
dash_kpi_box(ws_d, 13, 14, 5, 'TANK UYGUNSUZLUĞU', n_tank_risk,
             title_bg='9C6500', val_bg=C_AMBER_LIGHT, span=2)
dash_kpi_box(ws_d, 13, 14, 7, 'KRİTİK RİSK',
             f'=COUNTIF(Risk_Uygunsuzluk!M:M,"KRİTİK")',
             title_bg='9C0006', val_bg=C_RED_LIGHT, span=3)
dash_kpi_box(ws_d, 13, 14, 10, 'YÜKSEK RİSK',
             f'=COUNTIF(Risk_Uygunsuzluk!M:M,"YÜKSEK")',
             title_bg='9C6500', val_bg=C_AMBER_LIGHT, span=2)
dash_kpi_box(ws_d, 13, 14, 12, 'AÇIK AKSİYON',
             f'=COUNTIF(Risk_Uygunsuzluk!P:P,"Açık")',
             title_bg='2E75B6', span=2)
ws_d.row_dimensions[15].height = 8

# ---- Section 4: MALİYET (row 16-19) ----
ws_d.merge_cells('A16:N16')
c = ws_d['A16']
c.value = '▶  MALİYET MERKEZİ — OCAK-MART 2025 GERÇEKLEŞMELER (SAP)'
c.font  = fnt(bold=True, size=11, color=C_WHITE)
c.fill  = fill(C_DARK_BLUE)
c.alignment = align(h='left')
c.border = border_thin()
ws_d.row_dimensions[16].height = 22

# Calculate totals from loaded finance data
df_fin_local2 = pd.DataFrame(finance)
grand_total = float(df_fin_local2['Tutar_TRY'].sum()) if len(df_fin_local2) > 0 else 0
kazan_total = float(df_fin_local2[df_fin_local2['Masraf_Yeri'].str.contains('KAZAN', na=False)]['Tutar_TRY'].sum())
elektrik_total = float(df_fin_local2[df_fin_local2['Masraf_Yeri'].str.contains('ELEKTRİK', na=False)]['Tutar_TRY'].sum())
diger_total = grand_total - kazan_total - elektrik_total

dash_kpi_box(ws_d, 17, 18, 1, 'TOPLAM GİDER (Oca-Mar 2025)',
             grand_total,
             span=3, val_fmt='#,##0.00 ₺', title_bg='2E75B6')
dash_kpi_box(ws_d, 17, 18, 4, 'KAZAN DAİRESİ',
             kazan_total,
             span=3, val_fmt='#,##0.00 ₺')
dash_kpi_box(ws_d, 17, 18, 7, 'ELEKTRİK ATÖLYESİ',
             elektrik_total,
             span=3, val_fmt='#,##0.00 ₺', title_bg='2E75B6')
dash_kpi_box(ws_d, 17, 18, 10, 'DİĞER MASRAF YERLERİ',
             diger_total,
             span=3, val_fmt='#,##0.00 ₺')
ws_d.row_dimensions[19].height = 8

# ---- Section 5: VERİ EKSİKLİKLERİ (row 20-23) ----
ws_d.merge_cells('A20:N20')
c = ws_d['A20']
c.value = '▶  VERİ KALİTESİ VE EKSİKLİKLER'
c.font  = fnt(bold=True, size=11, color=C_WHITE)
c.fill  = fill(C_DARK_BLUE)
c.alignment = align(h='left')
c.border = border_thin()
ws_d.row_dimensions[20].height = 22

dash_kpi_box(ws_d, 21, 22, 1, 'AÇIK VERİ KALİTESİ SORUNU',
             f'=COUNTIF(Veri_Kalitesi!G:G,"Açık")',
             title_bg='9C0006', val_bg=C_RED_LIGHT, span=2)
dash_kpi_box(ws_d, 21, 22, 3, 'HAZOP SORUMLU EKSİK',
             n_hazop,
             title_bg='9C6500', val_bg=C_AMBER_LIGHT, span=2)
dash_kpi_box(ws_d, 21, 22, 5, 'MALİYET DÖNEMİ KAYNAK SAYISI',
             f'=COUNTA(Butce_Maliyet!A:A)-3',
             span=2)
dash_kpi_box(ws_d, 21, 22, 7, 'DOKÜMAN KAYDI',
             f'=COUNTA(Dokuman_Yonetimi!A:A)-2',
             span=3, title_bg='2E75B6')
dash_kpi_box(ws_d, 21, 22, 10, 'KAYNAK DOSYA SAYISI',
             len(source_data), span=2)
dash_kpi_box(ws_d, 21, 22, 12, 'SON GÜNCELLEME',
             TODAY_STR, span=2, val_fmt='@')
ws_d.row_dimensions[23].height = 8

# Navigation / quick links row
ws_d.merge_cells('A24:N24')
c = ws_d['A24']
c.value = ('Sayfalar: Projeler | Proje_Aksiyonlar | Gunluk_Is_Takibi | Tank_Envanteri | '
           'Tank_Muayene_Log | Dolum_Hortumlari | Ekipman_Envanteri | Bakim_Gecmisi | '
           'Butce_Maliyet | Satin_Alma | Risk_Uygunsuzluk | Dokuman_Yonetimi | '
           'Tanimlar | Veri_Kalitesi | Kaynak_Dosyalar')
c.font = Font(name='Arial', size=9, color='4472C4', italic=True)
c.alignment = Alignment(horizontal='center', vertical='center')
c.fill = fill('EEF3F9')
ws_d.row_dimensions[24].height = 22

ws_d.freeze_panes = 'A3'

# ============================================================
# TAB COLORS
# ============================================================
tab_colors = {
    'Dashboard'         : '1F3864',
    'Projeler'          : '2E75B6',
    'Proje_Aksiyonlar'  : '4472C4',
    'Gunluk_Is_Takibi'  : '70AD47',
    'Tank_Envanteri'    : 'ED7D31',
    'Tank_Muayene_Log'  : 'F4B942',
    'Dolum_Hortumlari'  : 'FFC000',
    'Ekipman_Envanteri' : '9E480E',
    'Bakim_Gecmisi'     : 'A5A5A5',
    'Butce_Maliyet'     : 'C00000',
    'Satin_Alma'        : 'FF0000',
    'Risk_Uygunsuzluk'  : '7030A0',
    'Dokuman_Yonetimi'  : '00B0F0',
    'Tanimlar'          : '92D050',
    'Veri_Kalitesi'     : 'FFFF00',
    'Kaynak_Dosyalar'   : 'D9D9D9',
}
for sname, color in tab_colors.items():
    if sname in wb.sheetnames:
        wb[sname].sheet_properties.tabColor = color

# ============================================================
# SAVE
# ============================================================
print(f"Saving to {OUT_FILE}...")
wb.save(OUT_FILE)
print("Done. Now recalculating formulas...")
