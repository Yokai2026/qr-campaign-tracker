-- Add QR code styling columns for custom colors
ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS qr_fg_color text NOT NULL DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS qr_bg_color text NOT NULL DEFAULT '#FFFFFF';
