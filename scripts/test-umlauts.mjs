import { readFileSync } from 'node:fs';
const env = readFileSync('.env.local', 'utf8');
const get = k => { const l = env.split('\n').find(x => x.startsWith(k+'=')); return l ? l.split('=').slice(1).join('=').trim() : null; };
const apiKey = get('ANTHROPIC_API_KEY');

const voice = readFileSync('src/lib/content/spurig-voice.ts', 'utf8').match(/SPURIG_VOICE = `([\s\S]*?)`\.trim\(\)/)[1];

const prompt = voice + `

DEINE AUFGABE: 5 CONTENT-IDEEN für "DSGVO & Privacy". WICHTIG: alle deutschen Umlaute korrekt (ü ä ö ß), keine ue/ae/oe Ersatzformen!

PRO IDEE: title max 80, angle max 200, outline max 350, target_keywords.

OUTPUT NUR JSON. Erster Char "[". Letzter "]".

Liefere 5.`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
});
const data = await res.json();
const text = data.content?.find(c => c.type === 'text')?.text ?? '';

let jt = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
const a = jt.search(/\[\s*\{/);
const z = jt.lastIndexOf(']');
if (a >= 0 && z > a) jt = jt.slice(a, z + 1);

const parsed = JSON.parse(jt);
console.log(`Status: ${res.status}, ${parsed.length} ideas\n`);

// Count umlaut occurrences vs ascii-replacement occurrences
let umlautCount = 0, asciiCount = 0;
const badPatterns = ['ueber ', 'fuer ', 'muess', 'koenn', 'naech', 'Saet', 'Vertr aege', 'Vertraege', 'Plaetz', 'Bueros', 'Koel', 'Duessel', 'gehoert', 'hoer ', 'moeglich', 'naem'];
for (const idea of parsed) {
  const text = JSON.stringify(idea);
  umlautCount += (text.match(/[üäöÜÄÖß]/g) ?? []).length;
  for (const p of badPatterns) {
    if (text.toLowerCase().includes(p.toLowerCase())) {
      asciiCount++;
      console.log(`  WARN: "${p}" found in: ${idea.title}`);
    }
  }
}
console.log(`\nUmlaut chars: ${umlautCount}, ASCII-replacement matches: ${asciiCount}\n`);

console.log('Sample titles:');
parsed.forEach((p, i) => console.log(`  [${i+1}] ${p.title}`));
console.log('\nSample outline:');
console.log(`  ${parsed[0]?.outline}`);
