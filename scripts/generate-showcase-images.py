import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("docs/showcase/images", exist_ok=True)

# Color Palette (Tailwind / Modern SaaS Slate & Indigo/Emerald/Blue)
BG_DARK = (15, 23, 42)       # Slate 900
PANEL_BG = (30, 41, 59)      # Slate 800
PANEL_BORDER = (51, 65, 85)  # Slate 700
TEXT_WHITE = (248, 250, 252) # Slate 50
TEXT_MUTED = (148, 163, 184) # Slate 400
TEXT_BLUE = (96, 165, 250)   # Blue 400
ACCENT_GREEN = (52, 211, 153)# Emerald 400
ACCENT_BLUE = (37, 99, 235)  # Blue 600

# Try to load TTF fonts
FONT_PATH = "/usr/share/fonts/TTF/DejaVuSans.ttf"
FONT_BOLD_PATH = "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"

if not os.path.exists(FONT_PATH):
    FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def get_font(size, bold=False):
    path = FONT_BOLD_PATH if bold else FONT_PATH
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_window_header(draw, x, y, width, title):
    # Top bar
    draw.rounded_rectangle([x, y, x + width, y + 42], radius=10, fill=(40, 53, 72))
    # Window dots
    draw.ellipse([x + 14, y + 16, x + 24, y + 26], fill=(239, 68, 68))
    draw.ellipse([x + 30, y + 16, x + 40, y + 26], fill=(245, 158, 11))
    draw.ellipse([x + 46, y + 16, x + 56, y + 26], fill=(16, 185, 129))
    # Title
    font = get_font(14, bold=True)
    draw.text((x + 70, y + 13), title, fill=TEXT_MUTED, font=font)

