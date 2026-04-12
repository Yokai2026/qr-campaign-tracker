# Projekt-Review: Spurig — QR Campaign Tracker

## Deine Aufgabe

Du bist Senior Product Engineer und UX-Berater. Ich zeige dir den kompletten Stand meines Projekts "Spurig" (QR-Campaign-Tracker). Bitte:

1. **Analysiere** was fehlt, was verbessert werden muss, was Prioritaet hat
2. **Priorisiere** nach: Kritisch (Blocker fuer Produktion) > Hoch > Mittel > Nice-to-have
3. **Schreibe am Ende einen ausfuehrbaren Prompt** fuer Claude Code (mein AI-Coding-Agent), der die wichtigsten Verbesserungen umsetzt. Der Prompt soll so detailliert sein, dass Claude Code alles in einer Session abarbeiten kann.

---

## Was ist Spurig?

Ein **Privacy-first QR-Campaign-Tracker** fuer Offline-Marketing. Teams erstellen Kampagnen, platzieren QR-Codes an physischen Standorten (Poster, Flyer, Sticker) und tracken jeden Scan — komplett DSGVO-konform, ohne Third-Party-Analytics.

**Zielgruppe:** Marketing-Teams, Agenturen, Kommunen die Offline-Kampagnen messen wollen.
**Sprache:** Deutsche UI, englischer Code.

---

## Tech Stack

- **Framework:** Next.js 16.2.2 (App Router) + TypeScript 5 + React 19
- **UI:** Tailwind CSS 4 + shadcn/ui (base-ui) + Lucide Icons
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + RLS)
- **Charts:** Recharts 3 + react-simple-maps (Weltkarte)
- **QR:** qrcode (PNG + SVG Generation)
- **PDF:** jsPDF + jspdf-autotable
- **Validation:** Zod 4
- **State:** TanStack React Query + React Hook Form
- **Testing:** Vitest (152 Unit-Tests) + Playwright (19 E2E-Tests)
- **Deployment:** Vercel (konfiguriert mit Cron-Jobs)

---

## Datenbank-Schema (7 Migrationen)

### Kern-Tabellen
- **profiles** — User-Profile (extends Supabase Auth), Rollen: admin/editor
- **campaigns** — Kampagnen mit Lifecycle (draft > active > paused > completed > archived)
- **campaign_tags** — Tags pro Kampagne
- **locations** — Physische Standorte (Bibliothek, Schule, Jugendzentrum, etc.), mit Bezirk, Adresse, Geo-Koordinaten
- **placements** — Verbindung Kampagne + Standort (Poster an Bibliothek X), mit Placement-Code und Status-Lifecycle
- **qr_codes** — QR-Codes pro Platzierung, mit Ziel-URL, Farben, Gueltigkeit, UTM-Params, Scan-Limit
- **qr_status_history** — Audit-Trail fuer QR-Code-Aenderungen
- **short_links** — Standalone-Kurzlinks (nicht an Platzierungen gebunden)
- **link_groups** — Sammlungen von Kurzlinks
- **redirect_events** — Tracking: QR-Scans + Link-Klicks (anonymisiert)
- **page_events** — Landing-Page-Tracking (CTA-Klicks, Formular-Abschluesse)
- **custom_domains** — Eigene Kurz-Domains fuer QR/Links
- **audit_log** — Sicherheits-relevante Aktionen (Admin-only)

### DSGVO-Features in der DB
- IP-Anonymisierung (letzte 2 Oktette genullt + Daily-Salt SHA-256 Hash)
- Automatische Datenloeschung nach 24 Monaten (pg_cron)
- Audit-Log Cleanup nach 36 Monaten
- User-Agent wird NICHT gespeichert (nur browser_family + os_family)
- Referrer nur als Hostname (kein vollstaendiger URL)

### RLS (Row Level Security)
- Alle Tabellen haben RLS
- Authenticated Users: Lesen/Erstellen/Bearbeiten
- Nur Admins: Loeschen
- Redirect/Page Events: Public INSERT (mit Rate-Limit), Auth READ
- Audit-Log: Nur Admin READ

---

## Alle Seiten / Features

