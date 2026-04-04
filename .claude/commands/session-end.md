# Session beenden

Fuehre folgende Schritte aus um die aktuelle Session sauber abzuschliessen:

## 1. Offene Aenderungen committen
- `git status` pruefen
- Falls uncommitted changes: staged committen mit aussagekraeftiger Message
- `git push` ausfuehren

## 2. Session-Memory aktualisieren
- Lies die aktuelle Memory-Datei: `~/.claude/projects/C--Users-david/memory/project_qr_tracker_session_apr4.md`
- Aktualisiere sie mit:
  - **Was in dieser Session gemacht wurde** (Features, Fixes, DB-Aenderungen)
  - **Commits** dieser Session (Hash + Beschreibung)
  - **Offene Punkte / Naechste Schritte** — priorisiert (P1/P2/P3)
  - **Technische Notizen** (Env-Variablen, Server-Status, bekannte Issues)
- Aktualisiere auch `MEMORY.md` falls sich die Beschreibung geaendert hat

## 3. Zusammenfassung ausgeben
Gib dem User eine kurze Zusammenfassung:
- Was wurde gemacht (Bullet Points)
- Was ist noch offen (priorisiert)
- Letzter Commit-Hash
- Ob alles gepusht + deployed ist
