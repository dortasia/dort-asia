"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Info, Calendar, Filter, Download,
  ChevronLeft, ChevronRight, MoreHorizontal, Landmark, ChevronDown, 
  ArrowLeft, Settings, Share2, Edit2, Lock, Eye, EyeOff, TrendingUp, TrendingDown,
  SlidersHorizontal, X, Plus, UploadCloud, ArrowUpRight
} from "lucide-react";
import "@/components/finance/manage-bank.css";
import { createClient } from "@/utils/supabase/client";
import { uploadToCompanyStorage, toCompanySlug } from "@/utils/storageHelper";
import { generatePaymentId } from "@/utils/paymentIdHelper";

function ManageBankContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get('bank');
  
  const [activeTab, setActiveTab] = useState("Payment History");
  const [banksList, setBanksList] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Panel Open States (Slide-Over Sidebar Panels)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [resolvedCompanyId, setResolvedCompanyId] = useState("");
  const [resolvedCompanySlug, setResolvedCompanySlug] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Edit fields state
  const [editHolderName, setEditHolderName] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Local ledger transaction history
  const [localTxList, setLocalTxList] = useState<any[]>([]);

  // Duration Date Picker States & Ref
  const datePickerRef = React.useRef<HTMLDivElement>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    const pastDate = new Date(d.getFullYear(), d.getMonth() - 2, 1);
    const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
    const yyyy = pastDate.getFullYear();
    return `01-${mm}-${yyyy}`;
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${String(lastDay).padStart(2, '0')}-${mm}-${yyyy}`;
  });
  const [appliedFromDate, setAppliedFromDate] = useState(() => {
    const d = new Date();
    const pastDate = new Date(d.getFullYear(), d.getMonth() - 2, 1);
    const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
    const yyyy = pastDate.getFullYear();
    return `01-${mm}-${yyyy}`;
  });
  const [appliedToDate, setAppliedToDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${String(lastDay).padStart(2, '0')}-${mm}-${yyyy}`;
  });

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Helper to format date string to "DD MMM YYYY"
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = parseTxDate(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getEmployeeBankLogo = (bankName: string) => {
    const name = (bankName || "").toLowerCase();
    if (name.includes("dbs") || name.includes("posb")) return "/Bank logo/DBSlogo.svg";
    if (name.includes("ocbc")) return "/Bank logo/Logo-ocbc.svg";
    if (name.includes("uob")) return "/Bank logo/UOB_Logo_(2022) (1).svg";
    if (name.includes("citi")) return "/Bank logo/Citilogo.svg";
    if (name.includes("scb") || name.includes("standard chartered") || name.includes("sc ")) return "/Bank logo/SCBLogo.svg";
    if (name.includes("cimb")) return "/Bank logo/CIMBLogo.svg";
    return null;
  };

  // Helper to parse string like "08 Jun 2026, 02:30 PM" or "DD-MM-YYYY" into Date
  const parseTxDate = (dateStr: string) => {
    try {
      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          }
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
      }
      const cleanStr = dateStr.split(",")[0].trim(); // e.g. "08 Jun 2026"
      const parts = cleanStr.split(" ");
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const year = parseInt(parts[2], 10);
      const monthMap: { [key: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
      };
      const month = monthMap[monthStr] !== undefined ? monthMap[monthStr] : 5;
      return new Date(year, month, day);
    } catch (e) {
      return new Date(dateStr);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "employee-expense":
      case "employee-expenses": return "Employee Expense";
      case "payroll-payment": return "Payroll Payment";
      case "common-expense":
      case "common-expenses": return "Common Expense";
      case "project-expense":
      case "project-expenses": return "Project Expense";
      case "third-party-payment":
      case "third-person": return "Third Party Payment";
      case "project-income": return "Project Income";
      case "customer-payment": return "Customer Payment";
      case "refund": return "Refund";
      case "investment": return "Investment";
      case "loan-received": return "Loan Received";
      case "loan-investment": return "Loan & Investment";
      case "atm-withdrawal": return "ATM Withdrawal";
      case "cash-withdrawal": return "Cash Withdrawal";
      case "petty-cash": return "Petty Cash";
      case "bank-to-cash": return "Bank to Cash";
      case "cash-to-bank": return "Cash to Bank";
      case "bank-to-bank": return "Bank to Bank";
      case "wallet-transfer": return "Wallet Transfer";
      case "cycle-pay": return "Cycle Pay";
      case "self-payment": return "Self Payment";
      case "withdraw-amount": return "Withdraw Amount";
      default: {
        if (category && category.includes("-")) {
          return category.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        }
        return category || "Other";
      }
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (!dateStr.includes("-")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[monthIndex]} ${year}`;
  };

  // Filter Sidebar states
  const [showFilter, setShowFilter] = useState(false);
  const [filterClosing, setFilterClosing] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    type: "",
    category: "",
    minAmount: "",
    maxAmount: "",
    searchQuery: ""
  });

  const [tempFilters, setTempFilters] = useState({ ...appliedFilters });

  const activeFilterCount = Object.values(appliedFilters).filter(val => val !== "").length;

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const empty = {
      type: "",
      category: "",
      minAmount: "",
      maxAmount: "",
      searchQuery: ""
    };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  // Filter localTxList based on applied date range and applied filters
  const filteredTxList = localTxList
    .filter(tx => {
      if (appliedFromDate && appliedToDate) {
        const txDate = parseTxDate(tx.date);
        const start = parseTxDate(appliedFromDate);
        const end = parseTxDate(appliedToDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (txDate < start || txDate > end) return false;
      }

      if (appliedFilters.type && tx.type !== appliedFilters.type) {
        return false;
      }

      if (appliedFilters.category) {
        const catCode = appliedFilters.category;
        const cat = (tx.category || "").toLowerCase();
        const desc = (tx.descMain || "").toLowerCase();
        const tType = String(tx.type || "").toLowerCase();
        
        let match = false;
        if (catCode === "SAL") {
          match = cat === "employee-expense" || cat === "employee-expenses" || cat === "payroll-payment" || desc.includes("salary") || desc.includes("payroll");
        } else if (catCode === "PRJ") {
          match = cat === "project-expense" || cat === "project-expenses" || desc.includes("project");
        } else if (catCode === "CYC") {
          match = cat === "cycle-pay" || tType === "cycle" || desc.includes("cycle") || desc.includes("recurring");
        } else if (catCode === "COM") {
          match = cat === "common-expense" || cat === "common-expenses" || desc.includes("common");
        } else if (catCode === "BON") {
          match = cat === "bonus" || desc.includes("bonus");
        } else if (catCode === "CLM") {
          match = cat === "claim" || cat === "reimbursement" || desc.includes("claim");
        } else if (catCode === "ADV") {
          match = cat === "advance" || desc.includes("advance");
        } else if (catCode === "OTP") {
          match = cat === "overtime" || desc.includes("overtime");
        } else if (catCode === "TAX") {
          match = cat === "tax-payment" || cat === "tax-payments" || desc.includes("tax");
        }
        
        if (!match) return false;
      }

      if (appliedFilters.minAmount && tx.amount < parseFloat(appliedFilters.minAmount)) {
        return false;
      }

      if (appliedFilters.maxAmount && tx.amount > parseFloat(appliedFilters.maxAmount)) {
        return false;
      }

      if (appliedFilters.searchQuery) {
        const q = appliedFilters.searchQuery.toLowerCase();
        const matchMain = (tx.descMain || "").toLowerCase().includes(q);
        const matchSub = (tx.descSub || "").toLowerCase().includes(q);
        const matchRef = (tx.ref || "").toLowerCase().includes(q);
        const matchPid = getPaymentId(tx).toLowerCase().includes(q);
        if (!matchMain && !matchSub && !matchRef && !matchPid) return false;
      }

      return true;
    })
    .sort((a, b) => parseTxDate(b.date).getTime() - parseTxDate(a.date).getTime());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalItems = filteredTxList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTxList = filteredTxList.slice(startIndex, endIndex);

  // Secure balance toggle states
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [balancePin, setBalancePin] = useState("");
  const [balancePinError, setBalancePinError] = useState("");
  const [pinPromptPurpose, setPinPromptPurpose] = useState<"balance" | "account" | null>(null);
  const [isAccountRevealed, setIsAccountRevealed] = useState(false);

  // ── Reset Cash Drawer ──
  const [showResetDrawerConfirm, setShowResetDrawerConfirm] = useState(false);
  const [isResettingDrawer, setIsResettingDrawer] = useState(false);

  const resetCashDrawer = async () => {
    try {
      setIsResettingDrawer(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determine company owner id
      const { data: empRecord } = await supabase
        .from('employees')
        .select('company_id')
        .eq('email', user.email)
        .maybeSingle();
      const companyId = empRecord?.company_id || user.id;

      const { data } = await supabase
        .from('company_settings')
        .select('attendance_config')
        .eq('company_id', companyId)
        .maybeSingle();

      const currentConfig = data?.attendance_config || {};
      const existingTransactions: any[] = currentConfig.transactions || [];

      // Remove all cash-drawer transactions
      const nonCashDrawerTxs = existingTransactions.filter(
        (tx: any) => tx.bankId !== 'cash-drawer'
      );

      await supabase
        .from('company_settings')
        .update({ attendance_config: { ...currentConfig, transactions: nonCashDrawerTxs } })
        .eq('company_id', companyId);

      // Clear local ledger immediately
      setLocalTxList([]);
      setShowResetDrawerConfirm(false);
    } catch (e) {
      console.error('Error resetting cash drawer:', e);
    } finally {
      setIsResettingDrawer(false);
    }
  };


  // Function to backtrack transaction history balances based on ending balance
  const getDynamicTransactions = (balance: number) => {
    const tx5 = { id: "1005", date: "08 Jun 2026", time: "02:30 PM", descMain: "Interest Credit", descSub: "Interest Credit - May 2026", ref: "INT/2026/0056", type: "Credit", amount: 203.20, category: "cycle-pay", paymentTo: "Interest Credit" };
    const tx4 = { id: "1004", date: "09 Jun 2026", time: "05:45 PM", descMain: "Office Supplies Co.", descSub: "Vendor Payment - Office Supplies", ref: "NEFT/HDFC/456789", type: "Debit", amount: 450.00, category: "third-person", paymentTo: "Office Supplies Co." };
    const tx3 = { id: "1003", date: "10 Jun 2026", time: "11:15 AM", descMain: "SP Group Utilities", descSub: "Electricity Bill Payment", ref: "BILL/2026/1122", type: "Debit", amount: 124.30, category: "common-expenses", paymentTo: "SP Group Utilities" };
    const tx2 = { id: "1002", date: "11 Jun 2026", time: "03:20 PM", descMain: "Project X Client", descSub: "Client Payment - Project X", ref: "NEFT/OCBC/789123", type: "Credit", amount: 12500.00, category: "project-expenses", paymentTo: "Project X Client" };
    const tx1 = { id: "1001", date: "12 Jun 2026", time: "10:35 AM", descMain: "Alice Tan", descSub: "Salary Payment - May 2026", ref: "TRF/2026/0567", type: "Debit", amount: 8750.00, category: "employee-expenses", paymentTo: "Alice Tan" };

    let current = balance;
    
    // We process from tx1 (newest) to tx5 (oldest)
    const rawTxs = [tx1, tx2, tx3, tx4, tx5];
    const mapped = [];

    for (const tx of rawTxs) {
      const isCredit = String(tx.type || "").toLowerCase() === 'credit';
      const closing = current;
      const opening = isCredit ? (current - tx.amount) : (current + tx.amount);
      
      mapped.push({
        ...tx,
        openingBalance: opening,
        closingBalance: closing,
        balance: `S$ ${closing.toLocaleString('en-SG', { minimumFractionDigits: 2 })}`,
        employeeBankInfo: tx.category === "employee-expenses" ? {
          bankName: "DBS Bank",
          accountHolderName: tx.paymentTo,
          accountNumber: "554-329-182-3"
        } : null,
        rawTx: {
          category: tx.category,
          description: tx.descSub,
          details: { name: tx.paymentTo }
        }
      });

      // backtrack
      if (isCredit) {
        current = current - tx.amount;
      } else {
        current = current + tx.amount;
      }
    }

    return mapped;
  };

  useEffect(() => {
    async function loadBank() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Resolve company_id (owner vs employee)
          let companyId = user.id;
          let compSettings = null;

          // Try to fetch company_settings to verify if user is the company
          const { data: compCheck } = await supabase
            .from("company_settings")
            .select("company_id, company_name, attendance_config")
            .eq("company_id", user.id)
            .maybeSingle();

          compSettings = compCheck;

          if (!compCheck) {
            // User is likely an employee, find their company_id
            const { data: emp } = await supabase
              .from("employees")
              .select("company_id")
              .eq("email", user.email)
              .maybeSingle();
            if (emp) {
              companyId = emp.company_id;
              const { data: compEmp } = await supabase
                .from("company_settings")
                .select("company_id, company_name, attendance_config")
                .eq("company_id", companyId)
                .maybeSingle();
              compSettings = compEmp;
            }
          }

          setResolvedCompanyId(companyId);
          if (compSettings?.company_name) {
            setCompanyName(compSettings.company_name);
            setResolvedCompanySlug(toCompanySlug(compSettings.company_name));
          }

          // Fetch employees to get their bank details
          const { data: employeesData } = await supabase
            .from('employees')
            .select('id, name, bank_name, account_holder_name, account_number')
            .eq('company_id', companyId);

          const employeesMap = new Map();
          if (employeesData) {
            employeesData.forEach((emp: any) => {
              employeesMap.set(emp.id, emp);
            });
          }

          let found = null;
          const allTransactions = compSettings?.attendance_config?.transactions || [];

          if (bankId === 'cash-drawer') {
            // Calculate Hand Cash dynamic balance
            let dynamicBalance = 0.00; // Starting default base S$ 0.00
            allTransactions.forEach((tx: any) => {
              const amt = parseFloat(tx.amount) || 0;
              if (tx.bankId === 'cash-drawer') {
                if (tx.type === 'received') {
                  dynamicBalance += amt;
                } else {
                  dynamicBalance -= amt;
                }
              } else if (tx.type === 'withdraw' || (tx.type === 'self' && tx.category === 'bank-to-cash')) {
                dynamicBalance += amt;
              } else if (tx.type === 'self' && tx.category === 'cash-to-bank') {
                dynamicBalance -= amt;
              }
            });

            found = {
              id: 'cash-drawer',
              name: 'Hand Cash',
              logo: '/Cash_Bank_Drawer.svg',
              bg: '/Icons/ExtensionIcons/hand_cash_banner.svg',
              holderName: 'Hand Cash Drawer',
              accountNumber: 'Cash Drawer',
              balance: dynamicBalance,
              addedDate: '11 March 2026',
              status: 'Active'
            };
          } else if (compSettings?.attendance_config?.company_banks) {
            const list = (compSettings.attendance_config.company_banks || []).filter((b: any) => b.id !== 'dbs' && b.id !== 'ocbc' && b.id !== 'uob');
            const savedEquity = compSettings.attendance_config?.equity_members || [];

            // Calculate live adjusted bank balances
            const adjustedList = list.map((bank: any) => {
              const bankPrefix = bank.id.split('-')[0].toLowerCase();
              
              // Sum Initial Capital of all members registered under this bank prefix
              const initialFundingSum = savedEquity.reduce((sum: number, member: any) => {
                if (!member.bankName) return sum;
                const memberBankPrefix = member.bankName.toLowerCase();
                
                if (memberBankPrefix === bankPrefix) {
                  // Get all transactions for this member
                  const memberTxs = allTransactions.filter(
                    (tx: any) => tx.details?.equityMember?.id === member.id
                  );
                  // Sum up subsequent incoming investments
                  const subsequentSum = memberTxs.reduce((s: number, tx: any) => {
                    const isCredit = tx.type === 'received' || tx.type === 'Credit';
                    const isIncoming = isCredit && (
                      tx.category === 'investment' ||
                      tx.details?.purpose === 'Investor Funding' ||
                      tx.details?.purpose === 'Capital Injection' ||
                      tx.details?.purpose === 'Equity Funding'
                    );
                    return isIncoming ? s + (parseFloat(tx.amount) || 0) : s;
                  }, 0);

                  const initialCap = Math.max(0, (parseFloat(member.investment) || 0) - subsequentSum);
                  return sum + initialCap;
                }
                return sum;
              }, 0);

              return {
                ...bank,
                balance: (parseFloat(bank.balance) || 0) + initialFundingSum
              };
            });

            setBanksList(adjustedList);
            found = adjustedList.find((b: any) => b.id === bankId) || (adjustedList.length > 0 ? adjustedList[0] : null);
          }

          if (found) {
            const enriched = {
              ...found,
              logo: found.id === 'cash-drawer' ? '/Cash_Bank_Drawer.svg' : (found.logo === '/Bank logo/CIMB.svg' ? '/Bank logo/CIMBLogo.svg' : found.logo),
              bg: found.id === 'cash-drawer' ? '/Icons/ExtensionIcons/hand_cash_banner.svg' : (found.bg === '/Bank logo/CIMB.svg' ? '/CIMB.svg' : found.bg)
            };
            setBankDetails(enriched);
            setEditHolderName(enriched.holderName || "");
            setEditAccountNumber(enriched.accountNumber || "");
            setEditBalance(String(enriched.balance || 0));

            // Load actual transactions of this bank / drawer
            const bankTransactions = allTransactions.filter((tx: any) => {
              if (found.id === 'cash-drawer') {
                if (tx.bankId === 'cash-drawer') return true;
                if (tx.type === 'withdraw') return true;
                if (tx.type === 'self' && (tx.category === 'bank-to-cash' || tx.category === 'cash-to-bank')) return true;
                return false;
              }
              return tx.bankId === found.id;
            });

              if (bankTransactions.length > 0) {
                // Sort transactions from newest to oldest
                const sortedBankTxs = [...bankTransactions].sort((a: any, b: any) => {
                  return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
                });

                let currentBalance = found.balance || 0;
                const mappedTxs = [];

                const formatDisplayTime = (createdAtStr: string) => {
                  if (!createdAtStr) return "12:00 PM";
                  try {
                    const date = new Date(createdAtStr);
                    let hours = date.getHours();
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
                  } catch (e) {
                    return "12:00 PM";
                  }
                };

                for (const tx of sortedBankTxs) {
                  const isCredit = String(tx.type || "").toLowerCase() === 'received';
                  const txType = isCredit ? 'Credit' : 'Debit';
                  const amt = parseFloat(tx.amount) || 0;
                  
                  let descMain = "";
                  if ((tx.category === "employee-expenses" || tx.category === "employee-expense" || tx.category === "payroll-payment") && tx.details) {
                    descMain = `Employee: ${tx.details.name}`;
                  } else if ((tx.category === "project-expenses" || tx.category === "project-expense") && tx.details) {
                    descMain = `Project: ${tx.details.name}`;
                  } else if ((tx.category === "third-person" || tx.category === "third-party-payment") && tx.details) {
                    descMain = `Third Person: ${tx.details.name}`;
                  } else {
                    descMain = tx.description || getCategoryLabel(tx.category);
                  }

                  let paymentTo = "";
                  if (tx.details && tx.details.name) {
                    paymentTo = tx.details.name;
                  } else {
                    paymentTo = tx.description || getCategoryLabel(tx.category);
                  }

                  const closing = currentBalance;
                  const opening = isCredit ? (currentBalance - amt) : (currentBalance + amt);

                  // Extract employee bank details if applicable
                  let employeeBankInfo = null;
                  if ((tx.category === "employee-expenses" || tx.category === "employee-expense" || tx.category === "payroll-payment") && tx.details?.id) {
                    const emp = employeesMap.get(tx.details.id);
                    if (emp) {
                      employeeBankInfo = {
                        bankName: emp.bank_name || "Unassigned Bank",
                        accountHolderName: emp.account_holder_name || emp.name || "N/A",
                        accountNumber: emp.account_number || "N/A"
                      };
                    }
                  }

                  mappedTxs.push({
                    id: tx.id,
                    date: formatDisplayDate(tx.date),
                    time: formatDisplayTime(tx.createdAt || tx.date),
                    descMain,
                    descSub: tx.description || "N/A",
                    ref: tx.id.replace("tx-", "TX-"),
                    type: txType,
                    amount: amt,
                    openingBalance: opening,
                    closingBalance: closing,
                    paymentTo,
                    category: tx.category,
                    employeeBankInfo,
                    attachmentUrl: tx.attachmentUrl,
                    balance: `S$ ${closing.toLocaleString('en-SG', { minimumFractionDigits: 2 })}`,
                    rawTx: tx
                  });

                  // Backtrack balance
                  if (isCredit) {
                    currentBalance -= amt;
                  } else {
                    currentBalance += amt;
                  }
                }
                setLocalTxList(mappedTxs);
              } else {
                setLocalTxList([]);
              }
            }
          }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBank();
  }, [bankId]);

  const handleAddMoney = async (amountVal: string, descriptionVal: string, file: File) => {
    const parsedAmount = parseFloat(amountVal.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }
    if (!file) {
      alert("Please upload a compulsory attachment.");
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();
      
      const fullPath = await uploadToCompanyStorage(supabase, {
        companyId: resolvedCompanyId,
        companySlug: resolvedCompanySlug,
        category: 'payments',
        file: file,
      });

      if (!fullPath) {
        throw new Error("Failed to upload the attachment document.");
      }

      const { data: compSettings } = await supabase
        .from('company_settings')
        .select('attendance_config')
        .eq('company_id', resolvedCompanyId)
        .maybeSingle();

      const currentConfig = compSettings?.attendance_config || {};
      const existingBanks = currentConfig.company_banks || [];
      const existingTransactions = currentConfig.transactions || [];

      const updatedBanksList = existingBanks.map((b: any) => {
        if (b.id === bankDetails.id) {
          return { ...b, balance: (parseFloat(b.balance) || 0) + parsedAmount };
        }
        return b;
      });

      const txId = generatePaymentId("received", companyName);
      
      const newTransaction = {
        id: txId,
        bankId: bankDetails.id,
        bankName: bankDetails.name,
        type: 'received',
        category: 'common-expenses',
        amount: parsedAmount,
        description: descriptionVal || "Add Money",
        date: (() => {
          const d = new Date();
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}-${mm}-${yyyy}`;
        })(),
        createdAt: new Date().toISOString(),
        attachmentUrl: fullPath,
        status: 'approved'
      };

      const updatedConfig = {
        ...currentConfig,
        company_banks: updatedBanksList,
        transactions: [newTransaction, ...existingTransactions]
      };

      const { error } = await supabase
        .from('company_settings')
        .update({ attendance_config: updatedConfig })
        .eq('company_id', resolvedCompanyId);

      if (error) throw error;

      setBankDetails((prev: any) => ({ ...prev, balance: (parseFloat(prev.balance) || 0) + parsedAmount }));
      setBanksList(updatedBanksList);
      
      const formatDisplayTime = (createdAtStr: string) => {
        const date = new Date(createdAtStr);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      };

      const newMappedTx = {
        id: txId,
        date: newTransaction.date,
        time: formatDisplayTime(newTransaction.createdAt),
        descMain: newTransaction.description,
        descSub: "Incoming Deposit",
        ref: txId.replace("tx-", "TX-"),
        type: 'Credit',
        amount: parsedAmount,
        openingBalance: parseFloat(bankDetails.balance) || 0,
        closingBalance: (parseFloat(bankDetails.balance) || 0) + parsedAmount,
        paymentTo: "Deposit",
        attachmentUrl: fullPath,
        balance: `S$ ${((parseFloat(bankDetails.balance) || 0) + parsedAmount).toLocaleString('en-SG', { minimumFractionDigits: 2 })}`,
        rawTx: newTransaction
      };

      setLocalTxList(prev => [newMappedTx, ...prev]);
      setIsAddMoneyOpen(false);
      alert("Money added successfully!");
    } catch (e: any) {
      alert("Failed to add money: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!bankDetails) return;
    try {
      setIsSaving(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const numBalance = parseFloat(editBalance) || 0;
      
      const design = bankDetails.name.toLowerCase().includes('dbs') ? { bg: '/DBS.svg', name: 'DBS' } 
                     : bankDetails.name.toLowerCase().includes('ocbc') ? { bg: '/OCBC.svg', name: 'OCBC' } 
                     : bankDetails.name.toLowerCase().includes('uob') ? { bg: '/UOB.svg', name: 'UOB' } 
                     : bankDetails.name.toLowerCase().includes('citi') ? { bg: '/Citi.svg', name: 'Citi' } 
                     : bankDetails.name.toLowerCase().includes('cimb') ? { bg: '/CIMB.svg', name: 'CIMB' } 
                     : { bg: '/DBS.svg', name: bankDetails.name.split('-')[0].trim() };
      
      const suffix = editAccountNumber.slice(-4) || '7171';

      const updatedBank = {
        ...bankDetails,
        holderName: editHolderName,
        accountNumber: editAccountNumber,
        balance: numBalance,
        name: `${design.name} - ${suffix}`,
        account: `${design.name}-${editAccountNumber}`
      };

      const updatedBanksList = banksList.map(b => b.id === bankDetails.id ? updatedBank : b);
      
      const { data } = await supabase.from('company_settings').select('attendance_config').eq('company_id', user.id).maybeSingle();
      const currentConfig = data?.attendance_config || {};
      const updatedConfig = {
        ...currentConfig,
        company_banks: updatedBanksList
      };

      const { error } = await supabase
        .from('company_settings')
        .update({ attendance_config: updatedConfig })
        .eq('company_id', user.id);

      if (error) {
        alert("Failed to save changes: " + error.message);
        return;
      }

      setBanksList(updatedBanksList);
      setBankDetails(updatedBank);
      setIsEditOpen(false);
      alert("Bank details updated successfully!");
    } catch (e: any) {
      alert("Error saving details: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBankSettings = async (updatedBank: any) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedBanksList = banksList.map(b => b.id === updatedBank.id ? updatedBank : b);
      
      const { data } = await supabase.from('company_settings').select('attendance_config').eq('company_id', user.id).maybeSingle();
      const currentConfig = data?.attendance_config || {};
      const updatedConfig = {
        ...currentConfig,
        company_banks: updatedBanksList
      };

      const { error } = await supabase
        .from('company_settings')
        .update({ attendance_config: updatedConfig })
        .eq('company_id', user.id);

      if (error) {
        alert("Failed to update settings: " + error.message);
        return;
      }

      setBanksList(updatedBanksList);
      setBankDetails(updatedBank);
    } catch (e: any) {
      console.error(e);
    }
  };

  const getPaymentId = (tx: any) => {
    if (tx.id && /^[A-Z]{3}-\d{14}-[A-Z0-9]{6}-[A-Z0-9]+$/.test(tx.id)) {
      return tx.id;
    }
    
    // Type classification
    let typePrefix = "SND";
    const tType = String(tx.type || tx.rawTx?.type || "").toLowerCase();
    const cat = (tx.rawTx?.category || tx.category || "").toLowerCase();
    const desc = (tx.descMain || tx.description || "").toLowerCase();
    
    if (tType === "received" || tType === "credit" || tType === "receive" || tType === "incoming" || tx.type === "Credit") {
      typePrefix = "RCV";
    } else if (tType === "cycle" || tType === "cycle-pay" || tType === "recurring" || cat === "cycle-pay" || desc.includes("cycle")) {
      typePrefix = "CYC";
    } else {
      typePrefix = "SND";
    }
    
    // Date parsing
    let yearStr = "2026";
    let monthStr = "05";
    let dayStr = "31";
    try {
      const dateStr = tx.date || (tx.createdAt ? new Date(tx.createdAt).toISOString() : "");
      if (dateStr.includes("-") && dateStr.split("-").length === 3) {
        const parts = dateStr.split("-");
        if (parts[2].length === 4) {
          yearStr = parts[2];
          monthStr = parts[1];
          dayStr = parts[0];
        } else {
          yearStr = parts[0];
          monthStr = parts[1];
          dayStr = parts[2];
        }
      } else {
        const parts = dateStr.split(" ");
        const mStr = parts[1];
        const y = parts[2]?.split(",")[0];
        const d = parts[0];
        const monthMap: { [key: string]: string } = {
          Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
          Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
        };
        if (y) yearStr = y;
        if (mStr && monthMap[mStr]) monthStr = monthMap[mStr];
        if (d) dayStr = String(d).padStart(2, '0');
      }
    } catch (e) {}
    
    // Time parsing
    let timeStr = "120000";
    try {
      if (tx.time) {
        timeStr = tx.time.replace(/:/g, "").replace(/\s*[AP]M/gi, "").slice(0, 6).padEnd(6, '0');
      } else if (tx.createdAt) {
        const tPart = new Date(tx.createdAt).toISOString().split("T")[1];
        if (tPart) {
          timeStr = tPart.replace(/:/g, "").slice(0, 6);
        }
      }
    } catch (e) {}
    
    const timestamp = `${yearStr}${monthStr}${dayStr}${timeStr}`;
    
    // 6 Alphanumeric character derivation
    let randomPart = "A7K9X2";
    try {
      const rawId = String(tx.id || "179832");
      const alphanumeric = rawId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (alphanumeric.length >= 6) {
        randomPart = alphanumeric.slice(-6);
      } else {
        randomPart = (alphanumeric + "A7K9X2").slice(0, 6);
      }
    } catch (e) {}
    
    // Company initials
    let companyInitials = "CMP";
    if (companyName && companyName.trim()) {
      const words = companyName.trim().split(/\s+/);
      const initials = words
        .map(w => w.charAt(0).toUpperCase())
        .join("")
        .replace(/[^A-Z0-9]/g, "");
      if (initials.length > 0) {
        companyInitials = initials;
      }
    }
    
    return `${typePrefix}-${timestamp}-${randomPart}-${companyInitials}`;
  };

  const handleExportLedger = () => {
    if (!bankDetails) return;
    try {
      const headers = ["Payment ID", "Date", "Type", "Payment to", "Attachments", "Amount", "Opening Balance", "Closing Balance"];
      const rows = localTxList.map(tx => [
        getPaymentId(tx),
        tx.date.split(',')[0],
        tx.type === 'Debit' ? 'Debited' : 'Credited',
        `"${tx.paymentTo || tx.descMain}"`,
        tx.attachmentUrl ? "receipt.pdf" : "-",
        tx.type === 'Debit' ? `-${tx.amount}` : `+${tx.amount}`,
        tx.openingBalance || 0,
        tx.closingBalance || 0
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `statement_${bankDetails.name.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Statement exported successfully!");
    } catch (e: any) {
      alert("Failed to export: " + e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#1C1C1E] min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#007AFF] mb-3 text-[#007AFF]"></div>
        <p className="text-gray-500 font-medium text-[14px]">Loading bank details...</p>
      </div>
    );
  }

  if (!bankDetails) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#1C1C1E] min-h-[400px] p-6 text-center">
        <Landmark size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No Bank Account Found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mt-2 mb-6">
          Please add a corporate bank account first inside the financial overview page.
        </p>
        <button 
          onClick={() => router.push('/finance')}
          className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#0063CC] text-white text-[13px] font-bold rounded-[12px] shadow-sm transition-colors"
        >
          Go to Finance
        </button>
      </div>
    );
  }

  const displayName = bankDetails.id === 'cash-drawer'
    ? "Hand Cash Drawer"
    : bankDetails.name.replace("Standard Chartered", "Standard Chartered Bank").replace("SCB", "Standard Chartered Bank");
  const maskedAccountNumber = bankDetails.id === 'cash-drawer'
    ? "Cash Drawer"
    : (bankDetails.accountNumber ? `*******${bankDetails.accountNumber.slice(-4)}` : "*******7070");

  const totalCredits = localTxList
    .filter((t: any) => t.type === 'Credit')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const totalDebits = localTxList
    .filter((t: any) => t.type === 'Debit')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const totalCycles = localTxList
    .filter((t: any) => t.type === 'Debit' && (t.descMain.toLowerCase().includes('cycle') || t.descMain.toLowerCase().includes('recurring')))
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9FB] dark:bg-[#121217] overflow-y-auto page-scrollbar lg:h-screen">
      
      {/* Sticky Header */}
      <header className="px-6 py-4 lg:py-6 flex items-center justify-between sticky top-0 bg-white/85 dark:bg-[#121217]/90 backdrop-blur-xl z-30 border-b border-gray-100 dark:border-[#2C2C35]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/finance')}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-full transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500 group-hover:text-[#007AFF] dark:text-gray-400 dark:group-hover:text-white" strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-[18px] lg:text-[20px] font-bold text-gray-900 dark:text-white tracking-tight">
              {bankDetails.id === 'cash-drawer' ? "Hand Cash Drawer Management" : "Manage Bank"}
            </h1>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              {bankDetails.id === 'cash-drawer'
                ? "View cash drawer details, balance and transaction history"
                : "View account details, balance and transaction history"}
            </p>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsAddMoneyOpen(true)}
            title="Add Money"
            className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
          >
             <Plus className="h-4.5 w-4.5" strokeWidth={3} />
          </button>
          {bankDetails?.id === 'cash-drawer' && (
            <button
              onClick={() => setShowResetDrawerConfirm(true)}
              title="Reset Cash Drawer"
              className="h-10 px-3 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-[12px] text-[12px] font-bold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Reset
            </button>
          )}

          {bankDetails?.id !== 'cash-drawer' && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              title="Configure Primary Settings"
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
               <Settings className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
          <button 
            onClick={handleExportLedger}
            title="Export Statement"
            className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
          >
             <Download className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {bankDetails?.id !== 'cash-drawer' && (
            <button 
              onClick={() => setIsShareOpen(true)}
              title="Share Account Details"
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
               <Share2 className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
          {bankDetails?.id !== 'cash-drawer' && (
            <button 
              onClick={() => setIsEditOpen(true)}
              title="Edit Bank Details"
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
               <Edit2 className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </header>
 
      {/* Main Content Layout - Exact Replicant of the Uploader's Snapshot */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col gap-5">
        
        {/* 1. TOP SINGLE CARD OVERVIEW */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left Column: Bank Identity */}
          <div className="flex items-center gap-6 flex-1 min-w-[280px]">
            <div className="w-[80px] h-[80px] rounded-[20px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-3 shrink-0">
              {bankDetails.logo ? (
                <img src={bankDetails.logo} alt={displayName} className="max-h-full max-w-full object-contain" />
              ) : (
                <Landmark size={32} className="text-[#007AFF]" />
              )}
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold text-gray-900 dark:text-white leading-tight mb-1">{displayName}</h2>
              <span className="text-[13px] font-bold text-[#34C759] uppercase tracking-wider">
                {bankDetails.id === 'cash-drawer' ? "Active Cash Drawer" : "Primary Account"}
              </span>
            </div>
          </div>
          
          {/* Vertical Separator */}
          <div className="hidden lg:block h-16 w-px bg-gray-200/70 dark:bg-gray-800" />
          
          {/* Right Area: Available Balance & stacked cards moved closer near the right side */}
          <div className="flex flex-col md:flex-row items-center gap-8 pl-0 lg:pl-6 shrink-0">
            {/* Center Column: Available Balance Stack */}
            <div className="flex flex-col gap-1 w-fit md:min-w-[170px] md:w-auto shrink-0 text-left">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</span>
              {isBalanceRevealed ? (
                <div className="flex flex-col gap-1">
                  <span className={`text-[32px] font-black tracking-tight leading-none whitespace-nowrap ${Number(bankDetails.balance || 0) < 0 ? 'text-red-500' : 'text-[#34C759]'}`}>
                    S$ {Number(bankDetails.balance || 0).toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </span>
                  <button 
                    onClick={() => setIsBalanceRevealed(false)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-gray-650 dark:hover:text-white cursor-pointer mt-1 bg-gray-100 dark:bg-[#252529] px-2 py-0.5 rounded-md w-fit"
                  >
                    <EyeOff className="h-3 w-3" /> Hide Balance
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-[32px] font-black text-gray-300 dark:text-gray-700 tracking-tight leading-none select-none whitespace-nowrap">
                    S$ •••••••
                  </span>
                  <button 
                    onClick={() => {
                      setPinPromptPurpose("balance");
                      setIsPinPromptOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#007AFF] hover:underline cursor-pointer bg-[#007AFF]/10 dark:bg-[#007AFF]/20 rounded-md px-2.5 py-1 mt-1 w-fit transition-all duration-150"
                  >
                    <Eye className="h-3.5 w-3.5" /> Click to View
                  </button>
                </div>
              )}
            </div>
 
            {/* Right Column: Credits & Debits stacked cards (dynamic expansion to the left on numerical overflow) */}
            <div className="flex flex-col gap-2.5 min-w-[208px] w-auto shrink-0 items-end">
              {/* Total Credits Pill */}
              <div className="flex justify-between items-center gap-6 bg-[#F9FAFB] dark:bg-[#252529] rounded-[16px] px-4 py-2.5 border border-gray-150/60 dark:border-gray-800 w-full transition-all whitespace-nowrap">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-[#34C759]/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-[#34C759]" strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Credits</span>
                </div>
                <span className="text-[13px] font-black text-[#34C759] shrink-0">S$ {totalCredits.toLocaleString('en-SG', { minimumFractionDigits: 2 })}</span>
              </div>
              {/* Total Debits Pill */}
              <div className="flex justify-between items-center gap-6 bg-[#F9FAFB] dark:bg-[#252529] rounded-[16px] px-4 py-2.5 border border-gray-150/60 dark:border-gray-800 w-full transition-all whitespace-nowrap">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Debits</span>
                </div>
                <span className="text-[13px] font-black text-red-500 shrink-0">S$ {totalDebits.toLocaleString('en-SG', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
 
        </div>
 
        {/* 2. HORIZONTAL METADATA STRIP CARD */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200/80 dark:border-gray-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-y-4 gap-x-6">
          
          {/* Account Holder Name */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {bankDetails.id === 'cash-drawer' ? "Drawer Name" : "Account Holder Name"}
            </span>
            <span className="text-[13px] font-bold text-gray-850 dark:text-gray-200">{bankDetails.holderName || "N/A"}</span>
          </div>
          
          {/* Account Number */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {bankDetails.id === 'cash-drawer' ? "Drawer Identity" : "Account Number"}
            </span>
            {bankDetails.id === 'cash-drawer' ? (
              <span className="text-[13px] font-bold text-gray-850 dark:text-gray-200">
                {bankDetails.accountNumber}
              </span>
            ) : isAccountRevealed ? (
              <div 
                onClick={() => setIsAccountRevealed(false)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-red-500 transition-colors"
                title="Click to hide account number"
              >
                <span className="text-[13px] font-bold text-gray-850 dark:text-gray-200">
                  {bankDetails.accountNumber || "1234567895"}
                </span>
                <EyeOff className="h-3.5 w-3.5 text-gray-400" />
              </div>
            ) : (
              <div 
                onClick={() => {
                  setPinPromptPurpose("account");
                  setIsPinPromptOpen(true);
                }}
                className="flex items-center gap-1.5 cursor-pointer hover:text-[#007AFF] transition-colors"
                title="Click to view full account number"
              >
                <span className="text-[13px] font-semibold text-gray-850 dark:text-gray-200">
                  {maskedAccountNumber}
                </span>
                <Eye className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}
          </div>
 
          {/* Account Added Date */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {bankDetails.id === 'cash-drawer' ? "Established Date" : "Account Added Date"}
            </span>
            <span className="text-[13px] font-bold text-gray-850 dark:text-gray-200">{bankDetails.addedDate || "11 March 2026"}</span>
          </div>
 
          {/* Account Status */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {bankDetails.id === 'cash-drawer' ? "Drawer Status" : "Account Status"}
            </span>
            {bankDetails.status === 'Blocked' ? (
              <span className="text-[13px] font-black text-red-500">
                Blocked {bankDetails.blockedUntil && bankDetails.blockedUntil !== 'Permanent' ? `(${bankDetails.blockedUntil})` : 'Permanently'}
              </span>
            ) : (
              <span className="text-[13px] font-black text-[#34C759]">Active</span>
            )}
          </div>
 
          {/* Vertical Separator */}
          <div className="hidden md:block w-px h-8 bg-gray-200/80 dark:bg-gray-800" />
 
          {/* Alerts Pill box (Compact card housing Cycle Payments with Due Date and Days Left next to it) */}
          {(() => {
            const hasCycles = bankDetails.id === 'cash-drawer' ? totalDebits > 0 : totalCycles > 0;
            const latestPayment = localTxList.find((t: any) => t.type === 'Debit');

            if (!hasCycles && !latestPayment) {
              return (
                <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Alerts</span>
                  <div className="bg-[#F3F4F6] dark:bg-[#252529] rounded-[14px] h-[62px] px-3 flex items-center gap-2.5 flex-1 max-w-[280px] border border-gray-150/40 dark:border-gray-800">
                    <Landmark className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">No Payments</span>
                      <span className="text-[9px] font-bold text-[#34C759] mt-0.5 bg-[#34C759]/10 px-1.5 py-0.5 rounded-[5px] w-fit leading-none">Account Active</span>
                    </div>
                  </div>
                </div>
              );
            }

            if (!hasCycles && latestPayment) {
              return (
                <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Alerts</span>
                  <div className="bg-[#F3F4F6] dark:bg-[#252529] rounded-[14px] h-[62px] px-3 flex items-center gap-2.5 flex-1 max-w-[280px] border border-gray-150/40 dark:border-gray-800">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shrink-0">
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex justify-between items-center w-full gap-2">
                        <span className="text-[9.5px] font-black text-gray-700 dark:text-gray-350 uppercase tracking-wider leading-none truncate flex-1 text-left">
                          {latestPayment.paymentTo || latestPayment.descMain}
                        </span>
                        <span className="text-[13px] font-black text-[#FF3B30] leading-none shrink-0">
                          S$ {latestPayment.amount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-bold mt-0.5">
                        <span className="text-[#8E8E93] dark:text-gray-400 leading-none">Latest Payment</span>
                        <span className="text-gray-500 dark:text-gray-400 font-extrabold bg-gray-200/55 dark:bg-gray-800/80 px-1.5 py-0.5 rounded-[5px] whitespace-nowrap leading-none">
                          {latestPayment.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Alerts</span>
                <div className="bg-[#F3F4F6] dark:bg-[#252529] rounded-[14px] h-[62px] px-3 flex items-center gap-2.5 flex-1 max-w-[280px] border border-gray-150/40 dark:border-gray-800">
                  <img 
                    src="/Cycle.svg" 
                    alt="Cycle" 
                    className="w-9 h-9 pointer-events-none select-none shrink-0 animate-spin-slow" 
                    style={{ animationDuration: '8s' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[9.5px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">
                        {bankDetails.id === 'cash-drawer' ? "Cash Payments" : "Cycle Payments"}
                      </span>
                      <span className="text-[14px] font-black text-gray-900 dark:text-white leading-none">
                        S$ {(bankDetails.id === 'cash-drawer' ? totalDebits : totalCycles).toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {bankDetails.id === 'cash-drawer' ? (
                      <div className="flex items-center gap-2 text-[9px] font-bold mt-0.5">
                        <span className="text-[#34C759] font-extrabold bg-[#34C759]/10 px-1.5 py-0.5 rounded-[5px] whitespace-nowrap leading-none">Drawer Ledger Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[9px] font-bold mt-0.5">
                        <span className="text-[#8E8E93] dark:text-gray-400 leading-none">Due: 15 Jun</span>
                        <span className="text-red-500 font-extrabold bg-red-500/10 px-1.5 py-0.5 rounded-[5px] whitespace-nowrap leading-none">17d left</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
 
        </div>

        {/* 3. PAYMENT HISTORY SECTION */}
        <div className="flex flex-col gap-4 mt-1">
          {/* Payment History Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-[18px] font-black text-gray-900 dark:text-white">Payment History</h3>
            
            <div className="flex items-center gap-2.5">
              {/* Dropdown date selector */}
              <div className="relative z-40" ref={datePickerRef}>
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center gap-2 text-[12px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252529] transition-colors"
                >
                  {formatDateString(appliedFromDate)} - {formatDateString(appliedToDate)} 
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`} />
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-[290px] bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-4">
                    <div className="text-[12px] font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
                      <Calendar size={14} className="text-[#007AFF]" />
                      Select Date Range
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">From Date</label>
                        <input 
                          type="text"
                          value={fromDate}
                          placeholder="DD-MM-YYYY"
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full bg-[#F8F9FA] dark:bg-[#252529] border border-gray-200 dark:border-gray-850 rounded-xl px-3 py-2 text-[12px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">To Date</label>
                        <input 
                          type="text"
                          value={toDate}
                          placeholder="DD-MM-YYYY"
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full bg-[#F8F9FA] dark:bg-[#252529] border border-gray-200 dark:border-gray-850 rounded-xl px-3 py-2 text-[12px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <button 
                        onClick={() => {
                          const d = new Date();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const yyyy = d.getFullYear();
                          const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                          
                          const dStart = `01-${mm}-${yyyy}`;
                          const dEnd = `${String(lastDay).padStart(2, '0')}-${mm}-${yyyy}`;
                          
                          setFromDate(dStart);
                          setToDate(dEnd);
                          setAppliedFromDate(dStart);
                          setAppliedToDate(dEnd);
                          setCurrentPage(1);
                          setShowDatePicker(false);
                        }}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-[10px] text-[11px] font-bold transition-colors"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => {
                          if (!fromDate || !toDate) {
                            alert("Please enter both From and To dates");
                            return;
                          }
                          const regex = /^\d{2}-\d{2}-\d{4}$/;
                          if (!regex.test(fromDate) || !regex.test(toDate)) {
                            alert("Please enter dates in DD-MM-YYYY format (e.g. 01-05-2026)");
                            return;
                          }
                          const dFrom = parseTxDate(fromDate);
                          const dTo = parseTxDate(toDate);
                          
                          if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) {
                            alert("Invalid date format entered");
                            return;
                          }

                          if (dFrom.getFullYear() < 2020 || dFrom.getFullYear() > 2035 ||
                              dTo.getFullYear() < 2020 || dTo.getFullYear() > 2035) {
                            alert("Year must be between 2020 and 2035");
                            return;
                          }

                          if (dFrom > dTo) {
                            alert("From Date cannot be later than To Date");
                            return;
                          }
                          setAppliedFromDate(fromDate);
                          setAppliedToDate(toDate);
                          setCurrentPage(1);
                          setShowDatePicker(false);
                        }}
                        className="flex-1 py-2 bg-[#007AFF] hover:bg-[#0063CC] text-white rounded-[10px] text-[11px] font-bold transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Filter */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setTempFilters({ ...appliedFilters });
                    setShowFilter(true);
                  }}
                  className="flex items-center justify-center h-[38px] w-[38px] bg-[#007AFF] border border-[#007AFF] text-white rounded-xl hover:bg-[#0063CC] transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4 text-white" />
                </button>
                {activeFilterCount > 0 && !showFilter && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-[#34C759] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#1C1C1E] animate-in zoom-in duration-200">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              {/* Download / Export */}
              <button 
                onClick={handleExportLedger} 
                className="flex items-center justify-center h-[38px] w-[38px] bg-[#007AFF] border border-[#007AFF] text-white rounded-xl hover:bg-[#0063CC] transition-colors"
              >
                <Download className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-[20px] overflow-hidden bg-white dark:bg-[#1C1C1E]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8F9FA] dark:bg-[#252529] border-b border-gray-200 dark:border-gray-800">
                    <th className="w-10 px-4 py-4"></th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment ID</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment to</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Attachments</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150/60 dark:divide-gray-800">
                  {paginatedTxList.map(tx => {
                    const isExpanded = expandedRowId === tx.id;
                    
                    return (
                      <React.Fragment key={tx.id}>
                        <tr 
                          onClick={() => setExpandedRowId(isExpanded ? null : tx.id)}
                          className={`hover:bg-gray-50/30 dark:hover:bg-[#2C2C2E]/20 transition-all duration-150 cursor-pointer ${isExpanded ? 'bg-gray-50/20 dark:bg-[#2C2C2E]/10' : ''}`}
                        >
                          <td className="px-4 py-4.5 text-center">
                            <ChevronDown 
                              size={16} 
                              className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#007AFF]' : ''}`} 
                            />
                          </td>
                          <td className="px-6 py-4.5 text-[13px] font-bold text-gray-900 dark:text-white">{getPaymentId(tx)}</td>
                          <td className="px-6 py-4.5 whitespace-nowrap text-[13px] font-semibold text-gray-850 dark:text-gray-200">
                            {tx.date.split(',')[0]}
                          </td>
                          <td className="px-6 py-4.5 whitespace-nowrap text-[13px] font-medium text-gray-800 dark:text-gray-200">
                            {tx.time || "12:00 PM"}
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold ${tx.type === 'Debit' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-[#34C759]'}`}>
                              {tx.type === 'Debit' ? 'Debited' : 'Credited'}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-[13px] font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            {tx.paymentTo || tx.descMain}
                          </td>
                          <td className="px-6 py-4.5">
                            {tx.attachmentUrl ? (
                              <a 
                                href={tx.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#007AFF] hover:underline"
                              >
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                receipt.pdf
                              </a>
                            ) : (
                              <span className="text-[12px] font-semibold text-gray-400">-</span>
                            )}
                          </td>
                          <td className={`px-6 py-4.5 text-right text-[13px] font-black whitespace-nowrap ${tx.type === 'Debit' ? 'text-red-500' : 'text-[#34C759]'}`}>
                            {tx.type === 'Debit' ? '-' : '+'}S$ {tx.amount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        
                        {isExpanded && (
                          <tr className="bg-[#F8F9FA]/50 dark:bg-[#1C1C1E]/30">
                            <td colSpan={8} className="px-8 py-5 border-t border-b border-gray-100 dark:border-gray-800">
                              <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment to</span>
                                    <span className="text-[13px] font-bold text-gray-900 dark:text-white">{tx.paymentTo || tx.descMain}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Type</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-bold ${tx.type === 'Debit' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-[#34C759]'}`}>
                                      {tx.type === 'Debit' ? 'Debited' : 'Credited'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Opening Balance</span>
                                    <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                                      S$ {(tx.openingBalance || 0).toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Closing Balance</span>
                                    <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                                      S$ {(tx.closingBalance || 0).toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>

                                {tx.employeeBankInfo && (
                                  <div className="border-t border-gray-150/60 dark:border-gray-800 pt-4">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Employee Bank Account Details</span>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50/50 dark:bg-[#252529]/30 rounded-xl p-4 border border-gray-150 dark:border-gray-800/60">
                                      {/* Bank Logo Area */}
                                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-[#1C1C1E] flex items-center justify-center p-2 shrink-0 border border-gray-200/50 dark:border-gray-800/50 shadow-none">
                                        {getEmployeeBankLogo(tx.employeeBankInfo.bankName) ? (
                                          <img 
                                            src={getEmployeeBankLogo(tx.employeeBankInfo.bankName) || ""} 
                                            alt={tx.employeeBankInfo.bankName} 
                                            className="max-h-full max-w-full object-contain" 
                                          />
                                        ) : (
                                          <Landmark size={20} className="text-[#007AFF]" />
                                        )}
                                      </div>

                                      {/* Info Fields Grid */}
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                                        <div>
                                          <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-0.5">Bank Name</span>
                                          <span className="text-[12.5px] font-bold text-gray-850 dark:text-gray-200">{tx.employeeBankInfo.bankName}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-0.5">Account Holder</span>
                                          <span className="text-[12.5px] font-bold text-gray-850 dark:text-gray-200">{tx.employeeBankInfo.accountHolderName}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-0.5">Account Number</span>
                                          <span className="text-[12.5px] font-bold text-gray-850 dark:text-gray-200">{tx.employeeBankInfo.accountNumber}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <span className="text-[10px] font-bold text-[#8E8E93] dark:text-gray-450 uppercase tracking-wider block mb-1">Full Description</span>
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white dark:bg-[#252529] border border-gray-150 dark:border-gray-800 rounded-xl p-3.5">
                                    <p className="text-[12.5px] font-medium text-gray-650 dark:text-gray-305 leading-relaxed flex-1">
                                      {tx.descSub || "No description provided."}
                                    </p>
                                    {tx.attachmentUrl && (
                                      <a 
                                        href={tx.attachmentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[11.5px] font-bold text-[#007AFF] hover:underline flex items-center gap-1.5 shrink-0"
                                      >
                                        Open Receipt PDF
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination strip */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4.5 border-t border-gray-200 dark:border-gray-850 bg-white dark:bg-[#1C1C1E] gap-4">
              <div className="flex items-center gap-6">
                <span className="text-[13px] font-semibold text-[#8E8E93] dark:text-gray-400">
                  Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} transactions
                </span>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-[#8E8E93] dark:text-gray-400">Show:</span>
                  <div className="relative flex items-center">
                    <select 
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-transparent pr-5 text-[13px] font-bold text-gray-900 dark:text-white focus:outline-none cursor-pointer border-none p-0 focus:ring-0"
                    >
                      <option value={10} className="dark:bg-[#1C1C1E]">10</option>
                      <option value={25} className="dark:bg-[#1C1C1E]">25</option>
                      <option value={50} className="dark:bg-[#1C1C1E]">50</option>
                    </select>
                    <ChevronDown className="absolute right-0 h-3 w-3 text-gray-900 dark:text-white stroke-[3px] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`h-8 w-8 flex items-center justify-center rounded-[10px] border transition-colors ${
                    currentPage === 1 
                      ? 'border-gray-100 dark:border-gray-800 text-[#C7C7CC] dark:text-gray-700 cursor-not-allowed bg-gray-50/10' 
                      : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#1C1C1E]'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 flex items-center justify-center rounded-[10px] text-[13px] font-bold transition-all duration-150 ${
                      currentPage === page 
                        ? 'bg-[#EAF2FF] dark:bg-[#007AFF]/15 text-[#007AFF] font-bold' 
                        : 'border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#1C1C1E]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`h-8 w-8 flex items-center justify-center rounded-[10px] border transition-colors ${
                    currentPage === totalPages || totalPages === 0
                      ? 'border-gray-100 dark:border-gray-800 text-[#C7C7CC] dark:text-gray-700 cursor-not-allowed bg-gray-50/10' 
                      : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#1C1C1E]'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Edit Bank Details Sidebar Panel */}
      {isEditOpen && (
        <EditSidebarPanel 
          isSaving={isSaving}
          editHolderName={editHolderName}
          setEditHolderName={setEditHolderName}
          editAccountNumber={editAccountNumber}
          setEditAccountNumber={setEditAccountNumber}
          editBalance={editBalance}
          setEditBalance={setEditBalance}
          onSave={handleSaveBankDetails}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {/* Add Money Sidebar Panel */}
      {isAddMoneyOpen && (
        <AddMoneySidebarPanel 
          isSaving={isSaving}
          onSave={handleAddMoney}
          onClose={() => setIsAddMoneyOpen(false)}
        />
      )}

      {/* Share Account Details Sidebar Panel */}
      {isShareOpen && (
        <ShareSidebarPanel 
          bankDetails={bankDetails}
          displayName={displayName}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Bank Settings Sidebar Panel */}
      {isSettingsOpen && (
        <SettingsSidebarPanel 
          bankDetails={bankDetails}
          onUpdateBank={handleUpdateBankSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Filter Sidebar Panel */}
      {showFilter && (
        <FilterSidebarPanel 
          appliedFilters={appliedFilters}
          tempFilters={tempFilters}
          setTempFilters={setTempFilters}
          onApply={handleApplyFilters}
          onClear={clearFilters}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* Reset Cash Drawer confirm modal */}
      {showResetDrawerConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isResettingDrawer && setShowResetDrawerConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[24px] p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="text-[18px] font-black text-gray-900 dark:text-white mb-2">Reset Cash Drawer?</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              This will permanently clear all <strong>cash drawer transactions</strong> from the ledger. Credits, Debits, and the balance will reset to <strong>S$ 0.00</strong>.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowResetDrawerConfirm(false)}
                disabled={isResettingDrawer}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[14px] text-[14px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={resetCashDrawer}
                disabled={isResettingDrawer}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-[14px] text-[14px] font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isResettingDrawer ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security PIN dialog overlay */}
      {isPinPromptOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-150 dark:border-gray-800 shadow-2xl rounded-3xl p-8 max-w-sm w-full mx-4 relative flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mb-4">
              <Lock className="h-5 w-5" strokeWidth={2.5} />
            </div>
            
            <h3 className="text-[17px] font-black text-gray-900 dark:text-white text-center mb-1">Enter Security PIN</h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 text-center leading-normal max-w-[260px] mb-4">
              Enter your 4-digit transaction PIN to view the {pinPromptPurpose === "balance" ? "available balance" : "account details"}.
            </p>

            <div className="relative flex flex-col items-center w-full my-2">
              {/* Passcode Visual dots */}
              <div className="flex justify-center gap-4.5 my-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border-[2.5px] transition-all duration-200 ${
                      balancePin.length > index
                        ? "bg-[#007AFF] border-[#007AFF] scale-110 shadow-[0_0_8px_rgba(0,122,255,0.4)]"
                        : "border-gray-300 dark:border-gray-700 bg-transparent"
                    }`}
                  />
                ))}
              </div>

              {/* Transparent Numeric Keyboard Input Overlay */}
              <input
                type="tel"
                pattern="[0-9]*"
                maxLength={4}
                value={balancePin}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setBalancePin(val);
                  setBalancePinError("");
                  if (val.length === 4) {
                    if (val === "1234") {
                      if (pinPromptPurpose === "balance") {
                        setIsBalanceRevealed(true);
                      } else {
                        setIsAccountRevealed(true);
                      }
                      setIsPinPromptOpen(false);
                      setBalancePin("");
                      setBalancePinError("");
                    } else {
                      setBalancePinError("Invalid Security PIN. Please try again.");
                      setBalancePin("");
                    }
                  }
                }}
                className="absolute inset-0 w-full h-12 opacity-0 cursor-pointer text-center"
                autoFocus
              />
            </div>

            {balancePinError && (
              <div className="text-[11px] font-bold text-red-500 mt-2 text-center animate-bounce">
                {balancePinError}
              </div>
            )}

            <button 
              onClick={() => {
                setIsPinPromptOpen(false);
                setBalancePin("");
                setBalancePinError("");
              }}
              className="mt-6 text-[12px] font-bold text-[#8E8E93] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// SIDEBAR PANEL COMPONENTS (Slide-over panels)
// ────────────────────────────────────────────────────────────────────────────────

interface EditSidebarProps {
  isSaving: boolean;
  editHolderName: string;
  setEditHolderName: (v: string) => void;
  editAccountNumber: string;
  setEditAccountNumber: (v: string) => void;
  editBalance: string;
  setEditBalance: (v: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
}

function EditSidebarPanel({
  isSaving,
  editHolderName,
  setEditHolderName,
  editAccountNumber,
  setEditAccountNumber,
  editBalance,
  setEditBalance,
  onSave,
  onClose
}: EditSidebarProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20 backdrop-blur-[2px]`}
        onClick={handleClose}
      />
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Edit Bank Details</h3>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div>
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Account Holder Name</label>
            <input 
              type="text"
              value={editHolderName}
              onChange={(e) => setEditHolderName(e.target.value)}
              className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3.5 text-[14px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Account Number</label>
            <input 
              type="text"
              value={editAccountNumber}
              onChange={(e) => setEditAccountNumber(e.target.value)}
              className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3.5 text-[14px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Current Balance (S$)</label>
            <input 
              type="text"
              value={editBalance}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setEditBalance(val);
              }}
              className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3.5 text-[14px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button 
            onClick={handleClose}
            className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[16px] text-[14px] font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 py-4 bg-[#007AFF] text-white rounded-[16px] text-[14px] font-bold hover:bg-[#0063CC] disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

interface ShareSidebarProps {
  bankDetails: any;
  displayName: string;
  onClose: () => void;
}

function ShareSidebarPanel({ bankDetails, displayName, onClose }: ShareSidebarProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20 backdrop-blur-[2px]`}
        onClick={handleClose}
      />
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Share Account</h3>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 justify-center">
          <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[24px] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-gray-800 rounded-full flex items-center justify-center p-2 shrink-0">
                {bankDetails.logo ? <img src={bankDetails.logo} alt={displayName} className="max-h-full max-w-full object-contain" /> : <Landmark size={24} className="text-[#007AFF]" />}
              </div>
              <div>
                <div className="text-[15px] font-bold text-gray-900 dark:text-white leading-none mb-1.5">{displayName}</div>
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Singapore Corporate Bank</div>
              </div>
            </div>
            
            <div className="h-px bg-gray-200/50 dark:bg-gray-800" />
            
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Legal Name</div>
              <div className="text-[14px] font-bold text-gray-800 dark:text-gray-200 mt-1">{bankDetails.holderName || "Company Name"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Number</div>
              <div className="text-[15px] font-bold text-gray-900 dark:text-white mt-1">{bankDetails.accountNumber}</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`Bank: ${displayName}\nHolder: ${bankDetails.holderName || "Company Name"}\nAccount Number: ${bankDetails.accountNumber}`);
              alert("Account details copied to clipboard!");
              handleClose();
            }}
            className="w-full py-4 bg-[#007AFF] text-white hover:bg-[#0063CC] transition-colors rounded-[16px] text-[14px] font-bold flex items-center justify-center gap-2"
          >
            Copy Details
          </button>
        </div>
      </div>
    </>
  );
}

interface SettingsSidebarProps {
  bankDetails: any;
  onUpdateBank: (updatedBank: any) => Promise<void>;
  onClose: () => void;
}

function SettingsSidebarPanel({ bankDetails, onUpdateBank, onClose }: SettingsSidebarProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isPrimary, setIsPrimary] = useState(true);
  
  // State for block config
  const [isBlocked, setIsBlocked] = useState(bankDetails.status === 'Blocked');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockType, setBlockType] = useState<'temporary' | 'permanent'>('temporary');
  const [blockDuration, setBlockDuration] = useState('7 Days');

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleToggleBlock = (checked: boolean) => {
    if (checked) {
      setShowBlockModal(true);
    } else {
      // Unblock immediately
      const updated = {
        ...bankDetails,
        status: 'Active',
        blockedUntil: null
      };
      onUpdateBank(updated);
      setIsBlocked(false);
    }
  };

  const handleConfirmBlock = () => {
    const until = blockType === 'permanent' ? 'Permanent' : blockDuration;
    const updated = {
      ...bankDetails,
      status: 'Blocked',
      blockedUntil: until
    };
    onUpdateBank(updated);
    setIsBlocked(true);
    setShowBlockModal(false);
    alert(`Bank blocked successfully (${blockType === 'permanent' ? 'Permanently' : `for ${blockDuration}`})`);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20 backdrop-blur-[2px]`}
        onClick={handleClose}
      />
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Bank Settings</h3>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {/* Primary Toggle - styled beautifully in blue */}
            <div className="flex justify-between items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[16px] p-4.5 border border-gray-100 dark:border-gray-800">
              <div>
                <div className="text-[13px] font-bold text-gray-900 dark:text-white">Primary Account</div>
                <div className="text-[11px] text-gray-400 mt-0.5 font-medium">Use this account for default payments</div>
              </div>
              <div 
                onClick={() => setIsPrimary(!isPrimary)}
                className={`h-6 w-11 rounded-full relative cursor-pointer flex items-center px-1 shrink-0 transition-colors duration-200 ${isPrimary ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <div className={`h-4 w-4 bg-white rounded-full transition-transform duration-200 ${isPrimary ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
            
            {/* Block Bank Toggle - styled beautifully in blue */}
            <div className="flex justify-between items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[16px] p-4.5 border border-gray-100 dark:border-gray-800">
              <div>
                <div className="text-[13px] font-bold text-gray-900 dark:text-white">Block Bank</div>
                <div className="text-[11px] text-gray-400 mt-0.5 font-medium">Temporarily or permanently disable this bank</div>
              </div>
              <div 
                onClick={() => handleToggleBlock(!isBlocked)}
                className={`h-6 w-11 rounded-full relative cursor-pointer flex items-center px-1 shrink-0 transition-colors duration-200 ${isBlocked ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <div className={`h-4 w-4 bg-white rounded-full transition-transform duration-200 ${isBlocked ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-[#007AFF] text-white hover:bg-[#0062CC] transition-colors rounded-[16px] text-[14px] font-bold"
          >
            Done
          </button>
        </div>
      </div>

      {/* Block Duration Selection Pop-up Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => {
            setShowBlockModal(false);
            setIsBlocked(false);
          }} />
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[24px] p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-2">Block Account</h3>
            <p className="text-[13px] text-gray-500 mb-5">Select if you want to block this bank account temporarily or permanently.</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <button 
                  onClick={() => setBlockType('temporary')}
                  className={`flex-1 py-3 rounded-[14px] text-[13px] font-bold border transition-colors ${blockType === 'temporary' ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]' : 'bg-transparent border-gray-200 dark:border-gray-800 text-gray-500'}`}
                >
                  Temporarily
                </button>
                <button 
                  onClick={() => setBlockType('permanent')}
                  className={`flex-1 py-3 rounded-[14px] text-[13px] font-bold border transition-colors ${blockType === 'permanent' ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]' : 'bg-transparent border-gray-200 dark:border-gray-800 text-gray-500'}`}
                >
                  Permanently
                </button>
              </div>

              {blockType === 'temporary' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Block Duration</label>
                  <select 
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3.5 text-[14px] font-semibold text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="24 Hours">24 Hours</option>
                    <option value="7 Days">7 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowBlockModal(false);
                  setIsBlocked(false);
                }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[12px] text-[13px] font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmBlock}
                className="px-5 py-2.5 bg-red-500 text-white rounded-[12px] text-[13px] font-bold hover:bg-red-600 transition-colors"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface FilterSidebarProps {
  appliedFilters: any;
  tempFilters: any;
  setTempFilters: React.Dispatch<React.SetStateAction<any>>;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

function FilterSidebarPanel({
  tempFilters,
  setTempFilters,
  onApply,
  onClear,
  onClose
}: FilterSidebarProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20 backdrop-blur-[2px]`}
        onClick={handleClose}
      />
      {/* Slide-over Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Filter Transactions</h3>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Refine ledger records matching your criteria</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClear}
              className="text-[12px] font-bold text-[#007AFF] hover:underline px-2.5 py-1.5 rounded-lg hover:bg-[#007AFF]/10 transition-all"
            >
              Clear All
            </button>
            <button 
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Keyword Search */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Search Keyword</label>
            <input 
              type="text"
              placeholder="Search description, reference, payment ID..."
              value={tempFilters.searchQuery}
              onChange={(e) => setTempFilters((prev: any) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>

          {/* Transaction Type Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Transaction Type</label>
            <div className="relative">
              <select
                value={tempFilters.type}
                onChange={(e) => setTempFilters((prev: any) => ({ ...prev, type: e.target.value }))}
                className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-850 rounded-[14px] px-4 py-3.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
              >
                <option value="">All Types</option>
                <option value="Credit">Credit (Inflow)</option>
                <option value="Debit">Debit (Outflow)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none h-4 w-4 stroke-[2.5px]" />
            </div>
          </div>

          {/* Payment Category Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Payment Category</label>
            <div className="relative">
              <select
                value={tempFilters.category}
                onChange={(e) => setTempFilters((prev: any) => ({ ...prev, category: e.target.value }))}
                className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-850 rounded-[14px] px-4 py-3.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
              >
                <option value="">All Categories</option>
                <option value="SAL">SAL - Salary Payments</option>
                <option value="PRJ">PRJ - Project Payments</option>
                <option value="CYC">CYC - Cycle/Recurring Payments</option>
                <option value="COM">COM - Common Expenses</option>
                <option value="BON">BON - Bonus Payments</option>
                <option value="CLM">CLM - Claim Reimbursements</option>
                <option value="ADV">ADV - Salary Advances</option>
                <option value="OTP">OTP - Overtime Payments</option>
                <option value="TAX">TAX - Tax Payments</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none h-4 w-4 stroke-[2.5px]" />
            </div>
          </div>

          {/* Min/Max Amount Ranges */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Amount Range (S$)</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder="Min Amount"
                  value={tempFilters.minAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setTempFilters((prev: any) => ({ ...prev, minAmount: val }));
                  }}
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-850 rounded-[14px] px-4 py-3 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                />
              </div>
              <span className="text-gray-400 font-bold text-[13px]">to</span>
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder="Max Amount"
                  value={tempFilters.maxAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setTempFilters((prev: any) => ({ ...prev, maxAmount: val }));
                  }}
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-850 rounded-[14px] px-4 py-3 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button 
            onClick={handleClose}
            className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[16px] text-[14px] font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onApply();
              handleClose();
            }}
            className="flex-1 py-4 bg-[#007AFF] text-white rounded-[16px] text-[14px] font-bold hover:bg-[#0063CC] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

interface AddMoneySidebarProps {
  isSaving: boolean;
  onSave: (amount: string, description: string, file: File) => Promise<void>;
  onClose: () => void;
}

function AddMoneySidebarPanel({ isSaving, onSave, onClose }: AddMoneySidebarProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (val) {
      const splitVal = val.split('.');
      splitVal[0] = splitVal[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      val = splitVal.join('.');
    }
    setAmount(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount.replace(/,/g, '')) <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }
    if (!selectedFile) {
      alert("Please upload a compulsory attachment document.");
      return;
    }
    await onSave(amount, description, selectedFile);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20 backdrop-blur-[2px]`}
        onClick={handleClose}
      />
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Add Money</h3>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-205 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div>
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Amount (S$)</label>
            <input 
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3.5 text-[14px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter details or reason for deposit"
              rows={3}
              className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3.5 text-[14px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block">Attachment <span className="text-red-500">*</span></label>
              <span className="text-[10px] font-black text-[#007AFF] uppercase tracking-wider">Compulsory</span>
            </div>
            
            {selectedFile ? (
              <div className="flex items-center justify-between bg-gray-50 dark:bg-[#1C1C1E] border border-gray-250 dark:border-gray-800 rounded-xl p-3.5 mt-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-[#007AFF]/10 rounded-lg text-[#007AFF] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-bold text-gray-850 dark:text-gray-200 truncate leading-tight">{selectedFile.name}</div>
                    <div className="text-[9.5px] text-gray-405 font-bold mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-[#007AFF] dark:hover:border-[#007AFF] rounded-[18px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group bg-[#F8F9FA]/40 hover:bg-[#EAF2FF]/10"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-[#007AFF] group-hover:bg-[#EAF2FF]/50 transition-colors duration-200">
                  <UploadCloud size={20} strokeWidth={2.5} />
                </div>
                <div className="text-[13px] font-bold text-gray-850 dark:text-gray-200 mt-1">Upload Receipt or Statement</div>
                <div className="text-[10px] text-gray-400 font-bold">PDF, PNG, or JPG up to 10MB</div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button 
            onClick={handleClose}
            className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[16px] text-[14px] font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving || !amount || !selectedFile}
            className="flex-1 py-4 bg-[#007AFF] text-white rounded-[16px] text-[14px] font-bold hover:bg-[#0063CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Processing..." : "Add Money"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function ManageBankPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1C1C1E] min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#007AFF] mb-3 text-[#007AFF]"></div>
        <p className="text-gray-500 font-medium text-[14px]">Loading bank management...</p>
      </div>
    }>
      <ManageBankContent />
    </Suspense>
  );
}
