-- Patch: AdSense tool-inline placement allowlist + optimistic concurrency on upsert.

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
    'adsense_placement_tool_inline',
    'maintenance_message'
  );
$$;

insert into public.site_settings (key)
values ('adsense_placement_tool_inline')
on conflict (key) do nothing;

insert into public.site_setting_translations (setting_id, locale, value)
select s.id, 'en', 'false'
from public.site_settings s
where s.key = 'adsense_placement_tool_inline'
on conflict (setting_id, locale) do nothing;

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
  v_expected timestamptz;
  v_current timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Only admins can upsert tools' using errcode = '42501';
  end if;

  v_slug := btrim(coalesce(payload->>'slug', ''));
  v_category := payload->>'category';
  v_status := coalesce(payload->>'status', 'draft');
  v_cover_path := payload->>'cover_path';
  v_sort_order := coalesce((payload->>'sort_order')::integer, 0);
  v_expected := nullif(payload->>'expected_updated_at', '')::timestamptz;

  if v_slug = '' then
    raise exception 'slug is required';
  end if;

  if v_status not in ('draft', 'published') then
    raise exception 'invalid status: %', v_status;
  end if;

  v_tool_id := nullif(payload->>'id', '')::uuid;
  v_is_update := v_tool_id is not null and exists (select 1 from public.tools where id = v_tool_id);

  if v_is_update then
    select updated_at into v_current from public.tools where id = v_tool_id;
    if v_expected is not null and v_current is distinct from v_expected then
      raise exception 'Bu araç başka bir yönetici tarafından güncellendi. Sayfayı yenileyip tekrar deneyin.'
        using errcode = 'P0001';
    end if;

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

-- Allow SVG logos in the public media bucket (picker already accepts image/svg+xml).
update storage.buckets
set allowed_mime_types = array[
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]
where id = 'cms-media';
