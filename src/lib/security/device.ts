import { cookies, headers } from "next/headers";
import { UAParser } from "ua-parser-js";
import { randomUUID } from "crypto";

export const DEVICE_COOKIE_NAME = "dort_device_id";

/**
 * Retrieves the trusted device ID from the cookie, generating and setting a new one if missing.
 * This should only be called from server environments (Server Components, Route Handlers, Server Actions).
 */
export async function getDeviceIdentity(): Promise<string> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(DEVICE_COOKIE_NAME)?.value;

  if (existingId) {
    return existingId;
  }

  // Generate a new secure UUID for this device
  const newDeviceId = randomUUID();

  // Set it as an HTTP-only persistent cookie
  cookieStore.set({
    name: DEVICE_COOKIE_NAME,
    value: newDeviceId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return newDeviceId;
}

export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: string;
  deviceName: string;
  rawString: string;
}

/**
 * Normalizes the OS name to avoid false specificity when the User-Agent token
 * is ambiguous (such as Windows NT 10.0 representing both Windows 10 and 11).
 */
function normalizeOs(os: { name?: string; version?: string }): string {
  if (!os.name) return "Unknown OS";
  const name = os.name.toLowerCase();

  if (name.includes("windows")) {
    // Both Windows 10 and Windows 11 share the exact same 'Windows NT 10.0' UA token.
    // To avoid false claims, report honest generic 'Windows'.
    return "Windows";
  }

  if (name.includes("mac os") || name === "mac" || name === "macos") {
    return os.version ? `macOS ${os.version}` : "macOS";
  }

  if (name.includes("ios")) {
    return os.version ? `iOS ${os.version}` : "iOS";
  }

  if (name.includes("android")) {
    return os.version ? `Android ${os.version}` : "Android";
  }

  if (name.includes("linux")) {
    return "Linux";
  }

  if (name.includes("chrome os") || name.includes("chromium os")) {
    return "ChromeOS";
  }

  return `${os.name} ${os.version || ""}`.trim();
}

/**
 * Normalizes the browser label to clean major version format (e.g. 'Chrome 151' instead of 'Chrome 151.0.0.0').
 */
function normalizeBrowser(browser: { name?: string; version?: string; major?: string }): string {
  if (!browser.name) return "Unknown Browser";
  
  const major = browser.major || (browser.version ? browser.version.split('.')[0] : "");
  return major ? `${browser.name} ${major}` : browser.name;
}

/**
 * Parses the user agent string into clean, normalized structured components
 * while retaining the full raw user-agent string for audit logs.
 */
export async function parseUserAgent(): Promise<ParsedUserAgent> {
  const headersList = await headers();
  const uaString = headersList.get("user-agent") || "";
  
  const parser = new UAParser(uaString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const cleanBrowser = normalizeBrowser(browser);
  const cleanOs = normalizeOs(os);
  const deviceType = device.type || "desktop";

  let cleanDeviceName = `${device.vendor || ""} ${device.model || ""}`.trim();
  if (!cleanDeviceName) {
    if (deviceType === "desktop") {
      cleanDeviceName = cleanOs === "macOS" ? "Mac" : cleanOs === "Windows" ? "Windows PC" : "Desktop Computer";
    } else {
      cleanDeviceName = `${cleanOs} Device`;
    }
  }

  return {
    browser: cleanBrowser,
    os: cleanOs,
    deviceType,
    deviceName: cleanDeviceName,
    rawString: uaString,
  };
}
