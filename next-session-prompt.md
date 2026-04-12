# Fortsetzung: Landing Page + finale Launch-Vorbereitung

## Session 2026-04-12 — was passiert ist

Mega produktive Session. Stripe komplett live, E-Mail-Infrastruktur selbst gehostet
über n8n, Rechtliches aktualisiert, SEO-Grundlagen gesetzt. Die App ist zu ~90%
launch-ready. Fehlt noch: Landing Page.

### ✅ Commits (alle auf `origin/master`)

**`88f14a4` feat(email): Resend durch n8n-Webhook ersetzen**
- Resend-Package + `src/lib/email/resend.ts` entfernt
- Neu: `src/lib/email/send.ts` → `fetch()` an n8n-Webhook
- Beide Cron-Routes (`check-alerts`, `reports`) nutzen jetzt `sendEmail()`
- n8n-Workflow als JSON: `n8n-workflows/spurig-email.json`
- ENV: `N8N_EMAIL_WEBHOOK_URL=https://n8n.servrig.com/webhook/spurig-email`

**`4af7569` fix(legal): kontakt@ → info@spurig.com + Datenschutz-Update**
- Impressum: E-Mail auf `info@spurig.com`
- Datenschutz: Resend Inc. raus, Hetzner Online GmbH rein

**`9aa0faa` fix(launch-ready): Resend-Warnung + SEO + env.example**
- Veraltete RESEND_API_KEY-Warnung in Settings entfernt
- `.env.local.example` komplett (Stripe, Cron, n8n)
- Root-Layout: OG-Tags, Twitter Cards, robots, title-template
- `/robots.txt` via `src/app/robots.ts`
- `/sitemap.xml` via `src/app/sitemap.ts`

### ✅ E-Mail-Infrastruktur (selbst gehostet, keine Drittanbieter-Kosten)

**Eingehend** (Cloudflare Email Routing, kostenlos):
- `info@spurig.com` → forwardet an `davidwhiteha@gmail.com`
- Destination: `davidwhiteha@gmail.com` verifiziert
- MX/TXT-Records von Cloudflare automatisch gesetzt

**Ausgehend aus Gmail** ("Senden als"):
- Gmail sendet als `info@spurig.com` via `smtp.gmail.com:587`
- App-Passwort: siehe Gmail-Einstellungen

**Ausgehend aus der App** (n8n auf Hetzner):
- n8n: `https://n8n.servrig.com`
- Credential: "Spurig SMTP" (Gmail SMTP, Port 587, SSL/TLS aus)
- Workflow: "Spurig — E-Mail senden" (Webhook POST → Send Email)
- From: `info@spurig.com`
- Webhook-URL: `https://n8n.servrig.com/webhook/spurig-email`
- Payload: `{ to, subject, html }`

### ✅ Vercel ENVs (Production)
Alle gesetzt:
- `STRIPE_SECRET_KEY=sk_live_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `STRIPE_MONTHLY_PRICE_ID=price_1TLJ8wPrLX1jIYMmZCxIGo4t`
- `STRIPE_YEARLY_PRICE_ID=price_1TLJ8wPrLX1jIYMm1btSMHQT`
- `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1TLJ8wPrLX1jIYMmZCxIGo4t`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `CRON_SECRET=Jw4uy1SccgT9Zdz49MLYgYY67E4VJwT9o/KI9l4Na7Y=`
- `N8N_EMAIL_WEBHOOK_URL=https://n8n.servrig.com/webhook/spurig-email`

---

## ❌ Offen — HIER FORTSETZEN

### 1. [KRITISCH] Landing Page bauen

Root `/` redirected aktuell zum Dashboard. Für Verkauf brauchen wir eine echte
Marketing-Landing-Page die unauthentifizierte Besucher überzeugt.

**Brief:**
- Hero: Headline + Subheadline + CTA ("14 Tage kostenlos testen")
- Problem/Lösung: QR-Code-Tracking ohne Drittanbieter (DSGVO-Vorteil hervorheben)
- Features-Grid: Kampagnen, Placements, QR-Codes, Analytics, Geo/Device
- Preise (kurzer Block mit Link zu `/pricing`)
- Sozialer Beweis (später, wenn Kunden da sind — jetzt weglassen oder generisch)
- Footer: Impressum, Datenschutz, Kontakt

**Wichtig:** Root-Route `/` muss zur Landing Page zeigen, **aber authentifizierte
User weiterhin zum Dashboard routen**. Aktuell gibt es einen Redirect —
der muss bedingt werden (nur wenn eingeloggt).

Check: `src/app/page.tsx` existiert das überhaupt? Oder redirected die
`middleware.ts` das direkt? Anschauen vor Umbau.

**Design-Referenz:** Bestehender Look ist clean, minimalistisch, primary-purple.
Tailwind 4 + shadcn/ui. Nicht zu verspielt.

### 2. [SOLLTE GEFIXT] n8n-Webhook Error-Handling

`src/lib/email/send.ts` hat minimales Error-Handling. Wenn n8n down ist, failen
Reports/Alerts still. Optionen:
- Retry-Logik (z.B. 3x mit exponential backoff)
- Fallback: error ins Supabase-Log-Table schreiben
- Admin-Notification wenn viele Fails in Folge

### 3. [NICE TO HAVE] Stripe-Preise dynamisch

Preise sind aktuell hardcoded in UI (`5,99 €`, `4,99 €`). Wenn sich Preise in
Stripe ändern, driftet die UI. Fix: beim Build oder beim Request vom Stripe-API
fetchen und cachen.

### 4. [NICE TO HAVE] RLS-Policies-Audit

Migrations existieren, aber Policies nie systematisch reviewed. Supabase MCP
hat einen Security-Advisor — einmal laufen lassen:
```
mcp__supabase__get_advisors type=security
```

---

## Tech-Notizen

### Audit-Ergebnis Status (2026-04-12)
Das Full-Site-Audit ergab 85% → jetzt nach den Fixes ~90% launch-ready.
- ✅ Auth-Flow sauber
- ✅ Stripe solide (Basil-Fixes, SEPA, past_due recovery)
- ✅ DSGVO-konform (IP-Anonymisierung, kein GA, kein FB Pixel, keine externen Schriftarten)
- ✅ Security Headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate Limiting auf Redirects
- ✅ SEO-Grundlagen (robots, sitemap, OG)
- ❌ Keine Landing Page (Blocker für Verkauf)

### E-Mail-System-Flow
```
App → fetch() → n8n.servrig.com/webhook/spurig-email
                   ↓
                 n8n Workflow (Webhook → Send Email)
                   ↓
                 smtp.gmail.com:587 (als info@spurig.com)
                   ↓
                 Empfänger
```

### Cloudflare Email Routing
Empfangene Mails an `info@spurig.com` → `davidwhiteha@gmail.com`.
MX-Records: von Cloudflare automatisch gesetzt beim Enable.

### Constraints (unverändert)
- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)
- Vercel Hobby: Crons max 1x/Tag — daher n8n als Alternative möglich für feinere Schedules

### User-Kontext-Memory (aktualisiert)
- `feedback_migrations.md` — Migrationen via MCP gegen Prod
- `feedback_dsgvo_compliance.md` — DSGVO-Pflicht
- `project_pricing_model.md` — EIN Plan, 5,99€/Mo oder 4,99€/Mo jährlich
- `reference_secrets_location.md` — `.env.local`, sb_publishable_/sb_secret_
- `reference_n8n_server.md` — n8n.servrig.com (Hetzner), SMTP via Gmail
- `reference_email_setup.md` — info@spurig.com via Cloudflare Email Routing + Gmail + n8n
