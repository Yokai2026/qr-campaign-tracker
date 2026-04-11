# Fortsetzung: Stripe Live-Modus, Hard-Paywall-Test, Doppel-Trial-Fix

## Was in der vorherigen Session (2026-04-10/11) gemacht wurde

### ✅ Live deployed auf https://spurig.com
1. **5 TypeScript-Errors** aus Preismodell-Refactor gefixt (`tier === 'pro'` → `'paid' || 'trial'`):
   - `src/app/(dashboard)/links/new/page.tsx:40`
   - `src/components/ab-testing/ab-variants-editor.tsx:53`
   - `src/components/redirect-rules/redirect-rules-editor.tsx:134`
   - `src/components/layout/sidebar.tsx:101-123` (tierLabel + Badge-Farben)
2. **Trial-Transparenz auf Signup-Seite**: Info-Box "14 Tage kostenlos, danach Einführungspreis 5,99€"
3. **Welcome-Screen** nach Signup mit konkretem Trial-Ende-Datum (`src/app/signup/page.tsx`)
4. **TrialEndedModal** (`src/components/billing/trial-ended-modal.tsx`):
   - Full-screen Hard-Paywall, **nicht schließbar**
   - Eingebunden in `src/app/(dashboard)/layout.tsx` via `getSessionTier()` wenn `tier === 'expired'`
   - DSGVO-Export + Logout bleiben möglich
   - `/r/[code]` Redirects sind unblockiert (außerhalb dashboard-route)
5. **Billing-Portal-Button** "Abo verwalten" in `src/components/settings/subscription-card.tsx`
6. **Anchor-Pricing**: Streichpreis 12,99 € → 5,99 €/4,99 € als "Einführungspreis"
   - Pricing-Page mit Hero-Banner, −54%/−62% Badges, "Beliebtester Plan"-Label
   - Trial-Ended-Modal, Subscription-Card, Signup-Box konsistent
   - **PAngV-konform**: 12,99€ war der frühere Standard-Tier-Preis (Refactor 26fcba9)
7. **Middleware-Fix**: `/pricing` + `/impressum` in `APP_ONLY_PATHS` (`src/lib/supabase/middleware.ts`)
8. **NEXT_PUBLIC_APP_URL** in Vercel-Production korrigiert: war `https://qr-campaign-tracker.vercel.app`, jetzt `https://spurig.com`
9. **STRIPE_WEBHOOK_SECRET** in Vercel-Production gesetzt (`whsec_JyV50AsW1fybqEZUUZjiYQRx29wkuBwE`) + Webhook im Stripe-Sandbox-Dashboard angelegt für 4 Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### Commits dieser Session
- `2c80533` feat: Trial-UX — Transparenz, Welcome-Screen, Hard-Paywall-Modal
- `3953045` fix: /pricing und /impressum in middleware APP_ONLY_PATHS aufnehmen
- `201d916` feat: Anchor-Pricing — Streichpreis 12,99€ → 5,99€/4,99€

Branch ist lokal **5 Commits ahead von origin/master** (noch nicht gepusht).

## ❌ Offen — HIER FORTSETZEN

### 1. [HOCH] Hard-Paywall-Test
Trial-Ende simulieren via Supabase MCP gegen Prod-DB:
```sql
UPDATE profiles SET trial_ends_at = '2026-01-01' WHERE email = '<test-email>';
```
Dann auf https://spurig.com einloggen → das `TrialEndedModal` muss auf jeder Dashboard-Route erscheinen, nicht schließbar sein, und nur die drei Wege bieten: Bezahlen / DSGVO-Export / Logout.

### 2. [HOCH] End-to-End Stripe-Checkout-Test mit Webhook
Webhook ist live, also komplette E2E-Verifikation:
1. Neuen Account auf https://spurig.com/signup anlegen
2. Auf /pricing → "14 Tage kostenlos testen" klicken (monatlich + jährlich beide testen)
3. Stripe-Checkout mit Testkarte `4242 4242 4242 4242`, `12/34`, CVC `123`
4. Nach erfolgreichem Checkout: prüfen ob `subscriptions`-Row in Supabase angelegt wurde (via Webhook)
5. In Settings prüfen: "Abo & Abrechnung" zeigt korrekten Plan-Namen ("Spurig Monatlich" vs "Spurig Jährlich")
6. "Abo verwalten" Button → öffnet Stripe Billing Portal

