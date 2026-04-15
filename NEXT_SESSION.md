# Next Session — Spurig Landing & Dashboard

**Stand:** 2026-04-15
**Letzte Sessions:** Session 10 — Phase 4 Interaction-Tests + Lighthouse lokal

---

## Status

**Build gruen, Monochrom-Pass stabil. Header-Overflow-Bug (320px) gefixt. Lighthouse Desktop 100/100, Mobile LCP ueber Ziel.**

### Session 10 Commits (auf master)
- `TBD` — feat(header): Anmelden-Button <360px ausblenden (Overflow-Fix iPhone SE 1)

### Session 10 Verifikation
- **Interaction-Tests (Playwright gegen Prod-Build Port 3100)**:
  - FAQ-Chevron: `rotate: 180deg` wenn `[open]` (Tailwind 4 CSS-`rotate` property, nicht `transform`)
  - Hero-Mock 320/360px: Mock selbst sauber, Overflow kam aus Header
  - Features-Bento 375/640/1024/1440: Layout `1-col → sm:6-col → lg:4+2/3+3-span` greift
  - Domain-Showcase: `<md` 1-Spalte (Arrow `hidden`), `md+` `[1fr_auto_1fr]` 3-Spalten
- **Horizontal-Overflow an Viewports 320/340/360/375/414px**: jetzt alle sauber (vorher 320px = +7px)
- **Lighthouse lokal (Prod-Build auf :3100)**:
  - `/` Desktop: **100/100** — LCP 0.6s / FCP 0.3s / CLS 0 / TBT 0ms
  - `/pricing` Desktop: **100/100** — LCP 0.6s / FCP 0.3s / CLS 0 / TBT 0ms
  - `/` Mobile: **94/100** — LCP 3.1s / FCP 1.2s / CLS 0 / TBT 27ms
  - `/pricing` Mobile: **86/100** — LCP 4.1s / FCP 1.2s / CLS 0 / TBT 70ms
- **Lighthouse-Bottleneck Mobile**: 26KB render-blocking `_next/static/chunks/0.o3aj442nzgw.css` (Tailwind-Main-Bundle) kostet ~330-370ms vor FCP.

---

## Offen / Naechste Schritte

### Phase 5 — Performance-Optimierung Mobile LCP

LCP-Mobile ueber 2.5s Ziel. Root-Cause bei beiden Mobile-Werten: render-blocking 26KB Tailwind-CSS-Chunk. Optionen (in Reihenfolge zunehmender Komplexitaet):

1. **Font-Preload** — `<link rel=preload>` fuer Geist/Geist Mono in `app/layout.tsx`. Aktuell ueber `next/font` (was eigentlich automatisch preloaden sollte). Verifizieren ob beide Varianten wirklich preloaden.
2. **Critical-CSS-Inlining** — Next 16 App Router macht dies NICHT automatisch fuer alle CSS (nur `experimental.optimizeCss` wenn manuell). Mal mit `experimental.optimizeCss: true` in `next.config.mjs` testen — braucht `critters`-Install, evtl. Build-Breaking.
3. **Tailwind-Chunk-Splitting** — Above-Fold-Styles separat von Below-Fold. Aufwand hoch, Ertrag unklar.
4. **LCP-Element identifizieren** — Lighthouse-Report vollstaendig lesen (nicht nur Top-Level-Audits) um zu wissen was genau LCP ist (Hero-Headline? Dashboard-Mock-Frame?). Dann gezielt preloaden.

### Offen aus Phase 4 (noch nicht erledigt)
1. **OG-Image live validieren** auf https://opengraph.xyz/?url=https://spurig.com (braucht Deploy Session-9/10-Commits).
2. **Dashboard visuell pruefen** mit echtem Login-State — Charts, WorldMap, Sparklines auf Analytics, Campaign-Detail, Placement-Detail. Monochrome Chart-Palette fuer Multi-Series (iOS/Android-Vergleich, Kampagnen-Vergleich) unterscheidbar genug? Falls nicht: semantic accents breiter verteilen.
3. **Content-Pass** — Hero-Subline einmal laut lesen, ggf. schaerfen.

### Bekannte Kanten / Schulden
- **Pre-existing Lint-Errors** (nicht aus Redesign): `src/components/settings/*.tsx`, `shared/data-table.tsx`. Eigenes Ticket.
- **Middleware public-paths** wurde um `/opengraph-image`, `/twitter-image`, `/icon`, `/apple-icon` erweitert — kuenftige dynamic public routes daran denken.
- `.next`-Cache-Gotcha / Turbopack-Dev: Dev-Server-CSS-Chunk kann 500er liefern (Tailwind kompiliert nicht), dann rendert die Seite unstyled. Fix: `netstat -ano | grep 3000`, `taskkill //PID X //F`, dann `npm run build && PORT=3100 npx next start` fuer stabile Visual-Tests.

---

## Wichtige Dateien (Referenz)

**Landing:**
- Composition: `src/app/page.tsx`
- Pricing: `src/app/pricing/page.tsx`
- Components: `src/components/landing/*.tsx` (inkl. hero, site-header, sector-strip, features-bento, faq-section, final-cta)
- UI-Helpers: `src/components/ui/{section-eyebrow,section-heading,grid-backdrop}.tsx`
- Design Tokens: `src/app/globals.css` (:root + .dark, beide pure-neutral)

**SEO / Metadata:**
- Structured Data: `src/components/seo/structured-data.tsx`
- OG/Icons: `src/app/{opengraph-image,twitter-image,apple-icon}.tsx` + `src/app/icon.svg`

**Dashboard-Color-System:**
- Chart-Config: `src/lib/chart-config.ts` (CHART_PALETTE neutral-first + semantic accents)
- Shared: `src/components/shared/{sparkline,world-map,status-badge}.tsx`
- Layout: `src/components/layout/sidebar.tsx` (tier-Badge)

---

## Startanweisung fuer naechste Session

1. `NEXT_SESSION.md` (diese Datei) + `git log --oneline -6` lesen.
2. Entscheiden: Mobile-LCP-Fix (Phase 5) oder Dashboard-visuell-mit-Login (Phase 4 Punkt 2)?
3. Falls Dashboard: via Browser einloggen, Analytics/Campaign-Routes pruefen, speziell Chart-Palette-Unterscheidbarkeit bei Multi-Series.
4. Falls LCP: Zuerst `largest-contentful-paint-element` im Lighthouse-Report nachschauen, dann gezielt fix.
5. Jede Aenderung committen (`feat(landing)`, `feat(dashboard)`, `polish(ui)`, `perf(landing)`).
