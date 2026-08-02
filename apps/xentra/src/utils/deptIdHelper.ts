/**
 * Helper to get initials from a company name.
 * Extracts the first 3 letters of the company name.
 * e.g., Dort Asia -> DOR
 */
export function getCompanyInitials(companyName: string): string {
  const cleanName = companyName.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (cleanName.length >= 3) {
    return cleanName.slice(0, 3);
  }
  return cleanName.padEnd(3, "X");
}

/**
 * Helper to build/generate a department ID.
 * initials: e.g. "DOR" (first 3 letters)
 * sequenceNum: e.g. 1
 * returns e.g. "DOR001DEPT26MB"
 */
export function generateDeptId(companyInitials: string, sequenceNum: number): string {
  const seqStr = String(sequenceNum).padStart(3, "0");
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  // Appends MB (Main Branch) by default
  return `${companyInitials}${seqStr}DEPT${yearSuffix}MB`;
}
