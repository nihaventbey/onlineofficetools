-- Seed 6 additional published tools + en/tr translations
-- Idempotent: safe to re-run

insert into public.tools (slug, category, status, sort_order) values
  ('case-converter', 'text', 'published', 1),
  ('lorem-ipsum', 'text', 'published', 2),
  ('text-diff', 'text', 'published', 3),
  ('json-formatter', 'developer', 'published', 4),
  ('base64', 'developer', 'published', 5),
  ('password-generator', 'security', 'published', 6)
on conflict (slug) do update
set category = excluded.category,
    status = 'published',
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());

-- Ensure word-counter category/order stay correct
update public.tools
set category = 'text', status = 'published', sort_order = 0
where slug = 'word-counter';

-- Helper: upsert translation
-- case-converter
insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    (
      'en',
      'Case Converter',
      'Convert text between upper, lower, title, camel, snake, and kebab case.',
      'Case Converter — Free Online Tool',
      'Convert text case formats instantly in your browser.',
      'Runs entirely in your browser. Nothing is uploaded.'
    ),
    (
      'tr',
      'Harf Dönüştürücü',
      'Metni büyük, küçük, başlık, camel, snake ve kebab biçimlerine dönüştürün.',
      'Harf Dönüştürücü — Ücretsiz Online Araç',
      'Metin biçimlerini tarayıcınızda anında dönüştürün.',
      'Tamamen tarayıcınızda çalışır. Hiçbir şey yüklenmez.'
    )
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'case-converter'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());

-- lorem-ipsum
insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    (
      'en',
      'Lorem Ipsum Generator',
      'Generate placeholder paragraphs for designs and drafts.',
      'Lorem Ipsum Generator — Free Online Tool',
      'Generate lorem ipsum placeholder text instantly in your browser.',
      'Runs entirely in your browser. Nothing is uploaded.'
    ),
    (
      'tr',
      'Lorem Ipsum Üretici',
      'Tasarım ve taslaklar için yer tutucu paragraflar üretin.',
      'Lorem Ipsum Üretici — Ücretsiz Online Araç',
      'Lorem ipsum yer tutucu metni tarayıcınızda anında üretin.',
      'Tamamen tarayıcınızda çalışır. Hiçbir şey yüklenmez.'
    )
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'lorem-ipsum'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());

-- text-diff
insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    (
      'en',
      'Text Diff Checker',
      'Compare two texts and highlight differences.',
      'Text Diff Checker — Free Online Tool',
      'Compare two blocks of text and see differences instantly. Runs in your browser.',
      'Runs entirely in your browser. Nothing is uploaded.'
    ),
    (
      'tr',
      'Metin Karşılaştırıcı',
      'İki metni karşılaştırın ve farkları görün.',
      'Metin Karşılaştırıcı — Ücretsiz Online Araç',
      'İki metin bloğunu karşılaştırın. Tarayıcınızda çalışır.',
      'Tamamen tarayıcınızda çalışır. Hiçbir şey yüklenmez.'
    )
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'text-diff'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());

-- json-formatter
insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    (
      'en',
      'JSON Formatter',
      'Pretty-print, minify, and validate JSON in your browser.',
      'JSON Formatter & Validator — Free Online Tool',
      'Format, minify, and validate JSON instantly in your browser. No uploads.',
      'Runs entirely in your browser. Nothing is uploaded.'
    ),
    (
      'tr',
      'JSON Biçimlendirici',
      'JSON’u tarayıcınızda güzelleştirin, küçültün ve doğrulayın.',
      'JSON Biçimlendirici & Doğrulayıcı — Ücretsiz Online Araç',
      'JSON’u anında biçimlendirin, küçültün ve doğrulayın. Yükleme yok.',
      'Tamamen tarayıcınızda çalışır. Hiçbir şey yüklenmez.'
    )
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'json-formatter'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());

-- base64
insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    (
      'en',
      'Base64 Encode / Decode',
      'Encode or decode Base64 text locally.',
      'Base64 Encoder Decoder — Free Online Tool',
      'Encode and decode Base64 strings in your browser. No uploads.',
      'Runs entirely in your browser. Nothing is uploaded.'
    ),
    (
      'tr',
      'Base64 Kodla / Çöz',
      'Base64 metni yerelde kodlayın veya çözün.',
      'Base64 Kodlayıcı Çözücü — Ücretsiz Online Araç',
      'Base64 dizilerini tarayıcınızda kodlayın ve çözün. Yükleme yok.',
      'Tamamen tarayıcınızda çalışır. Hiçbir şey yüklenmez.'
    )
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'base64'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());

-- password-generator
insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select t.id, v.locale, v.title, v.short_description, v.seo_title, v.seo_description, v.content
from public.tools t
cross join (
  values
    (
      'en',
      'Password Generator',
      'Generate strong passwords with Web Crypto in your browser.',
      'Password Generator — Free Online Tool',
      'Create strong random passwords locally in your browser. Nothing is uploaded.',
      'Generated passwords never leave your device.'
    ),
    (
      'tr',
      'Şifre Üretici',
      'Web Crypto ile tarayıcınızda güçlü şifreler üretin.',
      'Şifre Üretici — Ücretsiz Online Araç',
      'Güçlü rastgele şifreleri tarayıcınızda üretin. Hiçbir şey yüklenmez.',
      'Üretilen şifreler cihazınızdan çıkmaz.'
    )
) as v(locale, title, short_description, seo_title, seo_description, content)
where t.slug = 'password-generator'
on conflict (tool_id, locale) do update
set title = excluded.title,
    short_description = excluded.short_description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    content = excluded.content,
    updated_at = timezone('utc', now());
