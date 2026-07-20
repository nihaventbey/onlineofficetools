-- Consolidate EBYS tools into belgenet-hazirlik (idempotent)
-- Apply via: supabase db push / Dashboard SQL Editor

insert into public.tools (slug, category, status, sort_order)
values ('belgenet-hazirlik', 'ebys', 'published', 795)
on conflict (slug) do update set
  category = excluded.category,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

update public.tools
set status = 'draft', updated_at = timezone('utc', now())
where slug in ('arz-rica', 'sdp-arama', 'detsis', 'belgenet-html');

insert into public.tool_translations (tool_id, locale, title, short_description)
select t.id, v.locale, v.title, v.descr
from public.tools t
join (
  values
    ('belgenet-hazirlik', 'tr', 'Belgenet hazırlık', 'Kurum, arz/rica, SSDP ve Belgenet HTML — tek iş akışı.'),
    ('belgenet-hazirlik', 'en', 'Belgenet prep', 'Institutions, arz/rica, SSDP and Belgenet HTML in one workflow.')
) as v(slug, locale, title, descr) on t.slug = v.slug
on conflict (tool_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  updated_at = timezone('utc', now());
