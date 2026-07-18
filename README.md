# Online Office Tools

SEO-focused, client-side office utilities for [onlineofficetools.com](https://onlineofficetools.com).

- **Hosting:** Vercel (domain + Vercel only)
- **CMS / Auth / Storage:** Supabase
- **i18n:** URL-based `[lang]` routing (`/en/...`, `/tr/...`), dictionaries ready to scale to 20 languages
- **Tools:** Run fully in the browser (`use client`) — no API routes for tool processing
- **Routing:** Canonical tool URLs are `/[lang]/tools/[slug]` via `src/lib/tools/registry.ts`
- **Ads:** Google AdSense-ready slots (top / sidebar / bottom); slots render only when a real publisher ID is configured

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
2. Apply migrations in `supabase/migrations/` (schema + tool seeds).
3. Create an admin user and set `app_metadata.role = admin` (see [`docs/CMS_PUBLISH_FLOW.md`](docs/CMS_PUBLISH_FLOW.md)).
4. Wire a Database Webhook → Vercel Deploy Hook for publish rebuilds.

Without Supabase env vars, the site still builds using local registry fallbacks for all registered tools.

### Tool registry (important)

CMS `tools.slug` values must match an entry in [`src/lib/tools/registry.ts`](src/lib/tools/registry.ts). Orphan CMS slugs are filtered out of the public site and sitemap so they never 404 as half-published tools. When adding a tool in Admin, also add the client component + registry entry in code.

## Scripts

| Command       | Description        |
| ------------- | ------------------ |
| `npm run dev` | Local development  |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint             |
