/**
 * DNS-Provider-Erkennung + provider-spezifische Setup-Guides.
 *
 * Nutzung:
 *   const ns = await dns.resolveNs(apex);
 *   const key = matchProviderFromNs(ns);  // 'ionos' | 'cloudflare' | ...
 *   const guide = PROVIDERS[key];          // UI-Daten
 *
 * Die Guides sind bewusst kurz gehalten — sie ergänzen den universellen
 * TXT/CNAME-Block im UI, ersetzen ihn nicht.
 */

export type DnsProviderKey =
  | 'ionos'
  | 'strato'
  | 'inwx'
  | 'cloudflare'
  | 'namecheap'
  | 'godaddy'
  | 'hostinger'
  | 'all-inkl'
  | 'checkdomain'
  | 'united-domains'
  | 'hetzner'
  | 'google'
  | 'aws'
  | 'unknown';

export type DnsProviderInfo = {
  key: DnsProviderKey;
  label: string;
  /** Direktlink zum DNS-Management-Bereich, falls möglich — sonst Dashboard-Root */
  dashboardUrl: string;
  /** 2–4 deutsche Schritt-für-Schritt-Hinweise */
  steps: string[];
  /**
   * Wie der Provider den Hostnamen im DNS-Formular erwartet:
   *  - 'subdomain-only': nur `_spurig-verify.www` (Domain wird automatisch ergänzt)
   *  - 'fqdn': voller Name `_spurig-verify.www.pokishi.com` (mit Domain)
   */
  nameFormat: 'subdomain-only' | 'fqdn';
  /** Sucht man bei dem Provider nach "DNS", "Nameserver" oder "Zonen"? */
  menuHint?: string;
};

