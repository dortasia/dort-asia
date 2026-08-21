import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/config/urls';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const routes = [
    '',
    '/services',
    '/about',
    '/pricing',
    '/work-with-us',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
