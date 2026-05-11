import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile } from '@/types';

// react.cache() dedupliziert Aufrufe innerhalb eines RSC-Renders.
// Wenn Page + Layout + getSessionTier alle requireAuth aufrufen, geht der
// Supabase-Roundtrip trotzdem nur einmal raus.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const requireAuth = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return profile as Profile;
});

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }
  return profile;
}
