import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/config/urls';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/dashboard/', '/api/', '/oauth/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
