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
- `ADMIN_SESSION_SECRET` (32+ random characters) — signs admin sessions. Changing it signs every device out. Restart the site after changing it.
- `ADMIN_PASSWORD` (12+ characters) — first-run sign-in only. Until an active `main_admin` account exists it signs in as Main Admin (leave the email empty, or use any email without an account); after that it is refused.

**Admin accounts and roles** — each person signs in with their own email and password (collection `admin_users`, scrypt hashes). A Main Admin manages accounts in the portal under Users (`/admin/users`): add staff, change roles, reset passwords, disable or delete. It refuses anything that would leave no active Main Admin, and a Main Admin can't demote, disable or delete themself. The first account can also be made there while signed in with `ADMIN_PASSWORD`, or from the terminal with `npm run admin:create -- --email you@example.com --name "Your Name" --role main_admin` (roles: `main_admin`, `managing_director`, `assistant_manager`); the password is asked for on the terminal. What each role may do is in `lib/admin-rbac.ts`: every admin API route checks it (403 when not allowed) and the sidebar, dashboard and buttons follow it. Bookings and pricing changes record who made them (`createdBy` / `updatedBy` on bookings, `by` on `pricing_changes`).

**Settings and My profile** — `/admin/settings` has two tabs: *My profile* (every role: photo, name, job title, phone, bio, CV, password, "Sign out everywhere", appearance, language) and *Site settings* (Main Admin: contact details, system status). Profile fields live in the optional `profile` sub-document of `admin_users`; only `lib/admin-users.ts` writes it, always for the signed-in account.

**Profile photos and CVs (Cloudinary)** — set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` (server only, no `NEXT_PUBLIC_`). Until they are set, the profile screen says uploads aren't available and everything else works. In the Cloudinary console, create two **signed** upload presets:
- `sura_admin_avatar` — allowed formats jpg, jpeg, png, webp; max file size 5 MB; delivery type *upload*; optional incoming transformation `c_limit,w_1024,h_1024`.
- `sura_admin_cv` — allowed formats pdf; max file size 10 MB; delivery type *authenticated*.

Also enable *Allow delivery of PDF and ZIP files* (Settings → Security) so the signed CV links work. Files go straight from the browser to Cloudinary (`lib/cloudinary.ts` signs each upload with SHA-1 and fixes the path to `sura-admin/<account id>/avatar|cv`); the server then checks Cloudinary's signature and the file's real format and size before saving. CVs open only through `/api/admin/users/<id>/cv` (the owner or a Main Admin), which redirects to a link that expires after 5 minutes.

**Signing out** — sign-out does a full page load and sends `Clear-Site-Data: "cache"`, and `AdminShell` reloads any admin page restored from the back/forward cache, so Back never shows a signed-in screen again. `next.config.ts` pins `Cache-Control: private, no-store, max-age=0, must-revalidate` and `Vary: Cookie` on `/admin` and `/api/admin`.

**Database setup** — run once per database (safe to repeat): `npm run db:setup`. It creates the `testimonials`, `bookings`, `admin_users` and CMS collections with their schema checks and indexes. Run it again after updating, so the schema checks accept the new `createdBy` / `updatedBy` / `by` fields.

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
