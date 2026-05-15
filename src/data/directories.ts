/**
 * SaaS-Directory-Submission-Helper.
 *
 * 15+ Directories die fuer DACH-B2B-SaaS sinnvoll sind. Pro Eintrag:
 * Submit-URL + Aufwand + Authority + Tipp.
 */

export type Directory = {
  name: string;
  url: string;
  submitUrl: string;
  authority: 'sehr-hoch' | 'hoch' | 'mittel';
  effort: '5min' | '15min' | '30min+';
  category: 'general' | 'saas' | 'german' | 'launch' | 'alternative';
  tip: string;
  free: boolean;
};

export const DIRECTORIES: Directory[] = [
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com',
    submitUrl: 'https://www.producthunt.com/posts/new',
    authority: 'sehr-hoch',
    effort: '30min+',
    category: 'launch',
    tip: 'Plane Launch-Tag (Di-Do best). Brauchst Hunter + 5 Tag-1-Upvotes. Erfolg = 200-2000 Visits in 24h.',
    free: true,
  },
  {
    name: 'AlternativeTo',
    url: 'https://alternativeto.net',
    submitUrl: 'https://alternativeto.net/software/edit/',
    authority: 'sehr-hoch',
    effort: '15min',
    category: 'alternative',
    tip: 'Listing als "Alternative zu Bitly" einreichen. DR 86, evergreen-SEO-Traffic.',
    free: true,
  },
  {
    name: 'SaaSHub',
    url: 'https://www.saashub.com',
    submitUrl: 'https://www.saashub.com/submit-product',
    authority: 'hoch',
    effort: '15min',
    category: 'saas',
    tip: 'Free-Listing + bezahlte Boost-Option. Free reicht fuer SEO-Backlink. DR 60+.',
    free: true,
  },
  {
    name: 'G2',
    url: 'https://www.g2.com',
    submitUrl: 'https://www.g2.com/products/new',
    authority: 'sehr-hoch',
    effort: '30min+',
    category: 'saas',
    tip: 'Schwer ohne 5+ Reviews. Plan: nach 5 Paid-Kunden bei jedem nach Review fragen.',
    free: true,
  },
  {
    name: 'Capterra',
    url: 'https://www.capterra.com',
    submitUrl: 'https://www.capterra.com/vendors/sign-up',
    authority: 'sehr-hoch',
    effort: '15min',
    category: 'saas',
    tip: 'Schwester von G2. Listing kostenlos, Boost-Anzeigen kostenpflichtig.',
    free: true,
  },
  {
    name: 'GetApp',
    url: 'https://www.getapp.com',
    submitUrl: 'https://www.getapp.com/vendors/sign-up',
    authority: 'hoch',
    effort: '15min',
    category: 'saas',
    tip: 'Gleiche Mutter wie Capterra (Gartner). 1 Listing -> 3 Plattformen.',
    free: true,
  },
  {
    name: 'BetaList',
    url: 'https://betalist.com',
    submitUrl: 'https://betalist.com/submit',
    authority: 'mittel',
    effort: '15min',
    category: 'launch',
    tip: 'Fuer "Beta/Early-Access" Phase. 5-10 € Gebuehr, dafuer Newsletter-Reach 50k.',
    free: false,
  },
  {
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com',
    submitUrl: 'https://www.indiehackers.com/products/new',
    authority: 'hoch',
    effort: '15min',
    category: 'launch',
    tip: 'Hoechste Conversion fuer Indie-Founder-Audience. Build-in-Public posts boosten.',
    free: true,
  },
  {
    name: 'AppSumo',
    url: 'https://appsumo.com',
    submitUrl: 'https://appsumo.com/partners/sell/',
    authority: 'sehr-hoch',
    effort: '30min+',
    category: 'launch',
    tip: 'Lifetime-Deal Listing. Bringt 500-5000 Kunden in 30 Tagen. Aber: Quality-Curation strict.',
    free: true,
  },
  {
    name: 'Tools.so',
    url: 'https://tools.so',
    submitUrl: 'https://tools.so/submit',
    authority: 'mittel',
    effort: '5min',
    category: 'saas',
    tip: 'Newer Directory, schnelles Review. Free-Listing + Premium-Boost.',
    free: true,
  },
  {
    name: 'StartupBase',
    url: 'https://startupbase.io',
    submitUrl: 'https://startupbase.io/submit',
    authority: 'mittel',
    effort: '5min',
    category: 'launch',
    tip: 'Schneller Eintrag, DR 50. Gut fuer Backlink + Launch-Hype.',
    free: true,
  },
  {
    name: 'SaaSWorthy',
    url: 'https://www.saasworthy.com',
    submitUrl: 'https://www.saasworthy.com/submit-product',
    authority: 'mittel',
    effort: '15min',
    category: 'saas',
    tip: 'Indisches Directory, DR 55, SEO-Backlink-Wert.',
    free: true,
  },
  {
    name: 'gruenderszene.de Tool-Verzeichnis',
    url: 'https://www.gruenderszene.de',
    submitUrl: 'https://www.gruenderszene.de/kontakt',
    authority: 'hoch',
    effort: '30min+',
    category: 'german',
    tip: 'Per Email anfragen. Wenn akzeptiert: DACH-Reach + DE-Authority-Backlink.',
    free: true,
  },
  {
    name: 'Deutsche Startups',
    url: 'https://www.deutsche-startups.de',
    submitUrl: 'https://www.deutsche-startups.de/kontakt/',
    authority: 'hoch',
    effort: '30min+',
    category: 'german',
    tip: 'Pitch per Email. Akzeptanz = grosse DACH-Reach + Backlink von DR 65.',
    free: true,
  },
  {
    name: 'Tekpon',
    url: 'https://tekpon.com',
    submitUrl: 'https://tekpon.com/submit-software',
    authority: 'mittel',
    effort: '15min',
    category: 'saas',
    tip: 'Mid-Tier Directory, DR 50, schneller Review.',
    free: true,
  },
  {
    name: 'Slant',
    url: 'https://www.slant.co',
    submitUrl: 'https://www.slant.co/products/create',
    authority: 'mittel',
    effort: '15min',
    category: 'alternative',
    tip: 'Vergleichs-Plattform. Listings bei Topics wie "Best URL Shortener" sinnvoll.',
    free: true,
  },
];

