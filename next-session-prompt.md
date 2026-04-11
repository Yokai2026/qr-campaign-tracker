# Fortsetzung: Webhook `current_period_end`-Bug, Abo-Card-Redesign, Onboarding-Dismiss, Stripe-Live

## Session 2026-04-11 (Teil 2) — was passiert ist

### ✅ Gefixt und gepusht

**Commit `8b973b4` — Select-First-Flow im TrialEndedModal**
- Vorher: Klick auf Plan-Karte = sofortiger Redirect zu Stripe
- Jetzt: Karten sind `<button role="radio">`, User wählt aus, klickt dann "Weiter zum Checkout"
- State: `selectedPlan: 'yearly' | 'monthly'` (default yearly), `isRedirecting` für Loader
- `handleContinue()` → `window.location.href = /api/checkout?plan=${selectedPlan}`

**Commit `ed20994` — Sidebar-Badge-Fix**
- `src/components/layout/sidebar.tsx:101-106` — `tierLabel` neu:
  - `trial: 'Testversion'` (war `'Trial'`)
  - `expired: 'Abgelaufen'` (war `'Trial abgelaufen'`)
  - `paid: 'Aktiv'` (war `'Spurig'` — doppelter Brand-Name)
- Warum: Brand-Block zeigt bereits "Spurig" + Badge → zwei Mal "Spurig" nebeneinander.

### ✅ Vercel-ENVs gesetzt (Production)
Waren alle **gar nicht gesetzt** — Ursache für den 500er auf `/api/checkout`. Jetzt gesetzt:
- `STRIPE_SECRET_KEY` (sk_test_…)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_…)
- `STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2`
- `STRIPE_YEARLY_PRICE_ID=price_1TKmBGLAWTHGcAN4bswavC7l`
- `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2`
- `STRIPE_WEBHOOK_SECRET=whsec_…` (schon vorher gesetzt)

### ✅ Stripe Payment Methods für DACH optimiert
Aktiviert: **Karten, SEPA, PayPal, Apple Pay, Google Pay, EPS, TWINT, Klarna, Link, Amazon Pay**
Deaktiviert: alle Non-DACH (Bancontact, iDEAL, Przelewy24, Giropay, etc.)

### ✅ E2E-Checkout-Test erfolgreich
- Testkarte `4242 4242 4242 4242` / `12/34` / `123`
- Subscription-Row angelegt:
  - `user_id=1122b816-54ba-4774-b56c-a6cd637c4ff1`
  - `stripe_subscription_id=sub_1TL87OLAWTHGcAN4BhgNlDAf`
  - `stripe_customer_id=cus_UJlZ3KO3KYfU7J`
  - `status=active`, `plan_tier=paid`
  - `stripe_price_id=price_1TKmBGLAWTHGcAN4DDYP8qh2` (monthly)
  - `created_at=2026-04-11 20:27:06`
  - ⚠️ **`current_period_end=NULL`** — Webhook-Bug (siehe unten)

---

## ❌ Offen — HIER FORTSETZEN

### 1. [KRITISCH] Webhook `current_period_end`-Bug (Stripe API Basil)

**Datei:** `src/app/api/webhooks/stripe/route.ts` Zeile 7-10

**Problem:** Stripe API "Basil" (2025-03-31) hat `current_period_end` **weg vom Top-Level Subscription-Objekt** auf die einzelnen Line Items verschoben. Aktueller Code liest aus dem Top-Level → immer `null` in DB.

**Aktueller Code (falsch):**
```typescript
function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const v = (sub as unknown as Record<string, number>).current_period_end;
  return v ? new Date(v * 1000).toISOString() : null;
}
```

**Korrekt:**
```typescript
function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items.data[0] as unknown as Record<string, number> | undefined;
  const v = item?.current_period_end;
  return v ? new Date(v * 1000).toISOString() : null;
}
```

Funktion wird in zwei Handlern aufgerufen: `checkout.session.completed` und `customer.subscription.updated`.

**Backfill für existierendes Abo:**
Nach Fix das bereits angelegte Abo nachtragen. Via Stripe API:
```bash
# Mit STRIPE_SECRET_KEY aus .env.local
curl https://api.stripe.com/v1/subscriptions/sub_1TL87OLAWTHGcAN4BhgNlDAf \
  -u "$STRIPE_SECRET_KEY:"
```
→ `items.data[0].current_period_end` auslesen, in Unix-Epoch → ISO, dann:
```sql
UPDATE subscriptions
SET current_period_end = '<ISO>'
WHERE stripe_subscription_id = 'sub_1TL87OLAWTHGcAN4BhgNlDAf';
```
(via Supabase MCP gegen Prod)

### 2. [HOCH] Abo-Card im Settings redesignen

**Datei:** `src/components/settings/subscription-card.tsx`

**User-Feedback (2026-04-11):** "ich will auch das die einstellung besser aussieht und klarer ist für den nutzer"

**Aktueller Zustand:** Crown-Icon + "Spurig Monatlich" + Status als kleiner farbiger Text unten. Zu minimal, Info schwer zu scannen.

