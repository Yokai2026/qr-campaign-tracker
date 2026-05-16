// Generiert denselben Blog mit 3 verschiedenen Archetypes (A, B, F) um zu zeigen
// dass die Struktur tatsächlich variiert. Vergleicht Output-Signaturen.
//
// Run: node scripts/test-blog-archetypes.mjs
// Cost: ~3 Claude-Calls, ~6¢ total

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const line = env.split('\n').find((x) => x.startsWith(k + '='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
};
const apiKey = get('ANTHROPIC_API_KEY');
if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing in .env.local');

// SPURIG_VOICE aus der echten Datei extrahieren
const voiceRaw = readFileSync('src/lib/content/spurig-voice.ts', 'utf8');
const voiceMatch = voiceRaw.match(/SPURIG_VOICE = `([\s\S]*?)`\.trim\(\)/);
if (!voiceMatch) throw new Error('SPURIG_VOICE block not found');
const VOICE = voiceMatch[1];

// Archetype-Beschreibungen aus ideas.ts ziehen (vereinfacht, dupliziert hier
// damit der Test nicht den TS-Compiler braucht)
const ARCHETYPE_NAMES = {
  A: 'Case-Study-Zwei-Akt (Goldstandard, Kunden-Story mit Outcome)',
  B: 'Rant / Unpopular-Opinion (Branchen-Wahrheit ungeschönt)',
  F: 'Behind-the-Scenes / Founder-Diary (locker, müde-ehrlich)',
};

const MOOD_NAMES = {
  1: 'Verärgert-Direkt',
  3: 'Verletzlich-Ehrlich',
  4: 'Trocken-Ironisch',
  6: 'Staunend-Beobachtend',
};

const ARCHETYPE_INSTRUCTIONS = {
  A: 'Du folgst dem Zwei-Akt-Bogen aus PART 6 + dem Goldstandard aus PART 7c. Hook = "Geld verbrennt"-Pattern. Zahl-Kaskade + Insider-Take + Selbst-Eingeständnis + quantifizierter Outcome + Status-Frage am Ende.',
  B: 'Dies ist KEIN Goldstandard-Bogen. KEINE Zahl-Kaskade nötig. Stattdessen: starte mit einer provokanten These. Dann eine Argumentations-Kette warum die Branche es falsch macht. In der Mitte EINE kurze Anekdote (3-4 Sätze). Schließe MIT Position, nicht mit Frage. Sätze dürfen länger werden wenn sie ein Argument tragen.',
  F: 'Behind-the-Scenes / Founder-Diary. Beginne mit Datum + Zeitstempel ("Mittwoch, 23:14. Küchentisch."). Was diese Woche im Spurig-Maschinenraum passiert ist — was schief lief, was ich gelernt habe. Vercel-Bill-Schmerz / Steuerberater-Anekdote / Espresso-Count sind erlaubt. KEINE Status-Frage. Stattdessen: "Schreib mir wenn du das auch kennst, mein DM ist offen." Müde-ehrliche Atmosphäre.',
};

// Test-Idee
const TEST_IDEA = {
  title: 'Bitly speichert deine Daten in Virginia. Niemand fragt nach dem AVV.',
  outline: 'Kurzlink-Tools wie Bitly hosten in den USA. AVV-Verträge fehlen oft. Schrems II macht das DSGVO-problematisch.',
  angle: 'Persönliche Recherche: was passiert wenn man Bitly anschreibt und nach dem AVV fragt?',
  cluster: 'DSGVO',
};

function buildPrompt(archetype, mood) {
  const assignment = `
====================================================================
ARCHETYPE-ZUWEISUNG für DIESEN Blog (KRITISCH — überschreibt generische Regeln)
====================================================================
Dein Archetype: **${archetype} — ${ARCHETYPE_NAMES[archetype]}**
Deine Stimmung: **${mood} — ${MOOD_NAMES[mood]}**

VERHALTENS-REGELN:
1. Folge der DNA von Archetype ${archetype} aus PART 5b. NICHT der Goldstandard-Struktur (außer Archetype = A).
2. Bleib durchgängig in Stimmung ${mood} (PART 5d).
3. Variiere Satz-Rhythmus nach PART 5c (Provost-Regel): mind. 3 Sätze unter 6 Wörtern, mind. 1 Satz über 30 Wörter, mind. 2 Fragmente. Absatz-Längen ungleich verteilen.
4. Anti-Template-Check (PART 5e) am Schluss.

WICHTIG zu Archetype ${archetype} SPEZIFISCH:
${ARCHETYPE_INSTRUCTIONS[archetype]}

Die HOOK-PFLICHT-CHECKLISTE gilt NUR für A, B, D, G. Für deinen Archetype ${archetype} ${['A', 'B'].includes(archetype) ? 'AUCH PFLICHT' : 'NICHT — verwende den Opening-Stil aus der Archetype-DNA oben'}.
`;

  return `${VOICE}
${assignment}
========================================
DEINE AUFGABE — BLOG-POST SCHREIBEN
========================================

Thema: "${TEST_IDEA.title}"
Story-Hook: ${TEST_IDEA.angle}
Outline: ${TEST_IDEA.outline}
Pillar: DSGVO + EU-Hosting

Schreibe einen 700-1000 Worte deutschen Markdown-Blog-Post. WICHTIG: folge dem
zugewiesenen Archetype ${archetype} oben — NICHT den generischen Pflicht-Listen.

Output-Format:
---META---
slug: kurz-knackig
description: 1-2 Sätze max 155 Zeichen
tags: Tag1, Tag2, Tag3
---BODY---
[Markdown hier, ohne Titel-H1]
`;
}

async function generateOne(archetype, mood) {
  const prompt = buildPrompt(archetype, mood);
  console.log(`\n▶ Generating archetype ${archetype} (mood ${mood})...`);
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
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  const ms = Date.now() - t0;
  if (!res.ok) {
    console.error(`  ✗ Error ${res.status}:`, JSON.stringify(data).slice(0, 300));
    return null;
  }
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
  const inTok = data.usage?.input_tokens ?? '?';
  const outTok = data.usage?.output_tokens ?? '?';
  console.log(`  ✓ ${(ms / 1000).toFixed(1)}s, in=${inTok}t out=${outTok}t`);
  return { archetype, mood, text, ms, inTok, outTok };
}

function analyze(result) {
  if (!result) return null;
  const bodyIdx = result.text.indexOf('---BODY---');
  const body = bodyIdx >= 0 ? result.text.slice(bodyIdx + '---BODY---'.length).trim() : result.text;
  const sentences = body.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const lens = sentences.map((s) => s.split(/\s+/).length);
  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const firstSentence = sentences[0]?.slice(0, 120) ?? '';
  const lastSentence = sentences[sentences.length - 1]?.slice(0, 120) ?? '';

  const shortSentences = lens.filter((l) => l < 6).length;
  const longSentences = lens.filter((l) => l > 30).length;
  const avgLen = lens.reduce((a, b) => a + b, 0) / lens.length;
  const fragments = sentences.filter((s) => !/\b(ist|war|hat|wird|kann|muss|soll|wird|sind|haben|haben)\b/i.test(s.split(/\s+/).slice(0, 5).join(' ')) && s.split(/\s+/).length < 4).length;

  // Strukturelle Marker
  const hasNumberCascade = (body.match(/\d+/g) ?? []).length >= 5;
  const hasH2 = body.includes('## ');
  const hasNumberedList = /^\s*\d+\.\s/m.test(body);
  const hasTimestamp = /\b\d{1,2}[:.]\d{2}\b|\bMontag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag\b/i.test(body);
  const hasDialog = (body.match(/"[^"]+"/g) ?? []).length >= 1 || (body.match(/„[^"]+"/g) ?? []).length >= 1;
  const hasDmInvite = /\bDM\b|\bschreib mir\b/i.test(body);
  const hasStatusFrage = /\?\s*$|\?\s*\n\s*$/.test(body.trim().split('\n').slice(-3).join('\n'));

  return {
    archetype: result.archetype,
    mood: result.mood,
    body,
    metrics: {
      length_words: body.split(/\s+/).length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      avg_sentence_len: avgLen.toFixed(1),
      short_sentences_under_6w: shortSentences,
      long_sentences_over_30w: longSentences,
      fragments_under_4w: fragments,
      has_number_cascade: hasNumberCascade,
      has_h2: hasH2,
      has_numbered_list: hasNumberedList,
      has_timestamp: hasTimestamp,
      has_dialog: hasDialog,
      has_dm_invite: hasDmInvite,
      ends_with_question: hasStatusFrage,
    },
    firstSentence,
    lastSentence,
  };
}

console.log('═══════════════════════════════════════════════════════════');
console.log('SPURIG BLOG ARCHETYPE-ROTATION TEST');
console.log('Test-Idee:', TEST_IDEA.title);
console.log('═══════════════════════════════════════════════════════════');

// Seriell weil SPURIG_VOICE ~28k input-tokens schluckt und Rate-Limit bei 50k/min liegt
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = await generateOne('A', 6); // Case-Study, staunend
await sleep(40000); // 40s wait für rate-limit-recovery
const r2 = await generateOne('B', 1); // Rant, verärgert
await sleep(40000);
const r3 = await generateOne('F', 3); // Founder-Diary, verletzlich

const results = [analyze(r1), analyze(r2), analyze(r3)].filter(Boolean);
if (results.length === 0) {
  console.error('\n✗ Alle 3 Calls fehlgeschlagen. Abbruch.');
  process.exit(1);
}

// Save outputs to disk for manual inspection
const outDir = 'scripts/_archetype-test-output';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
for (const r of results) {
  writeFileSync(`${outDir}/blog-${r.archetype}-mood-${r.mood}.md`, r.body, 'utf8');
}

// Comparison table
console.log('\n═══════════════════════════════════════════════════════════');
console.log('METRIC COMPARISON');
console.log('═══════════════════════════════════════════════════════════');
const header = ['Metric', ...results.map((r) => `${r.archetype}/m${r.mood}`)];
console.log(header.join(' | '));
console.log('-'.repeat(80));
const metricKeys = Object.keys(results[0].metrics);
for (const k of metricKeys) {
  const row = [k.padEnd(28), ...results.map((r) => String(r.metrics[k]).padEnd(8))];
  console.log(row.join(' | '));
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('FIRST SENTENCES (do they DIFFER structurally?)');
console.log('═══════════════════════════════════════════════════════════');
for (const r of results) {
  console.log(`\n[${r.archetype}/${r.mood}]`);
  console.log(`  First: "${r.firstSentence}"`);
  console.log(`  Last:  "${r.lastSentence}"`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`Full bodies saved to: ${outDir}/`);
console.log('═══════════════════════════════════════════════════════════');

// Verdict
const same_first_word = new Set(results.map((r) => r.firstSentence.split(/\s+/)[0])).size;
const same_ends = new Set(results.map((r) => r.metrics.ends_with_question)).size;
const length_spread = Math.max(...results.map((r) => r.metrics.length_words)) - Math.min(...results.map((r) => r.metrics.length_words));
const has_number_cascade_spread = new Set(results.map((r) => r.metrics.has_number_cascade)).size;

console.log('\nVERDICT:');
console.log(`  Unique first words: ${same_first_word}/${results.length}`);
console.log(`  Different ending behavior: ${same_ends > 1 ? 'YES ✓' : 'NO ✗ (all same)'}`);
console.log(`  Length spread: ${length_spread} words`);
console.log(`  Number-cascade differs: ${has_number_cascade_spread > 1 ? 'YES ✓' : 'NO ✗ (all same)'}`);

if (same_first_word === results.length && same_ends > 1 && has_number_cascade_spread > 1) {
  console.log('\n✅ ROTATION WORKING — Archetypes produce structurally different blogs.');
} else {
  console.log('\n⚠️  ROTATION WEAK — Blogs still too similar. Consider stronger archetype prompting.');
}
