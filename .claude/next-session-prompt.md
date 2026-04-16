# Next Session: Design Overhaul Phase 3 — Grosses Redesign

## Kontext
Nach Screenshot-Review (2026-04-16) ist klar: Die bisherigen Aenderungen reichen nicht.
Die Seite wirkt immer noch "zusammengebaut" statt "designed".
User-Feedback: Fonts passen nicht, Farben nicht stimmig, Pricing unklar, nicht modern genug.

## Entscheidung steht an: Kompletter visueller Reboot

Der User muss in der naechsten Session entscheiden, welche Richtung:

### Option A: "Linear/Notion"-Richtung (empfohlen)
- **Font**: Inter Variable fuer alles (wie Linear, Notion, Cal.com)
- **Akzent**: Teal/Emerald (`#0D9488`) — sagt "Wachstum, Daten, Tracking"
- **Vibe**: Clean, technisch, vertrauenswuerdig, minimal
- **Referenzen**: linear.app, resend.com, betterstack.com

### Option B: "Warm-Neutral"
- **Font**: Satoshi 600-700 (Headings) + Inter 400-500 (Body)
- **Akzent**: Verfeinertes Amber (weniger laut, konsistenter)
- **Vibe**: Warm, nahbar, deutsch-handwerklich
- **Referenzen**: amie.so, notion.so

### Option C: "Dark Premium"
- **Font**: General Sans oder Manrope
- **Akzent**: Violet/Indigo (`#7C3AED`)
- **Vibe**: Premium, developer-tool, dunkel
- **Referenzen**: cursor.com, linear.app (dark mode)

## Was in JEDER Option passiert

### 1. Font-Swap
- Bricolage Grotesque + IBM Plex Sans RAUS
- Neue Font(s) via `next/font/google` rein
- `--font-heading` und `--font-sans` in globals.css updaten

### 2. Farb-Vereinfachung
- EIN Akzent-Farbe, konsequent ueberall (Buttons, Links, Badges, Charts, Icons)
- Keine konkurrierenden Farben (kein Amber + Gruen + Blau gleichzeitig)
- Neutrals auf Zinc-Palette: `#09090B` (dark), `#71717A` (muted), `#FAFAFA` (light)

### 3. Pricing-Section komplett neu
- Preis als GROESSTES Element (48-64px font-size)
- Single Card, zentriert
- Feature-Checkliste UNTER dem Preis (nicht daneben)
- CTA-Button direkt am Preis, keine Aufteilung links/rechts

### 4. Visual Cleanup
- Uppercase-Labels und Pills reduzieren
- Domain-Showcase Phone-Mockups vereinfachen (Browser-Chrome ist immer noch drin)
- Einheitliches Card-Pattern ueberall
- Weniger Badges, Chips, Deko-Elemente

## Was bereits erledigt ist (Session 2026-04-16, Phase 2)

### Landing
- Domain-Showcase: SectionEyebrow -> warmes Label, links-aligned
- Features-Bento: Icon-Backgrounds auf accent-warm, Chart-Linie/Gradient auf accent-warm
- Site-Footer: font-heading auf Brand-Name

### Dashboard
- Mobile Bottom-Navigation (5 Tabs: Dashboard, Kampagnen, QR-Codes, Analytik, Mehr)
- Sidebar: Focus-Trap fuer Mobile-Menu (Escape schliesst, Tab-Cycling)

### Accessibility
- Table: `scope="col"` Default auf allen `<th>`
- FormField: `aria-describedby` verbindet Inputs mit Error/Help Messages
- InputField + TextareaField: `aria-describedby` + `aria-invalid`

### Aus Phase 1 (fruehere Session)
- Hero: Gradient-Text entfernt, font-heading, warmer Akzent
- Hero-Mock: Floating Chips + Browser Chrome entfernt
- Header: Nav links-aligned
- Steps: Timeline-Layout mit grossen Nummern
- Features Bento: Links-aligned Header
- Pricing: Links-aligned Header, warme Checkmarks
- FAQ: Eyebrow entfernt
- Final CTA: font-heading, warme Checkmarks
- Sidebar: Kontrast erhoeht
- Skip-Navigation, Focus-Indikatoren, prefers-reduced-motion

## Recherche-Ergebnisse (fuer Umsetzung)

### Top SaaS-Font-Kombis 2025/26
1. **Inter Variable** (alles) — Linear, Notion, Cal.com
2. **Satoshi 700** (headings) + **Inter 400** (body) — warm aber clean
3. **General Sans** (headings) + **Inter** (body) — neutral-expressiv
4. **Manrope** — futuristisch, gut fuer datenreiche UIs

### Farb-Trends
- Nicht pure #000/#FFF — stattdessen #09090B/#FAFAFA (tinted neutrals)
- Zinc-Palette als System: #71717A, #A1A1AA, #D4D4D8
- Single strong accent: Teal, Violet, oder verfeinertes Amber
- Emerald nur fuer "Erfolg"-Signale, nicht als Primaer-Akzent

### Pricing Best Practices
- Preis = groesstes Text-Element der Section
- Spar-Anzeige bei Toggle: konkrete Euros > Prozent
- Social Proof neben Preis (User-Zahl, Logos)
- CTA sagt was passiert: "14 Tage kostenlos testen" statt "Starten"

### Referenz-Sites (checken!)
- linear.app — dark, monochrome, product-first
- betterstack.com — dark theme, echte Screenshots
- resend.com — developer-tool, clean typography
- amie.so — clean, spezifische Value Props
- notion.so — weiss, bold CTAs, Whitespace

## Noch offen (unabhaengig vom Redesign)
- Dashboard KPI-Consolidation (8 Cards -> Gruppen/Tabs)
- Copy-Variation-Pass (Heading-Patterns variieren)
- Scroll-triggered Entrance-Animationen
- Monochrome Dashboard-Charts auf neue Palette umstellen

## Constraints (unveraendert)
- DSGVO-Konformitaet Pflicht
- Deutsche UI, englischer Code
- Privacy-first
- Build muss clean bleiben
- Per Phase commiten
