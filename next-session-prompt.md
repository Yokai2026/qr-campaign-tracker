# Fortsetzung: Custom-Domain-Feature (2 Varianten mit UI-Auswahl)

## Session 2026-04-12 Teil 2 — was passiert ist

Kurze Bug-Fix-Session + gründliche Research zu Custom-Domain-Architektur.
Das große Feature (2 Varianten für QR-Kurz-URLs) ist geplant aber noch nicht
gebaut.

### ✅ Commits (auf `origin/master`)

**`c2d4fd5` fix(rls): qr_codes + qr_status_history RLS für freistehende QR-Codes**
- Migration 019 hat `placement_id` NULL-fähig gemacht
- Aber RLS-Policies prüften Ownership ausschließlich via `placement → campaign → owner_id`
- Bei `placement_id IS NULL` → `NULL IN (...)` → NULL (falsy) → alle Ops blockiert
- `/qr-codes/new` mit „freistehender QR-Code" failte mit 403 + generischem
  „Server Components render"-Error
- **Fix:** Migration `020_rls_standalone_qr_codes.sql` — Policies erweitert
  um `(placement_id IS NULL AND created_by = auth.uid())` als zweiten
  Ownership-Pfad; `qr_status_history` nutzt LEFT JOIN für Standalone-QRs
- Migration auf Prod-DB via MCP angewendet ✅

### 📚 Research-Ergebnisse (Custom-Domain-Architektur)

Nach Web-Search durch Vercel-Docs, Dub.co, Bitly-Patterns:

**Grundregel:** Der QR-Code-Scanner zeigt den String aus dem QR-Code
**exakt** an. Also muss die URL im QR die Kunden-Domain enthalten,
Tracking passiert im Redirect-Handler hinter der Domain.

**Top-3 Patterns (Dub.co-Nutzungsanteile):**
- **Kunden-Subdomain** `go.kunde.de` — 32% (Marktführer)
- **Vanity-TLD** `spurig.link` — 6,6% (gut als Default)
- **Domain-Hack** `spur.ig` — 1,9% (selten verfügbar)

**Bonus:** `.link`-TLDs bringen laut Dub.co ~30% höhere CTR.

**Sources:**
- https://vercel.com/docs/multi-tenant/domain-management
- https://vercel.com/templates/next.js/hostname-rewrites
- https://dub.co/blog/custom-domains
- https://dub.co/help/article/choosing-a-custom-domain

---

## ❌ Offen — HIER FORTSETZEN

### 🎯 Zwei-Varianten-Feature: Standard vs. Eigene Domain

Der User soll beim QR-Create zwischen zwei Modi wählen können:

**Variante A — Standard (spurig.com):**
- Zero-Setup, sofort nutzbar
- QR enthält `https://spurig.com/r/abc123`
- Scan-Preview zeigt `spurig.com`
- Saubere Tracking, alle Features

**Variante B — Eigene Domain (go.kunde.de) [Pro-gated]:**
- DNS-Setup beim Kunden (CNAME + TXT)
- QR enthält `https://go.kunde.de/abc123`
- Scan-Preview zeigt Kunden-Brand → Vertrauen
- Saubere Tracking (Redirect läuft über Vercel-Middleware)

Beide Varianten müssen in der UI **klar erläutert** werden, damit der User
weiß was er wählt.

### Bestandsaufnahme (~70% fertig)

**Bereits vorhanden:**
- ✅ Tabelle `custom_domains` + RLS (Migration 003)
- ✅ CRUD-Actions `src/app/(dashboard)/settings/domains-actions.ts`
- ✅ TXT-Verify via `node:dns/promises`
- ✅ Settings-UI `src/components/settings/custom-domains.tsx`
  (mit DNS-Anleitung + Copy-Button)
- ✅ `isKnownCustomHost()` + `getShortUrlBase()` in
  `src/lib/custom-domains.ts`
- ✅ `qr_codes.short_host` Column (persistiert pro-QR die Domain)
- ✅ Pro-Tier Gating: `checkFeatureAccess('custom_domains')`
- ✅ `is_primary` Flag pro User

**Was fehlt (Session-Scope ~3-4h):**

#### Phase 1 — Middleware-Routing (30 min)
- Neue Datei `src/middleware.ts` (existiert noch nicht auf Root-Ebene!)
- Liest `host` aus Request-Header
- Wenn ≠ primary App-Host: `isKnownCustomHost()` lookup (cached)
- Custom-Host: rewrite `/{code}` → `/r/{code}` (kürzer + eleganter als `/r/`)
- Unbekannter Host: 404
- Wichtig: Supabase-Middleware (`src/lib/supabase/middleware.ts`) muss
  integriert bleiben — nicht ersetzen, sondern kombinieren

#### Phase 2 — Vercel SDK Integration (45 min)
- `npm install @vercel/sdk`
- Neue Server-Actions in `domains-actions.ts`:
  - `addDomainToVercel(host)` — ruft `projectsAddProjectDomain()`
  - `removeDomainFromVercel(host)` — ruft `projectsRemoveProjectDomain()`
  - `verifyDomainOnVercel(host)` — ruft `projectsVerifyProjectDomain()`
- Exponential Backoff für Vercel-API-Calls (Vercel-API ist flaky in Peak-Times)
- User-Flow: Settings → „Domain hinzufügen" → DB-Insert + Vercel-API
  parallel → UI zeigt CNAME-Record → Nach DNS-Setup: Verify-Button
- Delete: DB + Vercel parallel cleanup
- ENV-Vars nötig (User setzt lokal + in Vercel Production ENVs):
  - `VERCEL_TOKEN` (von https://vercel.com/account/settings/tokens,
    Scope: Full Account, Name: `spurig-domains-api`)
  - `VERCEL_PROJECT_ID` (Dashboard → Project → Settings → General,
    beginnt mit `prj_...`)
  - `VERCEL_TEAM_ID` (nur bei Team-Account, beginnt mit `team_...`)