### Oeffentlich
| Route | Funktion |
|-------|----------|
| `/login` | Email/Username + Passwort Login |
| `/signup` | Registrierung |
| `/datenschutz` | Datenschutzerklaerung |
| `/impressum` | Impressum (**Platzhalter — muss manuell befuellt werden**) |
| `/r/[code]` | QR-Redirect-Handler (< 100ms, loggt Event, 302 Redirect) |

### API-Endpunkte
| Route | Funktion |
|-------|----------|
| `GET /api/qr/image` | QR-Code als PNG/SVG generieren |
| `POST /api/track` | Landing-Page Event Tracking (CORS, Rate-Limited 60/min) |
| `GET /api/export` | CSV-Export (Kampagnen, Events) |
| `GET /api/export/my-data` | DSGVO Art. 20 Datenexport (JSON) |
| `POST /api/cron/reports` | Geplante Reports (Vercel Cron, taeglich 7:00 UTC) |

### Dashboard (geschuetzt, Auth erforderlich)

#### Dashboard Home (`/dashboard`)
- Willkommensnachricht mit Benutzername
- 4 Performance-KPIs (Aufrufe, Unique QR-Codes, Kampagnen-Performance)
- 4 Inventar-KPIs (Aktive Kampagnen, Platzierungen, QR-Codes, Standorte)
- Listen: Letzte Kampagnen, Top-Platzierungen, Gescannte QR-Codes, Deadlines

#### Kampagnen (`/campaigns`)
- Tabelle mit Filtern (Status, Tags, Datum)
- CRUD: Erstellen, Bearbeiten, Loeschen (mit ConfirmDialog)
- Detail-Seite: Bearbeitungsformular + zugehoerige Platzierungen

#### Standorte (`/locations`)
- Tabelle mit Standorttyp-Filter
- CRUD + Detail mit zugehoerigen Platzierungen

#### Platzierungen (`/placements`)
- Tabelle: Placement-Code, Standort, Kampagne, Typ, Status
- Detail: Tabs (Info, QR-Codes, Verlauf)
- Status-Lifecycle Verwaltung

#### QR-Codes (`/qr-codes`)
- Liste mit Filtern (Kampagne, Platzierung)
- Einzel-Erstellung: Ziel-URL, Farben, UTM, Gueltigkeit, Scan-Limit
- Bulk-Import via CSV
- Detail: QR-Vorschau, Download PNG/SVG, Bearbeiten, Scan-Historie
- Bulk-Delete + Einzel-Delete mit ConfirmDialog

#### Kurzlinks (`/links`)
- Tabs: Links / Link-Sammlungen
- Erstellung: Ziel-URL, Custom-Code, Ablaufdatum, UTM
- Detail: Klick-Statistiken, Bearbeiten

#### Analytik (`/analytics`)
- **Reichweite (4 KPIs):** Aufrufe gesamt (QR+Link Aufschluesselung), QR-Scans (aktive Codes), Link-Klicks, Eindeutige Besucher
- **Engagement (bedingt):** Nur sichtbar wenn CTA/Formular-Daten vorhanden (benoetigt Tracking-Script auf Zielseite)
- **Analyse-Charts:**
  - Zeitverlauf: QR-Scans & Link-Klicks ueber Zeit (Liniendiagramm)
  - Aufrufe pro Kampagne (horizontales Balkendiagramm)
  - Geratetypen (Donut-Chart: Mobile/Desktop/Tablet)
- **Technik-Charts:** Browser + Betriebssystem (Donut-Charts)
- **Geografie:** Weltkarte + Scans nach Land (Balkendiagramm)
- **Top-Referrer** (wenn Daten vorhanden)
- **Top-Platzierungen** (Tabelle)
- **Filter:** Zeitraum, Kampagne, Bezirk, Quelle (Alle/QR/Link)
- **Live-Modus:** Realtime-Updates via Supabase
- **Export:** CSV + PDF
- **A/B Vergleich:** Zwei Kampagnen nebeneinander vergleichen

#### Einstellungen (`/settings`)
- Profil bearbeiten (Username, Anzeigename)
- Passwort zuruecksetzen
- Tracking-Script Embed-Code
- Custom Domains (Hinzufuegen, Verifizieren, Primaer setzen)
- Report-Zeitplaene
- DSGVO Datenexport (JSON)
- Audit-Log (nur Admin)
- Account loeschen (Danger Zone)

