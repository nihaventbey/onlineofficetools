-- Seed EBYS / Belgenet hazırlık tools (idempotent)
-- Apply via: supabase db push / Dashboard SQL Editor
-- Do not run migrate from the agent — user applies this.

-- Allow ebys category on tools.category
alter table public.tools drop constraint if exists tools_category_check;
alter table public.tools
  add constraint tools_category_check
  check (
    category is null
    or category in (
      'text', 'documents', 'spreadsheets', 'presentations',
      'pdf', 'image', 'archive', 'video', 'ebys',
      'developer', 'security', 'calculator'
    )
  );

insert into public.tools (slug, category, status, sort_order)
values
  ('arz-rica', 'ebys', 'published', 800),
  ('sdp-arama', 'ebys', 'published', 810),
  ('detsis', 'ebys', 'published', 820),
  ('belgenet-html', 'ebys', 'published', 830)
on conflict (slug) do update set
  category = excluded.category,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.tool_translations (tool_id, locale, title, short_description)
select t.id, 'tr', v.title, v.descr
from public.tools t
join (
  values
    ('arz-rica', 'Arz / Rica', 'Muhatap hiyerarşisine göre resmi yazı kapanış cümlesi önerir.'),
    ('sdp-arama', 'SDP Arama', 'Saklama Süreli Standart Dosya Planı kodlarını arayın ve kopyalayın.'),
    ('detsis', 'DETSİS', 'Kurum DETSİS numarasını doğrulayın ve anlık görüntüde arayın.'),
    ('belgenet-html', 'Belgenet HTML', 'Belgenet''e yapıştırılacak dar HTML üretin; sayfa sığdırma tahmini alın.')
) as v(slug, title, descr) on t.slug = v.slug
on conflict (tool_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  updated_at = timezone('utc', now());

-- Optional EN stubs (pages are TR-only; CMS may still list for admins)
insert into public.tool_translations (tool_id, locale, title, short_description)
select t.id, 'en', v.title, v.descr
from public.tools t
join (
  values
    ('arz-rica', 'Arz / Rica', 'Suggest official Turkish closing phrases by audience hierarchy.'),
    ('sdp-arama', 'SDP Search', 'Search Turkish Standard File Plan (SSDP) codes.'),
    ('detsis', 'DETSIS', 'Validate 8-digit DETSIS IDs and search a local snapshot.'),
    ('belgenet-html', 'Belgenet HTML', 'Build paste-friendly HTML for Belgenet with page-fit estimate.')
) as v(slug, title, descr) on t.slug = v.slug
on conflict (tool_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  updated_at = timezone('utc', now());
