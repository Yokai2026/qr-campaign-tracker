'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { ReportFrequency, ReportSchedule } from '@/types';

export async function getReportSchedules(): Promise<ReportSchedule[]> {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase
    .from('report_schedules')
    .select('*, campaign:campaigns(id, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (data || []) as ReportSchedule[];
}

export async function createReportSchedule(input: {
  email: string;
  frequency: ReportFrequency;
  campaign_id: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const nextRun = computeNextRun(input.frequency);

  const { error } = await supabase.from('report_schedules').insert({
    user_id: user.id,
    email: input.email,
    frequency: input.frequency,
    campaign_id: input.campaign_id || null,
    next_run_at: nextRun.toISOString(),
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function deleteReportSchedule(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('report_schedules')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function toggleReportSchedule(id: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('report_schedules')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

function computeNextRun(frequency: ReportFrequency): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(7, 0, 0, 0); // 07:00 Uhr

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 - next.getDay() + 1) % 7 || 7); // Next Monday
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1, 1); // 1st of next month
      break;
  }
  return next;
}
