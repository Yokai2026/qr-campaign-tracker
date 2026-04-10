# Fortsetzung: Stripe-Refactor abschließen (5 TS-Fixes + Build + Tests)

## Kontext

Projekt "Spurig" — QR-Campaign-Tracker. In der vorherigen Session wurde das Preismodell vereinfacht:
- **Alt**: Zwei Tiers (Standard 12,99 €/Mo + Pro 14,99 €/Mo)
- **Neu**: EIN Plan "Spurig" mit zwei Abrechnungszyklen — **5,99 €/Mo monatlich** oder **4,99 €/Mo bei Jahresbuchung** (59,88 €/Jahr)
- **14 Tage kostenloser Trial** bleibt

## Was in der letzten Session gemacht wurde

### ✅ Fertig
1. **Stripe-Sandbox angelegt**: "Spurig" Account, Produkt "Spurig" mit zwei Preisen (monatlich 5,99 €, jährlich 59,88 €)
2. **`.env.local` aktualisiert** mit Test-Keys:
   - `STRIPE_SECRET_KEY=sk_test_51TKlk2LAWTHGcAN4NM1jircp...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TKlk2LAWTHGcAN4odEXMIYi...`
   - `STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2`
   - `STRIPE_YEARLY_PRICE_ID=price_1TKmBGLAWTHGcAN4bswavC7l`
   - `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1TKmBGLAWTHGcAN4DDYP8qh2`
   - `STRIPE_WEBHOOK_SECRET=whsec_placeholder_wird_nach_deploy_gesetzt` (TODO: später setzen)
3. **Types vereinfacht**:
   - `PlanTier = 'free' | 'paid'` (vorher `'free' | 'standard' | 'pro'`)
   - Neu: `BillingCycle = 'monthly' | 'yearly'`
4. **Code-Refactor**:
   - `src/lib/billing/stripe.ts` — `priceToTier()` returnt `'paid'`, neue `priceToBillingCycle()`
   - `src/lib/billing/checkout.ts` — `getMonthlyCheckoutUrl()` / `getYearlyCheckoutUrl()` statt `getStandardCheckoutUrl` / `getProCheckoutUrl`
   - `src/lib/billing/gates.ts` — Feature-Gates vereinfacht, alle Paid-Features auf `'paid'` gemappt, `TIER_RANK = { free: 0, trial: 1, paid: 2 }`
   - `src/lib/billing/index.ts` — neue Exports
   - `src/app/api/checkout/route.ts` — Query-Param `?plan=monthly|yearly` statt `standard|pro`
   - `src/app/(dashboard)/settings/billing-actions.ts` — `getCheckoutUrls()` returnt `{ monthly, yearly }`
   - `src/components/settings/subscription-card.tsx` — UI auf "Spurig Monatlich/Jährlich", Trial-Ende-Datum statt "noch X Tage"
   - `src/app/(dashboard)/settings/page.tsx` — neue checkoutUrls-Props
   - `src/app/pricing/page.tsx` — 2-Karten-Layout Monthly/Yearly mit "16 % sparen" Badge
5. **DB-Migrationen ausgeführt** (via Supabase MCP gegen Prod):
   - **013_stripe_migration**: `ls_*` Spalten → `stripe_*` umbenannt
   - **014_simplify_plan_tier**: Bestehende `'pro'`/`'standard'` Daten → `'paid'` gemigriert, check-constraint auf `('free', 'paid')` aktualisiert
   - 2 manuelle Test-Subscriptions (`manual_forum`, `manual_ecoalca`) wurden korrekt auf `'paid'` gemigriert

### ❌ Offen — HIER FORTSETZEN

#### 1. [HOCH] 5 TypeScript-Errors fixen (trivial)
Alle sind Vergleiche mit entfernten Tier-Werten. `npx tsc --noEmit` zeigt:

```
src/app/(dashboard)/links/new/page.tsx:40       → tier === 'pro'          → tier === 'paid'
src/components/ab-testing/ab-variants-editor.tsx:53  → tier === 'pro'    → tier === 'paid'
src/components/layout/sidebar.tsx:120           → tier === 'pro'          → tier === 'paid'
src/components/layout/sidebar.tsx:121           → tier === 'standard'     → tier === 'paid'
src/components/redirect-rules/redirect-rules-editor.tsx:134  → tier === 'pro' → tier === 'paid'
```

