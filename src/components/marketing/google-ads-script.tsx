import Script from 'next/script';

/**
 * Loader fuer gtag.js (Google Tag, das auch Google-Ads-Conversions handhabt).
 * Rendert nichts wenn NEXT_PUBLIC_GOOGLE_ADS_ID fehlt — so dass Dev/Preview
 * ohne Setup laufen.
 *
 * Einbau im Root-Layout (siehe layout.tsx). Strategy='afterInteractive' damit
 * der Tag den initialen Render nicht blockt.
 */
export function GoogleAdsScript() {
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (!adsId) return null;

  return (
    <>
      <Script
        id="gtag-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${adsId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${adsId}');
        `}
      </Script>
    </>
  );
}
