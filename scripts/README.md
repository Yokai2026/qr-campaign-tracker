# Scripts

## load-test-redirect.mjs

Load-Test für den Redirect-Handler `/r/[code]`. Kernfrage: Hält der Handler 100 concurrent Scans/Sekunde ohne Degradation?

### Setup

```bash
npm install --save-dev autocannon
```

### Ausführung

```bash
# Gegen lokalen Dev-Server
SHORT_CODE=abc1234 node scripts/load-test-redirect.mjs

# Gegen Staging (mit echter Supabase-DB)
TARGET_URL=https://staging.spurig.com SHORT_CODE=abc1234 node scripts/load-test-redirect.mjs
```

### Interpretation

| p99-Latenz | Bewertung |
|-----------|-----------|
| < 200ms   | Production-ready |
| 200-500ms | Akzeptabel, Monitoring einrichten |
| > 500ms   | Rate-Limit (120/min/IP) checken, DB-Indexes prüfen |

### NICHT gegen Prod laufen lassen

Der Rate-Limiter blockiert ab der zweiten Sekunde mit 429-Spam. Für realistischen Prod-Test müsste man X-Forwarded-For rotieren (mehrere IPs simulieren) — das ist hier nicht implementiert.
