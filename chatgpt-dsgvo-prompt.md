# DSGVO-Audit für "Spurig" — QR-Kampagnen-Tracker

Du bist ein erfahrener Datenschutzberater mit Spezialisierung auf DSGVO, TDDDG und ePrivacy. Ich möchte, dass du unser Projekt auf DSGVO-Konformität prüfst, fehlende Punkte identifizierst und Best Practices empfiehlst.

---

## 1. Projektbeschreibung

**Name:** Spurig (ehemals "Spur")
**URL:** spurig.com
**Zweck:** Multi-Channel-Kampagnen-Tracking-Plattform für QR-Codes, Kurzlinks und Offline-Marketing. Nutzer (Marketing-Teams) erstellen QR-Codes und Kurzlinks, die auf Ziel-URLs weiterleiten. Beim Scannen/Klicken werden anonymisierte Tracking-Daten erfasst.

**Tech-Stack:**
- Framework: Next.js 16 (App Router) + TypeScript + React 19
- UI: Tailwind CSS 4 + shadcn/ui + Lucide Icons
- Backend: Next.js Server Actions + Route Handlers
- Datenbank: Supabase (PostgreSQL mit Row Level Security)
- Auth: Supabase Auth (E-Mail + Passwort)
- E-Mail-Versand: Resend (für automatisierte Report-E-Mails)
- Hosting: Vercel (USA, EU-US DPF zertifiziert)
- Schriftarten: Geist Sans/Mono via next/font (self-hosted, kein Google-Server-Abruf im Browser)
- Charts: Recharts
- QR-Generierung: qrcode (npm)
- PDF-Export: jsPDF

**Betriebsart:** SaaS-Tool mit Benutzer-Registrierung. Mehrere Benutzer können sich registrieren und Kampagnen verwalten.

---

## 2. Benutzerrollen und Authentifizierung

### Registrierung (Signup)
- Erfasste Daten: **E-Mail-Adresse**, **Benutzername** (3+ Zeichen, alphanumerisch + _ -), **Passwort** (min. 6 Zeichen)
- Optional: Anzeigename (Default = Benutzername)
- Supabase Auth erstellt den User, ein DB-Trigger legt automatisch ein Profil an
- Keine E-Mail-Verifizierung aktiviert (Supabase Default)

### Login
- Login mit E-Mail ODER Benutzername + Passwort
- Session-Verwaltung über Supabase Auth Cookies (httpOnly, Secure)

### Rollen
- **Admin:** Vollzugriff, kann Kampagnen/Standorte/Platzierungen löschen
- **Editor:** Kann alles erstellen und bearbeiten, aber nicht löschen

### Account-Löschung
- In den Einstellungen: "Gefahrenzone" → "Konto löschen" mit Bestätigungsdialog
- Löscht den Auth-User über Supabase Admin API → cascaded zu Profil via FK
- Anonymisierte Tracking-Daten (Scans) bleiben erhalten (kein Personenbezug)

---

## 3. Datenerfassung beim QR-Scan / Kurzlink-Klick

### Redirect-Flow
```
Nutzer scannt QR-Code → GET /r/{code} → Event wird geloggt → 302 Redirect → Ziel-URL + UTM-Parameter
```

### Erfasste Daten pro Scan/Klick (Tabelle: redirect_events)
| Feld | Beschreibung | Personenbezogen? |
|------|-------------|-----------------|
| ip_hash | SHA-256 Hash der anonymisierten IP (letzte 2 Oktette genullt + täglicher Salt) | Nein (anonymisiert) |
| device_type | mobile / tablet / desktop (aus User-Agent abgeleitet) | Nein |
| country | ISO-Ländercode aus CDN-Edge-Header (x-vercel-ip-country) | Nein |
| user_agent | Vollständiger User-Agent-String | Potenziell pseudonym |
| referrer | Verweisende Seite (falls vorhanden) | Potenziell pseudonym |
| short_code | Der gescannte Code | Nein |
| event_type | qr_open / link_open / qr_expired / qr_blocked_inactive / link_expired / link_blocked_inactive | Nein |
| destination_url | Die Ziel-URL nach Redirect | Nein |
| is_bot | Boolean, ob Bot erkannt wurde | Nein |
| created_at | Zeitstempel | Nein |
| qr_code_id, placement_id, campaign_id | Interne Referenzen | Nein |

