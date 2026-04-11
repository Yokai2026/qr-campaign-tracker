# Fortsetzung: Hard-Paywall-Re-Test, Onboarding-Card, Stripe-Live, Doppel-Trial-Verifikation

## Session 2026-04-11 — was passiert ist

### ✅ Gefixt und gepusht (Commit `e144dea`)
1. **Username-Bug live gefixt** — `handle_new_user`-Trigger schrieb `raw_user_meta_data->>'username'` nicht in `profiles.username`. Login per Username schlug daher fehl ("Benutzername nicht gefunden").
   - Migration `015_fix_username_in_handle_new_user.sql` direkt via Supabase MCP auf Prod appliziert (Trigger + Backfill).
   - Dein Account `tomatenkopf36@gmail.com` hat jetzt `username='David'`. Login via "David" oder E-Mail funktioniert beides.
2. **405/406-Checkout-Bug gefixt** — Beim Klick auf "Jährlich"/"Monatlich" im `TrialEndedModal` bekamst du eine tote Chrome-Seite. Ursache: `.single()` in `src/app/api/checkout/route.ts:24` warf HTTP 406, weil noch keine `subscriptions`-Row existierte. Fix: `.maybeSingle()` an 6 Stellen:
   - `src/app/api/checkout/route.ts`
   - `src/lib/billing/gates.ts` (2×)
   - `src/app/(dashboard)/settings/billing-actions.ts` (3×)
   - `src/app/(dashboard)/settings/page.tsx`
3. **Doppel-Trial-Bug gefixt** — `src/lib/billing/stripe.ts`: `trial_period_days: 14` entfernt. Nur noch der Profile-Trial (DB-Trigger) ist Source-of-Truth.
4. **`TrialEndedModal` komplett redesignt** — klare Hierarchie Header → zwei klickbare Plan-Karten (Jährlich als "Beliebt · Spare 62 %" featured) → Footer mit DSGVO-Export + Logout. Ersetzt das vorherige Layout mit gestapelten Buttons + redundanter Amber-Box.

**Branch-Status:** origin/master ist jetzt bei `e144dea`, lokal clean. Vercel sollte den Deploy automatisch triggern.

### Tests
- Unit: 152/152 grün (vor den letzten 6 Edits gelaufen — **nochmal verifizieren**)
- E2E: nicht gelaufen

### User-DB-Zustand
- `tomatenkopf36@gmail.com`: `trial_ends_at = 2026-04-22 21:52`, Trial läuft, voller Dashboard-Zugriff.
- Noch keine Subscription angelegt.

## ❌ Offen — HIER FORTSETZEN

### 1. [HOCH] Hard-Paywall-Test WIEDERHOLEN nach Deploy
Beim vorherigen Test war der Deploy noch nicht mit dem `maybeSingle`-Fix → Klick auf "Jährlich" → HTTP 405.
Nach dem Deploy (Vercel auto-triggert nach `git push`):
1. Warten bis Vercel grün ist (`vercel ls` oder im Dashboard)
2. `UPDATE profiles SET trial_ends_at='2026-01-01' WHERE email='tomatenkopf36@gmail.com'`
3. https://spurig.com/dashboard reloaden — **neues** `TrialEndedModal` sollte erscheinen (zwei Plan-Karten, Jährlich featured)
4. Klick auf "Jährlich" → sollte jetzt tatsächlich zu Stripe-Checkout redirecten (nicht 405!)
5. Screenshot, Verifikation
6. Nach Test: `UPDATE profiles SET trial_ends_at='2026-04-22 21:52'`

### 2. [HOCH] E2E Stripe-Checkout + Webhook-Test
Falls #1 den Checkout öffnet, direkt durchziehen:
- Testkarte: `4242 4242 4242 4242`, `12/34`, CVC `123`
- Nach Checkout: `SELECT * FROM subscriptions WHERE user_id='1122b816-54ba-4774-b56c-a6cd637c4ff1'` prüfen — sollte eine Row geben, Status `active` (NICHT `on_trial`, weil Doppel-Trial-Fix)
- Settings → "Abo & Abrechnung" sollte "Spurig Jährlich" zeigen
- "Abo verwalten"-Button → Stripe Billing Portal öffnen

