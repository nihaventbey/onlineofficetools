-- Seed watermark tool (images + PDFs) with all locales (idempotent)

insert into public.tools (slug, category, status, sort_order)
values ('watermark', 'image', 'published', 565)
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
    ('en', 'Watermark', 'Add text or image watermarks to photos and PDFs.', 'Watermark Images & PDFs — Free Online Tool', 'Add text or logo watermarks to images and PDFs in your browser. Nothing is uploaded.', 'Runs entirely in your browser.'),
    ('tr', 'Filigran (Watermark)', 'Görsellere ve PDF''lere metin veya logo filigranı ekleyin.', 'Filigran — Görsel ve PDF Watermark Aracı', 'Tarayıcınızda görsellere ve PDF''lere metin veya logo filigranı ekleyin. Hiçbir şey yüklenmez.', 'Tamamen tarayıcınızda çalışır.'),
    ('de', 'Wasserzeichen', 'Text- oder Bildwasserzeichen auf Fotos und PDFs hinzufügen.', 'Wasserzeichen für Bilder & PDFs — Kostenloses Online-Tool', 'Fügen Sie Text- oder Logo-Wasserzeichen in Ihrem Browser hinzu. Nichts wird hochgeladen.', 'Läuft vollständig in Ihrem Browser.'),
    ('fr', 'Filigrane', 'Ajoutez un filigrane texte ou image aux photos et PDF.', 'Filigrane Images & PDF — Outil en ligne gratuit', 'Ajoutez un filigrane texte ou logo dans votre navigateur. Rien n''est téléversé.', 'Fonctionne entièrement dans votre navigateur.'),
    ('es', 'Marca de agua', 'Añade marcas de agua de texto o imagen a fotos y PDF.', 'Marca de agua para imágenes y PDF — Herramienta online gratis', 'Añade marcas de agua de texto o logo en tu navegador. Nada se sube.', 'Funciona por completo en tu navegador.'),
    ('it', 'Filigrana', 'Aggiungi filigrane di testo o immagine a foto e PDF.', 'Filigrana per immagini e PDF — Strumento online gratuito', 'Aggiungi filigrane di testo o logo nel browser. Nulla viene caricato.', 'Funziona interamente nel tuo browser.'),
    ('pt', 'Marca d''água', 'Adicione marcas d''água de texto ou imagem a fotos e PDFs.', 'Marca d''água para imagens e PDFs — Ferramenta online grátis', 'Adicione marcas d''água de texto ou logo no navegador. Nada é enviado.', 'Funciona inteiramente no seu navegador.'),
    ('ru', 'Водяной знак', 'Добавляйте текстовые или графические водяные знаки на фото и PDF.', 'Водяной знак для изображений и PDF — Бесплатный онлайн-инструмент', 'Добавляйте водяные знаки в браузере. Ничего не загружается на сервер.', 'Работает полностью в вашем браузере.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'watermark'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
