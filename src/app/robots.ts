import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/settings', '/api/', '/r/', '/campaigns', '/placements', '/qr-codes', '/analytics', '/links', '/locations', '/pitch'],
      },
    ],
    sitemap: 'https://spurig.com/sitemap.xml',
  };
}
