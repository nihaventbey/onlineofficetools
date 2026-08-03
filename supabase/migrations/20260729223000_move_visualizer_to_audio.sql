-- Ensure `audio` is allowed on tools.category, then move visualizer into audio.
alter table public.tools drop constraint if exists tools_category_check;
alter table public.tools
  add constraint tools_category_check
  check (
    category in (
      'text', 'documents', 'spreadsheets', 'presentations',
      'pdf', 'image', 'archive', 'video', 'audio', 'ebys',
      'developer', 'security', 'calculator'
    )
  );

update public.tools
set category = 'audio',
    updated_at = timezone('utc', now())
where slug = 'video-audio-visualizer'
  and category is distinct from 'audio';
