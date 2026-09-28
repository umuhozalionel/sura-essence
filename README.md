# Sura Essence — Landing Page (V0)

**Purpose**
Official web application for SURA ESSENCE LTD.
A mobility and Tourist company based in Rwanda elading others with a flexibility transport.

This Web app is Focused on marketing, lead capture, and validating demand. No backend integrations required yet for this version.

---

## What’s included
- Next.js app (App Router)
- Tailwind CSS for styling
- Components: `Hero`, `Features`, `Footer`
- App Router API placeholder: `app/api/send-whatsapp/route.ts` (stub; Twilio disabled by default)
- Deployment target: Render Vercel
- Included in Framer-motion and Lucid charts

---

## Quick start (local)

1. Install dependencies
```bash
npm install
```

---

## Admin portal & pricing — developer notes

These notes are for developers. The admin portal (`/en/admin`, `/fr/admin`) is for staff and never shows technical instructions.

**Environment variables** — in `.env.local` locally, or in your hosting settings. Never give them a `NEXT_PUBLIC_` prefix.
- `MONGODB_URI` (and optional `MONGODB_DB`, default `sura`) — bookings and testimonials.
- `ADMIN_PASSWORD` (12+ characters) and `ADMIN_SESSION_SECRET` (32+ random characters) — admin sign-in. Changing either one signs every device out. Restart the site after changing them.

**Database setup** — run once per database (safe to repeat): `npm run db:setup`. It creates the `testimonials` and `bookings` collections with their schema checks and indexes.

**Changing prices** — every rate lives in `lib/pricing.ts`: fuel price (`CURRENT_FUEL_PRICE_RWF`), service fees, profit margin, vehicle classes and the distance table. Edit the file and redeploy; the website's quotes and the admin Fleet page update automatically.

**Testimonials from the terminal** — `npm run testimonials -- pending | live | approve <id> | decline <id> | unpublish <id>`.
