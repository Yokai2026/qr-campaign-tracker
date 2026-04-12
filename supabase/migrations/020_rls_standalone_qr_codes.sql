-- Extend RLS policies on qr_codes and qr_status_history to support freestanding
-- (placement_id = null) QR codes. Previously all policies required
-- placement_id IN (...), which evaluated to NULL (falsy) for standalone QRs
-- and blocked INSERT/SELECT/UPDATE/DELETE. Now: either the QR belongs to a
-- placement the user owns, or the QR has no placement and was created by the
-- user.

-- qr_codes -------------------------------------------------------------------

drop policy if exists qr_codes_select on public.qr_codes;
drop policy if exists qr_codes_insert on public.qr_codes;
drop policy if exists qr_codes_update on public.qr_codes;
drop policy if exists qr_codes_delete on public.qr_codes;

create policy qr_codes_select on public.qr_codes
  for select
  using (
    (placement_id is null and created_by = auth.uid())
    or placement_id in (
      select p.id
      from placements p
      where p.campaign_id in (
        select c.id from campaigns c where c.owner_id = auth.uid()
      )
    )
  );

create policy qr_codes_insert on public.qr_codes
  for insert
  with check (
    (placement_id is null and created_by = auth.uid())
    or placement_id in (
      select p.id
      from placements p
      where p.campaign_id in (
        select c.id from campaigns c where c.owner_id = auth.uid()
      )
    )
  );

create policy qr_codes_update on public.qr_codes
  for update
  using (
    (placement_id is null and created_by = auth.uid())
    or placement_id in (
      select p.id
      from placements p
      where p.campaign_id in (
        select c.id from campaigns c where c.owner_id = auth.uid()
      )
    )
  );

create policy qr_codes_delete on public.qr_codes
  for delete
  using (
    (placement_id is null and created_by = auth.uid())
    or placement_id in (
      select p.id
      from placements p
      where p.campaign_id in (
        select c.id from campaigns c where c.owner_id = auth.uid()
      )
    )
  );

-- qr_status_history ----------------------------------------------------------

drop policy if exists qr_history_select on public.qr_status_history;
drop policy if exists qr_history_insert on public.qr_status_history;

create policy qr_history_select on public.qr_status_history
  for select
  using (
    qr_code_id in (
      select qr.id
      from qr_codes qr
      left join placements p on p.id = qr.placement_id
      where (qr.placement_id is null and qr.created_by = auth.uid())
         or p.campaign_id in (
           select c.id from campaigns c where c.owner_id = auth.uid()
         )
    )
  );

create policy qr_history_insert on public.qr_status_history
  for insert
  with check (
    qr_code_id in (
      select qr.id
      from qr_codes qr
      left join placements p on p.id = qr.placement_id
      where (qr.placement_id is null and qr.created_by = auth.uid())
         or p.campaign_id in (
           select c.id from campaigns c where c.owner_id = auth.uid()
         )
    )
  );
