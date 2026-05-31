# Admin dashboard — free plan (Supabase)

Manage **products, prices, photo URLs, and availability** from the admin pages. Everything saves to **Supabase free tier** — no Upstash, no paid Vercel Storage.

**Setup guide:** [`scripts/SUPABASE-SETUP.md`](SUPABASE-SETUP.md)

**URLs** (bookmark; not linked from the public site):

| Page | URL |
|------|-----|
| **Admin home** | `/admin/` or `/admin/index.html` |
| **Products & photos** | `/admin/content.html` |
| **Availability** | `/admin.html` |

---

## Quick setup

1. **supabase.com** → free project → run **`supabase/schema.sql`**
2. Copy **Project URL** + **service_role** key
3. Vercel → **Environment Variables** → `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PRILLAGA_ADMIN_PIN`
4. **Redeploy**

---

## Photos

No paid file upload storage. Use:

- **`images/photo.jpg`** paths (files in your site folder)
- Any public **`https://`** image URL

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Storage not configured | Supabase env vars + redeploy |
| Table missing | Run `supabase/schema.sql` |
| 401 unauthorized | Wrong admin PIN |
| Yellow backup banner | API unreachable — check Supabase + Vercel |

See **`scripts/SUPABASE-SETUP.md`** for full steps.
