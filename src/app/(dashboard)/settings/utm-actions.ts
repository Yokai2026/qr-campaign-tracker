'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UtmTemplate } from '@/types';

export async function getUtmTemplates(): Promise<UtmTemplate[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('utm_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  return (data || []) as UtmTemplate[];
}

export async function createUtmTemplate(input: {
  name: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_id?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht angemeldet' };

  if (!input.name.trim()) return { success: false, error: 'Name fehlt' };

  const { error } = await supabase.from('utm_templates').insert({
    user_id: user.id,
    name: input.name.trim(),
    utm_source: input.utm_source || null,
    utm_medium: input.utm_medium || null,
    utm_campaign: input.utm_campaign || null,
    utm_content: input.utm_content || null,
    utm_id: input.utm_id || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

export async function deleteUtmTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('utm_templates')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true };
}
