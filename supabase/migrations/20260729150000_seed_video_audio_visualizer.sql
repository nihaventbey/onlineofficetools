-- Publish video-audio-visualizer

insert into public.tools (slug, category, status, sort_order)
values
  ('video-audio-visualizer', 'video', 'published', 645)
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
    ('en', 'Audio Spectrum Visualizer', 'Create colorful audio visualizers with transparent background for video editors.', 'Audio Visualizer for Video — Transparent WebM', 'Generate spectrum and waveform visualizers locally. Export transparent WebM for video editors.', 'Runs entirely in your browser. Output is WebM.'),
    ('tr', 'Ses Spektrum Görselleştirici', 'Video editörler için şeffaf arka planlı renkli ses görselleştirici oluşturun.', 'Video Ses Görselleştirici — Şeffaf WebM', 'Spektrum ve dalga formu görselleştiricilerini yerelde oluşturun. Editörler için şeffaf WebM.', 'Tamamen tarayıcınızda çalışır. Çıktı WebM.'),
    ('de', 'Audio-Spektrum-Visualizer', 'Farbige Audio-Visualizer mit transparentem Hintergrund für Video-Editoren.', 'Audio-Visualizer für Video — Transparentes WebM', 'Spektrum- und Wellenform-Visualizer im Browser erzeugen. Transparentes WebM für Editoren.', 'Läuft vollständig im Browser. Ausgabe WebM.'),
    ('fr', 'Visualiseur audio (spectre)', 'Créez des visualiseurs audio colorés avec fond transparent pour les monteurs.', 'Visualiseur audio vidéo — WebM transparent', 'Générez spectre et forme d’onde localement. WebM transparent pour les monteurs.', 'Fonctionne entièrement dans le navigateur. Sortie WebM.'),
    ('es', 'Visualizador de espectro de audio', 'Crea visualizadores de audio con fondo transparente para editores de video.', 'Visualizador de audio para video — WebM transparente', 'Genera espectro y forma de onda localmente. WebM transparente para editores.', 'Se ejecuta por completo en el navegador. Salida WebM.'),
    ('it', 'Visualizzatore spettro audio', 'Crea visualizzatori audio colorati con sfondo trasparente per editor video.', 'Visualizzatore audio video — WebM trasparente', 'Genera spettro e forma d’onda localmente. WebM trasparente per editor.', 'Funziona interamente nel browser. Output WebM.'),
    ('pt', 'Visualizador de espectro de áudio', 'Crie visualizadores de áudio com fundo transparente para editores de vídeo.', 'Visualizador de áudio para vídeo — WebM transparente', 'Gere espectro e forma de onda localmente. WebM transparente para editores.', 'Corre inteiramente no navegador. Saída WebM.'),
    ('ru', 'Аудио-визуализатор (спектр)', 'Цветные визуализаторы с прозрачным фоном для видеоредакторов.', 'Аудио-визуализатор для видео — прозрачный WebM', 'Создавайте спектр и волну локально. Прозрачный WebM для монтажа.', 'Работает полностью в браузере. Выход WebM.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'video-audio-visualizer'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
