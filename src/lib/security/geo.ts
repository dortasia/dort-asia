import { headers } from "next/headers";
import { isLocalOrPrivateIp } from "./ip";

export interface GeoLocation {
  ipAddress: string | null;
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
  region: string | null;
  isLocal: boolean;
}

export { isLocalOrPrivateIp };

/**
 * Converts a standard 2-letter ISO country code to its full English name.
 */
export function getCountryName(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  try {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(countryCode.trim().toUpperCase()) || countryCode;
  } catch {
    return countryCode;
  }
}

/**
 * Extracts IP address and geographic location from trusted reverse proxy headers.
 * Supports Vercel, Cloudflare, and standard production edge proxies.
 */
export async function getGeoLocation(): Promise<GeoLocation> {
  const headersList = await headers();

  // Extract client IP with trusted proxy precedence:
  // 1. Vercel edge IP
  // 2. Cloudflare connecting IP
  // 3. X-Real-IP
  // 4. Standard X-Forwarded-For (take the first client IP in chain)
  let ipAddress = 
    headersList.get("x-vercel-forwarded-for") ||
    headersList.get("cf-connecting-ip") ||
    headersList.get("x-real-ip") ||
    headersList.get("x-forwarded-for");

  if (ipAddress && ipAddress.includes(",")) {
    ipAddress = ipAddress.split(",")[0].trim();
  }

  ipAddress = ipAddress?.trim() || null;
  const isLocal = isLocalOrPrivateIp(ipAddress);

  // If running in localhost / local development / private LAN, return clear labels
  if (isLocal) {
    return {
      ipAddress: ipAddress || "127.0.0.1",
      countryCode: null,
      countryName: "Local Development",
      city: null,
      region: null,
      isLocal: true,
    };
  }

  // Extract edge-provided geolocation (Vercel & Cloudflare headers)
  let rawCountry = headersList.get("x-vercel-ip-country") || headersList.get("cf-ipcountry") || null;
  const city = headersList.get("x-vercel-ip-city") || headersList.get("cf-ipcity") || null;
  const region = headersList.get("x-vercel-ip-country-region") || headersList.get("cf-region") || null;

  let countryCode: string | null = null;
  if (rawCountry) {
    const trimmed = rawCountry.trim().toUpperCase();
    if (trimmed.length === 2 && /^[A-Z]{2}$/.test(trimmed)) {
      countryCode = trimmed;
    }
  }

  const countryName = countryCode ? getCountryName(countryCode) : null;

  return {
    ipAddress: ipAddress || null,
    countryCode,
    countryName,
    city: city ? decodeURIComponent(city) : null,
    region,
    isLocal: false,
  };
}