/**
 * Templates fuer Listing-Beschreibungen pro Laenge.
 * User kopiert je nach Anforderung der Directory.
 */
export const LISTING_TEMPLATES = {
  short_60: 'DSGVO-konformes QR-Code & Kurzlink-Tracking aus Deutschland. EU-Hosting in Frankfurt.',
  medium_160:
    'Spurig ist ein DSGVO-konformes QR-Code & Kurzlink-Tracking-Tool fuer DACH-Marketing-Teams. EU-Hosting in Frankfurt, ohne US-Cloud, ohne Cookie-Banner. Bitly-Alternative fuer Print- und Online-Marketing-Attribution.',
  long_500:
    'Spurig ist ein DSGVO-konformes QR-Code- und Kurzlink-Tracking-Tool, gebaut in Deutschland fuer DACH-Marketing-Teams. Im Gegensatz zu US-Anbietern wie Bitly speichern wir alle Daten auf EU-Servern in Frankfurt — kein CLOUD Act, kein Schrems-II-Risiko, kein Cookie-Banner-Pflicht. Marketing-Teams nutzen Spurig, um pro Plakat-Standort, Flyer-Aktion oder Online-Kampagne zu messen welche Werbung wirklich Conversions bringt. Features: QR-Code Generation mit Custom-Domain, Click-Tracking, Geo + Geraet, A/B-Tests pro Standort, CSV-Export, REST-API. Ab 8,99 €/Monat. 14 Tage gratis testen.',
  tags: ['QR-Code', 'URL Shortener', 'Marketing Analytics', 'DSGVO', 'EU Hosting', 'Bitly Alternative', 'Print Marketing', 'Attribution'],
  oneLiners: [
    'Bitly-Alternative aus Deutschland. DSGVO-konform.',
    'QR-Code-Tracking ohne US-Cloud.',
    'Misst welcher Plakat-Standort wirklich Kunden bringt.',
    'Frankfurt-Hosting statt AWS US.',
  ],
};