def create_base_canvas(badge_text, title_text, subtitle_text):
    img = Image.new("RGB", (1200, 800), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    # Subtle background gradient glow
    for r in range(400, 0, -10):
        alpha = int(12 * (1 - r / 400))
        draw.ellipse([900 - r, 100 - r, 900 + r, 100 + r], outline=(30, 58, 138), width=3)
    
    # Brand Top
    brand_font = get_font(18, bold=True)
    draw.text((60, 45), "OnlineOfficeTools.com", fill=TEXT_BLUE, font=brand_font)
    
    # Badge
    badge_font = get_font(13, bold=True)
    draw.rounded_rectangle([60, 80, 260, 110], radius=8, fill=(30, 58, 138))
    draw.text((72, 87), badge_text.upper(), fill=(147, 197, 253), font=badge_font)
    
    # Title
    title_font = get_font(32, bold=True)
    draw.text((60, 122), title_text, fill=TEXT_WHITE, font=title_font)
    
    # Subtitle
    sub_font = get_font(16, bold=False)
    draw.text((60, 168), subtitle_text, fill=TEXT_MUTED, font=sub_font)
    
    return img, draw

# -------------------------------------------------------------
# IMAGE 1: WhatsApp Chat Cleaner
# -------------------------------------------------------------
img, draw = create_base_canvas(
    "Yeni Metin Aracı",
    "WhatsApp Konuşma Temizleyici & Gruplayıcı",
    "Kopyalanan dağınık WhatsApp konuşmalarını temizler, aynı kişinin mesajlarını başlık altında toplar."
)
# Left Window: Input (Raw)
draw_window_header(draw, 60, 220, 520, "Girdi (Ham Kopyalanan WhatsApp Sohbeti)")
draw.rounded_rectangle([60, 262, 580, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)
raw_text = [
    "[14:30, 31.10.2026] Ahmet Yılmaz: Merhaba Zeynep Hanım",
    "[14:30, 31.10.2026] Ahmet Yılmaz: Yeni proje raporunu hazırladım.",
    "[14:31, 31.10.2026] Ahmet Yılmaz: Ekip toplantısından önce bakabilir misiniz?",
    "[14:31, 31.10.2026] Ahmet Yılmaz: Birkaç önemli revizyon yaptık.",
    "[14:33, 31.10.2026] Zeynep Kaya: Merhaba Ahmet Bey",
    "[14:33, 31.10.2026] Zeynep Kaya: Harika, hemen inceliyorum.",
    "[14:34, 31.10.2026] Zeynep Kaya: <Medya dahil edilmedi>",
    "[14:35, 31.10.2026] Zeynep Kaya: Bütçe tablosu çok yerinde olmuş.",
    "[14:35, 31.10.2026] Zeynep Kaya: Saat 15:00'te sunabiliriz."
]
font_mono = get_font(13)
y_offset = 285
for line in raw_text:
    draw.text((80, y_offset), line, fill=(203, 213, 225), font=font_mono)
    y_offset += 32

# Right Window: Output (Cleaned & Grouped)
draw_window_header(draw, 620, 220, 520, "Çıktı (Kişi Bazlı Gruplanmış & Temizlenmiş)")
draw.rounded_rectangle([620, 262, 1140, 720], radius=0, fill=(24, 34, 52), outline=ACCENT_GREEN, width=1)
font_spk = get_font(15, bold=True)
font_msg = get_font(14)

draw.text((645, 285), "Ahmet Yılmaz:", fill=ACCENT_GREEN, font=font_spk)
msgs1 = [
    "Merhaba Zeynep Hanım",
    "Yeni proje raporunu hazırladım.",
    "Ekip toplantısından önce bakabilir misiniz?",
    "Birkaç önemli revizyon yaptık."
]
y_offset = 315
for m in msgs1:
    draw.text((645, y_offset), m, fill=TEXT_WHITE, font=font_msg)
    y_offset += 26

y_offset += 15
draw.text((645, y_offset), "Zeynep Kaya:", fill=(96, 165, 250), font=font_spk)
y_offset += 30
msgs2 = [
    "Merhaba Ahmet Bey",
    "Harika, hemen inceliyorum.",
    "Bütçe tablosu çok yerinde olmuş.",
    "Saat 15:00'te sunabiliriz."
]
for m in msgs2:
    draw.text((645, y_offset), m, fill=TEXT_WHITE, font=font_msg)
    y_offset += 26

# Bottom feature tags
draw.text((645, 650), "✓ Tarih/Saat Kaldırıldı    ✓ Medya Uyarısı Silindi    ✓ Tek Tıkla Kopyala", fill=ACCENT_GREEN, font=get_font(14, bold=True))
img.save("docs/showcase/images/01_whatsapp_cleaner.png")

# -------------------------------------------------------------
# IMAGE 2: Unified PDF Studio (Page Numberer & Organize)
# -------------------------------------------------------------
img, draw = create_base_canvas(
    "PDF Stüdyosu",
    "PDF Sayfa Düzenleyici & Sayfa Numaralandırıcı",
    "Tarayıcı içinde PDF sayfalarını yeniden sıralayın, döndürün, silin ve özel şablonla numaralandırın."
)
draw_window_header(draw, 60, 220, 1080, "Birleşik PDF Stüdyosu — Canlı Sayfa Önizleme & Numaralandırma")
draw.rounded_rectangle([60, 262, 1140, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)

# Draw 4 PDF page cards
page_titles = [("Sayfa 1 (Kapak)", "Numarasız (Atlandı)", False), ("Sayfa 2", "Sayfa 2 / 4", True), ("Sayfa 3", "Sayfa 3 / 4", True), ("Sayfa 4", "Sayfa 4 / 4", True)]
x_start = 95
for idx, (p_title, p_num, has_num) in enumerate(page_titles):
    card_x = x_start + idx * 260
    # Page paper
    draw.rounded_rectangle([card_x, 300, card_x + 220, 580], radius=6, fill=(248, 250, 252), outline=(203, 213, 225), width=2)
    # Simulated page content lines
    draw.rectangle([card_x + 25, 335, card_x + 195, 345], fill=(226, 232, 240))
    draw.rectangle([card_x + 25, 360, card_x + 160, 368], fill=(226, 232, 240))
    draw.rectangle([card_x + 25, 380, card_x + 180, 388], fill=(226, 232, 240))
    draw.rectangle([card_x + 25, 400, card_x + 130, 408], fill=(226, 232, 240))
    # Simulated table or chart
    draw.rounded_rectangle([card_x + 25, 430, card_x + 195, 520], radius=4, fill=(241, 245, 249))
    # Page number at bottom
    if has_num:
        draw.text((card_x + 75, 550), p_num, fill=(30, 41, 59), font=get_font(12, bold=True))
    else:
        draw.text((card_x + 60, 550), "[Kapak Sayfası]", fill=(148, 163, 184), font=get_font(11))
    # Action buttons below card
    draw.rounded_rectangle([card_x + 15, 600, card_x + 100, 630], radius=6, fill=(51, 65, 85))
    draw.text((card_x + 35, 608), "↻ Döndür", fill=TEXT_WHITE, font=get_font(11))
    draw.rounded_rectangle([card_x + 120, 600, card_x + 205, 630], radius=6, fill=(220, 38, 38))
    draw.text((card_x + 150, 608), "🗑 Sil", fill=TEXT_WHITE, font=get_font(11))

# Bottom toolbar
draw.rounded_rectangle([95, 655, 1105, 700], radius=8, fill=(15, 23, 42))
draw.text((115, 668), "Format: Sayfa X / Y  |  Konum: Alt-Orta  |  Başlangıç: 1  |  Kapak Sayfasını Atla: Açık", fill=TEXT_BLUE, font=get_font(13, bold=True))
draw.rounded_rectangle([930, 660, 1090, 695], radius=6, fill=ACCENT_GREEN)
draw.text((955, 668), "📥 PDF'i İndir", fill=(15, 23, 42), font=get_font(13, bold=True))

img.save("docs/showcase/images/02_pdf_studio.png")

# -------------------------------------------------------------
# IMAGE 3: Favicon Generator
# -------------------------------------------------------------
img, draw = create_base_canvas(
    "Görsel Aracı",
    "Favicon & Web App İkon Paketi Oluşturucu",
    "Tek bir logo veya görselden tüm tarayıcı ve mobil platformlar için eksiksiz ikon paketini üretir."
)
draw_window_header(draw, 60, 220, 1080, "İkon Üretim ve Önizleme Masası")
draw.rounded_rectangle([60, 262, 1140, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)

# Left preview: Uploaded logo
draw.rounded_rectangle([100, 310, 380, 590], radius=12, fill=(15, 23, 42), outline=PANEL_BORDER, width=1)
draw.text((130, 330), "Kaynak Logo (512x512)", fill=TEXT_MUTED, font=get_font(14, bold=True))
# Simulated logo
draw.rounded_rectangle([150, 370, 330, 550], radius=24, fill=(37, 99, 235))
draw.text((205, 430), "OOT", fill=TEXT_WHITE, font=get_font(36, bold=True))

# Right grid: Generated packages
sizes = [
    ("favicon.ico", "16, 32, 48px çoklu katman", 430, 310),
    ("favicon-32x32.png", "Standart masaüstü tarayıcı ikonu", 780, 310),
    ("apple-touch-icon.png", "180x180 iOS ana ekran ikonu", 430, 415),
    ("icon-192.png", "PWA Android standart ekran ikonu", 780, 415),
    ("icon-512.png", "PWA yüksek çözünürlük / Splash", 430, 520),
    ("manifest.webmanifest", "Hazır JSON web app manifest dosyası", 780, 520),
]

for name, desc, bx, by in sizes:
    draw.rounded_rectangle([bx, by, bx + 325, by + 85], radius=10, fill=(24, 34, 52), outline=PANEL_BORDER, width=1)
    draw.ellipse([bx + 18, by + 28, bx + 48, by + 58], fill=(37, 99, 235))
    draw.text([bx + 26, by + 34], "★", fill=TEXT_WHITE, font=get_font(16))
    draw.text([bx + 62, by + 22], name, fill=TEXT_WHITE, font=get_font(14, bold=True))
    draw.text([bx + 62, by + 46], desc, fill=TEXT_MUTED, font=get_font(11))

# Bottom ZIP button
draw.rounded_rectangle([100, 635, 1100, 690], radius=8, fill=(16, 185, 129))
draw.text((450, 652), "📦 Tüm Paketi İndir (.ZIP / HTML Kodu Dahil)", fill=TEXT_WHITE, font=get_font(16, bold=True))

img.save("docs/showcase/images/03_favicon_generator.png")

# -------------------------------------------------------------
# IMAGE 4: VAT Calculator & Work Hours Calculator
# -------------------------------------------------------------
img, draw = create_base_canvas(
    "Hesaplayıcı Araçları",
    "KDV & Tevkifat ve Çalışma Saati / Mesai Hesaplayıcı",
    "Maliye mevzuatına uygun KDV tevkifatı dökümü ve haftalık puantaj/mesai ücreti hesaplamaları."
)
# Left: VAT Calculator
draw_window_header(draw, 60, 220, 520, "KDV & Tevkifat Hesaplayıcı")
draw.rounded_rectangle([60, 262, 580, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)
vat_lines = [
    ("İşlem Tutarı (Matrah):", "100.000,00 ₺"),
    ("KDV Oranı:", "%20"),
    ("Hesaplanan KDV:", "20.000,00 ₺"),
    ("Tevkifat Oranı:", "5/10 (Yarı Yarıya)"),
    ("Alıcı Tevkifat Tutarı:", "10.000,00 ₺"),
    ("Tahsil Edilecek KDV:", "10.000,00 ₺"),
    ("Fatura Genel Toplamı:", "120.000,00 ₺"),
    ("Ödenecek Net Tutar:", "110.000,00 ₺"),
]
y_offset = 295
for label, val in vat_lines:
    draw.text((85, y_offset), label, fill=TEXT_MUTED, font=get_font(13))
    draw.text((380, y_offset), val, fill=TEXT_WHITE if "Ödenecek" not in label else ACCENT_GREEN, font=get_font(14, bold=True))
    y_offset += 46

# Right: Work Hours & Overtime
draw_window_header(draw, 620, 220, 520, "Haftalık Çalışma & Fazla Mesai Hesaplayıcı")
draw.rounded_rectangle([620, 262, 1140, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)
work_lines = [
    ("Toplam Çalışma Süresi:", "48 Saat"),
    ("Haftalık Yasal Süre:", "45 Saat"),
    ("Hesaplanan Fazla Mesai:", "3 Saat"),
    ("Saatlik Taban Ücret:", "250,00 ₺ / saat"),
    ("Mesai Çarpanı:", "1.5x (Hafta İçi)"),
    ("Normal Çalışma Hak Edişi:", "11.250,00 ₺"),
    ("Fazla Mesai Hak Edişi:", "1.125,00 ₺"),
    ("Toplam Net Ödeme:", "12.375,00 ₺"),
]
y_offset = 295
for label, val in work_lines:
    draw.text((645, y_offset), label, fill=TEXT_MUTED, font=get_font(13))
    draw.text((940, y_offset), val, fill=TEXT_WHITE if "Toplam Net" not in label else (96, 165, 250), font=get_font(14, bold=True))
    y_offset += 46

img.save("docs/showcase/images/04_calculators.png")

# -------------------------------------------------------------
# IMAGE 5: Image Censor, Video to Audio, List Cleaner
# -------------------------------------------------------------
img, draw = create_base_canvas(
    "Multimedya & Veri",
    "Görsel Sansürleme, Videodan Ses Alma & Liste Temizleme",
    "Hassas verileri buzlama, videodan anında MP3 çıkarma ve listelerdeki tekrarları temizleme."
)

# Box 1: Censor
draw_window_header(draw, 60, 220, 335, "Görsel Sansür & Buzlama")
draw.rounded_rectangle([60, 262, 395, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)
# Simulated document with blurred box
draw.rounded_rectangle([85, 290, 370, 480], radius=6, fill=(241, 245, 249))
draw.rectangle([105, 320, 350, 330], fill=(203, 213, 225))
draw.rectangle([105, 350, 320, 360], fill=(203, 213, 225))
# Black censor bar
draw.rectangle([105, 385, 280, 415], fill=(15, 23, 42))
draw.text((130, 392), "■■■ TC KIMLIK NO ■■■", fill=(239, 68, 68), font=get_font(10, bold=True))
# Pixelated area
draw.rounded_rectangle([105, 430, 220, 465], radius=4, fill=(148, 163, 184))
draw.text((115, 442), "[Piksel Sansür]", fill=(15, 23, 42), font=get_font(11, bold=True))

draw.text((85, 510), "✓ Dikdörtgen / Serbest Fırça", fill=TEXT_WHITE, font=get_font(12, bold=True))
draw.text((85, 540), "✓ Mozaikleme (Pixelate)", fill=TEXT_MUTED, font=get_font(12))
draw.text((85, 570), "✓ Buzlama (Gaussian Blur)", fill=TEXT_MUTED, font=get_font(12))
draw.text((85, 600), "✓ Siyah Güvenlik Bandı", fill=TEXT_MUTED, font=get_font(12))
draw.text((85, 660), "100% İstemci Taraflı", fill=ACCENT_GREEN, font=get_font(13, bold=True))

# Box 2: Video to Audio
draw_window_header(draw, 425, 220, 350, "Videodan Ses Ayıklayıcı")
draw.rounded_rectangle([425, 262, 775, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)
draw.rounded_rectangle([450, 290, 750, 480], radius=8, fill=(15, 23, 42), outline=PANEL_BORDER, width=1)
# Waveform simulation
for i in range(25):
    h = (i * 7) % 40 + 15
    draw.rectangle([480 + i * 10, 385 - h, 486 + i * 10, 385 + h], fill=(96, 165, 250))
draw.text((515, 435), "Web Audio API Çıkarımı", fill=TEXT_MUTED, font=get_font(12))

draw.text((450, 510), "Giriş: MP4, WebM, MOV, MKV", fill=TEXT_WHITE, font=get_font(12, bold=True))
draw.text((450, 545), "Çıkış: MP3 (320kbps) / WAV (Kayıpsız)", fill=TEXT_BLUE, font=get_font(12, bold=True))
draw.text((450, 580), "Boyut Limiti Yok (Local Stream)", fill=TEXT_MUTED, font=get_font(12))
draw.text((450, 615), "Sunucuya Yükleme Yok", fill=TEXT_MUTED, font=get_font(12))
draw.rounded_rectangle([450, 655, 750, 695], radius=6, fill=ACCENT_BLUE)
draw.text((540, 667), "🎧 Sesi İndir", fill=TEXT_WHITE, font=get_font(13, bold=True))

# Box 3: List Cleaner
draw_window_header(draw, 805, 220, 335, "Liste Temizleyici & Tekrar Silici")
draw.rounded_rectangle([805, 262, 1140, 720], radius=0, fill=PANEL_BG, outline=PANEL_BORDER, width=1)
draw.text((825, 290), "Girdi: 1.250 Karışık Satır", fill=TEXT_MUTED, font=get_font(13))
draw.text((825, 325), "Çıktı: 840 Benzersiz Satır", fill=ACCENT_GREEN, font=get_font(14, bold=True))
draw.text((825, 360), "Temizlenen: 410 Mükerrer", fill=(245, 158, 11), font=get_font(13, bold=True))

draw.rectangle([825, 400, 1120, 401], fill=PANEL_BORDER)
draw.text((825, 420), "Özellikler:", fill=TEXT_WHITE, font=get_font(13, bold=True))
draw.text((825, 455), "• Büyük/Küçük harf duyarlılığı", fill=TEXT_MUTED, font=get_font(12))
draw.text((825, 485), "• Boş satırları ve boşlukları at", fill=TEXT_MUTED, font=get_font(12))
draw.text((825, 515), "• A-Z / Z-A alfabetik sırala", fill=TEXT_MUTED, font=get_font(12))
draw.text((825, 545), "• Madde imi / Numaralandırma", fill=TEXT_MUTED, font=get_font(12))
draw.text((825, 575), "• Virgülle / Satırla birleştir", fill=TEXT_MUTED, font=get_font(12))
draw.rounded_rectangle([825, 655, 1120, 695], radius=6, fill=(16, 185, 129))
draw.text((915, 667), "📋 Temiz Listeyi Kopyala", fill=TEXT_WHITE, font=get_font(12, bold=True))

img.save("docs/showcase/images/05_censor_audio_list.png")
print("All 5 showcase screenshots generated successfully!")
