# Privacy Audit — QR Campaign Tracker (Spurig)

Stand: 2026-04-07

## Zusammenfassung

In zwei Härtungs-Phasen wurde der QR Campaign Tracker von grundlegender Tracking-Funktionalität auf DSGVO-konforme Privacy-by-Design-Architektur umgestellt. Der Fokus lag auf Datenminimierung, Eliminierung von Drittanbieter-Abhängigkeiten und technischen Schutzmechanismen.

---

## Phase 1: DSGVO-Compliance Basis (`21bd690`)

### IP-Anonymisierung
- **Vorher:** Raw IPs wurden gehasht und gespeichert
- **Nachher:** Letzte 2 Oktette (IPv4) bzw. letzte 80 Bit (IPv6) werden vor dem SHA-256-Hash auf Null gesetzt
- **Daily Salt:** IP-Hash rotiert täglich, verhindert langfristige Wiedererkennung
- **Datei:** `src/lib/tracking/events.ts` — `anonymizeIp()`, `hashIp()`

### Geolocation
- **Vorher:** Fallback auf ip-api.com (externer Drittanbieter-Service)
- **Nachher:** Ausschließlich CDN-Edge-Headers (Vercel `x-vercel-ip-country`, Cloudflare `cf-ipcountry`)
- **Grund:** Kein Drittanbieter-Transfer ohne DPA/AVV erforderlich
- **Datei:** `src/lib/tracking/events.ts` — `resolveCountry()`

### Account-Löschung
- **Neu:** Self-Service Account-Löschung in den Einstellungen
- **Datei:** `src/app/(dashboard)/settings/account-actions.ts`

### Data Retention
- **Automatische Löschung:** pg_cron Job löscht Tracking-Events älter als 24 Monate
- **Zeitplan:** Täglich um 03:00 UTC
- **Datei:** `supabase/migrations/005_data_retention_cron.sql`

### Security Headers
- HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Datei:** `next.config.ts`

### Rechtliche Seiten
- Datenschutzerklärung komplett überarbeitet (EU-US DPF, Resend, Cookies, Betroffenenrechte)
- Cookie-Hinweis-Banner implementiert
- Impressum-Seite mit Platzhaltern (muss mit echten Daten gefüllt werden)

---

## Phase 2: Datenminimierung + Privacy-by-Design (`6762992`)

### Privacy-Utility-Bibliothek (`src/lib/privacy.ts`)

| Funktion | Zweck |
|---|---|
| `normalizeReferrer()` | Nur Hostname, keine Pfade/Query-Strings |
| `sanitizeUrl()` | Entfernt PII-Parameter (email, token, fbclid, gclid, msclkid, etc.) |
| `parseUserAgentMinimal()` | Gibt nur `device_type`, `browser_family`, `os_family` zurück — keine Versionen |
| `sanitizeMetadata()` | Allowlist, max 10 Keys, max 200 Zeichen, PII-Keys geblockt |

### User-Agent-Eliminierung
- **Vorher:** Voller User-Agent-String in DB gespeichert (fingerprinting-fähig)
- **Nachher:** Nur noch Kategorien gespeichert (`device_type`, `browser_family`, `os_family`)
- `user_agent`-Spalte wird bei INSERT immer `NULL` gesetzt
- Bestehende User-Agent-Daten wurden per Migration gelöscht
- RLS-Policy erzwingt `length(user_agent) < 10`

### Referrer-Minimierung
- Nur noch Hostname gespeichert (z.B. `google.com` statt volle URL mit Suchbegriff)
- Bestehende volle Referrer-URLs wurden per Migration gelöscht
- RLS-Policy beschränkt Referrer auf < 256 Zeichen

### URL-Sanitisierung
- Alle gespeicherten URLs werden durch `sanitizeUrl()` gefiltert
- PII-Parameter (email, token, fbclid, gclid, etc.) werden vor dem Speichern entfernt
- Client-seitiges Tracking-Script (`public/tracker.js`) sanitisiert URLs vor dem Senden

### Signup-Härtung
- Generische Fehlermeldungen (keine Account-Enumeration möglich)
- Mindest-Passwortlänge: 10 Zeichen (serverseitig)

### RLS-Härtung
- `profiles`-Tabelle: Von `using (true)` auf `using (auth.role() = 'authenticated')` gehärtet
- INSERT-Policies mit Größenlimits für `redirect_events` und `page_events`
- Metadata auf < 4KB beschränkt

---

## Phase 3: Analytics-Umstellung + Export-Sanitisierung

### Analytics auf neue Felder umgestellt
- Alle Dashboard-Queries verwenden jetzt `device_type`, `browser_family`, `os_family`
- Neue Pie-Charts für Browser- und Betriebssystem-Verteilung
- PDF-Bericht enthält Browser- und OS-Tabellen

### CSV-Export gehärtet
- `destination_url` wird durch `sanitizeUrl()` gefiltert
- Browser und OS als zusätzliche Spalten im Export

---

## Rest-Risiken

| Risiko | Schwere | Maßnahme |
|---|---|---|
| Impressum enthält Platzhalter | Mittel | Manuelle Befüllung mit echten Betreiber-Daten |
| AVV/DPA mit Vercel, Supabase, Resend fehlt formal | Hoch | Verträge abschließen (siehe `docs/dsgvo-manual-todos.md`) |
| Verzeichnis der Verarbeitungstätigkeiten fehlt | Hoch | Erstellen (Art. 30 DSGVO) |
| Keine DSFA-Vorprüfung dokumentiert | Mittel | Prüfung durchführen und dokumentieren |
| Kein Incident-Response-Prozess | Mittel | Prozess definieren |
| Unit-Tests für Privacy-Funktionen fehlen | Niedrig | Tests schreiben für `privacy.ts` und `events.ts` |
| Supabase Passwort-Policy auf 10 Zeichen setzen | Niedrig | Im Dashboard unter Authentication → Settings |
