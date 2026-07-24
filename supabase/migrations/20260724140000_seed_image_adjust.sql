-- Publish image-adjust (brightness, contrast, saturation, hue, etc.)

insert into public.tools (slug, category, status, sort_order)
values
  ('image-adjust', 'image', 'published', 535)
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
    ('en', 'Image Color Adjust', 'Adjust brightness, contrast, saturation, hue, and more.', 'Image Color Adjust — Brightness & Contrast', 'Tune brightness, contrast, saturation, and hue in your browser. No uploads.', 'Runs entirely in your browser.'),
    ('tr', 'Görsel Renk Ayarları', 'Parlaklık, kontrast, doygunluk, ton ve daha fazlasını ayarlayın.', 'Görsel Renk Ayarları — Parlaklık ve Kontrast', 'Parlaklık, kontrast, doygunluk ve tonu tarayıcınızda ayarlayın. Yükleme yok.', 'Tamamen tarayıcınızda çalışır.'),
    ('de', 'Bildfarben anpassen', 'Helligkeit, Kontrast, Sättigung, Farbton und mehr einstellen.', 'Bildfarben anpassen — Helligkeit & Kontrast', 'Helligkeit, Kontrast, Sättigung und Farbton im Browser anpassen. Keine Uploads.', 'Läuft vollständig im Browser.'),
    ('fr', 'Réglages couleur d’image', 'Ajustez luminosité, contraste, saturation, teinte et plus.', 'Réglages couleur — Luminosité et contraste', 'Réglez luminosité, contraste, saturation et teinte dans le navigateur. Sans envoi.', 'Fonctionne entièrement dans le navigateur.'),
    ('es', 'Ajuste de color de imagen', 'Ajusta brillo, contraste, saturación, tono y más.', 'Ajuste de color — Brillo y contraste', 'Ajusta brillo, contraste, saturación y tono en el navegador. Sin subidas.', 'Se ejecuta por completo en el navegador.'),
    ('it', 'Regolazione colori immagine', 'Regola luminosità, contrasto, saturazione, tinta e altro.', 'Regolazione colori — Luminosità e contrasto', 'Regola luminosità, contrasto, saturazione e tinta nel browser. Nessun upload.', 'Funziona interamente nel browser.'),
    ('pt', 'Ajuste de cor da imagem', 'Ajuste brilho, contraste, saturação, matiz e mais.', 'Ajuste de cor — Brilho e contraste', 'Ajuste brilho, contraste, saturação e matiz no navegador. Sem envios.', 'Corre inteiramente no navegador.'),
    ('ru', 'Цветокоррекция изображения', 'Яркость, контраст, насыщенность, оттенок и другие настройки.', 'Цветокоррекция — яркость и контраст', 'Настройте яркость, контраст, насыщенность и оттенок в браузере. Без загрузки.', 'Работает полностью в браузере.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'image-adjust'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
