# ⚡ Anvil Digital — Agency Platform

> A performance-marketing agency platform: a premium public website, a full-featured admin panel with role-based access control, and a companion mobile app — all sharing one PostgreSQL-backed API.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white" />
  <img alt="Node" src="https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="Expo" src="https://img.shields.io/badge/Expo_SDK_57-000020?style=flat-square&logo=expo&logoColor=white" />
  <img alt="Socket.io" src="https://img.shields.io/badge/Socket.io-realtime-010101?style=flat-square&logo=socket.io&logoColor=white" />
  <img alt="Jest" src="https://img.shields.io/badge/Jest-backend_tests-C21325?style=flat-square&logo=jest&logoColor=white" />
  <img alt="Vitest" src="https://img.shields.io/badge/Vitest-frontend_tests-6E9F18?style=flat-square&logo=vitest&logoColor=white" />
  <img alt="GitHub Actions" src="https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" />
  <img alt="Sentry" src="https://img.shields.io/badge/Sentry-error_tracking-362D59?style=flat-square&logo=sentry&logoColor=white" />
</p>

---

## 🧭 What this is

Anvil Digital is the working codebase for a real agency's marketing site — built with a deliberate philosophy: **nothing is hardcoded that an admin might reasonably want to change.** Every homepage section, banner, nav link, legal page, stat, testimonial, and setting is database-backed and editable from a purpose-built admin panel, not buried in a deploy.

The public site sells the agency's actual pitch: *"We don't just market brands — we've built one."* Every case study number and testimonial on the site is meant to be real, because the agency's differentiator is that it has run its own D2C brand before selling that expertise to clients.

---

## 🗂️ Monorepo layout

```
marketing/
├── backend/    Express 5 + PostgreSQL REST API — auto-migrates on every boot
├── frontend/   Next.js 15 (App Router) — public site + admin panel, one deployable app
└── mobile/     Expo (React Native, expo-router) — companion app for the public site + a hidden admin quick-view
```

Three independent apps, one shared source of truth: every table in Postgres, exposed once through `backend/`, consumed by both `frontend/` and `mobile/`.

---

## ✨ What's built

### 🌐 Public site (`frontend/`, `(site)` route group)
- Premium dark-theme homepage — hero, admin-managed **banner/carousel rotation**, client logo marquee, services grid, a "How We Work" process section, animated stats, case studies, testimonials carousel, blog preview, CTA — every section individually toggleable from the admin panel
- Full page set: Services (listing + detail with FAQs), Work/Case Studies (listing + detail), Blog (listing with search/category filters + full article pages with TOC, syntax highlighting, reading time, share buttons), About, Contact (lead form + callback request), legal pages (Privacy/Terms/Refund — DB-backed, not hardcoded)
- **Customer accounts** — a separate identity space from admins: register/login, a right-side auth drawer, a real forgot-password flow (email-based reset link), and a self-service account page (export your data as JSON, delete your account)
- A cookie-consent banner gates Google Analytics loading until the visitor actually accepts — GA4 never fires on page load unconditionally
- SEO: canonical URLs + Open Graph + JSON-LD (Organization, Article, BreadcrumbList, FAQPage) on every route, sitemap.xml, robots.txt
- A visual design system — glassmorphic panels, gradient icon badges, a gold/emerald/coral accent palette — shared across every page via `globals.css` utility classes

### 🛠️ Admin panel (`frontend/`, `admin/(dashboard)` route group)
- **Full RBAC**: departments own a permission matrix (one row per resource, four `create`/`read`/`update`/`delete` flags per grant), with a Super Admin bypass; every nav item and UI control is gated by the signed-in admin's actual permissions, not just hidden by convention
- Content CRUD for every public-facing resource: Posts (full-page TipTap editor — tables, YouTube embeds, code blocks, SEO sidebar with live preview), Case Studies, Services (drag-to-reorder), Testimonials, Team, FAQs, Pages, Blog Categories, **Banners** (drag-to-reorder hero carousel), Client Logos, Homepage Stats/Sections, Nav Links
- Inbox: Leads, Callback Requests, Newsletter Subscribers (CSV export)
- Media library with local-storage fallback + S3 support, no-code-required uploads
- Admin account management: Super-Admin-only admin creation/deactivation, self-service + Super-Admin password reset
- Real-time notifications (Socket.io) on new leads/callbacks, plus Expo push notifications to a hidden mobile admin screen
- Automatic audit log of every admin mutation, plus a lightweight analytics dashboard (page views, lead trends)
- Static, code-maintained documentation (User Manual / Testing / Developer docs) — not a DB-backed CMS, so it never drifts from what's actually true

