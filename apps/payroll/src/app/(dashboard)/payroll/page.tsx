"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Search, SlidersHorizontal, Download, ChevronDown, MoreVertical, Pencil, Clock, Wallet, FileText, X, Plus, Trash2, Receipt, UserPlus, PieChart, Users, ChevronLeft, Edit3, Layers, Eye, Printer } from "lucide-react";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";
import { generatePaymentId } from "@/utils/paymentIdHelper";
import { useAppStore } from "@/store";

const PROJECT_DATA = [
  { 
    id: 'PRJ001', name: 'Website Redesign', employees: 12, base: 72000, bonus: 0, deductions: 0, net: 72000, date: '12 Jun 2026', status: 'Pending',
    client: 'Dort-Asia Group', location: 'Singapore, Jurong East', acquiredBy: 'Saravanan', grossProfit: 150000, netProfit: 85000, taxes: 12000, expenses: 45000
  },
  { 
    id: 'PRJ002', name: 'Mobile App Development', employees: 18, base: 108000, bonus: 0, deductions: 0, net: 108000, date: '12 Jun 2026', status: 'Pending',
    client: 'RNS Technology', location: 'Malaysia, Kuala Lumpur', acquiredBy: 'Saravanan', grossProfit: 220000, netProfit: 130000, taxes: 18000, expenses: 62000
  },
  { 
    id: 'PRJ003', name: 'Marketing Campaign', employees: 8, base: 48000, bonus: 0, deductions: 0, net: 48000, date: '12 Jun 2026', status: 'Pending',
    client: 'Global Reach Corp', location: 'Singapore, Marina Bay', acquiredBy: 'Dinesh', grossProfit: 95000, netProfit: 55000, taxes: 7500, expenses: 28000
  },
  { 
    id: 'PRJ004', name: 'Product Research', employees: 6, base: 36000, bonus: 0, deductions: 0, net: 36000, date: '12 Jun 2026', status: 'Pending',
    client: 'Innovation Labs', location: 'Singapore, Science Park', acquiredBy: 'Saravanan', grossProfit: 72000, netProfit: 42000, taxes: 5800, expenses: 22000
  },
  { 
    id: 'PRJ005', name: 'Customer Support', employees: 10, base: 60000, bonus: 0, deductions: 0, net: 60000, date: '12 Jun 2026', status: 'Pending',
    client: 'Service First Ltd', location: 'Singapore, Changi', acquiredBy: 'Saravanan', grossProfit: 115000, netProfit: 68000, taxes: 9200, expenses: 34000
  },
];

const PROJECT_EQUITY_HOLDERS = [
  { name: "Saravanan", share: 40, role: "Director", color: "#007AFF" },
  { name: "Dinesh Kumar", share: 30, role: "Partner", color: "#34C759" },
  { name: "Anjali Devi", share: 20, role: "Stakeholder", color: "#5856D6" },
  { name: "Ramesh Babu", share: 10, role: "Investor", color: "#FF9500" },
];

