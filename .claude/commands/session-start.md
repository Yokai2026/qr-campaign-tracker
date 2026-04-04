# Session starten

Fuehre folgende Schritte aus um den Kontext der letzten Session wiederherzustellen:

## 1. Letzten Stand laden
- Lies die Session-Memory: `~/.claude/projects/C--Users-david/memory/project_qr_tracker_session_apr4.md`
- Lies `MEMORY.md` fuer den Gesamtueberblick
- Lies `CLAUDE.md` im Projekt-Root fuer Coding Standards

## 2. Aktuellen Zustand pruefen
- `git log --oneline -5` — letzte Commits
- `git status` — offene Aenderungen?
- Pruefen ob Dev-Server laeuft (Port 3000)
- Falls nicht: `npx next dev` vorschlagen

## 3. Zusammenfassung an User ausgeben
Gib eine kompakte Uebersicht:

### Letzte Session
- Was wurde gemacht (kurz, Bullet Points)
- Letzter Commit (Hash + Message)

### Offene Punkte
- Liste die naechsten Schritte aus der Memory-Datei, priorisiert
- Markiere was als naechstes sinnvoll waere

### Bereit
- "Was moechtest du als naechstes angehen?" oder Vorschlag machen

## Wichtig
- Antworte auf Deutsch
- Sei knapp und direkt
- Schlage proaktiv den naechsten sinnvollen Schritt vor