### 📱 Mobile app (`mobile/`)
- Home / Services / Work / Blog / Contact tabs, reading from the same backend as the web app
- Rich HTML content rendering for blog posts and case studies via a themed WebView (handles tables and embeds that a plain RN component can't)
- A hidden admin quick-view screen (push-notified on new leads) — not in the tab bar, reached via a direct route
- Same visual design language as the web app — gradient icon badges, glass-style cards — kept in sync as the web design evolves

### ⚙️ Backend (`backend/`)
- Express 5 REST API, ~30 resource modules, all following the same public-router / admin-router split
- PostgreSQL via `pg`, with `src/database/init.js` as a single idempotent migration file (`CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`) — safe to run on every boot, currently defines 27 tables
- JWT auth (dual `admin`/`customer` token spaces so both sessions coexist in one browser), bcrypt password hashing, per-endpoint rate limiting, Helmet, CORS allow-list
- **Real session revocation** — a `token_version` column checked on every authenticated request means deactivating an admin or changing a password instantly invalidates every already-issued token for that account, not just at next expiry
- **TOTP two-factor authentication** for admin accounts (any standard authenticator app — Google Authenticator, Authy, 1Password), with a QR-code setup flow and a password-gated disable
- **Rich-text HTML sanitization** on every admin-authored field that's rendered back out via `dangerouslySetInnerHTML` (blog posts, pages, case studies) — stored-XSS protection at the write path, not just the read path
- Upload validation beyond mimetype — file-signature (magic-byte) checking so a relabeled non-image can't slip past the extension/mimetype allowlist
- Transactional email via SMTP/Nodemailer (lead replies, callback confirmations, newsletter welcome, password resets) — no-ops safely with a console warning if SMTP isn't configured yet
- Image uploads to S3, with automatic local-disk fallback so the app works before AWS credentials exist
- Optional Sentry error tracking (backend + frontend) — no-ops without a DSN, same pattern as email/S3

### ✅ Testing & CI
- Backend: Jest + Supertest — auth flows, RBAC permission logic, session revocation, and HTML sanitization are covered by real (not placeholder) tests, with the database layer mocked rather than requiring a live Postgres instance to run
- Frontend: Vitest + React Testing Library — localStorage session helpers, the cookie-consent flow, and component-level rendering logic
- GitHub Actions (`.github/workflows/ci.yml`) runs typecheck + lint + tests + build for all three apps on every push/PR to `main`

---

## 🚀 Running it locally

### Backend — `http://localhost:5000`
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npm run dev             # auto-creates every table + seeds the first admin on boot
```
Optional: `node src/database/seed.js` populates demo services, case studies, testimonials, and blog posts so the site isn't empty on first run. Run `npm test` for the backend's Jest suite (no live database needed — the DB layer is mocked).

### Frontend — `http://localhost:3000`
```bash
cd frontend
npm install
npm run dev
```
Reads `NEXT_PUBLIC_API_URL` from `.env.local` (defaults to the local backend). The admin panel lives at `/admin` — sign in with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from the backend's `.env`. Run `npm test` for the frontend's Vitest suite.

### Mobile — Expo Go or a simulator
```bash
cd mobile
npm install
npx expo start
```
Reads `EXPO_PUBLIC_API_URL` from `.env`.

---

## 🔑 Environment variables (backend)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Signs both admin and customer session tokens |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | ✅ | First admin account, created once on empty DB |
| `FRONTEND_URL` | ✅ | CORS allow-list + used to build password-reset email links |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | optional | Transactional email — everything degrades gracefully (logs a warning) without it |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_BUCKET_NAME` | optional | S3 uploads — falls back to local disk storage without it |
| `ADMIN_EMAIL` | optional | Where "new lead" admin-alert emails are sent |
| `SENTRY_DSN` | optional | Backend error tracking — no-ops without it |

Frontend also reads two optional Sentry variables in `.env.local`: `SENTRY_DSN` (server-side) and `NEXT_PUBLIC_SENTRY_DSN` (client-side, must use the `NEXT_PUBLIC_` prefix since it ships to the browser).

---

## 🏗️ Design philosophy

1. **No hardcoded content.** If an admin might reasonably want to change it, it's a database row with a CRUD screen — not a string in a component.
2. **The backend is the source of truth for authorization.** Frontend permission checks (`hasPermission()`) exist for UX — hiding buttons a user can't use — but every mutating endpoint re-checks permissions server-side regardless of what the UI shows.
3. **Idempotent migrations.** `init.js` runs on every boot in every environment; it's always safe to re-run.
4. **Web and mobile stay visually in sync.** Design changes to the public site are mirrored to the mobile app's theme and screens as part of the same change, not deferred as separate work.

---

<p align="center"><sub>Built by people who've shipped their own D2C brand before selling that experience to anyone else.</sub></p>
