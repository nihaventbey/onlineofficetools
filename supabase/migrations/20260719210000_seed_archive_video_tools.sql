-- Seed archive (ZIP) and video tools (idempotent)
-- Apply via: supabase db push / Dashboard SQL Editor
-- Do not run migrate from the agent — user applies this.

-- Allow new categories on tools.category
alter table public.tools drop constraint if exists tools_category_check;
alter table public.tools
  add constraint tools_category_check
  check (
    category is null
    or category in (
      'text', 'documents', 'spreadsheets', 'presentations',
      'pdf', 'image', 'archive', 'video',
      'developer', 'security', 'calculator'
    )
  );

insert into public.tools (slug, category, status, sort_order)
values
  ('zip-create', 'archive', 'published', 600),
  ('zip-extract', 'archive', 'published', 610),
  ('zip-viewer', 'archive', 'published', 620),
  ('video-frame-extractor', 'video', 'published', 700),
  ('video-to-gif', 'video', 'published', 710),
  ('video-trim', 'video', 'published', 720),
  ('video-metadata', 'video', 'published', 730)
on conflict (slug) do update set
  category = excluded.category,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

-- English CMS titles (UI dictionaries remain source of truth for full i18n)
insert into public.tool_translations (tool_id, locale, title, short_description)
select t.id, 'en', v.title, v.descr
from public.tools t
join (
  values
    ('zip-create', 'Create ZIP', 'Pack multiple files into a ZIP archive in your browser.'),
    ('zip-extract', 'Extract ZIP', 'Open a ZIP archive and download files individually or all at once.'),
    ('zip-viewer', 'ZIP Viewer', 'Inspect ZIP contents, sizes, and preview text or images.'),
    ('video-frame-extractor', 'Video Frame Extractor', 'Capture still frames from a video as PNG images.'),
    ('video-to-gif', 'Video to GIF', 'Convert a short video clip into an animated GIF.'),
    ('video-trim', 'Trim Video', 'Cut a time range and optionally mute audio. Output is WebM.'),
    ('video-metadata', 'Video Metadata', 'View duration, resolution, aspect ratio, and other video details.')
) as v(slug, title, descr) on t.slug = v.slug
on conflict (tool_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  updated_at = timezone('utc', now());

-- Turkish CMS titles
insert into public.tool_translations (tool_id, locale, title, short_description)
select t.id, 'tr', v.title, v.descr
from public.tools t
join (
  values
    ('zip-create', 'ZIP Oluştur', 'Birden fazla dosyayı tarayıcıda ZIP arşivine paketleyin.'),
    ('zip-extract', 'ZIP Aç', 'ZIP arşivini açın; dosyaları tek tek veya toplu indirin.'),
    ('zip-viewer', 'ZIP Görüntüleyici', 'ZIP içeriğini, boyutları inceleyin; metin veya görsel önizleyin.'),
    ('video-frame-extractor', 'Video Kare Çıkarıcı', 'Videodan PNG kareler yakalayın.'),
    ('video-to-gif', 'Videodan GIF', 'Kısa bir video klipini animasyonlu GIF''e dönüştürün.'),
    ('video-trim', 'Video Kes', 'Zaman aralığını kesin ve isteğe bağlı olarak sesi kapatın. Çıktı WebM.'),
    ('video-metadata', 'Video Meta Verisi', 'Süre, çözünürlük, en-boy oranı ve diğer video ayrıntılarını görün.')
) as v(slug, title, descr) on t.slug = v.slug
on conflict (tool_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  updated_at = timezone('utc', now());
