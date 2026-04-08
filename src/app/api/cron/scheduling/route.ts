import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Cron job: Auto-activate/complete campaigns based on start_date/end_date.
 * Runs daily at 06:00 UTC (before reports at 07:00).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Auto-activate: draft campaigns whose start_date has arrived
  const { data: activated } = await supabase
    .from('campaigns')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('status', 'draft')
    .lte('start_date', today)
    .select('id');

  // Auto-complete: active campaigns whose end_date has passed
  const { data: completed } = await supabase
    .from('campaigns')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('status', 'active')
    .lt('end_date', today)
    .select('id');

  return NextResponse.json({
    activated: activated?.length ?? 0,
    completed: completed?.length ?? 0,
  });
}