---

## Sicherheit

- **Auth:** Supabase Auth mit Middleware-Session-Check auf allen Dashboard-Routes
- **Rate Limiting:** QR-Redirect 120/min, Tracking API 60/min (per IP-Hash)
- **Security Headers:** X-Frame-Options DENY, HSTS 2 Jahre, CSP, nosniff, Permissions-Policy
- **CSRF:** Next.js Server Actions (eingebaut)
- **Bot-Erkennung:** WhatsApp, Telegram, Googlebot, Headless-Browser gefiltert
- **IP-Anonymisierung:** IPv4 letzte 2 Oktette genullt, SHA-256 mit Daily-Salt, 16-Zeichen Hex

---

## Testing-Status

- **152 Unit-Tests (Vitest):** IP-Anonymisierung, Device-Parsing, Bot-Erkennung, Zod-Schemas, Formatierung, Rate-Limiting
- **19 E2E-Tests (Playwright):** Auth-Flows, oeffentliche Seiten, QR-Redirect, Tracking-API, Export
- **Alle Tests gruen** (Stand: 2026-04-07)

---

## Build & Deployment

- `npm run build` laeuft sauber durch (0 Fehler, 0 TypeScript-Fehler)
- Vercel-Config vorhanden (`vercel.json` mit Cron)
- Environment-Variablen: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`

---

## Bekannte Luecken / TODOs

1. **Impressum:** Platzhalter-Daten — muss manuell befuellt werden
2. **QR-Bilder als Data-URLs:** Aktuell in der DB gespeichert. Fuer Produktion sollten diese in Supabase Storage oder S3 liegen
3. **Link-Gruppen Detail-Seite:** Keine eigene Route fuer Einzelansicht
4. **Keine API-Dokumentation:** Kein OpenAPI/Swagger-Spec
5. **Kein Error Monitoring:** Kein Sentry/LogRocket
6. **middleware.ts:** Next.js 16 warnt "middleware convention deprecated, use proxy" — noch nicht migriert
7. **Kampagnen-Scheduling:** Kein automatisches Aktivieren/Deaktivieren nach Datum
8. **Multi-Team-Support:** Aktuell global, kein Workspace/Team-Konzept

---

## Was in der letzten Session gemacht wurde

### Commit-History (chronologisch):
1. DSGVO-Compliance: IP-Anonymisierung, Account-Loeschung, Datenschutz-Seite
2. DSGVO Phase 2: Datenminimierung, Privacy-by-Design
3. DSGVO Phase 3: Analytics-Tests, Daten-Export, Audit-Log
4. Audit-Log Admin-UI + Logging in allen Loesch-Aktionen
5. E2E-Tests, Performance-Optimierung, UX-Polish
6. Build-Fixes (ssr:false, asChild > render), ConfirmDialog fuer QR-Loeschungen, .gitignore
7. Analytics refactored: Klarere Sektionen, bessere Labels, CSV-Export Error Handling

---

## Fragen an dich

1. **Was fehlt noch fuer eine solide v1.0 (Production-Launch)?**
2. **Welche UX-Probleme siehst du?**
3. **Welche technischen Schulden sollten vor Launch behoben werden?**
4. **Was wuerde den groessten Mehrwert fuer Nutzer bringen?**
5. **Gibt es Security- oder DSGVO-Luecken die ich uebersehe?**

## Ausgabe-Format

Bitte antworte in diesem Format:

### Analyse
[Deine Bewertung des Projektstands]

### Prioritaetenliste
| # | Prioritaet | Aufgabe | Warum |
|---|-----------|---------|-------|
| 1 | Kritisch  | ...     | ...   |
| 2 | Hoch      | ...     | ...   |
| ... | ... | ... | ... |

### Claude Code Prompt
```
[Hier ein detaillierter, ausfuehrbarer Prompt fuer Claude Code der die Top-Prioritaeten abarbeitet.
Der Prompt soll enthalten:
- Kontext ueber das Projekt
- Exakte Datei-Pfade wo relevant
- Klare Anweisungen was zu tun ist
- Reihenfolge der Aufgaben
- Was NICHT geaendert werden soll
- Am Ende: Build pruefen + Tests laufen lassen + Committen + Pushen]
```
