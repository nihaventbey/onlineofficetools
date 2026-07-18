-- Seed 9 additional published tools + en/tr translations
-- Idempotent: safe to re-run

insert into public.tools (slug, category, status, sort_order) values
  ('html-editor', 'developer', 'published', 7),
  ('markdown-preview', 'developer', 'published', 8),
  ('url-encoder', 'developer', 'published', 9),
  ('uuid-generator', 'developer', 'published', 10),
  ('ocr', 'image', 'published', 11),
  ('qr-generator', 'image', 'published', 12),
  ('color-converter', 'image', 'published', 13),
  ('unit-converter', 'calculator', 'published', 14),
  ('date-difference', 'calculator', 'published', 15)
on conflict (slug) do update
set category = excluded.category,
    status = 'published',
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());

-- Upsert helper pattern for each tool
insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'HTML Editor', 'Edit HTML and preview it live in a sandboxed iframe.', 'HTML Editor — Free Online Tool', 'Live HTML editor and preview in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'HTML Editör', 'HTML düzenleyin ve güvenli önizlemede canlı görün.', 'HTML Editör — Ücretsiz Online Araç', 'Tarayıcınızda canlı HTML editör ve önizleme.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'html-editor'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Markdown Preview', 'Write Markdown and preview rendered HTML safely.', 'Markdown Preview — Free Online Tool', 'Preview Markdown in your browser with a sandboxed renderer.', 'Runs entirely in your browser.'),
    ('tr', 'Markdown Önizleme', 'Markdown yazın ve güvenli HTML önizlemesini görün.', 'Markdown Önizleme — Ücretsiz Online Araç', 'Markdown''ı tarayıcınızda güvenli önizleyin.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'markdown-preview'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'URL Encode / Decode', 'Encode or decode URL components locally.', 'URL Encoder Decoder — Free Online Tool', 'Encode and decode URLs in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'URL Kodla / Çöz', 'URL bileşenlerini yerelde kodlayın veya çözün.', 'URL Kodlayıcı Çözücü — Ücretsiz Online Araç', 'URL''leri tarayıcınızda kodlayın ve çözün.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'url-encoder'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'UUID Generator', 'Generate UUID v4 identifiers with Web Crypto.', 'UUID Generator — Free Online Tool', 'Generate random UUID v4 values in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'UUID Üretici', 'Web Crypto ile UUID v4 tanımlayıcılar üretin.', 'UUID Üretici — Ücretsiz Online Araç', 'Rastgele UUID v4 değerlerini tarayıcınızda üretin.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'uuid-generator'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'OCR — Image to Text', 'Extract text from images entirely in your browser.', 'OCR Image to Text — Free Online Tool', 'Convert images to text with on-device OCR. Nothing is uploaded.', 'Images stay on your device. Language models may load from CDN.'),
    ('tr', 'OCR — Görselden Metin', 'Görsellerdeki metni tamamen tarayıcınızda çıkarın.', 'OCR Görselden Metin — Ücretsiz Online Araç', 'Görselleri cihazda OCR ile metne çevirin. Hiçbir şey yüklenmez.', 'Görseller cihazınızda kalır. Dil modelleri CDN''den yüklenebilir.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'ocr'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'QR Code Generator', 'Create QR codes from text or URLs and download as PNG.', 'QR Code Generator — Free Online Tool', 'Generate QR codes instantly in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'QR Kod Üretici', 'Metin veya URL''den QR kod oluşturun ve PNG indirin.', 'QR Kod Üretici — Ücretsiz Online Araç', 'QR kodları tarayıcınızda anında üretin.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'qr-generator'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Color Converter', 'Convert between HEX, RGB, and HSL with a live color picker.', 'Color Converter — Free Online Tool', 'Convert HEX, RGB, and HSL colors in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'Renk Dönüştürücü', 'HEX, RGB ve HSL arasında dönüştürün; canlı renk seçici.', 'Renk Dönüştürücü — Ücretsiz Online Araç', 'HEX, RGB ve HSL renklerini tarayıcınızda dönüştürün.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'color-converter'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Unit Converter', 'Convert length, weight, temperature, and data units.', 'Unit Converter — Free Online Tool', 'Convert common units instantly in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'Birim Dönüştürücü', 'Uzunluk, ağırlık, sıcaklık ve veri birimlerini dönüştürün.', 'Birim Dönüştürücü — Ücretsiz Online Araç', 'Yaygın birimleri tarayıcınızda anında dönüştürün.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'unit-converter'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Date Difference', 'Calculate days, weeks, months, and years between two dates.', 'Date Difference Calculator — Free Online Tool', 'Find the difference between two dates in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'Tarih Farkı', 'İki tarih arasındaki gün, hafta, ay ve yılı hesaplayın.', 'Tarih Farkı Hesaplayıcı — Ücretsiz Online Araç', 'İki tarih arasındaki farkı tarayıcınızda bulun.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'date-difference'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());
