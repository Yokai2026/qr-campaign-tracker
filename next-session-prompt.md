# Fortsetzung: Landing-Page Modernisierung (4-Phasen-Plan)

## Session 2026-04-14 (Session 7) — Stand

**Deploy LIVE auf spurig.com.** Neueste Commits (alle auf master, gepusht):

```
86abea7  fix(seo): JSON-LD SSR-rendern statt client-injecten
99c54b6  feat(ui+a11y): Yearly-Empfohlen-Badge + höherer Badge-Kontrast
8d66996  fix(landing): Dashboard-Mock-Grid bricht auf Mobile <380px
a139081  feat(seo+a11y): SEO-Baseline + WCAG-Fixes aus Agent-Audit
58a5e06  feat(seo): JSON-LD SoftwareApplication + Offer schema (ersetzt durch 86abea7)
```

### ✅ Session 7 erledigt

**SEO-Baseline** (aus `seo-analyzer`-Agent-Report)
- `/impressum` + `/datenschutz` Title-Suffix-Bug gefixt (war "Impressum — Spurig — Spurig")
- Site-wide Title: "Spurig — QR-Code Tracking & Analytics, DSGVO-konform"
- Keywords-Array: QR Code Tracking, QR Code Analytics, DSGVO QR Code, Kampagnen Tracking, QR-Code Analyse, Offline-Marketing Tracking
- `alternates.canonical` auf allen Pages (/, /pricing, /impressum, /datenschutz)
- Explizites `export const viewport` mit themeColor (light/dark)
- `/pricing` eigene Metadata mit Preis-Anker im Title ("ab 4,99 €")
- **JSON-LD SoftwareApplication + Offer** via `src/components/seo/structured-data.tsx` — SSR-inline gerendert (nicht client-injected), auf / und /pricing eingebunden

**A11y / WCAG 2.1 AA** (aus `accessibility-tester`-Agent-Report, Settings → Custom-Domains)
- aria-label auf Trash-Delete + 4x Copy-Icon-Buttons (WCAG 4.1.2)
- role=status + aria-live=polite auf DNS-Polling-Statusblock (WCAG 4.1.3)
- Label htmlFor + Input id + aria-describedby für Hostname-Feld (WCAG 1.3.1)
- Status-Badges von text-emerald-600/amber-600 → -700 für WCAG-AA-Kontrast (Light-Mode)

**UI** (aus `ui-ux-designer`-Agent-Report)
- Billing-Toggle: "Spare 12 €" statt "−16 %" wenn Jahres-Plan aktiv (konkrete Euros > Prozent)
- "Empfohlen"-Badge über Jahres-Button wenn aktiv
- Dashboard-Mock-Grid: 2-col auf Mobile, 4-col ab sm (brach auf iPhone SE)

**Live verifiziert** via curl (08.04.2026 ~20:39):
- JSON-LD inline im HTML ✓
- "Empfohlen"-Badge ✓
- "Spare 12 €" ✓
- Mobile-Grid ✓
- Canonical + Keywords + themeColor ✓

---

## 🎯 Session 8 — Landing-Modernisierung (4-Phasen-Plan)

User-Feedback nach Screenshot-Review: "moderner, verständlicher, schöner, passender — lass dir Zeit".

**Diagnose**: Landing wirkt wie 100 andere Next.js-SaaS-Templates. Generischer Gradient-Text, Geist-Font, Lila-Akzent, 6 gleiche Feature-Cards. Nicht schlecht, aber **forgettable**.

### Phase 1 — Foundation (START HIER)
- **Display-Serif für Headings**: `Instrument Serif` oder `Fraunces` via `next/font/google`
  - Variable in `globals.css` (`--font-heading`), anwenden auf H1 + H2
  - Geist bleibt für Body/UI
- **Hero-Subline umschreiben**: aktuell emotional ("das dir wirklich gehört"), soll **Outcome-first** werden
  - Neu: *"Sieh, welches Plakat, welcher Flyer, welche Visitenkarte konvertiert — in Echtzeit, DSGVO-konform, ohne Cookie-Banner."*
- **Step-Section** (`#how-it-works`): große Step-Nummern `01 / 02 / 03` prominent, stärkerer visueller Kontrast zwischen den 3 Schritten (aktuell sehen sie aus wie normale Feature-Cards)

