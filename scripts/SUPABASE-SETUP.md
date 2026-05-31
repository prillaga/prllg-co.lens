# Supabase storage — free plan setup

Your admin dashboard saves **products, prices, photo URLs, and availability** to a **free Supabase** database. No Upstash or paid Vercel Storage needed.

---

## Step 1 — Create free Supabase project

1. Go to **[supabase.com](https://supabase.com)** → **Start your project** (sign up free).
2. **New project**
   - Name: `prillaga-lens` (or any name)
   - Database password: choose a strong password (save it — Supabase needs it, not your site)
   - Region: **Southeast Asia (Singapore)** if available, or closest to you
3. Wait until the project finishes creating (~1–2 minutes).

---

## Step 2 — Create the storage table

1. In Supabase, open **SQL Editor** → **New query**
2. Copy everything from **`supabase/schema.sql`** in this repo:

```sql
create table if not exists public.prillaga_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.prillaga_store enable row level security;
```

3. Click **Run** — you should see “Success”.

---

## Step 3 — Copy API keys

1. Supabase → **Project Settings** (gear) → **API**
2. Copy:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role** key (under Project API keys) → this is `SUPABASE_SERVICE_ROLE_KEY`

**Important:** Never put the `service_role` key in your website HTML or GitHub. Only add it in **Vercel environment variables**.

---

## Step 4 — Add keys on Vercel

1. [vercel.com](https://vercel.com) → your project → **Settings → Environment Variables**
2. Add **exactly** these names:

| Name | Value |
|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret key** from Supabase (`sb_secret_...` or legacy `service_role` JWT) |
| `PRILLAGA_ADMIN_PIN` | Your admin PIN |

`SUPABASE_URL` is optional — defaults to `https://fomyzhxajhwqkztfvkue.supabase.co`.

**Wrong:** `sb_publishable_...` · **Correct:** `sb_secret_...` or **service_role**

3. Environment: **Production**
4. Save → **Deployments → Redeploy**

---

## Step 5 — Deploy

**Deployments → ⋯ → Redeploy** (or push your latest code to Git).

---

## Step 6 — Test

Open in browser:

- `https://prllg-co-lens.vercel.app/api/catalog/public`
- `https://prllg-co-lens.vercel.app/api/bookings/public`

**Good:** JSON with units / bookings  
**Bad:** “storage is not configured” → check env vars and that SQL ran  
**Bad:** “Database table missing” → run `supabase/schema.sql` again

Then open your homepage — warning banners should be gone.

---

## Admin pages

| Page | URL |
|------|-----|
| Admin home | `/admin/` |
| Products & photos | `/admin/content.html` |
| Availability | `/admin.html` |

---

## Free tier limits (Supabase)

- **500 MB** database
- **50,000** monthly active users (API auth not used on public read — your usage is tiny)
- Pauses after **1 week** of inactivity on free tier — open Supabase dashboard occasionally or upgrade if needed

More than enough for a camera rental site catalog + calendar.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 503 storage not configured | Add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on Vercel, redeploy |
| Table missing error | Run SQL from `supabase/schema.sql` |
| 401 in admin | Wrong PIN vs `PRILLAGA_ADMIN_PIN` |
| Project paused | Log into Supabase → restore project |

---

## What changed from Upstash

The site no longer uses Redis. Same admin UI — data now lives in Supabase table `prillaga_store` with two keys:

- `prillaga:catalog:v1` — products & photos
- `prillaga:bookings:v1` — calendar
