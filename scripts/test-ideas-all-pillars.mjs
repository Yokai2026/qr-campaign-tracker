// Testet alle 6 neuen Pillars sequentiell.
// Jeder Pillar: 6 Ideen generieren, prüfen auf Banned-Tropes, Niche-Variety,
// Hook-Pattern-Diversity, Loveability-Indikatoren.
// Rate-Limit: 40s pause zwischen Calls (SPURIG_VOICE ~16k input tokens).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

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
const PROMPT_TEMPLATE = tplMatch[0];

const PILLARS = {
  qr_realtalk: {
    label: 'QR-Realtalk',
    description: 'Echte QR-Code-Stories aus dem DACH-Alltag — die absurden, peinlichen, lustigen und unerwarteten Sichtungen: QR auf der Bratwurst, auf der Hochzeitseinladung, im Apothekenrezept, am Bestattungsinstitut, im Hostel-WLAN, auf der Pizza.',
  },
  print_lebt: {
    label: 'Print lebt',
    description: 'Pro-Print gegen die Digital-Marketing-Mehrheit. Warum Plakat, Flyer, Postkarte, Visitenkarte und Direktmailing 2026 zurück sind.',
  },
  compliance_lite: {
    label: 'DSGVO ohne Anwalt',
    description: 'DSGVO + EU-Datenschutz in Klartext, nicht in Paragrafen. Aktuelle Bußgeld-Cases, US-Cloud-Tools im DSGVO-Check (Cloudflare, GA4, Hotjar, Calendly).',
  },
  mittelstand: {
    label: 'Mittelstand-Stories',
    description: 'Underdog-Customer-Stories aus dem DACH-Mittelstand: Friseur, Schreiner, Optiker, Tierarzt, Apotheker. Wie sie wirklich Marketing machen.',
  },
  tracking_tricks: {
    label: 'Tracking-Tricks',
    description: 'Hidden Tracking-Hacks: 1 QR pro Tag statt pro Kampagne, UTM-Strategien, Multi-Touch-Attribution für Solopreneurs, Cookie-less Tracking.',
  },
  founder_diary: {
    label: 'Founder-Tagebuch',
    description: 'Solopreneur-Realität pur — Davids Build-in-Public: Pricing-Wechsel, gescheiterte Features, MRR-Updates, Customer-Support-Peinlichkeiten.',
  },
};

// Existing-Tropes die NICHT mehr kommen sollen (gleich für alle pillars)
const EXISTING = [
  '500 Postkarten. Drei Anrufe.',
  '47 Plakate. 3 funktionierten.',
  'Mein Bruder ist Steuerberater.',
  '8 Wochen am falschen Feature.',
  'Mein Stripe-Dashboard 47 Euro.',
  'Bitly speichert in Virginia.',
];

const BANNED_TROPES = [
  { re: /\b47\s*(plak|standort|euro|mitarbeiter|prozent)/i, name: '47-magic' },
  { re: /\b500\s*postkarten/i, name: '500-postkarten' },
  { re: /\b8\s*wochen.*falsch/i, name: '8-wochen-falsch' },
  { re: /stripe.dashboard.*47/i, name: 'stripe-47' },
  { re: /bruder.{0,20}(steuerberater|versteht)/i, name: 'bruder-steuerberater' },
  { re: /(bitly|bittly).{0,40}(virginia|ashburn)/i, name: 'bitly-virginia' },
];

const NICHE_INDUSTRIES = ['friseur', 'physio', 'osteopath', 'tierarzt', 'sanität', 'apotheke', 'yoga', 'pilates', 'crossfit', 'optiker', 'anwalt', 'kanzlei', 'hochzeit', 'event', 'hostel', 'hotel', 'schreiner', 'tischler', 'florist', 'foodtruck', 'brauerei', 'wein', 'schneider', 'putz', 'fahrschule', 'hund', 'coworking', 'boutique', 'tattoo', 'imker', 'bestattung', 'bratwurst', 'pizza'];

const HUMOR_KEYWORDS = ['peinlich', 'lustig', 'witzig', 'absurd', 'verrückt', 'kurios', 'bizarr', 'komisch', 'fragte mich', 'realisierte ich'];

function buildPrompt(pillar) {
  const { label, description } = PILLARS[pillar];
  const existingSection = `
══════════════════════════════════════════════════════════════════════
KRITISCH — ANTI-WIEDERHOLUNGS-CONTEXT (HOCHSTE PRIORITAT)
══════════════════════════════════════════════════════════════════════
Diese ${EXISTING.length} Titel/Themen existieren BEREITS. JEDE neue Idee muss SUBSTANTIELL anders sein.

EXISTIERENDE TITEL:
${EXISTING.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}
`;

  return VOICE + '\n\n========================================\n' +
    PROMPT_TEMPLATE
      .replace(/\$\{CLUSTER_LABEL\[cluster\]\}/g, label)
      .replace(/\$\{CLUSTER_DESCRIPTION\[cluster\]\}/g, description)
      .replace(/\$\{count\}/g, '6')
      .replace(/\$\{researchSection\}/g, '')
      .replace(/\$\{existingSection\}/g, existingSection);
}

