# Best Practices — QR Campaign Tracker

## 1. Next.js 16 + App Router

### Server vs Client Components
- Default: Server Component (kein `"use client"`)
- Client nur für: useState, useEffect, onClick, Forms, Charts
- Pattern: Server Component fetcht Daten → Client Component rendert interaktiv
- `"use client"` so tief wie möglich im Component-Tree

### Server Actions
- Alle Mutations (Create, Update, Delete) als Server Actions
- Zod-Validierung am Anfang jeder Action
- `revalidatePath()` nach Mutations
- Error-Handling: `{ success: boolean, error?: string }` Return-Pattern

### Route Handlers
- Nur für: Externe API-Konsumenten, File-Downloads (CSV), QR-Image-Generation
- Nicht für: CRUD das nur die eigene UI nutzt → Server Actions

### Caching & Revalidation
- `unstable_cache()` für teure DB-Queries (Analytics-Aggregationen)
- `revalidatePath()` nach Writes
- Keine manuelle Cache-Invalidierung per Tags wenn Path reicht

## 2. Supabase

### Client Setup
- Browser: `createBrowserClient()` aus `@supabase/ssr`
- Server: `createServerClient()` mit Cookie-Handling
- Service Role: Nur in Route Handlers/Server Actions, nie im Client

### RLS
- Jede Tabelle hat RLS
- Policies: `auth.uid() = user_id` als Standard
- Service Role bypassed RLS — nur für Admin-Operationen

### Queries
- Selektive Felder: `.select('id, name, created_at')` statt `*`
- Pagination: `.range(from, to)` für Listen
- Realtime: Nur wenn nötig (Dashboard Auto-Refresh)

## 3. UI / UX

### shadcn/ui
- Komponenten via CLI hinzufügen: `npx shadcn@latest add [component]`
- Nie shadcn-Sourcen direkt in node_modules editieren
- Custom-Varianten in components/ui/ definieren, nicht inline
- Dark Mode via next-themes (bereits konfiguriert)

### Dashboard-Patterns
- **Metric Cards oben**: Absolute Zahlen (Scans, CTR, Conversions) als Cards
- **Charts darunter**: Zeitverlauf, Vergleiche
- **Date Range Picker**: Zentral, filtert alle Metriken
- **Skeleton Loading**: Pro Card/Chart, nicht ganze Page
- **Drill-Down**: Kampagne → Placement → einzelne Scans

### Tailwind CSS 4
- Design Tokens in `@theme {}` Block (globals.css)
- Keine tailwind.config.js mehr (CSS-first Config)
- Container Queries: `@container` statt Media Queries wo sinnvoll
- `cn()` Helper (clsx + tailwind-merge) für dynamische Klassen

## 4. QR Code System

### Generation
- SVG für Print (skalierbar), PNG für Digital
- Unique Code pro Placement (nanoid)
- Error Correction Level: M (15%) — guter Kompromiss Größe/Zuverlässigkeit
- Logo-Embedding: qr-code-styling evaluieren für Branding

### Redirect Flow
```
QR Scan → /r/[code] → Log Scan Event → 302 Redirect → Target URL + UTM Params
```
- Redirect Handler muss < 100ms antworten
- Scan-Logging async (nicht blocking)
- UTM-Parameter automatisch anhängen

### Tracking
- IP-Anonymisierung: Letzte 2 Oktette nullen + Daily Salt Hash
- Device Detection: ua-parser-js
- Keine Cookies für Tracking
- Unique Visitors: Anonymisierter IP-Hash + User-Agent

## 5. Performance

### Core Web Vitals Ziele
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### Optimierungen
- `next/image` für alle Bilder
- Dynamic Imports für schwere Libs (Recharts)
- Suspense Boundaries pro Dashboard-Sektion
- Prefetch für Navigation-Links

## 6. Security
- CSRF: Next.js built-in (Server Actions)
- Auth: Middleware prüft Session auf allen (dashboard)/ Routes
- Input: Zod-Validierung auf Server-Seite, nie nur Client
- Secrets: Nur in `.env.local`, nie in Code
- Rate Limiting: Für /api/track/ und /r/ Endpoints (Abuse Prevention)

## 7. Testing (TODO)
- Unit: Vitest für Utils/Helpers
- Component: React Testing Library
- E2E: Playwright für kritische Flows (QR Scan → Redirect → Track)
- Schema: Zod-Schema-Tests für Edge Cases
