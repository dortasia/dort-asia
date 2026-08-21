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

  if (!url) {
    url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  }

  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

  return url;
};
