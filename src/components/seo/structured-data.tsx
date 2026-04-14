type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

type StructuredDataProps = {
  id: string;
  data: { [key: string]: JsonLdValue };
};

// Inline JSON-LD must render in SSR'd HTML so crawlers see it without executing JS.
// Content is a static, developer-authored object — no untrusted input, so the
// dangerouslySetInnerHTML usage is safe (XSS requires attacker-controlled strings).
export function StructuredData({ id, data }: StructuredDataProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const softwareApplicationLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Spurig',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'DSGVO-konformes QR-Code-Tracking und Kampagnen-Analytics ohne Drittanbieter.',
  url: 'https://spurig.com',
  inLanguage: 'de-DE',
  offers: [
    {
      '@type': 'Offer',
      name: 'Spurig Monatsabo',
      price: '5.99',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '5.99',
        priceCurrency: 'EUR',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitCode: 'MON',
        },
      },
      availability: 'https://schema.org/InStock',
      url: 'https://spurig.com/pricing',
    },
    {
      '@type': 'Offer',
      name: 'Spurig Jahresabo',
      price: '59.88',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '4.99',
        priceCurrency: 'EUR',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitCode: 'MON',
        },
      },
      availability: 'https://schema.org/InStock',
      url: 'https://spurig.com/pricing',
    },
  ],
  publisher: {
    '@type': 'Organization',
    name: 'Spurig',
    url: 'https://spurig.com',
  },
};

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Spurig',
  url: 'https://spurig.com',
  logo: 'https://spurig.com/icon.png',
  inLanguage: 'de-DE',
  sameAs: [],
};
