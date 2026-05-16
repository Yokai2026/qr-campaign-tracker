// Verifiziert compliance_lite + founder_diary nach Pillar-Scope-Enforcement-Fix.
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => { const l = env.split('\n').find((x) => x.startsWith(k + '=')); return l ? l.split('=').slice(1).join('=').trim() : null; };
const apiKey = get('ANTHROPIC_API_KEY');

const voiceRaw = readFileSync('src/lib/content/spurig-voice.ts', 'utf8');
const VOICE = voiceRaw.match(/SPURIG_VOICE = `([\s\S]*?)`\.trim\(\)/)[1];
const PROMPT_TEMPLATE = readFileSync('src/lib/content/ideas.ts', 'utf8').match(/DEINE AUFGABE — IDEEN-GENERIERUNG[\s\S]*?Jetzt liefere die \$\{count\} besten Ideen\./)[0];

// Lade NEUE Cluster-Descriptions aus pillars.ts
const pillarsFile = readFileSync('src/lib/content/pillars.ts', 'utf8');
const descMatch = pillarsFile.match(/CLUSTER_DESCRIPTION[\s\S]*?\};/)[0];

function getDesc(cluster) {
  const re = new RegExp(`${cluster}:[\\s\\S]*?'([^']+(?:'[^']+)*)'`);
  const m = descMatch.match(re);
  return m ? m[1].replace(/\\n/g, ' ') : '';
}

const PILLARS = {
  compliance_lite: { label: 'DSGVO ohne Anwalt', description: getDesc('compliance_lite') },
  founder_diary: { label: 'Founder-Tagebuch', description: getDesc('founder_diary') },
};

const EXISTING = [
  '500 Postkarten. Drei Anrufe.', '47 Plakate. 3 funktionierten.',
  '180 Flyer. Vier Anrufe.', '8 Wochen am falschen Feature.',
  'Mein Bruder ist Steuerberater.', 'Bitly in Virginia.',
  '67 Plakatstandorte.', 'Stripe-Dashboard 47/312 Euro.',
];

function buildPrompt(pillar) {
  const { label, description } = PILLARS[pillar];
  const existingSection = `\n══ ANTI-WIEDERHOLUNG ══\nDiese existieren BEREITS:\n${EXISTING.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}\n`;
  return VOICE + '\n\n========================================\n' +
    PROMPT_TEMPLATE
      .replace(/\$\{CLUSTER_LABEL\[cluster\]\}/g, label)
      .replace(/\$\{CLUSTER_DESCRIPTION\[cluster\]\}/g, description)
      .replace(/\$\{count\}/g, '6')
      .replace(/\$\{researchSection\}/g, '')
      .replace(/\$\{existingSection\}/g, existingSection);
}

async function run(pillar) {
  console.log(`▶ Pillar: ${PILLARS[pillar].label}`);
  console.log(`  Description-Preview: ${PILLARS[pillar].description.slice(0, 120)}...`);
  const t0 = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      messages: [{ role: 'user', content: buildPrompt(pillar) }],
    }),
  });
  const ms = Date.now() - t0;
  const data = await res.json();
  if (!res.ok) {
    console.log(`  ✗ ${JSON.stringify(data).slice(0, 200)}`);
    return null;
  }
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
  let jt = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const a = jt.search(/\[\s*\{/); const z = jt.lastIndexOf(']');
  if (a >= 0 && z > a) jt = jt.slice(a, z + 1);
  let parsed;
  try { parsed = JSON.parse(jt); } catch { console.log('  ✗ parse fail'); return null; }
  console.log(`  ✓ ${(ms / 1000).toFixed(1)}s, ${parsed.length} ideas`);
  parsed.forEach((i, idx) => console.log(`    ${idx + 1}. ${i.title}`));
  return parsed;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const a = await run('compliance_lite');
console.log('\n⏳ 40s pause...\n');
await sleep(40000);
const b = await run('founder_diary');

// Drift-Check: gibt es Cross-Pillar-Themen?
function classify(title) {
  const t = title.toLowerCase();
  if (/\b(flyer|plakat|postkarte|visitenkarte|mailing)\b/.test(t)) return 'print_lebt';
  if (/\b(dsgvo|datenschutz|av.?vertrag|schrems|bitly|hotjar|cloudflare|calendly|us.?cloud)\b/.test(t)) return 'compliance_lite';
  if (/\b(qr|scan|code.{0,20}auf|design)\b/.test(t)) return 'qr_realtalk';
  if (/\b(stripe|mrr|vercel|cousin|steuerberater|ich (war|bin|hab))\b/.test(t)) return 'founder_diary';
  if (/\b(friseur|optiker|tierarzt|apotheker|yoga|schreiner|florist)\b/.test(t)) return 'mittelstand';
  if (/\b(utm|attribution|track|conversion|funnel|newsletter)\b/.test(t)) return 'tracking_tricks';
  return '?';
}

console.log('\n=== DRIFT CHECK ===');
console.log('\nCOMPLIANCE_LITE-Output Classification:');
(a ?? []).forEach((i) => {
  const c = classify(i.title);
  console.log(`  [${c === 'compliance_lite' ? '✓' : '✗ DRIFT to ' + c}] ${i.title}`);
});

console.log('\nFOUNDER_DIARY-Output Classification:');
(b ?? []).forEach((i) => {
  const c = classify(i.title);
  console.log(`  [${c === 'founder_diary' ? '✓' : '✗ DRIFT to ' + c}] ${i.title}`);
});
