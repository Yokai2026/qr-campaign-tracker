// E2E-Test: Simuliert den exakten Bug-Scenario aus dem Screenshot.
//
// Setup:
//   - User signt mit username=X + email=Y, kriegt Confirmation-Mail, klickt
//     sie NICHT.
//   - User versucht erneut mit GLEICHEN Daten (oder neuem Username, gleicher
//     Email).
//
// Erwartung:
//   1. RPC mit (X, Y) → false (frei, weil eigener unbestaetigter Retry)
//   2. RPC mit (X, andere_email) → true (vergeben, fremder Konflikt)
//   3. RPC mit (X) (1-Arg, alter Frontend-Call) → true (vergeben, da
//      ohne Email-Kontext keine Ausnahme moeglich; konservativ blockieren)
//   4. handle_new_user-Trigger raeumt orphan Profile auf, wenn der User
//      mit gleichen Daten retry'd

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
const username = `testretry_${suffix}`;
// "@example.com" is on Supabase's blocked-mailbox-domain list since it returns
// a 422 from the validator; use a domain that GoTrue accepts.
const email = `testretry_${suffix}@spurig-test.invalid`;
const otherEmail = `other_${suffix}@spurig-test.invalid`;
const password = 'Password12345!';

function log(label, val) {
  console.log(`\n=== ${label} ===`);
  console.dir(val, { depth: 4 });
}

let cleanupIds = [];
let testFailed = false;

try {
  // 0. Sicherstellen: User existiert noch nicht.
  log('SCENARIO', { username, email });

  // 1. Erst-Signup als unbestaetigter User — exakt wie der Frontend-Code es macht
  const created = await anon.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
    },
  });
  if (created.error) throw new Error(`signUp failed: ${created.error.message}`);
  if (!created.data.user) throw new Error('signUp returned no user');
  cleanupIds.push(created.data.user.id);
  log('Step 1: unconfirmed user created', {
    id: created.data.user.id,
    email: created.data.user.email,
    confirmed_at: created.data.user.email_confirmed_at,
  });

  // Verify profile row exists
  const { data: prof1 } = await admin
    .from('profiles')
    .select('id, username, email')
    .eq('id', created.data.user.id)
    .single();
  log('Step 1: profile row', prof1);

  // 2. RPC 2-Arg: same username + same email → expected false (own retry)
  const r1 = await anon.rpc('username_exists', {
    lookup_username: username,
    lookup_email: email,
  });
  log('Step 2: RPC (username, ownEmail) — expect data:false', r1);
  if (r1.error || r1.data !== false) {
    console.error('❌ FAIL: should be free for own unconfirmed retry');
    testFailed = true;
  }

  // 3. RPC 2-Arg: same username + DIFFERENT email → expected true (real conflict)
  const r2 = await anon.rpc('username_exists', {
    lookup_username: username,
    lookup_email: otherEmail,
  });
  log('Step 3: RPC (username, otherEmail) — expect data:true', r2);
  if (r2.error || r2.data !== true) {
    console.error('❌ FAIL: should be blocked for different-email conflict');
    testFailed = true;
  }

  // 4. RPC 1-Arg legacy (deployed frontend): username only → expected true
  const r3 = await anon.rpc('username_exists', { lookup_username: username });
  log('Step 4: RPC (username) 1-arg legacy — expect data:true', r3);
  if (r3.error || r3.data !== true) {
    console.error('❌ FAIL: legacy 1-arg call must still block (no email context)');
    testFailed = true;
  }

  // 5. Confirm the user → now RPC must say true even with email
  const upd = await admin.auth.admin.updateUserById(created.data.user.id, {
    email_confirm: true,
  });
  if (upd.error) throw new Error(`confirm failed: ${upd.error.message}`);
  log('Step 5: user confirmed', { confirmed_at: upd.data.user.email_confirmed_at });

  const r4 = await anon.rpc('username_exists', {
    lookup_username: username,
    lookup_email: email,
  });
  log('Step 5: RPC (username, ownEmail) after confirm — expect data:true', r4);
  if (r4.error || r4.data !== true) {
    console.error('❌ FAIL: confirmed account must always block');
    testFailed = true;
  }

  // 6. Bonus: case-insensitive — uppercase username should still hit
  const r5 = await anon.rpc('username_exists', {
    lookup_username: username.toUpperCase(),
    lookup_email: email,
  });
  log('Step 6: RPC case-insensitive — expect data:true', r5);
  if (r5.error || r5.data !== true) {
    console.error('❌ FAIL: case-insensitive check broken');
    testFailed = true;
  }
} catch (e) {
  console.error('💥 EXCEPTION:', e);
  testFailed = true;
} finally {
  // Cleanup
  console.log('\n=== Cleanup ===');
  for (const id of cleanupIds) {
    await admin.from('profiles').delete().eq('id', id);
    const del = await admin.auth.admin.deleteUser(id);
    console.log(`deleted ${id}:`, del.error?.message || 'ok');
  }

  if (testFailed) {
    console.log('\n❌ TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED');
  }
}
