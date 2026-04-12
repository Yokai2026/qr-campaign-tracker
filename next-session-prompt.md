# Fortsetzung: Stripe Live-Modus + Verifikation des Webhooks im Prod

## Session 2026-04-11 (Teil 2+3) — was passiert ist

Große Session. Alles grün, 152/152 Unit-Tests, mehrere Stripe-Basil-Bugs
gefixt, Settings-Card redesignt, Onboarding-Card dismissable, SEPA-Flow
korrekt verdrahtet.

### ✅ Commits (alle auf `origin/master`)

**`8b973b4` feat(billing): Select-First-Flow im TrialEndedModal**
Vorher: Klick auf Plan-Karte = sofortiger Redirect. Jetzt: `<button role="radio">` Karten, User wählt aus, klickt "Weiter zum Checkout".

**`ed20994` fix(ui): Sidebar-Badge 'Spurig' → 'Aktiv'**
`src/components/layout/sidebar.tsx:101-106` — `tierLabel` neu: Testversion / Aktiv / Abgelaufen / Free. Vorher stand bei aktivem Abo zweimal "Spurig" nebeneinander (Brand + Badge).

**`71d5bb2` docs: next-session-prompt**
Doku-Update.

**`f8a7199` fix(webhook): current_period_end aus items.data[0] (Basil)**
Stripe API "Basil" (2025-03-31) hat `current_period_end` von Top-Level Subscription auf die Line Items verschoben. `getPeriodEnd()` liest jetzt zuerst `sub.items.data[0].current_period_end`, Fallback Top-Level.
Bestehendes Abo `sub_1TL87OLAWTHGcAN4BhgNlDAf` via SQL auf `2026-05-11 20:27 UTC` backfilled.

**`8a360eb` feat(settings): Abo-Card Redesign**
`src/components/settings/subscription-card.tsx` komplett überarbeitet:
- Plan-Name groß (16px) mit Crown-Badge
- Preis + Abrechnungs-Intervall direkt sichtbar (5,99 €/Monat oder 4,99 €/Monat · jährlich abgerechnet)
- Status als rechts-ausgerichtetes Pill mit farbigem Dot
- Meta-Row in Sub-Box: Nächste Abrechnung, Testphase-Ende, Kündigungs-Warnung

**`165a83c` feat(dashboard): Onboarding-Card dismissable**
- Migration 016 (via MCP appliziert): `profiles.onboarding_dismissed_at timestamptz`
- Server Action `dismissOnboarding()` in `src/app/(dashboard)/dashboard/actions.ts`
- Client-Wrapper `DismissibleOnboarding` mit X-Button + optimistic hide + toast-rollback
- `PerformanceKPIs` lädt `onboarding_dismissed_at` parallel und gatet auf `showOnboarding`
- Profile-Type erweitert

**`1ce342b` fix(webhook): invoice.subscription → parent.subscription_details + payment_succeeded**
Zweiter Basil-Bug gefunden: `invoice.subscription` ist auch weg, jetzt unter `invoice.parent.subscription_details.subscription`. Neuer Helper `getInvoiceSubId()` liest neue Location mit Fallback.
Zusätzlich: `invoice.payment_succeeded`-Handler für asynchrone Zahlungsmethoden (SEPA, Klarna) — zieht aktuellen Sub-State von Stripe und schreibt `status` + `current_period_end`.

### ✅ Vercel-ENVs gesetzt (Production)
Waren alle **gar nicht gesetzt** — Ursache für den 500er auf `/api/checkout` früher in der Session. Jetzt gesetzt:
- `STRIPE_SECRET_KEY` (sk_test_…)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_…)
- `STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2`
- `STRIPE_YEARLY_PRICE_ID=price_1TKmBGLAWTHGcAN4bswavC7l`
- `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2`

### ✅ Stripe Payment Methods für DACH optimiert
Aktiviert: **Karten, SEPA, PayPal, Apple Pay, Google Pay, EPS, TWINT, Klarna, Link, Amazon Pay**
Deaktiviert: alle Non-DACH.

### ✅ E2E-Checkout-Test erfolgreich
Testkarte `4242 4242 4242 4242`, Abo angelegt, Status `active`, `current_period_end` korrekt nach Backfill.

---

