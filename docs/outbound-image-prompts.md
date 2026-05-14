# Outbound E-Mail Hero-Images — Prompts

Diese Prompts kannst du in Midjourney, DALL-E 3 oder Flux nutzen um Hero-Banner für die Cold-Mails zu generieren. Ziel-Größe: **1200×400 px**. Speichern unter `public/email-assets/hero-{segment}.png`, dann in `templates.ts` als `<img src="https://spurig.com/email-assets/hero-marketing.png">` einbinden.

## Brand-Farben
- Primary Purple: `#6366f1`
- Accent: `#a855f7`
- Text: `#111827`
- Muted: `#6b7280`

---

## 1. Marketing-Agentur (`hero-marketing.png`)

```
Editorial flat-design email hero banner, 1200x400 pixels, ultra-clean white background with subtle dot-grid pattern.

Left third: A printed marketing poster mockup leaning against a wall, featuring a large stylized black QR code (clean, no embedded logo). Subtle paper texture, soft shadow.

Center third: A floating minimalist dashboard card showing a horizontal bar chart titled "Scans pro Standort", with bars for "Berlin (247)", "Hamburg (189)", "Köln (14)". Bars in deep purple (#6366f1). White card background with subtle shadow.

Right third: Three small badges stacked vertically: "🇩🇪 Made in Berlin", "DSGVO konform", "EU-Hosting Frankfurt". Each badge has a soft grey border, small green checkmark.

Style: monochrome (white + light grey + black) with ONE accent color (#6366f1 deep purple). Inspired by Linear, Stripe, Vercel marketing pages. Sharp, professional, trustworthy.

NO people, NO hands, NO faces, NO 3D, NO cartoon. Vector aesthetic, flat design.

Negative prompt: cluttered, busy, photorealistic, stock photo, gradients, neon, retro
```

## 2. Gastronomie (`hero-gastro.png`)

```
Clean editorial illustration, 1200x400 pixels, off-white background.

Left half: A wooden restaurant table corner, top-down view, with an open menu card lying on it. The menu has a clean QR code at the bottom right. Coffee cup and small leaf in soft focus background. Photorealistic-but-stylized.

Right half: A floating phone mockup (iPhone, simplified) showing a Spurig dashboard with a German label "247 Scans heute · Tisch 5 (Top-Performer)". Background of phone shows simplified bar chart in purple #6366f1.

Top right: small badge "🇩🇪 DSGVO-konform · ab 8.99€/Mo"

Style: warm minimal, professional, B2B SaaS aesthetic. Like Notion or Linear marketing visuals.

NO people, NO hands, NO faces. Sharp, clean, modern.

Negative prompt: cluttered, photorealistic stock, cartoon, 3D, neon
```

## 3. Print/Handwerk (`hero-print.png`)

```
Minimalist isometric scene, 1200x400 pixels, white background.

Left: 3 stacked flyers fanned out, each with a different QR code corner. Subtle shadows.

Right: A laptop screen mockup (top half visible, isometric angle) showing a bar chart with labeled standorts in purple #6366f1.

Center floating element: An animated-looking arrow connecting flyer-QR-code → laptop chart, indicating tracking flow.

Style: Apple/Linear marketing style, clean, vector, accent color #6366f1.

NO people, NO faces. Sharp, professional.
```

## 4. Events/Tourismus (`hero-events.png`)

```
Editorial flat-design banner, 1200x400 pixels, white background.

Left: A large outdoor poster mockup (billboard-style) with QR code, leaning slightly. Soft urban background hint.

Right: A floating dashboard card with map of Germany highlighting 3 city dots: Berlin, München, Hamburg. Each dot has a small number (247, 189, 14). Dots in purple #6366f1, lines connecting to a small summary card "Top Standorte".

Top right: badge "QR pro Standort · EU-Hosting"

Style: monochrome + purple accent, minimal, modern B2B.

NO people, NO 3D, NO cartoon.
```

---

## Wo Generieren

| Tool | Cost | Best For |
|---|---|---|
| **Midjourney** | $10/mo | Highest quality, art-direction-fähig |
| **DALL-E 3** (ChatGPT Plus) | Im ChatGPT inkludiert | Schnell, akkurate Text-Renderings |
| **Flux.1 Pro** (Replicate) | ~$0.05/Bild | Open-Source-Alternative, gute Qualität |
| **Ideogram** | $8/mo | Beste Text-im-Bild-Qualität |

## Nach dem Generieren

1. Bilder in 1200×400 zuschneiden (Photoshop / Photopea / squoosh.app)
2. In `public/email-assets/` ablegen:
   - `hero-marketing.png`
   - `hero-gastro.png`
   - `hero-print.png`
   - `hero-events.png`
3. In `src/lib/outbound/templates.ts` einbauen:
   ```ts
   const HERO_IMAGES: Record<TemplateKey, string> = {
     marketing_agency_dsgvo_v2: 'https://spurig.com/email-assets/hero-marketing.png',
     gastronomy_qr_v2: 'https://spurig.com/email-assets/hero-gastro.png',
     crafts_sme_print_v2: 'https://spurig.com/email-assets/hero-print.png',
     events_tourism_print_v2: 'https://spurig.com/email-assets/hero-events.png',
   };
   ```
   Dann im HTML-Builder `<img src="${HERO_IMAGES[template.key]}" width="600" alt="Spurig">` ganz oben einbauen.
4. Test-Mail senden → in Gmail prüfen wie's wirkt.
