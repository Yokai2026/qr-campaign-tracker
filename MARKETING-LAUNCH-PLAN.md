# Spurig — Marketing-Launch-Plan (Stufe 1)

**Stand:** 2026-05-15
**Budget:** €100–300 / Monat
**Markt:** DACH (Deutschland · Österreich · Schweiz)
**Ziel:** Erste 5–10 neue Trial-Signups in den nächsten 3 Wochen

---

## 1) Vorbedingungen (vor Launch erledigen)

### A) Google-Ads-Konto + Conversion-Tracking einrichten

1. **Google-Ads-Konto erstellen** auf https://ads.google.com (falls noch keins)
2. **Conversion-Action 'Signup' anlegen**
   - Tools → Measurement → Conversions → New Conversion
   - Category: **Lead**
   - Conversion name: **Spurig Signup**
   - Value: **Use the same value for each conversion → 0 €** (Lead, kein Verkaufswert)
   - Count: **One**
   - Notiere die `send_to`-ID (Format: `AW-XXXXX/YYYYY`)
3. **Conversion-Action 'Purchase' anlegen**
   - Category: **Purchase**
   - Conversion name: **Spurig Subscription**
   - Value: **Use different values for each conversion**
   - Currency: **EUR**
   - Notiere die `send_to`-ID
4. **Env-Vars in Vercel setzen** (Production):
   ```
   NEXT_PUBLIC_GOOGLE_ADS_ID=AW-1234567890
   NEXT_PUBLIC_GA_CONVERSION_SIGNUP=AW-1234567890/abcdefgh
   NEXT_PUBLIC_GA_CONVERSION_PURCHASE=AW-1234567890/xyz12345
   ```
   Per CLI: `node --env-file=.env.local scripts/vercel-ops.mjs env:set NEXT_PUBLIC_GOOGLE_ADS_ID AW-... production`

Der Code ist bereits eingebaut:
- `src/lib/conversion/google-ads.ts` (Helper)
- `src/components/marketing/google-ads-script.tsx` (gtag.js Loader)
- `src/app/signup/verify/page.tsx` (feuert Signup-Conversion nach OTP-Verify)
- `src/app/(dashboard)/settings/page.tsx` (feuert Purchase-Conversion bei `?upgraded=1`)

---

## 2) Kampagnen-Struktur (3 Anzeigengruppen)

| Anzeigengruppe | Landing-Page | Tagesbudget | Max CPC |
|---|---|---|---|
| **DSGVO-Switch** | `/dsgvo-qr-code` oder `/bitly-alternative` | €3 | €1.50 |
| **QR-Print-Tracking** | `/qr-code-print-tracking` | €3 | €1.20 |
| **Gastro-QR** | `/qr-code-fuer-gastronomie` | €2 | €1.00 |

**Standorte:** Deutschland, Österreich, Schweiz (alle)
**Sprache:** Deutsch
**Geräte:** alle (Mobile + Desktop), keine TV/Console
**Anzeigenrotation:** Optimieren (default)
**Gebotsstrategie:** **Manueller CPC** mit aktivem Smart-Bidding-Hinweis (erst nach 15+ Conversions auf "Maximize Conversions" wechseln)

---

## 3) Keywords (Match-Types)

### Anzeigengruppe 1: DSGVO-Switch (→ `/bitly-alternative`)

**Phrase-Match `"..."`:**
```
"bitly alternative"
"bitly dsgvo"
"bitly datenschutz"
"kurzlink dsgvo"
"link tracking dsgvo"
"link shortener dsgvo"
"linktree alternative dsgvo"
"linktree dsgvo"
"branded short link deutschland"
"kurzlink eigene domain"
```

**Exact-Match `[...]`:**
```
[bitly alternative deutschland]
[dsgvo konformer link shortener]
[kurz url dsgvo]
```

### Anzeigengruppe 2: QR-Print-Tracking (→ `/qr-code-print-tracking`)

**Phrase-Match:**
```
"qr code tracking"
"qr code analytics"
"qr code mit statistik"
"qr code scans messen"
"qr code auswertung"
"flyer tracking qr"
"plakat qr tracking"
"qr code roi"
"print kampagne tracking"
```

**Exact-Match:**
```
[qr code tracking software]
[qr code analytics dsgvo]
[qr code generator mit statistik]
```

### Anzeigengruppe 3: Gastro-QR (→ `/qr-code-fuer-gastronomie`)

**Phrase-Match:**
```
"qr code speisekarte"
"qr code restaurant"
"digitale speisekarte tracking"
"bewertungs qr code"
"google bewertung qr code"
"qr code gastronomie analytics"
```

**Exact-Match:**
```
[qr code speisekarte tracking]
[qr code restaurant statistik]
```

---

## 4) Negative Keywords (KAMPAGNEN-WEIT setzen!)

Verhindert Geld-Verbrennen für irrelevante Suchen:

