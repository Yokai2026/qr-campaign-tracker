# Aufbewahrungsrichtlinie — QR Campaign Tracker (Spurig)

Stand: 2026-04-07

## Grundsatz

Personenbezogene und pseudonymisierte Daten werden nur so lange gespeichert, wie sie für den Verarbeitungszweck erforderlich sind (Art. 5 Abs. 1 lit. e DSGVO — Speicherbegrenzung).

---

## Aufbewahrungsfristen

| Datentyp | Speicherfrist | Löschmechanismus | Konfiguration |
|---|---|---|---|
| **Tracking-Events** (redirect_events, page_events) | 24 Monate | Automatisch via pg_cron | `supabase/migrations/005_data_retention_cron.sql` |
| **IP-Hashes** | 24 Monate (in Events) + Daily Salt Rotation | Automatisch via pg_cron | Salt rotiert täglich, Hash nur tagesaktuell vergleichbar |
| **User-Accounts** (profiles) | Bis zur Account-Löschung | Self-Service in Settings | `src/app/(dashboard)/settings/account-actions.ts` |
| **Kampagnen, Platzierungen, QR-Codes** | Bis zur manuellen Löschung | Durch Benutzer/Admin | Standard-CRUD |
| **Kurzlinks** | Bis zur manuellen Löschung/Archivierung | Durch Benutzer/Admin | Standard-CRUD |
| **E-Mail-Report-Einstellungen** | Bis zur Deaktivierung/Account-Löschung | Durch Benutzer | Settings-UI |

---

## Automatische Löschung

### pg_cron Job: `cleanup-old-tracking-events`

- **Zeitplan:** Täglich um 03:00 UTC
- **Aktion:** Löscht alle `redirect_events` und `page_events` mit `created_at` älter als 24 Monate
- **Logging:** Anzahl gelöschter Datensätze wird in PostgreSQL-Log geschrieben
- **Funktion:** `public.cleanup_old_events()`

### IP-Hash Daily Salt

- **Mechanismus:** Der IP-Hash verwendet das aktuelle Datum als Salt (`YYYY-MM-DD`)
- **Wirkung:** Derselbe Besucher erzeugt jeden Tag einen anderen Hash
- **Konsequenz:** IP-Hash-basierte Unique-Visitor-Zählung ist nur tagesaktuell valide, was Langzeit-Tracking verhindert

---

## Manuelle Löschung

### Account-Löschung (Self-Service)

- Benutzer können ihren Account in den Einstellungen selbst löschen
- Löscht: Profil, Auth-Account, alle zugeordneten Daten (Campaigns mit Owner-Referenz werden auf NULL gesetzt)
- **Pfad:** Einstellungen → Konto löschen

### Betroffenenrechte

- **Auskunft (Art. 15):** Über Settings einsehbar (eigenes Profil, eigene Kampagnen)
- **Löschung (Art. 17):** Self-Service Account-Löschung
- **Datenportabilität (Art. 20):** CSV-Export für alle eigenen Daten (geplant)
- **Anfragen:** Per E-Mail an den Betreiber (siehe Datenschutzerklärung)

---

## Kein Tracking ohne Zweck

- **Keine Cookies** für Tracking-Zwecke
- **Kein Fingerprinting** — nur Gerätekategorie, Browser-Familie, OS-Familie
- **Keine Drittanbieter-Tracker** — kein Google Analytics, kein Facebook Pixel
- **Kein Cross-Site-Tracking** — Drittanbieter-Click-IDs (fbclid, gclid, etc.) werden vor Speicherung entfernt
