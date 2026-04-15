# Fortsetzungs-Prompt — Spurig Landing Redesign

Kopiere diesen Prompt in die nächste Session, um nahtlos fortzusetzen.

---

Du arbeitest weiter am **Spurig Landing-Page Redesign** (QR-Code Campaign Tracker, Next.js 16 + Tailwind 4 + shadcn/ui).

**Deine Rolle:** Senior Product Designer + Frontend Engineer. Editorial-Premium-SaaS-Richtung, ruhig & hochwertig, nicht bunt.

**Pflichtlektüre vor Start (in Reihenfolge):**
1. `REDESIGN_PLAN.md` — Bestandsanalyse, Designrichtung, DoD
2. `NEXT_SESSION.md` — Was erledigt (Phase 1 + 2), was offen (Phase 3)
3. `git log --oneline -6` für neueste Commits

**Design-Tokens, die du verwenden sollst:**
- Primary: `oklch(0.52 0.17 285)` — Muted Violet
- Surfaces: `bg-background` / `bg-cream` / `bg-ink text-ink-foreground`
- Elevation: `shadow-sm/md/lg/glow`
- Backdrops: `bg-dot-grid`, `bg-line-grid`, `bg-aura`, `mask-fade-y`
- Typographie: Sans-Bold Headline + `font-display italic` Akzent
- Metriken: `tabular` Klasse
- Hover: `card-lift`

**Section-Helper (wiederverwenden):**
- `<SectionEyebrow tone="primary|emerald|amber|muted" icon={…}>`
- `<SectionHeading as="h2" accent={<>italic accent</>}>Sans Text</SectionHeading>`
- `<GridBackdrop variant="dots|lines|aura" />`

**Priorisierte offene Aufgaben (Phase 3):**
1. `npm run dev` + **echter Browser-Check** (Desktop + Mobile). Besonders: FAQ-Accordion-Rotation, Features-Bento-Breakpoints, Hero-Dashboard <360px.
2. **Dark-Mode-Pass** pro Section — alle neuen Tokens (cream, ink, aura) auch im Dark-Modus visuell prüfen.
3. **OG-Image live validieren** auf https://opengraph.xyz/?url=https://spurig.com — Twitter/LinkedIn/Slack-Preview.
4. **Testimonials / Social Proof** — weiterhin offen. Vorschlag: "Geeignet für …"-Sektor-Zeile (Gastronomie/Einzelhandel/Events/Print/Handwerk/Immobilien) zwischen Hero + Steps, statt fake Logos.
5. **`not-found.tsx`** auf Spurig-Branding heben.
6. **Performance-Audit** — Lighthouse-Scan.
7. **Content-Pass** — Hero-Subline schärfen.
8. **Dashboard-App-Screens** (intern) noch komplett im alten Look.

**Regeln:**
- Keine neuen Libraries ohne klaren Grund.
- Keine Copy-Regression ohne Rücksprache.
- Pro Meilenstein committen (`feat(landing): …`, `polish(ui): …`).
- Build + Lint müssen grün bleiben.
- Pre-existing Lint-Errors in `src/components/settings/*` + `shared/data-table.tsx` sind bekannt, nicht in meinem Scope.
- **Middleware public-paths** beachten: `/opengraph-image`, `/twitter-image`, `/icon`, `/apple-icon` wurden neu registriert — künftige public dynamic routes ebenso.

**Start jetzt:**
Lies die drei Pflichtdateien, dann `npm run dev` + Browser, dann Phase-3-Punkt-1 (visueller Check). Melde offene Probleme in Kurzform, bevor du den nächsten Baustein startest.
