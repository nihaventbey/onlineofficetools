import os
from PIL import Image, ImageDraw, ImageFont

# Dimensions: 1920x1080 (16:9 Full HD Presentation Slide)
SLIDE_W = 1920
SLIDE_H = 1080

FONT_PATH = "/usr/share/fonts/TTF/DejaVuSans.ttf"
FONT_BOLD_PATH = "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"

def get_font(size, bold=False):
    path = FONT_BOLD_PATH if bold else FONT_PATH
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

slides = []

def create_slide_base():
    img = Image.new("RGB", (SLIDE_W, SLIDE_H), (15, 23, 42)) # Slate 900
    draw = ImageDraw.Draw(img)
    
    # Modern glow accents
    for r in range(500, 0, -20):
        draw.ellipse([1800 - r, 100 - r, 1800 + r, 100 + r], outline=(30, 58, 138), width=3)
    
    # Header bar
    draw.text((100, 60), "OnlineOfficeTools.com", fill=(96, 165, 250), font=get_font(24, bold=True))
    draw.text((1500, 60), "Yeni Özellikler & Araçlar", fill=(148, 163, 184), font=get_font(20))
    draw.line([100, 105, 1820, 105], fill=(51, 65, 85), width=1)
    
    # Footer
    draw.line([100, 1010, 1820, 1010], fill=(51, 65, 85), width=1)
    draw.text((100, 1025), "🔒 %100 İstemci Taraflı • Sıfır Dosya Yüklemesi • 8 Dil Desteği • 69 Ücretsiz Araç", fill=(148, 163, 184), font=get_font(16))
    draw.text((1700, 1025), "LinkedIn Carousel", fill=(148, 163, 184), font=get_font(16))
    
    return img, draw

# =========================================================================
# SLIDE 1: COVER
# =========================================================================
img, draw = create_slide_base()
draw.rounded_rectangle([100, 220, 420, 265], radius=10, fill=(30, 58, 138))
draw.text((120, 230), "ÜRÜN GÜNCELLEMESİ • 2026", fill=(147, 197, 253), font=get_font(18, bold=True))

draw.text((100, 310), "Ofis İşlerinizi Hızlandıran", fill=(248, 250, 252), font=get_font(64, bold=True))
draw.text((100, 395), "9 Yeni Güçlü Araç", fill=(52, 211, 153), font=get_font(64, bold=True))

desc = (
    "OnlineOfficeTools.com üzerinde belgeleriniz asla uzak sunuculara yüklenmez.\n"
    "Tüm işlemler tarayıcınızın içinde, cihazınızın işlemci gücüyle gerçekleşir.\n"
    "İşte platforma son eklenen en popüler araçlar ve kullanım senaryoları."
)
draw.text((100, 510), desc, fill=(203, 213, 225), font=get_font(24), spacing=14)

# 3 Highlights Cards
cards = [
    ("💬 WhatsApp Temizleyici", "Kişi bazlı mesaj gruplama ve gürültü temizleme"),
    ("📄 Birleşik PDF Stüdyosu", "Canlı önizlemeli sayfa numaralandırma ve düzen"),
    ("🎨 İkon & Favicon Paketi", "PWA ve tüm tarayıcılar için eksiksiz .zip çıktısı"),
]
for idx, (title, sub) in enumerate(cards):
    cx = 100 + idx * 580
    draw.rounded_rectangle([cx, 720, cx + 550, 890], radius=16, fill=(30, 41, 59), outline=(51, 65, 85), width=2)
    draw.text((cx + 35, 755), title, fill=(248, 250, 252), font=get_font(26, bold=True))
    draw.text((cx + 35, 810), sub, fill=(148, 163, 184), font=get_font(18))

slides.append(img)

# =========================================================================
# SLIDE 2: WHATSAPP CLEANER
# =========================================================================
img, draw = create_slide_base()
draw.rounded_rectangle([100, 140, 340, 180], radius=8, fill=(16, 185, 129))
draw.text((120, 148), "METİN & İLETİŞİM", fill=(15, 23, 42), font=get_font(16, bold=True))

draw.text((100, 205), "WhatsApp Konuşma Temizleyici & Gruplayıcı", fill=(248, 250, 252), font=get_font(42, bold=True))
draw.text((100, 265), "Dağınık sohbet kayıtlarını tek tıkla kişi başlıkları altında düzenli raporlara dönüştürün.", fill=(148, 163, 184), font=get_font(20))

