/**
 * storageHelper.ts — Centralized Supabase Storage Utility
 *
 * Provides standardized file naming and folder path generation
 * for all uploads to the `private_data` bucket.
 *
 * Folder Structure:
 *   Company_Storage/{companySlug}/Employees/{employeeName}/
 *   Company_Storage/{companySlug}/Payments/
 *   Company_Storage/{companySlug}/Projects/{projectName}/
 *   Company_Storage/{companySlug}/Company Storage/
 *   Company_Storage/{companySlug}/Attendance/
 *
 * File Naming:
 *   Employee-related: {companyId}_{empId}_{fileName}_{DDMMYYYY}.{ext}
 *   Non-employee:     {companyId}_{fileName}_{DDMMYYYY}.{ext}
 */

// ─── Constants ──────────────────────────────────────────
export const PRIVATE_BUCKET = "private_data";
export const PUBLIC_BUCKET = "public_assets";

export type StorageCategory =
  | "employees"
  | "payments"
  | "projects"
  | "company-storage"
  | "attendance";

// ─── Helpers ────────────────────────────────────────────

/** Converts a company name to a URL-safe slug (e.g. "Dort Asia" → "dort-asia") */
export function toCompanySlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Returns the current date as DDMMYYYY string */
export function getDateStamp(date?: Date): string {
  const d = date || new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

/**
 * Sanitizes a filename for use in storage paths:
 * - Strips the file extension
 * - Replaces spaces and special characters with underscores
 * - Converts to uppercase
 * - Collapses multiple underscores
 */
export function sanitizeFileName(name: string): string {
  // Remove extension
  const dotIndex = name.lastIndexOf(".");
  const baseName = dotIndex > 0 ? name.substring(0, dotIndex) : name;

  return baseName
    .replace(/[^a-zA-Z0-9_\s-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

/** Extracts the file extension from a filename */
export function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext || "tmp";
}

// ─── Path Builders ──────────────────────────────────────

interface FolderPathParams {
  companySlug: string;
  category: StorageCategory;
  /** Required for "employees" category */
  employeeName?: string;
  /** Required for "projects" category */
  projectName?: string;
}

/**
 * Returns the correct subfolder path within Company_Storage.
 * Always ends with a trailing slash.
 */
export function getStorageFolderPath(params: FolderPathParams): string {
  const { companySlug, category, employeeName, projectName } = params;
  const base = `Company_Storage/${companySlug}`;

  switch (category) {
    case "employees": {
      const empFolder = employeeName?.trim() || "Unknown";
      return `${base}/Employees/${empFolder}/`;
    }
    case "payments":
      return `${base}/Payments/`;
    case "projects": {
      const projFolder = projectName?.trim() || "Unknown";
      return `${base}/Projects/${projFolder}/`;
    }
    case "company-storage":
      return `${base}/Company Storage/`;
    case "attendance":
      return `${base}/Attendance/`;
    default:
      return `${base}/`;
  }
}

interface FileNameParams {
  companyId: string;
  /** The upload input's file name (original) */
  originalFileName: string;
  /** Employee emp_id (e.g. RT0001VX26). Include for employee-related uploads. */
  empId?: string;
  /** Override the date stamp if needed */
  date?: Date;
}

/**
 * Builds the standardized storage filename.
 *
 * Employee-related: {companyId}_{empId}_{sanitizedName}_{DDMMYYYY}.{ext}
 * Non-employee:     {companyId}_{sanitizedName}_{DDMMYYYY}.{ext}
 */
export function buildStorageFileName(params: FileNameParams): string {
  const { companyId, originalFileName, empId, date } = params;
  const sanitized = sanitizeFileName(originalFileName);
  const dateStamp = getDateStamp(date);
  const ext = getFileExtension(originalFileName);

  if (empId) {
    return `${companyId}_${empId}_${sanitized}_${dateStamp}.${ext}`;
  }
  return `${companyId}_${sanitized}_${dateStamp}.${ext}`;
}

// ─── Unified Upload Function ────────────────────────────

interface UploadParams {
  companyId: string;
  companySlug: string;
  category: StorageCategory;
  file: File;
  /** Custom category name to use instead of original filename (e.g. "NRIC_Front") */
  categoryName?: string;
  /** Employee's emp_id field (e.g. RT0001VX26) for employee-related uploads */
  empId?: string;
  /** Employee's display name (for folder path) */
  employeeName?: string;
  /** Project name (for folder path) */
  projectName?: string;
}

/**
 * Uploads a file to Supabase storage using the standardized folder structure
 * and naming convention. Returns the full storage path on success.
 */
export async function uploadToCompanyStorage(
  supabase: any,
  params: UploadParams
): Promise<string> {
  const {
    companyId,
    companySlug,
    category,
    file,
    categoryName,
    empId,
    employeeName,
    projectName,
  } = params;

  // Build the folder path
  const folderPath = getStorageFolderPath({
    companySlug,
    category,
    employeeName,
    projectName,
  });

  // Build the filename — use categoryName if provided, else original filename
  const nameForFile = categoryName
    ? `${categoryName}.${getFileExtension(file.name)}`
    : file.name;

  const fileName = buildStorageFileName({
    companyId,
    originalFileName: nameForFile,
    empId,
  });

  const fullPath = `${folderPath}${fileName}`;

  const { error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(fullPath, file, { upsert: true });

  if (error) {
    console.error(`Storage upload error [${category}]:`, error);
    throw new Error(`Failed to upload ${file.name}: ${error.message}`);
  }

  return fullPath;
}
