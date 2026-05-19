// Get postgres logs from Supabase Management API with filter
import { config } from 'dotenv';
config({ path: '.env.local' });

const service = process.argv[2] || 'postgres';
const minutes = parseInt(process.argv[3] || '15', 10);
const filter = process.argv[4] || 'ERROR';

const iso = new Date(Date.now() - minutes * 60 * 1000).toISOString();
const sql = filter === '*'
  ? `SELECT id, event_message, timestamp FROM ${service}_logs ORDER BY timestamp DESC LIMIT 100`
  : `SELECT id, event_message, timestamp FROM ${service}_logs WHERE event_message ILIKE '%${filter}%' ORDER BY timestamp DESC LIMIT 50`;
console.log('SQL:', sql);

const url = `https://api.supabase.com/v1/projects/otgymdbdurpsszulhsji/analytics/endpoints/logs.all?sql=${encodeURIComponent(sql)}`;

const res = await fetch(url, {
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
  },
});
console.log('status', res.status);
const txt = await res.text();
try {
  const j = JSON.parse(txt);
  for (const row of (j.result || []).slice(0, 50)) {
    console.log(`[${row.timestamp}] ${row.event_message}`);
  }
} catch {
  console.log(txt);
}
