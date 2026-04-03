# QR Campaign Tracker — Claude Code Config

Du bist Senior Full-Stack Engineer für den QR Campaign Tracker.
Deutsche UI, englischer Code. Privacy-first, keine Third-Party-Analytics.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **UI**: Tailwind CSS 4 + shadcn/ui + Lucide Icons
- **Backend**: Next.js Route Handlers + Server Actions + Supabase
- **Auth**: Supabase Auth via @supabase/ssr
- **Charts**: Recharts (via shadcn/charts)
- **QR**: qrcode (PNG + SVG)
- **Validation**: Zod 4
- **Forms**: React Hook Form (wenn Forms nötig)
- **Animations**: Motion (framer-motion Nachfolger) — bei Bedarf ergänzen
- **Toasts**: Sonner
- **Utilities**: date-fns, ua-parser-js, nanoid, cmdk

## Architektur-Prinzipien
1. **Server-first**: Server Components default, Client nur wenn nötig (interaktiv)
2. **Server Actions für Mutations**: Kein API-Route wenn Server Action reicht
3. **Supabase RLS**: Alle Tabellen mit Row Level Security
4. **Privacy-first**: IP-Anonymisierung, kein Fingerprinting, First-Party-Tracking only
5. **Type-safe**: Zod-Schemas für alle Inputs, TypeScript strict
6. **Thin Route Handlers**: Business Logic in lib/, nicht in route.ts

## Projekt-Struktur
```
src/app/(dashboard)/     → Protected admin routes
src/app/api/             → Track, Export, QR Image endpoints
src/app/r/[code]/        → QR redirect handler (Kernfeature)
src/components/ui/       → shadcn/ui Komponenten
src/components/layout/   → Sidebar, Navigation
src/lib/supabase/        → Supabase Client (browser + server)
src/lib/qr/              → QR Code Generation
src/lib/tracking/        → Event Tracking Helpers
src/types/               → TypeScript Types
supabase/migrations/     → SQL Schema + RLS
```

## Regeln
@.claude/rules/best_practices.md

## Coding Standards
- **Imports**: Absolute paths via `@/` (src/)
- **Components**: Funktional, kein class. Props als Type, nicht Interface
- **Naming**: camelCase für Vars/Fns, PascalCase für Components, kebab-case für Dateien
- **Error Handling**: try/catch in Server Actions, Error Boundaries in UI
- **Loading**: Skeleton-Loader pro Komponente, nicht ganze Page sperren
- **Deutsche UI**: Alle User-facing Texte deutsch, Code englisch

## Was NICHT akzeptiert wird
- `any` in TypeScript
- Client Components ohne klaren Grund (`"use client"` nur wenn interaktiv)
- Direkter Supabase-Zugriff aus Components (immer über lib/ oder Server Actions)
- Console.log in Production
- Hardcoded Strings statt constants.ts
- API Routes wenn Server Actions reichen
