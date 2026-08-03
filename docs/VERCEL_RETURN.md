# Vercel'e dönüş (ücretsiz)

Cloudflare Worker ücretsiz limite sığmadığı için production tekrar **Vercel**.

## 1) Kodu Vercel'e gönder

GitHub'a push ediyorsan Vercel otomatik deploy eder:

```bash
git add -A
git commit -m "Return to Vercel; SEO and tool fixes"
git push
```

Ya da Vercel Dashboard → Deployments → Redeploy.

> ISR kotası hâlâ doluysa deploy kuyruğa girebilir / fail olabilir.
> Kota yenilenince tekrar dene. `revalidate = false` bir daha kotayı yakmamalı.

## 2) Domain DNS (önemli)

### A) Nameserver hâlâ Cloudflare ise (khalid / riya)

Cloudflare DNS'te Vercel kayıtlarını geri koy (turuncu Proxied açık kalabilir):

| Type | Name | Content |
|------|------|---------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | Vercel'in verdiği `xxxx.vercel-dns.com` (Dashboard → Domains) |

Vercel → Project → Settings → Domains → `onlineofficetools.com` + `www` ekli olsun.

### B) Nameserver'ı reg.com.tr'ye geri aldıysan

reg.com.tr DNS'te aynı A + www CNAME (Vercel değerleri).

Google doğrulama CNAME'ini (`4sg5t52jum5p` …) **silme**.

## 3) Kontrol

- https://onlineofficetools.com/en
- https://www.onlineofficetools.com → apex'e yönlensin
- /sitemap.xml

## Kodda kalan iyileştirmeler (Vercel'de de faydalı)

- `revalidate = false` (ISR yazımını keser)
- www → apex redirect
- Consent / GA düzeltmeleri
- Spektrum canlı önizleme fix
- Ses spektrumu audio kategorisi
- Botlar için sabit `/en` yönlendirme
