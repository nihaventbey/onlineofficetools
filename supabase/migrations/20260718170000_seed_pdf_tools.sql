-- Seed 5 PDF tools + en/tr translations (idempotent)

insert into public.tools (slug, category, status, sort_order) values
  ('pdf-merge', 'pdf', 'published', 16),
  ('pdf-split', 'pdf', 'published', 17),
  ('pdf-rotate', 'pdf', 'published', 18),
  ('pdf-compress', 'pdf', 'published', 19),
  ('images-to-pdf', 'pdf', 'published', 20)
on conflict (slug) do update
set category = excluded.category,
    status = 'published',
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Merge PDF', 'Combine multiple PDF files into one, in your browser.', 'Merge PDF — Free Online Tool', 'Merge PDF files locally in your browser. Nothing is uploaded.', 'Runs entirely in your browser.'),
    ('tr', 'PDF Birleştir', 'Birden fazla PDF dosyasını tarayıcınızda tek dosyada birleştirin.', 'PDF Birleştir — Ücretsiz Online Araç', 'PDF dosyalarını tarayıcınızda birleştirin. Hiçbir şey yüklenmez.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'pdf-merge'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Split PDF', 'Extract pages or page ranges into a new PDF.', 'Split PDF — Free Online Tool', 'Split PDF pages locally in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'PDF Böl', 'Sayfa veya sayfa aralıklarını yeni bir PDF olarak çıkarın.', 'PDF Böl — Ücretsiz Online Araç', 'PDF sayfalarını tarayıcınızda bölün.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'pdf-split'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Rotate PDF', 'Rotate all or selected pages by 90°, 180°, or 270°.', 'Rotate PDF — Free Online Tool', 'Rotate PDF pages locally in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'PDF Döndür', 'Tüm veya seçili sayfaları 90°, 180° veya 270° döndürün.', 'PDF Döndür — Ücretsiz Online Araç', 'PDF sayfalarını tarayıcınızda döndürün.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'pdf-rotate'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Compress PDF', 'Reduce PDF size by re-encoding pages as images.', 'Compress PDF — Free Online Tool', 'Compress PDFs locally in your browser.', 'Pages become images; text is no longer selectable.'),
    ('tr', 'PDF Sıkıştır', 'Sayfaları yeniden kodlayarak PDF boyutunu küçültün.', 'PDF Sıkıştır — Ücretsiz Online Araç', 'PDF''leri tarayıcınızda sıkıştırın.', 'Sayfalar görsele dönüşür; metin seçilebilir olmaz.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'pdf-compress'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Images to PDF', 'Convert PNG or JPG images into a single PDF.', 'Images to PDF — Free Online Tool', 'Turn images into a PDF locally in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'Görsellerden PDF', 'PNG veya JPG görsellerini tek bir PDF''e dönüştürün.', 'Görsellerden PDF — Ücretsiz Online Araç', 'Görselleri tarayıcınızda PDF''e çevirin.', 'Tamamen tarayıcınızda çalışır.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'images-to-pdf'
on conflict (tool_id, locale) do update
set title = excluded.title, short_description = excluded.short_description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, content = excluded.content, updated_at = timezone('utc', now());
