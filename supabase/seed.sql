-- ============================================
-- SEED DATA for QR Campaign Tracker
-- Run this after creating a user via Supabase Auth
-- Replace the user ID below with your actual user ID
-- ============================================

-- NOTE: First create a user in Supabase Auth dashboard or via API.
-- The profile will be auto-created by the trigger.
-- Then update the role to 'admin':
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';

-- ============================================
-- CAMPAIGNS
-- ============================================
INSERT INTO public.campaigns (id, name, slug, description, status, start_date, end_date) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Bildung für Alle 2026', 'bildung-fuer-alle-2026', 'Bildungskampagne für Jugendliche in Berlin', 'active', '2026-03-01', '2026-09-30'),
  ('c1000000-0000-0000-0000-000000000002', 'Digitale Teilhabe Spandau', 'digitale-teilhabe-spandau', 'Förderprogramm digitale Kompetenz im Bezirk Spandau', 'active', '2026-04-01', '2026-12-31'),
  ('c1000000-0000-0000-0000-000000000003', 'Sommer-Leseclub 2026', 'sommer-leseclub-2026', 'Sommerliches Leseprogramm in Bibliotheken', 'draft', '2026-06-01', '2026-08-31');

-- Tags
INSERT INTO public.campaign_tags (campaign_id, tag) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'bildung'),
  ('c1000000-0000-0000-0000-000000000001', 'jugend'),
  ('c1000000-0000-0000-0000-000000000001', 'berlin'),
  ('c1000000-0000-0000-0000-000000000002', 'digital'),
  ('c1000000-0000-0000-0000-000000000002', 'spandau'),
  ('c1000000-0000-0000-0000-000000000002', 'förderung'),
  ('c1000000-0000-0000-0000-000000000003', 'bibliothek'),
  ('c1000000-0000-0000-0000-000000000003', 'lesen');

-- ============================================
-- LOCATIONS
-- ============================================
INSERT INTO public.locations (id, district, venue_name, address, location_type, notes, active) VALUES
  ('l1000000-0000-0000-0000-000000000001', 'Spandau', 'Stadtbibliothek Spandau', 'Carl-Schurz-Str. 13, 13597 Berlin', 'library', 'Haupteingang und Jugendbereich', true),
  ('l1000000-0000-0000-0000-000000000002', 'Spandau', 'Jugendzentrum Spandau', 'Mauerstr. 6, 13597 Berlin', 'youth_center', 'Eingang und schwarzes Brett', true),
  ('l1000000-0000-0000-0000-000000000003', 'Mitte', 'Zentral- und Landesbibliothek', 'Breite Str. 30-36, 10178 Berlin', 'library', 'Foyer und Informationsbereich', true),
  ('l1000000-0000-0000-0000-000000000004', 'Neukölln', 'Gemeinschaftshaus Gropiusstadt', 'Bat-Yam-Platz 1, 12353 Berlin', 'community_center', 'Aushang im Treppenhaus', true),
  ('l1000000-0000-0000-0000-000000000005', 'Charlottenburg', 'Schiller-Bibliothek', 'Müllerstr. 149, 13353 Berlin', 'library', NULL, true),
  ('l1000000-0000-0000-0000-000000000006', 'Spandau', 'Kulturhaus Spandau', 'Mauerstr. 6, 13597 Berlin', 'event_space', 'Veranstaltungsfoyer', true),
  ('l1000000-0000-0000-0000-000000000007', 'Mitte', 'Rathaus Mitte', 'Karl-Marx-Allee 31, 10178 Berlin', 'public_board', 'Aushangstafel EG', true);

