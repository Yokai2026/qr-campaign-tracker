# QR Campaign Tracker

A production-ready MVP for tracking offline marketing campaigns via QR codes. Manage campaigns, locations, placements, and QR codes — then track which physical placements generate the most traffic and conversions.

## Features

- **Campaign Management** — Create, edit, archive campaigns with tags and date ranges
- **Location Tracking** — Manage venues across districts with types (library, school, youth center, etc.)
- **Placement Management** — Track individual physical placements (poster, flyer, sticker) per location
- **QR Code Generation** — Generate unique QR codes per placement with PNG/SVG download
- **Short Redirect Links** — Each QR code uses a short `/r/<code>` redirect URL
- **Redirect Tracking** — Log every QR scan with device type, timestamp, and anonymized IP
- **Landing Page Events** — First-party tracking script for CTA clicks, form submissions, downloads
- **Analytics Dashboard** — Charts for scans over time, campaign/placement breakdown, conversions
- **CSV Export** — Export QR codes, placements, and event logs
- **Privacy-First** — No third-party analytics, IP anonymization, minimal data collection
- **German UI** — Admin interface with German labels

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Next.js Route Handlers + Server Actions
- **Database/Auth:** Supabase (PostgreSQL + Auth)
- **Charts:** Recharts
- **Validation:** Zod
- **QR Generation:** qrcode (PNG + SVG)

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

## Setup

### 1. Clone and install

```bash
cd qr-campaign-tracker
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from Settings > API
3. Note your **service_role key** from Settings > API (keep secret!)

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run database migration

In the Supabase SQL Editor, run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, RLS policies, and triggers.

### 5. Create your first user

In Supabase Dashboard > Authentication > Users > Add User:
- Email: your email
- Password: your password

Then in SQL Editor, promote to admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. (Optional) Load seed data

Run in SQL Editor:

```
supabase/seed.sql
```

This adds sample campaigns, locations, placements, QR codes, and events for testing.

### 7. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected admin pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── campaigns/        # Campaign CRUD
│   │   ├── locations/        # Location CRUD
│   │   ├── placements/       # Placement CRUD
│   │   ├── qr-codes/         # QR code management
│   │   ├── analytics/        # Analytics with charts
│   │   └── settings/         # User settings
│   ├── api/
│   │   ├── track/            # Page event tracking endpoint
│   │   ├── export/           # CSV export endpoint
│   │   └── qr/image/         # QR code image generation
│   ├── r/[code]/             # QR redirect handler
│   └── login/                # Login page
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Sidebar, navigation
│   └── shared/               # Reusable components
├── lib/
│   ├── supabase/             # Supabase client (browser + server)
│   ├── qr/                   # QR code generation
│   ├── tracking/             # Event tracking utilities
│   ├── auth.ts               # Auth helpers
│   ├── constants.ts          # Labels, colors
│   └── validations.ts        # Zod schemas
├── hooks/                    # React hooks
└── types/                    # TypeScript types
```

## Key Concepts

### Each Placement Gets Its Own QR Code

This is not a single-code-per-campaign system. Every physical placement (e.g., "Poster at library entrance, 2nd floor") gets a unique QR code and tracking link.

### Redirect Flow

```
QR Scan -> /r/abc123 -> Log event -> 302 Redirect -> target-url.com?utm_*&qr=abc123
```

### Event Taxonomy

**Redirect events:** `qr_open`, `qr_blocked_inactive`, `qr_expired`

**Page events:** `landing_page_view`, `cta_click`, `form_start`, `form_submit`, `file_download`

### Landing Page Tracking

Include the tracking script on your target pages:

```html
<script src="https://your-domain.com/tracker.js"></script>
```

The script auto-detects QR attribution from URL parameters. Manual tracking:

```js
window.qrTrack('cta_click', { button: 'apply-now' });
window.qrTrack('form_submit', { form: 'registration' });
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (for QR redirect links) |

## Deployment

Built for Vercel deployment:

```bash
npm run build
```

Set environment variables in Vercel dashboard, deploy, and update `NEXT_PUBLIC_APP_URL` to your production domain.

## Architecture Decisions

1. **Supabase client over Drizzle ORM** — More pragmatic for this MVP; direct Supabase client with hand-written TypeScript types reduces setup complexity.

2. **Data URL QR storage** — QR images stored as data URLs in the database for MVP simplicity. In production, migrate to Supabase Storage or S3.

3. **Server-side redirect handler** — `/r/[code]` as a Next.js route handler. Architecture supports future migration to Cloudflare Workers for edge-level performance.

4. **First-party tracking** — No third-party analytics dependencies. The tracking script uses `sendBeacon` for reliable, non-blocking event delivery.

5. **IP anonymization** — IPs are hashed with a daily salt and truncated. No raw IPs stored.

6. **German UI / English code** — Admin interface labels in German for the target audience. All code, comments, and technical identifiers in English.
