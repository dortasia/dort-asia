// Singapore Government Tax Rules

export const calculateCPF = (salary: number, dob: string | null) => {
  if (!dob) return { employee: 0, employer: 0, age: 0 };
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  // Ordinary Wage ceiling is $6,800 currently
  const cappedSalary = Math.min(salary, 6800);

  let empRate = 0;
  let erRate = 0;

  // Basic rates for Singapore Citizens / PR year 3 onwards (Ordinary Wages)
  if (age <= 55) { empRate = 0.20; erRate = 0.17; }
  else if (age <= 60) { empRate = 0.105; erRate = 0.145; }
  else if (age <= 65) { empRate = 0.075; erRate = 0.11; }
  else if (age <= 70) { empRate = 0.05; erRate = 0.085; }
  else { empRate = 0.05; erRate = 0.075; }

  return {
    employee: cappedSalary * empRate,
    employer: cappedSalary * erRate,
    age: age
  };
};

export const calculateSDL = (salary: number) => {
  return Math.max(2, Math.min(11.25, salary * 0.0025));
};

export const calculateSHG = (salary: number, shgType: string): number => {
  if (!shgType || shgType === "None" || shgType === "") return 0;

  const type = shgType.toUpperCase();

  if (type.includes("+")) {
    return type.split("+").map(p => p.trim()).reduce((sum, p) => sum + calculateSHG(salary, p), 0);
  }
  
  if (type === "CDAC") {
    if (salary <= 2000) return 0.50;
    if (salary <= 3500) return 1.00;
    if (salary <= 5000) return 1.50;
    if (salary <= 7500) return 2.00;
    return 3.00;
  }
  
  if (type === "SINDA") {
    if (salary <= 1000) return 1.00;
    if (salary <= 1500) return 3.00;
    if (salary <= 2500) return 5.00;
    if (salary <= 4500) return 7.00;
    if (salary <= 7500) return 9.00;
    if (salary <= 10000) return 12.00;
    if (salary <= 15000) return 18.00;
    return 30.00;
  }
  
  if (type === "MBMF") {
    if (salary <= 1000) return 3.00;
    if (salary <= 2000) return 4.50;
    if (salary <= 3000) return 6.50;
    if (salary <= 4000) return 15.00;
    if (salary <= 6000) return 19.50;
    if (salary <= 8000) return 22.00;
    if (salary <= 10000) return 24.00;
    return 26.00;
  }
  
  if (type === "ECF") {
    if (salary <= 1000) return 2.00;
    if (salary <= 1500) return 4.00;
    if (salary <= 2500) return 6.00;
    if (salary <= 4000) return 9.00;
    if (salary <= 7000) return 12.00;
    if (salary <= 10000) return 16.00;
    return 20.00;
  }

  return 0;
};

// Original function extracted from payroll engine, modified to use new logic
export const getEmployeeProfileTaxes = (emp: any, baseSalary: number) => {
  const isForeign = !!(emp.pass_type || emp.custom_fields?.identityType === "FIN") && !emp.nric_number && !emp.custom_fields?.nricNumber;
  const isSPassOrWorkPermit = (emp.pass_type || "").toLowerCase().includes("s pass") || (emp.pass_type || "").toLowerCase().includes("work permit");

  // 1. Base calculations
  const defaultCpf = !isForeign ? calculateCPF(baseSalary, emp.date_of_birth) : { employee: 0, employer: 0, age: 0 };
  const defaultSdl = calculateSDL(baseSalary);

  // Determine if it was edited
  const isEdited = emp.is_tax_edited === true;

  // 2. Resolve Employee CPF
  let cpfEmployee = defaultCpf.employee;
  if (isEdited && emp.custom_fields?.customCpfEmployee !== undefined && emp.custom_fields?.customCpfEmployee !== "") {
    cpfEmployee = parseFloat(emp.custom_fields.customCpfEmployee) || 0;
  }

  // 3. Resolve Employer CPF
  let cpfEmployer = defaultCpf.employer;
  if (isEdited && emp.custom_fields?.customCpfEmployer !== undefined && emp.custom_fields?.customCpfEmployer !== "") {
    cpfEmployer = parseFloat(emp.custom_fields.customCpfEmployer) || 0;
  }

  // 4. Resolve SDL (SDF)
  let sdl = defaultSdl;
  if (isEdited && emp.custom_fields?.customSdl !== undefined && emp.custom_fields?.customSdl !== "") {
    sdl = parseFloat(emp.custom_fields.customSdl) || 0;
  }

  // 5. Resolve FWL (Foreign Worker Levy)
  let fwl = 0;
  if (isForeign && isSPassOrWorkPermit) {
    fwl = 300; // default FWL fallback
  }
  if (isEdited && emp.custom_fields?.foreignWorkerLevy !== undefined && emp.custom_fields?.foreignWorkerLevy !== "") {
    fwl = parseFloat(emp.custom_fields.foreignWorkerLevy) || 0;
  }

  // 6. Resolve Self-Help Group (CDAC, SINDA, MBMF, ECF)
  let shgType = emp.custom_fields?.shgContribution || "None";
  const isEP = emp.pass_type === "Employment Pass (EP)" || emp.custom_fields?.passType === "Employment Pass (EP)";
  const nationalityLower = (emp.nationality || emp.custom_fields?.nationality || "").toLowerCase();
  const isIndianCountry = ["india", "pakistan", "sri lanka", "bangladesh"].includes(nationalityLower);
  const raceLower = (emp.race || emp.custom_fields?.race || "").toLowerCase();
  const religionLower = (emp.religion || emp.custom_fields?.religion || "").toLowerCase();
  const isIndianDescent = raceLower === "indian" || isIndianCountry;
  const isMuslim = religionLower === "islam";

  if (!shgType || shgType === "None" || shgType === "" || ["CDAC", "SINDA", "MBMF", "ECF", "CDAC + MBMF"].includes(shgType)) {
    if (raceLower === "chinese" && isMuslim && (!isForeign || isEP)) shgType = "CDAC + MBMF";
    else if (isMuslim && (!isForeign || isEP)) shgType = "MBMF";
    else if (raceLower === "chinese" && !isForeign) shgType = "CDAC";
    else if (isIndianDescent && (!isForeign || isEP)) shgType = "SINDA";
    else if (raceLower === "eurasian" && !isForeign) shgType = "ECF";
    else shgType = "None";
  }
  
  let shgAmount = calculateSHG(baseSalary, shgType);
  
  if (isEdited && emp.custom_fields?.shgAmount !== undefined && emp.custom_fields?.shgAmount !== "") {
    shgAmount = parseFloat(emp.custom_fields.shgAmount) || 0;
  }

  // 7. Income tax
  let incomeTax = 0;
  if (isEdited && emp.custom_fields?.monthlyTaxEstimate !== undefined && emp.custom_fields?.monthlyTaxEstimate !== "") {
    incomeTax = parseFloat(emp.custom_fields.monthlyTaxEstimate) || 0;
  }

  return {
    cpfEmployee,
    cpfEmployer,
    sdl,
    fwl,
    shgType,
    shgAmount,
    incomeTax,
    age: defaultCpf.age || 0
  };
};
