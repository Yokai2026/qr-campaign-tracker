// Standalone-Smoke-Test fuer die Anti-Klischee-Regex-Logik.
// Da das Projekt @/-Aliases nutzt, koennen wir ideas.ts nicht direkt
// importieren — also Logik-Duplikat hier (kleine Spiegelung, identisch
// zu BANNED_PHRASE_PATTERNS in src/lib/content/ideas.ts).
// Bei Aenderungen an der Logik dort: hier mitziehen.

const BANNED_PHRASE_PATTERNS = [
  { name: 'X Minuten/Sekunden Stille',            regex: /\bdrei\s+(?:minuten|sekunden)\s+stille\b/gi },
  { name: '"X Sekunden Stille" generic',          regex: /\b(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|\d+)\s+(?:minuten|sekunden)\s+stille\b/gi },
  { name: '"Das war der Moment, wo mir klar..."', regex: /\bdas war der moment,?\s+wo mir klar wurde\b/gi },
  { name: 'Standalone "Stille."',                 regex: /(^|\n)\s*Stille\.\s*(\n|$)/g },
  { name: '"Ich realisierte:" als Pivot',         regex: /^\s*Ich realisierte:/gim },
];

function findBannedPhrases(body) {
  const hits = [];
  for (const { name, regex } of BANNED_PHRASE_PATTERNS) {
    if (regex.test(body)) hits.push(name);
    regex.lastIndex = 0;
  }
  return hits;
}

function stripBannedPhrases(body) {
  let out = body;
  out = out.replace(/\b(?:drei|zwei|vier|fünf|\d+)\s+(?:Minuten|Sekunden)\s+Stille\.\s+Dann\b/gi, 'Dann');
  out = out.replace(/\b(?:drei|zwei|vier|fünf|\d+)\s+(?:Minuten|Sekunden)\s+Stille\.\s*/gi, '');
  out = out.replace(/Das war der Moment,?\s+wo mir klar wurde[,\s—–-]+/gi, '');
  out = out.replace(/(^|\n)\s*Stille\.\s*(\n|$)/g, '$1$2');
  out = out.replace(/^\s*Ich realisierte:\s*/gim, '');
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

const cases = [
  {
    label: 'Drei Minuten Stille',
    input: 'Mein Kunde zahlte 50.000 Euro. Drei Minuten Stille. Dann sagte sie: "Keine Ahnung."',
    expectFinds: ['X Minuten/Sekunden Stille', '"X Sekunden Stille" generic'],
    expectStripped: /Dann sagte sie/,
  },
  {
    label: 'Das war der Moment',
    input: 'Sechs Jahre Daten. Niemand wusste wo. Das war der Moment, wo mir klar wurde — wir laufen blind.',
    expectFinds: ['"Das war der Moment, wo mir klar..."'],
    expectStripped: /wir laufen blind/,
  },
  {
    label: 'Standalone Stille.',
    input: 'Er fragte: "Wer trackt das?"\n\nStille.\n\nDann hob sie die Hand.',
    expectFinds: ['Standalone "Stille."'],
    expectStripped: /Dann hob sie/,
  },
  {
    label: 'Ich realisierte',
    input: 'Sie hatte recht.\nIch realisierte: das war kein Tracking-Problem.\nEs war ein Vertrauensthema.',
    expectFinds: ['"Ich realisierte:" als Pivot'],
    expectStripped: /das war kein Tracking-Problem/,
  },
  {
    label: 'Multiple cliches combined (realistisches Blog-Layout)',
    input: 'Sie tippte drei Minuten. Drei Sekunden Stille. Dann sagte sie nichts.\n\nStille.\n\nDas war der Moment, wo mir klar wurde — das ist ein System-Problem.',
    expectFinds: [
      'X Minuten/Sekunden Stille',
      '"X Sekunden Stille" generic',
      'Standalone "Stille."',
      '"Das war der Moment, wo mir klar..."',
    ],
    expectStripped: /System-Problem/,
  },
  {
    label: 'Clean blog (kein Klischee)',
    input: 'Sie tippte. Loeschte. Tippte wieder. Dann: "Ashburn, Virginia." Sechs Wochen spaeter hatten wir den Vertrag.',
    expectFinds: [],
    expectStripped: /Ashburn, Virginia/,
  },
];

let failures = 0;
for (const c of cases) {
  const hits = findBannedPhrases(c.input);
  const stripped = stripBannedPhrases(c.input);

  const missing = c.expectFinds.filter((e) => !hits.includes(e));
  const extra = hits.filter((h) => !c.expectFinds.includes(h));
  const cleanOk = c.expectStripped.test(stripped);
  const noBannedInStripped = findBannedPhrases(stripped).length === 0;

  const ok = missing.length === 0 && extra.length === 0 && cleanOk && noBannedInStripped;
  if (!ok) failures++;

  console.log(`\n=== ${c.label} ===`);
  console.log(`finds:    [${hits.join(', ')}]`);
  console.log(`stripped: "${stripped.slice(0, 120)}${stripped.length > 120 ? '...' : ''}"`);
  console.log(
    `  - missing finds:        ${missing.length === 0 ? 'ok' : missing.join(', ')}\n`
    + `  - extra finds:          ${extra.length === 0 ? 'ok' : extra.join(', ')}\n`
    + `  - pattern in stripped:  ${cleanOk ? 'ok' : 'FAIL'}\n`
    + `  - kein Klischee mehr:   ${noBannedInStripped ? 'ok' : 'FAIL'}`,
  );
  console.log(ok ? '  ✅ pass' : '  ❌ FAIL');
}

console.log('\n' + (failures === 0 ? '✅ ALL PASS' : `❌ ${failures} FAIL`));
process.exit(failures === 0 ? 0 : 1);
