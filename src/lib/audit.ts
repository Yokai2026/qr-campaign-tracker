import { createServiceClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'account.deleted'
  | 'account.password_reset'
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.deleted'
  | 'qr_code.created'
  | 'qr_code.deleted'
  | 'qr_code.deactivated'
  | 'short_link.created'
  | 'short_link.deleted'
  | 'placement.created'
  | 'placement.deleted'
  | 'data_export.requested'
  | 'role.changed';

/**
 * Log a security-relevant action to the audit log.
 * Uses the service role client to bypass RLS (INSERT policy is permissive).
 * Fire-and-forget — errors are logged but don't block the calling action.
 */
export async function logAudit(params: {
  userId: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipHash?: string;
}): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from('audit_log').insert({
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      details: params.details ?? null,
      ip_hash: params.ipHash ?? null,
    });
  } catch (err) {
    // Never let audit logging break the main flow
    console.error('[audit] Failed to log action:', params.action, err);
  }
}