### 3. [MITTEL] Doppel-Trial-Bug fixen
**Problem**: Neue User bekommen `profiles.trial_ends_at = now() + 14 days` (DB-Trigger aus Migration 008). Beim Stripe-Checkout setzt unser Code zusätzlich `trial_period_days: 14` → das gibt einen ZWEITEN Trial nach Abo-Abschluss.

**Fix**: In `src/lib/billing/stripe.ts` die `trial_period_days` aus `createCheckoutSession()` entfernen. Nur den Profile-Trial verwenden, der bereits beim Signup gesetzt wird.

### 4. [MITTEL] Stripe Live-Modus aktivieren
**User-Action erforderlich**, ich kann nur die Vercel-ENV-Calls machen.
1. Stripe Dashboard → oben rechts **"Aktivieren"**
2. Firmendaten + IBAN eintragen, Identität verifizieren
3. Im **Live-Modus** Produkt "Spurig" neu anlegen (Sandbox ≠ Live, separate Datenbank!)
4. Neue Live-Price-IDs notieren (analog zu Sandbox: monatlich 5,99 € + jährlich 59,88 €)
5. Live-Webhook einrichten (analog zu Sandbox, Endpoint-URL identisch: `https://spurig.com/api/webhooks/stripe`)
6. Live-Keys + neuen `whsec_` Secret an mich liefern, dann setze ich:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_MONTHLY_PRICE_ID=price_...` (Live)
   - `STRIPE_YEARLY_PRICE_ID=price_...` (Live)
   - `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...` (Live)
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (Live)
   in Vercel-Production + Redeploy.

### 5. [NIEDRIG] CRON_SECRET rotieren
War in einem Screenshot der vor-vorherigen Session sichtbar. Neuen Wert generieren und in Vercel + `.env.local` setzen.

### 6. [NIEDRIG] Resend Setup
Für E-Mail-Versand (Report-Schedules, Scan-Alerts, Welcome-E-Mail nach Signup).

## Tech-Notizen / Architektur

### Effective Tier Logic
`src/lib/billing/gates.ts` definiert `EffectiveTier = 'free' | 'trial' | 'paid' | 'expired'`. Die Hard-Paywall greift bei `'expired'`. Der Status wird live aus DB geprüft (kein Cache).

### Webhook-Signatur
`STRIPE_WEBHOOK_SECRET` ist live: `whsec_JyV50AsW1fybqEZUUZjiYQRx29wkuBwE` (Sandbox). Der Webhook-Handler in `src/app/api/webhooks/stripe/route.ts` verifiziert die Stripe-Signatur.

### Wichtige Flags & Constraints
- DSGVO-Konformität bleibt Pflicht (siehe Memory `feedback_dsgvo_compliance.md`)
- Supabase-Migrationen via MCP gegen Prod-DB (siehe Memory `feedback_migrations.md`)
- Deutsche UI, englischer Code
- 152 Unit Tests + 19 E2E Tests müssen grün bleiben
- **Redirects werden NIE blockiert** — auch nach Trial-Ende (`/r/[code]` liegt außerhalb der dashboard-route, das `TrialEndedModal` rendert nur in `(dashboard)/layout.tsx`)
- Vercel Hobby: Crons max 1x/Tag

### Bekannte Vercel-ENV-Werte
- `NEXT_PUBLIC_APP_URL=https://spurig.com` ✅
- `STRIPE_WEBHOOK_SECRET=whsec_JyV...BwE` ✅ (Sandbox)
- `STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2` (Sandbox)
- `STRIPE_YEARLY_PRICE_ID=price_1TKmBGLAWTHGcAN4bswavC7l` (Sandbox)
- `STRIPE_SECRET_KEY=sk_test_51TKlk2...` (Sandbox)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TKlk2...` (Sandbox)
