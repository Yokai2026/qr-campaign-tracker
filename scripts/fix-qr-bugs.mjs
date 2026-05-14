import { readFileSync } from 'fs';
import QRCode from 'qrcode';

const env = readFileSync('.env.local', 'utf-8');
const get = (k) => {
  const line = env.split('\n').find((l) => l.startsWith(k + '='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
};

const SB_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SB_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const SB_TOKEN = get('SUPABASE_ACCESS_TOKEN');
const BASE_URL = 'https://spurig.com';

console.log('==================================================');
console.log('PART 1: Backfill QR-Codes ohne qr_png_url');
console.log('==================================================');

const broken = await fetch(
  SB_URL + '/rest/v1/qr_codes?qr_png_url=is.null&select=id,short_code,qr_fg_color,qr_bg_color',
  { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } },
).then((r) => r.json());

console.log('Found', broken.length, 'codes without PNG');

for (const c of broken) {
  const redirectUrl = `${BASE_URL}/r/${c.short_code}`;
  const fg = c.qr_fg_color || '#000000';
  const bg = c.qr_bg_color || '#FFFFFF';
  const isTransparent = /^#[0-9A-Fa-f]{6}00$/.test(bg);
  const opts = {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: { dark: fg, light: isTransparent ? '#00000000' : bg },
  };

  const [png, svgRaw] = await Promise.all([
    QRCode.toDataURL(redirectUrl, { ...opts, type: 'image/png' }),
    QRCode.toString(redirectUrl, { ...opts, type: 'svg' }),
  ]);
  const svg = isTransparent
    ? svgRaw.replace(/<path[^>]*fill="#00000000"[^/]*\/>/g, '')
    : svgRaw;
  const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

  const upd = await fetch(SB_URL + '/rest/v1/qr_codes?id=eq.' + c.id, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ qr_png_url: png, qr_svg_url: svgDataUrl }),
  });
  console.log('  ', c.short_code, '→', upd.status === 204 ? '✓ fixed' : '❌ ' + upd.status);
}

console.log('');
console.log('==================================================');
console.log('PART 2: Retroactive Bot-Detection (NULL/empty UA → is_bot=true)');
console.log('==================================================');

const sql = `
  update public.redirect_events
  set is_bot = true
  where is_bot = false
    and (user_agent is null or trim(user_agent) = '' or length(user_agent) < 5);
  select count(*) as updated from public.redirect_events where is_bot = true and (user_agent is null or trim(user_agent) = '');
`;
const r = await fetch(
  'https://api.supabase.com/v1/projects/otgymdbdurpsszulhsji/database/query',
  {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + SB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  },
);
console.log('Update status:', r.status);
const data = await r.json();
console.log('Result:', JSON.stringify(data));

console.log('');
console.log('==================================================');
console.log('PART 3: Verification');
console.log('==================================================');

const verifySql = `
  select qc.short_code, qc.title,
    qc.qr_png_url is null as no_png,
    (select count(*) from public.redirect_events e
      where e.qr_code_id = qc.id and e.event_type = 'qr_open' and e.is_bot = false) as real_scans,
    (select count(*) from public.redirect_events e
      where e.qr_code_id = qc.id and e.event_type = 'qr_open' and e.is_bot = true) as bot_scans
  from public.qr_codes qc
  order by qc.created_at desc
  limit 10;
`;
const v = await fetch(
  'https://api.supabase.com/v1/projects/otgymdbdurpsszulhsji/database/query',
  {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + SB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: verifySql }),
  },
).then((r) => r.json());

console.log('');
console.log('Code      | Title                          | PNG | Real | Bot');
console.log('----------|--------------------------------|-----|------|-----');
for (const row of v) {
  console.log(
    ' ' + (row.short_code || '').padEnd(9) +
    '| ' + (row.title || '').slice(0, 30).padEnd(30) +
    ' | ' + (row.no_png ? '❌ ' : '✓  ') +
    '| ' + String(row.real_scans).padStart(4) +
    ' | ' + String(row.bot_scans).padStart(3),
  );
}
