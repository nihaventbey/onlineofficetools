-- Dual watermark tools (image + pdf categories) with shared UI (idempotent)

insert into public.tools (slug, category, status, sort_order)
values
  ('watermark', 'image', 'published', 565),
  ('pdf-watermark', 'pdf', 'published', 410)
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
    ('en', 'Watermark', 'Add text or logo watermarks to images and PDFs — one file or a batch.', 'Watermark Images & PDFs — Free Online Tool', 'Watermark multiple images and PDFs in your browser. Nothing is uploaded.', 'Runs entirely in your browser.'),
    ('tr', 'Filigran (Watermark)', 'Görsellere ve PDF''lere metin veya logo filigranı ekleyin — tek dosya veya toplu.', 'Filigran — Görsel ve PDF Watermark Aracı', 'Tarayıcınızda birden fazla görsel ve PDF''e filigran ekleyin. Hiçbir şey yüklenmez.', 'Tamamen tarayıcınızda çalışır.'),
    ('de', 'Wasserzeichen', 'Text- oder Logo-Wasserzeichen auf Bilder und PDFs — einzeln oder als Stapel.', 'Wasserzeichen für Bilder & PDFs — Kostenloses Online-Tool', 'Wasserzeichen für mehrere Bilder und PDFs im Browser. Nichts wird hochgeladen.', 'Läuft vollständig in Ihrem Browser.'),
    ('fr', 'Filigrane', 'Ajoutez un filigrane texte ou logo aux images et PDF — un fichier ou un lot.', 'Filigrane Images & PDF — Outil en ligne gratuit', 'Filigrane pour plusieurs images et PDF dans le navigateur. Rien n''est téléversé.', 'Fonctionne entièrement dans votre navigateur.'),
    ('es', 'Marca de agua', 'Añade marcas de agua de texto o logo a imágenes y PDF — uno o varios archivos.', 'Marca de agua para imágenes y PDF — Herramienta online gratis', 'Marca de agua para varias imágenes y PDF en el navegador. Nada se sube.', 'Funciona por completo en tu navegador.'),
    ('it', 'Filigrana', 'Aggiungi filigrane di testo o logo a immagini e PDF — uno o più file.', 'Filigrana per immagini e PDF — Strumento online gratuito', 'Filigrana per più immagini e PDF nel browser. Nulla viene caricato.', 'Funziona interamente nel tuo browser.'),
    ('pt', 'Marca d''água', 'Adicione marcas d''água de texto ou logo a imagens e PDFs — um ou vários arquivos.', 'Marca d''água para imagens e PDFs — Ferramenta online grátis', 'Marca d''água para várias imagens e PDFs no navegador. Nada é enviado.', 'Funciona inteiramente no seu navegador.'),
    ('ru', 'Водяной знак', 'Добавляйте текстовые или логотипные водяные знаки на изображения и PDF — один файл или пакет.', 'Водяной знак для изображений и PDF — Бесплатный онлайн-инструмент', 'Водяной знак для нескольких изображений и PDF в браузере. Ничего не загружается.', 'Работает полностью в вашем браузере.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'watermark'
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
    ('en', 'PDF Watermark', 'Add text or logo watermarks to PDFs and images — one file or a batch.', 'PDF Watermark — Free Online Tool', 'Watermark PDFs and images in your browser. Batch support. Nothing is uploaded.', 'Runs entirely in your browser.'),
    ('tr', 'PDF Filigran', 'PDF ve görsellere metin veya logo filigranı ekleyin — tek dosya veya toplu.', 'PDF Filigran — Ücretsiz Online Araç', 'Tarayıcınızda PDF ve görsellere filigran ekleyin. Toplu işlem. Hiçbir şey yüklenmez.', 'Tamamen tarayıcınızda çalışır.'),
    ('de', 'PDF-Wasserzeichen', 'Text- oder Logo-Wasserzeichen auf PDFs und Bilder — einzeln oder als Stapel.', 'PDF-Wasserzeichen — Kostenloses Online-Tool', 'Wasserzeichen für PDFs und Bilder im Browser. Stapelverarbeitung. Nichts wird hochgeladen.', 'Läuft vollständig in Ihrem Browser.'),
    ('fr', 'Filigrane PDF', 'Ajoutez un filigrane texte ou logo aux PDF et images — un fichier ou un lot.', 'Filigrane PDF — Outil en ligne gratuit', 'Filigrane pour PDF et images dans le navigateur. Traitement par lot. Rien n''est téléversé.', 'Fonctionne entièrement dans votre navigateur.'),
    ('es', 'Marca de agua PDF', 'Añade marcas de agua de texto o logo a PDF e imágenes — uno o varios archivos.', 'Marca de agua PDF — Herramienta online gratis', 'Marca de agua para PDF e imágenes en el navegador. Lotes. Nada se sube.', 'Funciona por completo en tu navegador.'),
    ('it', 'Filigrana PDF', 'Aggiungi filigrane di testo o logo a PDF e immagini — uno o più file.', 'Filigrana PDF — Strumento online gratuito', 'Filigrana per PDF e immagini nel browser. Elaborazione batch. Nulla viene caricato.', 'Funziona interamente nel tuo browser.'),
    ('pt', 'Marca d''água PDF', 'Adicione marcas d''água de texto ou logo a PDFs e imagens — um ou vários arquivos.', 'Marca d''água PDF — Ferramenta online grátis', 'Marca d''água para PDFs e imagens no navegador. Lote. Nada é enviado.', 'Funciona inteiramente no seu navegador.'),
    ('ru', 'Водяной знак PDF', 'Добавляйте текстовые или логотипные водяные знаки на PDF и изображения — один файл или пакет.', 'Водяной знак PDF — Бесплатный онлайн-инструмент', 'Водяной знак для PDF и изображений в браузере. Пакетная обработка. Ничего не загружается.', 'Работает полностью в вашем браузере.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'pdf-watermark'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
