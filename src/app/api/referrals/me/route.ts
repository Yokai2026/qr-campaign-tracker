import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/referrals/me
 * Liefert eigenen Referral-Code + Stats (Klicks / Conversions / Rewards).
 */
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const service = await createServiceClient();

  const { data: code } = await service
    .from('referral_codes')
    .select('id, code, times_used, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  // Falls noch kein Code (z.B. alter Account vor Migration) → on-the-fly anlegen
  let finalCode = code;
  if (!finalCode) {
    const newCode = Math.random().toString(36).slice(2, 10);
    const { data: inserted } = await service
      .from('referral_codes')
      .insert({ user_id: user.id, code: newCode })
      .select('id, code, times_used, created_at')
      .single();
    finalCode = inserted ?? null;
  }

  if (!finalCode) {
    return NextResponse.json({ error: 'could_not_create_code' }, { status: 500 });
  }

  // Stats aggregieren
  const { data: referrals } = await service
    .from('referrals')
    .select('status')
    .eq('referrer_user_id', user.id);

  const stats = {
    clicks: 0,
    signups: 0,
    conversions: 0,
    rewards: 0,
  };
  for (const r of referrals ?? []) {
    if (r.status === 'clicked') stats.clicks++;
    if (r.status === 'signed_up') stats.signups++;
    if (r.status === 'converted') stats.conversions++;
    if (r.status === 'rewarded') stats.rewards++;
  }
  // Free months earned = rewards + conversions awaiting reward
  const monthsEarned = stats.rewards + stats.conversions;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spurig.com';
  const shareUrl = `${appUrl}/?ref=${finalCode.code}`;

  return NextResponse.json({
    code: finalCode.code,
    shareUrl,
    stats: { ...stats, monthsEarned },
  });
}
