-- Onboarding-Tour Marker auf profiles.
-- Wird auf now() gesetzt sobald der User die Tour durchklickt oder skippt,
-- damit sie nicht erneut auftaucht. Bestandsuser werden ebenfalls auf now()
-- gesetzt damit keine Tour-Spam-Welle ausgeloest wird.

alter table public.profiles
  add column if not exists tour_completed_at timestamptz;

comment on column public.profiles.tour_completed_at is
  'Zeitpunkt zu dem die Onboarding-Tour abgeschlossen oder uebersprungen wurde. NULL = Tour noch ausstehend.';

-- Backfill: alle bestehenden bestaetigten User direkt als "Tour erledigt"
-- markieren — sie kennen das Dashboard bereits, sollen keine Tour bekommen.
update public.profiles p
set tour_completed_at = now()
from auth.users u
where p.id = u.id
  and u.email_confirmed_at is not null
  and p.tour_completed_at is null;
