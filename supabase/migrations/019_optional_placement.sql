-- Make qr_codes.placement_id optional so that QR codes can exist without
-- being bound to a placement (freestanding / ad-hoc QR codes).
alter table public.qr_codes
  alter column placement_id drop not null;
