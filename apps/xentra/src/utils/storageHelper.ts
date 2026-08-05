/**
 * storageHelper.ts — Standardized Supabase Storage Utility
 *
 * Bucket Structure:
 *
 * 1. employee-profiles
 *    └── {company_id}/{employee_id}/profile.webp
 *
 * 2. employee-documents
 *    └── {company_id}/{employee_id}/
 *        ├── passport/
 *        ├── visa/
 *        ├── work-pass/
 *        ├── education/
 *        ├── certifications/
 *        ├── training/
 *        ├── contracts/
 *        ├── medical/
 *        ├── bank/
 *        ├── government/
 *        ├── insurance/
 *        ├── payroll/
 *        └── other/
 *
 * 3. company-assets
 *    └── {company_id}/
 *        ├── logo/
 *        ├── favicon/
 *        ├── letterhead/
 *        ├── signature/
 *        └── branding/
 *
 * 4. system-assets
 *    ├── icons/
 *    ├── templates/
 *    ├── default-avatar/
 *    ├── flags/
 *    └── announcements/
 *
 * 5. temp-uploads
 *    └── {user_id}/{upload_session}/
 */

// ─── Bucket Constants ─────────────────────────────────────
export const BUCKETS = {
  EMPLOYEE_PROFILES: "employee-profiles",
  EMPLOYEE_DOCUMENTS: "employee-documents",
  COMPANY_ASSETS: "company-assets",
  SYSTEM_ASSETS: "system-assets",
  TEMP_UPLOADS: "temp-uploads",
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

// Legacy bucket backwards compatibility
export const PRIVATE_BUCKET = BUCKETS.EMPLOYEE_DOCUMENTS;
export const PUBLIC_BUCKET = BUCKETS.COMPANY_ASSETS;

// ─── Subfolder Type Definitions ───────────────────────────
export type EmployeeDocCategory =
  | "passport"
  | "visa"
  | "work-pass"
  | "education"
  | "certifications"
  | "training"
  | "contracts"
  | "medical"
  | "bank"
  | "government"
  | "insurance"
  | "payroll"
  | "other";

export type CompanyAssetCategory =
  | "logo"
  | "favicon"
  | "letterhead"
  | "signature"
  | "branding";

export type SystemAssetCategory =
  | "icons"
  | "templates"
  | "default-avatar"
  | "flags"
  | "announcements";

// ─── Helpers ──────────────────────────────────────────────
export function toCompanySlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitizeFileName(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  const baseName = dotIndex > 0 ? name.substring(0, dotIndex) : name;

  return baseName
    .replace(/[^a-zA-Z0-9_\s-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

export function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext || "tmp";
}

export function getDateStamp(date?: Date): string {
  const d = date || new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

export function getStorageFolderPath(params: {
  companySlug: string;
  category: string;
  employeeName?: string;
  projectName?: string;
}): string {
  const { companySlug, category, employeeName, projectName } = params;
  const base = `Company_Storage/${companySlug}`;

  switch (category) {
    case "employees":
      return `${base}/Employees/${employeeName?.trim() || "Unknown"}/`;
    case "payments":
      return `${base}/Payments/`;
    case "projects":
      return `${base}/Projects/${projectName?.trim() || "Unknown"}/`;
    case "company-storage":
      return `${base}/Company Storage/`;
    case "attendance":
      return `${base}/Attendance/`;
    default:
      return `${base}/`;
  }
}

export function buildStorageFileName(params: {
  companyId: string;
  originalFileName: string;
  empId?: string;
  date?: Date;
}): string {
  const { companyId, originalFileName, empId, date } = params;
  const sanitized = sanitizeFileName(originalFileName);
  const dateStamp = getDateStamp(date);
  const ext = getFileExtension(originalFileName);

  if (empId) {
    return `${companyId}_${empId}_${sanitized}_${dateStamp}.${ext}`;
  }
  return `${companyId}_${sanitized}_${dateStamp}.${ext}`;
}

// ─── Path Builders ────────────────────────────────────────

/**
 * Generates path for `employee-profiles` bucket:
 * `{company_id}/{employee_id}/profile.webp`
 */
export function getEmployeeProfilePath(
  companyId: string,
  employeeId: string,
  extension: string = "webp"
): string {
  return `${companyId}/${employeeId}/profile.${extension}`;
}

/**
 * Generates path for `employee-documents` bucket:
 * `{company_id}/{employee_id}/{docCategory}/{fileName}`
 */
export function getEmployeeDocumentPath(
  companyId: string,
  employeeId: string,
  docCategory: EmployeeDocCategory,
  fileName: string
): string {
  const sanitized = sanitizeFileName(fileName);
  const ext = getFileExtension(fileName);
  return `${companyId}/${employeeId}/${docCategory}/${sanitized}.${ext}`;
}

/**
 * Generates path for `company-assets` bucket:
 * `{company_id}/{assetCategory}/{fileName}`
 */
export function getCompanyAssetPath(
  companyId: string,
  assetCategory: CompanyAssetCategory,
  fileName: string
): string {
  const sanitized = sanitizeFileName(fileName);
  const ext = getFileExtension(fileName);
  return `${companyId}/${assetCategory}/${sanitized}.${ext}`;
}

/**
 * Generates path for `system-assets` bucket:
 * `{systemCategory}/{fileName}`
 */
export function getSystemAssetPath(
  systemCategory: SystemAssetCategory,
  fileName: string
): string {
  const sanitized = sanitizeFileName(fileName);
  const ext = getFileExtension(fileName);
  return `${systemCategory}/${sanitized}.${ext}`;
}

/**
 * Generates path for `temp-uploads` bucket:
 * `{user_id}/{upload_session}/{fileName}`
 */
export function getTempUploadPath(
  userId: string,
  uploadSession: string,
  fileName: string
): string {
  const sanitized = sanitizeFileName(fileName);
  const ext = getFileExtension(fileName);
  return `${userId}/${uploadSession}/${sanitized}.${ext}`;
}

// ─── Unified Upload Functions ─────────────────────────────

/**
 * Uploads an employee profile photo to `employee-profiles` bucket
 */
export async function uploadEmployeeProfilePhoto(
  supabase: any,
  companyId: string,
  employeeId: string,
  file: File | Blob,
  extension: string = "webp"
): Promise<string> {
  const path = getEmployeeProfilePath(companyId, employeeId, extension);
  const { error } = await supabase.storage
    .from(BUCKETS.EMPLOYEE_PROFILES)
    .upload(path, file, { upsert: true, contentType: `image/${extension}` });

  if (error) {
    console.error("Employee profile upload error:", error);
    throw new Error(`Failed to upload profile picture: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKETS.EMPLOYEE_PROFILES)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Uploads an employee document to `employee-documents` bucket
 */
export async function uploadEmployeeDocument(
  supabase: any,
  companyId: string,
  employeeId: string,
  docCategory: EmployeeDocCategory,
  file: File
): Promise<string> {
  const path = getEmployeeDocumentPath(companyId, employeeId, docCategory, file.name);
  const { error } = await supabase.storage
    .from(BUCKETS.EMPLOYEE_DOCUMENTS)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error("Employee document upload error:", error);
    throw new Error(`Failed to upload document ${file.name}: ${error.message}`);
  }

  return path;
}

/**
 * Uploads a company asset (logo, favicon, etc.) to `company-assets` bucket
 */
export async function uploadCompanyAsset(
  supabase: any,
  companyId: string,
  assetCategory: CompanyAssetCategory,
  file: File | Blob,
  fileName: string
): Promise<string> {
  const path = getCompanyAssetPath(companyId, assetCategory, fileName);
  const { error } = await supabase.storage
    .from(BUCKETS.COMPANY_ASSETS)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error("Company asset upload error:", error);
    throw new Error(`Failed to upload company asset ${fileName}: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKETS.COMPANY_ASSETS)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Legacy support for uploadToCompanyStorage
 */
export async function uploadToCompanyStorage(
  supabase: any,
  params: {
    companyId: string;
    companySlug?: string;
    category: string;
    file: File;
    categoryName?: string;
    empId?: string;
    employeeName?: string;
    projectName?: string;
  }
): Promise<string> {
  const { companyId, empId, file, categoryName } = params;
  const targetDocType: EmployeeDocCategory = (categoryName?.toLowerCase() as EmployeeDocCategory) || "other";
  const employeeId = empId || "general";
  
  return uploadEmployeeDocument(supabase, companyId, employeeId, targetDocType, file);
}
