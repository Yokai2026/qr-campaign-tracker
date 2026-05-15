import { readFileSync } from 'node:fs';
const env = readFileSync('.env.local', 'utf8');
const get = k => { const l = env.split('\n').find(x => x.startsWith(k+'=')); return l ? l.split('=').slice(1).join('=').trim() : null; };
const apiKey = get('ANTHROPIC_API_KEY');

const voice = readFileSync('src/lib/content/spurig-voice.ts', 'utf8').match(/SPURIG_VOICE = `([\s\S]*?)`\.trim\(\)/)[1];

// Read the ideas-section template from ideas.ts (after the voice)
const ideasFile = readFileSync('src/lib/content/ideas.ts', 'utf8');
const ideasPromptMatch = ideasFile.match(/DEINE AUFGABE — IDEEN-GENERIERUNG[\s\S]*?Jetzt liefere die \$\{count\} besten Ideen\./);
let ideasPromptTemplate = ideasPromptMatch?.[0] ?? '';
// Replace template variables
ideasPromptTemplate = ideasPromptTemplate
  .replace(/\$\{CLUSTER_LABEL\[cluster\]\}/g, 'Offline-Marketing ROI')
  .replace(/\$\{CLUSTER_DESCRIPTION\[cluster\]\}/g, 'Print-Marketing-ROI, Plakat-Tracking, Flyer-Verteilaktionen, Standort-A/B-Tests, Mailing-Conversion, Offline-Online-Bridge, Print-Budgets vs Digital.')
  .replace(/\$\{count\}/g, '10')
  .replace(/\$\{researchSection\}/g, '');

const prompt = voice + '\n\n========================================\n' + ideasPromptTemplate;

const start = Date.now();
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] }),
});
const ms = Date.now() - start;
const data = await res.json();
const text = data.content?.find(c => c.type === 'text')?.text ?? '';

let jt = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
const a = jt.search(/\[\s*\{/);
const z = jt.lastIndexOf(']');
if (a >= 0 && z > a) jt = jt.slice(a, z + 1);

console.log(`Status: ${res.status}, ${(ms/1000).toFixed(1)}s, output: ${data.usage?.output_tokens}t`);

try {
  const parsed = JSON.parse(jt);
  console.log(`PARSED: ${parsed.length} ideas\n`);

  // Category extraction
  const categories = {};
  for (const idea of parsed) {
    const m = (idea.angle || '').match(/\[C(\d+):/);
    const cat = m ? `C${m[1]}` : '??';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  console.log('Category-Distribution:', categories);
  const unique = Object.keys(categories).filter(c => c !== '??').length;
  console.log(`Unique categories: ${unique}/10 (target: ≥8)\n`);

  parsed.forEach((p, i) => {
    const firstFive = (p.title || '').split(/\s+/).slice(0, 5).join(' ');
    console.log(`[${i+1}] ${p.title}`);
    console.log(`    First 5 words: "${firstFive}"`);
    console.log(`    Angle: ${(p.angle || '').slice(0, 100)}`);
    console.log();
  });

  // Sympathy/humor check
  const humorPatterns = [/peinlich/i, /lustig/i, /lacht/i, /bier/i, /mama|mutter/i, /ich war .{0,20}falsch/i, /hahah/i, /witzig/i, /selber schuld/i, /tja /i, /bootstrap/i];
  let humorHits = 0;
  for (const idea of parsed) {
    const txt = JSON.stringify(idea).toLowerCase();
    if (humorPatterns.some(p => p.test(txt))) humorHits++;
  }
  console.log(`Humor/Sympathy signals: ${humorHits}/${parsed.length} (target: ≥2)`);

} catch (e) {
  console.log(`PARSE FAIL: ${e.message}`);
  console.log(`First 200: ${jt.slice(0, 200)}`);
}
