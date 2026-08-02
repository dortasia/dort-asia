"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ChevronDown, SlidersHorizontal, Download, ChevronLeft, Briefcase, MapPin, Gift, CreditCard, FileText, MoreVertical, ChevronsUpDown, ChevronRight, X, Check, Layers, Printer } from "lucide-react";

const payoutData = [
  {
    id: 1,
    date: "31 May 2024",
    time: "Fri, 10:30 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "May 2024",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  },
  {
    id: 2,
    date: "15 May 2024",
    time: "Wed, 02:15 PM",
    typeTitle: "Performance Bonus",
    typeSub: "Q1 2024 Bonus",
    typeIcon: Gift,
    iconColor: "text-[#AF52DE]",
    iconBg: "bg-[#AF52DE]/10",
    period: "Q1 2024",
    amount: "S$ 1,500.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Receipt"
  },
  {
    id: 3,
    date: "30 Apr 2024",
    time: "Tue, 09:45 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "Apr 2024",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  },
  {
    id: 4,
    date: "10 Apr 2024",
    time: "Wed, 11:20 AM",
    typeTitle: "Reimbursement",
    typeSub: "Office Equipment",
    typeIcon: CreditCard,
    iconColor: "text-[#FF9500]",
    iconBg: "bg-[#FF9500]/10",
    period: "Apr 2024",
    amount: "S$ 280.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Receipt"
  },
  {
    id: 5,
    date: "31 Mar 2024",
    time: "Sun, 10:30 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "Mar 2024",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  },
  {
    id: 6,
    date: "15 Mar 2024",
    time: "Fri, 04:15 PM",
    typeTitle: "Other Payment",
    typeSub: "Referral Bonus",
    typeIcon: Gift,
    iconColor: "text-[#AF52DE]",
    iconBg: "bg-[#AF52DE]/10",
    period: "Mar 2024",
    amount: "S$ 500.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Receipt"
  },
  {
    id: 7,
    date: "29 Feb 2024",
    time: "Thu, 10:30 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "Feb 2024",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  },
  {
    id: 8,
    date: "10 Feb 2024",
    time: "Mon, 11:20 AM",
    typeTitle: "Reimbursement",
    typeSub: "Travel Expenses",
    typeIcon: CreditCard,
    iconColor: "text-[#FF9500]",
    iconBg: "bg-[#FF9500]/10",
    period: "Feb 2024",
    amount: "S$ 450.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Receipt"
  },
  {
    id: 9,
    date: "31 Jan 2024",
    time: "Wed, 10:30 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "Jan 2024",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  },
  {
    id: 10,
    date: "15 Jan 2024",
    time: "Mon, 02:15 PM",
    typeTitle: "Performance Bonus",
    typeSub: "Annual Bonus 2023",
    typeIcon: Gift,
    iconColor: "text-[#AF52DE]",
    iconBg: "bg-[#AF52DE]/10",
    period: "Q4 2023",
    amount: "S$ 5,000.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Receipt"
  },
  {
    id: 11,
    date: "31 Dec 2023",
    time: "Sun, 10:30 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "Dec 2023",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  },
  {
    id: 12,
    date: "15 Dec 2023",
    time: "Fri, 11:20 AM",
    typeTitle: "Reimbursement",
    typeSub: "Software Subscription",
    typeIcon: CreditCard,
    iconColor: "text-[#FF9500]",
    iconBg: "bg-[#FF9500]/10",
    period: "Dec 2023",
    amount: "S$ 120.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Receipt"
  },
  {
    id: 13,
    date: "30 Nov 2023",
    time: "Thu, 10:30 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "Nov 2023",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  },
  {
    id: 14,
    date: "15 Nov 2023",
    time: "Wed, 04:15 PM",
    typeTitle: "Other Payment",
    typeSub: "Festival Allowance",
    typeIcon: Gift,
    iconColor: "text-[#AF52DE]",
    iconBg: "bg-[#AF52DE]/10",
    period: "Nov 2023",
    amount: "S$ 300.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Receipt"
  },
  {
    id: 15,
    date: "31 Oct 2023",
    time: "Tue, 10:30 AM",
    typeTitle: "Salary",
    typeSub: "Monthly Salary",
    typeIcon: Briefcase,
    iconColor: "text-[#007AFF]",
    iconBg: "bg-[#007AFF]/10",
    period: "Oct 2023",
    amount: "S$ 3,200.00",
    method: "Bank Transfer",
    methodSub: "DBS •••• 1234",
    status: "Paid",
    actionText: "View Payslip"
  }
];

export default function PayoutHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const supabase = createClient();
  
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payslip generation states
  const [selectedPayoutForPayslip, setSelectedPayoutForPayslip] = useState<any>(null);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("Acme Corp Pte. Ltd.");
  const [payrollConfig, setPayrollConfig] = useState<any>(null);
  const [payslipZoom, setPayslipZoom] = useState(80);
  const [payslipFrameSize, setPayslipFrameSize] = useState<"a4-portrait" | "a4-landscape">("a4-portrait");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("March 2026");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalItems = 15;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const paginatedPayouts = payoutData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const months = [
    "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
    "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [empRes, compRes] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('company_settings')
          .select('company_name, attendance_config, logo_url')
          .eq('company_id', user.id)
          .maybeSingle()
      ]);

      if (empRes.error) {
        console.error("[Payroll History] Error fetching employee:", empRes.error);
      }
      if (!empRes.error && empRes.data) {
        setEmployee(empRes.data);
      }
      if (compRes && compRes.data) {
        if (compRes.data.company_name) {
          setCompanyName(compRes.data.company_name);
        }
        const pConfig = compRes.data.attendance_config?.payroll_config || {};
        setPayrollConfig({
          payslipLogo: pConfig.payslipLogo || compRes.data.logo_url || "",
          payslipAddress: pConfig.payslipAddress || "",
          payslipFooter: pConfig.payslipFooter || "",
          showCPF: pConfig.showCPF ?? true,
          showTax: pConfig.showTax ?? true,
          signatureName: pConfig.signatureName || "",
          signatureRole: pConfig.signatureRole || "",
          signatureUrl: pConfig.signatureUrl || "",
          selectedTheme: pConfig.selectedTheme || "classic",
          templateSections: (pConfig.templateSections && Array.isArray(pConfig.templateSections)) ? pConfig.templateSections : null
        });
      }
      setLoading(false);
    }
    loadData();
  }, [id, supabase]);

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!employee) return <div className="flex-1 flex items-center justify-center text-red-500">Employee not found</div>;

  const renderPayslipGeneratorModal = () => {
    if (!payslipModalOpen || !selectedPayoutForPayslip) return null;

    const row = selectedPayoutForPayslip;
    const emp = employee;
    const baseSalary = emp.salary || 6000;
    const netPay = parseFloat(row.amount.replace(/[^0-9.]/g, "")) || 3200;

    const isForeign = !!(emp.work_pass_type || emp.identity_type === "FIN" || emp.custom_fields?.identityType === "FIN");
    
    let cpfEmployee = 0;
    let cdac = 0;
    if (!isForeign) {
      cpfEmployee = Math.min(1200, baseSalary * 0.2);
      cdac = 1;
    }

    const calculatedDeductionsTotal = cpfEmployee + cdac;
    const grossPay = baseSalary;
    
    const otherDiff = netPay - (grossPay - calculatedDeductionsTotal);

    let finalAllowance = 0;
    let finalOtherDeduction = 0;

    if (otherDiff > 0) {
      finalAllowance = otherDiff;
    } else if (otherDiff < 0) {
      finalOtherDeduction = -otherDiff;
    }

    const deductionTotal = calculatedDeductionsTotal + finalOtherDeduction;

    const employeeDeductions: { label: string; value: string }[] = [];
    if (cpfEmployee > 0) {
      employeeDeductions.push({ label: "CPF (Employee)", value: cpfEmployee.toFixed(2) });
    }
    if (cdac > 0) {
      employeeDeductions.push({ label: "CDAC/SINDA", value: cdac.toFixed(2) });
    }
    if (finalOtherDeduction > 0) {
      employeeDeductions.push({ label: "Other Deductions", value: finalOtherDeduction.toFixed(2) });
    }

    const employerContributions: { label: string; value: string }[] = [];
    if (!isForeign) {
      const cpfEmployer = Math.min(1020, baseSalary * 0.17);
      employerContributions.push({ label: "CPF (Employer)", value: cpfEmployer.toFixed(2) });
      const sdf = Math.max(2, Math.min(11.25, baseSalary * 0.0025));
      employerContributions.push({ label: "SDF", value: sdf.toFixed(2) });
    } else {
      const fwl = 300;
      employerContributions.push({ label: "Foreign Worker Levy (Employer)", value: fwl.toFixed(2) });
      const sdf = Math.max(2, Math.min(11.25, baseSalary * 0.0025));
      employerContributions.push({ label: "SDF", value: sdf.toFixed(2) });
    }

    const bonuses: { label: string; value: string }[] = [];
    if (finalAllowance > 0) {
      bonuses.push({ label: "Variable Allowance", value: finalAllowance.toFixed(2) });
    }

    const getPayPeriod = (monthYear: string) => {
      const parts = monthYear.split(" ");
      const month = parts[0];
      const year = parseInt(parts[1]) || new Date().getFullYear();
      const monthIndex = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(month);
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      return `01–${lastDay} ${month} ${year}`;
    };

    const frame = {
      "a4-portrait": { width: 794, height: 1123, label: "A4 Portrait", dpi96: "794 × 1123 px" },
      "a4-landscape": { width: 1123, height: 794, label: "A4 Landscape", dpi96: "1123 × 794 px" },
    }[payslipFrameSize];

    const scaledW = frame.width * (payslipZoom / 100);
    const scaledH = frame.height * (payslipZoom / 100);

    const selectedTheme = payrollConfig?.selectedTheme || "classic";
    const activeSections = payrollConfig?.templateSections || DEFAULT_SECTIONS;

    const handlePrint = () => {
      const element = document.getElementById("payslip-print-container");
      if (!element) return;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${emp.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
              body { margin: 0; padding: 0; background: white; }
              #payslip-print-container {
                width: ${frame.width}px;
                height: ${frame.height}px;
                box-sizing: border-box;
                font-family: ${selectedTheme === "modern" ? "'Inter', sans-serif" : selectedTheme === "minimalist" ? "'Courier New', monospace" : "Georgia, serif"};
              }
              @page { size: ${payslipFrameSize === "a4-portrait" ? "A4 portrait" : "A4 landscape"}; margin: 0; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div id="payslip-print-container">
              ${element.innerHTML}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    const handleDownloadHTML = () => {
      const element = document.getElementById("payslip-print-container");
      if (!element) return;
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${emp.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: #F0F2F5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .payslip-container {
      width: ${frame.width}px;
      height: ${frame.height}px;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      box-sizing: border-box;
      font-family: ${selectedTheme === "modern" ? "'Inter', sans-serif" : selectedTheme === "minimalist" ? "'Courier New', monospace" : "Georgia, serif"};
    }
    @page { size: ${payslipFrameSize === "a4-portrait" ? "A4 portrait" : "A4 landscape"}; margin: 0; }
    @media print {
      body { background: white; }
      .payslip-container { box-shadow: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    ${element.innerHTML}
  </div>
</body>
</html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${emp.name.toLowerCase().replace(/\s+/g, "-")}-${row.period.toLowerCase().replace(/\s+/g, "-")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#F0F2F5] text-gray-900 animate-in fade-in duration-300">
        {/* Topbar toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0 h-14 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#007AFF]" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-900 leading-tight">Payslip Generator</p>
              <p className="text-[11px] text-gray-400 font-medium leading-none">{emp.name} · {frame.label}</p>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-xl px-2 py-1">
            <button
              onClick={() => setPayslipZoom((z) => Math.max(25, z - 15))}
              disabled={payslipZoom <= 25}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-all disabled:opacity-30 font-black text-[14px]"
            >
              −
            </button>
            <span className="text-[12px] font-bold text-gray-700 w-12 text-center block select-none">
              {payslipZoom}%
            </span>
            <button
              onClick={() => setPayslipZoom((z) => Math.min(150, z + 15))}
              disabled={payslipZoom >= 150}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-all disabled:opacity-30 font-black text-[14px]"
            >
              +
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Frame size selection */}
            <select
              value={payslipFrameSize}
              onChange={(e: any) => setPayslipFrameSize(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            >
              <option value="a4-portrait">A4 Portrait (794 × 1123 px)</option>
              <option value="a4-landscape">A4 Landscape (1123 × 794 px)</option>
            </select>

            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-bold rounded-xl transition-all border border-gray-200"
            >
              <Download className="w-4 h-4" />
              Download HTML
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13px] font-bold rounded-xl transition-all shadow-md shadow-[#007AFF]/10"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              onClick={() => {
                setPayslipModalOpen(false);
                setSelectedPayoutForPayslip(null);
              }}
              className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Canvas Area */}
        <div
          className="flex-1 overflow-auto flex items-start justify-center p-10 bg-[#E8EAED]"
          style={{ backgroundImage: "radial-gradient(circle, #d0d3d8 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        >
          <div style={{ width: scaledW, height: scaledH, flexShrink: 0, position: "relative" }}>
            <div
              id="payslip-print-container"
              style={{
                width: frame.width,
                height: frame.height,
                transform: `scale(${payslipZoom / 100})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
                background: "#FFFFFF",
                boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                boxSizing: "border-box",
                paddingTop: 40,
                paddingBottom: 40,
                fontFamily:
                  selectedTheme === "modern"
                    ? "'Inter', sans-serif"
                    : selectedTheme === "minimalist"
                    ? "'Courier New', monospace"
                    : "Georgia, serif",
              }}
            >
              {activeSections
                .filter((s: any) => s.visible)
                .map((s: any) => {
                  if (s.type === "header") {
                    return (
                      <div key={s.id} style={{ textAlign: s.align, background: s.bgColor, padding: "24px 32px", borderBottom: "2px solid #E5E7EB" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: s.align === "center" ? "center" : s.align === "right" ? "flex-end" : "flex-start" }}>
                          {payrollConfig?.payslipLogo && <img src={payrollConfig.payslipLogo} alt="logo" style={{ width: 50, height: 50, objectFit: "contain", borderRadius: 8 }} />}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: s.fontSize, color: s.color, fontStyle: s.italic ? "italic" : "normal" }}>{companyName}</div>
                            <div style={{ fontSize: 11, color: "#6B7280" }}>{payrollConfig?.payslipAddress || "Company Address"}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginTop: 12, letterSpacing: 1.5 }}>PAYSLIP — {row.period.toUpperCase()}</div>
                      </div>
                    );
                  }

                  if (s.type === "employee_info") {
                    const isNric = !!(emp.nric_number || emp.custom_fields?.nricNumber || emp.identity_type === "NRIC" || (emp.custom_fields?.identityType === "NRIC"));
                    const idNumber = isNric
                      ? (emp.nric_number || emp.custom_fields?.nricNumber || emp.nric || "—")
                      : (emp.fin_number || emp.custom_fields?.finNumber || "—");
                    const bankName = emp.bank_name || "DBS Bank";
                    const accNo = emp.account_number ? `•••• •••• ${emp.account_number.slice(-4)}` : "•••• •••• 7171";
                    
                    return (
                      <div key={s.id} style={{ background: s.bgColor, padding: "16px 32px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" }}>EMPLOYEE DETAILS</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px" }}>
                          {[
                            ["Employee Name", emp.name],
                            ["Employee ID", emp.emp_id || emp.employee_id || "—"],
                            ["Department", emp.departments?.name || emp.department || "—"],
                            ["Designation", emp.job_role || emp.designation || emp.role || "—"],
                            ["Pay Period", getPayPeriod(row.period)],
                            [isNric ? "NRIC Number" : "FIN Number", idNumber],
                            ["Bank Account", `${bankName} (${accNo})`]
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: s.fontSize - 1, color: s.color, borderBottom: "1px solid #F3F4F6", paddingBottom: 4 }}>
                              <span style={{ color: "#8E8E93", fontWeight: 500 }}>{k}</span>
                              <span style={{ fontWeight: 600 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (s.type === "earnings") {
                    return (
                      <div key={s.id} style={{ background: s.bgColor, padding: "16px 32px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" }}>EARNINGS</div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: s.fontSize - 1 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left" }}>
                              <th style={{ padding: "6px 0", color: "#6B7280", fontWeight: 600 }}>Item Description</th>
                              <th style={{ padding: "6px 0", textAlign: "right", color: "#6B7280", fontWeight: 600 }}>Amount (SGD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                              <td style={{ padding: "8px 0", color: s.color, fontWeight: 500 }}>Basic Salary</td>
                              <td style={{ padding: "8px 0", textAlign: "right", color: s.color, fontWeight: 600 }}>{baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            {bonuses.map((b: any, idx: number) => {
                              const val = parseFloat(b.value.replace(/,/g, "")) || 0;
                              return (
                                <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                  <td style={{ padding: "8px 0", color: s.color }}>{b.label}</td>
                                  <td style={{ padding: "8px 0", textAlign: "right", color: s.color, fontWeight: 600 }}>{val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (s.type === "deductions") {
                    return (
                      <div key={s.id} style={{ background: s.bgColor, padding: "16px 32px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" }}>DEDUCTIONS</div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: s.fontSize - 1 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left" }}>
                              <th style={{ padding: "6px 0", color: "#6B7280", fontWeight: 600 }}>Deduction Item</th>
                              <th style={{ padding: "6px 0", textAlign: "right", color: "#6B7280", fontWeight: 600 }}>Amount (SGD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeDeductions.length === 0 ? (
                              <tr>
                                <td colSpan={2} style={{ padding: "8px 0", color: "#9CA3AF", fontStyle: "italic" }}>No deductions</td>
                              </tr>
                            ) : (
                              employeeDeductions.map((d: any, idx: number) => {
                                const val = parseFloat(d.value.replace(/,/g, "")) || 0;
                                return (
                                  <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                    <td style={{ padding: "8px 0", color: s.color }}>{d.label}</td>
                                    <td style={{ padding: "8px 0", textAlign: "right", color: "#EF4444", fontWeight: 600 }}>-{val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                        
                        {payrollConfig?.showCPF && employerContributions.length > 0 && (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#8E8E93", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>EMPLOYER CONTRIBUTIONS (Informational)</div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: s.fontSize - 2 }}>
                              <tbody>
                                {employerContributions.map((d: any, idx: number) => {
                                  const val = parseFloat(d.value.replace(/,/g, "")) || 0;
                                  return (
                                    <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                      <td style={{ padding: "6px 0", color: "#6B7280" }}>{d.label}</td>
                                      <td style={{ padding: "6px 0", textAlign: "right", color: "#4B5563", fontWeight: 600 }}>{val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (s.type === "net_pay") {
                    const bankName = emp.bank_name || "DBS Bank";
                    const accNo = emp.account_number ? `•••• •••• ${emp.account_number.slice(-4)}` : "•••• •••• 7171";
                    const paymentDate = row.date;

                    return (
                      <div key={s.id} style={{ background: s.bgColor, padding: "16px 32px", borderRadius: 8, margin: "0 24px", textAlign: s.align }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: s.fontSize - 1 }}>
                          <span style={{ color: "#6B7280", fontWeight: 500 }}>Gross Pay: S${grossPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          <span style={{ color: "#6B7280", fontWeight: 500 }}>Total Deductions: S${deductionTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div style={{ borderTop: "1px dashed #D1D5DB", margin: "8px 0" }} />
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#007AFF", letterSpacing: 1.2, marginBottom: 4 }}>NET PAY</div>
                        <div style={{ fontSize: s.fontSize + 8, fontWeight: 800, color: s.color }}>SGD {netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Credited to {bankName} ({accNo}) on {paymentDate}</div>
                      </div>
                    );
                  }

                  if (s.type === "divider") {
                    return (
                      <div key={s.id} style={{ padding: "8px 32px", background: s.bgColor }}>
                        <div style={{ height: 1, background: s.color }} />
                      </div>
                    );
                  }

                  if (s.type === "footer") {
                    return (
                      <div key={s.id} style={{ background: s.bgColor, padding: "16px 32px", textAlign: s.align }}>
                        <div style={{ fontSize: s.fontSize, color: s.color, fontStyle: s.italic ? "italic" : "normal" }}>
                          {payrollConfig?.payslipFooter || "This is a computer-generated payslip. No signature required unless requested."}
                        </div>
                        <div style={{ marginTop: 16, display: "flex", justifyContent: s.align === "center" ? "center" : s.align === "right" ? "flex-end" : "flex-start", gap: 32 }}>
                          <div style={{ fontSize: 11, textAlign: "center", color: "#8E8E93" }}>
                            {payrollConfig?.signatureUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={payrollConfig.signatureUrl} alt="Signature" style={{ maxHeight: 40, objectFit: "contain", marginBottom: 4, margin: s.align === "center" ? "0 auto" : s.align === "right" ? "0 0 0 auto" : "0 auto 0 0" }} />
                            ) : (
                              <div style={{ width: 80, height: 1, background: "#D1D5DB", marginBottom: 4, margin: s.align === "center" ? "0 auto" : s.align === "right" ? "0 0 0 auto" : "0 auto 0 0" }} />
                            )}
                            <div style={{ fontWeight: 600, color: "#374151" }}>{payrollConfig?.signatureName || "Authorized Signatory"}</div>
                            <div style={{ fontSize: 10 }}>{payrollConfig?.signatureRole || "Finance Manager"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (s.type === "custom_text") {
                    return (
                      <div key={s.id} style={{ background: s.bgColor, padding: "12px 32px", textAlign: s.align, fontSize: s.fontSize, color: s.color, fontWeight: s.bold ? 700 : 400, fontStyle: s.italic ? "italic" : "normal" }}>
                        {s.content || ""}
                      </div>
                    );
                  }

                  return null;
                })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderPayslipGeneratorModal()}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#121217] overflow-y-auto page-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <h1 className="text-[20px] font-bold text-gray-900 dark:text-white">Employee Payout</h1>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[14px] font-bold text-[#007AFF] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <main className="px-8 pb-8 flex flex-col gap-8">
        {/* Top Row: Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 items-stretch">
          {/* Employee Profile Card */}
          <div className="bg-[#F4F5F7] dark:bg-[#1C1C1E] rounded-3xl p-6 flex items-center gap-6 h-full">
            <div className="h-24 w-24 bg-white dark:bg-[#34C759]/10 border border-[#34C759] rounded-[24px] flex items-center justify-center shrink-0">
              <span className="text-[36px] font-medium text-[#34C759]">
                {employee.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "KK"}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-[22px] font-bold text-gray-900 dark:text-white leading-tight">{employee.name || "Arjun Mehta"}</h2>
                <div className="bg-[#F0F5FF] dark:bg-[#007AFF]/10 text-[#007AFF] px-2.5 py-0.5 rounded-md text-[12px] font-bold">
                  {employee.employee_id || "EMP12345"}
                </div>
              </div>
              <p className="text-[14px] font-medium text-[#8E8E93]">
                {employee.job_role || "Product Designer"} <span className="mx-1.5">&bull;</span> {employee.department || "Design Team"}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[#8E8E93]">
                  <Briefcase className="h-[14px] w-[14px]" />
                  <span className="text-[13px] font-medium">Joined on 15 Jan 2022</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#8E8E93]">
                  <MapPin className="h-[14px] w-[14px]" />
                  <span className="text-[13px] font-medium">Singapore</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Summary Card */}
          <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[24px] p-6 flex flex-col h-full justify-center">
            <div className="flex items-center justify-between pb-5 border-b border-[#E5E7EB] dark:border-[#2C2C35]">
              <h3 className="text-[14px] font-bold text-[#8E8E93] tracking-wide">Payout Summary</h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#8E8E93]">Financial Year</span>
                <span className="text-[13px] font-bold text-gray-900 dark:text-white">Jan 2026 - Dec 2026</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 pt-5">
              <div className="flex flex-col gap-1.5 pr-4 border-r border-[#E5E7EB] dark:border-[#2C2C35]">
                <div className="flex items-center gap-2">
                  <div className="h-[18px] w-[18px] rounded-[6px] bg-[#BFD8FF] dark:bg-[#007AFF]/20" />
                  <span className="text-[13px] font-medium text-gray-900 dark:text-[#A1A1AA]">Total Payouts</span>
                </div>
                <span className="text-[24px] font-medium text-[#34C759] mt-1">S$ 12,000</span>
                <span className="text-[11px] font-medium text-[#8E8E93]">12 Transactions</span>
              </div>

              <div className="flex flex-col gap-1.5 px-4 border-r border-[#E5E7EB] dark:border-[#2C2C35]">
                <div className="flex items-center gap-2">
                  <div className="h-[18px] w-[18px] rounded-[6px] bg-[#BFD8FF] dark:bg-[#007AFF]/20" />
                  <span className="text-[13px] font-medium text-gray-900 dark:text-[#A1A1AA]">Company Taxes</span>
                </div>
                <span className="text-[24px] font-medium text-[#34C759] mt-1">S$ 12,000</span>
                <span className="text-[11px] font-medium text-[#8E8E93]">12 Transactions</span>
              </div>

              <div className="flex flex-col gap-1.5 px-4 border-r border-[#E5E7EB] dark:border-[#2C2C35]">
                <div className="flex items-center gap-2">
                  <div className="h-[18px] w-[18px] rounded-[6px] bg-[#BFD8FF] dark:bg-[#007AFF]/20" />
                  <span className="text-[13px] font-medium text-gray-900 dark:text-[#A1A1AA]">Total Bonuses</span>
                </div>
                <span className="text-[24px] font-medium text-[#34C759] mt-1">S$ 12,000</span>
                <span className="text-[11px] font-medium text-[#8E8E93]">12 Transactions</span>
              </div>

              <div className="flex flex-col gap-1.5 pl-4">
                <div className="flex items-center gap-2">
                  <div className="h-[18px] w-[18px] rounded-[6px] bg-[#BFD8FF] dark:bg-[#007AFF]/20" />
                  <span className="text-[13px] font-medium text-gray-900 dark:text-[#A1A1AA]">Balance Debut</span>
                </div>
                <span className="text-[24px] font-medium text-[#34C759] mt-1">S$ 12,000</span>
                <span className="text-[11px] font-medium text-[#8E8E93]">4 Pendings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Info & Bank Details */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 items-start mt-2">
          {/* Work Info Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Work Info</h3>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Employee ID</span>
                <span className="text-[15px] font-medium text-gray-900 dark:text-white">{employee.employee_id || "EMP001"}</span>
              </div>
              <div className="flex flex-col gap-1.5 flex-[1.5]">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Current Project</span>
                <span className="text-[15px] font-medium text-gray-900 dark:text-white">{employee.current_project || "Marina Bay Sans"}</span>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Experience</span>
                <span className="text-[15px] font-medium text-gray-900 dark:text-white">1 year</span>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Upcoming Payout</span>
                <span className="text-[15px] font-medium text-gray-900 dark:text-white">03 Jan 2026</span>
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Bank Details</h3>
            <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1 overflow-x-auto scrollbar-hide">
                {(() => {
                  const getLogoSrc = () => {
                    const bank = (employee.bank_name || "").toLowerCase();
                    if (bank.includes("ocbc")) return "/Bank logo/Logo-ocbc.svg";
                    if (bank.includes("uob")) return "/Bank logo/UOB_Logo_(2022) (1).svg";
                    if (bank.includes("scb") || bank.includes("standard")) return "/Bank logo/SCBLogo.svg";
                    if (bank.includes("citi")) return "/Bank logo/Citilogo.svg";
                    if (bank.includes("cimb")) return "/Bank logo/CIMBLogo.svg";
                    if (bank.includes("dbs") || bank.includes("posb")) return "/Bank logo/DBSlogo.svg";
                    return "";
                  };
                  const src = getLogoSrc();
                  if (src) {
                    return (
                      <div className="w-[80px] h-[40px] flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={employee.bank_name || "Bank"}
                          className="max-h-[30px] max-w-full object-contain"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="w-[80px] h-[40px] bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-150 dark:border-white/5 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none select-none">
                        NO LOGO
                      </span>
                    </div>
                  );
                })()}
                <div className="w-px h-10 bg-[#E5E7EB] dark:bg-[#2C2C35] shrink-0" />
                <div className="flex flex-col gap-1 shrink-0 flex-1">
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Bank name</span>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-white">{employee.bank_name || "DBS"}</span>
                </div>
                <div className="flex flex-col gap-1 shrink-0 flex-[1.5]">
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Account Holder Name</span>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-white">{employee.name || "Krishna Kumar"} P</span>
                </div>
                <div className="flex flex-col gap-1 shrink-0 flex-1">
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Account Number</span>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-white">****7739</span>
                </div>
                <div className="flex flex-col gap-1 shrink-0 flex-1">
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Branch</span>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-white">Edho oru Idam</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[20px] font-bold text-[#1C1C22] dark:text-white tracking-wide">Payments</h3>
          
          <div className="flex items-center justify-between">
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="bg-[#FCFCFC] dark:bg-[#1C1C1E] border border-[#F2F2F7] dark:border-[#2C2C35] rounded-full px-6 py-2.5 flex items-center gap-8 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className="text-[15px] font-medium text-[#1C1C22] dark:text-white">{selectedMonth}</span>
                <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isMonthDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-[#1C1C1E] border border-[#F2F2F7] dark:border-[#2C2C35] rounded-2xl shadow-xl z-40 py-2 animate-in fade-in zoom-in duration-200">
                  <div className="max-h-[300px] overflow-y-auto px-2">
                    {months.map((month) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                          selectedMonth === month 
                            ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                            : 'text-[#1C1C22] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        {month}
                        {selectedMonth === month && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="h-11 w-11 flex items-center justify-center bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] text-[#8E8E93] hover:text-[#007AFF] transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button className="h-11 w-11 flex items-center justify-center bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] text-[#8E8E93] hover:text-[#007AFF] transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] border border-[#F2F2F7] dark:border-[#2C2C35] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#F2F2F7] dark:border-[#2C2C35] bg-[#FBFBFB] dark:bg-[#1C1C1E]">
                    <th className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#8E8E93]">
                        Date <ChevronsUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93]">Payment</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93]">For Period</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93]">Amount</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93]">Payment Method</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93]">Status</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayouts.map((row, idx) => (
                    <React.Fragment key={row.id}>
                      <tr className={`${idx !== payoutData.length - 1 || expandedRows.includes(row.id) ? 'border-b border-[#F2F2F7] dark:border-[#2C2C35]' : ''} hover:bg-[#F9F9FB] dark:hover:bg-white/5 transition-colors`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleRow(row.id)}
                              className={`h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${expandedRows.includes(row.id) ? 'bg-gray-100 dark:bg-white/10' : ''}`}
                            >
                              <ChevronRight className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${expandedRows.includes(row.id) ? 'rotate-90' : ''}`} />
                            </button>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] font-bold text-[#1C1C22] dark:text-white">{row.date}</span>
                              <span className="text-[12px] font-medium text-[#8E8E93]">{row.time}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 ${row.iconBg}`}>
                              <row.typeIcon className={`h-5 w-5 ${row.iconColor}`} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] font-bold text-[#1C1C22] dark:text-white">{row.typeTitle}</span>
                              <span className="text-[12px] font-medium text-[#8E8E93]">{row.typeSub}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[14px] font-bold text-[#1C1C22] dark:text-white">{row.period}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[14px] font-bold text-[#34C759]">{row.amount}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[14px] font-bold text-[#1C1C22] dark:text-white">{row.method}</span>
                            <span className="text-[12px] font-medium text-[#8E8E93]">{row.methodSub}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-[#34C759]/10 text-[#34C759] text-[12px] font-bold rounded-full">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => {
                                if (row.actionText === "View Payslip") {
                                  setSelectedPayoutForPayslip(row);
                                  setPayslipModalOpen(true);
                                } else {
                                  alert("Receipt viewer coming soon!");
                                }
                              }}
                              className="flex items-center gap-1.5 text-[13px] font-bold text-[#007AFF] hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              {row.actionText}
                            </button>
                            <button className="text-[#8E8E93] hover:text-[#1C1C22] dark:hover:text-white">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.includes(row.id) && (
                        <tr className="bg-[#F9F9FB] dark:bg-white/[0.02]">
                          <td colSpan={7} className="px-6 py-6 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                            <div className="grid grid-cols-4 gap-8">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Basic Salary</span>
                                <span className="text-[15px] font-bold text-[#1C1C22] dark:text-white">S$ 6,000.00</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Bonus</span>
                                <span className="text-[15px] font-bold text-[#34C759]">S$ 600.00</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Deductions</span>
                                <span className="text-[15px] font-bold text-[#FF3B30]">S$ 150.00</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Net Payout</span>
                                <span className="text-[15px] font-bold text-[#007AFF]">S$ 6,450.00</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#F2F2F7] dark:border-[#2C2C35] bg-[#FBFBFB] dark:bg-[#1C1C1E]">
              <div className="flex items-center gap-6">
                <span className="text-[13px] font-medium text-[#8E8E93]">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} transactions
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#8E8E93]">Show:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-[13px] font-bold text-[#1C1C22] dark:text-white border-none focus:ring-0 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg border border-[#F2F2F7] dark:border-[#2C2C35] transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#8E8E93] hover:bg-[#F9F9FB] dark:hover:bg-white/5'}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 text-[13px] ${
                      currentPage === page 
                        ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold shadow-sm' 
                        : 'border border-[#F2F2F7] dark:border-[#2C2C35] text-[#1C1C22] dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg border border-[#F2F2F7] dark:border-[#2C2C35] transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-[#8E8E93] hover:bg-[#F9F9FB] dark:hover:bg-white/5'}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Filter Side Panel */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-[400px] bg-white dark:bg-[#1C1C1E] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <h2 className="text-[18px] font-bold text-[#1C1C22] dark:text-white">Filters</h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              {/* Status Filter */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[14px] font-bold text-[#8E8E93] uppercase tracking-wider">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['Paid', 'Pending', 'Processing', 'Failed'].map((status) => (
                    <button 
                      key={status}
                      className="px-4 py-2 rounded-xl border border-[#F2F2F7] dark:border-[#2C2C35] text-[13px] font-medium text-[#1C1C22] dark:text-white hover:border-[#007AFF] hover:text-[#007AFF] transition-all"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout Type Filter */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[14px] font-bold text-[#8E8E93] uppercase tracking-wider">Payout Type</h3>
                <div className="flex flex-col gap-2">
                  {['Salary', 'Performance Bonus', 'Reimbursement', 'Other Payment'].map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <div className="h-5 w-5 rounded border border-[#E5E7EB] dark:border-[#2C2C35] flex items-center justify-center group-hover:border-[#007AFF] transition-colors">
                        <div className="h-2.5 w-2.5 rounded-sm bg-[#007AFF] opacity-0 group-hover:opacity-10" />
                      </div>
                      <span className="text-[14px] font-medium text-[#1C1C22] dark:text-white">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount Range */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[14px] font-bold text-[#8E8E93] uppercase tracking-wider">Amount Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-[#8E8E93] uppercase">Min Amount</span>
                    <input 
                      type="text" 
                      placeholder="S$ 0"
                      className="w-full px-4 py-3 rounded-xl border border-[#F2F2F7] dark:border-[#2C2C35] bg-transparent text-[14px] focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-[#8E8E93] uppercase">Max Amount</span>
                    <input 
                      type="text" 
                      placeholder="S$ 10,000"
                      className="w-full px-4 py-3 rounded-xl border border-[#F2F2F7] dark:border-[#2C2C35] bg-transparent text-[14px] focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[14px] font-bold text-[#8E8E93] uppercase tracking-wider">Date</h3>
                <div className="flex flex-col gap-3">
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 rounded-xl border border-[#F2F2F7] dark:border-[#2C2C35] bg-transparent text-[14px] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35] grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="px-6 py-3 rounded-xl border border-[#F2F2F7] dark:border-[#2C2C35] text-[14px] font-bold text-[#8E8E93] hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="px-6 py-3 rounded-xl bg-[#007AFF] text-white text-[14px] font-bold hover:bg-[#007AFF]/90 transition-colors shadow-lg shadow-[#007AFF]/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

const DEFAULT_SECTIONS = [
  { id: "s1", type: "header", label: "Company Header", visible: true, align: "center", bold: true, italic: false, fontSize: 16, color: "#111827", bgColor: "#F8F9FA", content: "" },
  { id: "s2", type: "employee_info", label: "Employee Information", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s3", type: "earnings", label: "Earnings Breakdown", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s4", type: "deductions", label: "Deductions", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s5", type: "net_pay", label: "Net Pay Summary", visible: true, align: "right", bold: true, italic: false, fontSize: 15, color: "#007AFF", bgColor: "#EFF6FF", content: "" },
  { id: "s6", type: "divider", label: "Divider Line", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#E5E7EB", bgColor: "#FFFFFF", content: "" },
  { id: "s7", type: "footer", label: "Footer & Signature", visible: true, align: "center", bold: false, italic: true, fontSize: 11, color: "#9CA3AF", bgColor: "#FFFFFF", content: "" },
];
