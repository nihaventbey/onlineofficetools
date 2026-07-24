-- Add audio category + publish audio-editor (waveform, trim, convert)

alter table public.tools drop constraint if exists tools_category_check;
alter table public.tools
  add constraint tools_category_check
  check (
    category is null
    or category in (
      'text', 'documents', 'spreadsheets', 'presentations',
      'pdf', 'image', 'archive', 'video', 'audio', 'ebys',
      'developer', 'security', 'calculator'
    )
  );

insert into public.tools (slug, category, status, sort_order)
values
  ('audio-editor', 'audio', 'published', 700)
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
    ('en', 'Audio Editor', 'View waveform, trim audio, and convert to WAV or WebM.', 'Audio Editor — Trim & Convert Online', 'Free browser audio editor with waveform, trim, and WAV/WebM convert. No uploads.', 'Runs entirely in your browser. Nothing is uploaded.'),
    ('tr', 'Ses Editörü', 'Ses dalgasını görün, kırpın ve WAV veya WebM’e dönüştürün.', 'Ses Editörü — Kırp ve Dönüştür', 'Tarayıcıda dalga formu, ses kırpma ve WAV/WebM dönüştürme. Yükleme yok.', 'Tamamen tarayıcınızda çalışır. Hiçbir şey yüklenmez.'),
    ('de', 'Audio-Editor', 'Wellenform anzeigen, schneiden und nach WAV oder WebM konvertieren.', 'Audio-Editor — Schneiden & Konvertieren', 'Kostenloser Audio-Editor mit Wellenform, Trim und WAV/WebM. Keine Uploads.', 'Läuft vollständig im Browser. Nichts wird hochgeladen.'),
    ('fr', 'Éditeur audio', 'Affichez la forme d’onde, découpez et convertissez en WAV ou WebM.', 'Éditeur audio — Découper et convertir', 'Éditeur audio gratuit avec forme d’onde, découpe et conversion WAV/WebM. Aucun envoi.', 'Fonctionne entièrement dans le navigateur. Rien n’est téléversé.'),
    ('es', 'Editor de audio', 'Muestra la forma de onda, recorta y convierte a WAV o WebM.', 'Editor de audio — Recortar y convertir', 'Editor de audio gratis con forma de onda, recorte y conversión WAV/WebM. Sin subidas.', 'Se ejecuta por completo en el navegador. Nada se sube.'),
    ('it', 'Editor audio', 'Visualizza la forma d’onda, taglia e converti in WAV o WebM.', 'Editor audio — Taglia e converti', 'Editor audio gratuito con forma d’onda, trim e conversione WAV/WebM. Nessun upload.', 'Funziona interamente nel browser. Nulla viene caricato.'),
    ('pt', 'Editor de áudio', 'Veja a forma de onda, corte e converta para WAV ou WebM.', 'Editor de áudio — Cortar e converter', 'Editor de áudio gratuito com forma de onda, corte e conversão WAV/WebM. Sem uploads.', 'Corre inteiramente no navegador. Nada é enviado.'),
    ('ru', 'Аудиоредактор', 'Покажите волну, обрежьте фрагмент и конвертируйте в WAV или WebM.', 'Аудиоредактор — обрезка и конвертация', 'Бесплатный аудиоредактор с волной, обрезкой и конвертацией WAV/WebM. Без загрузок.', 'Работает полностью в браузере. Ничего не загружается.')
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'audio-editor'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
