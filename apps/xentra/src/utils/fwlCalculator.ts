export interface QuotaCounts {
  localFullCount: number;
  localHalfCount: number;
  sPassCount: number;
  workPermitCount: number;
}

export interface FWLResult {
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Flat' | 'Exceeded';
  levy: number;
  ratio: number;
  maxDrc: number;
}

/**
 * Calculates the Foreign Worker Levy (FWL) based on MOM regulations in Singapore.
 * 
 * Services DRC: 35%
 * - Tier 1: Up to 10% of total workforce
 * - Tier 2: Above 10% to 25% of total workforce
 * - Tier 3: Above 25% to 35% of total workforce
 * 
 * Manufacturing DRC: 60%
 * - Tier 1: Up to 25% of total workforce
 * - Tier 2: Above 25% to 50% of total workforce
 * - Tier 3: Above 50% to 60% of total workforce
 * 
 * Construction: Flat rates (DRC: 83.3%)
 * Marine Shipyard: Flat rates (DRC: 75%)
 * Process: Flat rates (DRC: 83.3%)
 */
export function calculateFWL(
  counts: QuotaCounts,
  sector: string,
  passType: string,
  skill: string
): FWLResult {
  const isSPass = (passType || "").toLowerCase().includes("s pass");
  const isWorkPermit = (passType || "").toLowerCase().includes("work permit");

  if (!isSPass && !isWorkPermit) {
    return { tier: 'Flat', levy: 0, ratio: 0, maxDrc: 0 };
  }

  // 1. S Pass is a flat S$650/month across all sectors as of Sept 2025
  if (isSPass) {
    return { tier: 'Flat', levy: 650, ratio: 0, maxDrc: 0 };
  }

  // 2. Work Permit calculations
  const localQuotaCount = counts.localFullCount + (counts.localHalfCount * 0.5);
  
  // Calculate new counts including this employee
  const newWPCount = counts.workPermitCount + 1;
  const totalForeign = counts.sPassCount + newWPCount;
  const totalWorkforce = localQuotaCount + totalForeign;
  
  const ratio = totalWorkforce > 0 ? (totalForeign / totalWorkforce) : 1;
  const normalizedSector = (sector || "").toLowerCase().trim();
  const isR1 = (skill || "").includes("R1") || (skill || "").toLowerCase().includes("higher-skilled");

  // Defaults
  let tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Flat' | 'Exceeded' = 'Tier 1';
  let levy = 0;
  let maxDrc = 0.35;

  if (normalizedSector === 'services') {
    maxDrc = 0.35;
    if (ratio <= 0.10) {
      tier = 'Tier 1';
      levy = isR1 ? 300 : 450;
    } else if (ratio <= 0.25) {
      tier = 'Tier 2';
      levy = isR1 ? 400 : 600;
    } else if (ratio <= 0.35) {
      tier = 'Tier 3';
      levy = isR1 ? 600 : 800;
    } else {
      tier = 'Exceeded';
      levy = isR1 ? 600 : 800; // Charge maximum tier if quota exceeded
    }
  } else if (normalizedSector === 'manufacturing') {
    maxDrc = 0.60;
    if (ratio <= 0.25) {
      tier = 'Tier 1';
      levy = isR1 ? 250 : 370;
    } else if (ratio <= 0.50) {
      tier = 'Tier 2';
      levy = isR1 ? 350 : 470;
    } else if (ratio <= 0.60) {
      tier = 'Tier 3';
      levy = isR1 ? 550 : 650;
    } else {
      tier = 'Exceeded';
      levy = isR1 ? 550 : 650;
    }
  } else if (normalizedSector === 'construction') {
    tier = 'Flat';
    levy = isR1 ? 300 : 700;
    maxDrc = 0.833;
  } else if (normalizedSector === 'marine shipyard' || normalizedSector === 'marine') {
    tier = 'Flat';
    levy = isR1 ? 300 : 400;
    maxDrc = 0.75;
  } else if (normalizedSector === 'process') {
    tier = 'Flat';
    levy = isR1 ? 300 : 450;
    maxDrc = 0.833;
  } else {
    // Fallback default
    tier = 'Flat';
    levy = 300;
    maxDrc = 0.35;
  }

  return {
    tier,
    levy,
    ratio: Math.round(ratio * 1000) / 10, // Convert to percentage e.g. 23.5%
    maxDrc: maxDrc * 100
  };
}
