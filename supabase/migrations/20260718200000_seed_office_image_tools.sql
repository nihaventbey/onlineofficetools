-- Seed new Office / image / presentation tools (idempotent)

insert into public.tools (slug, category, status, sort_order)
values
  ('find-replace', 'text', 'published', 50),
  ('pdf-to-text', 'documents', 'published', 100),
  ('docx-viewer', 'documents', 'published', 110),
  ('docx-to-html', 'documents', 'published', 120),
  ('html-to-docx', 'documents', 'published', 130),
  ('docx-diff', 'documents', 'published', 140),
  ('text-to-pdf', 'documents', 'published', 150),
  ('xlsx-viewer', 'spreadsheets', 'published', 200),
  ('xlsx-to-csv', 'spreadsheets', 'published', 210),
  ('csv-to-xlsx', 'spreadsheets', 'published', 220),
  ('csv-editor', 'spreadsheets', 'published', 230),
  ('images-to-pptx', 'presentations', 'published', 300),
  ('text-to-pptx', 'presentations', 'published', 310),
  ('pptx-extract', 'presentations', 'published', 320),
  ('pdf-to-images', 'pdf', 'published', 400),
  ('image-resize', 'image', 'published', 500),
  ('image-compress', 'image', 'published', 510),
  ('image-crop', 'image', 'published', 520),
  ('image-convert', 'image', 'published', 530),
  ('image-metadata', 'image', 'published', 540),
  ('image-enhance', 'image', 'published', 550),
  ('image-ai-upscale', 'image', 'published', 560)
on conflict (slug) do update set
  category = excluded.category,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

-- English titles from registry-facing names (UI dictionaries remain source of truth for full i18n)
insert into public.tool_translations (tool_id, locale, title, short_description)
select t.id, 'en', v.title, v.descr
from public.tools t
join (
  values
    ('find-replace', 'Find & Replace', 'Find, replace, and clean text lines.'),
    ('pdf-to-text', 'PDF to Text', 'Extract text from PDF pages in your browser.'),
    ('docx-viewer', 'DOCX Viewer', 'Preview Word documents and extract text.'),
    ('docx-to-html', 'DOCX to HTML', 'Convert Word documents to HTML.'),
    ('html-to-docx', 'HTML / Text to DOCX', 'Create Word files from HTML or text.'),
    ('docx-diff', 'DOCX Compare', 'Compare text from two Word documents.'),
    ('text-to-pdf', 'Text to PDF', 'Create a simple PDF from plain text.'),
    ('xlsx-viewer', 'Excel Viewer', 'Preview spreadsheet sheets in your browser.'),
    ('xlsx-to-csv', 'XLSX to CSV', 'Export Excel sheets as CSV.'),
    ('csv-to-xlsx', 'CSV to XLSX', 'Convert CSV data into Excel.'),
    ('csv-editor', 'CSV Editor', 'Edit CSV tables in a simple grid.'),
    ('images-to-pptx', 'Images to PowerPoint', 'Turn images into a PPTX slideshow.'),
    ('text-to-pptx', 'Text to PowerPoint', 'Turn an outline into PowerPoint slides.'),
    ('pptx-extract', 'PPTX Text Extract', 'Extract text from PowerPoint files.'),
    ('pdf-to-images', 'PDF to Images', 'Render PDF pages as PNG images.'),
    ('image-resize', 'Image Resizer', 'Resize images by pixels or percentage.'),
    ('image-compress', 'Image Compressor', 'Reduce image file size.'),
    ('image-crop', 'Crop & Rotate', 'Crop, rotate, and flip images.'),
    ('image-convert', 'Image Converter', 'Convert between PNG, JPG, and WebP.'),
    ('image-metadata', 'Image Metadata', 'View info and strip EXIF metadata.'),
    ('image-enhance', 'Image Enhancer', 'Upscale and sharpen images (not AI).'),
    ('image-ai-upscale', 'AI Image Upscaler (Beta)', 'Optional on-device AI upscaling.')
) as v(slug, title, descr) on t.slug = v.slug
on conflict (tool_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  updated_at = timezone('utc', now());
