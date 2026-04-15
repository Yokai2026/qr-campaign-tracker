# Fortsetzungs-Prompt — Spurig Landing Redesign

Kopiere diesen Prompt in die nächste Session, um nahtlos fortzusetzen.

---

Du arbeitest weiter am **Spurig Landing-Page Redesign** (QR-Code Campaign Tracker, Next.js 16 + Tailwind 4 + shadcn/ui).

**Deine Rolle:** Senior Product Designer + Frontend Engineer. Editorial-Premium-SaaS-Richtung, ruhig & hochwertig, nicht bunt.

**Pflichtlektüre vor Start (in Reihenfolge):**
1. `REDESIGN_PLAN.md` — Bestandsanalyse, Designrichtung, DoD
2. `NEXT_SESSION.md` — Was erledigt, was offen
3. Quick-Check: `git log --oneline -5` für neueste Commits

**Design-Tokens, die du verwenden sollst:**
- Primary: `oklch(0.52 0.17 285)` — Muted Violet
- Surfaces: `bg-background` / `bg-cream` / `bg-ink text-ink-foreground`
- Elevation: `shadow-sm/md/lg/glow`
- Backdrops: `bg-dot-grid`, `bg-line-grid`, `bg-aura`, `mask-fade-y`
- Typographie: Sans-Bold Headline + `font-display italic` Akzent (nicht Gradient-Text für Haupt-H1/H2)
- Metriken: `tabular` Klasse für Zahlen
- Hover: `card-lift` für Card-Hover-Effekt

**Section-Helper (wiederverwenden):**
- `<SectionEyebrow tone="primary|emerald|amber|muted" icon={…}>`
- `<SectionHeading as="h2" accent={<>italic accent</>}>Sans Text</SectionHeading>`
- `<GridBackdrop variant="dots|lines|aura" />`

**Priorisierte offene Aufgaben (aus NEXT_SESSION.md):**
1. `npm run dev` starten, Landing visuell prüfen Desktop + Mobile (<360px).
2. Dark-Mode-Pass pro Section.
3. `/pricing`-Seite auf gleiches Section-System heben.
4. **FAQ-Section** als neue Component `src/components/landing/faq-section.tsx` zwischen Pricing + FinalCTA, plus `FAQPage` JSON-LD Schema in `src/components/seo/structured-data.tsx`.
5. OG-Image + Favicon-Set.
6. Content-Pass auf Copy.
7. Testimonials/Logos-Platzhalter.

**Regeln:**
- Keine neuen Libraries ohne klaren Grund (Motion/Lucide/shadcn reichen).
- Keine Copy-Regression ohne User-Rücksprache.
- Pro Meilenstein committen (`feat(landing): …`, `polish(ui): …`, `refactor(landing): …`).
- Build + Lint müssen grün bleiben.
- Pre-existing Lint-Errors in `src/components/settings/*` sind bekannt, nicht mein Scope.

**Start jetzt:**
Lies die drei Pflichtdateien, dann `npm run dev`, dann erste visuelle Checks. Melde offene Probleme in Kurzform, bevor du den nächsten Baustein startest.
