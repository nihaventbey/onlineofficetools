-- Deactivate EBYS tools; publish video-watermark + video-crop (idempotent)

update public.tools
set status = 'draft', updated_at = timezone('utc', now())
where slug in (
  'belgenet-hazirlik',
  'arz-rica',
  'sdp-arama',
  'detsis',
  'belgenet-html'
);

insert into public.tools (slug, category, status, sort_order)
values
  ('video-watermark', 'video', 'published', 620),
  ('video-crop', 'video', 'published', 630)
on conflict (slug) do update set
  category = excluded.category,
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
    ('en', 'Video Watermark', 'Add text or logo watermarks to videos in your browser.', 'Video Watermark — Free Online Tool', 'Watermark MP4/WebM videos locally. Nothing is uploaded.', 'Output is WebM (re-encoded).'),
    ('tr', 'Video Filigran', 'Videolara metin veya logo filigranı ekleyin.', 'Video Filigran — Ücretsiz Online Araç', 'MP4/WebM videolara tarayıcıda filigran ekleyin. Hiçbir şey yüklenmez.', 'Çıktı WebM (yeniden kodlanır).'),
    ('de', 'Video-Wasserzeichen', 'Text- oder Logo-Wasserzeichen auf Videos.', 'Video-Wasserzeichen — Kostenloses Online-Tool', 'Wasserzeichen für Videos im Browser. Nichts wird hochgeladen.', 'Ausgabe ist WebM.'),
    ('fr', 'Filigrane vidéo', 'Ajoutez un filigrane texte ou logo aux vidéos.', 'Filigrane vidéo — Outil en ligne gratuit', 'Filigrane vidéo dans le navigateur. Rien n''est téléversé.', 'Sortie WebM.'),
    ('es', 'Marca de agua en video', 'Añade marcas de agua de texto o logo a videos.', 'Marca de agua en video — Herramienta online gratis', 'Marca de agua en video en el navegador. Nada se sube.', 'Salida WebM.'),
    ('it', 'Filigrana video', 'Aggiungi filigrane di testo o logo ai video.', 'Filigrana video — Strumento online gratuito', 'Filigrana video nel browser. Nulla viene caricato.', 'Output WebM.'),
    ('pt', 'Marca d''água em vídeo', 'Adicione marcas d''água de texto ou logo a vídeos.', 'Marca d''água em vídeo — Ferramenta online grátis', 'Marca d''água em vídeo no navegador. Nada é enviado.', 'Saída WebM.'),
    ('ru', 'Водяной знак на видео', 'Добавляйте текстовые или логотипные водяные знаки на видео.', 'Водяной знак на видео — Бесплатный онлайн-инструмент', 'Водяной знак на видео в браузере. Ничего не загружается.', 'Выход WebM.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'video-watermark'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Video Crop', 'Crop videos to free size or common aspect ratios.', 'Video Crop — Free Online Tool', 'Crop MP4/WebM videos in your browser. Nothing is uploaded.', 'Output is WebM (re-encoded).'),
    ('tr', 'Video Kırp', 'Videoları serbest veya hazır en-boy oranına kırpın.', 'Video Kırp — Ücretsiz Online Araç', 'MP4/WebM videoları tarayıcıda kırpın. Hiçbir şey yüklenmez.', 'Çıktı WebM (yeniden kodlanır).'),
    ('de', 'Video zuschneiden', 'Videos frei oder in gängigen Seitenverhältnissen zuschneiden.', 'Video zuschneiden — Kostenloses Online-Tool', 'Videos im Browser zuschneiden. Nichts wird hochgeladen.', 'Ausgabe ist WebM.'),
    ('fr', 'Recadrer une vidéo', 'Recadrez des vidéos en format libre ou courant.', 'Recadrer une vidéo — Outil en ligne gratuit', 'Recadrez des vidéos dans le navigateur. Rien n''est téléversé.', 'Sortie WebM.'),
    ('es', 'Recortar video', 'Recorta videos a tamaño libre o proporciones comunes.', 'Recortar video — Herramienta online gratis', 'Recorta videos en el navegador. Nada se sube.', 'Salida WebM.'),
    ('it', 'Ritaglia video', 'Ritaglia video a formato libero o proporzioni comuni.', 'Ritaglia video — Strumento online gratuito', 'Ritaglia video nel browser. Nulla viene caricato.', 'Output WebM.'),
    ('pt', 'Cortar vídeo', 'Corte vídeos em tamanho livre ou proporções comuns.', 'Cortar vídeo — Ferramenta online grátis', 'Corte vídeos no navegador. Nada é enviado.', 'Saída WebM.'),
    ('ru', 'Обрезка видео', 'Обрезайте видео свободно или по стандартным пропорциям.', 'Обрезка видео — Бесплатный онлайн-инструмент', 'Обрезка видео в браузере. Ничего не загружается.', 'Выход WebM.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'video-crop'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
