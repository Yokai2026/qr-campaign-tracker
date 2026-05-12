import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashToken, looksLikeToken } from './tokens';

// Service-Role-Client: umgeht RLS, weil API-Endpoints selbst per
// user_id-Filter scopen. Wird NUR aus Route-Handlern mit gueltigem
// Bearer-Token aufgerufen.
export function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export type ApiAuth = {
  userId: string;
  tokenId: string;
};

// Validiert "Authorization: Bearer spr_live_..." Header.
// Liefert NextResponse mit 401 wenn ungueltig, sonst ApiAuth-Kontext.
export async function authenticateRequest(req: NextRequest): Promise<ApiAuth | NextResponse> {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return apiError(401, 'Authorization header required (Bearer token)');
  }
  const token = auth.slice(7).trim();
  if (!looksLikeToken(token)) {
    return apiError(401, 'Invalid token format');
  }

  const hash = hashToken(token);
  const sb = serviceRoleClient();
  const { data, error } = await sb
    .from('api_tokens')
    .select('id, user_id, expires_at, revoked_at')
    .eq('token_hash', hash)
    .maybeSingle();

  if (error || !data) return apiError(401, 'Invalid or unknown token');
  if (data.revoked_at) return apiError(401, 'Token has been revoked');
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return apiError(401, 'Token has expired');
  }

  // last_used_at aktualisieren (fire-and-forget, kein await im Hot-Path)
  void sb.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);

  return { userId: data.user_id, tokenId: data.id };
}

export function apiError(status: number, message: string, code?: string) {
  return NextResponse.json({ error: { message, code: code ?? status.toString() } }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
