'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/audit';

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Nicht authentifiziert' };
  }

  // Log before deletion (user_id will be set to null after cascade)
  await logAudit({
    userId: user.id,
    action: 'account.deleted',
    details: { email: user.email },
  });

  const serviceClient = await createServiceClient();

  // Delete the user via admin API — cascades to profiles via FK
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Sign out the current session
  await supabase.auth.signOut();

  redirect('/login');
}