# Embed Screenshot on Left/Center
shot = Image.open("docs/showcase/images/01_whatsapp_cleaner.png").resize((1050, 700))
img.paste(shot, (100, 305))

# Right Column Bullets
bx = 1200
draw.text((bx, 340), "Öne Çıkan Yetenekler:", fill=(96, 165, 250), font=get_font(26, bold=True))

bullets = [
    ("👤 Kişi Bazlı Gruplama", "Her satırda isim tekrarlamak yerine aynı kişinin ardışık mesajlarını birleştirir."),
    ("🧹 Sistem Mesajı Temizliği", "<Medya dahil edilmedi>, Bu mesaj silindi vb. 8 dildeki bildirimleri otomatik ayıklar."),
    ("⏰ Zaman Damgası Filtresi", "[14:32, 31.10.2026] gibi karmaşık tarih/saat damgalarını tamamen kaldırır."),
    ("✏️ Konuşmacı Yönetimi", "Telefon numaralarını isimle değiştirin, dilediğiniz konuşmacıyı gizleyin."),
    ("📋 Hızlı Kopyalama", "Hukuki delil, müşteri destek kaydı veya özet hazırlamak için idealdir.")
]

y_pos = 410
for b_title, b_desc in bullets:
    draw.text((bx, y_pos), b_title, fill=(248, 250, 252), font=get_font(20, bold=True))
    draw.text((bx, y_pos + 30), b_desc, fill=(148, 163, 184), font=get_font(15))
    y_pos += 85

slides.append(img)

# =========================================================================
# SLIDE 3: UNIFIED PDF STUDIO
# =========================================================================
img, draw = create_slide_base()
draw.rounded_rectangle([100, 140, 300, 180], radius=8, fill=(225, 29, 72))
draw.text((120, 148), "PDF ÇÖZÜMLERİ", fill=(255, 255, 255), font=get_font(16, bold=True))

draw.text((100, 205), "Birleşik PDF Stüdyosu (Numaralandır & Düzenle)", fill=(248, 250, 252), font=get_font(42, bold=True))
draw.text((100, 265), "PDF sayfalarınızı görsel kartlar üzerinde canlı inceleyerek yönetin.", fill=(148, 163, 184), font=get_font(20))

shot = Image.open("docs/showcase/images/02_pdf_studio.png").resize((1050, 700))
img.paste(shot, (100, 305))

bx = 1200
draw.text((bx, 340), "Neler Yapabilirsiniz?", fill=(96, 165, 250), font=get_font(26, bold=True))

bullets = [
    ("🔢 Akıllı Sayfa Numarası", "Sayfa X / Y, Sayfa X, X/Y veya sadece sayı formatında dinamik baskı."),
    ("📌 Hassas Konumlandırma", "Alt-Orta, Alt-Sağ, Alt-Sol, Üst-Orta vb. istediğiniz pozisyona yerleştirme."),
    ("📖 Kapak Sayfasını Atlama", "İlk sayfayı numarasız bırakıp numaralandırmayı 2. sayfadan başlatabilme."),
    ("🗂️ Sayfa Sıralama & Silme", "Kartları sürükleyip bırakarak sayfa sırasını değiştirin, gereksizleri silin."),
    ("↻ Tekil Sayfa Döndürme", "Ters taranmış sayfaları tek tek 90° çevirip kusursuz çıktı alın.")
]

y_pos = 410
for b_title, b_desc in bullets:
    draw.text((bx, y_pos), b_title, fill=(248, 250, 252), font=get_font(20, bold=True))
    draw.text((bx, y_pos + 30), b_desc, fill=(148, 163, 184), font=get_font(15))
    y_pos += 85

slides.append(img)

# =========================================================================
# SLIDE 4: FAVICON & PWA GENERATOR
# =========================================================================
img, draw = create_slide_base()
draw.rounded_rectangle([100, 140, 300, 180], radius=8, fill=(37, 99, 235))
draw.text((120, 148), "TASARIM & WEB", fill=(255, 255, 255), font=get_font(16, bold=True))

