# DSGVO — Manuelle To-dos (nicht im Code lösbar)

Stand: 2026-04-07

Diese Aufgaben erfordern organisatorische Maßnahmen und können nicht rein technisch umgesetzt werden.

---

## 1. AVV/DPA mit Dienstleistern abschließen

Auftragsverarbeitungsverträge (Art. 28 DSGVO) mit allen Unterauftragsverarbeitern:

| Dienstleister | Zweck | DPA verfügbar | Status |
|---|---|---|---|
| **Vercel** | Hosting, Edge Network, Geolocation-Headers | [Vercel DPA](https://vercel.com/legal/dpa) | Abschließen |
| **Supabase** | Datenbank, Auth, Realtime | [Supabase DPA](https://supabase.com/legal/dpa) | Abschließen |
| **Resend** | E-Mail-Versand (Report-E-Mails) | [Resend DPA](https://resend.com/legal/dpa) | Abschließen |

**Aktion:** Jeweiligen DPA online unterzeichnen / per E-Mail anfordern und ablegen.

---

## 2. Verzeichnis der Verarbeitungstätigkeiten (Art. 30 DSGVO)

Pflicht für jeden Verantwortlichen. Muss enthalten:

- Name und Kontaktdaten des Verantwortlichen
- Zwecke der Verarbeitung
- Kategorien betroffener Personen und personenbezogener Daten
- Kategorien von Empfängern (Supabase, Vercel, Resend)
- Übermittlungen in Drittländer (EU-US Data Privacy Framework)
- Vorgesehene Löschfristen (siehe `docs/retention-policy.md`)
- Beschreibung der TOM (siehe Punkt 6)

**Vorlage:** Datenintentrar in `docs/data-inventory.md` als Grundlage nutzen.

---

## 3. DSFA-Vorprüfung (Art. 35 DSGVO)

Eine Datenschutz-Folgenabschätzung ist wahrscheinlich **nicht** erforderlich, weil:

- Kein Profiling oder automatisierte Einzelentscheidung
- Keine besonderen Kategorien personenbezogener Daten
- Keine systematische umfangreiche Überwachung öffentlich zugänglicher Bereiche
- IP-Anonymisierung und Datenminimierung reduzieren das Risiko erheblich

**Aktion:** Diese Einschätzung formal dokumentieren und begründen (Schwellwertanalyse). Bei Unsicherheit: Aufsichtsbehörde konsultieren.

---

## 4. Impressum mit echten Betreiber-Daten füllen

Aktuell enthält `/impressum` Platzhalter-Daten.

**Aktion:** Folgende Felder mit echten Daten befüllen:
- Betreiber-Name (natürliche oder juristische Person)
- Anschrift
- Kontakt-E-Mail
- Telefonnummer (empfohlen)
- Vertretungsberechtigte Person (bei juristischer Person)
- USt-IdNr. (falls vorhanden)
- Zuständige Aufsichtsbehörde (falls relevant)

**Datei:** `src/app/impressum/page.tsx`

---

## 5. Incident-/Breach-Response-Prozess

Meldepflicht bei Datenschutzverletzungen (Art. 33 + 34 DSGVO):

- **Meldung an Aufsichtsbehörde:** Innerhalb 72 Stunden nach Kenntnisnahme
- **Benachrichtigung Betroffener:** Bei hohem Risiko unverzüglich

**Aktion:** Prozess dokumentieren:
- Wer ist zuständig?
- Welche Aufsichtsbehörde ist zuständig?
- Meldewege und Fristen
- Dokumentationsvorlage für Vorfälle
- Eskalationspfad

---

## 6. TOM-Dokumentation

Technische und organisatorische Maßnahmen (Art. 32 DSGVO) formal dokumentieren:

### Technisch (bereits implementiert)
- Verschlüsselung: HTTPS/TLS (Vercel), Supabase-Encryption-at-Rest
- Zugriffskontrolle: Supabase RLS, Auth mit Session-Management
- IP-Anonymisierung: Zeroing + Daily Salt Hash
- Datenminimierung: Kein voller User-Agent, Referrer nur Hostname, URL-Sanitisierung
- Automatische Löschung: pg_cron nach 24 Monaten
- Security Headers: HSTS, X-Frame-Options, Referrer-Policy

### Organisatorisch (zu dokumentieren)
- Zugriffsberechtigungen: Wer hat Zugang zum Supabase Dashboard/Admin?
- Passwort-Richtlinie: Min. 10 Zeichen
- Regelmäßige Überprüfung der Maßnahmen
- Schulung von Mitarbeitern (falls relevant)

---

## 7. Prozess für Betroffenenrechte-Anfragen

Betroffene haben Anspruch auf (Art. 15-22 DSGVO):

| Recht | Umsetzung | Status |
|---|---|---|
| **Auskunft** (Art. 15) | Über Settings einsehbar (Profil, Kampagnen) | Teilweise |
| **Berichtigung** (Art. 16) | Profil-Bearbeitung in Settings | Implementiert |
| **Löschung** (Art. 17) | Self-Service Account-Löschung | Implementiert |
| **Einschränkung** (Art. 18) | Per E-Mail-Anfrage | Manuell |
| **Datenportabilität** (Art. 20) | CSV-Export (geplant: Self-Service) | Teilweise |
| **Widerspruch** (Art. 21) | Per E-Mail-Anfrage | Manuell |

**Aktion:**
- Kontakt-E-Mail in Datenschutzerklärung und Impressum korrekt angeben
- Antwortfrist: 1 Monat (verlängerbar auf 3 Monate bei Komplexität)
- Identitätsprüfung vor Auskunft definieren
- Self-Service Daten-Export implementieren (Art. 20 Portabilität)

---

## 8. Supabase Passwort-Policy

**Aktion:** Im Supabase Dashboard:
1. Authentication → Settings
2. Mindest-Passwortlänge auf **10** setzen

Dies ergänzt die serverseitige Validierung im Signup-Formular.

---

## Checkliste

- [ ] AVV/DPA mit Vercel unterzeichnet
- [ ] AVV/DPA mit Supabase unterzeichnet
- [ ] AVV/DPA mit Resend unterzeichnet
- [ ] Verzeichnis der Verarbeitungstätigkeiten erstellt
- [ ] DSFA-Vorprüfung dokumentiert
- [ ] Impressum mit echten Daten gefüllt
- [ ] Incident-Response-Prozess definiert
- [ ] TOM-Dokumentation erstellt
- [ ] Betroffenenrechte-Prozess definiert
- [ ] Supabase Passwort-Policy auf 10 gesetzt
- [ ] Self-Service Daten-Export implementiert