export const PROVIDERS: Record<DnsProviderKey, DnsProviderInfo> = {
  ionos: {
    key: 'ionos',
    label: 'IONOS (1&1)',
    dashboardUrl: 'https://login.ionos.de/',
    nameFormat: 'subdomain-only',
    menuHint: 'Domains & SSL → Domain → DNS',
    steps: [
      'Bei IONOS einloggen → "Domains & SSL" → betroffene Domain auswählen → "DNS".',
      'Für den TXT-Record nur den Teil vor der Domain eintragen (z.B. "_spurig-verify.www"), IONOS ergänzt die Domain automatisch.',
      'Gleiches gilt für den CNAME — nur Subdomain-Teil eintragen, nicht die komplette Domain.',
      'Änderungen sind meist in 1–5 Minuten aktiv.',
    ],
  },
  strato: {
    key: 'strato',
    label: 'Strato',
    dashboardUrl: 'https://www.strato.de/apps/CustomerService',
    nameFormat: 'subdomain-only',
    menuHint: 'Domains → Domainverwaltung → DNS-Verwaltung',
    steps: [
      'Kundenbereich → "Domains" → Domain auswählen → "DNS-Verwaltung".',
      'TXT-Record: Beim Hostnamen nur den Präfix (z.B. "_spurig-verify.www") eintragen.',
      'CNAME: Hostname ist nur die Subdomain (z.B. "www"), Ziel ist "cname.vercel-dns.com".',
      'Strato aktiviert DNS-Änderungen innerhalb weniger Minuten.',
    ],
  },
  inwx: {
    key: 'inwx',
    label: 'INWX',
    dashboardUrl: 'https://www.inwx.de/de/customer',
    nameFormat: 'subdomain-only',
    menuHint: 'Domains → Nameserver → DNS',
    steps: [
      'Kundenlogin → "Domains" → Domain öffnen → "Nameserver" → "DNS".',
      '"Neuer Eintrag" → Typ "TXT", Host "_spurig-verify.www", Wert = Token (siehe unten).',
      'Zweiter Eintrag: Typ "CNAME", Host "www", Wert "cname.vercel-dns.com".',
      'INWX publiziert DNS-Änderungen meist innerhalb von 60 Sekunden.',
    ],
  },
  cloudflare: {
    key: 'cloudflare',
    label: 'Cloudflare',
    dashboardUrl: 'https://dash.cloudflare.com/',
    nameFormat: 'subdomain-only',
    menuHint: 'Domain auswählen → DNS → Records',
    steps: [
      'Cloudflare-Dashboard → Domain auswählen → "DNS" → "Records".',
      'TXT-Record: Name "_spurig-verify.www", Content = Token. Proxy-Status MUSS auf "DNS only" (graue Wolke) stehen.',
      'CNAME: Name "www", Target "cname.vercel-dns.com", Proxy-Status ebenfalls "DNS only" (graue Wolke, KEIN orangener Cloudflare-Proxy).',
      'Cloudflare aktualisiert DNS sofort (keine Wartezeit).',
    ],
  },
  namecheap: {
    key: 'namecheap',
    label: 'Namecheap',
    dashboardUrl: 'https://ap.www.namecheap.com/Domains/DomainControlPanel',
    nameFormat: 'subdomain-only',
    menuHint: 'Domain List → Manage → Advanced DNS',
    steps: [
      'Namecheap-Account → "Domain List" → Domain "Manage" → Tab "Advanced DNS".',
      'Add New Record → Typ "TXT Record", Host "_spurig-verify.www", Value = Token.',
      'Weiterer Record: "CNAME Record", Host "www", Target "cname.vercel-dns.com".',
      'TTL auf "Automatic" lassen, Änderungen binnen 5–30 Minuten aktiv.',
    ],
  },
  godaddy: {
    key: 'godaddy',
    label: 'GoDaddy',
    dashboardUrl: 'https://dcc.godaddy.com/control/portfolio',
    nameFormat: 'subdomain-only',
    menuHint: 'Meine Produkte → Domain → DNS',
    steps: [
      'GoDaddy → "Meine Produkte" → Domain → "DNS" → "Einträge hinzufügen".',
      'TXT-Record: Name "_spurig-verify.www", Wert = Token.',
      'CNAME: Name "www", Wert "cname.vercel-dns.com".',
      'GoDaddy benötigt üblich 10–30 Minuten bis Änderungen greifen.',
    ],
  },
  hostinger: {
    key: 'hostinger',
    label: 'Hostinger',
    dashboardUrl: 'https://hpanel.hostinger.com/',
    nameFormat: 'subdomain-only',
    menuHint: 'Domains → DNS/Nameserver',
    steps: [
      'hPanel → "Domains" → Domain → "DNS/Nameserver" → "DNS-Zonen".',
      'Neuen TXT-Eintrag: Name "_spurig-verify.www", TXT-Wert = Token.',
      'Neuen CNAME-Eintrag: Name "www", Ziel "cname.vercel-dns.com".',
      'Änderungen sind typisch in 5 Minuten aktiv.',
    ],
  },
  'all-inkl': {
    key: 'all-inkl',
    label: 'ALL-INKL',
    dashboardUrl: 'https://kas.all-inkl.com/',
    nameFormat: 'fqdn',
    menuHint: 'KAS → Domain → DNS-Einstellungen',
    steps: [
      'KAS-Login → "Domain" → betroffene Domain → "DNS-Einstellungen".',
      'Neuer TXT-Record: vollständiger Name "_spurig-verify.www.deine-domain.de", Wert = Token.',
      'Neuer CNAME: vollständiger Name "www.deine-domain.de", Ziel "cname.vercel-dns.com".',
      'DNS-Propagation bei ALL-INKL meist unter 10 Minuten.',
    ],
  },
  checkdomain: {
    key: 'checkdomain',
    label: 'Checkdomain',
    dashboardUrl: 'https://www.checkdomain.de/mein-checkdomain/',
    nameFormat: 'subdomain-only',
    menuHint: 'Domains → Nameserver/DNS',
    steps: [
      'Kundenbereich → "Domains" → Domain → "Nameserver/DNS".',
      'TXT-Record: Hostname "_spurig-verify.www", Inhalt = Token.',
      'CNAME-Record: Hostname "www", Ziel "cname.vercel-dns.com".',
      'Änderungen erfordern "Speichern" — aktiv binnen 5–15 Minuten.',
    ],
  },
  'united-domains': {
    key: 'united-domains',
    label: 'United Domains',
    dashboardUrl: 'https://www.united-domains.de/login/',
    nameFormat: 'subdomain-only',
    menuHint: 'Domainportfolio → DNS',
    steps: [
      'United Domains → Domainportfolio → Domain → "DNS" oder "Erweiterte DNS-Einstellungen".',
      'TXT-Record: Hostname "_spurig-verify.www", Wert = Token.',
      'CNAME: Hostname "www", Ziel "cname.vercel-dns.com".',
      'Propagation typisch innerhalb von 15 Minuten.',
    ],
  },
  hetzner: {
    key: 'hetzner',
    label: 'Hetzner DNS',
    dashboardUrl: 'https://dns.hetzner.com/',
    nameFormat: 'subdomain-only',
    menuHint: 'DNS Console → Zone',
    steps: [
      'Hetzner DNS Console → Zone der Domain öffnen.',
      '"Add Record" → Typ "TXT", Name "_spurig-verify.www", Value = Token.',
      '"Add Record" → Typ "CNAME", Name "www", Value "cname.vercel-dns.com.".',
      'Hetzner publiziert sofort, TTL typisch 1 Minute.',
    ],
  },
  google: {
    key: 'google',
    label: 'Google Domains / Cloud DNS',
    dashboardUrl: 'https://domains.google.com/',
    nameFormat: 'subdomain-only',
    menuHint: 'DNS → Resource records',
    steps: [
      'Google Domains bzw. Squarespace Domains (Nachfolger) → Domain → DNS.',
      'Resource Record hinzufügen: Typ "TXT", Host "_spurig-verify.www", Daten = Token.',
      'Weiterer Record: Typ "CNAME", Host "www", Daten "cname.vercel-dns.com".',
      'Änderungen propagieren innerhalb weniger Minuten.',
    ],
  },
  aws: {
    key: 'aws',
    label: 'AWS Route 53',
    dashboardUrl: 'https://console.aws.amazon.com/route53/',
    nameFormat: 'fqdn',
    menuHint: 'Hosted zones → <deine-domain>',
    steps: [
      'Route 53 Console → "Hosted zones" → Zone der Domain öffnen.',
      '"Create record" → Typ "TXT", Name "_spurig-verify.www", Value = Token in Anführungszeichen.',
      '"Create record" → Typ "CNAME", Name "www", Value "cname.vercel-dns.com".',
      'Route 53 publiziert DNS sofort global.',
    ],
  },
  unknown: {
    key: 'unknown',
    label: 'Dein DNS-Anbieter',
    dashboardUrl: '',
    nameFormat: 'fqdn',
    steps: [
      'Logge dich bei deinem Domain-Anbieter ein und suche die DNS- oder Nameserver-Einstellungen.',
      'Lege die beiden unten angezeigten Records (TXT und CNAME) nach der Anleitung deines Anbieters an.',
      'Manche Anbieter wollen nur den Subdomain-Teil (z.B. "_spurig-verify.www"), andere den vollen Namen.',
      'Nach dem Speichern kann es 5–30 Minuten dauern, bis DNS-Änderungen weltweit sichtbar sind.',
    ],
  },
};

