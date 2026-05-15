import { readFileSync } from 'node:fs';
const env = readFileSync('.env.local', 'utf8');
const get = k => { const l = env.split('\n').find(x => x.startsWith(k+'=')); return l ? l.split('=').slice(1).join('=').trim() : null; };
const apiKey = get('ANTHROPIC_API_KEY');

const voice = readFileSync('src/lib/content/spurig-voice.ts', 'utf8').match(/SPURIG_VOICE = `([\s\S]*?)`\.trim\(\)/)[1];

// Existing titles aus Screenshot
const existingTitles = [
  '500 Postkarten. Drei Anrufe. Niemand weiss warum.',
  'Mein Bruder ist Steuerberater. Ich habe ihm Spurig erklaert. Er versteht es immer noch nicht.',
  'Unpopular: 90% der DACH-Cookie-Banner sind nicht DSGVO-konform. Niemand kontrolliert.',
  '500 Postkarten. Drei Anrufe. Niemand misst das.',
  '47 Plakatstandorte. Geld war weg.',
  'Cookie-Banner ist nicht das Problem.',
  'Dein Plakat-Budget verschwindet grade. Und dein Chef weiss es nicht.',
];

const ideasFile = readFileSync('src/lib/content/ideas.ts', 'utf8');
const promptTemplate = ideasFile.match(/DEINE AUFGABE — IDEEN-GENERIERUNG[\s\S]*?Jetzt liefere die \$\{count\} besten Ideen\./);
let p = promptTemplate?.[0] ?? '';

const existingSection = `
══════════════════════════════════════════════════════════════════════
KRITISCH — ANTI-WIEDERHOLUNGS-CONTEXT (HOCHSTE PRIORITAT)
══════════════════════════════════════════════════════════════════════
Diese ${existingTitles.length} Titel/Themen existieren BEREITS im Backlog.
JEDE Idee muss SUBSTANTIELL anders sein.

EXISTIERENDE TITEL (NICHT in dieser Form):
${existingTitles.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}

ANTI-WIEDERHOLUNGS-CHECK pro Idee — kein "Postkarten/N/Anrufe", kein
"X Plakate/Y funktionieren", kein "Bruder/Verwandter versteht nicht".`;

p = p
  .replace(/\$\{CLUSTER_LABEL\[cluster\]\}/g, 'Offline-Marketing ROI')
  .replace(/\$\{CLUSTER_DESCRIPTION\[cluster\]\}/g, 'Print-Marketing-ROI, Plakat-Tracking, Flyer, Mailing.')
  .replace(/\$\{count\}/g, '8')
  .replace(/\$\{researchSection\}/g, '')
  .replace(/\$\{existingSection\}/g, existingSection);

const prompt = voice + '\n\n========================================\n' + p;

const start = Date.now();
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] }),
});
const ms = Date.now() - start;
const data = await res.json();
const text = data.content?.find(c => c.type === 'text')?.text ?? '';

let jt = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
const a = jt.search(/\[\s*\{/);
const z = jt.lastIndexOf(']');
if (a >= 0 && z > a) jt = jt.slice(a, z + 1);

console.log(`Status: ${res.status}, ${(ms/1000).toFixed(1)}s, output: ${data.usage?.output_tokens}t\n`);

try {
  const parsed = JSON.parse(jt);
  console.log(`PARSED: ${parsed.length} ideas\n`);
  console.log(`EXISTING (NICHT wiederholen):`);
  existingTitles.forEach(t => console.log(`  - ${t}`));
  console.log(`\n--- NEUE IDEEN ---`);
  let dupes = 0;
  parsed.forEach((p, i) => {
    const newL = p.title.toLowerCase();
    // Soft-dup-check: wenn 4+ Wörter überlappen
    const newWords = new Set(newL.split(/\W+/).filter(w => w.length >= 4));
    let dupHit = '';
    for (const e of existingTitles) {
      const eWords = new Set(e.toLowerCase().split(/\W+/).filter(w => w.length >= 4));
      const overlap = [...newWords].filter(w => eWords.has(w));
      if (overlap.length >= 3) { dupHit = `(OVERLAP MIT: "${e.slice(0, 40)}..." → ${overlap.join(',')})`; break; }
    }
    console.log(`[${i+1}] ${p.title} ${dupHit}`);
    if (dupHit) dupes++;
  });
  console.log(`\nResult: ${dupes}/${parsed.length} potentielle Duplikate (Ziel: 0)`);
} catch (e) { console.log(`PARSE FAIL: ${e.message}`); }