#### Phase 3 — Zwei-Varianten-UI im QR-Create-Flow (90 min)
Im `src/app/(dashboard)/qr-codes/new/page.tsx` neue Sektion oben:

```
┌─ Kurz-URL-Typ ────────────────────────────────┐
│  ● Standard (spurig.com/r/abc)                │
│    Keine Einrichtung nötig, sofort nutzbar    │
│                                                │
│  ○ Eigene Domain (go.kunde.de/abc)     [Pro]  │
│    Zeigt deine Brand beim Scannen             │
│    → Dropdown: verfügbare verifizierte Domains │
└────────────────────────────────────────────────┘
```

- Form-State: `url_mode: 'default' | 'custom'` + `custom_domain_id?: string`
- Server-Action `createQrCode()` nimmt die gewählte Domain und persistiert
  sie in `qr_codes.short_host`
- Bei Mode `default`: `short_host = NULL` → `getShortUrlBase()` nimmt App-URL
- Bei Mode `custom`: `short_host = <gewählter Host>`
- **Wichtig:** QR-Generation (`generateQrCode()`) nutzt bereits
  `getShortUrlBase()` — aber das muss pro-QR-Host-aware werden
  (evtl. neue Funktion `buildRedirectUrlForHost(host, shortCode)`)

#### Phase 4 — Settings-Explainer-Karte (30 min)
Oben auf der Settings-Seite oder auf der Domains-Card:
- 3 Schritte mit Icons: Domain eintragen → DNS setzen → verifizieren
- FAQ-Block: „Brauche ich das?" mit klarer Empfehlung
- Verlink-Button: „QR-Code mit eigener Domain erstellen"

#### Phase 5 — Landing-Page-Block (30 min)
Auf `/` (Marketing-Landing) neue Section:
- Überschrift: „So sehen deine Besucher den QR-Code"
- Zwei Screenshot-Mockups nebeneinander:
  - Links: iPhone-Scan zeigt `spurig.com` (Standard)
  - Rechts: iPhone-Scan zeigt `go.kunde.de` (Eigene Domain) ✨

#### Phase 6 — Test + Deploy (30 min)
- Lokal gegen eine Test-Subdomain (z.B. `test.spurig.com` selbst anlegen)
- Full-Flow: Domain hinzufügen → DNS → Verify → QR erstellen → Scannen
- Prod-Deploy

---

## Was vom User in der nächsten Session benötigt wird

Vor Start der Custom-Domain-Implementierung:

1. **Vercel-API-Credentials in `.env.local` + Vercel Production ENVs:**
   ```
   VERCEL_TOKEN=<token_von_vercel_dashboard>
   VERCEL_PROJECT_ID=prj_...
   VERCEL_TEAM_ID=team_...   # nur wenn Team-Account
   ```
   Ansage: „Token ist gesetzt" (Token NICHT im Chat posten)

2. **Entscheidung Vanity-Domain (optional, kein Blocker):**
   - Soll parallel `spurig.link` (oder ähnlich) gekauft und als Default
     gesetzt werden? Zeigt beim Scan dann `spurig.link/abc` statt
     `spurig.com/r/abc` — kürzer und mehr gebrandet.
   - Alternative: Bei `spurig.com` bleiben (aktuell gültig).

3. **Pro-Gating-Entscheidung:**
   - Aktuell ist Custom-Domain Pro-gated (`checkFeatureAccess('custom_domains')`)
   - Passt so? Oder allen freischalten? (Default-Empfehlung: Pro-gated behalten
     als Premium-Hook.)

---

## Tech-Notizen (Nachlese)

### Custom-Domain-Flow (Architektur-Skizze)

```
Kunde: DNS-Setup
  go.kunde.de  CNAME  cname.vercel-dns.com
  _spurig-verify.go.kunde.de  TXT  <verification-token>
                    ↓
Spurig-App: Vercel SDK addDomain()
                    ↓
Vercel: SSL-Cert automatisch via Let's Encrypt
                    ↓
Scan-Flow
  QR enthält: https://go.kunde.de/abc123
                    ↓
  Request an go.kunde.de/abc123
                    ↓
  Vercel-Edge → src/middleware.ts
                    ↓
  isKnownCustomHost('go.kunde.de') → true
                    ↓
  rewrite /abc123 → /r/abc123
                    ↓
  src/app/r/[code]/route.ts (bestehend)
                    ↓
  302 Redirect zu Target-URL + UTM-Params
```

### RLS-Update vom 2026-04-12 (bereits auf Prod)

Migration `020_rls_standalone_qr_codes.sql` erlaubt Standalone-QR-Codes
(placement_id NULL) für INSERT/SELECT/UPDATE/DELETE via `created_by = auth.uid()`.
Auch `qr_status_history` entsprechend angepasst.

### Constraints (unverändert)

- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)
- Eigene Middleware darf bestehende Supabase-Auth-Middleware NICHT
  ersetzen, sondern muss diese umschließen/kombinieren

### User-Kontext-Memory (aktualisiert)

- `feedback_migrations.md` — Migrationen via MCP gegen Prod
- `feedback_dsgvo_compliance.md` — DSGVO-Pflicht
- `project_pricing_model.md` — EIN Plan, 5,99€/Mo oder 4,99€/Mo jährlich
- `reference_secrets_location.md` — `.env.local`, sb_publishable_/sb_secret_
- `reference_n8n_server.md` — n8n.servrig.com (Hetzner), SMTP via Gmail
- `reference_email_setup.md` — info@spurig.com via Cloudflare Email Routing
