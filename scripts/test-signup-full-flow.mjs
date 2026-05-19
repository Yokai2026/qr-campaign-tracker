// Full signup E2E: signUp → confirm → login → check profile, referral_code.
// Beweist: kein "Database error saving new user" mehr, alle Trigger laufen.

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { randomBytes } from 'node:crypto';
config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const suffix = randomBytes(3).toString('hex');
const username = `e2e_${suffix}`;
const email = `e2e_${suffix}@spurig-test.invalid`;
const password = 'Password12345!';

let cleanup = [];
let fail = false;

function log(label, v) {
  console.log(`\n=== ${label} ===`);
  console.dir(v, { depth: 4 });
}

try {
  // 1. signUp (real flow, like the frontend does)
  const su = await anon.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: username } },
  });
  if (su.error) throw new Error(`signUp: ${su.error.message}`);
  if (!su.data.user) throw new Error('no user from signUp');
  cleanup.push(su.data.user.id);
  log('Step 1: signUp ok', { id: su.data.user.id, confirmed: su.data.user.email_confirmed_at });

  // 2. Profile row exists with username
  const { data: prof } = await admin
    .from('profiles')
    .select('id, username, email, role, trial_ends_at')
    .eq('id', su.data.user.id)
    .single();
  log('Step 2: profile row', prof);
  if (!prof || prof.username !== username) { console.error('❌ profile/username mismatch'); fail = true; }

  // 3. Referral code generated (Trigger from mig 048)
  const { data: ref } = await admin
    .from('referral_codes')
    .select('user_id, code')
    .eq('user_id', su.data.user.id)
    .single();
  log('Step 3: referral code', ref);
  if (!ref || !ref.code || ref.code.length !== 8) { console.error('❌ referral_code missing or wrong length'); fail = true; }

  // 4. Manually confirm email (since we cannot click the mail in a test)
  const conf = await admin.auth.admin.updateUserById(su.data.user.id, { email_confirm: true });
  if (conf.error) throw new Error(`confirm: ${conf.error.message}`);
  log('Step 4: confirmed', { confirmed_at: conf.data.user.email_confirmed_at });

  // 5. Login should work now
  const li = await anon.auth.signInWithPassword({ email, password });
  if (li.error) { console.error('❌ login:', li.error.message); fail = true; }
  else log('Step 5: login', { session: !!li.data.session, user_id: li.data.user?.id });

  // 6. Login-by-username path (src/app/login/actions.ts → resolve_username)
  const { data: resolvedEmail, error: rErr } = await anon.rpc('resolve_username', { lookup_username: username });
  log('Step 6: resolve_username', { resolvedEmail, rErr });
  if (rErr || resolvedEmail !== email) { console.error('❌ resolve_username broken'); fail = true; }

} catch (e) {
  console.error('💥', e);
  fail = true;
} finally {
  console.log('\n=== Cleanup ===');
  for (const id of cleanup) {
    await admin.from('referral_codes').delete().eq('user_id', id);
    await admin.from('profiles').delete().eq('id', id);
    const d = await admin.auth.admin.deleteUser(id);
    console.log(`deleted ${id}:`, d.error?.message || 'ok');
  }
  console.log(fail ? '\n❌ FAILED' : '\n✅ ALL OK');
  process.exit(fail ? 1 : 0);
}