-- ============================================
-- PLACEMENTS
-- ============================================
INSERT INTO public.placements (id, campaign_id, location_id, name, placement_code, placement_type, poster_version, status, installed_at) VALUES
  ('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000001', 'Bibliothek Eingang links', 'bfa-spandau-bib-01', 'poster', 'A3-v1', 'active', '2026-03-15T10:00:00Z'),
  ('p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000001', 'Bibliothek Jugendbereich', 'bfa-spandau-bib-02', 'flyer', 'Flyer-v1', 'active', '2026-03-15T10:00:00Z'),
  ('p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000002', 'Jugendzentrum Eingang', 'bfa-spandau-jz-01', 'poster', 'A3-v1', 'active', '2026-03-16T09:00:00Z'),
  ('p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000003', 'ZLB Foyer links', 'bfa-mitte-zlb-01', 'poster', 'A3-v2', 'active', '2026-03-20T11:00:00Z'),
  ('p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'l1000000-0000-0000-0000-000000000001', 'Digitale Teilhabe Flyer Theke', 'dt-spandau-bib-01', 'flyer', 'Flyer-A5-v1', 'active', '2026-04-01T08:00:00Z'),
  ('p1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'l1000000-0000-0000-0000-000000000006', 'Kulturhaus Poster Foyer', 'dt-spandau-kh-01', 'poster', 'A2-v1', 'installed', '2026-04-02T09:00:00Z'),
  ('p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000004', 'Gropiusstadt Community Board', 'bfa-nk-grop-01', 'poster', 'A3-v1', 'active', '2026-03-22T14:00:00Z'),
  ('p1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000007', 'Rathaus Mitte Aushang', 'bfa-mitte-rat-01', 'poster', 'A3-v2', 'paused', '2026-03-25T10:00:00Z');

-- ============================================
-- QR CODES
-- ============================================
INSERT INTO public.qr_codes (id, placement_id, short_code, target_url, active, utm_source, utm_medium, utm_campaign, utm_content) VALUES
  ('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'bfa-sb01', 'https://example.com/bildung-fuer-alle', true, 'poster', 'offline_qr', 'bildung-fuer-alle-2026', 'bfa-spandau-bib-01'),
  ('q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'bfa-sb02', 'https://example.com/bildung-fuer-alle', true, 'flyer', 'offline_qr', 'bildung-fuer-alle-2026', 'bfa-spandau-bib-02'),
  ('q1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'bfa-jz01', 'https://example.com/bildung-fuer-alle', true, 'poster', 'offline_qr', 'bildung-fuer-alle-2026', 'bfa-spandau-jz-01'),
  ('q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'bfa-zl01', 'https://example.com/bildung-fuer-alle', true, 'poster', 'offline_qr', 'bildung-fuer-alle-2026', 'bfa-mitte-zlb-01'),
  ('q1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000005', 'dt-sb01', 'https://example.com/digitale-teilhabe', true, 'flyer', 'offline_qr', 'digitale-teilhabe-spandau', 'dt-spandau-bib-01'),
  ('q1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000006', 'dt-kh01', 'https://example.com/digitale-teilhabe', true, 'poster', 'offline_qr', 'digitale-teilhabe-spandau', 'dt-spandau-kh-01'),
  ('q1000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000007', 'bfa-gp01', 'https://example.com/bildung-fuer-alle', true, 'poster', 'offline_qr', 'bildung-fuer-alle-2026', 'bfa-nk-grop-01'),
  ('q1000000-0000-0000-0000-000000000008', 'p1000000-0000-0000-0000-000000000008', 'bfa-rm01', 'https://example.com/bildung-fuer-alle', false, 'poster', 'offline_qr', 'bildung-fuer-alle-2026', 'bfa-mitte-rat-01');

-- ============================================
-- SAMPLE REDIRECT EVENTS (simulated scans)
-- ============================================
INSERT INTO public.redirect_events (qr_code_id, placement_id, campaign_id, short_code, event_type, device_type, ip_hash, destination_url, created_at) VALUES
  -- Spandau Bibliothek Eingang (popular)
  ('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb01', 'qr_open', 'mobile', 'hash1', 'https://example.com/bildung-fuer-alle', '2026-03-16T14:23:00Z'),
  ('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb01', 'qr_open', 'mobile', 'hash2', 'https://example.com/bildung-fuer-alle', '2026-03-17T10:15:00Z'),
  ('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb01', 'qr_open', 'mobile', 'hash3', 'https://example.com/bildung-fuer-alle', '2026-03-18T16:30:00Z'),
  ('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb01', 'qr_open', 'tablet', 'hash4', 'https://example.com/bildung-fuer-alle', '2026-03-19T09:00:00Z'),
  ('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb01', 'qr_open', 'mobile', 'hash5', 'https://example.com/bildung-fuer-alle', '2026-03-20T11:45:00Z'),
  -- Bibliothek Jugendbereich
  ('q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb02', 'qr_open', 'mobile', 'hash6', 'https://example.com/bildung-fuer-alle', '2026-03-17T15:00:00Z'),
  ('q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb02', 'qr_open', 'mobile', 'hash7', 'https://example.com/bildung-fuer-alle', '2026-03-18T14:20:00Z'),
  ('q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'bfa-sb02', 'qr_open', 'desktop', 'hash8', 'https://example.com/bildung-fuer-alle', '2026-03-20T10:00:00Z'),
  -- Jugendzentrum
  ('q1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'bfa-jz01', 'qr_open', 'mobile', 'hash9', 'https://example.com/bildung-fuer-alle', '2026-03-18T13:00:00Z'),
  ('q1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'bfa-jz01', 'qr_open', 'mobile', 'hash10', 'https://example.com/bildung-fuer-alle', '2026-03-19T16:45:00Z'),
  -- ZLB Mitte
  ('q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'bfa-zl01', 'qr_open', 'mobile', 'hash11', 'https://example.com/bildung-fuer-alle', '2026-03-21T12:00:00Z'),
  ('q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'bfa-zl01', 'qr_open', 'mobile', 'hash12', 'https://example.com/bildung-fuer-alle', '2026-03-22T14:30:00Z'),
  ('q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'bfa-zl01', 'qr_open', 'tablet', 'hash13', 'https://example.com/bildung-fuer-alle', '2026-03-23T09:15:00Z'),
  ('q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'bfa-zl01', 'qr_open', 'mobile', 'hash14', 'https://example.com/bildung-fuer-alle', '2026-03-24T17:00:00Z'),
  -- Digitale Teilhabe
  ('q1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'dt-sb01', 'qr_open', 'mobile', 'hash15', 'https://example.com/digitale-teilhabe', '2026-04-02T11:00:00Z'),
  ('q1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'dt-sb01', 'qr_open', 'mobile', 'hash16', 'https://example.com/digitale-teilhabe', '2026-04-03T14:30:00Z'),
  -- Gropiusstadt
  ('q1000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', 'bfa-gp01', 'qr_open', 'mobile', 'hash17', 'https://example.com/bildung-fuer-alle', '2026-03-23T15:00:00Z'),
  ('q1000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', 'bfa-gp01', 'qr_open', 'mobile', 'hash18', 'https://example.com/bildung-fuer-alle', '2026-03-25T10:00:00Z'),
  -- Blocked scan (inactive code)
  ('q1000000-0000-0000-0000-000000000008', 'p1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', 'bfa-rm01', 'qr_blocked_inactive', 'mobile', 'hash19', NULL, '2026-03-27T12:00:00Z');

-- ============================================
-- SAMPLE PAGE EVENTS
-- ============================================
INSERT INTO public.page_events (event_type, qr_code_id, placement_id, campaign_id, session_id, page_url, created_at) VALUES
  ('landing_page_view', 'q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ses_abc1', 'https://example.com/bildung-fuer-alle', '2026-03-16T14:23:05Z'),
  ('cta_click', 'q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ses_abc1', 'https://example.com/bildung-fuer-alle', '2026-03-16T14:24:00Z'),
  ('form_start', 'q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ses_abc1', 'https://example.com/bildung-fuer-alle/anmelden', '2026-03-16T14:25:00Z'),
  ('form_submit', 'q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ses_abc1', 'https://example.com/bildung-fuer-alle/anmelden', '2026-03-16T14:27:00Z'),
  ('landing_page_view', 'q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'ses_abc2', 'https://example.com/bildung-fuer-alle', '2026-03-17T15:00:05Z'),
  ('cta_click', 'q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'ses_abc2', 'https://example.com/bildung-fuer-alle', '2026-03-17T15:01:00Z'),
  ('landing_page_view', 'q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'ses_abc3', 'https://example.com/bildung-fuer-alle', '2026-03-21T12:00:05Z'),
  ('cta_click', 'q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'ses_abc3', 'https://example.com/bildung-fuer-alle', '2026-03-21T12:01:00Z'),
  ('form_start', 'q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'ses_abc3', 'https://example.com/bildung-fuer-alle/anmelden', '2026-03-21T12:02:00Z'),
  ('form_submit', 'q1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'ses_abc3', 'https://example.com/bildung-fuer-alle/anmelden', '2026-03-21T12:04:00Z'),
  ('landing_page_view', 'q1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'ses_abc4', 'https://example.com/digitale-teilhabe', '2026-04-02T11:00:05Z'),
  ('cta_click', 'q1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'ses_abc4', 'https://example.com/digitale-teilhabe', '2026-04-02T11:01:00Z'),
  ('file_download', 'q1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'ses_abc4', 'https://example.com/digitale-teilhabe', '2026-04-02T11:02:00Z');

-- ============================================
-- QR STATUS HISTORY
-- ============================================
INSERT INTO public.qr_status_history (qr_code_id, action, note) VALUES
  ('q1000000-0000-0000-0000-000000000001', 'created', 'Erstellt für Bibliothek Spandau Eingang'),
  ('q1000000-0000-0000-0000-000000000002', 'created', 'Erstellt für Bibliothek Spandau Jugendbereich'),
  ('q1000000-0000-0000-0000-000000000003', 'created', 'Erstellt für Jugendzentrum Spandau'),
  ('q1000000-0000-0000-0000-000000000004', 'created', 'Erstellt für ZLB Mitte'),
  ('q1000000-0000-0000-0000-000000000005', 'created', 'Erstellt für Digitale Teilhabe Bibliothek'),
  ('q1000000-0000-0000-0000-000000000006', 'created', 'Erstellt für Kulturhaus Spandau'),
  ('q1000000-0000-0000-0000-000000000007', 'created', 'Erstellt für Gropiusstadt'),
  ('q1000000-0000-0000-0000-000000000008', 'created', 'Erstellt für Rathaus Mitte'),
  ('q1000000-0000-0000-0000-000000000008', 'deactivated', 'Poster wurde entfernt, QR-Code deaktiviert');
