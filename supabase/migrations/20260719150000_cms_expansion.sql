-- CMS expansion for Online Office Tools
-- Builds on 20260718120000_cms_schema.sql.
-- Apply with: supabase db push  (or run in SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / DROP ... IF EXISTS / CREATE OR REPLACE throughout.

create extension if not exists "pgcrypto";

-- 1. Harden is_admin() ---------------------------------------------------------
-- Pin search_path so the function cannot be tricked by a session-level
-- search_path change, and make the grant surface explicit.

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- 2. Richer tool translations ---------------------------------------------------

alter table public.tool_translations
  add column if not exists faqs jsonb not null default '[]'::jsonb,
  add column if not exists howto_steps jsonb not null default '[]'::jsonb,
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

-- 3. Data integrity constraints -------------------------------------------------
-- Dropped and re-added each run so the migration stays idempotent while still
-- letting the constraint definition evolve.

alter table public.tool_translations drop constraint if exists tool_translations_locale_check;
alter table public.tool_translations
  add constraint tool_translations_locale_check
  check (locale in ('en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'ru'));

alter table public.tools drop constraint if exists tools_category_check;
alter table public.tools
  add constraint tools_category_check
  check (
    category is null
    or category in (
      'text', 'documents', 'spreadsheets', 'presentations',
      'pdf', 'image', 'developer', 'security', 'calculator'
    )
  );

alter table public.tools drop constraint if exists tools_slug_format_check;
alter table public.tools
  add constraint tools_slug_format_check
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- 4. CMS history, audit trail, and feedback tables ------------------------------

create table if not exists public.tool_revisions (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  snapshot jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cms_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete', 'restore')),
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- One row per tool per calendar day of votes; the RPC below increments it.
create table if not exists public.tool_feedback_stats (
  tool_slug text primary key references public.tools (slug) on delete cascade on update cascade,
  yes_count integer not null default 0,
  no_count integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

-- Individual vote log. client_hash is a caller-supplied, non-PII hash (e.g. a
-- hashed cookie or IP+UA digest) used only for per-day rate limiting.
create table if not exists public.tool_feedback_events (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null references public.tools (slug) on delete cascade on update cascade,
  vote text not null check (vote in ('yes', 'no')),
  client_hash text not null,
  vote_date date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tool_revisions_tool_id_idx on public.tool_revisions (tool_id, created_at desc);
create index if not exists cms_audit_events_entity_idx on public.cms_audit_events (entity_type, entity_id, created_at desc);
create index if not exists tool_feedback_events_slug_idx on public.tool_feedback_events (tool_slug, created_at desc);

-- Rate limit: one vote per tool per client per day.
create unique index if not exists tool_feedback_events_rate_limit_idx
  on public.tool_feedback_events (tool_slug, client_hash, vote_date);

drop trigger if exists tool_feedback_stats_set_updated_at on public.tool_feedback_stats;
create trigger tool_feedback_stats_set_updated_at
  before update on public.tool_feedback_stats
  for each row execute function public.set_updated_at();

alter table public.tool_revisions enable row level security;
alter table public.cms_audit_events enable row level security;
alter table public.tool_feedback_stats enable row level security;
alter table public.tool_feedback_events enable row level security;

-- Direct table access is admin-read-only; all writes happen through the
-- SECURITY DEFINER RPCs below (owned by a role that bypasses RLS).
drop policy if exists "Admins read tool revisions" on public.tool_revisions;
create policy "Admins read tool revisions"
  on public.tool_revisions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins read audit events" on public.cms_audit_events;
create policy "Admins read audit events"
  on public.cms_audit_events for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Anyone can read feedback stats" on public.tool_feedback_stats;
create policy "Anyone can read feedback stats"
  on public.tool_feedback_stats for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage feedback stats" on public.tool_feedback_stats;
create policy "Admins manage feedback stats"
  on public.tool_feedback_stats for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins read feedback events" on public.tool_feedback_events;
create policy "Admins read feedback events"
  on public.tool_feedback_events for select
  to authenticated
  using (public.is_admin());

grant select on public.tool_revisions, public.cms_audit_events, public.tool_feedback_events to authenticated;
grant select on public.tool_feedback_stats to anon, authenticated;
grant insert, update, delete on public.tool_feedback_stats to authenticated;

-- 5. admin_upsert_tool(payload jsonb) -------------------------------------------
-- Expected payload shape:
-- {
--   "id": "<uuid, omit/null to create a new tool>",
--   "slug": "word-counter",
--   "category": "text",
--   "status": "draft" | "published",
--   "cover_path": "covers/word-counter.png",
--   "sort_order": 0,
--   "translations": [
--     {
--       "locale": "en",
--       "title": "...",
--       "short_description": "...",
--       "seo_title": "...",
--       "seo_description": "...",
--       "content": "...",
--       "faqs": [{"q": "...", "a": "..."}],
--       "howto_steps": ["...", "..."],
--       "content_blocks": [{"type": "paragraph", "text": "..."}]
--     }
--   ]
-- }
-- Writes a tool_revisions snapshot and a cms_audit_events entry, then returns
-- the tool id. Table-level check constraints (locale/category/slug) provide
-- the authoritative validation.

create or replace function public.admin_upsert_tool(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tool_id uuid;
  v_slug text;
  v_category text;
  v_status text;
  v_cover_path text;
  v_sort_order integer;
  v_is_update boolean;
  v_before jsonb;
  v_after jsonb;
  v_translation jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can upsert tools' using errcode = '42501';
  end if;

  v_slug := btrim(coalesce(payload->>'slug', ''));
  v_category := payload->>'category';
  v_status := coalesce(payload->>'status', 'draft');
  v_cover_path := payload->>'cover_path';
  v_sort_order := coalesce((payload->>'sort_order')::integer, 0);

  if v_slug = '' then
    raise exception 'slug is required';
  end if;

  if v_status not in ('draft', 'published') then
    raise exception 'invalid status: %', v_status;
  end if;

  v_tool_id := nullif(payload->>'id', '')::uuid;
  v_is_update := v_tool_id is not null and exists (select 1 from public.tools where id = v_tool_id);

  if v_is_update then
    select jsonb_build_object(
      'tool', to_jsonb(t.*),
      'translations', coalesce((
        select jsonb_agg(to_jsonb(tt.*) order by tt.locale)
        from public.tool_translations tt
        where tt.tool_id = t.id
      ), '[]'::jsonb)
    )
    into v_before
    from public.tools t
    where t.id = v_tool_id;

    update public.tools set
      slug = v_slug,
      category = v_category,
      status = v_status,
      cover_path = v_cover_path,
      sort_order = v_sort_order
    where id = v_tool_id;
  else
    v_before := null;

    insert into public.tools (slug, category, status, cover_path, sort_order)
    values (v_slug, v_category, v_status, v_cover_path, v_sort_order)
    on conflict (slug) do update set
      category = excluded.category,
      status = excluded.status,
      cover_path = excluded.cover_path,
      sort_order = excluded.sort_order
    returning id into v_tool_id;
  end if;

  for v_translation in
    select * from jsonb_array_elements(coalesce(payload->'translations', '[]'::jsonb))
  loop
    if coalesce(v_translation->>'locale', '') = '' or coalesce(v_translation->>'title', '') = '' then
      continue;
    end if;

    insert into public.tool_translations (
      tool_id, locale, title, short_description, seo_title, seo_description,
      content, faqs, howto_steps, content_blocks
    )
    values (
      v_tool_id,
      v_translation->>'locale',
      v_translation->>'title',
      coalesce(v_translation->>'short_description', ''),
      v_translation->>'seo_title',
      v_translation->>'seo_description',
      v_translation->>'content',
      coalesce(v_translation->'faqs', '[]'::jsonb),
      coalesce(v_translation->'howto_steps', '[]'::jsonb),
      coalesce(v_translation->'content_blocks', '[]'::jsonb)
    )
    on conflict (tool_id, locale) do update set
      title = excluded.title,
      short_description = excluded.short_description,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      content = excluded.content,
      faqs = excluded.faqs,
      howto_steps = excluded.howto_steps,
      content_blocks = excluded.content_blocks;
  end loop;

  select jsonb_build_object(
    'tool', to_jsonb(t.*),
    'translations', coalesce((
      select jsonb_agg(to_jsonb(tt.*) order by tt.locale)
      from public.tool_translations tt
      where tt.tool_id = t.id
    ), '[]'::jsonb)
  )
  into v_after
  from public.tools t
  where t.id = v_tool_id;

  insert into public.tool_revisions (tool_id, actor_id, snapshot)
  values (v_tool_id, auth.uid(), v_after);

  insert into public.cms_audit_events (actor_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    case when v_is_update then 'update' else 'create' end,
    'tool',
    v_tool_id::text,
    v_before,
    v_after
  );

  return v_tool_id;
end;
$$;

revoke all on function public.admin_upsert_tool(jsonb) from public;
grant execute on function public.admin_upsert_tool(jsonb) to authenticated;

-- 6. admin_restore_tool_revision(revision_id uuid) ------------------------------
-- Replaces the tool row + all of its translations with a past snapshot, then
-- records the restore as a brand-new revision/audit entry (never destroys
-- history).

create or replace function public.admin_restore_tool_revision(revision_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revision record;
  v_tool_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_translation jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can restore tool revisions' using errcode = '42501';
  end if;

  select * into v_revision from public.tool_revisions where id = revision_id;
  if v_revision is null then
    raise exception 'Revision not found: %', revision_id;
  end if;

  v_tool_id := v_revision.tool_id;

  select jsonb_build_object(
    'tool', to_jsonb(t.*),
    'translations', coalesce((
      select jsonb_agg(to_jsonb(tt.*) order by tt.locale)
      from public.tool_translations tt
      where tt.tool_id = t.id
    ), '[]'::jsonb)
  )
  into v_before
  from public.tools t
  where t.id = v_tool_id;

  if v_before is null then
    raise exception 'Tool for revision % no longer exists', revision_id;
  end if;

  update public.tools set
    slug = coalesce(v_revision.snapshot->'tool'->>'slug', slug),
    category = v_revision.snapshot->'tool'->>'category',
    status = coalesce(v_revision.snapshot->'tool'->>'status', status),
    cover_path = v_revision.snapshot->'tool'->>'cover_path',
    sort_order = coalesce((v_revision.snapshot->'tool'->>'sort_order')::integer, sort_order)
  where id = v_tool_id;

  delete from public.tool_translations where tool_id = v_tool_id;

  for v_translation in
    select * from jsonb_array_elements(coalesce(v_revision.snapshot->'translations', '[]'::jsonb))
  loop
    insert into public.tool_translations (
      tool_id, locale, title, short_description, seo_title, seo_description,
      content, faqs, howto_steps, content_blocks
    )
    values (
      v_tool_id,
      v_translation->>'locale',
      v_translation->>'title',
      coalesce(v_translation->>'short_description', ''),
      v_translation->>'seo_title',
      v_translation->>'seo_description',
      v_translation->>'content',
      coalesce(v_translation->'faqs', '[]'::jsonb),
      coalesce(v_translation->'howto_steps', '[]'::jsonb),
      coalesce(v_translation->'content_blocks', '[]'::jsonb)
    );
  end loop;

  select jsonb_build_object(
    'tool', to_jsonb(t.*),
    'translations', coalesce((
      select jsonb_agg(to_jsonb(tt.*) order by tt.locale)
      from public.tool_translations tt
      where tt.tool_id = t.id
    ), '[]'::jsonb)
  )
  into v_after
  from public.tools t
  where t.id = v_tool_id;

  insert into public.tool_revisions (tool_id, actor_id, snapshot)
  values (v_tool_id, auth.uid(), v_after);

  insert into public.cms_audit_events (actor_id, action, entity_type, entity_id, before, after)
  values (auth.uid(), 'restore', 'tool', v_tool_id::text, v_before, v_after);

  return v_tool_id;
end;
$$;

revoke all on function public.admin_restore_tool_revision(uuid) from public;
grant execute on function public.admin_restore_tool_revision(uuid) to authenticated;

-- 7. Public settings allowlist ---------------------------------------------------
-- Anonymous / non-admin visitors may only read a fixed set of "safe" site
-- settings (branding + AdSense + maintenance banner). Admins keep full access.

create or replace function public.is_public_setting_key(key text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select key in (
    'logo_path',
    'site_name',
    'site_tagline',
    'adsense_enabled',
    'adsense_client_id',
    'adsense_slot_top',
    'adsense_slot_sidebar',
    'adsense_slot_bottom',
    'adsense_slot_tool_inline',
    'adsense_placement_top',
    'adsense_placement_sidebar',
    'adsense_placement_bottom',
    'maintenance_message'
  );
$$;

revoke all on function public.is_public_setting_key(text) from public;
grant execute on function public.is_public_setting_key(text) to authenticated, anon;

drop policy if exists "Anyone can read site settings" on public.site_settings;
drop policy if exists "Public can read allowlisted site settings" on public.site_settings;
create policy "Public can read allowlisted site settings"
  on public.site_settings for select
  to anon, authenticated
  using (public.is_admin() or public.is_public_setting_key(key));

drop policy if exists "Anyone can read site setting translations" on public.site_setting_translations;
drop policy if exists "Public can read allowlisted site setting translations" on public.site_setting_translations;
create policy "Public can read allowlisted site setting translations"
  on public.site_setting_translations for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.site_settings s
      where s.id = setting_id and public.is_public_setting_key(s.key)
    )
  );

-- 8. media_public view (no uploaded_by) ------------------------------------------
-- Full public.media (with uploaded_by) is now admin-only; everyone else reads
-- the safe view. Views run with the privileges of their owner, so this keeps
-- working even though the base table's RLS is now admin-only.

drop policy if exists "Anyone can read media metadata" on public.media;
drop policy if exists "Admins can read media metadata" on public.media;
create policy "Admins can read media metadata"
  on public.media for select
  to authenticated
  using (public.is_admin());

revoke select on public.media from anon;

create or replace view public.media_public as
  select id, path, alt_text, mime_type, size_bytes, created_at
  from public.media;

grant select on public.media_public to anon, authenticated;

-- 9. Seed default settings keys (safe defaults, never overwrites admin edits) ---

insert into public.site_settings (key)
values
  ('site_name'),
  ('site_tagline'),
  ('logo_path'),
  ('adsense_enabled'),
  ('adsense_client_id'),
  ('adsense_slot_top'),
  ('adsense_slot_sidebar'),
  ('adsense_slot_bottom'),
  ('adsense_slot_tool_inline'),
  ('adsense_placement_top'),
  ('adsense_placement_sidebar'),
  ('adsense_placement_bottom'),
  ('maintenance_message')
on conflict (key) do nothing;

insert into public.site_setting_translations (setting_id, locale, value)
select s.id, 'en', defaults.value
from public.site_settings s
join (
  values
    ('site_name', ''),
    ('site_tagline', ''),
    ('logo_path', ''),
    ('adsense_enabled', 'false'),
    ('adsense_client_id', ''),
    ('adsense_slot_top', ''),
    ('adsense_slot_sidebar', ''),
    ('adsense_slot_bottom', ''),
    ('adsense_slot_tool_inline', ''),
    ('adsense_placement_top', 'false'),
    ('adsense_placement_sidebar', 'false'),
    ('adsense_placement_bottom', 'false'),
    ('maintenance_message', '')
) as defaults (key, value) on defaults.key = s.key
on conflict (setting_id, locale) do nothing;

-- 10. submit_tool_feedback(p_slug, p_vote, p_client_hash) -----------------------
-- Public "was this helpful?" widget. Rate-limited to one vote per tool per
-- client per day via the unique index on tool_feedback_events. No PII is
-- stored: p_client_hash must be a hash computed by the caller.

create or replace function public.submit_tool_feedback(
  p_slug text,
  p_vote text,
  p_client_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yes_count integer;
  v_no_count integer;
begin
  if p_vote not in ('yes', 'no') then
    raise exception 'invalid vote: %', p_vote;
  end if;

  if coalesce(btrim(p_client_hash), '') = '' then
    raise exception 'client_hash is required';
  end if;

  if not exists (select 1 from public.tools where slug = p_slug) then
    raise exception 'unknown tool slug: %', p_slug;
  end if;

  begin
    insert into public.tool_feedback_events (tool_slug, vote, client_hash)
    values (p_slug, p_vote, p_client_hash);
  exception when unique_violation then
    raise exception 'You already voted on this tool today' using errcode = '23505';
  end;

  insert into public.tool_feedback_stats (tool_slug, yes_count, no_count)
  values (
    p_slug,
    case when p_vote = 'yes' then 1 else 0 end,
    case when p_vote = 'no' then 1 else 0 end
  )
  on conflict (tool_slug) do update set
    yes_count = public.tool_feedback_stats.yes_count + case when p_vote = 'yes' then 1 else 0 end,
    no_count = public.tool_feedback_stats.no_count + case when p_vote = 'no' then 1 else 0 end
  returning yes_count, no_count into v_yes_count, v_no_count;

  return jsonb_build_object('yes_count', v_yes_count, 'no_count', v_no_count);
end;
$$;

revoke all on function public.submit_tool_feedback(text, text, text) from public;
grant execute on function public.submit_tool_feedback(text, text, text) to anon, authenticated;
