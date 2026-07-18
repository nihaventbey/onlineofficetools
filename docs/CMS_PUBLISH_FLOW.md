# CMS publish → Vercel rebuild

Public pages are statically generated at build time from published Supabase rows.
Draft content never appears on the live site until a rebuild runs.

## One-time setup

1. In Vercel → Project → Settings → Git → **Deploy Hooks**, create a hook
   (e.g. name `cms-publish`, branch `main`). Copy the URL.
2. In Supabase → Database → **Webhooks** (or Database Webhooks), create a
   webhook on `public.tools`:
   - Events: `UPDATE` (optionally `INSERT`)
   - HTTP Request: `POST` to the Vercel Deploy Hook URL
   - Optional filter: only when `status` becomes `published` or changes while
     already published
3. Keep the Deploy Hook URL only in Supabase (or Vercel secrets). Never put it
   in `NEXT_PUBLIC_*` env vars or client code.

## Admin role

Public signup is disabled in `supabase/config.toml`. Create the first admin in
the Supabase Dashboard (Authentication → Users), then set:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'you@example.com';
```

Sign out and sign in again so the JWT picks up `app_metadata.role = admin`.

## Environment variables

Set on Vercel (and locally in `.env.local`):

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_ADSENSE_CLIENT`

Never add `service_role` / secret keys to the Next.js app.
