/**
 * Load-Test für den Redirect-Handler /r/[code].
 *
 * Ziel: Sicherstellen dass /r/[code] 100 concurrent Scans pro Sekunde
 * ohne Degradation handhabt. Das ist das Kern-Feature — ein langsamer
 * Redirect ruiniert jede Kampagne.
 *
 * Voraussetzungen:
 *   - autocannon installiert: `npm install --save-dev autocannon`
 *   - Mindestens ein aktiver QR-Code oder Kurzlink in der Ziel-DB
 *
 * Ausführung:
 *   TARGET_URL=https://spurig.com SHORT_CODE=xxxxx node scripts/load-test-redirect.mjs
 *
 * Ergebnis-Interpretation:
 *   - p99 latency < 200ms: Production-ready
 *   - p99 200-500ms: Akzeptabel, Monitoring einrichten
 *   - p99 > 500ms oder Errors: Rate-Limit (120/min/IP) checken,
 *     sonst DB-Indexes auf redirect_events prüfen
 *
 * Wichtig: NICHT gegen Prod mit hoher Rate laufen lassen — der
 * Rate-Limiter (120/min/IP) kickt nach ~2 Sekunden mit 429. Besser:
 * lokal gegen Dev-Supabase oder Staging-DB.
 */

import autocannon from 'autocannon';

const target = process.env.TARGET_URL || 'http://localhost:3000';
const shortCode = process.env.SHORT_CODE;

if (!shortCode) {
  console.error('ERROR: SHORT_CODE env var missing.');
  console.error('Beispiel: SHORT_CODE=abc1234 node scripts/load-test-redirect.mjs');
  process.exit(1);
}

const url = `${target}/r/${shortCode}`;

console.log(`Load-Test: ${url}`);
console.log('Parameter: 50 connections, 30s, follow keine Redirects\n');

// 50 statt 100 concurrent — unser Rate-Limit ist 120/min/IP. Für lokalen
// Test ok, für Prod mit mehreren IPs simulieren (X-Forwarded-For variieren).
const result = await autocannon({
  url,
  connections: 50,
  duration: 30,
  maxRedirections: 0, // Wir wollen die 302-Response messen, nicht folgen
  headers: {
    'User-Agent': 'spurig-load-test/1.0',
  },
});

console.log('\n=== Ergebnis ===');
console.log(`Requests/s:   ${result.requests.average.toFixed(0)}`);
console.log(`Latency avg:  ${result.latency.average}ms`);
console.log(`Latency p50:  ${result.latency.p50}ms`);
console.log(`Latency p99:  ${result.latency.p99}ms`);
console.log(`Latency max:  ${result.latency.max}ms`);
console.log(`Status 2xx:   ${result['2xx']}`);
console.log(`Status 3xx:   ${result['3xx']} (erwartet: 302 redirects)`);
console.log(`Status 4xx:   ${result['4xx']} (429-Spam bedeutet Rate-Limit greift)`);
console.log(`Status 5xx:   ${result['5xx']} (muss 0 sein)`);
console.log(`Errors:       ${result.errors}`);
console.log(`Timeouts:     ${result.timeouts}`);

// Exit-Code für CI-Integration
if (result['5xx'] > 0 || result.errors > 0 || result.latency.p99 > 500) {
  console.error('\nFAIL: 5xx-Errors, Connection-Errors oder p99 > 500ms.');
  process.exit(1);
}
console.log('\nOK');