/**
 * NS-Patterns → Provider-Key. Match gegen irgendeinen der Nameserver der Domain.
 * Reihenfolge egal — jeder Pattern prüft genau einen Provider.
 */
const NS_PATTERNS: Array<{ pattern: RegExp; key: DnsProviderKey }> = [
  { pattern: /\.ui-dns\.(com|de|org|biz)$/i, key: 'ionos' },
  { pattern: /\.strato(server)?\.(de|com|net)$/i, key: 'strato' },
  { pattern: /\.ns\.inwx\.(de|com|eu|net)$/i, key: 'inwx' },
  { pattern: /\.cloudflare\.com$/i, key: 'cloudflare' },
  { pattern: /\.registrar-servers\.com$/i, key: 'namecheap' },
  { pattern: /\.domaincontrol\.com$/i, key: 'godaddy' },
  { pattern: /\.dns-parking\.com$/i, key: 'hostinger' },
  { pattern: /\.hostinger\.(com|es|de|io)$/i, key: 'hostinger' },
  { pattern: /\.kasserver\.com$/i, key: 'all-inkl' },
  { pattern: /\.checkdomain\.de$/i, key: 'checkdomain' },
  { pattern: /\.udag\.(de|org|net)$/i, key: 'united-domains' },
  { pattern: /\.hetzner\.(com|de)$/i, key: 'hetzner' },
  { pattern: /\.googledomains\.com$/i, key: 'google' },
  { pattern: /\.google\.com$/i, key: 'google' },
  { pattern: /\.awsdns-\d+\.(com|net|org|co\.uk)$/i, key: 'aws' },
];

export function matchProviderFromNs(nsHosts: string[]): DnsProviderKey {
  for (const ns of nsHosts) {
    const normalized = ns.toLowerCase().replace(/\.$/, '');
    for (const { pattern, key } of NS_PATTERNS) {
      if (pattern.test(normalized)) return key;
    }
  }
  return 'unknown';
}

/**
 * Extrahiert die Apex-Domain aus einem Hostnamen. Einfache Heuristik für die
 * häufigsten TLDs — für .co.uk/.com.au greift die Sonderbehandlung.
 *
 *   www.pokishi.com → pokishi.com
 *   go.shop.co.uk   → shop.co.uk
 *   pokishi.com     → pokishi.com
 */
export function extractApex(host: string): string {
  const parts = host.toLowerCase().replace(/\.$/, '').split('.');
  if (parts.length < 2) return host.toLowerCase();

  const twoPartSlds = new Set([
    'co.uk',
    'co.jp',
    'co.nz',
    'co.za',
    'com.au',
    'com.br',
    'com.mx',
    'com.tr',
    'org.uk',
    'ne.jp',
    'or.jp',
  ]);

  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join('.');
    if (twoPartSlds.has(lastTwo)) {
      return parts.slice(-3).join('.');
    }
  }
  return parts.slice(-2).join('.');
}
