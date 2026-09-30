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

**Changing prices** — every rate lives in `lib/pricing.ts`: pump prices (`PETROL_PRICE_RWF`, `DIESEL_PRICE_RWF`), service fees, profit margin, vehicle classes and the distance table. Each class in `VEHICLES` has a `fuel` of `"petrol"`, `"diesel"` or `"electric"`, and its quotes use that fuel's price (electric classes have no fuel cost). Edit the file and redeploy; the website's quotes, the Trip Alerts page and the admin Fleet page, dashboard and booking form all update automatically.

**Testimonials from the terminal** — `npm run testimonials -- pending | live | approve <id> | decline <id> | unpublish <id>`.

## Homepage hero & activities — developer notes

**Hero** (`components/hero.tsx`, settings at the top of the file):
- `isEventMode = false` shows the welcoming hero: the photos in `HERO_IMAGES` fade into each other every 3 seconds (`SLIDE_INTERVAL_MS`). Visitors who ask for reduced motion see the first photo only.
- `isEventMode = true` skips the slideshow and shows the event flyer from `EVENT.poster`, with the texts in `Hero.event.*` (messages/en.json + fr.json). Set `EVENT.lastDay` (YYYY-MM-DD) and the hero goes back to the slideshow by itself after that day.
- All hero texts live under `Hero.welcome`, `Hero.event`, `Hero.nextActivity`, `Hero.weather` and `Hero.clock`. The weather ticker (top right) and the small clock (bottom right) always use Kigali; the clock shows Kigali time (CAT).

**Activity images to add** — put these files in `public/images/activities/` with exactly these names (the code refers to them as `/images/activities/<file>`):
- `akagera-recap.jpg` — Akagera National Park Experience (Past Events, Sura Seasons).
- `bisoke-poster.jpg` — Bisoke and Musanze Retreat (Upcoming Events, Sura Seasons, and the hero in event mode).
- `generic-placeholder.jpg` — a neutral image for the "TBA" placeholder event on 15 November (Upcoming Events).

Until a file is there, its cards show a plain background instead of a broken image.

**Akagera videos** — the Akagera gallery shows photos only, because `public/activities/akagera/` has no videos yet. To add them, put the files there (e.g. `v1.mp4`) and add entries with `"type": "video"`, `"src"` and a `"poster"` photo to the Akagera trip in `Gallery.trips` (messages/en.json + fr.json), like the Nyungwe ones.

**Activities data** — seasons, events and past events live in messages/en.json + fr.json (`Activities.seasons`, `Events.items`, `PastEvents.items`). A season with no fixed day uses `dateLabel` (e.g. "October (Date TBA)") instead of `date`; an event with status `dateTba` shows the month with "TBA".

## Site-wide notes

- **Large photos as backgrounds** — use `optimizedBg()` from `lib/optimized-bg.ts` instead of `url(...)`: it serves a resized WebP/AVIF copy through Next's image optimizer. Several photos in `public/` are 1–12 MB (e.g. the aerial views); the originals are never sent to visitors. For `<img>`, use `next/image`.
- **Header over a light page** — `<Header forceSolid />` starts with the solid white skin (used on the activity calendar, whose top is cream).
- **Footer links still set to `"#"`** (About Us, Business Accounts, Become a Partner, Sustainability, Privacy, Terms, Sitemap and the social icons, in `Footer` in messages/en.json + fr.json) show as plain text until a real address is filled in.
- **Weather key** — the OpenWeather key is in one place, `lib/weather.ts`. Setting `NEXT_PUBLIC_WEATHER_API_KEY` overrides it without a code change (it is used from the browser, so it is public by nature).
