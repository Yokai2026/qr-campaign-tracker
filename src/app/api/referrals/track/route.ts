import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOKIE_NAME = 'spurig_ref';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 Tage

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'spurig-default-salt';
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${ip}|${day}|${salt}`).digest('hex').slice(0, 32);
}

/**
 * POST /api/referrals/track
 * Body: { code: "xxxxxx" }
 *
 * Wird vom Landing-Page-Skript aufgerufen wenn ?ref=XXX in der URL ist.
 * Setzt das Cookie + loggt den Klick.
 */
export async function POST(request: NextRequest) {
  let body: { code?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const code = (body.code ?? '').trim().toLowerCase().slice(0, 32);
  if (!code) return NextResponse.json({ error: 'no_code' }, { status: 400 });

  const service = await createServiceClient();
  const { data: refCode } = await service
    .from('referral_codes')
    .select('id, user_id')
    .eq('code', code)
    .maybeSingle();

  if (!refCode) {
    return NextResponse.json({ ok: false, reason: 'unknown_code' });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const ua = request.headers.get('user-agent')?.slice(0, 200) ?? '';

  // Klick als 'clicked' eintragen — der spätere Signup updated das auf 'signed_up'
  await service.from('referrals').insert({
    referral_code_id: refCode.id,
    referrer_user_id: refCode.user_id,
    ip_hash: hashIp(ip),
    user_agent: ua,
    status: 'clicked',
  });

  // times_used erhöhen für schnellen Stat-Lookup
  await service.rpc('increment_referral_code_use', { p_code_id: refCode.id }).then(
    () => {},
    async () => {
      // Fallback wenn RPC nicht existiert: direct update
      const { data: current } = await service
        .from('referral_codes')
        .select('times_used')
        .eq('id', refCode.id)
        .maybeSingle();
      if (current) {
        await service
          .from('referral_codes')
          .update({ times_used: (current.times_used ?? 0) + 1 })
          .eq('id', refCode.id);
      }
    },
  );

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: code,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
    httpOnly: false, // Client-side lesbar für UTM/Analytics
    sameSite: 'lax',
    secure: true,
  });
  return response;
}
