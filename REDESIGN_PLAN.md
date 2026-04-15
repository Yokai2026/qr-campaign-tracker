# Redesign-Plan — Spurig Landing (Session 8)

**Stand:** 2026-04-15
**Ziel:** Von solidem Template-Look zu echter 2026-Premium-SaaS-Landingpage.
**Prinzip:** Editorial Refinement, nicht "noch mehr bunt".

---

## 1. Bestandsanalyse

### Tech-Stack
- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS 4** (CSS-first via `@theme inline`)
- **shadcn/ui** (umfassend installiert, Base UI primitives)
- **motion v12** (Framer-Motion-Nachfolger), `lucide-react`, `sonner`, `cmdk`, `vaul`
- **Supabase + Stripe** (Auth/Billing), **Recharts** (App-Dashboard)
- Fonts: `Geist Sans` + `Geist Mono` (keine Display-Schrift)

### Landing-Page Status
- Monolith: **`src/app/page.tsx` — 630 Zeilen**, alle Sections inline
- Farbe: Muted-Violett-Primary (`oklch(0.55 0.15 285)`), saubere Neutrals
- SEO: `StructuredData` (SoftwareApplication LD) bereits SSR-gerendert
- Privacy/DSGVO-Story solide, Copy grundsätzlich OK
- Pricing: `BillingToggle` client component (monthly/yearly, 5,99 / 4,99 €)

### Vorhandene Session-Dokumente
- `next-session-prompt.md` (Session 8 Plan: Instrument Serif, Bento-Features, FAQ, Pricing-Refresh)
- Diese Richtung übernehmen, schärfen und komplettieren.

---

## 2. Größte UI/UX-Probleme (heute)

| Problem | Impact |
|---|---|
| Keine Display-Schrift — Geist überall — fehlender Charakter | hoch |
| Zu viel leerer `py-20` Abstand ohne visuelle Anker | hoch |
| 2×2 Feature-Grid generisch, alle Cards gleich groß | hoch |
| Step-Nummern `text-[11px] mono` zu klein, kein Statement | mittel |
| Dashboard-Mock: handgemaltes SVG, wirkt wie Wireframe | hoch |
| Trust-Bar als einfache Check-Liste, kein Gewicht | mittel |
| DSGVO-Sektion: 3 identische Cards — Story zerfällt in Liste | mittel |
| CTAs überall gleich (Primary Button) — keine Hierarchie | mittel |
| Final-CTA Black-Card OK, aber ohne visuellen Punch | mittel |
| Footer minimal, keine Kategorien, kein Brand-Moment | niedrig |
| Mobile: KPI-Grid bricht <380px (gefixt), sonst solide | niedrig |

---

## 3. Design-Richtung — "Editorial Premium SaaS"

**Anker-Entscheidung:** Seriöses deutsches SaaS, das Vertrauen verkauft, nicht Hype.
Inspiration: Linear × Notion × Stripe × Frauncer editorial prints.

### Typografie
- **Display (H1/H2):** `Instrument Serif` — distinktiv, editorial, Italic-Akzente
- **Body/UI:** `Geist Sans` (bleibt — exzellent für Dichte)
- **Mono/Tabular:** `Geist Mono` + `font-feature-settings: "tnum"` für KPIs
- Headline-Pattern: `Sans bold` + `Serif italic` als Akzent (`dir gehört.` statt reinem Gradient)

### Farbe
- Primary bleibt muted violet, aber: neue **"Ink"-Layer** (`oklch(0.22 0.02 285)`) für Dark-Moments
- Neue **"Cream"-Surface** (`oklch(0.98 0.008 80)`) als warmer Kontrast zu kaltem Grau
- Stärkerer Primary-in-dark (`oklch(0.78 0.14 285)`) für mehr Pop
- Gradient-Mesh statt gleichförmigem Blob im Hero
- Akzent: subtile Dot-Grid-Pattern + Noise-Overlay

### Tiefe / Elevation
- Card-Shadow-Leiter: `shadow-card-sm/md/lg` mit weichem OKLCH-Alpha
- Inner-Ring für "gedrückten" Premium-Look auf Hero-Dashboard
- Ring-Highlight oben auf Premium-Cards (wie Stripe)