### Phase 2 — Bento-Features
- Statt 3×2 Grid mit gleichen Cards → **asymmetrisches Bento-Grid**
  - 1 große Card (z.B. "Analytics in Echtzeit" mit Mini-Chart-Preview)
  - 2 mittlere Cards (Geo-Tracking, Geräte-Erkennung)
  - 3 kleine Cards (A/B-Testing, CSV-Export, E-Mail-Reports)
- **Feature-Copy-Rewrite**: Outcomes statt Features
  - Aktuell: "Analytics in Echtzeit"
  - Besser: "In 30 Sekunden weißt du, ob dein Messeflyer gelesen wurde"
- Hover-States: subtle scale + border-highlight

### Phase 3 — FAQ-Section (neu)
- Accordion mit typischen Fragen:
  - "Ist das wirklich DSGVO-konform?" (mit Auftragsverarbeitung-Link)
  - "Kann ich bestehende QR-Codes importieren?"
  - "Was passiert nach den 14 Tagen Trial?"
  - "Kann ich jederzeit kündigen?"
  - "Kann ich auch ohne eigene Domain tracken?"
  - "Was unterscheidet Spurig von Google Analytics mit QR-Codes?"
- **FAQPage JSON-LD Schema** für Google Rich Results (wiederverwendbare `StructuredData`-Component)

### Phase 4 — Pricing-Refresh
- Features-Checkliste direkt in der Preis-Card sichtbar (aktuell hinter "Details"-Klick)
- Mobile-CTA-Hierarchie fixen (P1 aus UI-Agent): Primary vs Secondary visuell klarer trennen
- Vorher/Nachher-Vergleich: "Ohne Spurig" (chaotisch) vs "Mit Spurig" (strukturiert) — visueller Split

---

## 🛠 Nützliche Agents/Skills für Session 8

- **`frontend-designer`** — Mockup → Code, kennt shadcn
- **`ui-ux-designer`** — iterative Reviews nach jedem Phasen-Deploy
- **`ui-visual-validator`** — Visual-Regression nach Änderungen
- Skills: `tailwind-design-system`, `nextjs-app-router-patterns`

---

## ⚠️ Noch offen (pre-Session-7, unverändert)

### Bekannte Probleme
- **Preview-Deploys werfen 404** — 1-Zeilen-Fix in `src/lib/supabase/middleware.ts:43-73`:
  ```ts
  if (host.endsWith('.vercel.app')) return null;
  ```
- **Pre-existing Lint-Issues** (nicht Scope):
  - `report-schedules.tsx`, `scan-alerts.tsx`, `subscription-card.tsx`: React Compiler `set-state-in-effect` Errors
  - `data-table.tsx`: TanStack Table incompatible-library Warning
  - `middleware.ts:90` `options` unused Warning

### SEO-Restposten (aus Session-7-Audit, noch offen)
- **OG-Image** — `public/og-image.png` (1200×630) fehlt komplett, Link-Previews zeigen nix
- **Favicon-Set** — `favicon.ico`, `apple-touch-icon.png`, `icon.png` fehlen, Default Next.js-Favicon läuft noch
- **Pricing H1 SEO-tauglicher**: "Ein Plan. Alles drin." → "QR-Code-Tracking ab 4,99 € — ein Plan, alles drin."

### Prod-Smoke-Tests (nie final durchgegangen)
1. Landing — Pro-Feature-Section mit Phone-Mockups, iPhone-Notch
2. QR-Create `/qr-codes/new` — "Kurz-URL-Typ"-Card + Pro-Radio
3. Settings → Custom Domains — 3-Schritt-Guide (aber A11y nachgezogen)
4. Test-Subdomain `demo.spurig.com` E2E: CNAME+TXT → Auto-Polling → Verifiziert → QR → Scan → Redirect
5. Fremdhost-404-Verhalten

### Architektur-Fragen
- `bulkCreateQrCodes()` in `qr-codes/actions.ts` nutzt kein `short_host`
- `short_links.short_host`-Column (Migration 004) ohne UI/Action-Support

---

## Constraints (unverändert)
- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)
- `.env.local` ist gitignored — neue Keys niemals committen
- Privacy-first: IP-Anonymisierung, keine Drittanbieter ohne DPA

## Tipps für Session 8
- **Display-Font live testen** via `next/font/google` — kein Font-Download nötig, nur Import
- **Bento-Grid**: Tailwind CSS Grid mit `grid-template-areas` oder `col-span-2` + `row-span-2` Utilities
- **FAQ-Accordion**: shadcn `Accordion` verwenden (Radix-basiert, A11y-fertig)
- **Per Phase commiten + deployen**, nicht am Ende alles auf einmal — User will Zwischenfeedback
