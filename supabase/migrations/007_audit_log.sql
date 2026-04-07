-- ============================================
-- AUDIT LOG — Security-relevant actions
-- ============================================

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- Index for querying by user and time
create index idx_audit_log_user on public.audit_log(user_id);
create index idx_audit_log_created on public.audit_log(created_at desc);
create index idx_audit_log_action on public.audit_log(action);

-- RLS: only admins can read audit log
alter table public.audit_log enable row level security;

create policy "audit_log_select_admin" on public.audit_log
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- INSERT via service role only (no user-facing inserts)
create policy "audit_log_insert_service" on public.audit_log
  for insert with check (true);

-- Auto-cleanup: delete audit entries older than 36 months
create or replace function public.cleanup_old_audit_log()
returns void
language plpgsql
security definer
as $$
declare
  deleted_count bigint;
begin
  delete from public.audit_log where created_at < now() - interval '36 months';
  get diagnostics deleted_count = row_count;
  raise log 'Audit log cleanup: deleted % entries older than 36 months', deleted_count;
end;
$$;

select cron.schedule(
  'cleanup-old-audit-log',
  '30 3 * * *',
  $$SELECT public.cleanup_old_audit_log()$$
);