async function generatePillar(pillar) {
  const prompt = buildPrompt(pillar);
  const t0 = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const ms = Date.now() - t0;
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, pillar, error: JSON.stringify(data).slice(0, 200), ms };
  }
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
  let jt = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const a = jt.search(/\[\s*\{/);
  const z = jt.lastIndexOf(']');
  if (a >= 0 && z > a) jt = jt.slice(a, z + 1);
  let parsed;
  try {
    parsed = JSON.parse(jt);
  } catch (e) {
    return { ok: false, pillar, error: 'JSON parse failed', ms };
  }
  return { ok: true, pillar, ideas: parsed, ms, in_tok: data.usage?.input_tokens, out_tok: data.usage?.output_tokens };
}

function analyzePillar(result) {
  if (!result.ok) return result;
  const ideas = result.ideas;
  let banned = 0;
  let niche = 0;
  let humor = 0;
  const cats = new Set();
  const pats = new Set();
  const usedNiches = new Set();

  for (const idea of ideas) {
    const full = `${idea.title} ${idea.outline ?? ''} ${idea.angle ?? ''}`.toLowerCase();
    if (BANNED_TROPES.some((b) => b.re.test(full))) banned++;
    const nFound = NICHE_INDUSTRIES.filter((n) => full.includes(n));
    if (nFound.length > 0) niche++;
    nFound.forEach((n) => usedNiches.add(n));
    if (HUMOR_KEYWORDS.some((h) => full.includes(h))) humor++;
    const c = (idea.angle ?? '').match(/\[C(\d+)/);
    if (c) cats.add(`C${c[1]}`);
    const p = (idea.angle ?? '').match(/PATTERN-([A-M])/);
    if (p) pats.add(p[1]);
  }

  return {
    ...result,
    metrics: {
      banned,
      niche,
      humor,
      unique_categories: cats.size,
      unique_patterns: pats.size,
      unique_niches: usedNiches.size,
      niches_used: [...usedNiches].sort(),
    },
  };
}

// === Run ===
const outDir = 'scripts/_pillar-test-output';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

console.log('═══════════════════════════════════════════════════════════');
console.log('TESTE ALLE 6 PILLARS — 6 Ideen pro Pillar');
console.log('═══════════════════════════════════════════════════════════\n');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

const pillarKeys = Object.keys(PILLARS);
for (let i = 0; i < pillarKeys.length; i++) {
  const p = pillarKeys[i];
  console.log(`▶ [${i + 1}/${pillarKeys.length}] Pillar: ${PILLARS[p].label} (${p})`);
  const result = await generatePillar(p);
  const analyzed = analyzePillar(result);
  results.push(analyzed);
  if (analyzed.ok) {
    console.log(`   ✓ ${(analyzed.ms / 1000).toFixed(1)}s · in=${analyzed.in_tok}t out=${analyzed.out_tok}t`);
    console.log(`   Metrics: banned=${analyzed.metrics.banned} niche=${analyzed.metrics.niche} humor=${analyzed.metrics.humor} cats=${analyzed.metrics.unique_categories} pats=${analyzed.metrics.unique_patterns}`);
    writeFileSync(`${outDir}/${p}-ideas.json`, JSON.stringify(analyzed.ideas, null, 2), 'utf8');
  } else {
    console.log(`   ✗ ${analyzed.error}`);
  }
  console.log();
  if (i < pillarKeys.length - 1) {
    console.log('   ⏳ 40s pause (rate-limit)...\n');
    await sleep(40000);
  }
}

// === Summary ===
console.log('\n═══════════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════════');

console.log('\n| Pillar | OK | Banned | Niche | Humor | Cats | Pats |');
console.log('|---|---|---|---|---|---|---|');
for (const r of results) {
  if (r.ok) {
    const m = r.metrics;
    console.log(`| ${r.pillar.padEnd(16)} | ✓ | ${m.banned} | ${m.niche}/6 | ${m.humor}/6 | ${m.unique_categories} | ${m.unique_patterns} |`);
  } else {
    console.log(`| ${r.pillar.padEnd(16)} | ✗ | — | — | — | — | — |`);
  }
}

console.log('\n=== SAMPLE TITLES PRO PILLAR ===\n');
for (const r of results) {
  if (!r.ok) continue;
  console.log(`▼ ${PILLARS[r.pillar].label} (${r.pillar})`);
  for (let i = 0; i < Math.min(3, r.ideas.length); i++) {
    console.log(`  ${i + 1}. ${r.ideas[i].title}`);
  }
  console.log();
}

const totalBanned = results.filter(r => r.ok).reduce((s, r) => s + r.metrics.banned, 0);
const totalIdeas = results.filter(r => r.ok).length * 6;
const avgNiche = results.filter(r => r.ok).reduce((s, r) => s + r.metrics.niche, 0) / results.filter(r => r.ok).length;
const avgHumor = results.filter(r => r.ok).reduce((s, r) => s + r.metrics.humor, 0) / results.filter(r => r.ok).length;

console.log('\n=== VERDICT ===');
console.log(`Total ideas: ${totalIdeas}`);
console.log(`Banned-tropes: ${totalBanned}/${totalIdeas} (target: 0)`);
console.log(`Avg niche-industries per pillar: ${avgNiche.toFixed(1)}/6`);
console.log(`Avg humor-keywords per pillar: ${avgHumor.toFixed(1)}/6`);
console.log(`Saved details to: ${outDir}/`);

if (totalBanned === 0 && avgNiche >= 2 && avgHumor >= 1) {
  console.log('\n✅ ALL PILLARS PASS.');
} else {
  console.log('\n⚠️  Verbesserung möglich.');
}