**Ziel-Layout (Vorschlag):**
- Plan-Name groß (z. B. "Spurig · Monatlich" als `text-[16px] font-semibold`)
- Status als rechts-ausgerichtetes Pill (z. B. grün `Aktiv`, amber `Testversion`, rot `Gekündigt`)
- Darunter: Preis + Abrechnungs-Intervall (`5,99 € / Monat` oder `4,99 € / Monat · jährlich abgerechnet`)
- Darunter: Nächste Abrechnung am `current_period_end` (Datum als `d. MMMM yyyy`, de-Locale)
- Button "Abo verwalten" → Stripe Billing Portal (unverändert)
- Wenn `cancel_at_period_end=true`: Hinweisbanner "Läuft am … aus"

**Settings-Page:** `src/app/(dashboard)/settings/page.tsx:101` rendert `<SubscriptionCard>` schon korrekt — nur die Card selbst bauen.

### 3. [MITTEL] Onboarding-Card dismissable

Unverändert aus letzter Session:
- Migration 016: `ALTER TABLE profiles ADD COLUMN onboarding_dismissed_at timestamptz`
- Server Action `dismissOnboarding()` in `src/app/(dashboard)/dashboard/actions.ts`
- `src/app/(dashboard)/dashboard/sections/performance-kpis.tsx:75` — Condition erweitern um `!profile.onboarding_dismissed_at`
- Neue Client-Wrapper-Komponente mit X-Button (top-right)

### 4. [MITTEL] Stripe Live-Modus

User-Action nötig (Stripe-Dashboard):
1. Aktivierung abschließen (Firmendaten, IBAN, Identität)
2. Im Live-Modus "Spurig"-Produkt neu anlegen
3. Live-Price-IDs notieren (monatlich 5,99 € + jährlich 59,88 €)
4. Live-Webhook einrichten: `https://spurig.com/api/webhooks/stripe`
5. Payment Methods im Live-Mode analog Sandbox aktivieren (Karten, SEPA, PayPal, Apple/Google Pay, EPS, TWINT, Klarna, Link, Amazon Pay)
6. Claude liefert: Vercel-ENVs auf `sk_live_…` / `pk_live_…` / neue Price-IDs / neues `whsec_…` umstellen

### 5. [NIEDRIG] SEPA-Webhook-Events verifizieren
SEPA ist asynchron — `payment_intent.processing` → `payment_intent.succeeded` (bis 5 Werktage später) oder `invoice.payment_failed`. Aktuell nur `checkout.session.completed` + `customer.subscription.updated` implementiert. Prüfen:
- Werden SEPA-Subs initial korrekt als `active` angelegt oder braucht `incomplete`-Status?
- `invoice.payment_failed` Handler vorhanden?

### 6. [NIEDRIG] Trial-Reset (nicht dringend)
User hat aktives Abo → irrelevant. Falls doch: `UPDATE profiles SET trial_ends_at='2026-04-22 21:52' WHERE email='tomatenkopf36@gmail.com'` — derzeit steht `2026-01-01` (vom Test).

### 7. [NIEDRIG] CRON_SECRET rotieren, Resend-Setup, Username-Uniqueness-Check, Case-Mismatch Username-Index
Unverändert aus vorheriger Session.

---

## Tech-Notizen

### DB-Zustand (Stand 2026-04-11 20:30)
- `profiles` (tomatenkopf36@gmail.com): `trial_ends_at=2026-01-01`, aktives Abo vorhanden → Hard-Paywall greift nicht
- `subscriptions`: 1 Row, aktiv, aber `current_period_end=NULL` (Bug #1)

### Vercel-Deploys
- Letzter Stand: `ed20994` (Sidebar-Badge-Fix) — Vercel auto-deployt

### Uncommitted nach Sessionende
- `chatgpt-dsgvo-prompt.md` (untracked, ignorieren)
- `chatgpt-review-prompt.md` (untracked, ignorieren)
- `.claude/worktrees/agent-a904edec` (submodule, ignorieren)

### Effective Tier Logic
`src/lib/billing/gates.ts` → `EffectiveTier = 'free' | 'trial' | 'paid' | 'expired'`. Hard-Paywall greift bei `'expired'` im `(dashboard)/layout.tsx`.

### Stripe API Version
Code nutzt aktuell Stripe SDK mit Default-API-Version. Basil (2025-03-31) hat Breaking Changes:
- `subscription.current_period_end` → `subscription.items.data[].current_period_end`
- `subscription.current_period_start` → dito
- Ggf. auch andere Stellen im Webhook/Settings prüfen, die diese Felder lesen

### Constraints
- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- 152 Unit Tests + 19 E2E Tests müssen grün bleiben
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)
- Vercel Hobby: Crons max 1x/Tag

### User-Kontext-Memory
- `feedback_migrations.md` — Migrationen via MCP gegen Prod
- `feedback_dsgvo_compliance.md` — DSGVO-Pflicht
- `project_pricing_model.md` — EIN Plan, 5,99€/Mo oder 4,99€/Mo jährlich
- `reference_secrets_location.md` — `.env.local`, sb_publishable_/sb_secret_
