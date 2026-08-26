import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getURL = (req?: Request | string) => {
  let url: string | undefined;

  // 1. If a Request object or NextRequest is passed (e.g. in Route Handlers)
  if (req && typeof req === 'object' && 'url' in req) {
    try {
      const forwardedHost = req.headers?.get?.('x-forwarded-host');
      const host = forwardedHost || req.headers?.get?.('host');
      if (host) {
        const proto = req.headers?.get?.('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
        url = `${proto}://${host}`;
      } else {
        url = new URL(req.url).origin;
      }
    } catch {
      // Fallback if req.url is relative or invalid
    }
  } else if (typeof req === 'string' && req.startsWith('http')) {
    url = req;
  }

  // 2. Client-side in the browser
  if (!url && typeof window !== 'undefined') {
    url = window.location.origin;
  }

  // 3. Server-side environment variables fallback (canonical site URLs)
  if (!url) {
    if (process?.env?.NEXT_PUBLIC_SITE_URL) {
      url = process.env.NEXT_PUBLIC_SITE_URL;
    } else if (process?.env?.NEXT_BETA_SITE_URL) {
      url = process.env.NEXT_BETA_SITE_URL;
    } else if (process?.env?.NEXT_PUBLIC_APP_URL) {
      url = process.env.NEXT_PUBLIC_APP_URL;
    }
  }

  // 4. Final fallback for local development
  if (!url) {
    url = 'http://localhost:3001';
  }

  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

  return url;
};