draw.text((100, 205), "Favicon & Web App İkon Paketi Oluşturucu", fill=(248, 250, 252), font=get_font(42, bold=True))
draw.text((100, 265), "Tek bir logonuzu yükleyin; tüm tarayıcı ve mobil işletim sistemleri için hazır ikon paketini alın.", fill=(148, 163, 184), font=get_font(20))

shot = Image.open("docs/showcase/images/03_favicon_generator.png").resize((1050, 700))
img.paste(shot, (100, 305))

bx = 1200
draw.text((bx, 340), "Tek Tıkla Üretilenler (.ZIP):", fill=(96, 165, 250), font=get_font(26, bold=True))

bullets = [
    ("⭐ Çok Katmanlı favicon.ico", "16x16, 32x32 ve 48x48 boyutlarını tek bir .ico dosyasında birleştirir."),
    ("🍎 Apple Touch Icon", "iPhone ve iPad ana ekranına eklemeler için 180x180 retina ikon."),
    ("📱 PWA icon-192 & icon-512", "Android cihazlar ve Progressive Web App standartlarına tam uyum."),
    ("📄 site.webmanifest", "Projenize doğrudan atabileceğiniz hazır manifest JSON dosyası."),
    ("💻 HTML Head Kodları", "Web sitenize hemen yapıştırmanız için hazır link etiketleri.")
]

y_pos = 410
for b_title, b_desc in bullets:
    draw.text((bx, y_pos), b_title, fill=(248, 250, 252), font=get_font(20, bold=True))
    draw.text((bx, y_pos + 30), b_desc, fill=(148, 163, 184), font=get_font(15))
    y_pos += 85

slides.append(img)

# =========================================================================
# SLIDE 5: CALCULATORS (VAT & WORK HOURS)
# =========================================================================
img, draw = create_slide_base()
draw.rounded_rectangle([100, 140, 330, 180], radius=8, fill=(14, 165, 233))
draw.text((120, 148), "FİNANS & İŞ GÜCÜ", fill=(255, 255, 255), font=get_font(16, bold=True))

draw.text((100, 205), "KDV & Tevkifat ve Çalışma Saati Hesaplayıcı", fill=(248, 250, 252), font=get_font(42, bold=True))
draw.text((100, 265), "Maliye mevzuatına uygun fatura tevkifatı ve işletmeler için haftalık mesai hesaplama.", fill=(148, 163, 184), font=get_font(20))

shot = Image.open("docs/showcase/images/04_calculators.png").resize((1050, 700))
img.paste(shot, (100, 305))

bx = 1200
draw.text((bx, 340), "Pratik Hesaplama Çözümleri:", fill=(96, 165, 250), font=get_font(26, bold=True))

bullets = [
    ("📊 KDV Dahil & Hariç Matrah", "Fatura tutarından anında KDV ve matrah ayrıştırma."),
    ("⚖️ Yasal Tevkifat Dilimleri", "2/10, 3/10, 5/10, 7/10, 9/10 tevkifat oranlarına göre alıcı ve satıcı payları."),
    ("⏱️ Günlük & Haftalık Puantaj", "Haftanın 7 günü için giriş, çıkış ve mola sürelerini girerek net saat bulma."),
    ("💰 Fazla Mesai Hak Edişi", "45 saati aşan çalışmalar için 1.5x mesai çarpanıyla net ücret hesabı."),
    ("📋 Tek Tıkla Özet Kopyalama", "Hesaplama sonuçlarını muhasebeye veya müşteriye iletmek için tek tıkla kopyalama.")
]

y_pos = 410
for b_title, b_desc in bullets:
    draw.text((bx, y_pos), b_title, fill=(248, 250, 252), font=get_font(20, bold=True))
    draw.text((bx, y_pos + 30), b_desc, fill=(148, 163, 184), font=get_font(15))
    y_pos += 85

slides.append(img)

# =========================================================================
# SLIDE 6: MULTIMEDIA & DATA
# =========================================================================
img, draw = create_slide_base()
draw.rounded_rectangle([100, 140, 340, 180], radius=8, fill=(168, 85, 247))
draw.text((120, 148), "GÜVENLİK & VERİ", fill=(255, 255, 255), font=get_font(16, bold=True))

