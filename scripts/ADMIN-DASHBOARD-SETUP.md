# Admin dashboard — full site CMS

Manage **products, prices, photos, and availability** from one dashboard without editing code or uploading JSON/image files manually.

**URLs** (bookmark; not linked from the public site):

| Page | URL |
|------|-----|
| **Admin home** | `/admin/` or `/admin/index.html` |
| **Products & photos** | `/admin/content.html` |
| **Availability** | `/admin.html` |

---

## One-time Vercel setup

### 1. Upstash Redis (catalog + availability)

**Storage → Create Database → Upstash Redis** → connect to project.

Adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### 2. Vercel Blob (photo uploads)

**Storage → Create Store → Blob** → connect to project.

Adds `BLOB_READ_WRITE_TOKEN`.

### 3. Admin PIN

**Settings → Environment Variables:**

| Name | Example |
|------|---------|
| `PRILLAGA_ADMIN_PIN` | your secret PIN |

Default if unset: `lens2026` — change before going live.

### 4. Deploy

Push/deploy so Vercel installs `@upstash/redis` and `@vercel/blob`.

---

## Using the dashboard

1. Open **Admin home** (`/admin/`) or go straight to **Products & photos** (`/admin/content.html`) or **Availability** (`/admin.html`)
2. Enter your **admin PIN** (once per browser session — moving between admin pages keeps you signed in)
3. Use the sections:

### Availability
- Quick block dates (red on calendar)
- Add pending → Confirm / Reject
- Saves automatically to `/api/bookings`

### Products & prices
- Select a camera/product on the left
- Edit **name**, **description**, **base rate**, **long rate (3+ days)**
- Set **primary photo** from library or paste URL
- Add **sample photo URLs** (one per line)
- Toggle **Show on website** / **Allow booking**
- Click **Save product** → live site updates within ~15–60 seconds

### Photos
- Upload JPEG/PNG/WebP/GIF (max 5 MB)
- Optionally assign to a product on upload
- **Delete** removes from Blob storage and catalog
- Uploaded files live on **Vercel Blob** (CDN URLs), not in your repo

---

## What updates automatically on the live site

| Data | Public API | Pages |
|------|------------|-------|
| Units, prices, descriptions, images | `/api/catalog/public` | Home, Units, booking form, agreement |
| Calendar blocks | `/api/bookings/public` | Home calendar, Availability page |

Public pages auto-refresh catalog every **60s** and availability every **45s**, plus when you return to the tab.

---

## APIs (for reference)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/catalog/public` | None | Live product data |
| `GET/PUT /api/catalog` | `X-Admin-Pin` header | Admin catalog |
| `POST /api/upload` | `X-Admin-Pin` | Upload image |
| `DELETE /api/upload` | `X-Admin-Pin` | Delete image |
| `GET /api/bookings/public` | None | Live calendar |
| `GET/PUT /api/bookings` | `X-Admin-Pin` | Admin calendar |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 503 storage not configured | Connect Upstash Redis on Vercel |
| Upload fails | Connect Vercel Blob; check file size/type |
| 401 unauthorized | Wrong PIN; set `PRILLAGA_ADMIN_PIN` on Vercel |
| Site shows old prices | Hard refresh; wait up to 60s for catalog cache |
| Yellow “backup” banner | API unreachable; static fallback is showing |

---

## Files

- `admin.html` — dashboard UI
- `scripts/admin-dashboard.js` — products & media tabs
- `scripts/catalog-api.js` — browser API client
- `scripts/site-content.js` — renders live catalog on public pages
- `api/catalog/*`, `api/upload/*`, `lib/catalog/*` — backend
- `scripts/bookings-api.js`, `api/bookings/*` — availability (existing)

`availability-public.json` and `images/` folder remain as **fallbacks** for first deploy or API outage — you no longer need to update them manually.
