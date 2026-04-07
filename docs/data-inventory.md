# Dateninventar — QR Campaign Tracker (Spurig)

Stand: 2026-04-07

## Übersicht

Dieses Dokument listet alle in der Datenbank gespeicherten Felder mit Zweck, Personenbezug, Speicherfrist und Löschlogik.

---

## Tabelle: `profiles`

| Feld | Zweck | Personenbezogen | Speicherfrist | Löschlogik |
|---|---|---|---|---|
| `id` | User-ID (Supabase Auth UUID) | Ja (pseudonym) | Bis Account-Löschung | Account-Löschung in Settings |
| `email` | Login + Kontakt | Ja | Bis Account-Löschung | Account-Löschung |
| `username` | Anzeigename / Login | Ja | Bis Account-Löschung | Account-Löschung |
| `display_name` | Optionaler Anzeigename | Ja | Bis Account-Löschung | Account-Löschung |
| `role` | Admin/Editor Berechtigung | Nein | Bis Account-Löschung | Account-Löschung |
| `created_at`, `updated_at` | Zeitstempel | Nein | Bis Account-Löschung | Account-Löschung |

**RLS:** Nur authentifizierte User können Profile lesen. Nur eigenes Profil bearbeitbar.

---

## Tabelle: `redirect_events`

| Feld | Zweck | Personenbezogen | Speicherfrist | Löschlogik |
|---|---|---|---|---|
| `id` | Primärschlüssel | Nein | 24 Monate | pg_cron Job |
| `qr_code_id` | Zuordnung zum QR-Code | Nein | 24 Monate | pg_cron Job |
| `short_link_id` | Zuordnung zum Kurzlink | Nein | 24 Monate | pg_cron Job |
| `placement_id` | Zuordnung zur Platzierung | Nein | 24 Monate | pg_cron Job |
| `campaign_id` | Zuordnung zur Kampagne | Nein | 24 Monate | pg_cron Job |
| `short_code` | Genutzter Short-Code | Nein | 24 Monate | pg_cron Job |
| `event_type` | Art des Events (qr_open, link_open, etc.) | Nein | 24 Monate | pg_cron Job |
| `referrer` | Hostname der verweisenden Seite | Nein (nur Hostname) | 24 Monate | pg_cron Job |
| `user_agent` | **Immer NULL** (Legacy-Spalte) | Nein | — | Wird nicht mehr befüllt |
| `device_type` | Gerätekategorie (mobile/tablet/desktop) | Nein (Kategorie) | 24 Monate | pg_cron Job |
| `browser_family` | Browser-Familie (Chrome/Firefox/Safari/...) | Nein (Kategorie) | 24 Monate | pg_cron Job |
| `os_family` | Betriebssystem-Familie (iOS/Android/Windows/...) | Nein (Kategorie) | 24 Monate | pg_cron Job |
| `ip_hash` | Anonymisierter IP-Hash (16 Zeichen, Daily Salt) | Pseudonym | 24 Monate | pg_cron Job |
| `destination_url` | Ziel-URL (PII-Parameter entfernt) | Nein (sanitisiert) | 24 Monate | pg_cron Job |
| `country` | Land (ISO Alpha-2, z.B. "DE") | Nein (grobe Geo) | 24 Monate | pg_cron Job |
| `is_bot` | Bot-Erkennung | Nein | 24 Monate | pg_cron Job |
| `created_at` | Zeitpunkt des Events | Nein | 24 Monate | pg_cron Job |

**RLS:** INSERT mit Größenlimits (user_agent < 10, referrer < 256). Service Role für Inserts.

---

## Tabelle: `page_events`

| Feld | Zweck | Personenbezogen | Speicherfrist | Löschlogik |
|---|---|---|---|---|
| `id` | Primärschlüssel | Nein | 24 Monate | pg_cron Job |
| `event_type` | Art des Events (cta_click, form_submit, etc.) | Nein | 24 Monate | pg_cron Job |
| `qr_code_id` | Zuordnung | Nein | 24 Monate | pg_cron Job |
| `placement_id` | Zuordnung | Nein | 24 Monate | pg_cron Job |
| `campaign_id` | Zuordnung | Nein | 24 Monate | pg_cron Job |
| `session_id` | Session-Kennung | Pseudonym | 24 Monate | pg_cron Job |
| `page_url` | Besuchte Seite (PII-Parameter entfernt) | Nein (sanitisiert) | 24 Monate | pg_cron Job |
| `metadata` | Zusatzdaten (max 10 Keys, max 200 Zeichen, PII geblockt) | Nein (sanitisiert) | 24 Monate | pg_cron Job |
| `referrer` | Hostname der verweisenden Seite | Nein (nur Hostname) | 24 Monate | pg_cron Job |
| `user_agent` | **Immer NULL** (Legacy-Spalte) | Nein | — | Wird nicht mehr befüllt |
| `device_type` | Gerätekategorie | Nein (Kategorie) | 24 Monate | pg_cron Job |
| `browser_family` | Browser-Familie | Nein (Kategorie) | 24 Monate | pg_cron Job |
| `os_family` | OS-Familie | Nein (Kategorie) | 24 Monate | pg_cron Job |
| `ip_hash` | Anonymisierter IP-Hash | Pseudonym | 24 Monate | pg_cron Job |
| `created_at` | Zeitpunkt | Nein | 24 Monate | pg_cron Job |

**RLS:** INSERT mit Größenlimits (user_agent < 10, referrer < 256, metadata < 4KB).

---

## Tabellen ohne personenbezogene Daten

Folgende Tabellen enthalten ausschließlich organisatorische/strukturelle Daten ohne Personenbezug:

- `campaigns` — Kampagnen-Definitionen
- `campaign_tags` — Tags für Kampagnen
- `locations` — Standortdaten (Adressen, keine Personen)
- `placements` — Platzierungs-Definitionen
- `qr_codes` — QR-Code-Konfigurationen
- `qr_status_history` — Änderungsverlauf (referenziert `changed_by` → Profile-ID)
- `short_links` — Kurzlink-Konfigurationen
- `link_groups` — Kurzlink-Gruppen
- `custom_domains` — Benutzerdefinierte Domains
- `report_schedules` — E-Mail-Report-Einstellungen (enthält E-Mail-Adresse)

---

## Zusammenfassung: Personenbezogene Daten

| Kategorie | Felder | Maßnahme |
|---|---|---|
| Direkt personenbezogen | `profiles.email`, `profiles.username` | Account-Löschung möglich |
| Pseudonymisiert | `ip_hash`, `session_id` | Anonymisierung + Daily Salt + 24-Monate-Löschung |
| Ehemals gespeichert, jetzt NULL | `user_agent` (alle Tabellen) | Per Migration gelöscht, wird nicht mehr befüllt |
| Drittanbieter-IDs | fbclid, gclid, etc. | Per `sanitizeUrl()` vor Speicherung entfernt |
