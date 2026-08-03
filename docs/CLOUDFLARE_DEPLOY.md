# Cloudflare Workers (OpenNext) — onlineofficetools

Cloudflare artık Next.js için **Workers + OpenNext** kullanıyor (eski “Pages only” yolu değil).
Domain aynı kalır; Vercel ISR kotası olmaz.

## 1) Bir kerelik giriş

```bash
npx wrangler login
```

Tarayıcıda Cloudflare hesabını bağla.

## 2) Ortam değişkenleri (production)

Yerel `.env.local` ile `npm run deploy` çalıştırırsan build sırasındaki
`NEXT_PUBLIC_*` değerleri HTML’e gömülür. Worker runtime için de aynıları
Cloudflare’e yaz:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# İsteğe bağlı (build zaten gömdüyse şart değil):
# npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
# npx wrangler secret put NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Dashboard → Workers → onlineofficetools → Settings → Variables da kullanılabilir.

## 3) Deploy

```bash
npm run deploy
```

İlk deploy `*.workers.dev` adresinde açılır.

## 4) Domain’i bağla

1. Domain’i Cloudflare’e ekle (DNS Cloudflare’de olsun).
2. Workers → onlineofficetools → Settings → Domains & Routes  
   → `onlineofficetools.com` ve `www.onlineofficetools.com` ekle.
3. Vercel’deki custom domain’i kaldır (DNS çakışmasın).
4. Birkaç dakika sonra `https://onlineofficetools.com` Cloudflare’den gelsin.

## 5) Son kontroller

- `/en`, `/tr`, bir tool sayfası, `/sitemap.xml`, `/robots.txt`
- Admin login
- Search Console / AdSense aynı domain’de kalır

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Yerel Next geliştirme |
| `npm run preview` | Workers runtime önizleme |
| `npm run deploy` | Build + Cloudflare’e yayın |

## Ücretsiz plan uyarısı

Bu Next.js uygulama Worker gzip ~3.1–3.2 MiB. Cloudflare **ücretsiz** limiti **3 MiB**.
Küçültme denendi (OG WASM, middleware, client-only tools); limitin biraz üstünde kaldı.

**Para vermeden:** Vercel ISR kotası yenilenince oraya deploy et (`revalidate = false`
artık kotayı yakmaz).  
**Cloudflare için:** Workers Paid (~5 $/ay) gerekir.

- `src/middleware.ts` Edge’de çalışır (OpenNext şu an Next 16 `proxy.ts` Node middleware’ini reddediyor).
- `onnxruntime-web` WASM’ı ~26 MiB; Cloudflare asset limiti 25 MiB. Deploy script’i bu dosyayı siler;
  AI upscale aracı WASM’ı jsDelivr CDN’den yükler.
- Ücretsiz Worker gzip script limiti ~3 MiB; deploy sırasında wrangler boyutu gösterir.
