# Online Office Tools

SEO-focused, client-side office utilities for [onlineofficetools.com](https://onlineofficetools.com).

- **Hosting:** Vercel (domain + Vercel only)
- **CMS / Auth / Storage:** Supabase
- **i18n:** URL-based `[lang]` routing (`/en/...`, `/tr/...`), dictionaries ready to scale to 20 languages
- **Tools:** Run fully in the browser (`use client`) — no API routes for tool processing
- **Ads:** Google AdSense-ready slots (top / sidebar / bottom)

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en).

Admin CMS: [http://localhost:3000/admin](http://localhost:3000/admin)

## Supabase

1. Create a Supabase project.
2. Apply [`supabase/migrations/20260718120000_cms_schema.sql`](supabase/migrations/20260718120000_cms_schema.sql).
3. Create an admin user and set `app_metadata.role = admin` (see [`docs/CMS_PUBLISH_FLOW.md`](docs/CMS_PUBLISH_FLOW.md)).
4. Wire a Database Webhook → Vercel Deploy Hook for publish rebuilds.

Without Supabase env vars, the site still builds using local dictionary fallbacks for the Word Counter tool.

## Scripts

| Command       | Description        |
| ------------- | ------------------ |
| `npm run dev` | Local development  |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint             |
