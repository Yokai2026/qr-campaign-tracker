/**
 * Returns the app base URL, works on Vercel, local dev, and custom domains.
 * Server: NEXT_PUBLIC_APP_URL > VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL > localhost
 * Client: NEXT_PUBLIC_APP_URL > window.location.origin
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
};

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  library: 'Bibliothek',
  school: 'Schule',
  youth_center: 'Jugendzentrum',
  community_center: 'Gemeindezentrum',
  public_board: 'Aushang / Board',
  event_space: 'Veranstaltungsort',
  office: 'Büro',
  shop: 'Geschäft',
  other: 'Sonstiges',
};

export const PLACEMENT_TYPE_LABELS: Record<string, string> = {
  poster: 'Poster',
  flyer: 'Flyer',
  sticker: 'Aufkleber',
  banner: 'Banner',
  digital_screen: 'Digital-Screen',
  handout: 'Handout',
  other: 'Sonstiges',
};

export const PLACEMENT_STATUS_LABELS: Record<string, string> = {
  planned: 'Geplant',
  installed: 'Installiert',
  active: 'Aktiv',
  paused: 'Pausiert',
  removed: 'Entfernt',
  archived: 'Archiviert',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  qr_open: 'QR Scan',
  qr_blocked_inactive: 'QR blockiert (inaktiv)',
  qr_expired: 'QR abgelaufen',
  link_open: 'Link-Klick',
  link_blocked_inactive: 'Link blockiert (inaktiv)',
  link_expired: 'Link abgelaufen',
  landing_page_view: 'Seitenaufruf',
  cta_click: 'CTA Klick',
  form_start: 'Formular gestartet',
  form_submit: 'Formular abgeschickt',
  file_download: 'Download',
};

export const QR_ACTION_LABELS: Record<string, string> = {
  created: 'Erstellt',
  activated: 'Aktiviert',
  deactivated: 'Deaktiviert',
  paused: 'Pausiert',
  expired: 'Abgelaufen',
  replaced: 'Ersetzt',
  target_changed: 'Ziel geändert',
  note_added: 'Notiz hinzugefügt',
  archived: 'Archiviert',
  downloaded: 'Heruntergeladen',
};
