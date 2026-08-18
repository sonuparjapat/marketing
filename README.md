# Anvil Digital — Agency Platform

Three apps sharing one PostgreSQL-backed API:

```
marketing/
├── backend/    Node.js + Express + PostgreSQL API (auto-migrates on boot)
├── frontend/   Next.js 15 — public site (premium "Midnight Editorial" homepage) + admin panel (TODO)
└── mobile/     Expo (React Native) — companion app, expo-router
```

## Run it

**Backend** (http://localhost:5000)
```
cd backend
npm install
npm run dev          # auto-creates all tables + seeds first admin on boot
```
Copy `.env.example` → `.env` and fill in `DATABASE_URL` (a local Postgres db named
`agency_marketing` is already created on this machine), `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`, and SMTP/AWS creds when ready — both are optional at
first (emails/uploads no-op with a warning until configured).

Optional: `node src/database/seed.js` populates demo services, case studies,
testimonials and blog posts.

**Frontend** (http://localhost:3000)
```
cd frontend
npm install
npm run dev
```
Reads `NEXT_PUBLIC_API_URL` from `.env.local` (defaults to the local backend).

**Mobile**
```
cd mobile
npm install
npx expo start
```
Reads `EXPO_PUBLIC_API_URL` from `.env`.

## What's built

- **Backend**: full REST API per the blueprint — leads, callbacks, newsletter,
  posts, case studies, services, testimonials, team, settings, admin auth
  (JWT), image upload (S3), transactional email (SMTP/Nodemailer), rate
  limiting, CORS, helmet. `src/database/init.js` is idempotent — safe to run
  on every boot.
- **Frontend**: homepage (hero, services, stats, case studies, testimonials,
  blog preview, CTA, footer) and a working `/contact` lead form, both wired
  to live backend data. Other inner pages (`/services/[slug]`, `/work/[slug]`,
  `/blog`, `/about`, admin panel) are the natural next step.
- **Mobile**: Home / Services / Work / Blog / Contact tabs, all reading from
  the same backend, with a working lead-submission form.

## Design

Homepage ships in the "Midnight Editorial" direction (dark navy, gold accent,
serif display type) — two other premium directions (bold gradient/SaaS,
minimal luxury) were explored and can be swapped in on request.
