-- ============================================
-- LinkedIn-DM-Helper auf outbound_leads
-- ============================================
-- Speichert generierten DM-Opener + Versand-State.
-- Kein Auto-DM (LinkedIn-ToS), nur Copy-Paste-UI im Admin.

alter table public.outbound_leads
  add column if not exists linkedin_url             text,
  add column if not exists linkedin_first_name      text,
  add column if not exists dm_opener                text,
  add column if not exists dm_opener_model          text,
  add column if not exists dm_opener_generated_at   timestamptz,
  add column if not exists dm_status                text not null default 'pending',
  add column if not exists dm_sent_at               timestamptz,
  add column if not exists dm_replied_at            timestamptz;

comment on column public.outbound_leads.linkedin_url is 'LinkedIn-Profil-URL fuer manuelles DMen.';
comment on column public.outbound_leads.linkedin_first_name is 'Vorname fuer Personalisierung des Openers.';
comment on column public.outbound_leads.dm_opener is 'Generierter DM-Opener-Text (Claude oder Template).';
comment on column public.outbound_leads.dm_opener_model is 'Modell-ID das den Opener generiert hat (z.B. claude-haiku-4-5 / template).';
comment on column public.outbound_leads.dm_status is 'pending | ready | sent | replied | skipped';

create index if not exists outbound_leads_dm_status_idx on public.outbound_leads (dm_status);

-- Constraint: dm_status nur erlaubte Werte
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'outbound_leads_dm_status_check'
  ) then
    alter table public.outbound_leads
      add constraint outbound_leads_dm_status_check
      check (dm_status in ('pending', 'ready', 'sent', 'replied', 'skipped'));
  end if;
end$$;
