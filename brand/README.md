# Spurig Brand Assets

Datum: 2026-05-14 · Version 1.0

## Logo-Konzept

Weisses **„S"** mit zwei leuchtenden Akzent-Punkten:
- **Cyan** (`#22D3EE`) unten links
- **Lila** (`#7C3AED`) oben rechts

Symbolik: Verbindung zweier Punkte (= Customer-Touchpoint zu Customer-Conversion).

## Dateien

| Datei | Zweck | Format |
|---|---|---|
| `source/spurig-logo-original-1536x1024.png` | **Original** (von ChatGPT generiert, 14.05.2026 10:02) — nicht editieren | 1536×1024 RGBA |
| `spurig-icon.png` | Square 512×512 mit Padding — Hauptlogo fuer Web | 512×512 RGBA |
| `spurig-icon-32.png` | Favicon-Groesse | 32×32 |
| `spurig-icon-180.png` | Apple Touch Icon | 180×180 |
| `spurig-icon-192.png` | Android Home Screen | 192×192 |
| `spurig-icon-512.png` | PWA Manifest | 512×512 |
| `spurig-logo.png` | Horizontal 1024×280 — fuer Header / Email | 1024×280 RGBA |

Alle Dateien sind auch in `/public/` (deployable Assets) vorhanden.

## Produktive Verwendung im Code

| Stelle | Datei | Code-Pfad |
|---|---|---|
| Site-Header (Landing) | spurig-icon.png | `src/components/landing/site-header.tsx` |
| Sidebar Desktop+Mobile | spurig-icon.png | `src/components/layout/sidebar.tsx` |
| Login-Card | spurig-icon.png | `src/app/login/page.tsx` |
| Signup-Card | spurig-icon.png | `src/app/signup/page.tsx` |
| Browser-Tab Favicon | (SVG-Approximation) | `src/app/icon.svg` |
| Apple Touch Icon | (Inline-SVG dynamisch) | `src/app/apple-icon.tsx` |
| Open-Graph Image | (Inline-SVG dynamisch) | `src/app/opengraph-image.tsx` |
| Twitter Image | (Inline-SVG dynamisch) | `src/app/twitter-image.tsx` |

## Wenn du ein neues Logo machst

1. Original-Datei in `brand/source/` ablegen mit Datum im Namen
2. Pillow-Skript laufen lassen das die Varianten generiert (siehe Commit `b01a6b7`)
3. `/public/spurig-*` aktualisieren
4. SVG-Approximationen in icon.svg/apple-icon.tsx/opengraph-image.tsx/twitter-image.tsx anpassen
5. Site-Header/Sidebar/Login/Signup nutzen die PNG-Files automatisch
