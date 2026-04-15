# Next Session — Spurig Landing & Dashboard

**Stand:** 2026-04-15
**Letzte Sessions:** Session 9 — Monochrome-Pass abgeschlossen (Landing + Dashboard)

---

## Status

**Build gruen, Landing + Dashboard komplett auf monochrom (Vercel/Linear) umgestellt. Keine Violett-Reste mehr im Produktions-Code.**

### Session 9 Commits (auf master)
- `356df60` — Landing auf monochrom (Primary Near-Black, Instrument Serif raus, cream/aura weg, SectorStrip neu, not-found branded)
- `6fb7ff2` — OG + Twitter-Image auf monochrom, Hero-Copy-aligned
- `ee1892a` — Dashboard-Violett-Reste weg: chart-config / sparkline / world-map / status-badge / sidebar

### Live verifiziert in dieser Session
- `npm run build` 9.7s/11.0s grün (30 Seiten)
- Prod-Server-Screenshots 1440/375 Desktop + Mobile in Light + Dark:
  Hero, SectorStrip, Steps, Bento, Privacy, Domain, Pricing-Teaser, FAQ, Final-CTA — alle clean
- OG-Image `/opengraph-image` rendert 1200x630 PNG (67KB) monochrom — Headline & Subline matchen Landing-Hero
- Code-Grep: einzige "violet"-Matches sind Kommentare in `hero.tsx` + `chart-config.ts` (keine aktiven Styles)

### Aktive semantische Farben (unveraendert — nicht Violett)
- active/paid → emerald
- paused/trial → amber
- completed → blue
- expired → orange
- archived → slate (frueher violet)

---

## Offen / Naechste Schritte

### Phase 4 — Verifikation und Polish
1. **OG-Image live validieren** auf https://opengraph.xyz/?url=https://spurig.com (braucht Deploy der Session-9-Commits).
2. **Lighthouse-Audit** auf `/` + `/pricing` live — speziell LCP, CLS, Font-Loading, Interaction-to-Next-Paint.
3. **Dashboard visuell pruefen** mit echtem Login-State — Charts, WorldMap, Sparklines auf Analytics-Seiten, Campaign-Detail, Placement-Detail. Die Monochrom-Palette ist theoretisch okay, aber visuell-in-situ noch nicht bestaetigt.
4. **Interaction-Tests im Browser** (Phase 3 Punkt 1 aus vorherigem NEXT_SESSION):
   - FAQ-Accordion Chevron-Rotation auf Klick
   - Hero-Dashboard-Mock auf <360px
   - Features-Bento bei sm: und lg: Breakpoints
   - Domain-Showcase 3 → 2 Spalten Collapse
5. **Performance-Optimierung** — falls Lighthouse-Issues.
6. **Content-Pass** — Hero-Subline einmal laut lesen, ggf. schaerfen.

### Bekannte Kanten / Schulden
- **Pre-existing Lint-Errors** (nicht aus Redesign): `src/components/settings/*.tsx`, `shared/data-table.tsx`. Eigenes Ticket.
- **Middleware public-paths** wurde um `/opengraph-image`, `/twitter-image`, `/icon`, `/apple-icon` erweitert — kuenftige dynamic public routes daran denken.
- `.next`-Cache-Gotcha: Dev-Server vor Commit `356df60` serviert stale CSS mit violet-primary. Fix: Prozess auf Port 3000 killen (`netstat -ano | grep 3000`, `taskkill //PID X //F`) und neu starten oder `npm run start` gegen Prod-Build.

---

## Wichtige Dateien (Referenz)

**Landing:**
- Composition: `src/app/page.tsx`
- Pricing: `src/app/pricing/page.tsx`
- Components: `src/components/landing/*.tsx` (inkl. hero, sector-strip, features-bento, faq-section, final-cta)
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
2. Entscheiden: erst Lighthouse live oder erst Dashboard visuell im Login-State?
3. Falls Dashboard: via Browser einloggen und Analytics/Campaign-Routes pruefen — speziell ob monochrome Chart-Palette fuer Multi-Series (z.B. iOS/Android, Kampagnen-Vergleich) genuegend unterscheidbar ist. Falls nicht: Semantic-Accents breiter verteilen.
4. Jede Aenderung committen (`feat(landing)`, `feat(dashboard)`, `polish(ui)`).
