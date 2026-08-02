/**
 * Helper to get initials from a company name.
 * Real Tech -> RT
 * Dortasia -> DO
 * Dort Asia -> DA
 * A -> AX
 */
export function getCompanyInitials(companyName: string): string {
  const cleanName = companyName.trim().toUpperCase().replace(/[^A-Z\s]/g, "");
  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).slice(0, 2);
  } else if (words.length === 1) {
    const word = words[0];
    if (word.length >= 2) {
      return word.slice(0, 2);
    } else if (word.length === 1) {
      return word + "X";
    }
  }
  return "DA";
}

/**
 * Helper to build/generate a department ID.
 * initials: e.g. "RT"
 * sequenceNum: e.g. 1
 * returns e.g. "RT0001DEPT26"
 */
export function generateDeptId(companyInitials: string, sequenceNum: number): string {
  const seqStr = String(sequenceNum).padStart(4, "0");
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  return `${companyInitials}${seqStr}DEPT${yearSuffix}`;
}