export default function PayrollPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Cache and state hydration
  const { cachedPayroll, setCachedPayroll } = useAppStore();
  
  const [mounted, setMounted] = useState(false);
  const [employees, setEmployees] = useState<any[]>(() => cachedPayroll?.employees || []);
  const [loading, setLoading] = useState(() => !cachedPayroll);
  const [paidEmployeeIds, setPaidEmployeeIds] = useState<string[]>([]);
  const [dbPaidEmployeeIdsByMonth, setDbPaidEmployeeIdsByMonth] = useState<Record<string, string[]>>(() => cachedPayroll?.dbPaidEmployeeIdsByMonth || {});
  const [dbDepartments, setDbDepartments] = useState<string[]>(() => cachedPayroll?.dbDepartments || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeToggle, setActiveToggle] = useState<"Paid" | "Pending">("Pending");
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null);
  const [showFullAcc, setShowFullAcc] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Dynamic months list from January of the current year to the current month of the current year
  const monthsList = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth(); // 0-indexed
    const list = [];
    for (let i = 0; i <= currentMonthIndex; i++) {
      list.push(`${months[i]} ${currentYear}`);
    }
    return list;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(monthsList[monthsList.length - 1] || "May 2026");
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  useEffect(() => {
    setPaidEmployeeIds(dbPaidEmployeeIdsByMonth[selectedMonth] || []);
  }, [selectedMonth, dbPaidEmployeeIdsByMonth]);

  const [userBanks, setUserBanks] = useState<any[]>(() => cachedPayroll?.userBanks || []);


  // ── Reset Payroll Payments ──
  const [showResetPayrollConfirm, setShowResetPayrollConfirm] = useState(false);
  const [isResettingPayroll, setIsResettingPayroll] = useState(false);

  const resetPayrollData = async () => {
    try {
      setIsResettingPayroll(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('company_settings')
        .select('attendance_config')
        .eq('company_id', user.id)
        .maybeSingle();

      const currentConfig = data?.attendance_config || {};

      // Remove only payroll-related transactions; keep all others
      const existingTransactions: any[] = currentConfig.transactions || [];
      const nonPayrollTransactions = existingTransactions.filter((tx: any) => {
        const cat = (tx.category || '').toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        return !(
          cat === 'employee-expense' ||
          cat === 'payroll-payment' ||
          desc.includes('payroll') ||
          desc.includes('monthly salary')
        );
      });

      const clearedConfig = {
        ...currentConfig,
        paid_employee_ids: {},
        transactions: nonPayrollTransactions,
      };

      await supabase
        .from('company_settings')
        .update({ attendance_config: clearedConfig })
        .eq('company_id', user.id);

      setDbPaidEmployeeIdsByMonth({});
      setPaidEmployeeIds([]);
      setShowResetPayrollConfirm(false);
    } catch (e) {
      console.error('Error resetting payroll data:', e);
    } finally {
      setIsResettingPayroll(false);
    }
  };


  const resolveBankLogo = (logoPath: string) => {
    if (!logoPath) return "/Bank logo/DBSlogo.svg";
    if (logoPath === '/Bank logo/CIMB.svg') {
      return '/Bank logo/CIMBLogo.svg';
    }
    return logoPath;
  };

  const getShortFormAccount = (bank: any) => {
    if (!bank) return "DBS-7171";
    const accountStr = bank.account || "";
    let shortForm = bank.name || "";
    
    const lowerName = shortForm.toLowerCase();
    if (lowerName.includes("standard") || lowerName.includes("scb") || lowerName.includes("chartered")) {
      shortForm = "SCB";
    } else if (lowerName.includes("cimb")) {
      shortForm = "CIMB";
    } else if (lowerName.includes("dbs")) {
      shortForm = "DBS";
    } else if (lowerName.includes("ocbc")) {
      shortForm = "OCBC";
    } else if (lowerName.includes("uob")) {
      shortForm = "UOB";
    } else if (lowerName.includes("citi")) {
      shortForm = "Citi";
    }
    
    const parts = accountStr.split("-");
    const accNum = parts[parts.length - 1] || "";
    return `${shortForm}-${accNum}`;
  };

  const parseBankDisplay = (bank: any) => {
    if (!bank) return { fullName: "Company Bank", displayAccount: "Bank Account" };
    const accountStr = bank.account || "";
    let shortForm = bank.name || "";
    let fullName = "Company Bank";
    
    const lowerName = shortForm.toLowerCase();
    if (lowerName.includes("standard") || lowerName.includes("scb") || lowerName.includes("chartered")) {
      fullName = "Standard Chartered Bank";
      shortForm = "SCB";
    } else if (lowerName.includes("cimb")) {
      fullName = "Commerce International Merchant Bankers";
      shortForm = "CIMB";
    } else if (lowerName.includes("dbs")) {
      fullName = "DBS Bank";
      shortForm = "DBS";
    } else if (lowerName.includes("ocbc")) {
      fullName = "OCBC Bank";
      shortForm = "OCBC";
    } else if (lowerName.includes("uob")) {
      fullName = "UOB Bank";
      shortForm = "UOB";
    } else if (lowerName.includes("citi")) {
      fullName = "Citibank";
      shortForm = "Citi";
    }

    const parts = accountStr.split("-");
    const accNum = parts[parts.length - 1] || "";
    const suffix = accNum.slice(-4) || "7171";
    
    return {
      fullName,
      displayAccount: `${shortForm}-${suffix}`
    };
  };

  const handleDeductBankBalance = async () => {
    if (!paymentPanelData) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalNetPay = paymentPanelData.employees.reduce((sum, emp) => sum + getEmployeeNetPay(emp), 0);

      // Fetch latest company settings
      const { data: compSettings, error: fetchErr } = await supabase
        .from('company_settings')
        .select('attendance_config')
        .eq('company_id', user.id)
        .maybeSingle();

      if (fetchErr || !compSettings) {
        console.error("Fetch settings error:", fetchErr);
        return;
      }

      const currentConfig = compSettings.attendance_config || {};
      const existingBanks = currentConfig.company_banks || [];
      const existingTransactions = currentConfig.transactions || [];
      const existingPaidMap = currentConfig.paid_employee_ids || {};
      const currentMonthPaid = existingPaidMap[selectedMonth] || [];
      const newlyPaidIds = paymentPanelData.employees.map((e: any) => e.id);
      const updatedMonthPaid = Array.from(new Set([...currentMonthPaid, ...newlyPaidIds]));
      const updatedPaidMap = {
        ...existingPaidMap,
        [selectedMonth]: updatedMonthPaid
      };

      // Update bank balance
      const updatedBanks = existingBanks.map((b: any) => {
        if (authPaymentMethod !== 'Cash' && b.id === authPaymentBank) {
          const currentBal = parseFloat(b.balance) || 0;
          return { ...b, balance: currentBal - totalNetPay };
        }
        return b;
      });

      // Add a transaction record for payroll payouts!
      const txId = generatePaymentId("send", companyName);
      const newTransaction = {
        id: txId,
        date: new Date().toISOString().split('T')[0],
        type: 'send', // Send / Debit
        category: 'employee-expense',
        purpose: 'Monthly Salary',
        amount: totalNetPay,
        bankId: authPaymentMethod === 'Cash' ? 'cash-drawer' : authPaymentBank,
        bankName: authPaymentMethod === 'Cash' ? 'Hand Cash' : (existingBanks.find((b: any) => b.id === authPaymentBank)?.name || 'DBS Bank'),
        description: `Payroll payout for ${paymentPanelData.employees.length} selected employee(s) - ${selectedMonth}`,
        details: {
          purpose: 'Monthly Salary',
          ref: txId,
          paymentMethod: authPaymentMethod,
          employeeCount: paymentPanelData.employees.length,
          month: selectedMonth
        }
      };

      const updatedConfig = {
        ...currentConfig,
        company_banks: updatedBanks,
        transactions: [newTransaction, ...existingTransactions],
        paid_employee_ids: updatedPaidMap
      };

      const { error } = await supabase
        .from('company_settings')
        .update({ attendance_config: updatedConfig })
        .eq('company_id', user.id);

      if (error) {
        console.error("Save settings error:", error);
      } else {
        // Update local state so bank list balances are refreshed instantly!
        const userOnlyBanks = updatedBanks.filter((b: any) => b.id !== 'dbs' && b.id !== 'ocbc' && b.id !== 'uob');
        setUserBanks(userOnlyBanks);
        setDbPaidEmployeeIdsByMonth(updatedPaidMap);
        // Immediately persist to Zustand cache so paid status survives navigation
        setCachedPayroll({
          employees,
          dbPaidEmployeeIdsByMonth: updatedPaidMap,
          dbDepartments,
          userBanks: userOnlyBanks,
          companyName,
          payrollConfig,
        });
      }
    } catch (err) {
      console.error("Deduct bank balance error:", err);
    }
  };

  // Payslip generation states
  const [selectedEmpForPayslip, setSelectedEmpForPayslip] = useState<any>(null);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState(() => cachedPayroll?.companyName || "Acme Corp Pte. Ltd.");
  const [payrollConfig, setPayrollConfig] = useState<any>(() => cachedPayroll?.payrollConfig || null);

  // Auto-sync all key payroll state back to Zustand cache whenever data mutates post-load.
  // This ensures paid status, salary edits, and bank changes survive navigation (no more reloads).
  useEffect(() => {
    if (loading) return; // Don't overwrite cache during initial Supabase fetch
    setCachedPayroll({
      employees,
      dbPaidEmployeeIdsByMonth,
      dbDepartments,
      userBanks,
      companyName,
      payrollConfig,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, dbPaidEmployeeIdsByMonth, userBanks, companyName, payrollConfig, loading]);

  const [payslipZoom, setPayslipZoom] = useState(80);
  const [payslipFrameSize, setPayslipFrameSize] = useState<"a4-portrait" | "a4-landscape">("a4-portrait");

  // Downside Payment panel state
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);
  const [paymentPanelClosing, setPaymentPanelClosing] = useState(false);
  const [paymentPanelData, setPaymentPanelData] = useState<{
    type: "single" | "bulk";
    employees: any[];
  } | null>(null);
  const [paymentPin, setPaymentPin] = useState("");
  const [paymentPinError, setPaymentPinError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1); // 1 = Summary, 2 = PIN/Caution, 3 = Success

  const closePaymentPanel = () => {
    setPaymentPanelClosing(true);
    setTimeout(() => {
      setPaymentPanelOpen(false);
      setPaymentPanelClosing(false);
      setPaymentPanelData(null);
      setPaymentPin("");
      setPaymentPinError("");
      setPaymentSuccess(false);
      setPaymentStep(1);
      setSelectedEmpIds([]);
    }, 300);
  };

  const handleUndoPayment = async (empId: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: compSettings } = await supabase
        .from('company_settings')
        .select('attendance_config')
        .eq('company_id', user.id)
        .maybeSingle();

      if (!compSettings) return;

      const currentConfig = compSettings.attendance_config || {};
      const existingPaidMap = currentConfig.paid_employee_ids || {};
      const currentMonthPaid = existingPaidMap[selectedMonth] || [];
      const updatedMonthPaid = currentMonthPaid.filter((id: string) => id !== empId);
      
      const updatedPaidMap = {
        ...existingPaidMap,
        [selectedMonth]: updatedMonthPaid
      };

      const updatedConfig = {
        ...currentConfig,
        paid_employee_ids: updatedPaidMap
      };

      const { error } = await supabase
        .from('company_settings')
        .update({ attendance_config: updatedConfig })
        .eq('company_id', user.id);

      if (error) {
        console.error("Undo payment error:", error);
        alert("Failed to undo payment: " + error.message);
      } else {
        setDbPaidEmployeeIdsByMonth(updatedPaidMap);
        alert("Payment undone successfully!");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error undoing payment: " + e.message);
    }
  };

  const openSinglePaymentPanel = (emp: any) => {
    setPaymentPanelData({
      type: "single",
      employees: [emp]
    });
    setPaymentPanelOpen(true);
    setPaymentPanelClosing(false);
    setPaymentPin("");
    setPaymentPinError("");
    setPaymentSuccess(false);
    setPaymentStep(1);

    const isCash = emp.payment_method === "Cash" || emp.custom_fields?.payment_method === "Cash";
    setAuthPaymentMethod(isCash ? "Cash" : "Bank Transfer");

    const bankName = (emp.bank_name || emp.custom_fields?.bank_name || "").toLowerCase();
    const matchedBank = userBanks.find(b => bankName && (b.id.toLowerCase().includes(bankName) || b.name.toLowerCase().includes(bankName) || b.account.toLowerCase().includes(bankName)));
    if (matchedBank) {
      setAuthPaymentBank(matchedBank.id);
    } else if (userBanks.length > 0) {
      setAuthPaymentBank(userBanks[0].id);
    } else {
      setAuthPaymentBank("dbs");
    }
  };

  const openBulkPaymentPanel = () => {
    const selectedEmployees = employees.filter(emp => selectedEmpIds.includes(emp.id));
    setPaymentPanelData({
      type: "bulk",
      employees: selectedEmployees
    });
    setPaymentPanelOpen(true);
    setPaymentPanelClosing(false);
    setPaymentPin("");
    setPaymentPinError("");
    setPaymentSuccess(false);
    setPaymentStep(1);
    setAuthPaymentMethod("Bank Transfer");
    if (userBanks.length > 0) {
      setAuthPaymentBank(userBanks[0].id);
    } else {
      setAuthPaymentBank("dbs");
    }
  };

  // Edit Payment Sidebar
  const [editEmp, setEditEmp] = useState<any | null>(null);
  const [editClosing, setEditClosing] = useState(false);
  const [editBaseSalary, setEditBaseSalary] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentTime, setEditPaymentTime] = useState("12:00");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [editBonuses, setEditBonuses] = useState([
    { label: "Overtime", value: "" },
    { label: "Allowance", value: "" },
    { label: "Bonus", value: "" }
  ]);
  const [editDeductions, setEditDeductions] = useState([
    { label: "CPF (Employee)", value: "" },
    { label: "CPF (Employer)", value: "" },
    { label: "SINDA", value: "" },
    { label: "CDAC", value: "" },
    { label: "SDF", value: "" },
  ]);

  // Advance Payment Sidebar
  const [advanceEmp, setAdvanceEmp] = useState<any | null>(null);
  const [advanceClosing, setAdvanceClosing] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [advanceRepayMonth, setAdvanceRepayMonth] = useState("");
  const [advanceMethod, setAdvanceMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [advanceBank, setAdvanceBank] = useState<any | null>(null);
  const [authPaymentMethod, setAuthPaymentMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [authPaymentBank, setAuthPaymentBank] = useState<string>("dbs");

  const COMPANY_BANKS = [
    { id: 'dbs', logo: '/Bank logo/DBSlogo.svg', name: 'DBS Bank', account: 'DBS-7171', color: '#FF0000' },
    { id: 'ocbc', logo: '/Bank logo/Logo-ocbc.svg', name: 'OCBC Bank', account: 'OCBC-7171', color: '#ED1C24' },
    { id: 'uob', logo: '/Bank logo/UOB_Logo_(2022) (1).svg', name: 'UOB Bank', account: 'UOB-7171', color: '#003876' },
    { id: 'scb', logo: '/Bank logo/SCBLogo.svg', name: 'SCB Bank', account: 'SCB-7171', color: '#009444' },
    { id: 'citi', logo: '/Bank logo/Citilogo.svg', name: 'Citi Bank', account: 'Citi-7171', color: '#003A70' },
    { id: 'cimb', logo: '/Bank logo/CIMBLogo.svg', name: 'CIMB Bank', account: 'CIMB-7171', color: '#E50019' },
  ];

  const handleIssueAdvancePayment = async () => {
    if (!advanceEmp || !advanceAmount) {
      alert("Please fill in the advance details first.");
      return;
    }
    const parsedAmount = parseFloat(parseAmount(advanceAmount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const baseSalary = getEmployeeBaseSalary(advanceEmp);
    const limit = getEligibleLimit(baseSalary);
    if (parsedAmount > limit) {
      alert(`Advance amount cannot exceed the 50% limit of S$ ${limit.toLocaleString()}`);
      return;
    }

    if (advanceMethod === "Bank Transfer" && !advanceBank) {
      alert("Please select a bank account to pay from.");
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch latest company settings
      const { data: compCheck, error: fetchErr } = await supabase
        .from("company_settings")
        .select("company_name, attendance_config")
        .eq("company_id", user.id)
        .maybeSingle();

      if (fetchErr || !compCheck) {
        console.error("Fetch settings error:", fetchErr);
        alert("Failed to fetch settings.");
        return;
      }

      const companyName = compCheck.company_name;
      const currentConfig = compCheck.attendance_config || {};
      const existingBanks = currentConfig.company_banks || [];
      const existingTransactions = currentConfig.transactions || [];

      // 2. Update Bank Balance (if Bank Transfer)
      let updatedBanksList = [...existingBanks];
      if (advanceMethod === "Bank Transfer") {
        updatedBanksList = existingBanks.map((b: any) => {
          if (b.id === advanceBank) {
            const currentBal = parseFloat(b.balance) || 0;
            return { ...b, balance: currentBal - parsedAmount };
          }
          return b;
        });
      }

      // 3. Create Transaction Record
      const txId = generatePaymentId("send", companyName);
      const newTransaction = {
        id: txId,
        date: new Date().toISOString().split('T')[0],
        type: 'send', // Send / Debit
        category: 'employee-expense',
        purpose: 'Advance Salary',
        amount: parsedAmount,
        bankId: advanceMethod === 'Cash' ? 'cash-drawer' : advanceBank,
        bankName: advanceMethod === 'Cash' ? 'Hand Cash' : (existingBanks.find((b: any) => b.id === advanceBank)?.name || 'DBS Bank'),
        description: `Advance salary payout of S$ ${parsedAmount} to ${advanceEmp.name} - Reason: ${advanceReason || 'N/A'}`,
        details: {
          purpose: 'Advance Salary',
          ref: txId,
          paymentMethod: advanceMethod,
          employeeId: advanceEmp.id,
          employeeName: advanceEmp.name,
          repayMonth: advanceRepayMonth || selectedMonth
        },
        createdAt: new Date().toISOString()
      };

      const updatedConfig = {
        ...currentConfig,
        company_banks: updatedBanksList,
        transactions: [newTransaction, ...existingTransactions]
      };

      // Update Supabase company settings
      const { error: settingsError } = await supabase
        .from('company_settings')
        .update({ attendance_config: updatedConfig })
        .eq('company_id', user.id);

      if (settingsError) throw settingsError;

      // 4. Add Deduction to Employee Custom Fields
      const employeeCustomFields = advanceEmp.custom_fields || {};
      const payrollSettings = employeeCustomFields.payroll_settings || {
        baseSalary: String(baseSalary),
        bonuses: [],
        deductions: [],
        paymentDate: "12"
      };

      const existingDeductions = payrollSettings.deductions || [];
      const updatedDeductions = [
        ...existingDeductions,
        {
          label: `Salary Advance (${advanceRepayMonth || selectedMonth})`,
          value: formatAmount(String(parsedAmount))
        }
      ];

      const updatedCustomFields = {
        ...employeeCustomFields,
        payroll_settings: {
          ...payrollSettings,
          deductions: updatedDeductions
        }
      };

      const { error: empError } = await supabase
        .from('employees')
        .update({
          custom_fields: updatedCustomFields
        })
        .eq('id', advanceEmp.id);

      if (empError) throw empError;

      // 5. Update local state
      setEmployees(prev => prev.map(e => {
        if (e.id === advanceEmp.id) {
          return {
            ...e,
            custom_fields: updatedCustomFields
          };
        }
        return e;
      }));
      const userOnlyBanks = updatedBanksList.filter((b: any) => b.id !== 'dbs' && b.id !== 'ocbc' && b.id !== 'uob');
      setUserBanks(userOnlyBanks);

      alert(`Advance payment of S$ ${parsedAmount.toLocaleString()} successfully processed and registered as a deduction!`);
      closeAdvancePanel();
    } catch (e: any) {
      console.error(e);
      alert("Failed to process advance: " + e.message);
    }
  };

  const openAdvancePanel = (emp: any) => {
    setAdvanceEmp(emp);
    setAdvanceClosing(false);
    setAdvanceAmount("");
    setAdvanceReason("");
    setAdvanceRepayMonth("");
    setAdvanceMethod("Bank Transfer");
    if (userBanks.length > 0) {
      setAdvanceBank(userBanks[0].id);
    } else {
      setAdvanceBank(null);
    }
  };

  const closeAdvancePanel = () => {
    setAdvanceClosing(true);
    setTimeout(() => { setAdvanceEmp(null); setAdvanceClosing(false); }, 300);
  };

  const getEligibleLimit = (salary: number) => salary * 0.5; // 50% of salary
  const getRemainingEligible = (salary: number, entered: string) => {
    const limit = getEligibleLimit(salary);
    const amount = parseFloat(parseAmount(entered)) || 0;
    return Math.max(0, limit - amount);
  };

  // Filter Sidebar State
  const [showFilter, setShowFilter] = useState(false);
  const [filterClosing, setFilterClosing] = useState(false);
  
  // Add Expense Sidebar State
  const [expenseProj, setExpenseProj] = useState<any | null>(null);
  const [expenseClosing, setExpenseClosing] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseMethod, setExpenseMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [expenseBank, setExpenseBank] = useState<any | null>(null);

  // Add Temporary Employee Sidebar State
  const [tempEmpProj, setTempEmpProj] = useState<any | null>(null);
  const [tempEmpClosing, setTempEmpClosing] = useState(false);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [tempCountry, setTempCountry] = useState("Singapore");
  const [tempIdNumber, setTempIdNumber] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempUseCurrentDate, setTempUseCurrentDate] = useState(false);
  const [tempEndDate, setTempEndDate] = useState("");
  const [tempWorkerId, setTempWorkerId] = useState("");
  const [tempContact, setTempContact] = useState("");
  const [tempDesignation, setTempDesignation] = useState("");
  const [tempCustomDesignation, setTempCustomDesignation] = useState("");
  const [tempSalary, setTempSalary] = useState("");
  const [tempBankName, setTempBankName] = useState("");
  const [tempAccountNum, setTempAccountNum] = useState("");
  const [tempEmpStep, setTempEmpStep] = useState(1);
  const [tempPaymentMethod, setTempPaymentMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [tempPaymentBank, setTempPaymentBank] = useState<any | null>(null);

  // Project Equity Sidebar State
  const [equityProj, setEquityProj] = useState<any | null>(null);
  const [equityClosing, setEquityClosing] = useState(false);
  const [equityShares, setEquityShares] = useState<number[]>([]);
  const [isEquityEditing, setIsEquityEditing] = useState(false);

  const openEquityPanel = (proj: any) => {
    setEquityProj(proj);
    setEquityClosing(false);
    setEquityShares(PROJECT_EQUITY_HOLDERS.map(h => h.share));
    setIsEquityEditing(false);
  };

  const closeEquityPanel = () => {
    setEquityClosing(true);
    setTimeout(() => { setEquityProj(null); setEquityClosing(false); }, 300);
  };

  const openTempEmpPanel = (proj: any) => {
    setTempEmpProj(proj);
    setTempEmpClosing(false);
    setTempFirstName("");
    setTempLastName("");
    setTempCountry("Singapore");
    setTempIdNumber("");
    setTempStartDate("");
    setTempUseCurrentDate(false);
    setTempEndDate("");
    const randomId = `TEMP-${Math.floor(1000 + Math.random() * 9000)}`;
    setTempWorkerId(randomId);
    setTempContact("");
    setTempDesignation("");
    setTempCustomDesignation("");
    setTempSalary("");
    setTempBankName("");
    setTempAccountNum("");
    setTempEmpStep(1);
    setTempPaymentMethod("Bank Transfer");
    setTempPaymentBank(null);
  };

  const closeTempEmpPanel = () => {
    setTempEmpClosing(true);
    setTimeout(() => { setTempEmpProj(null); setTempEmpClosing(false); }, 300);
  };

  const openExpensePanel = (proj: any) => {
    setExpenseProj(proj);
    setExpenseClosing(false);
    setExpenseAmount("");
    setExpenseCategory("");
    setCustomCategory("");
    setExpenseDescription("");
    setExpenseMethod("Bank Transfer");
    setExpenseBank(null);
  };

  const closeExpensePanel = () => {
    setExpenseClosing(true);
    setTimeout(() => { setExpenseProj(null); setExpenseClosing(false); }, 300);
  };
  
  const [appliedFilters, setAppliedFilters] = useState({
    dept: "",
    designation: "",
    minSalary: "",
    maxSalary: "",
    project: "",
    paymentStatus: ""
  });

  // Project Filter State
  const [appliedProjectFilters, setAppliedProjectFilters] = useState({
    status: "",
    minNet: "",
    maxNet: "",
    minEmployees: "",
    maxEmployees: ""
  });

  // Temporary filters (the ones changed in the sidebar before clicking Apply)
  const [tempFilters, setTempFilters] = useState({ ...appliedFilters });
  const [tempProjectFilters, setTempProjectFilters] = useState({ ...appliedProjectFilters });

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    closeFilterPanel();
  };

  const closeFilterPanel = () => {
    setFilterClosing(true);
    setTimeout(() => { setShowFilter(false); setFilterClosing(false); }, 300);
  };

  const clearFilters = () => {
    const empty = {
      dept: "",
      designation: "",
      minSalary: "",
      maxSalary: "",
      project: "",
      paymentStatus: ""
    };
    setTempFilters(empty);
    setAppliedFilters(empty);
  };

  const activeFilterCount = Object.values(appliedFilters).filter(val => val !== "").length;

  const getDefaultPaymentDate = (monthYearStr: string) => {
    const parts = monthYearStr.split(" ");
    const month = parts[0];
    let year = parseInt(parts[1]) || new Date().getFullYear();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(month);
    
    // Payment is on the 1st of the next month after the worked month
    // e.g. worked May 2025 → paid on 1 June 2025
    let nextMonthIndex = monthIndex + 1;
    let nextYear = year;
    if (nextMonthIndex > 11) {
      nextMonthIndex = 0; // January
      nextYear = year + 1; // Next year
    }
    
    const m = String(nextMonthIndex + 1).padStart(2, '0');
    
    return `${nextYear}-${m}-01`;
  };

  const getMonthRange = (monthYearStr: string) => {
    const parts = monthYearStr.split(" ");
    const month = parts[0];
    const year = parseInt(parts[1]) || new Date().getFullYear();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(month);
    const m = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : '05';
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return {
      min: `${year}-${m}-01`,
      max: `${year}-${m}-${lastDay}`
    };
  };

  const openEditPanel = (emp: any) => {
    setEditEmp(emp);
    setEditClosing(false);
    setShowSaveConfirm(false);
    
    const payrollSettings = emp.custom_fields?.payroll_settings;
    const baseSalary = payrollSettings ? parseFloat(payrollSettings.baseSalary) : (emp.salary || 6000);
    setEditBaseSalary(String(baseSalary));
    
    const defaultDate = payrollSettings?.paymentDate || getDefaultPaymentDate(selectedMonth);
    setEditPaymentDate(defaultDate);
    
    const defaultTime = payrollSettings?.paymentTime || "12:00";
    setEditPaymentTime(defaultTime);
    
    const customAllowances = emp.custom_fields?.allowances || [];
    let initialBonuses = [];
    if (payrollSettings) {
      initialBonuses = payrollSettings.bonuses || [];
    } else {
      initialBonuses = [
        { label: "Overtime", value: "" },
        { label: "Allowance", value: "" },
        { label: "Bonus", value: "" }
      ];
    }

    const combined = [...initialBonuses];
    customAllowances.forEach((a: any) => {
      const label = a.name || "Allowance";
      const val = typeof a.amount === 'string' ? a.amount : String(a.amount || 0);
      const exists = combined.some(c => c.label.toLowerCase() === label.toLowerCase());
      if (!exists && label.trim() !== "") {
        combined.push({ label, value: val });
      }
    });

    setEditBonuses(combined);
    setEditDeductions(getEmployeeActiveDeductions(emp, baseSalary));
  };

  const closeEditPanel = () => {
    setEditClosing(true);
    setTimeout(() => { setEditEmp(null); setEditClosing(false); }, 300);
  };

  const handleSaveChanges = async (saveToDb: boolean) => {
    if (!editEmp) return;
    
    const bonusesFiltered = editBonuses.filter(b => b.label.trim() !== "");
    const deductionsFiltered = editDeductions.filter(d => d.label.trim() !== "");
    
    // Update local employees state so it reflects instantly in the UI without page reload
    setEmployees(prev => prev.map(e => {
      if (e.id === editEmp.id) {
        const updatedCustomFields = {
          ...(e.custom_fields || {}),
          payroll_settings: {
            baseSalary: editBaseSalary,
            bonuses: bonusesFiltered,
            deductions: deductionsFiltered,
            paymentDate: editPaymentDate,
            paymentTime: editPaymentTime
          }
        };
        return {
          ...e,
          salary: parseFloat(editBaseSalary) || e.salary,
          custom_fields: updatedCustomFields
        };
      }
      return e;
    }));
    
    if (saveToDb) {
      try {
        const updatedCustomFields = {
          ...(editEmp.custom_fields || {}),
          payroll_settings: {
            baseSalary: editBaseSalary,
            bonuses: bonusesFiltered,
            deductions: deductionsFiltered,
            paymentDate: editPaymentDate,
            paymentTime: editPaymentTime
          }
        };
        
        const { error } = await supabase
          .from('employees')
          .update({
            salary: parseFloat(editBaseSalary) || null,
            custom_fields: updatedCustomFields
          })
          .eq('id', editEmp.id);
          
        if (error) {
          console.error("Failed to save payroll settings to database:", error.message);
        }
      } catch (err) {
        console.error("Error saving payroll settings:", err);
      }
    }
    
    setShowSaveConfirm(false);
    closeEditPanel();
  };

  const calcNetPay = () => {
    const base = parseFloat(editBaseSalary) || 0;
    const bonusTotal = editBonuses.reduce((s, b) => s + (parseFloat(parseAmount(b.value)) || 0), 0);
    const deductTotal = editDeductions.reduce((s, d) => {
      const lbl = d.label.toLowerCase();
      if (lbl.includes("employer") || lbl.includes("sdf") || lbl.includes("levy")) {
        return s;
      }
      return s + (parseFloat(parseAmount(d.value)) || 0);
    }, 0);
    return (base + bonusTotal - deductTotal).toLocaleString("en-SG", { minimumFractionDigits: 2 });
  };

  const isCompulsory = (label: string) => {
    if (!editEmp) return false;
    const isForeign = !!(editEmp.work_pass_type || editEmp.custom_fields?.identityType === "FIN") && !editEmp.nric_number && !editEmp.custom_fields?.nricNumber;
    const passType = editEmp.work_pass_type || "";
    const isSPassOrWorkPermit = passType.toLowerCase().includes("s pass") || passType.toLowerCase().includes("work permit");

    const lower = label.trim().toLowerCase();
    if (isForeign) {
      if (lower === "sdf") return true;
      if (lower === "income tax") return true;
      if (isSPassOrWorkPermit && (lower.includes("levy") || lower.includes("foreign worker levy"))) return true;
    } else {
      if (lower === "cpf (employee)" || lower === "cpf (employer)") return true;
      if (lower === "sdf") return true;
    }
    return false;
  };

  const formatAmount = (val: string) => {
    if (!val) return "";
    const cleanVal = val.replace(/,/g, "");
    const num = parseFloat(cleanVal);
    if (isNaN(num)) {
      const clean = val.replace(/[^0-9.]/g, "");
      if (!clean) return "";
      const parts = clean.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
      return parts.join(".");
    }
    
    // Round to 2 decimal places to prevent float residues like .00000000000006
    const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
    
    if (rounded % 1 === 0) {
      return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
      const parts = rounded.toFixed(2).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }
  };

  const parseAmount = (val: string) => val.replace(/,/g, "");

  const calculateCPF = (salary: number, dob: string | null) => {
    if (!dob) return { employee: 0, employer: 0 };
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    const cappedSalary = Math.min(salary, 6800);

    let empRate = 0;
    let erRate = 0;

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

  const getEmployeeProfileTaxes = (emp: any, baseSalary: number) => {
    const isForeign = !!(emp.work_pass_type || emp.custom_fields?.identityType === "FIN") && !emp.nric_number && !emp.custom_fields?.nricNumber;
    const isSPassOrWorkPermit = (emp.work_pass_type || "").toLowerCase().includes("s pass") || (emp.work_pass_type || "").toLowerCase().includes("work permit");

    // 1. Base calculations
    const defaultCpf = !isForeign ? calculateCPF(baseSalary, emp.date_of_birth) : { employee: 0, employer: 0 };
    const defaultSdl = Math.max(2, Math.min(11.25, baseSalary * 0.0025));

    // 2. Resolve Employee CPF (check custom override first)
    let cpfEmployee = defaultCpf.employee;
    if (emp.custom_fields?.customCpfEmployee !== undefined && emp.custom_fields?.customCpfEmployee !== "") {
      cpfEmployee = parseFloat(emp.custom_fields.customCpfEmployee) || 0;
    }

    // 3. Resolve Employer CPF
    let cpfEmployer = defaultCpf.employer;
    if (emp.custom_fields?.customCpfEmployer !== undefined && emp.custom_fields?.customCpfEmployer !== "") {
      cpfEmployer = parseFloat(emp.custom_fields.customCpfEmployer) || 0;
    }

    // 4. Resolve SDL (SDF)
    let sdl = defaultSdl;
    if (emp.custom_fields?.customSdl !== undefined && emp.custom_fields?.customSdl !== "") {
      sdl = parseFloat(emp.custom_fields.customSdl) || 0;
    }

    // 5. Resolve FWL (Foreign Worker Levy)
    let fwl = 0;
    if (isForeign && isSPassOrWorkPermit) {
      fwl = 300; // default FWL fallback
    }
    if (emp.custom_fields?.foreignWorkerLevy !== undefined && emp.custom_fields?.foreignWorkerLevy !== "") {
      fwl = parseFloat(emp.custom_fields.foreignWorkerLevy) || 0;
    }

    // 6. Resolve Self-Help Group (CDAC, SINDA, MBMF, ECF)
    let shgType = emp.custom_fields?.shgContribution || "None";
    let shgAmount = 0;
    if (!isForeign && (shgType === "None" || shgType === "")) {
      // Default fallback of $1 if a local has not set it
      shgAmount = 1;
      shgType = "CDAC"; // Default to CDAC for visual list fallback
    } else if (emp.custom_fields?.shgAmount !== undefined && emp.custom_fields?.shgAmount !== "") {
      shgAmount = parseFloat(emp.custom_fields.shgAmount) || 0;
    }

    // 7. Income tax
    let incomeTax = 0;
    if (emp.custom_fields?.monthlyTaxEstimate !== undefined && emp.custom_fields?.monthlyTaxEstimate !== "") {
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

  const getEmployeeActiveDeductions = (emp: any, baseSalary: number) => {
    const isForeign = !!(emp.work_pass_type || emp.custom_fields?.identityType === "FIN") && !emp.nric_number && !emp.custom_fields?.nricNumber;
    const passType = emp.work_pass_type || "";
    const isSPassOrWorkPermit = passType.toLowerCase().includes("s pass") || passType.toLowerCase().includes("work permit");

    const payrollSettings = emp.custom_fields?.payroll_settings;
    const taxes = getEmployeeProfileTaxes(emp, baseSalary);

    if (payrollSettings) {
      let finalDeductions = [...(payrollSettings.deductions || [])];
      if (isForeign) {
        // Remove SG Citizen / PR specific deductions
        finalDeductions = finalDeductions.filter((d: any) => {
          const lbl = d.label.toLowerCase();
          return !lbl.includes("cpf") && !lbl.includes("sinda") && !lbl.includes("cdac") && !lbl.includes("mbmf") && !lbl.includes("ecf");
        });
        // Ensure SDF exists
        if (!finalDeductions.some((d: any) => d.label.toLowerCase().includes("sdf"))) {
          finalDeductions.push({ label: "SDF", value: formatAmount(String(taxes.sdl)) });
        }
        // Ensure Income Tax exists
        if (!finalDeductions.some((d: any) => d.label.toLowerCase().includes("income tax"))) {
          finalDeductions.push({ label: "Income Tax", value: formatAmount(String(taxes.incomeTax)) });
        }
        // Ensure Levy exists if S Pass/Work Permit or custom levy configured
        if ((isSPassOrWorkPermit || taxes.fwl > 0) && !finalDeductions.some((d: any) => d.label.toLowerCase().includes("levy"))) {
          finalDeductions.push({ label: "Foreign Worker Levy (Employer)", value: formatAmount(String(taxes.fwl || 300)) });
        } else if (!isSPassOrWorkPermit && taxes.fwl === 0) {
          finalDeductions = finalDeductions.filter((d: any) => !d.label.toLowerCase().includes("levy"));
        }
      } else {
        // Singapore Resident
        // Remove Foreign Worker Levy
        finalDeductions = finalDeductions.filter((d: any) => !d.label.toLowerCase().includes("levy"));
        // Ensure CPF (Employee) and CPF (Employer) exist
        if (!finalDeductions.some((d: any) => d.label.toLowerCase() === "cpf (employee)")) {
          finalDeductions.unshift({ label: "CPF (Employee)", value: formatAmount(String(taxes.cpfEmployee)) });
        }
        if (!finalDeductions.some((d: any) => d.label.toLowerCase() === "cpf (employer)")) {
          const empCpfIdx = finalDeductions.findIndex((d: any) => d.label.toLowerCase() === "cpf (employee)");
          if (empCpfIdx !== -1) {
            finalDeductions.splice(empCpfIdx + 1, 0, { label: "CPF (Employer)", value: formatAmount(String(taxes.cpfEmployer)) });
          } else {
            finalDeductions.unshift({ label: "CPF (Employer)", value: formatAmount(String(taxes.cpfEmployer)) });
          }
        }
        // Ensure self-help group exists if taxes.shgAmount > 0
        if (taxes.shgAmount > 0 && !finalDeductions.some((d: any) => d.label.toLowerCase().includes(taxes.shgType.toLowerCase()))) {
          finalDeductions.push({ label: taxes.shgType, value: formatAmount(String(taxes.shgAmount)) });
        }
        // Ensure SDF exists
        if (!finalDeductions.some((d: any) => d.label.toLowerCase().includes("sdf"))) {
          finalDeductions.push({ label: "SDF", value: formatAmount(String(taxes.sdl)) });
        }
      }
      return finalDeductions;
    } else {
      // Dynamic default calculations from onboarding taxes:
      if (!isForeign) {
        return [
          { label: "CPF (Employee)", value: formatAmount(String(taxes.cpfEmployee)) },
          { label: "CPF (Employer)", value: formatAmount(String(taxes.cpfEmployer)) },
          ...(taxes.shgAmount > 0 ? [{ label: taxes.shgType, value: formatAmount(String(taxes.shgAmount)) }] : []),
          { label: "SDF", value: formatAmount(String(taxes.sdl)) },
        ];
      } else {
        const foreignDeductions = [
          ...(taxes.incomeTax > 0 ? [{ label: "Income Tax", value: formatAmount(String(taxes.incomeTax)) }] : []),
          { label: "SDF", value: formatAmount(String(taxes.sdl)) }
        ];
        if (isSPassOrWorkPermit || taxes.fwl > 0) {
          foreignDeductions.push({ label: "Foreign Worker Levy (Employer)", value: formatAmount(String(taxes.fwl || 300)) });
        }
        return foreignDeductions;
      }
    }
  };

  const getEmployeeBaseSalary = (emp: any) => {
    const payrollSettings = emp.custom_fields?.payroll_settings;
    return payrollSettings ? parseFloat(payrollSettings.baseSalary) : (emp.salary || 6000);
  };

  const getEmployeeNetPay = (emp: any) => {
    const payrollSettings = emp.custom_fields?.payroll_settings;
    const baseSalary = payrollSettings ? parseFloat(payrollSettings.baseSalary) : (emp.salary || 6000);
    
    const baseBonuses = payrollSettings?.bonuses || [];
    const customAllowances = (emp.custom_fields?.allowances || []).filter((ca: any) => 
      !baseBonuses.some((b: any) => b.label.toLowerCase() === (ca.name || "allowance").toLowerCase())
    );
    const customAllowancesSum = customAllowances.reduce((sum: number, a: any) => {
      const amt = typeof a.amount === 'string' ? parseFloat(a.amount.replace(/,/g, '')) : parseFloat(a.amount) || 0;
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const bonusTotal = baseBonuses.reduce((sum: number, b: any) => sum + (parseFloat(b.value.replace(/,/g, "")) || 0), 0) + customAllowancesSum;
         
    const activeDeductions = getEmployeeActiveDeductions(emp, baseSalary);

    const deductionTotal = activeDeductions.reduce((sum: number, d: any) => {
      const lbl = d.label.toLowerCase();
      if (lbl.includes("employer") || lbl.includes("sdf") || lbl.includes("levy")) {
        return sum;
      }
      return sum + (parseFloat(d.value.replace(/,/g, "")) || 0);
    }, 0);
       
    return baseSalary + bonusTotal - deductionTotal;
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleRow = (id: string | number) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
      setShowFullAcc(false);
    } else {
      setExpandedRowId(id);
      setShowFullAcc(false);
    }
  };

  const isProfileSetupComplete = (emp: any) => {
    if (!emp) return false;
    const cf = emp.custom_fields || {};

    // Phase 1 check: Personal Info
    const hasName = !!emp.name?.trim() || !!(cf.firstName?.trim() && cf.lastName?.trim());
    const hasDob = !!emp.date_of_birth || !!cf.dob;
    const hasGender = !!emp.gender || !!cf.gender;
    const hasMarital = !!cf.maritalStatus;
    const hasNationality = !!cf.nationality;
    const p1Finished = hasName && hasDob && hasGender && hasMarital && hasNationality;

    if (!p1Finished) return false;

    // Phase 2 check: Identity Info
    const identityType = cf.identityType || (emp.nric_number ? "NRIC" : emp.fin_number ? "FIN" : "");
    let p2Finished = false;
    if (identityType === "NRIC") {
      p2Finished = !!(emp.nric_number?.trim() || cf.nricNumber?.trim());
    } else if (identityType === "FIN") {
      p2Finished = !!(emp.fin_number?.trim() || cf.finNumber?.trim());
    } else {
      p2Finished = !!(emp.nric_number?.trim() || emp.fin_number?.trim() || cf.nricNumber?.trim() || cf.finNumber?.trim());
    }

    if (!p2Finished) return false;

    // Phase 3 check: Work Details
    const hasEmpId = !!emp.emp_id?.trim() || !!cf.empId?.trim();
    const hasJoiningDate = !!emp.date_of_joining || !!cf.dateOfJoining;
    const hasDept = emp.department_id !== undefined && emp.department_id !== null;
    const hasDesignation = !!emp.job_role?.trim() || !!cf.jobRole?.trim();
    const hasRole = !!emp.role?.trim();
    const hasSalary = (emp.salary !== undefined && emp.salary !== null) || (cf.payroll_settings?.baseSalary !== undefined) || (cf.salary !== undefined);
    const p3Finished = hasEmpId && hasJoiningDate && hasDept && hasDesignation && hasRole && hasSalary;

    if (!p3Finished) return false;

    // Phase 4 check: Tax Details
    // Tax details are implicitly finished if identity information (for CPF/Tax calculation) and base salary are present.
    const p4Finished = true;

    // Phase 10 check: Bank Details
    const hasBank = !!emp.bank_name?.trim() || !!cf.bankName?.trim();
    const hasAccHolder = !!emp.account_holder_name?.trim() || !!cf.accountHolder?.trim();
    const hasAccNum = !!emp.account_number?.trim() || !!cf.accountNum?.trim();
    const p10Finished = hasBank && hasAccHolder && hasAccNum;

    return p10Finished;
  };

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [empRes, deptRes, compRes] = await Promise.all([
        supabase
          .from('employees')
          .select('*, departments!employees_department_id_fkey(name)')
          .eq('company_id', user.id)
          .order('name', { ascending: true }),
        supabase
          .from('departments')
          .select('name')
          .eq('company_id', user.id)
          .order('name', { ascending: true }),
        supabase
          .from('company_settings')
          .select('company_name, attendance_config, logo_url')
          .eq('company_id', user.id)
          .maybeSingle()
      ]);

      let eligibleEmps = [];
      const deptNames = deptRes.data ? deptRes.data.map((d: any) => d.name) : dbDepartments;
      let resolvedBanks = userBanks;
      let resolvedCompanyName = companyName;
      let resolvedPConfig = payrollConfig;
      let resolvedPaidMap = dbPaidEmployeeIdsByMonth;
      
      if (empRes.error) {
        console.error("[Payroll] Error fetching employees:", empRes.error);
      }
      if (deptRes.error) {
        console.error("[Payroll] Error fetching departments:", deptRes.error);
      }
      if (!empRes.error && empRes.data) {
        eligibleEmps = empRes.data.filter(isProfileSetupComplete);
        setEmployees(eligibleEmps);
      }
      if (!deptRes.error && deptRes.data) {
        setDbDepartments(deptNames);
      }
      if (compRes && compRes.data) {
        if (compRes.data.company_name) {
          resolvedCompanyName = compRes.data.company_name;
          setCompanyName(resolvedCompanyName);
        }
        const pConfig = compRes.data.attendance_config?.payroll_config || {};
        resolvedPConfig = {
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
        };
        setPayrollConfig(resolvedPConfig);
        
        const savedBanks = compRes.data.attendance_config?.company_banks || [];
        resolvedBanks = savedBanks.filter((b: any) => b.id !== 'dbs' && b.id !== 'ocbc' && b.id !== 'uob');
        setUserBanks(resolvedBanks);
        
        resolvedPaidMap = compRes.data.attendance_config?.paid_employee_ids || {};
        setDbPaidEmployeeIdsByMonth(resolvedPaidMap);
      }

      setCachedPayroll({
        employees: eligibleEmps,
        dbPaidEmployeeIdsByMonth: resolvedPaidMap,
        dbDepartments: deptNames,
        userBanks: resolvedBanks,
        companyName: resolvedCompanyName,
        payrollConfig: resolvedPConfig
      });
      
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const availableDepartments = Array.from(new Set([
    ...dbDepartments,
    ...employees.map(emp => emp.departments?.name).filter(Boolean)
  ])).sort();

  const availableProjects = Array.from(new Set([
    ...PROJECT_DATA.map(p => p.name),
    ...employees.map(emp => emp.current_project || emp.custom_fields?.project_name).filter(Boolean)
  ])).sort();

  const availableDesignations = Array.from(new Set(
    employees.map(emp => emp.job_role || emp.designation || emp.role).filter(Boolean)
  )).sort();

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.emp_id || emp.employee_id || "")?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = !appliedFilters.dept || 
      emp.departments?.name === appliedFilters.dept ||
      ((appliedFilters.dept === "Admin Department" || appliedFilters.dept === "Admin") && emp.role === "Admin");
    const matchesDesignation = !appliedFilters.designation || emp.job_role === appliedFilters.designation || emp.designation === appliedFilters.designation || emp.role === appliedFilters.designation;
    const matchesProject = !appliedFilters.project || (emp.current_project || emp.custom_fields?.project_name) === appliedFilters.project;
    
    const salary = emp.salary || 6000;
    const matchesMinSalary = !appliedFilters.minSalary || salary >= parseFloat(appliedFilters.minSalary);
    const matchesMaxSalary = !appliedFilters.maxSalary || salary <= parseFloat(appliedFilters.maxSalary);

    const isPaid = paidEmployeeIds.includes(emp.id);
    const matchesPaymentStatus = activeToggle === "Paid" ? isPaid : !isPaid;

    // ── Joining date gate: only show the employee if they joined ON OR BEFORE
    //    the last day of the selected payroll month. Employees who joined after
    //    the selected month must not appear in that month's payroll.
    const joiningDateStr =
      emp.date_of_joining ||
      emp.custom_fields?.dateOfJoining ||
      emp.custom_fields?.workDetails?.dateOfJoining ||
      null;
    if (joiningDateStr) {
      // Parse the selected month ("May 2026") → last day of that month
      const [monthName, yearStr] = selectedMonth.split(" ");
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const monthIdx = monthNames.indexOf(monthName); // 0-based
      const year = parseInt(yearStr, 10);
      // Last day of the selected month (day 0 of next month = last day of this month)
      const lastDayOfMonth = new Date(year, monthIdx + 1, 0);
      const joiningDate = new Date(joiningDateStr);
      if (joiningDate > lastDayOfMonth) return false;
    }

    return matchesSearch && matchesDept && matchesDesignation && matchesProject && matchesMinSalary && matchesMaxSalary && matchesPaymentStatus;
  });

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedProjects: any[] = [];

  // ── Month-eligible employees ──
  // Only employees who joined ON OR BEFORE the last day of the selected month
  // are included in that month's payroll stats and toggle counts.
  const monthEligibleEmployees = employees.filter((emp) => {
    const joiningDateStr =
      emp.date_of_joining ||
      emp.custom_fields?.dateOfJoining ||
      emp.custom_fields?.workDetails?.dateOfJoining ||
      null;
    if (!joiningDateStr) return true; // No joining date: always include
    const [monthName, yearStr] = selectedMonth.split(" ");
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthIdx = monthNames.indexOf(monthName);
    const year = parseInt(yearStr, 10);
    const lastDayOfMonth = new Date(year, monthIdx + 1, 0);
    return new Date(joiningDateStr) <= lastDayOfMonth;
  });

  const totalMonthlyPayout = monthEligibleEmployees.reduce((sum, emp) => sum + (emp.salary || 6000), 0);
  const totalNetPaid = monthEligibleEmployees.reduce((sum, emp) => {
    return paidEmployeeIds.includes(emp.id) ? sum + (emp.salary || 6000) : sum;
  }, 0);
  const pendingSalaries = totalMonthlyPayout - totalNetPaid;
  const deductionsAndAdvance = monthEligibleEmployees.reduce((sum, emp) => sum + ((emp.salary || 6000) * 0.2), 0); // 20% estimated CPF / deductions

  const summaryCards = [
    { title: "Total Monthly Payout", value: `S$ ${totalMonthlyPayout.toLocaleString("en-SG")}`, icon: "/Icons/Monthly_Payouts.svg" },
    { title: "Total Net paid", value: `S$ ${totalNetPaid.toLocaleString("en-SG")}`, icon: "/Icons/Net_Paid.svg" },
    { title: "Pending Salaries", value: `S$ ${pendingSalaries.toLocaleString("en-SG")}`, icon: "/Icons/Salary_Payout.svg" },
    { title: "Deduction & Advance", value: `S$ ${deductionsAndAdvance.toLocaleString("en-SG", { maximumFractionDigits: 0 })}`, icon: "/Icons/Deductions.svg" },
  ];

  const renderPayslipGeneratorModal = () => {
    if (!payslipModalOpen || !selectedEmpForPayslip) return null;

    const emp = selectedEmpForPayslip;
    const payrollSettings = emp.custom_fields?.payroll_settings;
    const baseSalary = payrollSettings ? parseFloat(payrollSettings.baseSalary) : (emp.salary || 6000);
    
    const baseBonuses = payrollSettings?.bonuses || [];
    const customAllowances = (emp.custom_fields?.allowances || []).filter((ca: any) => 
      !baseBonuses.some((b: any) => b.label.toLowerCase() === (ca.name || "allowance").toLowerCase())
    );
    const bonuses = [
      ...baseBonuses,
      ...customAllowances.map((a: any) => ({
        label: a.name || "Allowance",
        value: typeof a.amount === 'string' ? a.amount : String(a.amount || 0)
      }))
    ];
    
    const activeDeductions = getEmployeeActiveDeductions(emp, baseSalary);

    const employeeDeductions = activeDeductions.filter((d: any) => {
      const lbl = d.label.toLowerCase();
      return !lbl.includes("employer") && !lbl.includes("sdf") && !lbl.includes("levy");
    });

    const employerContributions = activeDeductions.filter((d: any) => {
      const lbl = d.label.toLowerCase();
      return lbl.includes("employer") || lbl.includes("sdf") || lbl.includes("levy");
    });

    const bonusTotal = bonuses.reduce((sum: number, b: any) => sum + (parseFloat(b.value.replace(/,/g, "")) || 0), 0);
    const deductionTotal = activeDeductions.reduce((sum: number, d: any) => {
      const lbl = d.label.toLowerCase();
      if (lbl.includes("employer") || lbl.includes("sdf") || lbl.includes("levy")) return sum;
      return sum + (parseFloat(d.value.replace(/,/g, "")) || 0);
    }, 0);

    const netPay = baseSalary + bonusTotal - deductionTotal;
    const grossPay = baseSalary + bonusTotal;

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
      a.download = `payslip-${emp.name.toLowerCase().replace(/\s+/g, "-")}-${selectedMonth.toLowerCase().replace(/\s+/g, "-")}.html`;
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
                setSelectedEmpForPayslip(null);
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
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginTop: 12, letterSpacing: 1.5 }}>PAYSLIP — {selectedMonth.toUpperCase()}</div>
                      </div>
                    );
                  }

                  if (s.type === "employee_info") {
                    const isNric = !!(emp.nric_number || emp.custom_fields?.nricNumber || (emp.custom_fields?.identityType === "NRIC"));
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
                            ["Department", emp.departments?.name || "—"],
                            ["Designation", emp.job_role || emp.designation || emp.role || "—"],
                            ["Pay Period", getPayPeriod(selectedMonth)],
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
                    const savedPaymentDate = emp.custom_fields?.payroll_settings?.paymentDate || getDefaultPaymentDate(selectedMonth);
                    // Format savedPaymentDate (which is "YYYY-MM-DD") into "DD MMM YYYY"
                    let formattedPaymentDate = "";
                    try {
                      const dParts = savedPaymentDate.split("-");
                      const y = dParts[0];
                      const mIndex = parseInt(dParts[1]) - 1;
                      const d = parseInt(dParts[2]);
                      const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      formattedPaymentDate = `${d} ${monthsShort[mIndex]} ${y}`;
                    } catch (e) {
                      formattedPaymentDate = savedPaymentDate;
                    }
                    const paymentDate = formattedPaymentDate;

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#121217]"></div>;
  }

  return (
    <>
      {renderPayslipGeneratorModal()}
      <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white dark:bg-[#121217]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[#F2F2FB] dark:bg-[#1C1C22] rounded-xl flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Icons/Payroll.svg" alt="Payroll" className="w-7 h-7 dark:invert pointer-events-none select-none" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Payroll</h1>
            <p className="text-[14px] text-gray-500 font-medium mt-1">Company Overall Payroll</p>
          </div>
        </div>
        <div className="w-[340px]">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-8 pb-8 flex flex-col">
        {/* Summary Cards */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="flex-1 min-w-[240px] bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative h-[132px] flex items-center">
              <div className="flex items-center gap-4 w-full pr-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.icon} alt={card.title} className="w-[100px] h-[100px] pointer-events-none select-none shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[#8E8E93] leading-tight">{card.title}</span>
                  <span className="text-[24px] font-bold text-[#34C759] mt-1.5 leading-none">{card.value}</span>
                </div>
              </div>
              <div className="absolute bottom-4 right-5">
                <a href="#" className="text-[#007AFF] text-[11px] font-bold hover:underline">View All</a>
              </div>
            </div>
          ))}
        </div>

        {/* Payments Section */}
        <div className="flex flex-col flex-1">
          {/* Header row with Payments title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Payments</h2>
          </div>
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Text toggle switcher */}
              <div className="flex items-center bg-[#F2F2FB] dark:bg-[#1C1C22] p-1 rounded-xl shrink-0">
                <button 
                  onClick={() => { setActiveToggle("Paid"); setCurrentPage(1); }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${activeToggle === "Paid" ? "bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                   <span>Paid</span>
                  {monthEligibleEmployees.filter(emp => paidEmployeeIds.includes(emp.id)).length > 0 && (
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${activeToggle === "Paid" ? "bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#007AFF]/20" : "bg-gray-200 dark:bg-[#3A3A45] text-gray-500 dark:text-gray-400"}`}>
                      {monthEligibleEmployees.filter(emp => paidEmployeeIds.includes(emp.id)).length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => { setActiveToggle("Pending"); setCurrentPage(1); }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${activeToggle === "Pending" ? "bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <span>Pending</span>
                  {monthEligibleEmployees.filter(emp => !paidEmployeeIds.includes(emp.id)).length > 0 && (
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${activeToggle === "Pending" ? "bg-[#FF3B30] text-white" : "bg-gray-200 dark:bg-[#3A3A45] text-gray-500 dark:text-gray-400"}`}>
                      {monthEligibleEmployees.filter(emp => !paidEmployeeIds.includes(emp.id)).length}
                    </span>
                  )}
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Search Employee"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] text-[#1C1C1E] dark:text-white text-[14px] font-medium rounded-full pl-10 pr-5 py-2.5 w-[300px] focus:outline-none focus:border-[#007AFF]"
                />
              </div>
            </div>

            {selectedEmpIds.length > 0 ? (
              <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-200">
                <span className="text-[13px] font-semibold text-[#8E8E93] dark:text-[#8E8E93]">
                  {selectedEmpIds.length} Selected to Pay
                </span>
                <button 
                  onClick={() => setSelectedEmpIds([])}
                  className="text-[13px] font-bold text-[#FF3B30] hover:opacity-85 transition-opacity"
                >
                  Cancel
                </button>
                <button 
                  onClick={openBulkPaymentPanel}
                  className="bg-[#007AFF] hover:bg-[#0062CC] text-white text-[14px] font-bold px-6 py-2 rounded-full transition-colors shadow-md"
                >
                  Bulk Pay
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Month Dropdown next to filter on the right */}
                <div className="relative">
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="appearance-none bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] text-[#1C1C1E] dark:text-white text-[14px] font-medium rounded-full px-5 py-2.5 pr-10 focus:outline-none"
                  >
                    {monthsList.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
                </div>

                <div className="relative">
                  <button 
                    onClick={() => {
                      setTempFilters({ ...appliedFilters });
                      setShowFilter(true);
                    }}
                    className={`flex items-center justify-center h-[38px] w-[38px] border rounded-xl transition-colors ${showFilter ? "bg-[#007AFF] border-[#007AFF] text-white" : "bg-[#F9F9FB] dark:bg-[#1C1C1E] border-[#E5E7EB] dark:border-[#2C2C35] text-[#8E8E93] hover:bg-gray-100 dark:hover:bg-[#2C2C35]"}`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                  {activeFilterCount > 0 && !showFilter && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-[#007AFF] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#1C1C1E] animate-in zoom-in duration-200">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button className="flex items-center justify-center h-[38px] w-[38px] bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl text-[#8E8E93] hover:bg-gray-100 dark:hover:bg-[#2C2C35] transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl bg-white dark:bg-[#1C1C1E] flex flex-col">
            <div className="min-h-[320px]">
              <table className="w-full text-left border-collapse">
                {true ? (
                  <>
                    <thead>
                      <tr className="bg-[#FBFBFB] dark:bg-[#1C1C1E] border-b border-[#E5E7EB] dark:border-[#2C2C35]">
                        <th className="px-6 py-4 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 dark:border-gray-600 dark:bg-[#1C1C1E] cursor-pointer" 
                            checked={paginatedEmployees.length > 0 && paginatedEmployees.every(emp => selectedEmpIds.includes(emp.id))}
                            onChange={() => {
                              const isAllSelected = paginatedEmployees.length > 0 && paginatedEmployees.every(emp => selectedEmpIds.includes(emp.id));
                              if (isAllSelected) {
                                const paginatedIds = paginatedEmployees.map(emp => emp.id);
                                setSelectedEmpIds(prev => prev.filter(id => !paginatedIds.includes(id)));
                              } else {
                                const paginatedIds = paginatedEmployees.map(emp => emp.id);
                                setSelectedEmpIds(prev => {
                                  const newSelection = [...prev];
                                  paginatedIds.forEach(id => {
                                    if (!newSelection.includes(id)) {
                                      newSelection.push(id);
                                    }
                                  });
                                  return newSelection;
                                });
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Employee</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Project</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Base Salary</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Bonus</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Deductions</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Net Pay</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Date</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Status</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-[#8E8E93]">Loading...</td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-[#8E8E93]">No employees found.</td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp, i) => {
                      const rowId = emp.id || i;
                      const isExpanded = expandedRowId === rowId;
                      
                      return (
                        <React.Fragment key={rowId}>
                          <tr className={`border-b border-[#E5E7EB] dark:border-[#2C2C35] hover:bg-[#F9F9FB]/60 dark:hover:bg-[#2C2C35]/30 transition-colors ${isExpanded ? 'border-b-0' : ''}`}>
                            <td className="px-6 py-4">
                               <input 
                                 type="checkbox" 
                                 className="rounded border-gray-300 dark:border-gray-600 dark:bg-[#1C1C1E] cursor-pointer" 
                                 checked={selectedEmpIds.includes(emp.id)}
                                 onChange={() => {
                                   setSelectedEmpIds(prev => {
                                     if (prev.includes(emp.id)) {
                                       return prev.filter(id => id !== emp.id);
                                     } else {
                                       return [...prev, emp.id];
                                     }
                                   });
                                 }}
                               />
                             </td>
                            <td className="px-6 py-4 flex items-center gap-3">
                              <button onClick={() => toggleRow(rowId)} className="text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-colors">
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">{emp.name}</span>
                                <span className="text-[12px] font-medium text-[#8E8E93]">{emp.emp_id || emp.employee_id || `EMP000${i+1}`}</span>
                              </div>
                            </td>
{/* Project column */}
                            <td className="px-6 py-4">
                              <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-white">
                                {emp.current_project || emp.custom_fields?.project_name || <span className="text-[#8E8E93]">—</span>}
                              </span>
                            </td>
                            {(() => {
                              const payrollSettings = emp.custom_fields?.payroll_settings;
                              const baseSalary = payrollSettings ? parseFloat(payrollSettings.baseSalary) : (emp.salary || 6000);
                              
                              const baseBonuses = payrollSettings?.bonuses || [];
                              const customAllowances = (emp.custom_fields?.allowances || []).filter((ca: any) => 
                                !baseBonuses.some((b: any) => b.label.toLowerCase() === (ca.name || "allowance").toLowerCase())
                              );
                              const customAllowancesSum = customAllowances.reduce((sum: number, a: any) => {
                                const amt = typeof a.amount === 'string' ? parseFloat(a.amount.replace(/,/g, '')) : parseFloat(a.amount) || 0;
                                return sum + (isNaN(amt) ? 0 : amt);
                              }, 0);

                              const bonusTotal = baseBonuses.reduce((sum: number, b: any) => sum + (parseFloat(b.value.replace(/,/g, "")) || 0), 0) + customAllowancesSum;
                                 
                              const activeDeductions = getEmployeeActiveDeductions(emp, baseSalary);

                              const deductionTotal = activeDeductions.reduce((sum: number, d: any) => {
                                const lbl = d.label.toLowerCase();
                                if (lbl.includes("employer") || lbl.includes("sdf") || lbl.includes("levy")) {
                                  return sum;
                                }
                                return sum + (parseFloat(d.value.replace(/,/g, "")) || 0);
                              }, 0);
                                 
                              const netPay = baseSalary + bonusTotal - deductionTotal;

                              return (
                                <>
                                  <td className="px-6 py-4 text-[14px] font-semibold text-[#1C1C1E] dark:text-white">S${baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="px-6 py-4 text-[14px] font-semibold text-[#1C1C1E] dark:text-white">S${bonusTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="px-6 py-4 text-[14px] font-semibold text-[#1C1C1E] dark:text-white">S${deductionTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="px-6 py-4 text-[14px] font-bold text-[#34C759]">S${netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                </>
                              );
                            })()}
                            <td className="px-6 py-4 text-[14px] font-medium text-[#1C1C1E] dark:text-white">
                              {(() => {
                                const savedDate = emp.custom_fields?.payroll_settings?.paymentDate || getDefaultPaymentDate(selectedMonth);
                                const dateParts = savedDate.split("-");
                                const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                const d = parseInt(dateParts[2]);
                                const mIdx = parseInt(dateParts[1]) - 1;
                                const y = dateParts[0];
                                return `${d} ${monthsShort[mIdx]} ${y}`;
                              })()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-[8px] text-[12px] font-bold ${paidEmployeeIds.includes(emp.id) ? "bg-[#EBFDF2] dark:bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20" : "bg-[#FFF8EC] dark:bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20"}`}>
                                {paidEmployeeIds.includes(emp.id) ? "Paid" : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                 {paidEmployeeIds.includes(emp.id) ? (
                                   <button 
                                     onClick={() => handleUndoPayment(emp.id)}
                                     className="bg-[#FFE5E5] hover:bg-[#FFD1D1] text-[#FF3B30] dark:bg-[#FF3B30]/10 dark:hover:bg-[#FF3B30]/20 text-[13px] font-bold px-4 py-1.5 rounded-full transition-colors border border-[#FF3B30]/10"
                                   >
                                     Undo
                                   </button>
                                 ) : (
                                   <button 
                                     onClick={() => openSinglePaymentPanel(emp)}
                                     className="bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13px] font-bold px-4 py-1.5 rounded-full transition-colors shadow-sm"
                                   >
                                     Pay
                                   </button>
                                 )}
                                 {/* Three-dot menu */}
                                 <div className="relative" ref={openMenuId === rowId ? menuRef : null}>
                                   <button
                                     onClick={() => setOpenMenuId(openMenuId === rowId ? null : rowId)}
                                     className={`flex items-center justify-center h-[30px] w-[30px] rounded-full transition-colors ${
                                       openMenuId === rowId
                                         ? 'bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]'
                                         : 'text-[#8E8E93] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]'
                                     }`}
                                   >
                                     <MoreVertical className="h-4 w-4" />
                                   </button>
                                   {openMenuId === rowId && (
                                     <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[200px] bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden py-1.5">
                                       {!paidEmployeeIds.includes(emp.id) && (
                                         <>
                                           <button
                                             onClick={() => { setOpenMenuId(null); openEditPanel(emp); }}
                                             className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] transition-colors"
                                           >
                                             <Pencil className="h-4 w-4 text-[#007AFF]" />
                                             Edit Payment
                                           </button>
                                           <button
                                             onClick={() => { setOpenMenuId(null); openAdvancePanel(emp); }}
                                             className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] transition-colors"
                                           >
                                             <Wallet className="h-4 w-4 text-[#34C759]" />
                                             Pay as Advance
                                           </button>
                                           <div className="h-px bg-[#F2F2F7] dark:bg-[#2C2C35] mx-3 my-1" />
                                         </>
                                       )}
                                       <button
                                         onClick={() => { setOpenMenuId(null); router.push(`/payroll/history/${emp.id}`); }}
                                         className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] transition-colors"
                                       >
                                         <Clock className="h-4 w-4 text-[#8E8E93]" />
                                         Payouts History
                                       </button>
                                       <div className="h-px bg-[#F2F2F7] dark:bg-[#2C2C35] mx-3 my-1" />
                                       <button
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            setSelectedEmpForPayslip(emp);
                                            setPayslipModalOpen(true);
                                          }}
                                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#FF9500] hover:bg-[#FFF8EC] dark:hover:bg-[#FF9500]/10 transition-colors"
                                        >
                                          <FileText className="h-4 w-4 text-[#FF9500]" />
                                          Generate Pay Slip
                                        </button>
                                     </div>
                                   )}
                                 </div>
                               </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b-2 border-[#E5E7EB] dark:border-[#2C2C35] bg-[#F9F9FB] dark:bg-[#121217]">
                              <td colSpan={10} className="pl-6 pr-0 py-6">
                                <div className="flex flex-col gap-2 pl-12 pr-12">
                                  <h4 className="text-[14px] font-bold text-[#1C1C1E] dark:text-white mb-2">Payment Details</h4>
                                  <div className="grid grid-cols-4 gap-y-4 gap-x-6">
                                    {(() => {
                                      const baseSalary = emp.salary || 6000;
                                      const isForeign = !!(emp.work_pass_type || emp.custom_fields?.identityType === "FIN") && !emp.nric_number && !emp.custom_fields?.nricNumber;
                                      const passType = emp.work_pass_type || "";
                                      const isSPassOrWorkPermit = passType.toLowerCase().includes("s pass") || passType.toLowerCase().includes("work permit");

                                      // Retrieve saved custom values if any
                                      const payrollSettings = emp.custom_fields?.payroll_settings;
                                      const deductions = getEmployeeActiveDeductions(emp, baseSalary);
                                      
                                      const baseBonuses = payrollSettings?.bonuses || [];
                                      const customAllowances = (emp.custom_fields?.allowances || []).filter((ca: any) => 
                                        !baseBonuses.some((b: any) => b.label.toLowerCase() === (ca.name || "allowance").toLowerCase())
                                      );
                                      const customAllowancesSum = customAllowances.reduce((sum: number, a: any) => {
                                        const amt = typeof a.amount === 'string' ? parseFloat(a.amount.replace(/,/g, '')) : parseFloat(a.amount) || 0;
                                        return sum + (isNaN(amt) ? 0 : amt);
                                      }, 0);

                                      const bonuses = baseBonuses;

                                      const getDeductVal = (label: string) => {
                                        const found = deductions.find((d: any) => d.label.toLowerCase() === label.toLowerCase() || d.label.toLowerCase().includes(label.toLowerCase()));
                                        return found ? found.value : "0";
                                      };

                                      const getBonusVal = (label: string, defaultVal: number) => {
                                        const found = bonuses.find((b: any) => b.label.toLowerCase() === label.toLowerCase());
                                        if (found) return found.value;
                                        return defaultVal > 0 ? String(defaultVal) : "0";
                                      };

                                      const cpfEmpVal = getDeductVal("CPF (Employee)");
                                      const cpfErVal = getDeductVal("CPF (Employer)");
                                      const sindaVal = getDeductVal("SINDA");
                                      const cdacVal = getDeductVal("CDAC");
                                      const sdfVal = getDeductVal("SDF");
                                      const levyVal = getDeductVal("Levy");
                                      const incomeTaxVal = getDeductVal("Income Tax");

                                      // Calculate totals
                                      const overtimeVal = getBonusVal("Overtime", 0);
                                      const baseAllowanceVal = parseFloat(getBonusVal("Allowance", 0)) || 0;
                                      const allowanceVal = String(baseAllowanceVal + customAllowancesSum);
                                      const bonusVal = getBonusVal("Bonus", 0);

                                      // Others (excluding CPF, SINDA, CDAC, SDF, Levy)
                                      const standardKeys = ["cpf (employee)", "cpf (employer)", "sinda", "cdac", "sdf", "levy", "foreign worker levy"];
                                      const otherDeductVal = deductions
                                        .filter((d: any) => !standardKeys.some(k => d.label.toLowerCase().includes(k)))
                                        .reduce((sum: number, d: any) => sum + (parseFloat(parseAmount(d.value)) || 0), 0);

                                      return (
                                        <>
                                          {(() => {
                                            const isNric = !!(emp.nric_number || emp.custom_fields?.nricNumber || (emp.custom_fields?.identityType === "NRIC"));
                                            const idNumber = isNric
                                              ? (emp.nric_number || emp.custom_fields?.nricNumber || emp.nric || "—")
                                              : (emp.fin_number || emp.custom_fields?.finNumber || "—");
                                            return (
                                              <div className="flex flex-col">
                                                <span className="text-[12px] text-[#8E8E93]">{isNric ? "NRIC" : "FIN"}</span>
                                                <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-white">
                                                  {idNumber}
                                                </span>
                                              </div>
                                            );
                                          })()}
                                          {(() => {
                                            const pDateStr = emp.custom_fields?.payroll_settings?.paymentDate;
                                            let displayDate = "—";
                                            if (pDateStr) {
                                              const dateParts = pDateStr.split("-");
                                              if (dateParts.length === 3) {
                                                displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                                              }
                                            } else {
                                              const defaultDateStr = getDefaultPaymentDate(selectedMonth);
                                              const dateParts = defaultDateStr.split("-");
                                              if (dateParts.length === 3) {
                                                displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                                              }
                                            }
                                            return (
                                              <div className="flex flex-col">
                                                <span className="text-[12px] text-[#8E8E93]">Payment Date</span>
                                                <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                                                  {displayDate}
                                                </span>
                                              </div>
                                            );
                                          })()}
                                          <div className="flex flex-col">
                                            <span className="text-[12px] text-[#8E8E93]">Designation</span>
                                            <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-white">
                                              {emp.job_role || emp.designation || emp.role || "Employee"}
                                            </span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[12px] text-[#8E8E93]">Allowance</span>
                                            <span className="text-[13px] font-bold text-[#34C759]">S$ {formatAmount(allowanceVal) || "0"}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[12px] text-[#8E8E93]">Overtime</span>
                                            <span className="text-[13px] font-bold text-[#34C759]">S$ {formatAmount(overtimeVal) || "0"}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[12px] text-[#8E8E93]">Expenses</span>
                                            <span className="text-[13px] font-bold text-[#34C759]">S$ {formatAmount(bonusVal) || "0"}</span>
                                          </div>
                                          {!isForeign && (
                                            <>
                                              <div className="flex flex-col">
                                                <span className="text-[12px] text-[#8E8E93]">CPF by Employee</span>
                                                <span className="text-[13px] font-bold text-[#FF3B30]">S$ {formatAmount(cpfEmpVal) || "0"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[12px] text-[#8E8E93]">CPF by Employer</span>
                                                <span className="text-[13px] font-bold text-[#FF3B30]">S$ {formatAmount(cpfErVal) || "0"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[12px] text-[#8E8E93]">SINDA</span>
                                                <span className="text-[13px] font-bold text-[#FF3B30]">S$ {formatAmount(sindaVal) || "0"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[12px] text-[#8E8E93]">CDAC</span>
                                                <span className="text-[13px] font-bold text-[#FF3B30]">S$ {formatAmount(cdacVal) || "0"}</span>
                                              </div>
                                            </>
                                          )}
                                          <div className="flex flex-col">
                                            <span className="text-[12px] text-[#8E8E93]">Other Deduction</span>
                                            <span className="text-[13px] font-bold text-[#8E8E93]">S$ {otherDeductVal.toLocaleString("en-SG")}</span>
                                          </div>
                                          {isForeign && (
                                            <div className="flex flex-col">
                                              <span className="text-[12px] text-[#8E8E93]">Income Tax</span>
                                              <span className="text-[13px] font-bold text-[#FF3B30]">S$ {formatAmount(incomeTaxVal) || "0"}</span>
                                            </div>
                                          )}
                                          <div className="flex flex-col">
                                            <span className="text-[12px] text-[#8E8E93]">Levy</span>
                                            <span className="text-[13px] font-bold text-[#8E8E93]">S$ {formatAmount(levyVal) || "0"}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[12px] text-[#8E8E93]">SDF</span>
                                            <span className="text-[13px] font-bold text-[#FF3B30]">S$ {formatAmount(sdfVal) || "0"}</span>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* ── Bank Account Details Card ── */}
                                  <div className="mt-5 border-t border-[#E5E7EB] dark:border-[#2C2C35] pt-4">
                                    <h5 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest mb-3">Bank Account Details</h5>
                                    <div className="flex items-center gap-5 bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl px-5 py-4 shadow-none w-full">
                                      {/* Bank Logo */}
                                      {(() => {
                                        const getLogoSrc = () => {
                                          const bank = (emp.bank_name || emp.custom_fields?.bank_name || "").toLowerCase();
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
                                            <div className="w-[72px] h-[36px] flex items-center justify-center shrink-0">
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={src}
                                                alt={emp.bank_name || "Bank"}
                                                className="max-h-[36px] max-w-[72px] object-contain"
                                              />
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="w-[72px] h-[36px] bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-150 dark:border-white/5 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none select-none">
                                              NO LOGO
                                            </span>
                                          </div>
                                        );
                                      })()}
                                      <div className="w-px h-10 bg-[#E5E7EB] dark:bg-[#2C2C35]" />
                                      {/* Bank Name */}
                                      <div className="flex flex-col min-w-[120px]">
                                        <span className="text-[11px] text-[#8E8E93] font-medium">Bank Name</span>
                                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white uppercase">
                                          {emp.bank_name || "DBS Bank"}
                                        </span>
                                      </div>
                                      <div className="w-px h-10 bg-[#E5E7EB] dark:bg-[#2C2C35]" />
                                      {/* Account Holder Name */}
                                      <div className="flex flex-col min-w-[120px]">
                                        <span className="text-[11px] text-[#8E8E93] font-medium">Account Holder Name</span>
                                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                                          {emp.name}
                                        </span>
                                      </div>
                                      <div className="w-px h-10 bg-[#E5E7EB] dark:bg-[#2C2C35]" />
                                      <div 
                                        className="flex flex-col min-w-[140px] cursor-pointer group" 
                                        onClick={() => setShowFullAcc(!showFullAcc)}
                                        title="Click to view full account number"
                                      >
                                        <span className="text-[11px] text-[#8E8E93] font-medium group-hover:text-[#007AFF] transition-colors">Account Number</span>
                                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white tracking-wider flex items-center gap-2">
                                          {showFullAcc 
                                            ? (emp.account_number || "1234567171") 
                                            : (emp.account_number ? `•••• •••• ${emp.account_number.slice(-4)}` : "•••• •••• 7171")
                                          }
                                          {!showFullAcc && <span className="text-[10px] text-[#007AFF] font-bold opacity-0 group-hover:opacity-100 transition-opacity">(View)</span>}
                                        </span>
                                      </div>
                                      <div className="w-px h-10 bg-[#E5E7EB] dark:bg-[#2C2C35]" />
                                      <div className="flex flex-col min-w-[120px]">
                                        <span className="text-[11px] text-[#8E8E93] font-medium">Branch</span>
                                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                                          {emp.custom_fields?.bank_branch || "Main Branch"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr className="bg-[#FBFBFB] dark:bg-[#1C1C1E] border-b border-[#E5E7EB] dark:border-[#2C2C35]">
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Project</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Total Employees</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Base Salary</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Bonus</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Deductions</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Net Pay</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Date</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Status</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[#1C1C1E] dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-[#8E8E93]">No projects found.</td>
                    </tr>
                  ) : (
                    paginatedProjects.map((proj, pIdx) => {
                      const isExpanded = expandedRowId === proj.id;
                      const isLastProjRows = pIdx >= paginatedProjects.length - 2;
                      return (
                        <React.Fragment key={proj.id}>
                          <tr className={`border-b border-[#E5E7EB] dark:border-[#2C2C35] hover:bg-[#F9F9FB]/60 dark:hover:bg-[#2C2C35]/30 transition-colors ${isExpanded ? 'border-b-0' : ''}`}>
                            <td className="px-6 py-4 flex items-center gap-3">
                              <button onClick={() => setExpandedRowId(isExpanded ? null : proj.id)} className="text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-colors">
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              <div 
                                className="h-9 w-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                                style={{ backgroundColor: getAvatarColor(proj.name).bg, color: getAvatarColor(proj.name).color }}
                              >
                                {getInitials(proj.name)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">{proj.name}</span>
                                <span className="text-[12px] font-medium text-[#8E8E93]">{proj.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{proj.employees}</td>
                            <td className="px-6 py-4 text-[14px] font-semibold text-[#1C1C1E] dark:text-white">S${proj.base.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[14px] font-semibold text-[#1C1C1E] dark:text-white">S${proj.bonus.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[14px] font-semibold text-[#1C1C1E] dark:text-white">S${proj.deductions.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[14px] font-bold text-[#34C759]">S${proj.net.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[14px] font-medium text-[#1C1C1E] dark:text-white">
                              {(() => {
                                const parts = selectedMonth.split(" ");
                                return `12 ${parts[0].slice(0, 3)} ${parts[1]}`;
                              })()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-[#FFF8EC] dark:bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20 px-3 py-1 rounded-[8px] text-[12px] font-bold">{proj.status}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    const projEmployees = employees.filter(e => (e.current_project || e.custom_fields?.project_name) === proj.name);
                                    if (projEmployees.length === 0) {
                                      alert("No employees are assigned to this project.");
                                      return;
                                    }
                                    setPaymentPanelData({
                                      type: "bulk",
                                      employees: projEmployees
                                    });
                                    setPaymentPanelOpen(true);
                                    setPaymentPanelClosing(false);
                                    setPaymentPin("");
                                    setPaymentPinError("");
                                    setPaymentSuccess(false);
                                  }}
                                  className="bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13px] font-bold px-4 py-1.5 rounded-full transition-colors shadow-sm"
                                >
                                  Pay
                                </button>
                                {/* Three-dot menu */}
                                <div className="relative" ref={openMenuId === proj.id ? menuRef : null}>
                                  <button
                                    onClick={() => setOpenMenuId(openMenuId === proj.id ? null : proj.id)}
                                    className={`flex items-center justify-center h-[30px] w-[30px] rounded-full transition-colors ${
                                      openMenuId === proj.id
                                        ? 'bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]'
                                        : 'text-[#8E8E93] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]'
                                    }`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                  {openMenuId === proj.id && (
                                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-max min-w-[200px] bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden py-1.5">
                                      <button
                                        onClick={() => { setOpenMenuId(null); openExpensePanel(proj); }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] transition-colors whitespace-nowrap"
                                      >
                                        <Receipt className="h-4 w-4 text-[#007AFF]" />
                                        Add Expenses
                                      </button>
                                      <button
                                        onClick={() => { setOpenMenuId(null); openTempEmpPanel(proj); }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] transition-colors whitespace-nowrap"
                                      >
                                        <UserPlus className="h-4 w-4 text-[#34C759]" />
                                        Add temporary employee
                                      </button>
                                      <button
                                        onClick={() => { setOpenMenuId(null); openEquityPanel(proj); }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] transition-colors whitespace-nowrap"
                                      >
                                        <PieChart className="h-4 w-4 text-[#8E8E93]" />
                                        Project Equity
                                      </button>
                                      <div className="h-px bg-[#F2F2F7] dark:bg-[#2C2C35] mx-3 my-1" />
                                      <button
                                        onClick={() => { setOpenMenuId(null); }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] transition-colors whitespace-nowrap"
                                      >
                                        <Users className="h-4 w-4 text-[#FF9500]" />
                                        View Employees
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-[#F9F9FB] dark:bg-[#1C1C1E]/50">
                              <td colSpan={9} className="px-6 py-6 border-b border-[#E5E7EB] dark:border-[#2C2C35]">
                                <div className="grid grid-cols-4 gap-y-6 gap-x-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Client Name</span>
                                    <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{proj.client}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Project Location</span>
                                    <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{proj.location}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Project Acquired By</span>
                                    <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{proj.acquiredBy}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Total Gross Profit</span>
                                    <span className="text-[14px] font-bold text-[#34C759]">S$ {proj.grossProfit?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Total Net Profit</span>
                                    <span className="text-[14px] font-bold text-[#007AFF]">S$ {proj.netProfit?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Total Taxes</span>
                                    <span className="text-[14px] font-semibold text-[#FF3B30]">S$ {proj.taxes?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Total Expenses</span>
                                    <span className="text-[14px] font-semibold text-[#FF9500]">S$ {proj.expenses?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Reserve Deduction (20%)</span>
                                    <span className="text-[14px] font-semibold text-[#FF3B30]">-S$ {((proj.netProfit || 0) * 0.2).toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Available Distribution</span>
                                    <span className="text-[14px] font-bold text-[#34C759]">S$ {((proj.netProfit || 0) * 0.8).toLocaleString()}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </>
            )}
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#F2F2F7] dark:border-[#2C2C35] bg-[#FBFBFB] dark:bg-[#1C1C1E]">
              <div className="flex items-center gap-6">
                <span className="text-[13px] font-medium text-[#8E8E93]">
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} employees
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
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg border border-[#F2F2F7] dark:border-[#2C2C35] transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#8E8E93] hover:bg-[#F9F9FB] dark:hover:bg-white/5'}`}
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
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
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg border border-[#F2F2F7] dark:border-[#2C2C35] transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-[#8E8E93] hover:bg-[#F9F9FB] dark:hover:bg-white/5'}`}
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    {/* ── Downside Payment Panel ── */}
    {paymentPanelOpen && paymentPanelData && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${paymentPanelClosing ? 'opacity-0' : 'opacity-100'} bg-black/40`}
          onClick={closePaymentPanel}
        />

        {/* Bottom Sheet Panel */}
        <div 
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[760px] bg-white dark:bg-[#1C1C1E] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-gray-200 dark:border-[#2C2C35] rounded-t-[28px] flex flex-col transition-transform duration-300 ease-out ${paymentPanelClosing ? 'translate-y-full' : 'translate-y-0'}`}
          style={{ maxHeight: '92vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#F2F2FB] dark:bg-[#1C1C22] rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icons/VertexLogo.svg" alt="Vertex Logo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">
                  {paymentPanelData.type === "bulk" ? "Authorize Bulk Payment" : "Authorize Payment"}
                </h2>
                <p className="text-[12px] text-[#8E8E93] mt-0.5">
                  {paymentPanelData.type === "bulk" 
                    ? `Processing payout for ${paymentPanelData.employees.length} selected employee(s)` 
                    : "Review payment details and authorize"}
                </p>
              </div>
            </div>
            <button 
              onClick={closePaymentPanel} 
              className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {paymentStep === 4 ? (
              /* Step 4: Success State */
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-[#34C759]/10 rounded-full flex items-center justify-center text-[#34C759] mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-[20px] font-black text-gray-900 dark:text-white mb-2">Payment Processed Successfully</h3>
                <p className="text-[14px] text-gray-500 dark:text-[#8E8E93] max-w-[340px] leading-relaxed">
                  The payment details have been verified and successfully logged into the payroll registry.
                </p>
                <button
                  onClick={() => {
                    setSelectedEmpIds([]);
                    closePaymentPanel();
                  }}
                  className="mt-6 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[14px] font-bold px-8 py-2.5 rounded-full transition-colors shadow-md"
                >
                  Dismiss
                </button>
              </div>
            ) : paymentStep === 3 ? (
              /* Step 3: PIN Authorization & Compliance Notice */
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right duration-300">
                {/* Professional English Intimation (Notice) */}
                <div className="border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl p-4 flex gap-3">
                  <div className="text-amber-500 shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-bold text-amber-800 dark:text-amber-400">Compliance & Payout Notice</span>
                    <p className="text-[11.5px] text-amber-700/90 dark:text-amber-500/80 leading-relaxed font-medium">
                      This transaction registers the payroll records for compliance and accounting. Please be advised that initiating this payment does not process an electronic digital bank transfer. Physical distribution of funds must be executed separately via your corporate banking portal.
                    </p>
                  </div>
                </div>

                {/* Selected Payment Method Summary */}
                <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Logo/Icon Container */}
                    <div className="w-[50px] h-[30px] flex items-center justify-center shrink-0 bg-white dark:bg-[#121217] rounded-lg border border-gray-100 dark:border-[#2C2C35] p-1">
                      {authPaymentMethod === "Cash" ? (
                        <div className="text-[#34C759] flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 512 512">
                            <g>
                              <path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor" />
                              <path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor" />
                              <circle cx="346" cy="286" r="15" fill="currentColor" />
                              <circle cx="106" cy="286" r="15" fill="currentColor" />
                            </g>
                          </svg>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveBankLogo(userBanks.find(b => b.id === authPaymentBank)?.logo) || COMPANY_BANKS.find(b => b.id === authPaymentBank)?.logo || "/Bank logo/DBSlogo.svg"}
                          alt="Bank Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-[#2C2C35] shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Selected Payout Channel</span>
                      {authPaymentMethod === "Cash" ? (
                        <p className="text-[14px] font-bold text-gray-900 dark:text-white mt-0.5">Cash Payout</p>
                      ) : (
                        (() => {
                          const matchedBank = userBanks.find(b => b.id === authPaymentBank) || COMPANY_BANKS.find(b => b.id === authPaymentBank);
                          const { fullName, displayAccount } = parseBankDisplay(matchedBank);
                          return (
                            <div className="flex flex-col mt-0.5">
                              <span className="text-[11px] font-medium text-[#8E8E93] leading-normal">{fullName}</span>
                              <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{displayAccount}</span>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>

                </div>

                {/* PIN Authorization Section */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-[#121217] border border-gray-100 dark:border-[#2C2C35]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/Icons/VertexLogo.svg" alt="Vertex Logo" className="h-5 w-auto object-contain" />
                    <div className="w-px h-3 bg-gray-300 dark:bg-[#2C2C35]" />
                    <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Vertex Secure</span>
                  </div>
                  <label className="text-[13px] font-bold text-gray-900 dark:text-white text-center">
                    Enter Security PIN to Authorize
                  </label>
                  <p className="text-[11px] text-[#8E8E93] font-medium -mt-2">(Default PIN: 1234)</p>
                  <input
                    type="password"
                    maxLength={4}
                    value={paymentPin}
                    onChange={(e) => {
                      setPaymentPin(e.target.value);
                      setPaymentPinError("");
                    }}
                    placeholder="••••"
                    className="text-center font-black tracking-widest text-[24px] bg-[#F9F9FB] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl px-4 py-2.5 w-[140px] focus:outline-none focus:border-[#007AFF] mx-auto block mt-1 dark:text-white"
                  />
                  {paymentPinError && (
                    <p className="text-[12px] text-[#FF3B30] text-center font-semibold mt-1">
                      {paymentPinError}
                    </p>
                  )}
                </div>

                {/* Action Footer Buttons */}
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={async () => {
                      if (paymentPin === "1234") {
                        await handleDeductBankBalance();
                        setPaymentStep(4);
                        if (paymentPanelData?.employees) {
                          const ids = paymentPanelData.employees.map(e => e.id);
                          setPaidEmployeeIds(prev => [...Array.from(new Set([...prev, ...ids]))]);
                        }
                      } else {
                        setPaymentPinError("Invalid Security PIN. Please try again.");
                      }
                    }}
                    className="bg-[#007AFF] hover:bg-[#0062CC] text-white text-[14.5px] font-bold py-3 rounded-xl transition-colors shadow-md w-full"
                  >
                    Authorize Payment
                  </button>
                  <button
                    onClick={() => setPaymentStep(2)}
                    className="bg-transparent hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] text-[#8E8E93] text-[13px] font-bold py-2.5 rounded-xl transition-colors w-full"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : paymentStep === 2 ? (
              /* Step 2: Payment Method & Destination (Editable Section) */
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right duration-300">
                <div className="flex flex-col gap-3 bg-[#F9F9FB] dark:bg-[#121217] rounded-2xl p-5 border border-gray-100 dark:border-[#2C2C35]">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Method & Destination</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAuthPaymentMethod("Bank Transfer")}
                      className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${authPaymentMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-white dark:bg-[#1C1C1E] border-[#E5E7EB] dark:border-[#2C2C35] text-[#8E8E93]"}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 32 32" className="transition-colors shrink-0">
                        <path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor" />
                      </svg>
                      <span className="text-[13px] font-bold">Bank Transfer</span>
                    </button>
                    <button
                      onClick={() => setAuthPaymentMethod("Cash")}
                      className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${authPaymentMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-white dark:bg-[#1C1C1E] border-[#E5E7EB] dark:border-[#2C2C35] text-[#8E8E93]"}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 512 512" className="transition-colors shrink-0">
                        <g>
                          <path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor" />
                          <path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor" />
                          <circle cx="346" cy="286" r="15" fill="currentColor" />
                          <circle cx="106" cy="286" r="15" fill="currentColor" />
                        </g>
                      </svg>
                      <span className="text-[13px] font-bold">Cash</span>
                    </button>
                  </div>

                  {/* Bank Selection (When Bank Transfer is selected) */}
                  {authPaymentMethod === "Bank Transfer" && (
                    <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Pay from Bank</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {userBanks.length === 0 ? (
                          <div className="text-[13px] text-[#8E8E93] font-bold py-4 px-2">
                            No bank accounts found. Please add a bank account in the Financials tab first.
                          </div>
                        ) : (
                          userBanks.map((bank) => (
                            <div
                              key={bank.id}
                              onClick={() => setAuthPaymentBank(bank.id)}
                              className={`flex-shrink-0 w-[180px] h-[178px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${authPaymentBank === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] hover:border-[#007AFF]/50"}`}
                            >
                              <div className="flex flex-col justify-between h-full relative z-10">
                                <div className="flex flex-col gap-2.5">
                                  <div className="h-8 flex items-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={resolveBankLogo(bank.logo)} alt={bank.name} className="h-6 max-w-full object-contain" />
                                  </div>
                                  {(() => {
                                    const { fullName, displayAccount } = parseBankDisplay(bank);
                                    return (
                                      <div className="flex flex-col">
                                        <span className="text-[11px] font-medium text-[#8E8E93] leading-normal">{fullName}</span>
                                        <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{displayAccount}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <button 
                                  className="text-[11px] font-bold text-[#007AFF] hover:underline text-left mt-auto z-30"
                                  onClick={(e) => { e.stopPropagation(); alert(`Balance: S$ ${parseFloat(bank.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`); }}
                                >
                                  Check Balance
                                </button>
                              </div>
                              {authPaymentBank === bank.id && (
                                <div className="absolute top-2 right-2 h-5 w-5 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm z-20 animate-in zoom-in duration-200">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Footer Buttons */}
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => setPaymentStep(3)}
                    className="bg-[#007AFF] hover:bg-[#0062CC] text-white text-[14.5px] font-bold py-3 rounded-xl transition-colors shadow-md w-full"
                  >
                    Continue Payment
                  </button>
                  <button
                    onClick={() => setPaymentStep(1)}
                    className="bg-transparent hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] text-[#8E8E93] text-[13px] font-bold py-2.5 rounded-xl transition-colors w-full"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              /* Step 1: Payment Summary details and Continue button */
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left duration-300">
                {/* Details Section */}
                <div className="bg-[#F9F9FB] dark:bg-[#121217] rounded-2xl p-5 border border-gray-100 dark:border-[#2C2C35] flex flex-col gap-4">
                  <h4 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest">Payout Summary</h4>
                  
                  {paymentPanelData.type === "single" ? (() => {
                    const emp = paymentPanelData.employees[0];
                    const baseSalary = getEmployeeBaseSalary(emp);
                    const netPay = getEmployeeNetPay(emp);
                    return (
                      /* Single Employee Details */
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                          <span className="text-[13px] font-medium text-[#8E8E93]">Employee</span>
                          <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                            {emp.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                          <span className="text-[13px] font-medium text-[#8E8E93]">Employee ID</span>
                          <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
                            {emp.emp_id || emp.employee_id || "EMP001"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                          <span className="text-[13px] font-medium text-[#8E8E93]">Base Salary</span>
                          <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
                            S$ {baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                          <span className="text-[13px] font-medium text-[#8E8E93]">Payment Date</span>
                          <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
                            {(() => {
                              const pDateStr = emp.custom_fields?.payroll_settings?.paymentDate;
                              if (pDateStr) {
                                const dateParts = pDateStr.split("-");
                                if (dateParts.length === 3) return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                              }
                              const defaultDateStr = getDefaultPaymentDate(selectedMonth);
                              const dateParts = defaultDateStr.split("-");
                              if (dateParts.length === 3) return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                              return defaultDateStr;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-medium text-[#8E8E93]">Net Payout</span>
                          <span className="text-[15px] font-bold text-[#34C759]">
                            S$ {netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </span>
                        </div>
                      </div>
                    );
                  })() : (
                    /* Bulk Payout Details */
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                        <span className="text-[13px] font-medium text-[#8E8E93]">Total Employees</span>
                        <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                          {paymentPanelData.employees.length}
                        </span>
                      </div>
                      
                      {/* Mini Scrollable List of Employees */}
                      <div className="max-h-[160px] overflow-y-auto my-1 pr-1 border border-gray-100 dark:border-[#2C2C35] rounded-xl bg-white dark:bg-[#1C1C1E]">
                        {paymentPanelData.employees.map((emp, idx) => {
                          const netPay = getEmployeeNetPay(emp);
                          return (
                            <div key={emp.id || idx} className="flex justify-between items-center px-3 py-2 border-b border-[#F9F9FB] dark:border-[#2C2C35] last:border-0">
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-gray-900 dark:text-white">{emp.name}</span>
                                <span className="text-[10px] font-semibold text-[#8E8E93]">
                                  {emp.emp_id || emp.employee_id || `EMP000${idx+1}`}
                                </span>
                              </div>
                              <span className="text-[12px] font-bold text-[#34C759]">
                                S$ {netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[13px] font-medium text-[#8E8E93]">Total Net Payout</span>
                        <span className="text-[16px] font-black text-[#34C759]">
                          S$ {paymentPanelData.employees.reduce((sum, emp) => sum + getEmployeeNetPay(emp), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => setPaymentStep(2)}
                    className="bg-[#007AFF] hover:bg-[#0062CC] text-white text-[14.5px] font-bold py-3 rounded-xl transition-colors shadow-md w-full"
                  >
                    Continue Payment
                  </button>
                  <button
                    onClick={closePaymentPanel}
                    className="bg-transparent hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] text-[#8E8E93] text-[13px] font-bold py-2.5 rounded-xl transition-colors w-full"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )}

    {/* ── Edit Payment Side Panel ── */}
    {editEmp && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${editClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
          onClick={closeEditPanel}
        />

        {/* Panel */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${editClosing ? 'translate-x-full' : 'translate-x-0'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Edit Payment</h2>
              <p className="text-[12px] text-[#8E8E93] mt-0.5">Update payroll details for this period</p>
            </div>
            <button onClick={closeEditPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

            {/* Employee Info (non-editable) */}
            <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] rounded-2xl px-5 py-4 flex flex-col gap-3">
              <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Employee Info</p>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8E8E93]">Name</span>
                  <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{editEmp.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8E8E93]">NRIC / FIN</span>
                  <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{editEmp.nric || editEmp.custom_fields?.nric || "S1234567A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8E8E93]">Base Salary</span>
                  <span className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">S$ {parseFloat(editBaseSalary).toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8E8E93]">Age</span>
                  <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">
                    {editEmp.date_of_birth ? calculateCPF(0, editEmp.date_of_birth).age : "—"} Years
                  </span>
                </div>
                <div className="flex flex-col col-span-1">
                  <span className="text-[11px] text-[#8E8E93]">Payment Date</span>
                  <input 
                    type="date"
                    value={editPaymentDate}
                    onChange={e => setEditPaymentDate(e.target.value)}
                    className="h-11 px-3 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[8px] text-[13px] font-semibold text-[#1C1C1E] dark:text-white focus:outline-none border border-[#E5E5EA] dark:border-[#2C2C35] focus:border-[#007AFF] mt-1 cursor-pointer w-full"
                  />
                </div>
                <div className="flex flex-col col-span-1">
                  <span className="text-[11px] text-[#8E8E93]">Payment Time</span>
                  <input 
                    type="time"
                    value={editPaymentTime}
                    onChange={e => setEditPaymentTime(e.target.value)}
                    className="h-11 px-3 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[8px] text-[13px] font-semibold text-[#1C1C1E] dark:text-white focus:outline-none border border-[#E5E5EA] dark:border-[#2C2C35] focus:border-[#007AFF] mt-1 cursor-pointer w-full"
                  />
                </div>
              </div>
            </div>



            {/* Bonuses (customisable) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Credits & Allowances</label>
                <button
                  onClick={() => setEditBonuses(prev => [...prev, { label: "", value: "" }])}
                  className="flex items-center gap-1 text-[12px] font-bold text-[#007AFF] hover:opacity-80 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {editBonuses.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={b.label}
                    onChange={e => setEditBonuses(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                    placeholder="Label"
                    className="w-[130px] shrink-0 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-3 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF]"
                  />
                  <div className="flex-1 flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-3 py-2.5 border border-transparent focus-within:border-[#34C759]">
                    <span className="text-[13px] text-[#8E8E93] mr-1">S$</span>
                    <input
                      type="text"
                      value={b.value}
                      onChange={e => setEditBonuses(prev => prev.map((x, i) => i === idx ? { ...x, value: formatAmount(e.target.value) } : x))}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-[13px] font-semibold text-[#34C759] placeholder:text-[#C7C7CC] focus:outline-none"
                    />
                  </div>
                  {editBonuses.length > 1 && (
                    <button onClick={() => setEditBonuses(prev => prev.filter((_, i) => i !== idx))} className="text-[#FF3B30] hover:opacity-70 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Deductions (customisable) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Deductions</label>
                <button
                  onClick={() => setEditDeductions(prev => [...prev, { label: "", value: "" }])}
                  className="flex items-center gap-1 text-[12px] font-bold text-[#007AFF] hover:opacity-80 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {editDeductions.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={d.label}
                    disabled={isCompulsory(d.label)}
                    onChange={e => setEditDeductions(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                    placeholder="Label"
                    className={`w-[130px] shrink-0 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-3 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF] ${
                      isCompulsory(d.label) ? "opacity-60 cursor-not-allowed select-none" : ""
                    }`}
                  />
                  <div className="flex-1 flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-3 py-2.5 border border-transparent focus-within:border-[#FF3B30]">
                    <span className="text-[13px] text-[#8E8E93] mr-1">S$</span>
                    <input
                      type="text"
                      value={d.value}
                      onChange={e => setEditDeductions(prev => prev.map((x, i) => i === idx ? { ...x, value: formatAmount(e.target.value) } : x))}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-[13px] font-semibold text-[#FF3B30] placeholder:text-[#C7C7CC] focus:outline-none"
                    />
                  </div>
                  {!isCompulsory(d.label) && editDeductions.length > 1 && (
                    <button onClick={() => setEditDeductions(prev => prev.filter((_, i) => i !== idx))} className="text-[#FF3B30] hover:opacity-70 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Net Pay (calculated, non-editable) */}
            <div className="bg-[#F0FDF4] dark:bg-[#34C759]/10 border border-[#34C759]/30 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#34C759] uppercase tracking-widest">Net Pay</p>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">Auto-calculated</p>
              </div>
              <span className="text-[24px] font-bold text-[#34C759]">S$ {calcNetPay()}</span>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
            <button
              onClick={() => setShowSaveConfirm(true)}
              className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold shadow-sm"
            >
              Save Changes
            </button>
          </div>

        </div>
      </>
    )}
    {/* ── Save Confirmation Modal Popup ── */}
    {showSaveConfirm && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowSaveConfirm(false)} />
        
        {/* Modal content */}
        <div className="relative bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-3xl p-6 shadow-2xl max-w-[400px] w-full mx-4 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
          <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">Save Changes</h3>
          <p className="text-[14px] text-[#8E8E93] font-medium leading-relaxed">
            Would you like to save these payroll changes to {editEmp?.name}&apos;s profile for future months as well?
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => handleSaveChanges(true)}
              className="w-full py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[14.5px] font-bold rounded-xl transition-colors shadow-md"
            >
              Yes, save for future months
            </button>
            <button
              onClick={() => handleSaveChanges(false)}
              className="w-full py-3 bg-white dark:bg-[#2C2C35] border border-[#E5E7EB] dark:border-[#3A3A45] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white text-[14px] font-bold rounded-xl transition-colors"
            >
              No, apply only for this month
            </button>
            <button
              onClick={() => setShowSaveConfirm(false)}
              className="w-full py-2 bg-transparent text-[#8E8E93] hover:text-gray-700 dark:hover:text-white text-[13px] font-semibold transition-colors mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    {/* ── Pay as Advance Side Panel ── */}
    {advanceEmp && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${advanceClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
          onClick={closeAdvancePanel}
        />

        {/* Panel */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${advanceClosing ? 'translate-x-full' : 'translate-x-0'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Pay as Advance</h2>
              <p className="text-[12px] text-[#8E8E93] mt-0.5">Issue employee salary advance</p>
            </div>
            <button onClick={closeAdvancePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          {(() => {
            const payrollSettings = advanceEmp.custom_fields?.payroll_settings;
            const advanceEmpBaseSalary = payrollSettings ? parseFloat(payrollSettings.baseSalary) : (advanceEmp.salary || 6000);
            
            const getFutureMonths = () => {
              const list = [];
              const date = new Date();
              for (let i = 0; i < 12; i++) {
                const m = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                list.push(m);
                date.setMonth(date.getMonth() + 1);
              }
              return list;
            };

            return (
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

                {/* Employee Information */}
                <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] rounded-2xl px-5 py-4 flex flex-col gap-3">
                  <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Employee Information</p>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#8E8E93]">Name</span>
                      <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{advanceEmp.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#8E8E93]">NRIC / FIN</span>
                      <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{advanceEmp.nric || advanceEmp.custom_fields?.nric || "S1234567A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#8E8E93]">Project</span>
                      <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{advanceEmp.current_project || advanceEmp.custom_fields?.project_name || "—"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#8E8E93]">Salary</span>
                      <span className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">S$ {advanceEmpBaseSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Advance Payment Details */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white flex items-center justify-between">
                      Advance Amount
                      <span className="text-[11px] text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full font-bold">Limit: S$ {getEligibleLimit(advanceEmpBaseSalary).toLocaleString()}</span>
                    </label>
                    <div className="flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 border border-transparent focus-within:border-[#007AFF]">
                      <span className="text-[14px] font-semibold text-[#8E8E93] mr-2">S$</span>
                      <input
                        type="text"
                        value={advanceAmount}
                        onChange={e => {
                          const limit = getEligibleLimit(advanceEmpBaseSalary);
                          const raw = parseAmount(e.target.value);
                          const val = parseFloat(raw) || 0;
                          if (val <= limit) {
                            setAdvanceAmount(formatAmount(raw));
                          } else {
                            setAdvanceAmount(formatAmount(String(limit)));
                          }
                        }}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-[14px] font-semibold text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] text-[#8E8E93]">Remaining Eligible Amount</span>
                      <span className="text-[11px] font-bold text-[#34C759]">S$ {getRemainingEligible(advanceEmpBaseSalary, advanceAmount).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Reason for Advance */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Reason for Advance</label>
                      <span className="text-[10px] font-medium text-[#8E8E93]">{advanceReason.length}/1000</span>
                    </div>
                    <textarea
                      value={advanceReason}
                      onChange={e => setAdvanceReason(e.target.value.slice(0, 1000))}
                      placeholder="Describe the reason for this advance request..."
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-4 text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF] min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Repayment Details */}
                  <div className="flex flex-col gap-4 p-5 bg-[#F9F9FB] dark:bg-[#1C1C1E] rounded-2xl border border-[#F2F2F7] dark:border-[#2C2C35]">
                    <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Repayment Details</p>
                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-bold text-[#1C1C1E] dark:text-white">Salary Deduct (Month)</label>
                      <div className="relative">
                        <select
                          value={advanceRepayMonth}
                          onChange={e => setAdvanceRepayMonth(e.target.value)}
                          className="w-full appearance-none bg-white dark:bg-[#121217] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-[#E5E7EB] dark:border-[#2C2C35]"
                        >
                          <option value="">Select Month</option>
                          {getFutureMonths().map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#8E8E93]">Remaining Balance Salary for this month</span>
                        <span className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
                          S$ {( advanceEmpBaseSalary - (parseFloat(parseAmount(advanceAmount)) || 0) ).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8E8E93] text-right italic">(Base Salary: S$ {advanceEmpBaseSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</p>
                    </div>
                  </div>
                </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAdvanceMethod("Bank Transfer")}
                    className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${advanceMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 32 32" className="transition-colors shrink-0">
                      <path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor" />
                    </svg>
                    <span className="text-[13px] font-bold">Bank Transfer</span>
                  </button>
                  <button
                    onClick={() => setAdvanceMethod("Cash")}
                    className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${advanceMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 512 512" className="transition-colors shrink-0">
                      <g>
                        <path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor" />
                        <path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor" />
                        <circle cx="346" cy="286" r="15" fill="currentColor" />
                        <circle cx="106" cy="286" r="15" fill="currentColor" />
                      </g>
                    </svg>
                    <span className="text-[13px] font-bold">Cash</span>
                  </button>
                </div>
                {/* Bank Selection (When Bank Transfer is selected) */}
                {advanceMethod === "Bank Transfer" && (
                  <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Pay from Bank</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {userBanks.length === 0 ? (
                        <div className="text-[13px] text-[#8E8E93] font-bold py-4 px-2 w-full text-center">
                          No bank accounts found. Please add a bank account in the Financials tab first.
                        </div>
                      ) : (
                        userBanks.map((bank) => (
                          <div
                            key={bank.id}
                            onClick={() => setAdvanceBank(bank.id)}
                            className={`flex-shrink-0 w-[180px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${advanceBank === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF]/50"}`}
                          >
                            <div className="flex flex-col gap-3 relative z-10">
                              <div className="h-8 flex items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={resolveBankLogo(bank.logo)} alt={bank.name} className="h-6 max-w-full object-contain" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white leading-tight">{bank.name}</span>
                                <span className="text-[11px] font-medium text-[#8E8E93]">{bank.accountNumber || bank.account}</span>
                              </div>
                              <button 
                                className="text-[11px] font-bold text-[#007AFF] hover:underline text-left mt-1"
                                onClick={(e) => { e.stopPropagation(); alert(`Balance: S$ ${parseFloat(bank.balance || 0).toLocaleString('en-SG', { minimumFractionDigits: 2 })}`); }}
                              >
                                Check Balance
                              </button>
                            </div>
                            {advanceBank === bank.id && (
                              <div className="absolute top-2 right-2 h-5 w-5 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm z-20 animate-in zoom-in duration-200">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
 
          {/* Footer */}
          <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
            <button
              onClick={handleIssueAdvancePayment}
              className="w-full py-4 bg-[#34C759] hover:bg-[#2EB350] transition-colors rounded-[16px] text-white text-[15px] font-bold shadow-sm"
            >
              Issue Advance
            </button>
          </div>

        </div>
      </>
    )}
    {/* ── Filter Side Panel ── */}
    {showFilter && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${filterClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
          onClick={closeFilterPanel}
        />

        {/* Panel */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[400px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${filterClosing ? 'translate-x-full' : 'translate-x-0'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">Filter Payroll</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearFilters}
                className="text-[12px] font-bold text-[#007AFF] hover:underline px-2 py-1"
              >
                Clear All
              </button>
              <button onClick={closeFilterPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            {true ? (
              <>
                {/* Department */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Department</label>
                  <div className="relative">
                    <select
                      value={tempFilters.dept}
                      onChange={e => setTempFilters(prev => ({ ...prev, dept: e.target.value }))}
                      className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    >
                      <option value="">All Departments</option>
                      {availableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4 w-4" />
                  </div>
                </div>

                {/* Project */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Project</label>
                  <div className="relative">
                    <select
                      value={tempFilters.project}
                      onChange={e => setTempFilters(prev => ({ ...prev, project: e.target.value }))}
                      className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    >
                      <option value="">All Projects</option>
                      {availableProjects.map(proj => (
                        <option key={proj} value={proj}>{proj}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4 w-4" />
                  </div>
                </div>

                {/* Designation */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Designation</label>
                  <div className="relative">
                    <select
                      value={tempFilters.designation}
                      onChange={e => setTempFilters(prev => ({ ...prev, designation: e.target.value }))}
                      className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    >
                      <option value="">All Designations</option>
                      {availableDesignations.map(desig => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4 w-4" />
                  </div>
                </div>

                {/* Salary Range */}
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Monthly Salary Range (S$)</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase pl-1">Min</span>
                      <input
                        type="number"
                        value={tempFilters.minSalary}
                        onChange={e => setTempFilters(prev => ({ ...prev, minSalary: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase pl-1">Max</span>
                      <input
                        type="number"
                        value={tempFilters.maxSalary}
                        onChange={e => setTempFilters(prev => ({ ...prev, maxSalary: e.target.value }))}
                        placeholder="Any"
                        className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Status</label>
                  <div className="flex gap-2">
                    {["All", "Paid", "Pending"].map(s => {
                      const isSelected = (tempFilters.paymentStatus || "All") === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTempFilters(prev => ({ ...prev, paymentStatus: s === "All" ? "" : s }))}
                          className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${isSelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "bg-white dark:bg-[#1C1C1E] border-[#E5E7EB] dark:border-[#2C2C35] text-[#8E8E93] hover:border-[#007AFF]"}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Project Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Project Status</label>
                  <div className="flex flex-wrap gap-2">
                    {["Pending", "Paid", "In Progress"].map(status => (
                      <button
                        key={status}
                        onClick={() => setTempProjectFilters(prev => ({ ...prev, status: prev.status === status ? "" : status }))}
                        className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${tempProjectFilters.status === status ? "bg-[#007AFF] border-[#007AFF] text-white" : "bg-white dark:bg-[#1C1C1E] border-[#E5E7EB] dark:border-[#2C2C35] text-[#8E8E93] hover:border-[#007AFF]"}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Net Payout Range */}
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Net Payout Range (S$)</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase pl-1">Min</span>
                      <input
                        type="number"
                        value={tempProjectFilters.minNet}
                        onChange={e => setTempProjectFilters(prev => ({ ...prev, minNet: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase pl-1">Max</span>
                      <input
                        type="number"
                        value={tempProjectFilters.maxNet}
                        onChange={e => setTempProjectFilters(prev => ({ ...prev, maxNet: e.target.value }))}
                        placeholder="Any"
                        className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Employee Count Range */}
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Total Employees Count</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase pl-1">Min</span>
                      <input
                        type="number"
                        value={tempProjectFilters.minEmployees}
                        onChange={e => setTempProjectFilters(prev => ({ ...prev, minEmployees: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase pl-1">Max</span>
                      <input
                        type="number"
                        value={tempProjectFilters.maxEmployees}
                        onChange={e => setTempProjectFilters(prev => ({ ...prev, maxEmployees: e.target.value }))}
                        placeholder="Any"
                        className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Status (Mock) Removed */}

          </div>

          {/* Footer */}
          <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
            <button
              onClick={handleApplyFilters}
              className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold shadow-sm"
            >
              Apply Filters
            </button>
          </div>

        </div>
      </>
    )}
    {/* ── Add Expenses Side Panel ── */}
    {expenseProj && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${expenseClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
          onClick={closeExpensePanel}
        />

        {/* Panel */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${expenseClosing ? 'translate-x-full' : 'translate-x-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Add Project Expense</h2>
              <p className="text-[12px] text-[#8E8E93] mt-0.5">Record a new expense for {expenseProj.name}</p>
            </div>
            <button onClick={closeExpensePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            
            {/* Project Information */}
            <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] rounded-2xl px-5 py-4 flex flex-col gap-3">
              <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Project Information</p>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8E8E93]">Project Name</span>
                  <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{expenseProj.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8E8E93]">Project ID</span>
                  <span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{expenseProj.id}</span>
                </div>
              </div>
            </div>

            {/* Expense Amount */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Expense Amount</label>
              <div className="flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 border border-transparent focus-within:border-[#007AFF]">
                <span className="text-[14px] font-semibold text-[#8E8E93] mr-2">S$</span>
                <input
                  type="text"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(formatAmount(parseAmount(e.target.value)))}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-[14px] font-semibold text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none"
                />
              </div>
            </div>

            {/* Expense Category */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Category</label>
              {expenseCategory === "Others" ? (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={e => {
                        const words = e.target.value.split(/\s+/);
                        if (words.length <= 30) {
                          setCustomCategory(e.target.value);
                        }
                      }}
                      placeholder="Type custom category (max 30 words)"
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF]"
                    />
                    <button
                      onClick={() => {
                        setExpenseCategory("");
                        setCustomCategory("");
                      }}
                      className="shrink-0 px-3 py-3 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C35] text-[#8E8E93] hover:text-[#FF3B30] transition-colors"
                      title="Clear category"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                  >
                    <option value="">Select Category</option>
                    <option value="Travel">Travel & Transport</option>
                    <option value="Software">Software & Subscriptions</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                    <option value="Others">Others</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4 w-4" />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Description</label>
                <span className="text-[10px] font-medium text-[#8E8E93]">{expenseDescription.length}/1000</span>
              </div>
              <textarea
                value={expenseDescription}
                onChange={e => setExpenseDescription(e.target.value.slice(0, 1000))}
                placeholder="Enter expense details..."
                className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-4 text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF] min-h-[100px] resize-none"
              />
            </div>
            
            {/* Payment Method */}
            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExpenseMethod("Bank Transfer")}
                  className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${expenseMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                >
                  <svg width="20" height="20" viewBox="0 0 32 32" className="transition-colors shrink-0">
                    <path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor" />
                  </svg>
                  <span className="text-[13px] font-bold">Bank Transfer</span>
                </button>
                <button
                  onClick={() => setExpenseMethod("Cash")}
                  className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${expenseMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                >
                  <svg width="20" height="20" viewBox="0 0 512 512" className="transition-colors shrink-0">
                    <g>
                      <path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor" />
                      <path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor" />
                      <circle cx="346" cy="286" r="15" fill="currentColor" />
                      <circle cx="106" cy="286" r="15" fill="currentColor" />
                    </g>
                  </svg>
                  <span className="text-[13px] font-bold">Cash</span>
                </button>
              </div>

              {/* Bank Selection (When Bank Transfer is selected) */}
              {expenseMethod === "Bank Transfer" && (
                <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Pay from Bank</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {COMPANY_BANKS.map((bank) => (
                      <div
                        key={bank.id}
                        onClick={() => setExpenseBank(bank.id)}
                        className={`flex-shrink-0 w-[180px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${expenseBank === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF]/50"}`}
                      >
                        <div className="flex flex-col gap-3 relative z-10">
                          <div className="h-8 flex items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={bank.logo} alt={bank.name} className="h-6 max-w-full object-contain" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white leading-tight">{bank.name}</span>
                            <span className="text-[11px] font-medium text-[#8E8E93]">{bank.account}</span>
                          </div>
                          <button 
                            className="text-[11px] font-bold text-[#007AFF] hover:underline text-left mt-1"
                            onClick={(e) => { e.stopPropagation(); alert(`Checking balance for ${bank.name}...`); }}
                          >
                            Check Balance
                          </button>
                        </div>
                        {expenseBank === bank.id && (
                          <div className="absolute top-2 right-2 h-5 w-5 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm z-20 animate-in zoom-in duration-200">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
            <button
              onClick={closeExpensePanel}
              className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold shadow-sm"
            >
              Save Expense
            </button>
          </div>
        </div>
      </>
    )}
    {/* ── Add Temporary Employee Side Panel ── */}
    {tempEmpProj && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${tempEmpClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
          onClick={closeTempEmpPanel}
        />

        {/* Panel */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[500px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${tempEmpClosing ? 'translate-x-full' : 'translate-x-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div className="flex items-center gap-3">
              {tempEmpStep === 2 && (
                <button 
                  onClick={() => setTempEmpStep(1)}
                  className="p-2 -ml-2 text-[#8E8E93] hover:text-gray-900 dark:hover:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                  {tempEmpStep === 1 ? "Add Temporary Employee" : "Payment Method"}
                </h2>
                <p className="text-[12px] text-[#8E8E93] mt-0.5">Project: {tempEmpProj.name}</p>
              </div>
            </div>
            <button onClick={closeTempEmpPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            
            {tempEmpStep === 1 ? (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Name Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">First Name</label>
                    <input
                      type="text"
                      value={tempFirstName}
                      onChange={e => setTempFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Last Name</label>
                    <input
                      type="text"
                      value={tempLastName}
                      onChange={e => setTempLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                {/* Country & ID Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Country</label>
                    <div className="relative">
                      <select
                        value={tempCountry}
                        onChange={e => setTempCountry(e.target.value)}
                        className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      >
                        {["Singapore", "Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "China", "Japan", "South Korea", "Cambodia", "Myanmar", "Laos", "Brunei"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
                      {tempCountry === "Singapore" ? "NRIC Number" : "FIN Number"}
                    </label>
                    <input
                      type="text"
                      value={tempIdNumber}
                      onChange={e => setTempIdNumber(e.target.value)}
                      placeholder={tempCountry === "Singapore" ? "S1234567A" : "F1234567A"}
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                {/* Contract Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Start Date</label>
                      <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
                        const newState = !tempUseCurrentDate;
                        setTempUseCurrentDate(newState);
                        if (newState) setTempStartDate(new Date().toISOString().split('T')[0]);
                      }}>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${tempUseCurrentDate ? 'bg-[#007AFF] border-[#007AFF]' : 'border-[#C7C7CC]'}`}>
                          {tempUseCurrentDate && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-[11px] font-medium text-[#8E8E93]">Current Date</span>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={tempStartDate}
                      disabled={tempUseCurrentDate}
                      onChange={e => setTempStartDate(e.target.value)}
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF] disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">End Date</label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={e => setTempEndDate(e.target.value)}
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                {/* Worker ID & Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Worker ID</label>
                    <input
                      type="text"
                      value={tempWorkerId}
                      onChange={e => setTempWorkerId(e.target.value)}
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Contact Number</label>
                    <div className="flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 border border-transparent focus-within:border-[#007AFF]">
                      <span className="text-[13px] font-medium text-[#8E8E93] mr-2">{tempCountry === "Singapore" ? "+65" : "+"}</span>
                      <input
                        type="text"
                        value={tempContact}
                        onChange={e => setTempContact(e.target.value.replace(/\D/g, ''))}
                        placeholder={tempCountry === "Singapore" ? "8123 4567" : "123456789"}
                        className="flex-1 bg-transparent text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Designation */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Designation</label>
                  {tempDesignation === "Other" ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input
                        type="text"
                        value={tempCustomDesignation}
                        onChange={e => setTempCustomDesignation(e.target.value)}
                        placeholder="Enter custom designation"
                        className="flex-1 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      />
                      <button onClick={() => setTempDesignation("")} className="p-3 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[14px] text-[#8E8E93] hover:text-[#FF3B30] transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={tempDesignation}
                        onChange={e => setTempDesignation(e.target.value)}
                        className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                      >
                        <option value="">Select Designation</option>
                        <option value="General Worker">General Worker</option>
                        <option value="Technician">Technician</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Driver">Driver</option>
                        <option value="Safety Officer">Safety Officer</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Salary & Bank Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Monthly Salary</label>
                    <div className="flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 border border-transparent focus-within:border-[#007AFF]">
                      <span className="text-[13px] font-medium text-[#8E8E93] mr-2">S$</span>
                      <input
                        type="text"
                        value={tempSalary}
                        onChange={e => setTempSalary(formatAmount(parseAmount(e.target.value)))}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-[13px] font-bold text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Bank Name</label>
                    <input
                      type="text"
                      value={tempBankName}
                      onChange={e => setTempBankName(e.target.value)}
                      placeholder="DBS, UOB, OCBC..."
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Account Number</label>
                  <input
                    type="text"
                    value={tempAccountNum}
                    onChange={e => setTempAccountNum(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTempPaymentMethod("Bank Transfer")}
                      className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${tempPaymentMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 32 32" className="transition-colors shrink-0">
                        <path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor" />
                      </svg>
                      <span className="text-[13px] font-bold">Bank Transfer</span>
                    </button>
                    <button
                      onClick={() => setTempPaymentMethod("Cash")}
                      className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${tempPaymentMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 512 512" className="transition-colors shrink-0">
                        <g>
                          <path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor" />
                          <path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor" />
                          <circle cx="346" cy="286" r="15" fill="currentColor" />
                          <circle cx="106" cy="286" r="15" fill="currentColor" />
                        </g>
                      </svg>
                      <span className="text-[13px] font-bold">Cash</span>
                    </button>
                  </div>
                </div>

                {/* Bank Selection (When Bank Transfer is selected) */}
                {tempPaymentMethod === "Bank Transfer" && (
                  <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Pay from Bank</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {COMPANY_BANKS.map((bank) => (
                        <div
                          key={bank.id}
                          onClick={() => setTempPaymentBank(bank.id)}
                          className={`flex-shrink-0 w-[180px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${tempPaymentBank === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF]/50"}`}
                        >
                          <div className="flex flex-col gap-3 relative z-10">
                            <div className="h-8 flex items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={bank.logo} alt={bank.name} className="h-6 max-w-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white leading-tight">{bank.name}</span>
                              <span className="text-[11px] font-medium text-[#8E8E93]">{bank.account}</span>
                            </div>
                          </div>
                          {tempPaymentBank === bank.id && (
                            <div className="absolute top-2 right-2 h-5 w-5 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm z-20 animate-in zoom-in duration-200">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35] flex items-center justify-between gap-4">
            <button
              onClick={() => {
                if (tempEmpStep === 1) {
                  closeTempEmpPanel();
                } else {
                  setTempEmpStep(1);
                }
              }}
              className="text-[15px] font-bold text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              {tempEmpStep === 1 ? "Save Changes" : "Back"}
            </button>
            <button
              onClick={() => {
                if (tempEmpStep === 1) {
                  setTempEmpStep(2);
                } else {
                  alert("Processing payment...");
                  closeTempEmpPanel();
                }
              }}
              className="flex-1 py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold shadow-sm"
            >
              {tempEmpStep === 1 ? "Pay now" : "Complete Payment"}
            </button>
          </div>
        </div>
      </>
    )}
    {/* ── Project Equity Side Panel ── */}
    {equityProj && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${equityClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
          onClick={closeEquityPanel}
        />

        {/* Panel */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[500px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${equityClosing ? 'translate-x-full' : 'translate-x-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div className="flex flex-col">
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Project Equity</h2>
              <p className="text-[12px] text-[#8E8E93] mt-0.5">{equityProj.name} • {equityProj.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (isEquityEditing) {
                    setEquityShares(PROJECT_EQUITY_HOLDERS.map(h => h.share));
                  }
                  setIsEquityEditing(!isEquityEditing);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${isEquityEditing ? 'bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20' : 'bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20'}`}
              >
                {isEquityEditing ? (
                  <>
                    <X size={14} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 size={14} />
                    Edit
                  </>
                )}
              </button>
              <button onClick={closeEquityPanel} className="p-2 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Financial Summary Strip */}
          <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-[#1C1C1E] border-b border-[#F2F2F7] dark:border-[#2C2C35] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Available Distribution</span>
              <span className="text-[18px] font-bold text-[#34C759]">S$ {(equityProj.netProfit * 0.8).toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Net Profit</span>
              <p className="text-[14px] font-bold text-gray-900 dark:text-white">S$ {equityProj.netProfit.toLocaleString()}</p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            
            {/* Equity Holders List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Shareholders</h3>
                <span className="text-[12px] font-medium text-[#8E8E93]">{PROJECT_EQUITY_HOLDERS.length} Persons</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {PROJECT_EQUITY_HOLDERS.map((holder, idx) => {
                  const sharePercentage = equityShares[idx] || 0;
                  const totalAvailable = equityProj.netProfit * 0.8;
                  const shareAmount = totalAvailable * (sharePercentage / 100);

                  return (
                    <div key={idx} className="group bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-4 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 bg-[#F2F2F7] dark:bg-[#2C2C35] text-[#8E8E93]"
                          >
                            {getInitials(holder.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">{holder.name}</span>
                            <span className="text-[12px] font-medium text-[#8E8E93]">{holder.role}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={`flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-lg px-2 py-1 border transition-all ${isEquityEditing ? 'border-[#007AFF]/30 focus-within:border-[#007AFF]' : 'border-transparent opacity-80'}`}>
                            <input 
                              type="number"
                              disabled={!isEquityEditing}
                              value={sharePercentage}
                              onChange={(e) => {
                                const newVal = parseFloat(e.target.value) || 0;
                                const newShares = [...equityShares];
                                newShares[idx] = newVal;
                                setEquityShares(newShares);
                              }}
                              className="w-12 bg-transparent text-[14px] font-bold text-[#1C1C1E] dark:text-white text-right focus:outline-none disabled:cursor-not-allowed"
                            />
                            <span className="text-[12px] font-bold text-[#8E8E93] ml-0.5">%</span>
                          </div>
                          <p className="text-[11px] font-medium text-[#8E8E93]">Ownership</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                        <span className="text-[12px] font-medium text-[#8E8E93]">Monthly Share Amount</span>
                        <div className={`flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-lg px-3 py-1.5 border transition-all ${isEquityEditing ? 'border-[#34C759]/30 focus-within:border-[#34C759]' : 'border-transparent opacity-80'}`}>
                          <span className="text-[12px] font-bold text-[#34C759] mr-1">S$</span>
                          <input 
                            type="text"
                            disabled={!isEquityEditing}
                            value={shareAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            onChange={(e) => {
                              const rawVal = e.target.value.replace(/[^0-9.]/g, "");
                              const newVal = parseFloat(rawVal) || 0;
                              const newPercentage = (newVal / totalAvailable) * 100;
                              const newShares = [...equityShares];
                              newShares[idx] = parseFloat(newPercentage.toFixed(2));
                              setEquityShares(newShares);
                            }}
                            className="w-24 bg-transparent text-[14px] font-bold text-[#34C759] text-right focus:outline-none disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Distribution Card */}
            <div className="mt-auto bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-gray-900 dark:text-white">Total Allocated Equity</span>
                <span className={`text-[13px] font-black ${equityShares.reduce((a, b) => a + b, 0) === 100 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                  {equityShares.reduce((a, b) => a + b, 0)}%
                </span>
              </div>
              <div className="h-px bg-[#F2F2F7] dark:bg-[#2C2C35] w-full" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#8E8E93]">Total Monthly Payout</span>
                <span className="text-[16px] font-black text-gray-900 dark:text-white">
                  S$ {((equityProj.netProfit * 0.8) * (equityShares.reduce((a, b) => a + b, 0) / 100)).toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35] flex items-center justify-between gap-4">
            <button
              onClick={() => {
                alert("Exporting Equity Statement...");
                closeEquityPanel();
              }}
              className="text-[15px] font-bold text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              Export equity statement
            </button>
            <button
              onClick={() => {
                alert("Equity changes saved successfully!");
                setIsEquityEditing(false);
                closeEquityPanel();
              }}
              className="flex-1 py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </>
    )}

      {/* ── Reset Payroll Confirm Modal ── */}
      {showResetPayrollConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isResettingPayroll && setShowResetPayrollConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[24px] p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="text-[18px] font-black text-gray-900 dark:text-white mb-2">Reset Payroll Payments?</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              This will permanently clear all <strong>paid employee records</strong> across all months and remove all <strong>payroll transactions</strong> from the ledger. Other finance data will not be affected.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowResetPayrollConfirm(false)}
                disabled={isResettingPayroll}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[14px] text-[14px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={resetPayrollData}
                disabled={isResettingPayroll}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-[14px] text-[14px] font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isResettingPayroll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : 'Yes, Reset Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



const formatAmount = (val: string) => {
  if (!val) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return "";
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseAmount = (val: string) => {
  return val.replace(/[^0-9.]/g, "");
};

const DEFAULT_SECTIONS = [
  { id: "s1", type: "header", label: "Company Header", visible: true, align: "center", bold: true, italic: false, fontSize: 16, color: "#111827", bgColor: "#F8F9FA", content: "" },
  { id: "s2", type: "employee_info", label: "Employee Information", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s3", type: "earnings", label: "Earnings Breakdown", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s4", type: "deductions", label: "Deductions", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s5", type: "net_pay", label: "Net Pay Summary", visible: true, align: "right", bold: true, italic: false, fontSize: 15, color: "#007AFF", bgColor: "#EFF6FF", content: "" },
  { id: "s6", type: "divider", label: "Divider Line", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#E5E7EB", bgColor: "#FFFFFF", content: "" },
  { id: "s7", type: "footer", label: "Footer & Signature", visible: true, align: "center", bold: false, italic: true, fontSize: 11, color: "#9CA3AF", bgColor: "#FFFFFF", content: "" },
];
