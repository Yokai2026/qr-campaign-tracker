# Next Session: Design Overhaul Phase 2

## Kontext
Wir haben in Session 2026-04-16 einen grossen UI/UX-Redesign gestartet.
Ziel: Spurig soll modern, authentisch und menschlich wirken — nicht wie von KI generiert.

Ein UI/UX-Audit und ein WCAG-Accessibility-Audit wurden durchgefuehrt.
Die Foundation-Aenderungen (Fonts, Farben, Accessibility-Basics) und die wichtigsten
Landing-Page-Komponenten wurden bereits umgebaut. Build ist clean.

## Was bereits gemacht wurde
- **Fonts**: Geist Sans -> Bricolage Grotesque (Headings) + IBM Plex Sans (Body) + Geist Mono (Code)
- **Farben**: Warmer Amber-Akzent `--accent-warm: oklch(0.75 0.15 70)` eingefuehrt, Chart-Palette warm+cool
- **Accessibility**: `prefers-reduced-motion`, Focus-Indikatoren, Skip-Navigation-Link, Viewport zoom
- **Hero**: Gradient-Text entfernt, font-heading, warmer Akzent auf Pill + Checkmarks
- **Hero-Mock**: Floating Chips + Browser Chrome entfernt, minimaler App-Header
- **Header**: Nav links-aligned statt centered
- **Steps**: Von Card-Grid zu Timeline-Layout redesigned (links-aligned, grosse Nummern, Divider)
- **Features Bento**: Links-aligned Header, SectionEyebrow entfernt, warmer Akzent-Label
- **Pricing**: Links-aligned Header, Eyebrow entfernt, warme Checkmarks
- **FAQ**: Eyebrow entfernt, Heading vereinfacht
- **Final CTA**: font-heading, warme Checkmarks, Floating Chip entfernt
- **Sidebar**: Kontrast erhoeht (WCAG AA)
- **Layout**: `id="main-content"` auf Landing + Dashboard

## Was noch offen ist (in Prioritaets-Reihenfolge)

### Hoch
1. **Visual Check** — Dev-Server starten, Landing Page + Dashboard im Browser pruefen.
   Sicherstellen dass Bricolage Grotesque + IBM Plex Sans korrekt laden und gut aussehen.
2. **Domain-Showcase** (`src/components/landing/domain-showcase.tsx`) — Hat noch SectionEyebrow,
   ggf. links-alignen oder Eyebrow durch schlichteres Label ersetzen
3. **Sector-Strip** (`src/components/landing/sector-strip.tsx`) — Pruefen ob es zum neuen Design passt
4. **Site-Footer** (`src/components/landing/site-footer.tsx`) — Brand-Name mit font-heading
5. **Features Bento Icon-Backgrounds** — bg-primary/10 -> bg-accent-warm/10 fuer die Feature-Icon-Badges
6. **Bento chart highlight** — oklch(0.28 0.06 265) Highlight-Dot in features-bento auf accent-warm

### Mittel
7. **Mobile Bottom-Navigation** fuer Dashboard — Persistent Bottom Tab Bar statt Hamburger
8. **Dashboard KPI-Consolidation** — Performance + Inventory KPIs zusammenfuehren (8 Cards -> Gruppen)
9. **Copy-Variation-Pass** — Heading-Patterns variieren, nicht alle mit accent-prop oder em-dash
10. **Table Accessibility** — `scope="col"` auf `<th>` in `src/components/ui/table.tsx`
11. **Form-Field aria-describedby** — Error-Messages mit Input verbinden in `src/components/shared/form-field.tsx`
12. **Sidebar Mobile Focus-Management** — Focus-Trap bei offenem Mobile-Menu

### Nice-to-have
13. **Scroll-triggered Entrance-Animationen** auf Landing-Sections (Intersection Observer oder Motion)
14. **Interactive Pricing Toggle** — Micro-Animation beim Preiswechsel
15. **Monochrome Chart-Palette im Dashboard** auf warm+cool umstellen (Dashboard-spezifisch)

## Phase 4: Qualitaetssicherung (nach Abschluss)
- `ui-visual-validator` Agent fuer visuellen Abgleich
- `superpowers:requesting-code-review` Skill fuer Code-Review
- Nochmal WCAG-Audit um sicherzustellen dass nichts verschlechtert wurde

## Design-Regeln (merken!)
- Bricolage Grotesque nur fuer Headings (`font-heading`), IBM Plex Sans fuer Body (`font-sans`)
- `--accent-warm` sparsam: CTAs, Highlights, Step-Nummern, Labels — nicht alles amber machen
- Layouts variieren: Centered nur fuer Hero + FAQ, Rest links-aligned oder asymmetrisch
- Keine SectionEyebrow-Pills (ausser Privacy-Section wo es passt)
- Keine floating Deko-Chips
- Keine fake Browser-Chrome-Mockups
