# Availability API — no more manual JSON uploads

The site now stores camera availability on the server. Staff edit dates in **`admin.html`**; the homepage and **`availability.html`** read from **`/api/bookings/public`**.

You no longer need to download or upload `availability-public.json` after every change.

---

## One-time Vercel setup

### 1. Connect Redis (Upstash)

1. Open your project on [vercel.com](https://vercel.com)
2. **Storage** → **Create Database** → **Upstash Redis** → connect to this project  
   (Vercel adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically)

### 2. Set admin PIN (recommended)

In **Project → Settings → Environment Variables**, add:

| Name | Value | Notes |
|------|--------|--------|
| `PRILLAGA_ADMIN_PIN` | your secret PIN | Must match what you type in `admin.html` |

If unset, the default is `lens2026` (change this before going live).

### 3. Deploy

Push/deploy the repo. Vercel will install `@upstash/redis` from `package.json` and enable:

- `GET /api/bookings/public` — public calendar (cached ~15s)
- `GET /api/bookings` — full data (admin, requires PIN header)
- `PUT /api/bookings` — save from admin (requires PIN header)

---

## How staff use it

1. Open **`https://prllg-co-lens.vercel.app/admin.html`**
2. Enter your admin PIN
3. Block dates, add pending requests, confirm/reject as before
4. Each action **saves automatically** — status shows **“Saved — live website updated.”**

Optional: **Download backup JSON** keeps a local copy only; it is not required for the live site.

---

## First launch / migration

When Redis is empty, the API seeds from your existing calendar blocks (same data that was in `availability-public.json`).

If you already have bookings in admin on another browser, unlock admin once after deploy — it loads from the server and you can continue editing.

---

## Public site behaviour

- Homepage calendar and **Availability** page fetch `/api/bookings/public`
- Auto-refresh every ~45 seconds and when the tab becomes visible again
- If the API is down, the site tries `availability-public.json` as a **backup** and shows a yellow warning
- If both fail, a red error message is shown

---

## Local testing

```bash
npm install
npx vercel dev
```

Add the same Upstash env vars to a local `.env` file (Vercel CLI loads them during `vercel dev`).

Run core validation tests:

```bash
node scripts/test-bookings-api.mjs
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **503 — storage not configured** | Connect Upstash Redis on Vercel and redeploy |
| **401 — unauthorized** | Wrong admin PIN; set `PRILLAGA_ADMIN_PIN` on Vercel |
| Admin saves but public page old | Wait up to 15s (cache) or refresh; auto-refresh runs every 45s |
| Still using JSON file | Remove old deploy; ensure latest `index.html` / `availability.html` are live |

---

## Files involved

| File | Role |
|------|------|
| `api/bookings/public.js` | Public read API |
| `api/bookings/index.js` | Admin read/write API |
| `lib/bookings/*` | Storage, validation, auth |
| `scripts/bookings-api.js` | Browser fetch helpers |
| `admin.html` | Staff dashboard (auto-save) |
| `site-config.js` | API URL config |

`availability-public.json` remains as an emergency fallback only — you do not need to update it manually anymore.
