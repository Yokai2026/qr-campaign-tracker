# Next Session — Spurig Landing Redesign

**Stand:** 2026-04-15
**Letzte Session:** Session 8 — Editorial Premium SaaS Redesign (Phase 1)

---

## Status

**Build & Lint grün.** Neue Landing in Production-tauglichem Zustand.

### Was erledigt ist
1. `REDESIGN_PLAN.md` geschrieben (Bestandsanalyse, Designrichtung, Prioritäten, DoD).
2. **Design-System upgegradet:**
   - `Instrument Serif` als Display-Font eingebunden (`layout.tsx`)
   - Neue Tokens: `cream`, `ink`, `subtle` + Elevation-Scale (`shadow-xs/sm/md/lg/glow`)
   - Neue Utilities: `.bg-dot-grid`, `.bg-line-grid`, `.bg-aura`, `.bg-grain`, `.mask-fade-y`, `.card-lift`, `.text-gradient-violet`, `.font-display`, `.tabular`
   - Primary leicht intensiviert (`oklch 0.52 0.17 285`)
3. **Landing refactored:** Monolith (630 LoC) → 10 Section-Components + 3 UI-Helper
4. **Alle Sections neu:**
   - `SiteHeader` — eigenes SVG-Logo, feinere Nav mit 4. Link (So funktioniert's)
   - `Hero` — Serif-Italic-Headline-Akzent, Aura+Dot-Grid-Backdrop, Premium-CTAs
   - `HeroDashboardMock` — realistisches Multi-Panel-Dashboard (KPIs mit Sparklines, Chart mit Comparison-Line, Top-Kampagnen, Insight-Strip, schwebende Live-Chips)
   - `StepsSection` — große Serif-Numerals, Cream-Background, dashed Mono-Details, Connector-Lines
   - `FeaturesBento` — 5-Card-Bento (1 Hero mit Mini-Chart, 1 Ink-dark-Card mit Pulse-Dot, 3 Feature-Cards mit Stats/Chips/Bars)
   - `PrivacySection` — 2-Spalten mit Editorial-Quote + Mono-DSGVO-Badges + EU-Card
   - `DomainShowcase` — 3-Spalten-Layout (Phone → Arrow → Phone) mit richerem Phone-Mock
   - `PricingTeaser` — 2-Spalten mit Inline-Feature-Liste (8 Features) + Trust-Bar
   - `FinalCTA` — Ink-Card mit Radial-Gradient-Mesh, Pulse-Status, Live-Scan-Preview
   - `SiteFooter` — 3 Spalten + Brand-Story + Status-Dot + Italic-Tagline

### Dateien geändert / erstellt
- `src/app/layout.tsx` (Instrument_Serif + Variable)
- `src/app/globals.css` (komplett neu strukturiert, neue Tokens + Utilities)
- `src/app/page.tsx` (auf ~25 Zeilen reduziert, nur Composition)
- **Neu `src/components/landing/`:** site-header, hero, hero-dashboard-mock, steps-section, features-bento, privacy-section, domain-showcase, pricing-teaser, final-cta, site-footer
- **Neu `src/components/ui/`:** section-eyebrow, section-heading, grid-backdrop
- `REDESIGN_PLAN.md`, `NEXT_SESSION.md`, `NEXT_SESSION_PROMPT.md`

### Design-Entscheidungen (wichtig)
- **Typografie-Pattern:** Sans-Bold Headline + Serif-Italic Accent (nicht Gradient-Text für Haupt-Headlines).
- **Farbpalette:** Muted Violet Primary + Cream Surfaces + Deep Ink Dark — editorial, kein Spielzeug-Lila.
- **Keine neuen Libraries** installiert — Motion/Lucide/shadcn reichen vollständig.
- **Motion minimal:** nur CSS-basiert (`stagger-children`, `.card-lift`, `pulseDot` keyframe).
- **Responsive:** Bento kollabiert auf Mobile sauber, Phone-Showcase wird 2-spaltig (Arrow versteckt).

---

## Offen / Nächste Schritte (5-10 konkrete Aufgaben)

### Phase 2 — Feinschliff (priorisiert)
1. **Live-Preview im Browser testen** (`npm run dev`) — visuelle Checks Desktop + Mobile, speziell:
   - Hero-Dashboard-Mock auf sehr kleinen Screens (<360px)
   - Features-Bento bei `sm:` und `lg:` Breakpoints
   - Domain-Showcase 3-Spalten → 2-Spalten Collapse
2. **Dark-Mode-Pass** — jede Section einmal im Dark Mode durchsehen (Cream, Ink, Gradient-Mesh).
3. **Pricing-Seite (`/pricing`)** — noch alte Struktur, könnte vom neuen Section-System profitieren.
4. **FAQ-Section hinzufügen** (war in Session 8 Plan Phase 3) — als neue Component `faq-section.tsx` zwischen Pricing + FinalCTA, plus `FAQPage` JSON-LD Schema.
5. **OG-Image generieren** für Social-Shares (statischer oder dynamisch via `opengraph-image.tsx`).
6. **Favicon-Set** (bisher fehlt komplett) — 16/32/180/512 SVG + ICO.
7. **Motion-Library-Enhancement** (optional): `motion` für Scroll-Reveal der Bento-Cards und Hero-Dashboard (sparsam, nur View-Enter).
8. **Testimonials/Logos-Sektion** — Social Proof fehlt noch ganz. Falls noch keine Logos da sind: "Genutzt von …"-Platzhalter mit 4-6 ghost-Logos.
9. **Performance-Audit** — Lighthouse-Scan gegen Hero (Inline-SVG-Größen, Font-Loading-Strategy — Instrument Serif `display: swap` steht, aber Preload prüfen).
10. **Content-Pass** — Copy einmal laut lesen, Spurig-Tone konsistent machen. Subline des Hero könnte noch schärfer werden.

### Bekannte Kanten / technische Schulden
- **Pre-existing Lint-Errors** (nicht durch Redesign!): `src/components/settings/*.tsx` (3 × `react-hooks/set-state-in-effect`). Eigenes Ticket.
- **Pricing-Seite** (`/pricing`) bisher nicht angefasst.
- **Dashboard-App-Screens** (intern) bisher nicht redesignt — nur Landing.

---

## Wichtige Projekt-Konventionen

- Deutsche UI, englischer Code.
- `@/` = `src/`
- Server-Components default, `"use client"` nur bei Interaktivität.
- `oklch(...)` statt HEX — für bessere Farbkonsistenz und Dark-Mode-Portabilität.
- Neue UI-Utilities immer als shared Component in `src/components/ui/` ablegen.
- Display-Serif NUR als Inline-Akzent, nicht für Body oder Nav.

---

## Startanweisung für nächste Session

1. `REDESIGN_PLAN.md` lesen.
2. Diese Datei lesen.
3. `NEXT_SESSION_PROMPT.md` als Ausgangs-Prompt nehmen.
4. Mit Phase 2 Punkt 1 (Live-Preview + Mobile-Checks) starten.
5. Dark-Mode-Pass als schneller zweiter Schritt.
6. Danach FAQ-Section als erste größere neue Komponente.
