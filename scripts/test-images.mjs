import { readFileSync } from 'node:fs';
const env = readFileSync('.env.local', 'utf8');
const get = k => { const l = env.split('\n').find(x => x.startsWith(k+'=')); return l ? l.split('=').slice(1).join('=').trim() : null; };
const apiKey = get('ANTHROPIC_API_KEY');

const voice = readFileSync('src/lib/content/spurig-voice.ts', 'utf8').match(/SPURIG_VOICE = `([\s\S]*?)`\.trim\(\)/)[1];

// Extract the image-prompt section from ideas.ts so the test uses the same instructions
const ideasFile = readFileSync('src/lib/content/ideas.ts', 'utf8');
const imgSection = ideasFile.match(/IMAGE-PROMPT — VIRAL THUMBNAIL[\s\S]*?LAENGE[\s\S]*?Konkrete Details > vage Adjektive\./)?.[0] ?? '';

const topics = [
  {
    title: '47 Standorte. 3 funktionierten. 38.000 Euro pro Monat für nichts.',
    angle: 'Pattern G: Geld verbrennt. Ein Kunde zahlte 50k/Monat fuer 47 Plakate. 3 davon brachten 82% aller Anfragen.',
    pillar: 'Offline-Marketing ROI',
  },
  {
    title: 'Sechs Jahre Klick-Daten. Über den Atlantik. Ohne Vertrag.',
    angle: 'Pattern D: Bitly speichert deutsche Tracking-Daten in Ashburn Virginia. AVV-Vertrag existiert nicht.',
    pillar: 'DSGVO & Privacy',
  },
  {
    title: 'Dein QR-Code auf der Plakatwand wird 0,3% gescannt. Hier warum.',
    angle: 'QR-Practices: Code zu klein, Position zu hoch, kein Mehrwert-Versprechen. Bei der Konkurrenz: 12% Scan-Rate.',
    pillar: 'QR-Code Best-Practices',
  },
];

for (const t of topics) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`TOPIC: ${t.title}`);
  console.log('═'.repeat(70));

  const prompt = voice + '\n\n' + imgSection + `

DEINE AUFGABE: Generiere NUR den image_prompt fuer einen Blog mit:
Title: "${t.title}"
Angle: ${t.angle}
Pillar: ${t.pillar}

Liefere AUSSCHLIESSLICH den ENGLISCHEN image-Prompt-String (80-130 Worte).
KEIN "Hier ist:", keine Erklaerung, keine Anfuehrungszeichen drum, direkt los.

Style-Reference: REF 1-5 oben. Wirf KEIN data-visualization oder infographic.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  const text = data.content?.find(c => c.type === 'text')?.text?.trim() ?? '';
  console.log(text);

  const lower = text.toLowerCase();
  const forbidden = [
    'visualization', 'infographic', 'icons', 'diagram', 'chart',
    'minimalist', 'clean modern', 'corporate', 'boardroom',
    'data flowing', 'symbolic', 'stylized', 'flat-design',
    'professional photography style', 'split-screen visual metaphor',
    'map of germany',
  ];
  const violations = forbidden.filter(p => lower.includes(p));
  if (violations.length > 0) {
    console.log(`\n  ⚠ FORBIDDEN PATTERN: ${violations.join(', ')}`);
  } else {
    console.log(`\n  ✓ photographic / no infographic-style`);
  }
}
