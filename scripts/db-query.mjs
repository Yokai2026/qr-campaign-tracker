// Run arbitrary SQL via Supabase Management API
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = process.argv.slice(2).join(' ');
if (!sql) { console.error('usage: node db-query.mjs "SELECT 1"'); process.exit(1); }

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
console.log('status', res.status);
console.log(await res.text());
