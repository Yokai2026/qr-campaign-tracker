// Testet die FRESH-ANGLE / Chefredakteur / Banned-Tropes / Humor Updates.
// Generiert 8 Ideen für QR-Practices mit den existierenden Tropes als "verboten"
// und prüft ob die AI wirklich frische, lustige, unterhaltsame Sachen liefert.

import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const line = env.split('\n').find((x) => x.startsWith(k + '='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
};
const apiKey = get('ANTHROPIC_API_KEY');
if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');

const voiceRaw = readFileSync('src/lib/content/spurig-voice.ts', 'utf8');
const VOICE = voiceRaw.match(/SPURIG_VOICE = `([\s\S]*?)`\.trim\(\)/)[1];

const ideasFile = readFileSync('src/lib/content/ideas.ts', 'utf8');
const tplMatch = ideasFile.match(/DEINE AUFGABE — IDEEN-GENERIERUNG[\s\S]*?Jetzt liefere die \$\{count\} besten Ideen\./);
let p = tplMatch[0];

// Existierende Themen aus dem Screenshot — diese sollen NICHT wiederkommen
const existingTitles = [
  '500 Postkarten. Drei Anrufe. Die Wahrheit über Print.',
  'Warum dein QR-Code auf dem Plakat unten rechts scheitert',
  'Ich habe 8 Wochen am falschen Feature gebaut. Kein Kunde brauchte es.',
  'Eine Sache verdoppelt deinen Print-ROI. Es ist nicht Design.',
  'Mein Stripe-Dashboard nach Monat 1: 47 Euro. Hier was mich fast besiegt hätte.',
  'Das macht Bitly mit deinen Daten, BEVOR sie bei dir ankommen',
  'Mein Bruder ist Steuerberater. Er versteht Spurig immer noch nicht.',
  '47 Plakatstandorte. 3 funktionierten. 22.000 Euro gespart.',
  'Sechs Jahre Klick-Daten über den Atlantik. Ohne Vertrag.',
  'Dein Plakat-Budget verschwindet grade. Niemand traut sich.',
];

const existingSection = `
══════════════════════════════════════════════════════════════════════
KRITISCH — ANTI-WIEDERHOLUNGS-CONTEXT (HOCHSTE PRIORITAT)
══════════════════════════════════════════════════════════════════════
Diese ${existingTitles.length} Titel/Themen existieren BEREITS / wurden gepostet
oder gelöscht. JEDE neue Idee muss SUBSTANTIELL anders sein — komplett andere
Zahlen, andere Branchen, andere Szenen.

EXISTIERENDE TITEL (NICHT wiederholen, nicht ähnlich):
${existingTitles.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}

ANTI-WIEDERHOLUNGS-CHECK pro Idee:
- Andere Magic-Zahl als "47" / "500" / "8 Wochen" / "Sechs Jahre"
- Andere Branche als nur Print/Plakat/Restaurant
- Andere Anekdote als Bruder/Steuerberater
`;

p = p
  .replace(/\$\{CLUSTER_LABEL\[cluster\]\}/g, 'QR-Realtalk')
  .replace(/\$\{CLUSTER_DESCRIPTION\[cluster\]\}/g, 'Echte QR-Code-Stories aus dem DACH-Alltag — die absurden, peinlichen, lustigen und unerwarteten Sichtungen: QR auf der Bratwurst, auf der Hochzeitseinladung, im Apothekenrezept, am Bestattungsinstitut, im Hostel-WLAN, auf der Pizza.')
  .replace(/\$\{count\}/g, '8')
  .replace(/\$\{researchSection\}/g, '')
  .replace(/\$\{existingSection\}/g, existingSection);

const prompt = VOICE + '\n\n========================================\n' + p;

console.log(`Prompt-Länge: ${prompt.length} chars (~${Math.ceil(prompt.length / 4)} tokens estimate)`);
console.log('Existing-titles werden geblockt:', existingTitles.length);
console.log('\n▶ Generating fresh ideas...\n');

const t0 = Date.now();
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  }),
});

const ms = Date.now() - t0;
const data = await res.json();
const text = data.content?.find((c) => c.type === 'text')?.text ?? '';

console.log(`Status: ${res.status}, ${(ms / 1000).toFixed(1)}s, in=${data.usage?.input_tokens}t out=${data.usage?.output_tokens}t\n`);

