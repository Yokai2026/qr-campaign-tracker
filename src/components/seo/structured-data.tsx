import Script from 'next/script';

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

export function StructuredData({ id, data }: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="beforeInteractive"
    >
      {JSON.stringify(data)}
    </Script>
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
