// Apply any migration file via Management API
import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
config({ path: '.env.local' });

const file = process.argv[2];
if (!file) { console.error('usage: node apply-migration.mjs <file>'); process.exit(1); }

const sql = await readFile(file, 'utf8');
const res = await fetch(
  `https://api.supabase.com/v1/projects/otgymdbdurpsszulhsji/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  },
);
const body = await res.text();
console.log('status', res.status);
console.log(body);
if (!res.ok) process.exit(1);