**Vorgehen**: Jeder Vergleich `tier === 'pro'` → `tier === 'paid'`. Bei der Sidebar prüfen ob `tier === 'standard' || tier === 'pro'` zu einem einzigen `tier === 'paid'` wird. Beachte: `'trial'` und `'expired'` sind weiter gültige `EffectiveTier`-Werte.

#### 2. [HOCH] Build + Tests grün
```bash
npx tsc --noEmit       # 0 errors
npm run lint
npm run test           # 152 Unit Tests müssen grün bleiben
npm run build
```

#### 3. [MITTEL] Lokalen Checkout-Flow testen
- `npm run dev` starten
- Auf `/pricing` → "14 Tage kostenlos testen" klicken (monatlich + jährlich beide testen)
- Wird zu Stripe Checkout weitergeleitet
- Stripe-Test-Kreditkarte nutzen: `4242 4242 4242 4242`, Ablauf `12/34`, CVC `123`
- **Webhook funktioniert nur NICHT lokal ohne Stripe CLI** — überspringe Webhook-Test für jetzt oder nutze `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verifiziere: Redirect zu `/settings?upgraded=1` funktioniert

#### 4. [MITTEL] Billing Portal Button in Settings einbauen (Task 6)
- `getBillingPortalUrl()` existiert bereits in `billing-actions.ts`
- In `subscription-card.tsx` bei `hasSub` einen Button "Abo verwalten" einbauen
- Button triggert Server Action, redirected zum Stripe Billing Portal
- Dort kann User: kündigen, Plan wechseln (monthly ↔ yearly), Rechnungen einsehen, Zahlungsmethode ändern

#### 5. [MITTEL] Trial-Ende bei Signup sichtbar machen (Task 3)
- **Bei Registrierung**: Nach Signup-Erfolg zeigen: "Dein Testzeitraum endet am DD.MM.YYYY"
- **Im Account/Settings**: Prominente Anzeige des Trial-End-Datums (nicht "noch X Tage") — in `subscription-card.tsx` bereits angefangen, prüfen ob vollständig
- Auch in Sidebar/Header wenn möglich

## Später (nach Deploy auf Vercel)

### Webhook-Secret setzen
Nach `npx vercel --prod --yes`:
1. Im Stripe-Dashboard (Sandbox): **Entwickler → Webhooks → + Endpoint**
2. URL: `https://spurig.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. **Signing Secret** kopieren (`whsec_...`)
5. In Vercel ENV + `.env.local` als `STRIPE_WEBHOOK_SECRET` eintragen (ersetzt Placeholder)

### Live-Modus aktivieren
- Stripe-Dashboard → **Aktivieren** (oben rechts)
- Firmendaten + IBAN eintragen
- Im Live-Modus Produkt "Spurig" neu anlegen (Sandbox ≠ Live)
- Neue Price-IDs + Live-Keys (`sk_live_...`, `pk_live_...`) in Vercel eintragen

### Offene TODOs aus vorheriger Session
- **Resend Setup** für E-Mail-Versand
- **CRON_SECRET** ändern (war in Screenshot sichtbar)

## Architektur-Hinweise

- **Feature-Gating**: Alle bezahlten Features prüfen `tier === 'paid' || tier === 'trial'`. Siehe `src/lib/billing/gates.ts`.
- **Trial-Modell**: Neue User bekommen `profiles.trial_ends_at = now() + 14 days` automatisch (Handler in Migration 008). Beim Stripe-Checkout ist zusätzlich `trial_period_days: 14` gesetzt — das gibt einen ZWEITEN Trial nach Abo-Abschluss. **Bekannter Bug**: Doppel-Trial möglich. Fix für später: `trial_period_days` aus `createCheckoutSession` entfernen, nur Profile-Trial verwenden.
- **Billing Cycle Detection (Client)**: `subscription-card.tsx` nutzt `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` um zu prüfen ob ein Abo monatlich oder jährlich ist. Muss in Vercel auch gesetzt werden.

## Wichtig

- DSGVO-Konformität bleibt Pflicht
- Supabase-Migrationen via MCP gegen Prod-DB
- Deutsche UI, englischer Code
- 152 Unit Tests + 19 E2E Tests müssen grün bleiben
- Redirects werden NIE blockiert — auch nach Trial-Ende (nur CREATE blockiert)
- Vercel Hobby: Crons max 1x/Tag
