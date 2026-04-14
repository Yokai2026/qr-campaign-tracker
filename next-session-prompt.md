# Fortsetzung: UI/UX-Agents einsatzbereit + offene Smoke-Tests

## Session 2026-04-14 — Stand

**Deploy ist LIVE auf Production** (spurig.com). Letzte Commits auf master:

```
2794c29  feat(claude): 16 UI/UX-Agenten + 4 Frontend-Skills installiert  ← NEU
3633ae7  feat(landing): Billing-Toggle mit Auswahl-Feeling + cleanerer Mobile-View
146c975  docs: next-session-prompt nach Deploy von Custom-Domains
b34ca34  fix(custom-domains): DNS-Records provider-aware anzeigen
```

### ✅ Erledigt in Session 6
- **16 Community-Agents** in `.claude/agents/` installiert (kuratiert aus wshobson/agents 33.6k★, davila7/claude-code-templates 24.6k★, VoltAgent 17.3k★, iannuttall 2.0k★)
- **4 Skills** in `.claude/skills/`: `wcag-audit-patterns`, `screen-reader-testing`, `tailwind-design-system` (+ references), `nextjs-app-router-patterns`
- VoltAgent `ui-designer` bereinigt (context-manager-Protokoll entfernt, da wir kein Multi-Agent-Framework nutzen)
- `expert-nextjs-developer` Copilot-Tools-Liste entfernt (erbt jetzt alle Claude-Code-Tools)

---

## 🛠 Jetzt nutzbar — Agent-Übersicht

**UI/Visual Design**: `ui-ux-designer` (opinionated Screenshot-Review), `ui-designer` (Design-Systeme), `frontend-designer` (Mockup→Code, shadcn-aware), `ui-visual-validator` (Visual-Regression)

**Frontend Code**: `frontend-developer` (React 19), `expert-nextjs-developer` (Next.js 16), `nextjs-developer`, `react-performance-optimizer` (Core Web Vitals)

**A11y/UX**: `accessibility-tester` (WCAG 2.1/2.2), `web-accessibility-checker`, `ux-researcher`

**SEO/Marketing**: `seo-analyzer`, `seo-meta-optimizer`, `seo-structure-architect`, `seo-content-writer`, `content-marketer`

**Skills (auto-loaded)**: `tailwind-design-system`, `nextjs-app-router-patterns`, `wcag-audit-patterns`, `screen-reader-testing`

### Vorgeschlagene erste Einsätze
- `ui-ux-designer` auf die Landing-Page (`spurig.com`) loslassen für Kritik-Review
- `accessibility-tester` auf `/settings` + Custom-Domain-Wizard für WCAG-Audit
- `react-performance-optimizer` auf Dashboard-Routes für Core-Web-Vitals-Check
- `seo-analyzer` auf komplette Public-Routes für SEO-Baseline

---

## ❌ Offen — Weiterhin zu erledigen

### Phase 6c — Prod-Smoke-Tests (aus Session 5 noch offen?)

Falls noch nicht durchgegangen (bitte prüfen):
1. **Landing** — https://spurig.com (Inkognito): Pro-Feature-Section mit Phone-Mockups, iPhone-Notch korrekt
2. **QR-Create** — `/qr-codes/new`: Card "Kurz-URL-Typ" ganz oben; Pro-User: Radio "Eigene Domain" freigeschaltet
3. **Settings → Custom Domains** — `/settings`: 3-Schritt-Guide, DB-Insert + Vercel-API-Call
4. **DNS-Records UI-Fix verifizieren**: IONOS/Cloudflare/Strato → Kurzform + "Vollständig:"-Zeile
5. **Test-Subdomain** — `demo.spurig.com`: CNAME + TXT → Auto-Polling → Verifiziert → QR erstellen → Scan → Redirect
6. **Fremdhost-404** — `*.vercel.app` Preview oder `demo.spurig.com/impressum` → sauberes 404

---

## ⚠️ Bekannte Probleme / Tech-Debt (unverändert)

### Preview-Deployments werfen 404
**Root Cause**: `src/lib/supabase/middleware.ts:43-73` `handleCustomHost()` behandelt jeden Nicht-`NEXT_PUBLIC_APP_URL`-Host als Custom-Host.

**Fix**:
```ts
// Vercel preview/deployment URLs: immer als App-Host behandeln
if (host.endsWith('.vercel.app')) return null;
```
Nicht kritisch — Produktion läuft, PR-Previews erst relevant bei Team-Workflow.

### Pre-existing Lint-Issues (nicht Scope)
- `report-schedules.tsx`, `scan-alerts.tsx`, `subscription-card.tsx`: React Compiler `set-state-in-effect` Errors
- `data-table.tsx`: TanStack Table incompatible-library Warning
- `middleware.ts:90` `options` unused Warning

### Offene Architektur-Fragen
- `bulkCreateQrCodes()` in `qr-codes/actions.ts` nutzt kein `short_host`
- `short_links.short_host`-Column (Migration 004) ohne UI/Action-Support
- Per-QR `short_host` immutable nach Create (akzeptabel)

---

## 🎯 Mögliche Session-7-Richtungen

**A. Smoke-Tests + Bug-Fixes** — restliche Prod-Smoke-Tests durchgehen, gefundene Bugs fixen
**B. UI-Audit mit neuen Agents** — `ui-ux-designer` + `accessibility-tester` auf Dashboard + Landing, Fixes umsetzen
**C. Performance-Pass** — `react-performance-optimizer` + Core-Web-Vitals-Messung, Bundle-Analyse
**D. SEO-Baseline** — `seo-analyzer` + `seo-meta-optimizer` auf Landing, Meta-Tags + Schema ausbauen
**E. Preview-Deploy-Fix** — oben beschriebenes 1-Zeilen-Fix in middleware.ts + Test

---

## Constraints (unverändert)
- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)
- `.env.local` ist gitignored — neue Keys niemals committen
