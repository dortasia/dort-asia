/**
 * Generates an Excel-compatible template for employee bulk upload.
 * Uses pure browser APIs (no Node.js dependencies) so it works with Turbopack.
 */

interface Department {
  id: string;
  name: string;
}

/**
 * Generates and downloads a CSV file that acts as an employee bulk-upload template.
 * (Replaces the previous exceljs-based implementation for Turbopack compatibility.)
 */
export function generateExcelTemplate(departments: Department[]): void {
  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Mobile",
    "Date of Birth (DD/MM/YYYY)",
    "Gender",
    "Nationality",
    "Department",
    "Job Role / Designation",
    "Job Type",
    "Date of Joining (DD/MM/YYYY)",
    "Salary",
    "NRIC / FIN",
    "Work Pass Type",
    "Work Pass Expiry (DD/MM/YYYY)",
    "Bank Name",
    "Bank Account Number",
    "Emergency Contact Name",
    "Emergency Contact Phone",
  ];

  const deptNote =
    departments.length > 0
      ? `Available Departments: ${departments.map((d) => d.name).join(", ")}`
      : "No departments configured yet.";

  // Build CSV rows
  const rows: string[][] = [
    headers,
    // Example row
    [
      "John",
      "Doe",
      "john.doe@example.com",
      "91234567",
      "01/01/1990",
      "Male",
      "Singaporean",
      departments[0]?.name ?? "Engineering",
      "Software Engineer",
      "Full Time",
      "01/01/2024",
      "5000",
      "S1234567A",
      "",
      "",
      "DBS",
      "123456789",
      "Jane Doe",
      "98765432",
    ],
  ];

  // Convert to CSV string
  const csvContent = [
    `# Employee Bulk Upload Template — ${deptNote}`,
    `# Do not modify the header row. Delete this comment row before uploading.`,
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape cells with commas or quotes
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    ),
  ].join("\r\n");

  // Trigger download
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "employee_upload_template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