draw.text((100, 205), "Görsel Sansürleme, Videodan Ses Alma & Liste Temizleme", fill=(248, 250, 252), font=get_font(42, bold=True))
draw.text((100, 265), "Günlük dijital işlerinizi saniyeler içinde çözen yardımcı araçlar.", fill=(148, 163, 184), font=get_font(20))

shot = Image.open("docs/showcase/images/05_censor_audio_list.png").resize((1050, 700))
img.paste(shot, (100, 305))

bx = 1200
draw.text((bx, 340), "Öne Çıkan Araçlar:", fill=(96, 165, 250), font=get_font(26, bold=True))

bullets = [
    ("🕶️ Görsel Sansür & Buzlama", "Kimlik no, plaka, yüz ve imzaları mozaikleme (pixelate) veya siyah bantla gizleyin."),
    ("🎧 Videodan Ses Ayıklayıcı", "MP4 ve WebM videolarındaki sesleri tarayıcıda doğrudan 320kbps MP3 / WAV yapın."),
    ("📋 Liste Temizleyici", "Binlerce satırlık listelerdeki mükerrer kayıtları silin, sıralayın ve numaralandırın."),
    ("⚡ Sıfır Bekleme & Limitsiz", "Dosya boyutu veya kuyruk bekleme derdi olmadan anında sonuç."),
    ("🛡️ KVKK & Gizlilik Uyumlu", "Tüm medya işlemleri %100 yerel bellekte gerçekleşir, sunucuya veri gitmez.")
]

y_pos = 410
for b_title, b_desc in bullets:
    draw.text((bx, y_pos), b_title, fill=(248, 250, 252), font=get_font(20, bold=True))
    draw.text((bx, y_pos + 30), b_desc, fill=(148, 163, 184), font=get_font(15))
    y_pos += 85

slides.append(img)

# =========================================================================
# SLIDE 7: CALL TO ACTION & PLATFORM SUMMARY
# =========================================================================
img, draw = create_slide_base()
draw.rounded_rectangle([100, 220, 360, 265], radius=10, fill=(30, 58, 138))
draw.text((120, 230), "NEDEN BİZİ SEÇMELİSİNİZ?", fill=(147, 197, 253), font=get_font(18, bold=True))

draw.text((100, 310), "Hızlı, Güvenli ve Tamamen Ücretsiz", fill=(248, 250, 252), font=get_font(60, bold=True))
draw.text((100, 395), "69 Güçlü Çözüm Tek Platformda", fill=(52, 211, 153), font=get_font(60, bold=True))

badges = [
    ("🔒 %100 Gizlilik Garantisi", "Dosyalarınız cihazınızdan dışarı çıkmaz, sunucuya yüklenmez."),
    ("⚡ Sıfır Kurulum & Üyeliksiz", "Doğrudan tarayıcıda çalışır. Giriş yapma veya kredi kartı gerekmez."),
    ("🌍 8 Dil ve Küresel Erişim", "Türkçe, İngilizce, Almanca, Fransızca, İspanyolca ve daha fazlası."),
    ("🤖 Yapay Zeka & Ajan Uyumlu", "LLM ve AI botları için modern API & MCP standartlarıyla entegre.")
]

for idx, (b_title, b_sub) in enumerate(badges):
    row = idx // 2
    col = idx % 2
    bx = 100 + col * 860
    by = 500 + row * 180
    draw.rounded_rectangle([bx, by, bx + 820, by + 145], radius=14, fill=(30, 41, 59), outline=(51, 65, 85), width=2)
    draw.text((bx + 35, by + 30), b_title, fill=(248, 250, 252), font=get_font(26, bold=True))
    draw.text((bx + 35, by + 80), b_sub, fill=(148, 163, 184), font=get_font(18))

# Big CTA box
draw.rounded_rectangle([100, 880, 1820, 960], radius=16, fill=(37, 99, 235))
draw.text((650, 902), "👉 Hemen Deneyin: https://onlineofficetools.com", fill=(255, 255, 255), font=get_font(28, bold=True))

slides.append(img)

# Save slides as PDF
pdf_path = "docs/showcase/presentation/OnlineOfficeTools_Yeni_Ozellikler_Sunumu.pdf"
slides[0].save(pdf_path, save_all=True, append_images=slides[1:], resolution=150.0)
print(f"Presentation saved to: {pdf_path} (Total slides: {len(slides)})")