## ✅ Erledigt (verifiziert 2026-04-12)

### 1. ✅ Webhook-Fix im Prod verifiziert
DB-Zustand sauber: `status=active`, `current_period_end=2026-05-11 20:27:00+00`, `cancel_at=null`. Basil-Fixes (`getPeriodEnd`, `getInvoiceSubId`) funktionieren.

### 2. ✅ Stripe Live-Modus aktiv
- `sk_live_` + `pk_live_` Keys in `.env.local` und Vercel
- Neue Live-Price-IDs: `price_1TLJ8wPrLX1jIYMmZCxIGo4t` (monatlich), `price_1TLJ8wPrLX1jIYMm1btSMHQT` (jährlich)
- Webhook-Secret gesetzt

### 5. ✅ Username-Uniqueness-Check → `e6cfa9d`
### 6. ✅ Case-insensitive Username Index → `e477176`

---

## ❌ Offen — HIER FORTSETZEN

### 3. [NIEDRIG] CRON_SECRET rotieren
War in einem Screenshot sichtbar. Neuen Wert generieren, in Vercel + `.env.local` setzen.

### 4. [NIEDRIG] Resend Setup
Für Report-Schedules, Scan-Alerts, Welcome-E-Mail.

### 5. [NIEDRIG] Uniqueness-Check beim Signup
Latenter Bug: Zwei User mit demselben Username → DB-Insert fehlt → unklare Fehlermeldung. Pre-Check oder Unique-Error-Catching mit deutscher Meldung.

### 6. [NIEDRIG] Case-Mismatch Username Index
`idx_profiles_username` ist case-sensitive, aber `resolve_username` vergleicht case-insensitive. Fix: Index als `btree(lower(username))` neu anlegen.

### 7. [NIEDRIG] Trial-Reset (wenn nötig)
User hat aktives Abo → irrelevant. Falls doch:
```sql
UPDATE profiles SET trial_ends_at='2026-04-22 21:52'
WHERE email='tomatenkopf36@gmail.com';
```
Steht derzeit auf `2026-01-01` (vom früheren Test).

---

## Tech-Notizen

### DB-Zustand (Stand 2026-04-11 23:35)
- `profiles` (tomatenkopf36@gmail.com): `trial_ends_at=2026-01-01`, aber aktives Abo vorhanden → voller Zugriff
- `subscriptions`: 1 Row, aktiv, `current_period_end=2026-05-11 20:27:00+00`

### Webhook-Events jetzt abgedeckt
- `checkout.session.completed` (Initial-Anlage via upsert)
- `customer.subscription.updated` (Status/Cancel-Updates)
- `customer.subscription.deleted` (expired)
- `invoice.payment_failed` (past_due) — **nutzt neuen getInvoiceSubId()**
- `invoice.payment_succeeded` (recovered to active) — **NEU, für SEPA/Klarna**

### Stripe API Basil Breaking Changes (in diesem Projekt relevant)
| Alt | Neu |
|---|---|
| `subscription.current_period_end` | `subscription.items.data[0].current_period_end` |
| `subscription.current_period_start` | `subscription.items.data[0].current_period_start` |
| `invoice.subscription` | `invoice.parent.subscription_details.subscription` |

Beide Stellen sind jetzt über Helper in `src/app/api/webhooks/stripe/route.ts` abstrahiert (`getPeriodEnd`, `getInvoiceSubId`). Falls weitere Basil-Bugs auftauchen, neue Helper hinzufügen.

### Effective Tier Logic
`src/lib/billing/gates.ts` → `EffectiveTier = 'free' | 'trial' | 'paid' | 'expired'`. Hard-Paywall greift bei `'expired'` im `(dashboard)/layout.tsx`. `past_due` zählt als "hat Zugriff" (grace period).

### Constraints
- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- 152 Unit Tests müssen grün bleiben
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)
- Vercel Hobby: Crons max 1x/Tag

### User-Kontext-Memory
- `feedback_migrations.md` — Migrationen via MCP gegen Prod
- `feedback_dsgvo_compliance.md` — DSGVO-Pflicht
- `project_pricing_model.md` — EIN Plan, 5,99€/Mo oder 4,99€/Mo jährlich
- `reference_secrets_location.md` — `.env.local`, sb_publishable_/sb_secret_
