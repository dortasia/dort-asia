import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getURL = (req?: Request | string) => {
  let url: string | undefined;

  if (req && typeof req === 'object' && 'url' in req) {
    try {
      url = new URL(req.url).origin;
    } catch {
      // Fallback if req.url is relative or invalid
    }
  } else if (typeof req === 'string' && req.startsWith('http')) {
    url = req;
  }

  if (!url && typeof window !== 'undefined') {
    url = window.location.origin;
  }

  if (!url) {
    // If in Vercel preview (beta), prioritize the preview URL
    if (process?.env?.NEXT_PUBLIC_VERCEL_ENV === 'preview' && process?.env?.NEXT_PUBLIC_VERCEL_URL) {
      url = process.env.NEXT_PUBLIC_VERCEL_URL;
    }
    // Otherwise, use the explicitly set SITE_URL (production)
    else if (process?.env?.NEXT_PUBLIC_SITE_URL) {
      url = process.env.NEXT_PUBLIC_SITE_URL;
    }
    // Fallback to VERCEL_URL if SITE_URL is not set
    else if (process?.env?.NEXT_PUBLIC_VERCEL_URL) {
      url = process.env.NEXT_PUBLIC_VERCEL_URL;
    }
    // Default to local development
    else {
      url = 'http://localhost:3001';
    }
  }

  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

  return url;
};