if (!res.ok) {
  console.error('Error:', JSON.stringify(data).slice(0, 500));
  process.exit(1);
}

// Parse JSON
let jt = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
const a = jt.search(/\[\s*\{/);
const z = jt.lastIndexOf(']');
if (a >= 0 && z > a) jt = jt.slice(a, z + 1);

let parsed;
try {
  parsed = JSON.parse(jt);
} catch (e) {
  console.error('JSON parse fail. First 800 chars:', text.slice(0, 800));
  process.exit(1);
}

// Check banned tropes
const BANNED_TROPES = [
  { re: /\b47\s*(plak|standort|euro|mitarbeiter|prozent)/i, name: 'Magic-47' },
  { re: /\b500\s*postkarten/i, name: '500-Postkarten' },
  { re: /\b8\s*wochen.*falsch/i, name: '8-Wochen-falsches-Feature' },
  { re: /stripe.dashboard.*47/i, name: 'Stripe-47-Euro' },
  { re: /bruder.{0,20}(steuerberater|versteht)/i, name: 'Bruder-Steuerberater' },
  { re: /(bitly|bittly).{0,40}(virginia|ashburn)/i, name: 'Bitly-Virginia' },
  { re: /sechs jahre.*atlantik/i, name: 'Sechs-Jahre-Atlantik' },
];

// Check industry diversity
const NICHE_INDUSTRIES = ['friseur', 'physio', 'osteopath', 'tierarzt', 'sanität', 'apotheke', 'yoga', 'pilates', 'crossfit', 'optiker', 'anwalt', 'kanzlei', 'hochzeit', 'event', 'hostel', 'hotel', 'schreiner', 'tischler', 'florist', 'foodtruck', 'brauerei', 'wein', 'schneider', 'putz', 'fahrschule', 'hund', 'coworking', 'boutique', 'tattoo', 'imker'];

console.log('═══════════════════════════════════════════════════════════');
console.log(`PARSED: ${parsed.length} fresh ideas\n`);

let bannedHits = 0;
let nicheHits = 0;
const usedCategories = new Set();
const usedPatterns = new Set();
const usedIndustries = new Set();

parsed.forEach((idea, i) => {
  const full = `${idea.title} ${idea.outline ?? ''} ${idea.angle ?? ''}`.toLowerCase();
  const banned = BANNED_TROPES.find((b) => b.re.test(full));
  const niches = NICHE_INDUSTRIES.filter((n) => full.includes(n));
  niches.forEach((n) => usedIndustries.add(n));

  const catMatch = (idea.angle ?? '').match(/\[C(\d+)/);
  if (catMatch) usedCategories.add(`C${catMatch[1]}`);
  const patMatch = (idea.angle ?? '').match(/PATTERN-([A-M])/);
  if (patMatch) usedPatterns.add(patMatch[1]);

  if (banned) {
    bannedHits++;
    console.log(`[${i + 1}] ❌ ${idea.title}`);
    console.log(`    BANNED TROPE: ${banned.name}`);
  } else {
    console.log(`[${i + 1}] ✓ ${idea.title}`);
  }
  if (niches.length > 0) {
    nicheHits++;
    console.log(`    🎯 Niche: ${niches.join(', ')}`);
  }
  console.log(`    Angle: ${(idea.angle ?? '').slice(0, 120)}`);
  console.log();
});

console.log('═══════════════════════════════════════════════════════════');
console.log('VERDICT');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Banned-trope hits: ${bannedHits}/${parsed.length} (target: 0)`);
console.log(`Niche-industry hits: ${nicheHits}/${parsed.length} (target: ≥3)`);
console.log(`Unique Categories: ${usedCategories.size} (${[...usedCategories].sort().join(', ')})`);
console.log(`Unique Patterns: ${usedPatterns.size} (${[...usedPatterns].sort().join(', ')})`);
console.log(`Unique Niches: ${usedIndustries.size} (${[...usedIndustries].sort().join(', ')})`);

if (bannedHits === 0 && nicheHits >= 3 && usedCategories.size >= 5) {
  console.log('\n✅ PASS — Fresh-Angle-Update wirkt.');
} else {
  console.log('\n⚠️  Verbesserung möglich.');
}