### Layout
- Generelle max-Breite: `max-w-6xl` statt `max-w-5xl` für Breathing-Room
- Bento-Grid für Features (1 große + 3 kleinere, asymmetrisch)
- Steps: große Serif-Numerals (60px) als Anker
- Hero-Dashboard: detaillierter (realistischere Daten-Previews, Chip-Filter, Legende)
- Section-Transitions: subtile horizontale Grid-Lines statt nur bg-muted

### Motion (dezent)
- Hero: `stagger-children` bereits da — behalten, auf Sections ausweiten
- Hover: Card-lift via `translate-y-[-2px]` + Shadow-intensity
- Keine Scroll-Animationen. Keine Parallax. Keine Auto-Rotate.

---

## 4. Prioritäten / Reihenfolge

1. ✅ **Analyse + REDESIGN_PLAN** (diese Datei)
2. 🔥 **Design-Tokens + Fonts** — Fundament für alles danach
3. 🔥 **Refactor Landing → Section-Components** — Wartbarkeit, parallele Arbeit
4. 🔥 **Hero neu** — größter Hebel für First Impression
5. ⚡ **Steps + Bento-Features** — Herzstück der Value-Story
6. ⚡ **DSGVO, Domain, Pricing, Final-CTA, Footer** — Conversion-Kette schließen
7. ✅ **Responsive + Polish-Pass**
8. ✅ **Build/Lint validieren + Commits**

---

## 5. Section-für-Section: Plan

### Header
- Sticky, schmaler (py-2.5), dezenter Border-b + Backdrop-Blur
- Logo: eigenes Mini-SVG statt QrCode-Icon-im-Kasten
- Nav-Links mit aktivem State bei Scroll-Position
- "Anmelden" secondary, "Kostenlos testen" primary mit subtiler Shine-Kante

### Hero
- Announcement-Pill: Dezenter, mit Live-Dot
- Headline H1: `Sans bold` + `Serif italic` — "QR-Code-Tracking, *das dir wirklich gehört.*"
- Subline: präziser, ergebnisorientiert
- CTA: primary + ghost, nicht primary+outline
- Trust-Row: 4 Chips auf dezentem Hintergrund mit Separatoren
- Dashboard-Mock: realistischeres Browser-Chrome, echtes Multi-Panel-Layout (KPIs + Chart + Kampagnen-Liste + Geo-Mini)
- Backdrop: Dot-Grid + weiches Gradient-Mesh, nicht einfacher Blob

### Steps (How it works)
- Bezeichnung als "Der Weg vom Druck zum Insight"
- 3 Cards mit **großen Serif-Numerals** (48-60px) links
- Verbindungslinie zwischen Steps subtiler (dashed)
- Jede Card: kleine visuelle Mini-UI, nicht nur Text

### Features (Bento)
- 6 Features: 1 Hero-Card (2-spaltig) + 5 kleinere in asymmetrischem Grid
- Hero-Card: "Analytics in Echtzeit" mit Mini-Chart-Preview
- Kleinere Cards: Geo/Devices/Exports/Vergleiche/Realtime-Alerts
- Hover: sanfte Card-Lift, Border glow

### DSGVO
- "Datenschutz ist keine Option. Er ist das Fundament."
- Linker Block: Editorial Copy mit serif-italic-Accent
- Rechter Block: 3 Cards als vertikal-versetzte Liste mit Inline-Icons + Micro-Badge ("DSGVO Art. 32"), evtl. Hosting-Karte mit Europa-Silhouette
- Hintergrund: sehr subtiles EU-Flag-gradient-Echo

### Domain-Showcase (Pro)
- Twin-Phone-Layout behalten, aber:
  - "Standard" dezenter (heller, kleiner)
  - "Pro" prominenter (leichter Crown-Badge, Glow)
  - Verbinder: Pfeil mit Label "Upgrade-Effekt"
- Feature-Row darunter mit 3 Chips + Pro-Badge-Link zu Pricing

