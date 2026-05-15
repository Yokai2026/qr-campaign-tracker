#!/usr/bin/env node
/**
 * Vercel-Ops-Helper — kleine CLI fuer Env-Vars + Deploys, damit Claude
 * Konfigurationsaenderungen ohne UI-Klicks ausrollen kann.
 *
 * Liest VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID aus .env.local
 * (Aufruf mit `node --env-file=.env.local scripts/vercel-ops.mjs <cmd>`).
 *
 * Subcommands:
 *  - env:list                                List all env vars (Werte verdeckt)
 *  - env:get <KEY>                           Show one env var (decrypted)
 *  - env:set <KEY> <VALUE> [production,preview,development]
 *                                            Create or update an env var
 *  - env:delete <KEY>                        Delete env var
 *  - deploy:latest                           Trigger redeploy of latest production
 *  - deploy:status [id]                      Check status (id optional, default latest)
 */

const API = 'https://api.vercel.com';
const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!TOKEN || !PROJECT_ID) {
  console.error('Missing VERCEL_TOKEN or VERCEL_PROJECT_ID. Use --env-file=.env.local');
  process.exit(1);
}

const teamQuery = TEAM_ID ? `?teamId=${TEAM_ID}` : '';

async function api(path, init = {}) {
  const url = `${API}${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM_ID}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

async function envList() {
  const data = await api(`/v10/projects/${PROJECT_ID}/env?decrypt=false`);
  for (const e of data.envs) {
    console.log(`${e.key.padEnd(40)} target=${(e.target || []).join(',')} type=${e.type}`);
  }
}

async function envGet(key) {
  const data = await api(`/v10/projects/${PROJECT_ID}/env?decrypt=true`);
  const found = data.envs.find((e) => e.key === key);
  if (!found) { console.error(`Not found: ${key}`); process.exit(1); }
  console.log(JSON.stringify({ key: found.key, value: found.value, target: found.target, type: found.type, updatedAt: found.updatedAt }, null, 2));
}

async function envSet(key, value, targetCsv) {
  const target = (targetCsv ?? 'production,preview').split(',').map((s) => s.trim());
  // Existiert sie schon? Wenn ja: PATCH, sonst POST
  const existing = await api(`/v10/projects/${PROJECT_ID}/env?decrypt=false`);
  const current = existing.envs.find((e) => e.key === key);
  if (current) {
    await api(`/v10/projects/${PROJECT_ID}/env/${current.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ value, target, type: current.type }),
    });
    console.log(`✓ updated ${key} (target=${target.join(',')})`);
  } else {
    await api(`/v10/projects/${PROJECT_ID}/env`, {
      method: 'POST',
      body: JSON.stringify({ key, value, target, type: 'sensitive' }),
    });
    console.log(`✓ created ${key} (target=${target.join(',')})`);
  }
}

async function envDelete(key) {
  const existing = await api(`/v10/projects/${PROJECT_ID}/env?decrypt=false`);
  const current = existing.envs.find((e) => e.key === key);
  if (!current) { console.error(`Not found: ${key}`); process.exit(1); }
  await api(`/v10/projects/${PROJECT_ID}/env/${current.id}`, { method: 'DELETE' });
  console.log(`✓ deleted ${key}`);
}

async function deployLatest() {
  // Hole jüngsten Production-Deploy
  const data = await api(`/v6/deployments?projectId=${PROJECT_ID}&target=production&limit=1`);
  const last = data.deployments?.[0];
  if (!last) { console.error('No previous production deployment found'); process.exit(1); }
  console.log(`Redeploy basierend auf ${last.uid} (${last.name})`);

  // Neuer Deploy via gitSource = letztes Commit aus master
  const body = {
    name: last.name,
    target: 'production',
    gitSource: last.gitSource ?? {
      type: 'github',
      repo: last.meta?.githubRepo,
      ref: 'master',
    },
  };
  const out = await api(`/v13/deployments`, { method: 'POST', body: JSON.stringify(body) });
  console.log(`✓ new deploy: ${out.url} (id=${out.id}) status=${out.readyState}`);
}

async function deployStatus(id) {
  if (!id) {
    const data = await api(`/v6/deployments?projectId=${PROJECT_ID}&target=production&limit=1`);
    id = data.deployments?.[0]?.uid;
  }
  const data = await api(`/v13/deployments/${id}`);
  console.log(JSON.stringify({ id: data.id, url: data.url, readyState: data.readyState, source: data.source }, null, 2));
}

const [, , cmd, ...args] = process.argv;
const map = {
  'env:list': () => envList(),
  'env:get': () => envGet(args[0]),
  'env:set': () => envSet(args[0], args[1], args[2]),
  'env:delete': () => envDelete(args[0]),
  'deploy:latest': () => deployLatest(),
  'deploy:status': () => deployStatus(args[0]),
};
const fn = map[cmd];
if (!fn) {
  console.error(`Unknown command: ${cmd}\nAvailable: ${Object.keys(map).join(', ')}`);
  process.exit(1);
}
fn().catch((err) => { console.error(err.message ?? err); process.exit(1); });

// Suppress unused-var lint for teamQuery (kept for future use)
void teamQuery;
