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

KRITISCHE OUTPUT-REGELN (verstoesse killen das Bild):
1) Beginne mit einem KONKRETEN PHYSISCHEN OBJEKT. Erste 6 Wörter MÜSSEN starten mit:
   "A stack of..." / "A burnt..." / "A single torn..." / "Hundreds of scattered..." /
   "An open vintage..." / "A crumpled..." / "A weathered..." / "Three thousand..."
   NIEMALS mit "A cluttered scene", "A split-screen", "A minimalist", "A modern office".

2) STRUKTUR: 150-220 Wörter, 3 Akte (Objekt → Setting → Camera/Light/Wow-Detail).

3) ABSOLUT VERBOTEN — wenn EINES davon im Prompt ist, NEU SCHREIBEN:
   "split-screen", "overlay", "side by side comparison", "before-after",
   "infographic", "minimalist", "chart", "graph", "data visualization",
   "icon", "stylized", "corporate"

4) Wähle EIN Konzept (K2/K3/K5/K6 — K1 nur Notfall) — KEIN Mix mit Split-Screen.

5) Style: VICE Magazin / National Geographic Photojournalism — ABER mit YouTube-
   Thumbnail-Feel: TEXT-OVERLAY (1-3 deutsche Worte in BOLD CAPS) + funny/absurd
   detail das das Auge zieht.

6) TEXT-OVERLAY PFLICHT: ein kurzer deutscher Text in Anführungszeichen, z.B.
   "with bold yellow sans-serif text reading exactly 'VERPUFFT.' overlaid in
    the upper-left corner".
   Auswahl: 'VERPUFFT.', 'WEG.', 'AUTSCH.', 'BLIND.', 'OHA.', 'NIE WIEDER.',
   '0 SCANS.', '300€/MONAT.' etc.

7) FUNNY-DETAIL PFLICHT: ein witziges Mini-Element (Brezel im Aktenstapel,
   Smiley-Post-it auf brennendem Schein, Taube auf zerrissener Visitenkarte).

Liefere AUSSCHLIESSLICH den ENGLISCHEN image-Prompt-String. KEIN "Hier ist:",
keine Erklaerung, direkt los mit dem konkreten Objekt.`;

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

  // Check for new requirements: text overlay + funny element
  const hasTextOverlay = /\b(text|headline|caption)\s+(reading|overlay|spelling|saying)\s+['"]/i.test(text) || /bold\s+(yellow|white|orange|red)\s+.{0,30}\bread/i.test(text);
  const hasFunnyElement = /(funny|absurd|unexpected|juxtapos|whimsical|comical|cheeky)/i.test(text) || /(bratwurst|brezel|wurst|smiley|post-it|sticker|note|pigeon|cat |dog )/i.test(text);
  if (hasTextOverlay) console.log(`  ✓ Text-Overlay erkennbar`); else console.log(`  ⚠ Kein Text-Overlay`);
  if (hasFunnyElement) console.log(`  ✓ Funny-Element erkennbar`); else console.log(`  ⚠ Kein Funny-Element`);
  if (violations.length > 0) {
    console.log(`\n  ⚠ FORBIDDEN PATTERN: ${violations.join(', ')}`);
  } else {
    console.log(`\n  ✓ photographic / no infographic-style`);
  }
}