### 3. [MITTEL] Onboarding-Card dismissable machen
User-Feedback aus letzter Session: "Wenn man will diesen Text überspringen, dann wird er nicht mehr angezeigt." Card liegt in `src/app/(dashboard)/dashboard/sections/performance-kpis.tsx:75` (Rendering-Condition `!hasAnyData`). Aktuell kein X-Button.

**Plan:**
- Migration 016: `ALTER TABLE profiles ADD COLUMN onboarding_dismissed_at timestamptz`
- Server Action `dismissOnboarding()` in `src/app/(dashboard)/dashboard/actions.ts` (neu): setzt Feld, `revalidatePath('/dashboard')`
- Performance-kpis.tsx: Condition erweitern um `!profile.onboarding_dismissed_at`
- Neue Client-Wrapper-Komponente `<DismissibleOnboarding>` mit X-Button (top-right), optimistic hide
- Zusätzlich: "Tour überspringen"-Text-Link neben dem Tipp im Footer der Card

### 4. [MITTEL] Stripe Live-Modus aktivieren
Unverändert aus vorheriger Session. Braucht User-Action:
1. Stripe Dashboard → "Aktivieren" → Firmendaten, IBAN, Identität
2. Im Live-Modus "Spurig" neu anlegen (Sandbox ≠ Live)
3. Live-Price-IDs notieren (monatlich 5,99 € + jährlich 59,88 €)
4. Live-Webhook einrichten, Endpoint: `https://spurig.com/api/webhooks/stripe`
5. Claude die Live-Keys + `whsec_` liefern, dann Vercel-ENV setzen:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_MONTHLY_PRICE_ID=price_...` (Live)
   - `STRIPE_YEARLY_PRICE_ID=price_...` (Live)
   - `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...` (Live)
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (Live)

### 5. [NIEDRIG] CRON_SECRET rotieren
War in Screenshot sichtbar. Neuen Wert generieren, in Vercel + `.env.local` setzen.

### 6. [NIEDRIG] Resend Setup
Für Report-Schedules, Scan-Alerts, Welcome-E-Mail.

### 7. [NIEDRIG] Uniqueness-Check beim Signup
Latenter Bug: Wenn zwei User denselben Username wollen, schlägt erst der DB-Insert fehl (Unique Partial Index `idx_profiles_username`) → Signup bricht mit unklarer Fehlermeldung. Lösung:
- Client-side: vor Submit `resolve_username(input)` prüfen
- Server-side: Signup-Action mit Pre-Check oder Unique-Error-Catching mit deutscher Meldung

### 8. [NIEDRIG] Case-Mismatch Username Index
`idx_profiles_username` ist case-sensitive (`btree(username)`), aber `resolve_username` vergleicht case-insensitive (`lower(username)`). Zwei User könnten als "david" und "David" nebeneinander existieren, `resolve_username` gäbe dann nur den ersten per `LIMIT 1` zurück. Fix: Index neu anlegen als `btree(lower(username))`.

## Tech-Notizen

### Effective Tier Logic
`src/lib/billing/gates.ts` → `EffectiveTier = 'free' | 'trial' | 'paid' | 'expired'`. Hard-Paywall greift bei `'expired'` im `(dashboard)/layout.tsx`.

### Webhook
- Endpoint: `src/app/api/webhooks/stripe/route.ts`
- `STRIPE_WEBHOOK_SECRET=whsec_JyV50AsW1fybqEZUUZjiYQRx29wkuBwE` (Sandbox, in Vercel gesetzt)

### Vercel-ENV (Sandbox)
- `NEXT_PUBLIC_APP_URL=https://spurig.com` ✅
- `STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2`
- `STRIPE_YEARLY_PRICE_ID=price_1TKmBGLAWTHGcAN4bswavC7l`

### Constraints
- DSGVO-Konformität bleibt Pflicht
- Supabase-Migrationen via MCP gegen Prod-DB
- Deutsche UI, englischer Code
- 152 Unit Tests + 19 E2E Tests müssen grün bleiben
- Redirects werden NIE blockiert (`/r/[code]` liegt außerhalb dashboard-route)
- Vercel Hobby: Crons max 1x/Tag

### User-Kontext-Memory
- `feedback_migrations.md` — Migrationen via MCP gegen Prod
- `feedback_dsgvo_compliance.md` — DSGVO-Pflicht
- `project_pricing_model.md` — EIN Plan, 5,99€/Mo oder 4,99€/Mo jährlich
- `reference_secrets_location.md` — `.env.local`, sb_publishable_/sb_secret_
