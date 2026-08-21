import { Metadata } from 'next';
import { getSiteUrl } from './urls';

const siteUrl = getSiteUrl();

export const defaultSEO = {
  title: 'Dort Asia | Bespoke Software & Tech Talent',
  description:
    'Bespoke software solutions, enterprise SaaS products, and specialized tech talent. Building modern digital infrastructure for businesses worldwide.',
  openGraph: {
    type: 'website',
    locale: 'en_SG',
    url: siteUrl,
    siteName: 'Dort Asia',
    images: [
      {
        url: `${siteUrl}/img_assets/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Dort Asia | Bespoke Software & Tech Talent',
      },
    ],
  },
  twitter: {
    handle: '@DortAsia',
    site: '@DortAsia',
    cardType: 'summary_large_image',
  },
};

/**
 * Construct Metadata for any page, overriding the defaults as necessary.
 */
export function constructMetadata({
  title,
  description,
  image,
  icons = '/favicon.ico',
  noIndex = false,
  alternates,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  alternates?: Metadata['alternates'];
} = {}): Metadata {
  return {
    title: {
      default: defaultSEO.title,
      template: '%s | Dort Asia',
    },
    ...(title && { title }),
    description: description || defaultSEO.description,
    openGraph: {
      ...defaultSEO.openGraph,
      title: title ? `${title} | Dort Asia` : defaultSEO.title,
      description: description || defaultSEO.description,
      images: [
        {
          url: image || defaultSEO.openGraph.images[0].url,
          width: 1200,
          height: 630,
          alt: title || defaultSEO.title,
        },
      ],
    },
    twitter: {
      card: defaultSEO.twitter.cardType as 'summary_large_image',
      title: title ? `${title} | Dort Asia` : defaultSEO.title,
      description: description || defaultSEO.description,
      creator: defaultSEO.twitter.handle,
      images: [image || defaultSEO.openGraph.images[0].url],
    },
    icons,
    metadataBase: new URL(siteUrl),
    alternates,
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
