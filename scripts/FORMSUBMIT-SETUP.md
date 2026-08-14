# Rental agreement — FormSubmit

## Why you see “This form needs Activation”

FormSubmit treats **AJAX + file uploads** separately from simple text forms. Until you click **Activate Form** once, the API returns that message (your PNG is still downloaded as backup).

Text-only test emails may arrive **before** activation — that is normal and confusing.

## Fix (one time)

### Step 1 — Find the activation email

1. In Gmail for **hjsescabarte2021@gmail.com**, search: **`Activate Form`** or from **`formsubmit.co`**
2. Check **Spam** and **Promotions**
3. Open the email and click **Activate Form**

### Step 2 — Use the hash ID (important for AJAX + PNG)

After activating, FormSubmit sends a **long ID** (not your @gmail.com address), e.g.:

`243e4ab576936c3f12f624ccd78c3dee`

Put that in **`site-config.js`**:

```javascript
window.PRILLAGA_FORMSUBMIT_ENDPOINT = "paste-the-hash-here";
window.PRILLAGA_BUSINESS_EMAIL = "hjsescabarte2021@gmail.com";
```

Using only the Gmail address in AJAX often keeps showing “needs Activation” even after you clicked the link. The **hash** fixes that.

### Step 3 — Redeploy

Upload **`site-config.js`** and **`rental-agreement.html`** to Vercel, then submit a test agreement.

## What gets emailed

| Who | How |
|-----|-----|
| **Owner** | FormSubmit email with **3 attachments**: full signed agreement, **id_photo** (ID only), **signature** (drawn signature only) |
| **Customer** | CC copy on the same email (if they entered an email on the form) |

Open the FormSubmit email and scroll to the bottom — you should see three files, not just the text table.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Still “needs Activation” | Set `PRILLAGA_FORMSUBMIT_ENDPOINT` to the **hash**, not `@gmail.com` |
| No activation email | Submit once from live site; search all Gmail folders |
| Text emails but no PNG | Use hash endpoint + latest `rental-agreement.html` on Vercel |
| Already activated before | FormSubmit may have sent a new hash — use the newest one |
| “Open through a web server” | Do **not** open a saved HTML file. Use **https://prllg-co-lens.vercel.app/rental-agreement.html** in Safari or Chrome. |