```
-kostenlos
-free
-erstellen
-generator gratis
-online erstellen
-app
-android
-iphone
-pdf
-druck
-vorlage
-template
-buch
-tattoo
-tutorial
-kurs
-lernen
-job
-jobs
-karriere
-gehalt
-bedeutung
-was ist
-erklärung
-wikipedia
-wiki
```

→ Diese gehen in den **Campaign-Level-Negative-Keyword-Listen** (nicht Anzeigengruppen-Level).

---

## 5) Ad-Copy (Responsive Search Ads)

Pro Anzeigengruppe **1 RSA** mit **mehreren Headlines + Descriptions**. Google rotiert dann automatisch.

### Anzeigengruppe 1: DSGVO-Switch

**Headlines** (15 möglich, je max 30 Zeichen):
```
1.  Bitly-Alternative DSGVO
2.  Kurzlinks aus Deutschland
3.  Bitly + DSGVO = Risiko
4.  Eigene Domain inklusive
5.  Server in Frankfurt
6.  Tracking ohne Cookie-Banner
7.  Live-Dashboard inklusive
8.  Ab 8,99 € pro Monat
9.  14 Tage gratis testen
10. Keine Kreditkarte nötig
11. {KeyWord:DSGVO-Kurzlinks von Spurig}
12. Schluss mit US-Tracking
13. EU-Hosting · Kein Schrems-II
14. Bitly ersetzen in 5 Min
15. Mehr ROI · weniger Risiko
```

**Descriptions** (4 möglich, je max 90 Zeichen):
```
1. DSGVO-konformes Link-Tracking aus Deutschland. Server in Frankfurt, ohne Cookie-Banner.
2. Spurig ersetzt Bitly mit eigener Domain & Live-Stats. 14 Tage gratis · ab 8,99 €/Monat.
3. Klick-Tracking pro Quelle, Kanal & Region. Alles in einem Dashboard. EU-Hosting.
4. Keine Drittanbieter. Keine Datenverarbeitung in den USA. Sauber dokumentiert.
```

**Final URL:** `https://spurig.com/bitly-alternative`
**Display Path:** `/dsgvo/kurzlinks`

---

### Anzeigengruppe 2: QR-Print-Tracking

**Headlines:**
```
1.  QR-Code mit Live-Statistik
2.  Plakat-ROI endlich messen
3.  Welcher Flyer bringt Kunden?
4.  Scans pro Standort live
5.  QR-Tracking aus Deutschland
6.  Print-Kampagne tracken
7.  Mehr ROI · weniger Müll
8.  Spurig — Print mit Daten
9.  Ab 8,99 € pro Monat
10. 14 Tage gratis testen
11. DSGVO-konform · EU-Server
12. QR-Codes mit Branding
13. Echtzeit-Dashboard
14. {KeyWord:QR-Code-Tracking}
15. Pro Standort messen
```

**Descriptions:**
```
1. Wie viele Scans hat Plakat A vs B? Spurig zeigt's live — pro Standort, pro Auflage.
2. Aufkleber, Flyer, Visitenkarten getrennt tracken. Dashboard mit Echtzeit-Stats.
3. DSGVO-konform, EU-Hosting, kein Cookie-Banner. Ab 8,99 €/Monat.
4. Spurig: dein QR-Code mit Statistik, ohne Drittanbieter, made in Berlin.
```

**Final URL:** `https://spurig.com/qr-code-print-tracking`
**Display Path:** `/qr-tracking/print`

---

### Anzeigengruppe 3: Gastro-QR

**Headlines:**
```
1.  QR-Speisekarte mit Stats
2.  Welcher Tisch scannt am meisten?
3.  Bewertungs-QR mit Tracking
4.  Google-Bewertungen messen
5.  Mehr Gäste durch Daten
6.  Spurig für Gastro
7.  Live-Dashboard für Cafés
8.  Speisekarten-QR Pro
9.  Ab 8,99 € pro Monat
10. 14 Tage gratis testen
11. {KeyWord:QR-Code-Speisekarte}
12. Pro Aktion eigene Statistik
13. DSGVO-konform · EU-Server
14. Berlin · Made in Germany
15. QR-Codes mit Branding
```

**Descriptions:**
```
1. Welcher Aushang scannt am meisten? Spurig zeigt's live — pro Standort im Restaurant.
2. Speisekarten-QR, Bewertungs-Aufsteller, Reservierungs-QR — alles getrennt messen.
3. Dashboard zeigt was am Mittag, am Abend, am Wochenende funktioniert. Ab 8,99 €.
4. DSGVO-konform, keine US-Server, kein Cookie-Banner. Setup in 5 Min.
```

**Final URL:** `https://spurig.com/qr-code-fuer-gastronomie`
**Display Path:** `/qr-tracking/gastro`

---

## 6) Sitelinks (kampagnen-weit)

4 Sitelinks unter jeder Anzeige — boost CTR + Authority:

