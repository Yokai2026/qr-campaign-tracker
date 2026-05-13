# Next-Session-Prompt für Spurig

Kopiere ALLES UNTERHALB der Trennlinie in eine neue Claude-Session.

---

Hi Claude, ich arbeite an **Spurig** (https://spurig.com) — DSGVO-konformes QR-Code- und Kurzlink-Tracking-Tool, gehostet auf Vercel + Supabase, EU-only.

**Pfad:** `C:\Users\david\Documents\3.0 Fertige KI Projekte\qr-campaign-tracker`

## Wo wir stehen

Lies zuerst diese Memory-Files:
1. `~/.claude/projects/.../memory/spurig_state_2026_05_13.md` — aktueller Status nach 2-Tages-Sprint
2. `~/.claude/projects/.../memory/spurig_external_apis.md` — alle Tokens und Resource-IDs
3. `.claude/sales/` (im Projekt) — Sales-Framework für Customer Acquisition

## Letzte Session-Highlights

- **Pricing V2 live:** 12,99 €/Mo Regular, erste 3 Monate 5,99 €, Yearly 8,99 €/Mo = 107,88 €/Jahr (31 % Ersparnis)
- **Public REST API** auf `/api/v1` + Token-Mgmt in Settings + `/api-docs` öffentlich
- **Custom Domains** funktionieren end-to-end (Vercel + Cloudflare-API integriert)
- **Email-Pipeline:** Resend-SMTP für Supabase Auth + Email Routing für support@spurig.com
- **Sales-Framework gebaut:** 5 Dateien in `.claude/sales/` — ICP, Templates, 7-Tage-Playbook, Discovery-Fragen, Leads-CRM
- **Onboarding-Tour** mit driver.js auf Dashboard + Restart-Button in Settings
- **Endnutzer-Guide** auf `/guide` mit Print-zu-PDF

## Aktuelle Prioritäten (Reihenfolge nach Wert)

### 1. **SALES STARTEN** ← Wichtigste Aufgabe

David soll mit 20+ potenziellen Kunden Discovery-Gespräche führen (kein „kaufen Sie?", sondern „wie messen Sie Print aktuell?"). Sales-Framework liegt bereit. Du musst die Cold-DMs / Cold-Emails personalisieren wenn David LinkedIn-Profile schickt.

**Wenn David Profile reinschickt:** Template aus `.claude/sales/outreach-templates.md` nehmen, personalisieren basierend auf was im Profil steht, Final-Text geben den er rauskopieren kann.

### 2. Bekannte offene Bugs

- **Analytics/Dashboard-Crash** „Cannot read properties of undefined (reading 'subscribe')" — Defensive-Fixes deployed (Commit 6b5cbdd), aber unklar ob das Browser-Cache war. **TODO:** Status klären — David im Inkognito testen lassen, falls auch da crasht → tieferer Bug.
- **Welcome-Mail-Receipt** noch nicht End-to-End geprüft

### 3. Spurig-Polish-Liste (low priority)

- Edit-QR-Form Lokalzeit-Korrektur (nur Create-Form ist gefixt)
- n8n-Pipeline für Reports/Alerts testen
- Cron-Jobs `/api/cron/scheduling`, `/api/cron/reports`, `/api/cron/check-alerts` ungetestet
- Marketing-Polish auf pitch/page.tsx, opengraph-image — alte Preise prüfen

## Wichtige Working-Regeln

1. **Wenn ich Tokens/Zugriff habe → ausführen, nicht Dashboard-Anleitung geben.** Alle Tokens in `.env.local`.
2. **Owner = tomatenkopf36@gmail.com** (user_id `1122b816-54ba-4774-b56c-a6cd637c4ff1`)
3. **Custom-Domain-Setup** für andere Domains: User muss neuen CF-Token für die jeweilige Zone geben.
4. **Pricing: 12,99/5,99/8,99 € sind die richtigen Zahlen.** Falls du irgendwo 4,99 oder andere alte siehst → bitte fixen.
5. **Suchleiste/Command-Palette ist GELÖSCHT** und soll nicht wieder eingebaut werden ohne explizite Diskussion.
6. **API-Token-Pattern:** Tokens sind SHA-256-gehasht in DB, Plaintext nur 1× beim Erstellen sichtbar.

## Wo finde ich was

- **Stripe-Setup:** Neue Prices in `spurig_state_2026_05_13.md` notiert. Coupon `intro_3mo` für Monthly-Intro.
- **Resend-Domain:** spurig.com verifiziert, ID `87b310d7-2668-48b2-bbc6-a8c4ca62671b`
- **Cloudflare-Zonen:** spurig.com `d10404eab91e6e1979fd2b9bbb7fbacd`, pokishi.com `87afd60c82ef61656987bfc425aa954e`
- **Letzter Git-Commit:** `54e2c41` auf master

## Erste Aktion

Begrüße mich kurz, sag mir was du in den Memory-Files gefunden hast (so dass ich weiß du bist im Bild), und frag wo wir weitermachen. Schlag mir die 3 sinnvollsten Optionen vor (Sales / Bug-Fixes / Polish).

---
