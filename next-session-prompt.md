# Fortsetzung: Custom-Domain-Feature — Deploy + Prod-Smoke-Test

## Session 2026-04-12 Teil 4 — was passiert ist

Phase 1–5 implementiert, 4 Commits auf master, Build grün.

### ✅ Commits (uncommitted → committed, nicht gepusht)
1. `feat(custom-domains): Vercel SDK integration + middleware hardening`
2. `feat(qr): short_host per QR-Code + zwei-Varianten-UI im Create-Flow`
3. `feat(settings): Setup-Explainer für Custom Domains`
4. `feat(landing): Pro-Feature-Section für eigene Domain`

### ✅ Build/Typecheck
- `npx tsc --noEmit` → clean
- `npm run build` → ✓ Compiled successfully, 29 static pages

### ⚠️ Sicherheitsaufgabe (offen)

**`VERCEL_TOKEN` wurde 2× im Chat gepostet → kompromittiert.** Vor Production:
- Token auf https://vercel.com/account/settings/tokens löschen
- Neuen Token anlegen (Name: `spurig-domains-api`, Scope: Full Account)
- In `.env.local` UND Vercel Production ENVs ersetzen

---

## ❌ Offen — HIER FORTSETZEN

### Phase 6b — Deploy + Prod-Smoke-Test

1. **Token rotieren** (siehe oben) — NICHT den aktuellen Token für Prod nehmen.

2. **Vercel Prod-ENVs setzen:** Dashboard → Project → Settings → Environment Variables
   - `VERCEL_TOKEN` (neuer rotierter Token!)
   - `VERCEL_PROJECT_ID=prj_R5L9hgIou9KZCafyfz7QJzORuNiK`
   - `VERCEL_TEAM_ID` (leer lassen — Personal Account)

3. **Push:** `git push origin master` → Vercel auto-deploy

4. **Prod-Smoke-Tests:**
   - Landing-Page (`/`): Pro-Feature-Section mit beiden Phone-Mockups sichtbar, iPhone-Notch korrekt positioniert, URL-Bar-Lock-Icon (grün bei Pro, grau bei Standard).
   - QR-Create (`/qr-codes/new`): Card "Kurz-URL-Typ" ganz oben; Pro-User sieht Radio "Eigene Domain" freigeschaltet, Non-Pro sieht Pro-Gate-Hinweis mit Link zu `/pricing`.
   - Settings (`/settings` → Tab Custom Domains): 3-Schritt-Guide sichtbar; Domain hinzufügen → DB-Insert + Vercel-API-Call; bei Vercel-Fehler `toast.warning()` statt Error.
   - Echte Test-Subdomain anlegen: `demo.spurig.com` → DNS CNAME auf `cname.vercel-dns.com` → verifizieren → QR mit dieser Domain erstellen → Scan → Redirect auf Target.
   - Fremdhost-404: Request an `custom-domain.example/impressum` oder `/settings` → sauberes 404, nicht das Dashboard.

---

## Tech-Notizen

### Offene Architektur-Fragen für später
- `bulkCreateQrCodes()` in `qr-codes/actions.ts` nutzt kein `short_host` — später erweitern wenn Bedarf.
- `short_links` hat `short_host`-Column (Migration 004) aber UI/Action-Support fehlt → separates Phase-Thema.
- Per-QR `short_host` kann NICHT mehr geändert werden nach Create (kein UI dafür). Akzeptabel weil QR-Image sonst ungültig würde — aber dokumentieren.

### Pre-existing Lint-Issues (nicht Scope dieser Feature)
- `report-schedules.tsx`, `scan-alerts.tsx`, `subscription-card.tsx`: React Compiler `set-state-in-effect` Errors
- `data-table.tsx`: TanStack Table incompatible-library Warning
- `middleware.ts:90` `options` unused Warning (pre-existing in Supabase-Cookie-Block)

### Constraints (unverändert)
- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)

### Session-4-Commits auf master (ungepusht)
- `22ea2be` feat(custom-domains): Vercel SDK integration + middleware hardening
- `eed9022` feat(qr): short_host per QR-Code + zwei-Varianten-UI im Create-Flow
- `5afc0b1` feat(settings): Setup-Explainer für Custom Domains
- `caf88b3` feat(landing): Pro-Feature-Section für eigene Domain
