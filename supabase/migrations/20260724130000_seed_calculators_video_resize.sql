-- Publish birthday-calculator, area-calculator, video-resize

insert into public.tools (slug, category, status, sort_order)
values
  ('birthday-calculator', 'calculator', 'published', 710),
  ('area-calculator', 'calculator', 'published', 720),
  ('video-resize', 'video', 'published', 640)
on conflict (slug) do update set
  category = excluded.category,
  status = 'published',
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

-- Also set audio-editor category now that audio is allowed (if constraint already updated)
update public.tools
set category = 'audio', updated_at = timezone('utc', now())
where slug = 'audio-editor' and (category is distinct from 'audio');

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    ('en', 'Birthday Calculator', 'Calculate age, next birthday countdown, and weekday of birth.', 'Birthday Calculator — Free Online Tool', 'Find your exact age and days until your next birthday in the browser.', 'Runs entirely in your browser.'),
    ('tr', 'Doğum Günü Hesaplayıcı', 'Yaş, sonraki doğum günü ve doğulan günü hesaplayın.', 'Doğum Günü Hesaplayıcı — Ücretsiz Online Araç', 'Tam yaşınızı ve sonraki doğum gününüze kalan günü tarayıcıda bulun.', 'Tamamen tarayıcınızda çalışır.'),
    ('de', 'Geburtstagsrechner', 'Alter, Countdown zum nächsten Geburtstag und Wochentag berechnen.', 'Geburtstagsrechner — Kostenloses Online-Tool', 'Genaues Alter und Tage bis zum nächsten Geburtstag im Browser.', 'Läuft vollständig im Browser.'),
    ('fr', 'Calculateur d’anniversaire', 'Calculez l’âge, le prochain anniversaire et le jour de naissance.', 'Calculateur d’anniversaire — Outil en ligne gratuit', 'Âge exact et jours avant le prochain anniversaire dans le navigateur.', 'Fonctionne entièrement dans le navigateur.'),
    ('es', 'Calculadora de cumpleaños', 'Calcula la edad, el próximo cumpleaños y el día de la semana.', 'Calculadora de cumpleaños — Herramienta online gratis', 'Edad exacta y días hasta el próximo cumpleaños en el navegador.', 'Se ejecuta por completo en el navegador.'),
    ('it', 'Calcolatore compleanno', 'Calcola età, prossimo compleanno e giorno della settimana.', 'Calcolatore compleanno — Strumento online gratuito', 'Età esatta e giorni al prossimo compleanno nel browser.', 'Funziona interamente nel browser.'),
    ('pt', 'Calculadora de aniversário', 'Calcule idade, próximo aniversário e dia da semana.', 'Calculadora de aniversário — Ferramenta online grátis', 'Idade exata e dias até o próximo aniversário no navegador.', 'Corre inteiramente no navegador.'),
    ('ru', 'Калькулятор дня рождения', 'Возраст, до следующего дня рождения и день недели рождения.', 'Калькулятор дня рождения — Бесплатный онлайн-инструмент', 'Точный возраст и дни до следующего дня рождения в браузере.', 'Работает полностью в браузере.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'birthday-calculator'
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
    ('en', 'Area Calculator', 'Draw land shapes, scale in metres, and read area and side lengths.', 'Land Area Calculator — Draw & Measure', 'Calculate field and parcel area with interactive shapes in your browser.', 'Runs entirely in your browser.'),
    ('tr', 'Alan Hesaplayıcı', 'Arazi şekilleri çizin, metre ölçeği verin; alan ve kenarları okuyun.', 'Arazi Alan Hesaplayıcı — Çiz ve Ölç', 'Tarlalar ve parseller için etkileşimli şekillerle alan hesaplayın.', 'Tamamen tarayıcınızda çalışır.'),
    ('de', 'Flächenrechner', 'Grundstücke zeichnen, in Metern skalieren, Fläche und Seiten lesen.', 'Flächenrechner für Grundstücke', 'Feld- und Grundstücksflächen interaktiv im Browser berechnen.', 'Läuft vollständig im Browser.'),
    ('fr', 'Calculateur de surface', 'Dessinez des parcelles, échelle en mètres, surface et côtés.', 'Calculateur de surface agricole', 'Calculez la surface de champs avec des formes interactives.', 'Fonctionne entièrement dans le navigateur.'),
    ('es', 'Calculadora de área', 'Dibuja parcelas, escala en metros y lee área y lados.', 'Calculadora de área de terreno', 'Calcula el área de campos con formas interactivas.', 'Se ejecuta por completo en el navegador.'),
    ('it', 'Calcolatore di area', 'Disegna appezzamenti, scala in metri, leggi area e lati.', 'Calcolatore area terreno', 'Calcola l’area di campi con forme interattive.', 'Funziona interamente nel browser.'),
    ('pt', 'Calculadora de área', 'Desenhe terrenos, escala em metros, leia área e lados.', 'Calculadora de área de terreno', 'Calcule a área de campos com formas interativas.', 'Corre inteiramente no navegador.'),
    ('ru', 'Калькулятор площади', 'Рисуйте участки, масштаб в метрах, площадь и стороны.', 'Калькулятор площади участка', 'Считайте площадь полей интерактивными фигурами в браузере.', 'Работает полностью в браузере.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'area-calculator'
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
    ('en', 'Video Resize for Social', 'Resize and crop video to Instagram, TikTok, YouTube Shorts and more.', 'Video Resize — Social Media Sizes', 'Crop and export videos to vertical, horizontal, or square social presets. WebM, in-browser.', 'Runs entirely in your browser. Output is WebM.'),
    ('tr', 'Sosyal Medya Video Ebatlandırıcı', 'Videoyu Instagram, TikTok, YouTube Shorts vb. ebatlara kırpın ve ölçekleyin.', 'Video Ebatlandırıcı — Sosyal Medya', 'Dikey, yatay veya kare sosyal preset’lere kırpın. WebM, tarayıcıda.', 'Tamamen tarayıcınızda çalışır. Çıktı WebM.'),
    ('de', 'Video-Größe für Social Media', 'Video für Instagram, TikTok, YouTube Shorts zuschneiden und skalieren.', 'Video-Größe — Social-Media-Formate', 'Videos vertikal, horizontal oder quadratisch zuschneiden. WebM im Browser.', 'Läuft vollständig im Browser. Ausgabe WebM.'),
    ('fr', 'Redimensionner une vidéo (réseaux)', 'Recadrez et redimensionnez pour Instagram, TikTok, Shorts…', 'Redimensionnement vidéo — Formats sociaux', 'Recadrez des vidéos aux formats sociaux. WebM dans le navigateur.', 'Fonctionne entièrement dans le navigateur. Sortie WebM.'),
    ('es', 'Redimensionar video (redes)', 'Recorta y redimensiona para Instagram, TikTok, Shorts…', 'Redimensionar video — Tamaños sociales', 'Recorta videos a formatos sociales. WebM en el navegador.', 'Se ejecuta por completo en el navegador. Salida WebM.'),
    ('it', 'Ridimensiona video (social)', 'Ritaglia e ridimensiona per Instagram, TikTok, Shorts…', 'Ridimensiona video — Formati social', 'Ritaglia video nei formati social. WebM nel browser.', 'Funziona interamente nel browser. Output WebM.'),
    ('pt', 'Redimensionar vídeo (redes)', 'Corte e redimensione para Instagram, TikTok, Shorts…', 'Redimensionar vídeo — Tamanhos sociais', 'Corte vídeos para formatos sociais. WebM no navegador.', 'Corre inteiramente no navegador. Saída WebM.'),
    ('ru', 'Изменение размера видео (соцсети)', 'Обрезка и размер под Instagram, TikTok, Shorts…', 'Размер видео — форматы соцсетей', 'Обрезка видео под форматы соцсетей. WebM в браузере.', 'Работает полностью в браузере. Выход WebM.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'video-resize'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
