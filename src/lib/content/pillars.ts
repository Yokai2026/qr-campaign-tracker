/**
 * Content-Pillars fuer Spurig.
 *
 * 5 strategische Themen-Cluster die das ICP (Marketing-Manager, Compliance,
 * Performance-Marketer, Founder) abdecken. Pro Pillar werden 15+ Ideen
 * generiert die zu Blog-Posts werden.
 */

export type ContentCluster =
  | 'dsgvo_privacy'
  | 'offline_roi'
  | 'qr_practices'
  | 'attribution'
  | 'behind_scenes';

export const CLUSTERS: ContentCluster[] = [
  'dsgvo_privacy',
  'offline_roi',
  'qr_practices',
  'attribution',
  'behind_scenes',
];

export const CLUSTER_LABEL: Record<ContentCluster, string> = {
  dsgvo_privacy: 'DSGVO & Privacy',
  offline_roi: 'Offline-Marketing ROI',
  qr_practices: 'QR-Code Best-Practices',
  attribution: 'Marketing-Attribution',
  behind_scenes: 'Behind-the-Scenes',
};

export const CLUSTER_DESCRIPTION: Record<ContentCluster, string> = {
  dsgvo_privacy:
    'Themen rund um EU-Datenschutz, Schrems II, US-Cloud-Anbieter, Standardvertragsklauseln, Bitly/Konkurrenz-Alternativen, Compliance-Audits, AVV-Vertraege, Datensparsamkeit.',
  offline_roi:
    'Print-Marketing-ROI, Plakat-Tracking, Flyer-Verteilaktionen, Standort-A/B-Tests, Mailing-Conversion, Offline-Online-Bridge, Print-Budgets vs Digital.',
  qr_practices:
    'QR-Code-Design (Logo, Farben), Mindestgroessen, Error-Correction-Level, Scanner-Verhalten verschiedener Smartphones, Platzierungsstrategien, Print-Druck-Qualitaet, Anti-Patterns.',
  attribution:
    'Multi-Touch-Attribution, UTM-Strategien, Last-Click vs Multi-Touch, Cross-Channel-Tracking, Cookie-less Tracking, Conversion-Funnels, ROAS/CAC Messung.',
  behind_scenes:
    'Indie-Hacker / Build-in-Public Inhalte: Erste Kunden, Pricing-Entscheidungen, Stack-Wahl, gescheiterte Experimente, Founder-Reflexionen, Lessons aus dem Aufbau eines DACH-SaaS.',
};
