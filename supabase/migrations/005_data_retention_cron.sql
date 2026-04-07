-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Function: delete tracking events older than 24 months
CREATE OR REPLACE FUNCTION public.cleanup_old_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff timestamptz := now() - interval '24 months';
  deleted_redirects bigint;
  deleted_pages bigint;
BEGIN
  DELETE FROM public.redirect_events WHERE created_at < cutoff;
  GET DIAGNOSTICS deleted_redirects = ROW_COUNT;

  DELETE FROM public.page_events WHERE created_at < cutoff;
  GET DIAGNOSTICS deleted_pages = ROW_COUNT;

  RAISE LOG 'Data retention cleanup: deleted % redirect_events, % page_events older than %',
    deleted_redirects, deleted_pages, cutoff;
END;
$$;

-- Schedule: run daily at 03:00 UTC
SELECT cron.schedule(
  'cleanup-old-tracking-events',
  '0 3 * * *',
  $$SELECT public.cleanup_old_events()$$
);
