/**
 * Checks if an IP address is localhost, loopback, or private RFC1918 / IPv6 local address.
 * Client and Server safe (no next/headers dependency).
 */
export function isLocalOrPrivateIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const cleanIp = ip.trim().toLowerCase();
  if (cleanIp === "::1" || cleanIp === "127.0.0.1" || cleanIp === "localhost" || cleanIp === "0.0.0.0") return true;
  if (cleanIp.startsWith("127.")) return true;
  if (cleanIp.startsWith("10.")) return true;
  if (cleanIp.startsWith("192.168.")) return true;
  if (cleanIp.startsWith("fe80:") || cleanIp.startsWith("fc00:") || cleanIp.startsWith("fd")) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) return true;
  return false;
}
