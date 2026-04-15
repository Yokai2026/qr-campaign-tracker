# Next Session — Spurig Landing Redesign

**Stand:** 2026-04-15
**Letzte Sessions:** Session 8 Phase 2 — FAQ + Pricing-Page + OG/Icon-Set

---

## Status

**Build + Lint grün. Alle Änderungen live auf master gepusht.**

### Session 8 Phase 1 (bereits erledigt, Commit `bef2670`)
- Design-Tokens + Instrument Serif
- Landing refactored: Monolith → 10 Section-Components + 3 UI-Helper
- Alle Sections neu (Hero, Steps, Bento, Privacy, Domain, Pricing-Teaser, Final-CTA, Footer)

### Session 8 Phase 2 (neu erledigt)
**Commit `4b1cb5c` — FAQ + Pricing:**
- `FaqSection` (`src/components/landing/faq-section.tsx`) — 8 Q&A als native `<details>/<summary>`, zero-JS, a11y-konform, erstes Item `open` by default
- `faqPageLd(items)` Helper in `structured-data.tsx` — FAQPage JSON-LD
- Landing: FAQ zwischen `PricingTeaser` + `FinalCTA`, zweites JSON-LD-Script
- `/pricing` komplett auf neues Section-System gehoben: `SiteHeader/SiteFooter`, `SectionEyebrow + SectionHeading`, Aura+Dot-Grid-Hero, wiederverwendete `FaqSection` + `FinalCTA`

**Commit `87a0f3c` — OG + Icons:**
- `src/app/opengraph-image.tsx` + `twitter-image.tsx` — 1200×630 PNG via `next/og`, editorial Spurig-Design (cream bg, violet aura, serif italic, feature chips)
- `src/app/icon.svg` — statisches dunkles Rounded-Square mit QR-Mark
- `src/app/apple-icon.tsx` — 180×180 PNG via ImageResponse
- `organizationLd.logo` → `/icon.svg` umgestellt
- Middleware erweitert um `/opengraph-image`, `/twitter-image`, `/icon`, `/apple-icon` als public routes (vorher 307 → /login)

### Getestet live (via curl gegen dev server)
- `/` 200, `/pricing` 200, `/datenschutz` 200, `/impressum` 200, `/login` 200
- 8 FAQ-`<details>` im SSR-HTML, erstes mit `open=""`
- FAQPage JSON-LD mit allen 8 Fragen (Landing + Pricing)
- `/opengraph-image` 200 PNG 116KB (gültige Magic-Bytes)
- `/twitter-image` 200 PNG 116KB
- `/apple-icon` 200 PNG 11KB
- `/icon.svg` 200 SVG 526B
- `og:image`, `twitter:image`, `og:image:width/height` korrekt in HTML-Head

---

## Offen / Nächste Schritte

### Phase 3 — Polish & Feinschliff
1. **Visuelle Browser-Kontrolle** (nie mit echtem Browser gemacht) — Desktop Chrome/Safari + iPhone-Viewport.
   - Hero-Dashboard-Mock auf sehr kleinen Screens (<360px)
   - Features-Bento bei `sm:` und `lg:` Breakpoints
   - Domain-Showcase 3→2 Spalten Collapse
   - FAQ-Accordion Chevron-Rotation bei Click
2. **Dark-Mode-Pass** — jede Section einmal im Dark Mode durchsehen.
3. **OG-Image live validieren** via https://opengraph.xyz/?url=https://spurig.com — Layout check auf Twitter/LinkedIn/Slack-Preview.
4. **Testimonials / Social Proof** — weiterhin offen. Ghost-Logos oder "Geeignet für …"-Sektor-Zeile zwischen Hero + Steps.
5. **Motion-Enhancement** (optional) — `motion`-Scroll-Reveal für Bento-Cards.
6. **Performance-Audit** — Lighthouse, speziell Font-Loading + Inline-SVG-Größen.
7. **Content-Pass** — Copy einmal laut lesen, Hero-Subline ggf. schärfen.
8. **`not-found.tsx`** auf Spurig-Branding heben — ungeprüft, vermutlich noch Next-Default.

### Bekannte Kanten / technische Schulden
- **Pre-existing Lint-Errors** (nicht durch Redesign): `src/components/settings/*.tsx`, `shared/data-table.tsx`. Eigenes Ticket.
- **Dashboard-App-Screens** (intern) weiterhin alter Look.
- **Middleware public-paths** wurde für Images erweitert — künftige dynamische Metadata-Routes daran denken.

---

## Wichtige Dateien (Referenz)

- Landing Composition: `src/app/page.tsx` (~30 LoC)
- Pricing: `src/app/pricing/page.tsx`
- Landing Components: `src/components/landing/*.tsx` (11 Dateien inkl. faq-section)
- Section Helpers: `src/components/ui/{section-eyebrow,section-heading,grid-backdrop}.tsx`
- Design Tokens: `src/app/globals.css` (cream, ink, aura, dot-grid, line-grid, card-lift, font-display)
- SEO: `src/components/seo/structured-data.tsx` — `softwareApplicationLd`, `faqPageLd(items)`, `organizationLd`
- OG/Icons: `src/app/{opengraph-image,twitter-image,apple-icon}.tsx` + `src/app/icon.svg`
- Middleware public-paths: `src/lib/supabase/middleware.ts:107`

---

## Startanweisung für nächste Session

1. `REDESIGN_PLAN.md` + diese Datei + `NEXT_SESSION_PROMPT.md` lesen.
2. `git log --oneline -6` — letzter Stand.
3. `npm run dev` + echter Browser-Check auf `/` + `/pricing` (Desktop + Mobile).
4. Dark-Mode-Toggle prüfen (next-themes, vermutlich System-Preference).
5. Danach Phase 3 Punkt 3 (OG-Preview validieren) oder Punkt 4 (Testimonials).