### Pricing-Teaser
- BillingToggle bleibt, aber rahmen mit:
  - "Was du bekommst" Inline-Feature-Liste in 2 Spalten (8 Features)
  - "Abgerechnet über Stripe · SEPA/Karte" Trust-Badge
  - Geld-zurück-Tag ("14 Tage Trial — kein Risiko")

### Final CTA
- Dunkle Card, full-bleed Gradient-Mesh im Hintergrund
- Serif-Italic Headline
- Dual-Button: Primary + subtiler Secondary "Erst Demo ansehen"
- Micro-Trust-Row unter Buttons

### Footer
- 3 Spalten: Produkt / Unternehmen / Legal
- Brand-Zeile oben prominenter, Tagline
- Farbtupfer: kleiner Status-Dot ("Alle Systeme funktional")

---

## 6. Neue Komponenten / Refactors

**Neu erstellen unter `src/components/landing/`:**
- `site-header.tsx`
- `hero.tsx`, `hero-dashboard-mock.tsx`
- `steps-section.tsx`
- `features-bento.tsx`
- `privacy-section.tsx`
- `domain-showcase.tsx` (inkl. PhoneMockup)
- `pricing-teaser.tsx` (Wrapper um BillingToggle + Feature-Liste)
- `final-cta.tsx`
- `site-footer.tsx`

**Neu unter `src/components/ui/`:**
- `section-eyebrow.tsx` (konsistentes Eyebrow-Label)
- `section-heading.tsx` (Sans + Serif-Italic-Pattern)
- `grid-backdrop.tsx` (Dot-Grid SVG-Pattern)

**`src/app/page.tsx`** wird auf ~40 Zeilen reduziert — nur Section-Composition.

---

## 7. Libraries / Dependencies

**Keine neuen Libraries nötig.** Alles mit vorhandenem Stack machbar:
- Fonts: `next/font/google` mit `Instrument_Serif`
- Motion: `motion` (bereits installiert) — aber nur sparsam, CSS-first
- SVG/Icons: `lucide-react` + inline-SVG für Pattern/Decoration

---

## 8. Risiken + Mitigation

| Risiko | Mitigation |
|---|---|
| Build bricht durch Font-Umstellung | Instrument Serif nur als Variable einbinden, Layout-classes unverändert lassen |
| Dark Mode zerbricht durch neue Tokens | Jedes Token paarweise light+dark schreiben, stichprobenhaft toggeln |
| Monolithic → Components-Refactor zeigt Regression | Pro Section einzeln extrahieren, visuelle Diff im Dev-Server |
| Accessibility-Regression (Kontrast Serif-Gradient) | Nur Sans für Core-Headlines, Serif nur als Inline-Akzent |
| Mobile-Layout (Bento) brichtl | Fallback: md:grid mit `grid-rows-auto`, auf <640px single column |

---

## 9. Definition of Done (DoD)

- [ ] `npm run build` grün, keine TS-Fehler
- [ ] `npm run lint` grün
- [ ] Landing wirkt in Desktop + Mobile sichtbar hochwertiger als vorher
- [ ] Alle Sections nutzen konsistente Eyebrow+Heading+Copy-Struktur
- [ ] Typografie-Hierarchie klar (Display serif, H2 sans-bold, body muted)
- [ ] Bento-Grid responsive (kollabiert sauber auf Mobile)
- [ ] Dark-Mode funktional
- [ ] Keine Copy-Regression (deutsche UI unverändert im Kern)
- [ ] `NEXT_SESSION.md` + `NEXT_SESSION_PROMPT.md` aktualisiert

---

## 10. Erstes Paket (sofort umsetzen)

1. Instrument Serif einbinden in `layout.tsx` + `globals.css`
2. Neue Design-Tokens (cream, ink, elevation, grid-pattern-utility) in `globals.css`
3. `section-eyebrow`, `section-heading`, `grid-backdrop` Utility-Komponenten
4. Landing in Sections refactoren (Header + Hero zuerst)
5. Hero mit neuer Headline + realistischem Dashboard-Mock
6. Commit: `refactor(landing): componentize sections, add display serif`
