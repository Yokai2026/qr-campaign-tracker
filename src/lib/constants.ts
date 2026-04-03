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
  qr_blocked_inactive: 'Blockiert (inaktiv)',
  qr_expired: 'Abgelaufen',
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
