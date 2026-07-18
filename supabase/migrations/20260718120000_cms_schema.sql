-- CMS schema for Online Office Tools
-- Apply with: supabase db push  (or run in SQL Editor)

create extension if not exists "pgcrypto";

-- Helpers -------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Tables --------------------------------------------------------------------

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  cover_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tool_translations (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  locale text not null,
  title text not null,
  short_description text not null default '',
  seo_title text,
  seo_description text,
  content text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tool_id, locale)
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  alt_text text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_setting_translations (
  id uuid primary key default gen_random_uuid(),
  setting_id uuid not null references public.site_settings (id) on delete cascade,
  locale text not null,
  value text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (setting_id, locale)
);

create index if not exists tools_status_sort_idx on public.tools (status, sort_order);
create index if not exists tool_translations_locale_idx on public.tool_translations (locale);
create index if not exists media_created_at_idx on public.media (created_at desc);

drop trigger if exists tools_set_updated_at on public.tools;
create trigger tools_set_updated_at
  before update on public.tools
  for each row execute function public.set_updated_at();

drop trigger if exists tool_translations_set_updated_at on public.tool_translations;
create trigger tool_translations_set_updated_at
  before update on public.tool_translations
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists site_setting_translations_set_updated_at on public.site_setting_translations;
create trigger site_setting_translations_set_updated_at
  before update on public.site_setting_translations
  for each row execute function public.set_updated_at();

-- Storage -------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS -----------------------------------------------------------------------

alter table public.tools enable row level security;
alter table public.tool_translations enable row level security;
alter table public.media enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_setting_translations enable row level security;

-- tools
drop policy if exists "Anon can read published tools" on public.tools;
create policy "Anon can read published tools"
  on public.tools for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins manage tools" on public.tools;
create policy "Admins manage tools"
  on public.tools for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- tool_translations
drop policy if exists "Anon can read published tool translations" on public.tool_translations;
create policy "Anon can read published tool translations"
  on public.tool_translations for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tools t
      where t.id = tool_id and t.status = 'published'
    )
  );

drop policy if exists "Admins manage tool translations" on public.tool_translations;
create policy "Admins manage tool translations"
  on public.tool_translations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- media
drop policy if exists "Anyone can read media metadata" on public.media;
create policy "Anyone can read media metadata"
  on public.media for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage media metadata" on public.media;
create policy "Admins manage media metadata"
  on public.media for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- site_settings
drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can read site setting translations" on public.site_setting_translations;
create policy "Anyone can read site setting translations"
  on public.site_setting_translations for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage site setting translations" on public.site_setting_translations;
create policy "Admins manage site setting translations"
  on public.site_setting_translations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- storage.objects policies for cms-media
drop policy if exists "Public read cms-media" on storage.objects;
create policy "Public read cms-media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'cms-media');

drop policy if exists "Admins upload cms-media" on storage.objects;
create policy "Admins upload cms-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "Admins update cms-media" on storage.objects;
create policy "Admins update cms-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cms-media' and public.is_admin())
  with check (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "Admins delete cms-media" on storage.objects;
create policy "Admins delete cms-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cms-media' and public.is_admin());

-- Seed word-counter ---------------------------------------------------------

insert into public.tools (slug, category, status, sort_order)
values ('word-counter', 'text', 'published', 0)
on conflict (slug) do nothing;

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select
  t.id,
  'en',
  'Word Counter & Text Converter',
  'Count words, characters, lines, and sentences instantly. Convert case with one click.',
  'Word Counter & Text Converter — Free Online Tool',
  'Free browser-based word counter and text case converter. Count words, characters, lines, and sentences with no uploads.',
  'This tool runs entirely in your browser. Your text never leaves your device.'
from public.tools t
where t.slug = 'word-counter'
on conflict (tool_id, locale) do nothing;

insert into public.tool_translations (
  tool_id, locale, title, short_description, seo_title, seo_description, content
)
select
  t.id,
  'tr',
  'Kelime Sayacı & Metin Dönüştürücü',
  'Kelime, karakter, satır ve cümleleri anında sayın. Tek tıkla büyük/küçük harf dönüştürün.',
  'Kelime Sayacı & Metin Dönüştürücü — Ücretsiz Online Araç',
  'Ücretsiz tarayıcı tabanlı kelime sayacı ve metin dönüştürücü. Yükleme olmadan kelime, karakter, satır ve cümle sayın.',
  'Bu araç tamamen tarayıcınızda çalışır. Metniniz cihazınızdan çıkmaz.'
from public.tools t
where t.slug = 'word-counter'
on conflict (tool_id, locale) do nothing;

-- Grants (Data API)
grant usage on schema public to anon, authenticated;
grant select on public.tools, public.tool_translations, public.media, public.site_settings, public.site_setting_translations to anon, authenticated;
grant insert, update, delete on public.tools, public.tool_translations, public.media, public.site_settings, public.site_setting_translations to authenticated;
