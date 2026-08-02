import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import stringSimilarity from 'string-similarity';

interface Department {
  id: string;
  name: string;
  description: string;
  designations: string[];
}

// ─── Validation list constants ───────────────────────────────────────────────
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const APP_ROLES = ['Admin', 'Sub Admin', 'Employee'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const JOB_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];
const SHIFT_TYPES = ['Day', 'Night', 'Rotational'];
const YES_NO = ['Yes', 'No'];
const PASS_TYPES = ['Employment Pass', 'S Pass', 'Work Permit', "Dependant's Pass", 'Long Term Visit Pass', 'Student Pass', 'Other'];
const PAYMENT_MODES = ['Bank Transfer', 'Cash', 'Cheque'];
const SHG_OPTIONS = ['CDAC', 'SINDA', 'MBMF', 'ECF', 'None'];
const PAYMENT_FREQ = ['Monthly', 'Quarterly', 'Annually'];
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe",
  "Other"
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const styleHeaderRow = (sheet: ExcelJS.Worksheet) => {
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    };
    cell.font = { bold: true, color: { argb: 'FF000000' }, size: 11 };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.alignment = { wrapText: true, vertical: 'middle' };
  });
  sheet.getRow(1).height = 30;
};

const applyListValidation = (
  sheet: ExcelJS.Worksheet,
  colLetter: string,
  itemsOrFormula: string[] | string,
  rows = 500,
  title = 'Invalid Selection',
  msg = 'Please select a value from the drop-down list.'
) => {
  const formula = Array.isArray(itemsOrFormula) 
    ? '"' + itemsOrFormula.join(',') + '"' 
    : itemsOrFormula;
    
  for (let i = 2; i <= rows; i++) {
    sheet.getCell(`${colLetter}${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: title,
      error: msg,
      formulae: [formula],
    };
  }
};

const applyDateValidation = (
  sheet: ExcelJS.Worksheet,
  colLetter: string,
  rows = 500,
  fieldName = 'Date'
) => {
  for (let i = 2; i <= rows; i++) {
    sheet.getCell(`${colLetter}${i}`).dataValidation = {
      type: 'date',
      operator: 'between',
      allowBlank: true,
      showErrorMessage: true,
      showInputMessage: true,
      promptTitle: fieldName,
      prompt: 'Enter date in DD-MM-YYYY format (e.g., 15-03-2025)',
      errorStyle: 'stop',
      errorTitle: `Invalid ${fieldName}`,
      error: `Please enter a valid date in DD-MM-YYYY format. Must be between 1900 and 2100.`,
      formulae: [new Date(1900, 0, 1), new Date(2100, 11, 31)],
    };
    sheet.getCell(`${colLetter}${i}`).numFmt = 'DD-MM-YYYY';
  }
};

const applyFutureDateValidation = (
  sheet: ExcelJS.Worksheet,
  colLetter: string,
  rows = 500,
  fieldName = 'Expiry Date'
) => {
  for (let i = 2; i <= rows; i++) {
    sheet.getCell(`${colLetter}${i}`).dataValidation = {
      type: 'date',
      operator: 'greaterThan',
      allowBlank: true,
      showErrorMessage: true,
      showInputMessage: true,
      promptTitle: fieldName,
      prompt: 'Enter a future date in DD-MM-YYYY format',
      errorStyle: 'warning',
      errorTitle: `${fieldName} Warning`,
      error: `This date appears to be in the past. Please verify.`,
      formulae: [new Date()],
    };
    sheet.getCell(`${colLetter}${i}`).numFmt = 'DD-MM-YYYY';
  }
};

const applyNumberValidation = (
  sheet: ExcelJS.Worksheet,
  colLetter: string,
  rows = 500,
  fieldName = 'Value',
  min = 0,
  max = 99999999
) => {
  for (let i = 2; i <= rows; i++) {
    sheet.getCell(`${colLetter}${i}`).dataValidation = {
      type: 'decimal',
      operator: 'between',
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: `Invalid ${fieldName}`,
      error: `${fieldName} must be a number between ${min} and ${max.toLocaleString()}.`,
      formulae: [min, max],
    };
    sheet.getCell(`${colLetter}${i}`).numFmt = '#,##0.00';
  }
};

/** Sanitize department name for Excel named range (letters, digits, underscores only) */
const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_').replace(/^(\d)/, '_$1');

// ─── GENERATE ────────────────────────────────────────────────────────────────
export const generateEmployeeTemplate = async (departments: Department[]) => {
  const workbook = new ExcelJS.Workbook();

  const ROWS = 500;

  // ── Sheet 1: Employee Data (Core) ──────────────────────────────────────────
  const s1 = workbook.addWorksheet('Employee Data');
  s1.columns = [
    { header: 'First Name (Important)', key: 'firstName', width: 20 },           // A
    { header: 'Last Name (Important)', key: 'lastName', width: 20 },             // B
    { header: 'Email Address (Important)', key: 'email', width: 30 },            // C
    { header: 'Phone Number (Optional)', key: 'phone', width: 25 },    // D
    { header: 'Gender (Important)', key: 'gender', width: 20 },                    // E
    { header: 'Date of Birth (Important)', key: 'dob', width: 20 },                // F
    { header: 'Nationality (Important)', key: 'nationality', width: 22 },          // G
    { header: 'Marital Status (Optional)', key: 'maritalStatus', width: 18 },     // H
    { header: 'Blood Group (Optional)', key: 'bloodGroup', width: 14 },           // I
    { header: 'Department (Important)', key: 'department', width: 25 },          // J
    { header: 'Designation (Important)', key: 'designation', width: 25 },        // K
    { header: 'App Role (Important)', key: 'appRole', width: 18 },               // L
    { header: 'Joined Date (Important)', key: 'joinedDate', width: 20 },           // M
    { header: 'Salary (Important)', key: 'salary', width: 18 },                    // N
    { header: 'Job Type (Important)', key: 'jobType', width: 18 },                 // O
    { header: 'Shift Type (Important)', key: 'shiftType', width: 18 },             // P
    { header: 'Overtime Applicable (Important)', key: 'overtimeApplicable', width: 22 }, // Q
    { header: 'Claims Applicable (Important)', key: 'claimsApplicable', width: 22 },    // R
  ];
  styleHeaderRow(s1);

  const mockDept = departments.find(d => d.name !== 'Admin Department') || { name: 'IT', designations: ['Software Engineer'] };
  const mockDesig = mockDept.designations[0] || 'General';
  s1.addRow(['John', 'Doe', 'john.doe@example.com', '98765432', 'Male', '15-05-1990', 'Singapore', 'Single', 'O+', mockDept.name, mockDesig, 'Employee', '01-01-2023', '5000', 'Full-Time', 'Day', 'No', 'Yes']);
  s1.addRow(['Jane', 'Smith', 'jane.smith@example.com', '87654321', 'Female', '22-08-1995', 'Singapore', 'Married', 'A+', mockDept.name, mockDesig, 'Employee', '15-06-2022', '6500', 'Full-Time', 'Day', 'Yes', 'Yes']);

  // ── Hidden ValidationData sheet ────────────────────────────────────────────
  const dataSheet = workbook.addWorksheet('ValidationData', { state: 'hidden' });
  dataSheet.getColumn('A').values = ['Gender', ...GENDERS];
  dataSheet.getColumn('B').values = ['App Role', ...APP_ROLES];
  const userDepts = departments.filter(d => d.name !== 'Admin Department');
  const deptNames = userDepts.map(d => d.name);
  dataSheet.getColumn('C').values = ['Departments', ...deptNames];
  dataSheet.getColumn('D').values = ['Countries', ...COUNTRIES];

  // Designations per department — create named ranges
  let colIndex = 5; // Start at column E
  userDepts.forEach((dept) => {
    const safeName = sanitizeName(dept.name);
    const column = dataSheet.getColumn(colIndex);
    const desigs = dept.designations && dept.designations.length > 0 ? dept.designations : ['General'];
    column.values = [safeName, ...desigs];
    // Create named range
    const startCell = `$${column.letter}$2`;
    const endCell = `$${column.letter}$${desigs.length + 1}`;
    workbook.definedNames.add(`ValidationData!${startCell}:${endCell}`, safeName);
    colIndex++;
  });

  // ── Sheet 1 Validations ────────────────────────────────────────────────────
  for (let i = 2; i <= ROWS; i++) {
    // Phone (text length = 8)
    s1.getCell(`D${i}`).dataValidation = {
      type: 'textLength',
      operator: 'equal',
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Phone Number',
      error: 'Phone number must be exactly 8 digits without country code.',
      formulae: [8],
    };

    // Department (dropdown)
    if (deptNames.length > 0) {
      s1.getCell(`J${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Department',
        error: 'Please select a valid department.',
        formulae: ['"' + deptNames.join(',') + '"'],
      };
    }

    // Designation (dependent on Department via INDIRECT)
    // Build the INDIRECT formula with full sanitization matching sanitizeName()
    const indirectFormula = `INDIRECT(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(J${i}," ","_"),"&","_"),"-","_"),"(","_"),")","_"),"/","_"),".","_"),",","_"))`;
    s1.getCell(`K${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Designation',
      error: 'Select a designation based on the chosen department.',
      formulae: [indirectFormula],
    };
  }

  // Dropdown validations
  applyListValidation(s1, 'E', GENDERS);
  
  // Nationality list is too long for inline validation (>255 chars), so use a named range
  workbook.definedNames.add(`ValidationData!$D$2:$D$${COUNTRIES.length + 1}`, 'CountriesList');
  applyListValidation(s1, 'G', 'CountriesList');
  
  applyListValidation(s1, 'H', MARITAL_STATUSES);
  applyListValidation(s1, 'I', BLOOD_GROUPS);
  applyListValidation(s1, 'L', APP_ROLES);
  applyListValidation(s1, 'O', JOB_TYPES);
  applyListValidation(s1, 'P', SHIFT_TYPES);
  applyListValidation(s1, 'Q', YES_NO);
  applyListValidation(s1, 'R', YES_NO);

  // Date validations
  applyDateValidation(s1, 'F', ROWS, 'Date of Birth');
  applyDateValidation(s1, 'M', ROWS, 'Joined Date');

  // Salary — number only
  applyNumberValidation(s1, 'N', ROWS, 'Salary', 0, 9999999);

  // ── Sheet 2: Payroll & Banking ─────────────────────────────────────────────
  const s2 = workbook.addWorksheet('Payroll');
  s2.columns = [
    { header: 'Email (auto-linked) (Important)', key: 'email', width: 30 },      // A
    { header: 'Bank Name (Important)', key: 'bankName', width: 25 },                // B
    { header: 'Account Number (Important)', key: 'accountNumber', width: 25 },      // C
    { header: 'Account Holder Name (Important)', key: 'accountHolderName', width: 25 }, // D
    { header: 'Bank Code (Important)', key: 'bankCode', width: 15 },                // E
    { header: 'Branch Code (Important)', key: 'branchCode', width: 15 },            // F
    { header: 'Salary Payment Mode (Important)', key: 'paymentMode', width: 22 },   // G
  ];
  styleHeaderRow(s2);

  s2.addRow(['john.doe@example.com', 'DBS Bank', '123456789', 'John Doe', '7171', '001', 'Bank Transfer']);
  s2.addRow(['jane.smith@example.com', 'OCBC Bank', '987654321', 'Jane Smith', '7339', '502', 'Bank Transfer']);

  // Auto-link emails from Sheet 1
  for (let i = 4; i <= ROWS; i++) {
    s2.getCell(`A${i}`).value = { formula: `IF('Employee Data'!C${i}="","",'Employee Data'!C${i})` } as any;
    s2.getCell(`A${i}`).font = { color: { argb: 'FF8E8E93' }, italic: true };
    s2.getCell(`A${i}`).protection = { locked: true };
  }

  applyListValidation(s2, 'G', PAYMENT_MODES, ROWS, 'Invalid Payment Mode', 'Please select a valid payment mode.');

  // ── Sheet 3: Work Details ────────────────────────────────────────
  const s3 = workbook.addWorksheet('Work Details');
  s3.columns = [
    { header: 'Email (auto-linked) (Optional)', key: 'email', width: 30 },      // A
    { header: 'Pass Type (Optional)', key: 'passType', width: 22 },                // B
    { header: 'NRIC Number (Optional)', key: 'nricNumber', width: 20 },            // C
    { header: 'FIN Number (Optional)', key: 'finNumber', width: 20 },              // D
    { header: 'Passport Number (Optional)', key: 'passportNumber', width: 22 },    // E
    { header: 'Passport Expiry (Optional)', key: 'passportExpiry', width: 20 },    // F
    { header: 'Issuing Country (Optional)', key: 'issuingCountry', width: 20 },    // G
    { header: 'Pass Issue Date (Optional)', key: 'passIssueDate', width: 20 },     // H
    { header: 'Pass Expiry Date (Optional)', key: 'passExpiryDate', width: 20 },   // I
  ];
  styleHeaderRow(s3);

  s3.addRow(['john.doe@example.com', '', 'S1234567A', '', 'E1234567', '01-01-2030', 'Singapore', '', '']);
  s3.addRow(['jane.smith@example.com', '', 'S7654321B', '', 'E7654321', '01-01-2032', 'Singapore', '', '']);

  // Auto-link emails from Sheet 1
  for (let i = 4; i <= ROWS; i++) {
    s3.getCell(`A${i}`).value = { formula: `IF('Employee Data'!C${i}="","",'Employee Data'!C${i})` } as any;
    s3.getCell(`A${i}`).font = { color: { argb: 'FF8E8E93' }, italic: true };
    s3.getCell(`A${i}`).protection = { locked: true };
  }

  applyListValidation(s3, 'B', PASS_TYPES);
  applyFutureDateValidation(s3, 'F', ROWS, 'Passport Expiry');
  applyListValidation(s3, 'G', 'CountriesList', ROWS, 'Invalid Country', 'Please select a valid issuing country.');
  applyDateValidation(s3, 'H', ROWS, 'Pass Issue Date');
  applyFutureDateValidation(s3, 'I', ROWS, 'Pass Expiry Date');

  // ── Generate & Download ────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Employee_Onboarding_Template.xlsx');
};

// ─── PARSE ───────────────────────────────────────────────────────────────────
const getCellValue = (cell: ExcelJS.Cell): string => {
  const val = cell.value;
  if (val == null) return '';
  if (typeof val === 'object') {
    if ('richText' in val) return (val as ExcelJS.CellRichTextValue).richText.map(rt => rt.text).join('').trim();
    // Handle formula cells — read the cached result
    if ('formula' in val || 'sharedFormula' in val) {
      const fVal = val as ExcelJS.CellFormulaValue;
      if (fVal.result != null) {
        if (fVal.result instanceof Date) {
          const d = fVal.result.getDate().toString().padStart(2, '0');
          const m = (fVal.result.getMonth() + 1).toString().padStart(2, '0');
          const y = fVal.result.getFullYear();
          return `${d}-${m}-${y}`;
        }
        return fVal.result.toString().trim();
      }
      return '';
    }
    if ('result' in val) {
      const rv = (val as any).result;
      if (rv instanceof Date) {
        const d = rv.getDate().toString().padStart(2, '0');
        const m = (rv.getMonth() + 1).toString().padStart(2, '0');
        const y = rv.getFullYear();
        return `${d}-${m}-${y}`;
      }
      return rv ? rv.toString().trim() : '';
    }
    if (val instanceof Date) {
      const d = val.getDate().toString().padStart(2, '0');
      const m = (val.getMonth() + 1).toString().padStart(2, '0');
      const y = val.getFullYear();
      return `${d}-${m}-${y}`;
    }
  }
  return val.toString().trim();
};

const readSheetAsMap = (workbook: ExcelJS.Workbook, sheetName: string): Map<string, Record<string, string>> => {
  const map = new Map<string, Record<string, string>>();
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return map;

  const headers: string[] = [];
  sheet.getRow(1).eachCell((cell, colNum) => {
    // Strip markers like " *", "(auto-linked)", "(Key)" from header names
    headers[colNum] = getCellValue(cell)
      .replace(/\s*\*\s*$/g, '')
      .replace(/\s*\(auto-linked\)\s*/gi, '')
      .replace(/\s*\(Key\)\s*/gi, '')
      .replace(/\s*\(Important\)\s*/gi, '')
      .replace(/\s*\(Optional\)\s*/gi, '')
      .trim();
  });

  sheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const emailCell = getCellValue(row.getCell(1));
    if (!emailCell) return;
    const key = emailCell.toLowerCase();
    const record: Record<string, string> = {};
    row.eachCell((cell, colNum) => {
      if (colNum === 1) return; // skip email key column
      const header = headers[colNum];
      if (header) record[header] = getCellValue(cell);
    });
    map.set(key, { ...(map.get(key) || {}), ...record });
  });

  return map;
};

export interface ParsedEmployee {
  // Sheet 1: Core
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  maritalStatus: string;
  bloodGroup: string;
  department: string;
  designation: string;
  role: string;
  joinedDate: string;
  salary: string;
  jobType: string;
  shiftType: string;
  overtimeApplicable: string;
  claimsApplicable: string;
  // Sheet 2: Payroll
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  branchCode: string;
  salaryPaymentMode: string;
  // Sheet 3: Work Details & Education
  nricNumber: string;
  finNumber: string;
  passportNumber: string;
  passportExpiryDate: string;
  issuingCountry: string;
  passType: string;
  passIssueDate: string;
  passExpiryDate: string;
  higherEduCountry: string;
  higherEduInstName: string;
  higherEduCourseName: string;
  higherEduQual: string;
  higherEduGradYear: string;
  schoolingCountry: string;
  schoolingInstName: string;
  schoolingQual: string;
  schoolingGradYear: string;
  // Payroll Extended
  onlinePaymentType: string;
  onlinePaymentId: string;
  shgContribution: string;
  shgAmount: string;
  foreignWorkerLevy: string;
  // Contact & Emergency
  personalEmail: string;
  personalNumber: string;
  mobile: string;
  countryCode: string;
  country: string;
  address: string;
  postalCode: string;
  currentAddress: string;
  currentPostalCode: string;
  residentialAddress: string;
  linkedinUrl: string;
  instagramUrl: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyContactRelation: string;
  emergencyContactAddress: string;
  errors?: string[];
  warnings?: string[];
}

export const parseEmployeeTemplate = async (file: File): Promise<ParsedEmployee[]> => {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const mainSheet = workbook.getWorksheet('Employee Data');
  if (!mainSheet) {
    throw new Error('Invalid template. Sheet "Employee Data" not found. Please use the downloaded template.');
  }

  // Read secondary sheets as email-keyed maps
  const payrollMap = readSheetAsMap(workbook, 'Payroll');
  const docsMap = readSheetAsMap(workbook, 'Work Details');
  const contactMap = readSheetAsMap(workbook, 'Contact & Emergency');

  const employees: ParsedEmployee[] = [];

  mainSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const getVal = (col: number) => getCellValue(row.getCell(col));

    const firstName = getVal(1);
    const lastName = getVal(2);
    const email = getVal(3);

    // Skip empty rows
    if (!firstName && !lastName && !email) return;

    const emailKey = email.toLowerCase();
    const payroll = payrollMap.get(emailKey) || {};
    const docs = docsMap.get(emailKey) || {};
    const contact = contactMap.get(emailKey) || {};

    employees.push({
      // Sheet 1: Core
      firstName,
      lastName,
      email,
      phone: getVal(4),
      gender: getVal(5),
      dateOfBirth: getVal(6),
      nationality: getVal(7),
      maritalStatus: getVal(8),
      bloodGroup: getVal(9),
      department: getVal(10),
      designation: getVal(11),
      role: getVal(12),
      joinedDate: getVal(13),
      salary: getVal(14),
      jobType: getVal(15),
      shiftType: getVal(16),
      overtimeApplicable: getVal(17),
      claimsApplicable: getVal(18),
      // Sheet 2: Payroll
      bankName: payroll['Bank Name'] || '',
      accountNumber: payroll['Account Number'] || '',
      accountHolderName: payroll['Account Holder Name'] || '',
      bankCode: payroll['Bank Code'] || '',
      branchCode: payroll['Branch Code'] || '',
      salaryPaymentMode: payroll['Salary Payment Mode'] || '',
      onlinePaymentType: payroll['Online Payment Type'] || '',
      onlinePaymentId: payroll['Online Payment ID'] || '',
      shgContribution: payroll['SHG Contribution'] || '',
      shgAmount: payroll['SHG Amount'] || '',
      foreignWorkerLevy: payroll['Foreign Worker Levy'] || '',
      // Sheet 3: Work Details & Education
      nricNumber: docs['NRIC Number'] || '',
      finNumber: docs['FIN Number'] || '',
      passportNumber: docs['Passport Number'] || '',
      passportExpiryDate: docs['Passport Expiry'] || '',
      issuingCountry: docs['Issuing Country'] || '',
      passType: docs['Pass Type'] || '',
      passIssueDate: docs['Pass Issue Date'] || '',
      passExpiryDate: docs['Pass Expiry Date'] || '',
      higherEduCountry: docs['Higher Edu Country'] || '',
      higherEduInstName: docs['Higher Edu Inst Name'] || '',
      higherEduCourseName: docs['Higher Edu Course Name'] || '',
      higherEduQual: docs['Higher Edu Qual'] || '',
      higherEduGradYear: docs['Higher Edu Grad Year'] || '',
      schoolingCountry: docs['Schooling Country'] || '',
      schoolingInstName: docs['Schooling Inst Name'] || '',
      schoolingQual: docs['Schooling Qual'] || '',
      schoolingGradYear: docs['Schooling Grad Year'] || '',
      // Contact & Emergency
      personalEmail: contact['Personal Email'] || '',
      personalNumber: contact['Personal Number'] || '',
      mobile: contact['Mobile'] || '',
      countryCode: contact['Country Code'] || '',
      country: contact['Country'] || '',
      address: contact['Address'] || '',
      postalCode: contact['Postal Code'] || '',
      currentAddress: contact['Current Address'] || '',
      currentPostalCode: contact['Current Postal Code'] || '',
      residentialAddress: contact['Residential Address'] || '',
      linkedinUrl: contact['LinkedIn URL'] || '',
      instagramUrl: contact['Instagram URL'] || '',
      emergencyContactName: contact['Emergency Contact Name'] || '',
      emergencyContactNumber: contact['Emergency Contact Number'] || '',
      emergencyContactRelation: contact['Emergency Contact Relation'] || '',
      emergencyContactAddress: contact['Emergency Contact Address'] || '',
    });
  });

  return employees;
};

// ─── VALIDATION ENGINE ───────────────────────────────────────────────────────
export const isValidDateFormat = (val: string): boolean => {
  if (!val) return true; // blank is OK
  const match = val.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;
  const [, dd, mm, yyyy] = match;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (month < 1 || month > 12 || day < 1 || year < 1900 || year > 2100) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;
  return true;
};

export const isFutureDate = (val: string): boolean => {
  if (!val) return true;
  const match = val.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;
  const [, dd, mm, yyyy] = match;
  return new Date(`${yyyy}-${mm}-${dd}`) > new Date();
};

export const isValidUrl = (val: string): boolean => {
  if (!val) return true;
  try { new URL(val); return true; } catch { return false; }
};

export const isNumericOrEmpty = (val: string): boolean => {
  if (!val) return true;
  return !isNaN(Number(val.replace(/,/g, '')));
};

interface ValidationDeps {
  departments: { name: string; designations: string[] }[];
  existingEmails: string[];
}

export interface ValidatedEmployee extends ParsedEmployee {
  errors: string[];
}

export const validateEmployees = (employees: ParsedEmployee[], deps: ValidationDeps): ValidatedEmployee[] => {
  const emailSet = new Set<string>();

  const results = employees.map((emp) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ── Email ──────────────────────────────────────────────────────────────
    if (!emp.firstName) errors.push('First name is required');
    if (!emp.lastName) errors.push('Last name is required');
    if (!emp.email) errors.push('Email is required');

    // ── Email format & duplicates ──────────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emp.email && !emailRegex.test(emp.email)) errors.push('Invalid email format');
    if (emp.email) {
      const lk = emp.email.toLowerCase();
      if (emailSet.has(lk)) errors.push('Duplicate email in sheet');
      else emailSet.add(lk);
      if (deps.existingEmails.includes(lk)) errors.push('Email already added');
    }


    // ── Department & Designation ────────────────────────────────────────────
    const deptExists = deps.departments.find(d => d.name === emp.department);
    if (emp.department && !deptExists) errors.push('Department not found');
    else if (deptExists && emp.designation && !deptExists.designations.includes(emp.designation)) errors.push('Designation not found in department');

    // ── Dropdown enums ─────────────────────────────────────────────────────
    if (emp.gender && !GENDERS.includes(emp.gender)) errors.push('Invalid gender');
    if (emp.role && !APP_ROLES.includes(emp.role)) errors.push('Invalid app role');
    if (emp.maritalStatus && !MARITAL_STATUSES.includes(emp.maritalStatus)) errors.push('Invalid marital status');
    if (emp.bloodGroup && !BLOOD_GROUPS.includes(emp.bloodGroup)) errors.push('Invalid blood group');
    if (emp.jobType && !JOB_TYPES.includes(emp.jobType)) errors.push('Invalid job type');
    if (emp.shiftType && !SHIFT_TYPES.includes(emp.shiftType)) errors.push('Invalid shift type');
    if (emp.overtimeApplicable && !YES_NO.includes(emp.overtimeApplicable)) errors.push('Invalid overtime applicable value');
    if (emp.claimsApplicable && !YES_NO.includes(emp.claimsApplicable)) errors.push('Invalid claims applicable value');
    if (emp.passType && !PASS_TYPES.includes(emp.passType)) errors.push('Invalid pass type');
    if (emp.salaryPaymentMode && !PAYMENT_MODES.includes(emp.salaryPaymentMode)) errors.push('Invalid salary payment mode');

    // ── Nationality & Issuing Country (fuzzy match with string-similarity) ──
    if (emp.nationality) {
      if (!COUNTRIES.includes(emp.nationality)) {
        const matches = stringSimilarity.findBestMatch(emp.nationality, COUNTRIES);
        if (matches.bestMatch.rating > 0.4) {
          emp.nationality = matches.bestMatch.target;
        } else {
          errors.push(`Unknown nationality "${emp.nationality}" — verify spelling`);
        }
      }
    }

    if (emp.issuingCountry) {
      if (!COUNTRIES.includes(emp.issuingCountry)) {
        const matches = stringSimilarity.findBestMatch(emp.issuingCountry, COUNTRIES);
        if (matches.bestMatch.rating > 0.4) {
          emp.issuingCountry = matches.bestMatch.target;
        } else {
          errors.push(`Unknown issuing country "${emp.issuingCountry}" — verify spelling`);
        }
      }
    }

    // ── Phone (8 digits) ───────────────────────────────────────────────────
    if (emp.phone) {
      const digits = emp.phone.replace(/\D/g, '');
      if (digits.length !== 8) errors.push('Phone must be 8 digits');
    }

    // ── Numeric fields ─────────────────────────────────────────────────────
    if (!isNumericOrEmpty(emp.salary)) errors.push('Salary must be a number');

    // ── Date fields — format check ─────────────────────────────────────────
    if (!isValidDateFormat(emp.joinedDate)) errors.push('Invalid Joined Date format (DD-MM-YYYY)');
    if (!isValidDateFormat(emp.dateOfBirth)) errors.push('Invalid Date of Birth format (DD-MM-YYYY)');
    if (!isValidDateFormat(emp.passportExpiryDate)) errors.push('Invalid Passport Expiry format (DD-MM-YYYY)');
    if (!isValidDateFormat(emp.passIssueDate)) errors.push('Invalid Pass Issue Date format (DD-MM-YYYY)');
    if (!isValidDateFormat(emp.passExpiryDate)) errors.push('Invalid Pass Expiry Date format (DD-MM-YYYY)');

    // ── Date fields — content check (expiry must be future) ────────────────
    if (emp.passportExpiryDate && isValidDateFormat(emp.passportExpiryDate) && !isFutureDate(emp.passportExpiryDate)) {
      warnings.push('Passport expired');
    }
    if (emp.passExpiryDate && isValidDateFormat(emp.passExpiryDate) && !isFutureDate(emp.passExpiryDate)) {
      warnings.push('Pass expired');
    }

    // ── Date fields — logical check (issue < expiry) ───────────────────────
    if (emp.passIssueDate && emp.passExpiryDate && isValidDateFormat(emp.passIssueDate) && isValidDateFormat(emp.passExpiryDate)) {
      const parseDate = (v: string) => { const [dd, mm, yyyy] = v.split('-'); return new Date(`${yyyy}-${mm}-${dd}`); };
      if (parseDate(emp.passIssueDate) >= parseDate(emp.passExpiryDate)) {
        errors.push('Pass issue date must be before expiry');
      }
    }

    // ── Date of Birth — must be in the past & reasonable age ───────────────
    if (emp.dateOfBirth && isValidDateFormat(emp.dateOfBirth)) {
      const [dd, mm, yyyy] = emp.dateOfBirth.split('-');
      const dob = new Date(`${yyyy}-${mm}-${dd}`);
      if (dob >= new Date()) errors.push('Date of Birth must be in the past');
      const age = (new Date().getFullYear() - dob.getFullYear());
      if (age < 14) errors.push('Employee must be at least 14 years old');
      if (age > 100) errors.push('Date of Birth appears unrealistic');
    }

    return { ...emp, errors, warnings };
  });

  return results;
};