### IP-Anonymisierung (Detail)
```typescript
// 1. Letzte 2 Oktette nullen
function anonymizeIp(ip: string): string {
  if (ip.includes(':')) {
    // IPv6: nur erste 48 Bits behalten
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + ':0:0:0:0:0';
  }
  // IPv4: letzte 2 Oktette auf 0
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.0.0`;
}

// 2. Täglicher Salt + SHA-256 Hash (16 Hex-Zeichen)
function hashIp(ip: string): string {
  const anonymized = anonymizeIp(ip);
  const daySalt = new Date().toISOString().slice(0, 10); // z.B. "2026-04-07"
  return createHash('sha256').update(`${anonymized}:${daySalt}`).digest('hex').slice(0, 16);
}
```
- Die Original-IP wird **nie** gespeichert
- Der Salt wechselt täglich → gleiche IP an verschiedenen Tagen = verschiedene Hashes
- Rückrechnung auf die Original-IP ist nicht möglich
- Wird für Unique-Visitor-Zählung (gleicher Hash am selben Tag = 1 Besucher) verwendet

### Geolocation
- **Ausschließlich** CDN-Edge-Header: `x-vercel-ip-country`, `cf-ipcountry`, `x-country-code`
- **Kein** externer Geolocation-Dienst (ip-api.com wurde entfernt, da kein DPA)
- **Kein** GPS-Zugriff
- Ergebnis: ISO 3166-1 Alpha-2 Code (z.B. "DE") oder null

### Bot-Erkennung
- Pattern-Matching gegen 20+ bekannte Bot-Signaturen (Googlebot, Facebook, Twitter, etc.)
- Bot-Events werden geloggt aber in Analytics standardmäßig herausgefiltert

### Was wird NICHT erfasst
- Keine Cookies beim QR-Scan
- Keine IP-Adressen (nur anonymisierter Hash)
- Kein Browser-Fingerprinting (kein Canvas, WebGL, Fonts)
- Keine Drittanbieter-Tracker (kein Google Analytics, Facebook Pixel, etc.)
- Kein GPS/Standort
- Keine personenbezogenen Daten des Scan-Nutzers

---

## 4. Landing-Page-Tracking (tracker.js)

### Einbindung
```html
<script src="https://spurig.com/tracker.js"></script>
```

### Funktionsweise
- Wird auf der Landingpage des Kunden eingebunden (optional)
- Liest QR-Attributionsparameter aus der URL: `?qr=`, `?pid=`, `?cid=`
- Erstellt eine zufällige Session-ID pro Seitenaufruf (kein Cookie)
- Sendet automatisch ein `landing_page_view` Event
- Stellt `window.qrTrack(eventType, metadata)` bereit für manuelle Events:
  - `cta_click` (Call-to-Action geklickt)
  - `form_start` (Formular begonnen)
  - `form_submit` (Formular abgeschickt)
  - `file_download` (Datei heruntergeladen)
- Sendet Daten via `navigator.sendBeacon()` an `/api/track`

### Erfasste Daten (Tabelle: page_events)
| Feld | Beschreibung |
|------|-------------|
| event_type | landing_page_view / cta_click / form_start / form_submit / file_download |
| ip_hash | Wie bei redirect_events (anonymisiert) |
| device_type | Aus User-Agent |
| user_agent | Vollständiger User-Agent |
| session_id | Zufällige ID pro Seitenaufruf (kein Cookie) |
| page_url | Aktuelle Seite |
| referrer | Verweisende Seite |
| metadata | Benutzerdefinierte JSONB-Daten |
| qr_code_id, placement_id, campaign_id | Attribution |

### Rate Limiting
- `/api/track`: 60 Requests pro IP-Hash pro Minute
- `/r/{code}`: 120 Redirects pro IP-Hash pro Minute
- In-Memory Sliding Window (pro Vercel-Instanz, nicht verteilt)

---

## 5. Datenbankschema (Supabase/PostgreSQL)

### Tabellen mit personenbezogenen Daten

**profiles** (Registrierte Nutzer)
- id (UUID, FK → auth.users ON DELETE CASCADE)
- email (Text)
- username (Text, unique)
- display_name (Text)
- role (admin / editor)
- created_at, updated_at

**auth.users** (Supabase intern)
- id, email, encrypted_password
- raw_user_meta_data (username, display_name)
- Letzte Anmeldung, erstellte Sessions

### Tabellen mit pseudonymen/anonymisierten Daten

**redirect_events** — Scan/Klick-Events (Details siehe oben)
**page_events** — Landing-Page-Events (Details siehe oben)

### Tabellen ohne personenbezogene Daten

**campaigns** — Kampagnen (name, slug, status, Datumsbereich)
**locations** — Standorte (venue_name, address, district, type, lat/lng)
**placements** — Platzierungen (campaign → location Verknüpfung, Status)
**qr_codes** — QR-Codes (short_code, target_url, UTM, Gültigkeit, Farben)
**short_links** — Kurzlinks (short_code, target_url, UTM, Ablaufdatum)
**link_groups** — Link-Sammlungen (name, color)
**qr_status_history** — QR-Code Änderungsprotokoll
**campaign_tags** — Tags für Kampagnen
**custom_domains** — Benutzerdefinierte Domains (host, verification_token, verified)
**report_schedules** — E-Mail-Report Zeitpläne (user_id, email, frequency, campaign_id)

### Row Level Security (RLS)
- Alle Tabellen haben RLS aktiviert
- Standard-Policy: `auth.uid() = user_id` / `auth.uid() = created_by`
- redirect_events + page_events: PUBLIC INSERT (für unauthentifizierte Scans), Authenticated READ
- profiles: Alle authentifizierten User können alle Profile lesen, nur eigenes updaten

---

## 6. Speicherdauer und automatische Löschung

### Tracking-Daten (redirect_events, page_events)
- Maximale Speicherdauer: **24 Monate**
- Automatische Löschung: **pg_cron Job** läuft täglich um 03:00 UTC
- SQL-Funktion `cleanup_old_events()` löscht alle Events mit `created_at < NOW() - 24 months`
- IP-Hash Salt rotiert täglich (kein Cross-Day-Tracking möglich)

### Benutzerdaten (profiles, auth.users)
- Gespeichert bis zur manuellen Kontolöschung durch den Nutzer
- Cascade Delete: auth.users → profiles (FK ON DELETE CASCADE)
- Kampagnen, QR-Codes etc. des gelöschten Users bleiben erhalten (kein Personenbezug in diesen Tabellen, da nur UUIDs als Referenz)

### Report-Schedules
- Gespeichert bis zur Löschung durch den Nutzer oder Kontolöschung

---

## 7. Auftragsverarbeiter (Sub-Processors)

| Dienst | Zweck | Standort | Rechtsgrundlage für Transfer |
|--------|-------|----------|------------------------------|
| **Vercel Inc.** | Hosting, CDN, Serverless Functions | USA (San Francisco) | EU-US Data Privacy Framework (DPF) + Standard Contractual Clauses (SCCs) |
| **Supabase Inc.** | PostgreSQL-Datenbank, Auth, Realtime | USA (San Francisco) | Standard Contractual Clauses (SCCs) |
| **Resend Inc.** | E-Mail-Versand (Report-E-Mails) | USA (San Francisco) | Standard Contractual Clauses (SCCs) |

### Nicht mehr verwendete Dienste
- **ip-api.com** wurde entfernt (kein DPA/AVV, freier Dienst)

### Fonts
- Geist Sans / Geist Mono werden über `next/font` beim Build optimiert und direkt vom Vercel-Server ausgeliefert
- **Kein** Abruf von Google-Servern durch den Browser der Endnutzer

---

## 8. Cookies

### Auth-Cookies (nur für registrierte Nutzer)
- Supabase Auth Session-Cookies (httpOnly, Secure, SameSite)
- Zweck: Session-Verwaltung nach Login
- Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG (technisch notwendig)
- Keine Einwilligung erforderlich

### Tracking-Cookies
- **Keine.** Beim Scannen eines QR-Codes oder Klicken eines Kurzlinks werden keine Cookies gesetzt.

### Cookie-Banner
- Schlanker Hinweis-Banner informiert über technisch notwendige Auth-Cookies
- Dismissbar mit "Verstanden"-Button
- Speichert Dismiss-Status in localStorage (`spurig-cookie-notice-seen`)
- Kein Opt-in/Opt-out nötig (nur funktionale Cookies)

---

## 9. Sicherheitsmaßnahmen (Art. 32 DSGVO)

### HTTP Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### Authentifizierung & Autorisierung
- Passwort-Hashing: Supabase Auth (bcrypt)
- Session-Management: httpOnly Cookies
- Middleware prüft Auth-Status auf allen geschützten Routen
- RLS auf Datenbankebene (Row Level Security)
- Admin-Only-Operationen: Löschen von Kampagnen, Standorten, Platzierungen

### Input-Validierung
- Zod-Schemas für alle Server Actions und API-Endpunkte
- URL-Validierung: `isUrlSafe()` verhindert javascript://-URLs und unsichere Redirects
- CSRF-Schutz: Next.js Server Actions (eingebaut)

### Rate Limiting
- `/api/track`: 60 req/min pro IP-Hash
- `/r/{code}`: 120 req/min pro IP-Hash
- In-Memory Sliding Window
- Cron-Endpoint geschützt mit `CRON_SECRET` Bearer Token

### Verschlüsselung
- HTTPS erzwungen (HSTS Preload)
- Datenbank-Verbindung über SSL (Supabase Default)

---

## 10. Rechte der Betroffenen

### Für registrierte Nutzer (Art. 15-21 DSGVO)
- **Auskunft (Art. 15):** Nutzer kann eigene Profildaten in den Einstellungen einsehen
- **Berichtigung (Art. 16):** Benutzername und Anzeigename sind editierbar
- **Löschung (Art. 17):** "Konto löschen" in Einstellungen → löscht Auth-User + Profil
- **Einschränkung (Art. 18):** Nicht explizit implementiert
- **Datenübertragbarkeit (Art. 20):** Nicht explizit implementiert (kein Export der eigenen Daten)
- **Widerspruch (Art. 21):** Nicht explizit implementiert

### Für Scan-Nutzer (Personen die QR-Codes scannen)
- Daten sind anonymisiert → kein Personenbezug herstellbar
- Auskunft/Löschung technisch nicht möglich (kein Identifier)
- Datenschutzerklärung unter /datenschutz erreichbar (im QR-Redirect Error-Pages verlinkt)

---

## 11. Datenschutzerklärung (aktueller Stand)

Erreichbar unter: `/datenschutz` (öffentlich, ohne Login)

### Inhalt:
1. Verantwortlicher → Verweis auf Impressum
2. Daten beim QR-Scan → IP-Hash (Oktette genullt), Device, Land, Zeitpunkt, Referrer
3. Was NICHT erfasst wird → Keine Tracking-Cookies, keine IPs, kein Fingerprinting, keine Drittanbieter
4. Cookies → Nur technisch notwendige Auth-Cookies, keine beim Scan
5. Zweck → Statistische Auswertung von Offline-Marketing
6. Rechtsgrundlage → Art. 6(1)(f) für Scans, Art. 6(1)(b) für Kontodaten
7. Speicherdauer → 24 Monate max (auto-gelöscht), Kontodaten bis Löschung
8. Betroffenenrechte → Art. 15-21, Hinweis auf Anonymisierung
9. Auftragsverarbeiter → Vercel (DPF + SCCs), Supabase (SCCs), Resend (SCCs), Fonts self-hosted

### Verlinkt von:
- Sidebar (Dashboard-Navigation)
- QR-Redirect Error-Pages (z.B. abgelaufener QR-Code)
- Cookie-Banner

---

## 12. Impressum

Erreichbar unter: `/impressum` (öffentlich, ohne Login)

### Inhalt:
- Angaben gemäß § 5 DDG (aktuell Platzhalter — müssen noch mit echten Betreiber-Daten gefüllt werden)
- Kontakt (E-Mail)
- Verantwortlich für Inhalt nach § 18 Abs. 2 MStV
- Haftungsausschluss für Inhalte und Links

### Verlinkt von:
- Sidebar (Dashboard-Navigation)
- Datenschutzerklärung (Abschnitt "Verantwortlicher")

---

## 13. Alle Seiten und Funktionen im Detail

### Öffentliche Seiten (ohne Login)
| Route | Funktion |
|-------|----------|
| `/login` | Login mit E-Mail/Benutzername + Passwort |
| `/signup` | Registrierung mit Username, E-Mail, Passwort |
| `/datenschutz` | Datenschutzerklärung |
| `/impressum` | Impressum |
| `/r/{code}` | QR-Code/Kurzlink Redirect (loggt Event, leitet weiter) |
| `/api/track` | Tracking-API für Landing-Page-Events (POST, CORS) |
| `/api/qr/image` | QR-Code Bild-Generierung (GET, PNG/SVG) |

### Geschützte Seiten (Login erforderlich)
| Route | Funktion | Buttons/Aktionen |
|-------|----------|-----------------|
| `/dashboard` | Übersichts-Dashboard | 4-Schritte-Onboarding für neue User, KPI-Cards (QR-Scans, Unique Besucher, Link-Klicks, Conversion-Rate), Inventar-Cards (Kampagnen, Standorte, Platzierungen, QR-Codes), Live-Scan-Feed (Echtzeit), Letzte Kampagnen, Top Platzierungen, Top Links |
| `/campaigns` | Kampagnen-Liste | "Neue Kampagne" Button, Tabelle mit Name/Slug/Status/Datum/Platzierungen/QR-Codes/Scans, Zeile klickbar → Detail |
| `/campaigns/new` | Kampagne erstellen | Formular: Name, Slug (auto-generiert), Beschreibung, Status (draft/active/paused/completed/archived), Start-/Enddatum, Tags. Buttons: Speichern, Abbrechen |
| `/campaigns/{id}` | Kampagnen-Detail | Tabs: Details (Editieren), Platzierungen (Tabelle). KPIs: Platzierungen, QR-Codes, Scans. Meta: Slug, Start, Ende, Erstellt. Buttons: Speichern, Löschen (Admin) |
| `/locations` | Standorte-Liste | "Neuer Standort" Button, Filter: Bezirke, Typen. Tabelle mit Name/Bezirk/Adresse/Typ/Aktiv/Platzierungen |
| `/locations/new` | Standort erstellen | Formular: Name, Bezirk, Adresse, Typ (9 Optionen), Notizen, Aktiv-Toggle, Lat/Lng. Buttons: Speichern, Abbrechen |
| `/locations/{id}` | Standort-Detail | Tabs: Details (Editieren), Platzierungen (Tabelle). Buttons: Speichern, Löschen (Admin) |
| `/placements` | Platzierungen-Liste | "Neue Platzierung" Button, Filter: Kampagne, Status. Tabelle mit Name/Code/Kampagne/Standort/Typ/Status/Installiert/QR-Codes |
| `/placements/new` | Platzierung erstellen | Formular: Name, Code (auto), Kampagne (Combobox), Standort (Combobox), Typ (7 Optionen), Status (6 Optionen), Poster-/Flyer-Version, Notizen, Installiert/Entfernt-Datum. Buttons: Speichern, Abbrechen |
| `/placements/{id}` | Platzierungs-Detail | Tabs: Details (Editieren), QR-Codes (Tabelle). KPIs: QR-Codes, Scans. Buttons: Speichern, Löschen (Admin) |
| `/qr-codes` | QR-Code-Liste | "Neuer QR-Code" + "Bulk-Import" Buttons. Liste mit Code/URL/Platzierung/Status/Gültigkeit/Scans |
| `/qr-codes/new` | QR-Code erstellen | Formular: Platzierung (Combobox), Ziel-URL, Short-Code (auto), Aktiv-Toggle, Gültig von/bis, Notiz, UTM-Parameter (5 Felder), QR-Farben (Vordergrund/Hintergrund Color-Picker), Custom Domain. Buttons: Erstellen, Abbrechen |
| `/qr-codes/{id}` | QR-Code Detail | QR-Vorschau (SVG/PNG), Meta: Code (kopierbar), URL (kopierbar), Status. Buttons: Link kopieren, PNG herunterladen, SVG herunterladen, Bearbeiten, Löschen (Admin), Analytics anzeigen. Editierformular, Scan-Counter, Status-Historie (Timeline) |
| `/qr-codes/bulk` | Bulk-Import | CSV-Upload, Platzierungs-Auswahl, Vorschau-Tabelle, Import-Button, Ergebnis-Anzeige |
| `/links` | Kurzlinks-Liste | "Neuer Link" Button, Tabs: Alle Links / Link-Sammlungen. Tabelle mit Titel/Code/URL/Kampagne/Gruppe/Klicks/Ablauf. Link-Sammlungen: Name, Farbe, Anzahl. Buttons: Bearbeiten, Löschen, Kopieren |
| `/links/new` | Kurzlink erstellen | Formular: Titel, Beschreibung, Ziel-URL, Code (auto), Kampagne (optional), Link-Sammlung (optional), Ablaufdatum, Ablauf-Redirect-URL, UTM-Parameter, Custom Domain. Buttons: Erstellen, Abbrechen |
| `/links/{id}` | Kurzlink-Detail | Meta: Code (kopierbar), URL (kopierbar), Ablauf. Buttons: Link kopieren, Bearbeiten, Löschen, Analytics. Editierformular, Klick-Counter |
| `/analytics` | Analytics-Dashboard | Filter: Datumsbereich, Kampagne, Bezirk, Quelle (QR/Link/Alle). KPI-Cards (7 Metriken). Charts: Zeitverlauf (Linie), Kampagnen-Performance (Balken), Platzierungs-Performance (Balken), Geräteverteilung (Kreis), Länderverteilung (Kreis), Referrer (Balken), Weltkarte. Datentabelle. Buttons: CSV-Export, PDF-Export, Echtzeit-Indikator |
| `/analytics/compare` | A/B-Vergleich | Kampagne A Selector, Kampagne B Selector, Vergleich-Button. Vergleichs-Cards: Scans (%), Unique Visitors (%), Geräteverteilung. Gewinner-Badges |
| `/settings` | Einstellungen | **Profil:** E-Mail (readonly), Benutzername, Anzeigename, Rolle (readonly) → Speichern. **Sicherheit:** Passwort zurücksetzen Button. **Tracking-Script:** Code-Snippet zum Kopieren. **Custom Domains:** Domain hinzufügen, Liste mit Verifizierung/Primär/Löschen. **Report-Zeitpläne:** E-Mail, Frequenz, Kampagne → Erstellen, Aktiv-Toggle, Löschen. **Gefahrenzone:** Konto löschen mit Bestätigung (2-Klick) |

### API-Endpunkte
| Route | Methode | Auth | Funktion |
|-------|---------|------|----------|
| `/api/track` | POST | Nein (public) | Landing-Page Events erfassen. Rate Limit: 60/min. CORS enabled. Zod-validiert. |
| `/api/qr/image` | GET | Nein (public) | QR-Code als PNG/SVG generieren. Parameter: url, format, fg, bg. Cache: 24h. |
| `/api/export` | GET | Ja (JWT) | CSV-Export. Typen: qr_codes, placements, events. Filter: campaign_id, date_from, date_to. Max 10.000 Zeilen. |
| `/api/cron/reports` | GET | Bearer Token | Automatisierte E-Mail-Reports. Geschützt mit CRON_SECRET. |
| `/r/{code}` | GET | Nein (public) | QR-/Link-Redirect. Rate Limit: 120/min. Loggt Event, leitet weiter. |

---

## 14. Echtzeit-Funktionen

- **Dashboard:** Supabase Realtime Subscription auf `redirect_events` INSERT → aktualisiert KPIs live
- **Analytics:** Realtime-Channel invalidiert React-Query-Cache bei neuen Events
- **Live-Scan-Feed:** Zeigt die letzten 8 Scans in Echtzeit, filtert Bots, zeigt Gerät/Quelle/Code/Zeit

---

## 15. Was wir bereits umgesetzt haben (DSGVO-Maßnahmen)

1. ✅ IP-Anonymisierung (Oktette nullen + täglicher Salt + SHA-256 Hash)
2. ✅ Keine Tracking-Cookies
3. ✅ Kein Browser-Fingerprinting
4. ✅ Keine Drittanbieter-Tracker oder Analytics
5. ✅ Kein externer Geolocation-Dienst (nur CDN-Headers)
6. ✅ Account-Löschung für registrierte Nutzer (Art. 17)
7. ✅ Automatische Datenlöschung nach 24 Monaten (pg_cron)
8. ✅ Datenschutzerklärung mit allen Pflichtangaben
9. ✅ Impressum (Platzhalter für Betreiber-Daten)
10. ✅ Cookie-Hinweis-Banner (technisch notwendige Cookies)
11. ✅ Security Headers (HSTS, X-Frame-Options, CSP-ähnlich, Referrer-Policy)
12. ✅ Row Level Security auf allen Tabellen
13. ✅ Zod-Validierung auf allen Server Actions
14. ✅ Rate Limiting auf öffentlichen Endpunkten
15. ✅ Auftragsverarbeiter dokumentiert (Vercel, Supabase, Resend)
16. ✅ EU-US DPF / SCCs für US-Dienstleister

---

## Meine Fragen an dich:

1. **Was fehlt noch?** — Welche DSGVO-Anforderungen haben wir noch nicht erfüllt? Gehe jeden Artikel durch der relevant sein könnte.

2. **User-Agent-Speicherung** — Wir speichern den vollständigen User-Agent-String. Ist das DSGVO-konform oder müssen wir den auch anonymisieren/kürzen?

3. **Referrer-Speicherung** — Gleiche Frage für den Referrer-Header.

4. **Verzeichnis der Verarbeitungstätigkeiten (Art. 30)** — Brauchen wir das? Wenn ja, was muss rein?

5. **Auftragsverarbeitungsverträge (AVV/DPA)** — Haben wir mit Vercel, Supabase und Resend tatsächlich AVVs abgeschlossen oder reichen die Standard-ToS? Was müssen wir konkret tun?

6. **Datenschutz-Folgenabschätzung (DSFA, Art. 35)** — Brauchen wir eine für dieses Tracking-System?

7. **Informationspflichten (Art. 13/14)** — Sind unsere Datenschutzerklärung und der Cookie-Banner ausreichend? Fehlt etwas?

8. **Recht auf Datenportabilität (Art. 20)** — Müssen wir registrierten Nutzern einen Daten-Export anbieten?

9. **Recht auf Einschränkung der Verarbeitung (Art. 18)** — Müssen wir das implementieren?

10. **Widerspruchsrecht (Art. 21)** — Wie setzen wir das um, wenn die Daten anonymisiert sind?

11. **E-Mail-Verifizierung** — Ist es DSGVO-relevant, dass wir keine E-Mail-Verifizierung haben?

12. **Passwort-Anforderungen** — Reichen 6 Zeichen Minimum aus Sicht der DSGVO (Art. 32)?

13. **Session-Dauer** — Wie lange sollten Auth-Sessions gültig sein?

14. **Logging & Audit Trail** — Brauchen wir Zugriffsprotokolle für die Administrations-Funktionen?

15. **localStorage Nutzung** — Wir speichern den Cookie-Banner-Dismiss-Status in localStorage. Ist das DSGVO/TDDDG-konform?

16. **Realtime/WebSocket** — Gibt es DSGVO-Implikationen bei der Nutzung von Supabase Realtime?

17. **Best Practices** — Was sind die Top 5 Dinge die wir noch verbessern sollten, priorisiert nach Risiko?

Bitte antworte ausführlich und mit konkreten Handlungsempfehlungen. Nenne die relevanten DSGVO-Artikel, TDDDG-Paragraphen und ggf. Urteile/Beschlüsse der Aufsichtsbehörden.
