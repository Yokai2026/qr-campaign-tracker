# Security Hardening — QR Campaign Tracker (Spurig)

Stand: 2026-04-07

## Übersicht aller Sicherheitsmaßnahmen

---

## 1. Authentifizierung & Autorisierung

### Supabase Auth
- Session-Management via `@supabase/ssr` (Cookie-basiert)
- Middleware prüft Session auf allen `/(dashboard)/`-Routes
- Service Role Key nur in Server Actions und Route Handlers

### Passwort-Policy
- Mindest-Passwortlänge: 10 Zeichen (serverseitig erzwungen in Signup)
- **TODO:** Supabase Dashboard → Authentication → Settings → Mindestlänge auf 10 setzen

### Account-Enumeration-Schutz
- Signup gibt generische Fehlermeldungen zurück
- Kein Hinweis ob E-Mail/Username bereits existiert

### Row Level Security (RLS)
- **Alle Tabellen** haben RLS aktiviert
- Standard-Policy: `auth.uid() = user_id` / `auth.uid() = created_by`
- Profiles: `auth.role() = 'authenticated'` (nur eingeloggte User)
- Tracking-Events: INSERT mit Größenlimits (kein voller User-Agent, Referrer < 256 Zeichen, Metadata < 4KB)

---

## 2. HTTP Security Headers

Konfiguriert in `next.config.ts`:

| Header | Wert | Zweck |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS erzwingen |
| `X-Frame-Options` | `DENY` | Clickjacking verhindern |
| `X-Content-Type-Options` | `nosniff` | MIME-Sniffing verhindern |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer-Leaks reduzieren |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Browser-APIs einschränken |

---

## 3. Input-Validierung

### Server-seitig
- **Zod-Validierung** in allen Server Actions (Schema-Validierung am Anfang)
- **URL-Sanitisierung:** `sanitizeUrl()` entfernt PII-Parameter vor Speicherung
- **Metadata-Sanitisierung:** `sanitizeMetadata()` mit Allowlist, Größenlimits, PII-Blocking
- **Referrer-Minimierung:** `normalizeReferrer()` speichert nur Hostnamen

### Client-seitig
- Tracking-Script (`public/tracker.js`) sanitisiert URLs vor dem Senden
- Form-Validierung mit Zod-Schemas (ergänzend zur Server-Validierung)

### RLS-Ebene
- INSERT-Policies verhindern das Speichern von vollen User-Agents
- Referrer auf 256 Zeichen beschränkt
- Metadata auf 4KB beschränkt

---

## 4. Datenschutz / Privacy

### IP-Anonymisierung
- Letzte 2 Oktette (IPv4) bzw. letzte 80 Bit (IPv6) werden vor dem Hash auf Null gesetzt
- SHA-256 Hash mit täglichem Salt (keine Langzeit-Wiedererkennung)
- Raw-IP wird niemals gespeichert

### User-Agent-Eliminierung
- Voller User-Agent-String wird **nicht** gespeichert (immer `NULL`)
- Nur Kategorien: `device_type`, `browser_family`, `os_family`
- Keine Versionsnummern → kein Fingerprinting möglich

### URL-PII-Stripping
- 30+ bekannte PII/Tracking-Parameter werden vor Speicherung entfernt
- Betrifft: email, token, fbclid, gclid, msclkid, session, password, etc.
- URL-Fragmente werden entfernt (können PII in SPAs enthalten)

### Keine Drittanbieter
- Kein Google Analytics, Facebook Pixel oder sonstige Third-Party-Tracker
- Geolocation nur über CDN-Edge-Headers (Vercel, Cloudflare) — kein externer API-Call
- Keine Tracking-Cookies

---

## 5. CSRF-Schutz

- Next.js Server Actions haben eingebauten CSRF-Schutz
- Route Handler verwenden Auth-Token-Validierung

---

## 6. Bot-Erkennung

- User-Agent-basierte Bot-Erkennung (`isBot()`)
- 25+ Bot-Patterns erkannt (Googlebot, Facebook, Slack, Discord, etc.)
- Bots werden markiert (`is_bot = true`) und in Analytics gefiltert

---

## 7. Data Retention

- Automatische Löschung von Events > 24 Monate (pg_cron)
- Self-Service Account-Löschung
- IP-Hash Daily Salt verhindert Langzeit-Tracking

---

## 8. Export-Sicherheit

- CSV-Export nur für authentifizierte User
- `destination_url` im Export wird durch `sanitizeUrl()` gefiltert
- Kein Export von IP-Hashes oder sensiblen Daten

---

## Offene Punkte

| Punkt | Priorität |
|---|---|
| Rate Limiting für `/api/track/` und `/r/[code]` | Mittel |
| Unit-Tests für Privacy-Funktionen | Mittel |
| Admin Audit-Log | Niedrig |
| CSP-Header (Content Security Policy) | Niedrig |