| Text | URL | Beschreibung |
|---|---|---|
| 14 Tage gratis testen | `https://spurig.com/signup` | Ohne Kreditkarte starten |
| Live-Demo | `https://spurig.com/pitch` | Spurig in 60 Sekunden |
| Preise | `https://spurig.com/pricing` | 8,99 € oder 12,99 € |
| DSGVO-Compliance | `https://spurig.com/datenschutz` | EU-Hosting, kein US-Risiko |

---

## 7) Callouts (kampagnen-weit, max 4 Zeichen je 25)

```
EU-Hosting in Frankfurt
DSGVO-konform 100%
Kein Cookie-Banner
14 Tage gratis
Setup in 5 Minuten
Made in Berlin
Ohne Kreditkarte starten
Eigene Domain inklusive
```

---

## 8) Structured Snippets

**Type:** Features

**Values:**
```
QR-Code-Tracking
Kurzlink-Tracking
Live-Dashboard
Eigene Domain
DSGVO-konform
Print-Analytics
```

---

## 9) Conversion-Tracking — End-to-End-Test

Nach Env-Var-Setup + Redeploy:

1. **Test-Signup mit `?gclid=test123` an der URL**
   - z.B. `https://spurig.com/signup?gclid=test123`
   - Signup durchklicken bis `/dashboard`
   - In Chrome-DevTools → Network-Tab → suche nach `googleads.g.doubleclick.net` oder `googletagmanager.com`
   - Conversion-Event sollte gefeuert haben mit `event=conversion`
2. **Google Ads → Tools → Conversions → Signup**
   - Status sollte nach ~1h von "Inactive (no conversions yet)" auf "Recording conversions" wechseln

Wenn nichts ankommt:
- Check Browser-Console auf `gtag is not defined` (= Script lädt nicht)
- Check Env-Var `NEXT_PUBLIC_GOOGLE_ADS_ID` ist in Vercel Production gesetzt + Build wurde nach Setzen neu gemacht

---

## 10) Erwartung + Stop-Loss-Regeln

**Realistische 14-Tage-Erwartung** (€150 Budget):
- 100–200 Klicks
- 3–8 Signups (Trial)
- 1–2 Paid Conversions
- → CAC: €75–150 pro Paying Customer

**Stop-Loss-Regeln** (manuell jeden 2. Tag prüfen):
- Keyword mit > 10 Klicks + 0 Signups → **pausieren**
- Anzeigengruppe mit > €40 Spend + 0 Signups → **pausieren oder Headlines neu schreiben**
- CTR < 1% nach 50 Impressions → **Headlines testen**

**Skalierung wenn's funktioniert:**
- 3 paying Customers in 14 Tagen → Tagesbudget verdoppeln
- CAC unter €60 → Tagesbudget verdreifachen + Match-Type "Broad" für Top-Keywords öffnen

---

## 11) Was als nächstes kommt (Stufe 2 + 3)

**Stufe 2** (nach 1 Woche echter Daten):
- Google-Ads-API Read-only-Integration in Admin-Dashboard
- Tägliche Spend/Click/Conversion-Sicht in `/admin`
- Discord-Ping bei neuer Paid-Conversion (analog zu Cold-Mail-Click)

**Stufe 3** (nach 2-3 Wochen):
- Auto-Pause: Keywords > €X Cost / 0 Conversions → automatisch pausieren
- Auto-Scale: Anzeigengruppen mit CAC < €Y → Budget +20%
- Stripe-Webhook-zu-Google-Ads-Offline-Conversion-Bridge: GCLID wird beim Signup auf `profiles` persistiert, beim Stripe-Purchase wird die Offline-Conversion mit GCLID an Google Ads gepostet → exakte Match-Attribution

**Meta-Ads:** erst sinnvoll wenn du 100+ Visitors/Tag auf der Site hast (für Retargeting via Pixel). Cold-B2B-Meta-Ads sind teurer Quatsch.

**Flyer:** A6-Druck mit eigenem Spurig-QR-Code (Meta-Marketing!) — 500 Stück ~€30 bei flyeralarm.de. Verteilen in lokalen Gewerbegebieten / Cafés. Headline: *"Dieser Flyer trackt sich selbst — schau live wie viele drauf scannen"*.

**Social Videos:** 60-Sek-Reel/Short zu jedem deiner Blog-Posts. Du hast bereits den Repurpose-Pipeline (siehe `/admin/content`).

---

## 12) Quick-Reference: Was du JETZT tun musst

1. ☐ Google-Ads-Konto erstellen (10 Min)
2. ☐ Conversions 'Signup' + 'Purchase' anlegen (10 Min)
3. ☐ Env-Vars in Vercel Production setzen + Redeploy (5 Min)
4. ☐ Kampagne im Google-Ads-Editor anlegen mit obigen Daten (45–60 Min)
5. ☐ Stop-Loss-Regeln in Kalender setzen (5 Min)
6. ☐ Nach 7 Tagen: Performance-Review + Stufe-2-Greenlight

**Total Setup-Zeit:** ~90 Min. Danach: täglich 5 Min Monitoring.
