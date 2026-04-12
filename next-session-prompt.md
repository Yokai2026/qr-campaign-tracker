# Fortsetzung: Custom-Domain-Feature — Smoke-Tests offen

## Session 2026-04-13 — Stand

**Deploy ist LIVE auf Production** (spurig.com). Letzter Commit auf master:

```
b34ca34 fix(custom-domains): DNS-Records provider-aware anzeigen  ← deployed
17e4604 feat(custom-domains): Setup-Assistent mit Provider-Erkennung + Auto-Polling
eb598b8 fix(custom-domains): Hostname-Input robust normalisieren
```

### ✅ Erledigt in Session 5
1. **UI-Fix DNS-Records**: `custom-domains.tsx` — DNS-Records werden jetzt provider-aware angezeigt. Subdomain-Only-Provider (IONOS, Cloudflare, Strato, Hetzner, Namecheap, GoDaddy, Hostinger, Checkdomain, United Domains, Google) bekommen die Kurzform (`_spurig-verify.kurz` + `kurz`) mit FQDN als "Vollständig:"-Zeile. FQDN-Provider (ALL-INKL, AWS Route 53, Unknown) bekommen weiter volle Namen. Apex-Domain-Sonderfall: zeigt A-Record `76.76.21.21` statt CNAME. Copy-Buttons für Name + Ziel ergänzt.
2. **VERCEL_TOKEN rotiert** (alter Token revoked, neuer angelegt Scope=Projekt-scoped, Name `spurig-domains-api`, No Expiration) — in `.env.local` UND Vercel Production ENVs gesetzt.
3. **Vercel Production ENVs gesetzt**: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID=prj_R5L9hgIou9KZCafyfz7QJzORuNiK`, `VERCEL_TEAM_ID`=leer (Personal Account).
4. **Push**: `origin/master` = `b34ca34`. Vercel-Deploy: Duration 1m 17s, Status Ready, Production Current.

---

## ❌ Offen — HIER FORTSETZEN

### Phase 6c — Prod-Smoke-Tests

User muss persönlich durchgehen (oder ich begleite live):

1. **Landing** — https://spurig.com (Inkognito-Tab): Pro-Feature-Section mit beiden Phone-Mockups, iPhone-Notch + URL-Bar-Lock-Icon korrekt.
2. **QR-Create** — `/qr-codes/new`: Card "Kurz-URL-Typ" ganz oben; Pro-User: Radio "Eigene Domain" freigeschaltet; Non-Pro: Pro-Gate mit Link zu `/pricing`.
3. **Settings → Custom Domains** — `/settings`: 3-Schritt-Guide sichtbar; Domain hinzufügen → DB-Insert + Vercel-API-Call; bei Vercel-Fehler `toast.warning()`.
4. **DNS-Records UI-Fix verifizieren** (neu!): Domain hinzufügen → Provider-Detection → bei IONOS/Cloudflare/Strato sollte Name in **Kurzform** angezeigt werden (z.B. `_spurig-verify.demo` statt `_spurig-verify.demo.spurig.com`) + Zeile "Vollständig: …" darunter.
5. **Test-Subdomain** — `demo.spurig.com`:
   - DNS-Record: CNAME `demo` → `cname.vercel-dns.com` bei spurig.com's Nameserver
   - TXT: `_spurig-verify.demo` → Token aus UI
   - Auto-Polling sollte innerhalb 5 min finden → Status auf "Verifiziert"
   - QR-Code mit dieser Domain erstellen → Scan → Redirect auf Target
6. **Fremdhost-404** — Request an `*.vercel.app` Preview-URL oder Custom-Host ohne Short-Code (`demo.spurig.com/impressum`) → sauberes 404, nicht das Dashboard.

---

## ⚠️ Bekannte Probleme / Tech-Debt

### Preview-Deployments werfen 404
**Root Cause**: `src/lib/supabase/middleware.ts:43-73` `handleCustomHost()` behandelt jeden Host, der nicht `NEXT_PUBLIC_APP_URL` entspricht, als Custom-Host → 404. PR-/Branch-Previews auf `*.vercel.app` treffen nicht `spurig.com` → Preview-Thumbnail in Vercel-Dashboard zeigt "Seite nicht gefunden".

**Fix (später)**: In `handleCustomHost()` vor der Custom-Host-Logik einfügen:
```ts
// Vercel preview/deployment URLs: immer als App-Host behandeln
if (host.endsWith('.vercel.app')) return null;
```

**Warum nicht jetzt**: Produktion funktioniert. PR-Previews sind erst relevant, wenn Team-Workflow mit Branches kommt.

### Pre-existing Lint-Issues (nicht Scope)
- `report-schedules.tsx`, `scan-alerts.tsx`, `subscription-card.tsx`: React Compiler `set-state-in-effect` Errors
- `data-table.tsx`: TanStack Table incompatible-library Warning
- `middleware.ts:90` `options` unused Warning

### Offene Architektur-Fragen
- `bulkCreateQrCodes()` in `qr-codes/actions.ts` nutzt kein `short_host` — erweitern wenn Bedarf.
- `short_links` hat `short_host`-Column (Migration 004) aber UI/Action-Support fehlt → separates Phase-Thema.
- Per-QR `short_host` kann NICHT mehr geändert werden nach Create — akzeptabel, weil QR-Image sonst ungültig würde.

---

## Constraints (unverändert)
- DSGVO-Konformität Pflicht
- Supabase-Migrationen via MCP gegen Prod
- Deutsche UI, englischer Code
- Redirects werden NIE blockiert (`/r/[code]` außerhalb dashboard)
