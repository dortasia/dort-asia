import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Check, Landmark, Banknote, ChevronLeft, ChevronRight, Search, User, Folder, Paperclip, Upload, Lock, UploadCloud, FileText } from "lucide-react";
import BankDropdown, { AVAILABLE_BANKS } from "./BankDropdown";
import { createClient } from "@/utils/supabase/client";
import { uploadToCompanyStorage, toCompanySlug } from "@/utils/storageHelper";
import { generatePaymentId } from "@/utils/paymentIdHelper";

interface PaymentSidebarProps {
  onClose: () => void;
  selectedBank: typeof AVAILABLE_BANKS[0];
  onSelectBank: (bank: typeof AVAILABLE_BANKS[0]) => void;
  type: 'send' | 'received' | 'cycle' | 'self' | 'withdraw';
  onSuccess?: () => void;
}

export default function PaymentSidebar({ onClose, selectedBank, onSelectBank, type, onSuccess }: PaymentSidebarProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isCash, setIsCash] = useState(false);
  const [useCurrentDate, setUseCurrentDate] = useState(true);
  const [repeatFrequency, setRepeatFrequency] = useState<'month' | 'year'>('month');
  const [amount, setAmount] = useState("0.00");
  const [customDate, setCustomDate] = useState("");
  const [description, setDescription] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Security PIN states for every payment
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [paymentPin, setPaymentPin] = useState("");
  const [paymentPinError, setPaymentPinError] = useState("");

  // Success Animation States
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [generatedTxId, setGeneratedTxId] = useState("");
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [approvedBank, setApprovedBank] = useState("");

const DEFAULT_PURPOSES: Record<string, string[]> = {
  // --- SEND CATEGORIES (Legacy & Updated) ---
  "employee-expense": [
    "Travel Allowance", "Food Allowance", "Medical Claim", "Training", 
    "Reimbursement", "Equipment Purchase", "Uniform"
  ],
  "employee-expenses": [
    "Travel Allowance", "Food Allowance", "Medical Claim", "Training", 
    "Reimbursement", "Equipment Purchase", "Uniform"
  ],
  "payroll-payment": [
    "Monthly Salary", "Advance Salary", "Overtime", "Bonus", "Incentive", "Commission", "Final Settlement"
  ],
  "common-expense": [
    "Office Supplies", "Internet Bill", "Electricity Bill", "Water Bill", 
    "Rent", "Maintenance", "Cleaning", "Pantry"
  ],
  "common-expenses": [
    "Office Supplies", "Internet Bill", "Electricity Bill", "Water Bill", 
    "Rent", "Maintenance", "Cleaning", "Pantry"
  ],
  "product-purchase": [
    "Raw Materials", "Inventory", "Office Equipment", "Laptop", 
    "Mobile Phone", "Furniture", "Machinery", "Tools"
  ],
  "project-expense": [
    "Material Purchase", "Site Expense", "Transportation", "Labor Cost", 
    "Equipment Rental", "Project Travel", "Project Supplies"
  ],
  "project-expenses": [
    "Material Purchase", "Site Expense", "Transportation", "Labor Cost", 
    "Equipment Rental", "Project Travel", "Project Supplies"
  ],
  "third-person": [
    "Personal Payment", "Consultant Fee", "Contractor Fee", 
    "Freelancer Payment", "Service Charge", "Loan Given"
  ],
  "third-party-payment": [
    "Personal Payment", "Consultant Fee", "Contractor Fee", 
    "Freelancer Payment", "Service Charge", "Loan Given"
  ],
  "tax-payment": [
    "Tax Payment", "CPF", "SDL", "Levy", "License Fee", "Government Fee"
  ],
  "subscription": [
    "Software Subscription", "Cloud Hosting", "Internet Service", "Maintenance Contract"
  ],
  "vendor-payment": [
    "Supplier Payment", "Purchase Order Payment", "Advance Payment", "Outstanding Invoice Payment"
  ],

  // --- RECEIVE CATEGORIES (Updated) ---
  "customer-payment": [
    "Project Payment", "Invoice Payment", "Advance Payment", "Final Settlement"
  ],
  "business-income": [
    "Product Sale", "Service Revenue", "Subscription Revenue", "Commission Income"
  ],
  "refund": [
    "Vendor Refund", "Employee Refund", "Tax Refund", "Bank Refund"
  ],
  "loan": [
    "Loan Received"
  ],
  "investment": [
    "Investor Funding", "Capital Injection", "Equity Funding"
  ],
  "employee-related": [
    "Advance Recovery", "Loan Recovery", "Asset Recovery"
  ],
  "other-income": [
    "Interest Earned", "Incentive Received", "Miscellaneous Income"
  ],

  // --- WITHDRAW CATEGORIES (Updated) ---
  "cash-withdrawal": [
    "ATM Withdrawal", "Cash Withdrawal", "Petty Cash"
  ],
  "atm-withdrawal": [
    "ATM Withdrawal", "Cash Withdrawal", "Petty Cash"
  ],
  "business-usage": [
    "Site Cash", "Office Cash", "Emergency Fund"
  ],
  "employee-usage": [
    "Salary Cash Payment", "Travel Advance", "Expense Advance"
  ]
};

// Dynamic Category & Inputs State
  const [category, setCategory] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [customPurposesMap, setCustomPurposesMap] = useState<Record<string, string[]>>({});

  // Determine if a category has predefined or custom purpose options
  const hasPurposeOptions = (cat: string) => {
    if (!cat) return false;
    const defaults = DEFAULT_PURPOSES[cat] || [];
    const customs = customPurposesMap[cat] || [];
    return defaults.length > 0 || customs.length > 0;
  };

  // Reset category and purpose on type changes
  useEffect(() => {
    setSelectedEmployees([]);
    setTransferDestinationType('internal');
    setSelectedDestBank(null);
    setDestBankName("");
    setDestHolderName("");
    setDestAccountNumber("");
  }, [type]);

  // Sync selectedPurpose and reset customPurpose on category changes
  useEffect(() => {
    if (category) {
      if (!hasPurposeOptions(category)) {
        setSelectedPurpose("other");
      } else {
        setSelectedPurpose("");
      }
    } else {
      setSelectedPurpose("");
    }
    setCustomPurpose("");
  }, [category, customPurposesMap]);

  const getCategoryOptions = () => {
    switch (type) {
      case 'send':
        return [
          { value: "employee-expense", label: "Employee Expense" },
          { value: "project-expense", label: "Project Expense" },
          { value: "common-expense", label: "Common Expense" },
          { value: "vendor-payment", label: "Vendor Payment" },
          { value: "third-party-payment", label: "Third Party Payment" },
          { value: "tax-payment", label: "Tax Payment" },
          { value: "other", label: "Other" },
        ];
      case 'received':
        return [
          { value: "customer-payment", label: "Customer Payment" },
          { value: "business-income", label: "Business Income" },
          { value: "refund", label: "Refund" },
          { value: "loan", label: "Loan" },
          { value: "investment", label: "Investment" },
          { value: "employee-related", label: "Employee Related" },
          { value: "other-income", label: "Other Income" },
          { value: "other", label: "Other" },
        ];
      case 'withdraw':
        return [
          { value: "cash-withdrawal", label: "Cash Withdrawal" },
          { value: "business-usage", label: "Business Usage" },
          { value: "employee-usage", label: "Employee Usage" },
          { value: "other", label: "Other" },
        ];
      case 'self':
        return [
          { value: "bank-to-cash", label: "Bank to Cash" },
          { value: "cash-to-bank", label: "Cash to Bank" },
          { value: "bank-to-bank", label: "Bank to Bank" },
          { value: "wallet-transfer", label: "Wallet Transfer" },
        ];
      default:
        return [{ value: "other", label: "Other" }];
    }
  };

  const [useDbTables, setUseDbTables] = useState(false);
  // Loaded database & settings collections
  const [loadingData, setLoadingData] = useState(true);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [resolvedCompanyId, setResolvedCompanyId] = useState("");
  const [resolvedCompanySlug, setResolvedCompanySlug] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Fetch employees and projects on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Resolve company_id (owner vs employee)
        let companyId = user.id;

        // Try to fetch company_settings to verify if user is the company
        const { data: compCheck } = await supabase
          .from("company_settings")
          .select("company_id, company_name, attendance_config")
          .eq("company_id", user.id)
          .maybeSingle();

        let compSettings = compCheck;

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

        // Check if database tables exist
        let hasDbTables = false;
        try {
          const { error: dbBanksError } = await supabase
            .from('company_banks')
            .select('id')
            .eq('company_id', companyId)
            .limit(1);
          hasDbTables = !dbBanksError;
        } catch (e) {
          hasDbTables = false;
        }
        setUseDbTables(hasDbTables);

        // 2. Fetch employees for this company
        const { data: emps } = await supabase
          .from("employees")
          .select("id, name, avatar_url, mobile, emp_id")
          .eq("company_id", companyId)
          .order("name");
        
        setAllEmployees(emps || []);

        setResolvedCompanyId(companyId);
        if (compSettings?.company_name) {
          setCompanyName(compSettings.company_name);
          setResolvedCompanySlug(toCompanySlug(compSettings.company_name));
        }

        // 3. Fetch projects and custom purposes from company settings
        if (compSettings) {
          const projectsList = compSettings.attendance_config?.projects || [];
          setAllProjects(projectsList);
          
          const customPurMap = compSettings.attendance_config?.custom_purposes || {};
          setCustomPurposesMap(customPurMap);

          if (hasDbTables) {
            const [
              { data: dbBanks },
              { data: dbEquity }
            ] = await Promise.all([
              supabase.from('company_banks').select('*').eq('company_id', companyId),
              supabase.from('equity_members').select('*').eq('company_id', companyId)
            ]);

            const mappedBanks = (dbBanks || []).map((b: any) => {
              const design = AVAILABLE_BANKS.find(ab => ab.id === b.bank_design_id) || { logo: `/Bank logo/DBSlogo.svg`, bg: '/DBS.svg', textColor: 'text-white', linkColor: 'text-gray-300', name: b.bank_design_id.toUpperCase() };
              const suffix = b.account_number.slice(-4) || '7171';
              return {
                id: b.id,
                name: `${design.name} - ${suffix}`,
                bg: (design as any).bg,
                textColor: (design as any).textColor,
                linkColor: (design as any).linkColor,
                logo: design.logo,
                account: `${design.name}-${b.account_number}`,
                holderName: b.account_holder_name,
                accountNumber: b.account_number,
                balance: parseFloat(b.balance) || 0,
                bankDesignId: b.bank_design_id
              };
            });
            setCompanyBanks(mappedBanks);

            const mappedEquity = (dbEquity || []).map((m: any) => ({
              id: m.id,
              name: m.name,
              role: m.role,
              share: parseFloat(m.share) || 0,
              investment: parseFloat(m.investment) || 0,
              email: m.email || "",
              phone: m.phone || "",
              dob: m.dob || "",
              salary: m.salary || 0,
              bankName: m.bank_name || "",
              accountNumber: m.account_number || "",
              accountHolderName: m.account_holder_name || "",
              stakeholderId: m.stakeholder_id || "",
              avatarUrl: m.avatar_url || ""
            }));
            setEquityMembers(mappedEquity);
          } else {
            const banksList = compSettings.attendance_config?.company_banks || [];
            const userOnlyBanks = banksList.filter((b: any) => b.id !== 'dbs' && b.id !== 'ocbc' && b.id !== 'uob');
            setCompanyBanks(userOnlyBanks);

            // Load equity members!
            const equityList = compSettings.attendance_config?.equity_members || [];
            setEquityMembers(equityList);
          }
         }
      } catch (err) {
        console.error("Error loading finance sidebar data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  // Employee Expenses searches
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeeResults, setEmployeeResults] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);

  // Equity Member search for Investor Funding
  const [selectedEquityMember, setSelectedEquityMember] = useState<any | null>(null);
  const [equityMembers, setEquityMembers] = useState<any[]>([]);
  const [equitySearchQuery, setEquitySearchQuery] = useState("");
  const [equityResults, setEquityResults] = useState<any[]>([]);

  // Bank to Bank Transfer states
  const [companyBanks, setCompanyBanks] = useState<any[]>([]);
  const [transferDestinationType, setTransferDestinationType] = useState<'internal' | 'external'>('internal');
  const [selectedDestBank, setSelectedDestBank] = useState<any | null>(null);
  const [destBankName, setDestBankName] = useState("");
  const [destHolderName, setDestHolderName] = useState("");
  const [destAccountNumber, setDestAccountNumber] = useState("");

  useEffect(() => {
    if (!employeeSearchQuery) {
      setEmployeeResults([]);
      return;
    }
    const filtered = allEmployees.filter(emp => 
      (emp.name || "").toLowerCase().includes(employeeSearchQuery.toLowerCase())
    );
    setEmployeeResults(filtered.slice(0, 2)); // limit to 2 matching employees as requested
  }, [employeeSearchQuery, allEmployees]);

  useEffect(() => {
    if (!equitySearchQuery) {
      setEquityResults([]);
      return;
    }
    const filtered = equityMembers.filter(m => 
      (m.name || "").toLowerCase().includes(equitySearchQuery.toLowerCase()) ||
      (m.role || "").toLowerCase().includes(equitySearchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(equitySearchQuery.toLowerCase())
    );
    setEquityResults(filtered.slice(0, 2));
  }, [equitySearchQuery, equityMembers]);

  // Project Expenses searches
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectResults, setProjectResults] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    if (!projectSearchQuery) {
      setProjectResults([]);
      return;
    }
    const filtered = allProjects.filter(p => 
      (p.name || "").toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.client || "").toLowerCase().includes(projectSearchQuery.toLowerCase())
    );
    setProjectResults(filtered);
  }, [projectSearchQuery, allProjects]);

  // Third Person fields
  const [thirdName, setThirdName] = useState("");
  const [thirdPayerName, setThirdPayerName] = useState("");
  const [thirdPhone, setThirdPhone] = useState("");
  const [thirdEmail, setThirdEmail] = useState("");

  // File Upload Attachments (all categories)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleAmountFocus = () => {
    if (amount === "0.00" || amount === "0") setAmount("");
  };

  const handleAmountBlur = () => {
    if (!amount) setAmount("0.00");
  };

  const uploadPaymentAttachment = async (): Promise<string | null> => {
    if (!selectedFile || !resolvedCompanyId || !resolvedCompanySlug) return null;
    
    try {
      const empId = (category === "employee-expense" || category === "employee-expenses" || category === "payroll-payment" || category === "employee-usage" || category === "employee-related") && selectedEmployees.length > 0
        ? (selectedEmployees[0].emp_id || undefined)
        : undefined;

      const fullPath = await uploadToCompanyStorage(createClient(), {
        companyId: resolvedCompanyId,
        companySlug: resolvedCompanySlug,
        category: 'payments',
        file: selectedFile,
        empId,
      });
      return fullPath;
    } catch (err) {
      console.error("Payment attachment upload error:", err);
      return null;
    }
  };

  const handleApprove = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    if (!selectedBank) {
      alert("Please select a bank account");
      return;
    }

    if (type !== 'cycle' && !category) {
      alert("Please choose a category");
      return;
    }

    if (type === 'cycle' && !paymentName.trim()) {
      alert("Please enter a payment name");
      return;
    }

    if ((category === "employee-expense" || category === "employee-expenses" || category === "payroll-payment" || category === "employee-usage" || category === "employee-related") && selectedEmployees.length === 0) {
      alert("Please select at least one employee");
      return;
    }

    if (type === 'self' && category === 'bank-to-bank') {
      if (transferDestinationType === 'internal' && !selectedDestBank) {
        alert("Please select a destination bank account");
        return;
      }
      if (transferDestinationType === 'external') {
        if (!destBankName.trim()) {
          alert("Please enter bank name");
          return;
        }
        if (!destHolderName.trim()) {
          alert("Please enter account holder name");
          return;
        }
        if (!destAccountNumber.trim()) {
          alert("Please enter account number");
          return;
        }
      }
    }

    if ((category === "third-party-payment" || category === "third-person") && !thirdPayerName) {
      alert(type === 'received' ? "Please enter a payer name" : "Please enter a payee name");
      return;
    }

    const isInvestorFunding = category === "investment" || selectedPurpose === "Investor Funding" || selectedPurpose === "Capital Injection" || selectedPurpose === "Equity Funding";
    if (isInvestorFunding && !selectedEquityMember) {
      alert("Please select an Equity Member for Investor Funding");
      return;
    }

    if (type !== 'cycle' && category) {
      if (!selectedPurpose) {
        alert("Please select a purpose");
        return;
      }
      if (selectedPurpose === "other" && !customPurpose.trim()) {
        alert(hasPurposeOptions(category) ? "Please enter a custom purpose" : "Please enter a purpose");
        return;
      }
    }

    if (type === 'cycle') {
      const today = new Date().toISOString().split('T')[0];
      const selectedDate = customDate || today;
      const isFuture = selectedDate > today;
      const confirmationMsg = isFuture
        ? `You are setting up a future recurring payment starting on ${selectedDate}.\n\nNo amount will be deducted from your bank balance today. Do you wish to proceed?`
        : `You are setting up a recurring payment starting on ${selectedDate} (today/past).\n\nS$ ${parsedAmount.toLocaleString('en-SG', { minimumFractionDigits: 2 })} will be deducted from your bank balance immediately. Do you wish to proceed?`;
      
      if (!confirm(confirmationMsg)) {
        return;
      }
    }

    // Open PIN prompt for validation before submission
    setPaymentPin("");
    setPaymentPinError("");
    setIsPinPromptOpen(true);
  };

  const executeApprovedPayment = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    const isInvestorFunding = category === "investment" || selectedPurpose === "Investor Funding" || selectedPurpose === "Capital Injection" || selectedPurpose === "Equity Funding";
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Upload attachment if any
      let attachmentUrl = null;
      if (selectedFile) {
        attachmentUrl = await uploadPaymentAttachment();
      }

      const transactionDate = type === 'cycle' 
        ? (customDate || new Date().toISOString().split('T')[0])
        : (useCurrentDate ? new Date().toISOString().split('T')[0] : (customDate || new Date().toISOString().split('T')[0]));

      // Construct transaction details
      let details: any = null;
      const finalPurpose = selectedPurpose === "other" ? customPurpose.trim() : selectedPurpose;
      
      if ((category === "employee-expense" || category === "employee-expenses" || category === "payroll-payment" || category === "employee-usage" || category === "employee-related") && selectedEmployees.length > 0) {
        details = {
          ...(selectedEmployees.length === 1 ? {
            id: selectedEmployees[0].id,
            name: selectedEmployees[0].name,
            emp_id: selectedEmployees[0].emp_id,
            avatar_url: selectedEmployees[0].avatar_url,
          } : {
            employees: selectedEmployees.map(e => ({
              id: e.id,
              name: e.name,
              emp_id: e.emp_id,
              avatar_url: e.avatar_url,
            })),
            name: `${selectedEmployees.length} Tagged: ${selectedEmployees.map(e => e.name).join(", ")}`,
          }),
          purpose: finalPurpose
        };
      } else if ((category === "project-expense" || category === "project-expenses" || category === "project-income" || category === "customer-payment") && selectedProject) {
        details = {
          id: selectedProject.id,
          name: selectedProject.name,
          code: selectedProject.code,
          client: selectedProject.client,
          purpose: finalPurpose
        };
      } else if (category === "third-party-payment" || category === "third-person") {
        details = {
          name: thirdPayerName,
          phone: thirdPhone,
          email: thirdEmail,
          purpose: finalPurpose
        };
      } else if (type === 'cycle') {
        details = {
          name: paymentName
        };
      } else if (type === 'self' && category === 'bank-to-bank') {
        if (transferDestinationType === 'internal' && selectedDestBank) {
          details = {
            destinationType: 'internal',
            id: selectedDestBank.id,
            name: selectedDestBank.name,
            accountNumber: selectedDestBank.accountNumber || selectedDestBank.account,
            logo: selectedDestBank.logo,
            purpose: "Bank to Bank Transfer (Internal)"
          };
        } else {
          details = {
            destinationType: 'external',
            name: destBankName,
            holderName: destHolderName,
            accountNumber: destAccountNumber,
            purpose: "Bank to Bank Transfer (External)"
          };
        }
      } else {
        if (isInvestorFunding && selectedEquityMember) {
          details = {
            purpose: finalPurpose,
            equityMember: {
              id: selectedEquityMember.id,
              name: selectedEquityMember.name,
              role: selectedEquityMember.role,
              share: selectedEquityMember.share
            }
          };
        } else if (finalPurpose) {
          details = {
            purpose: finalPurpose
          };
        }
      }

      const finalDesc = description.trim() || (isInvestorFunding && selectedEquityMember 
        ? `Investor funding of S$ ${parsedAmount.toLocaleString('en-SG', { minimumFractionDigits: 2 })} received from ${selectedEquityMember.name} (${selectedEquityMember.role})` 
        : description);

      const generatedId = generatePaymentId(type, companyName);

      if (useDbTables) {
        // --- 1. Insert into transactions table ---
        const txRow = {
          company_id: resolvedCompanyId,
          payment_id: generatedId,
          type,
          amount: parsedAmount,
          category: type === 'cycle' ? 'cycle-pay' : category,
          transaction_date: transactionDate,
          transaction_time: new Date().toTimeString().split(' ')[0],
          description: finalDesc,
          attachment_url: attachmentUrl,
          bank_id: selectedBank.id,
          bank_name: selectedBank.name,
          details: details || {}
        };
        const { error: txErr } = await supabase.from('transactions').insert(txRow);
        if (txErr) throw new Error("Failed to insert transaction: " + txErr.message);

        // --- 2. Update bank account balance(s) ---
        let sourceDelta = 0;
        if (type === 'send' || type === 'self' || type === 'withdraw') {
          sourceDelta = -parsedAmount;
        } else if (type === 'cycle') {
          const today = new Date().toISOString().split('T')[0];
          const isFutureDate = transactionDate > today;
          if (!isFutureDate) {
            sourceDelta = -parsedAmount;
          }
        } else if (type === 'received') {
          sourceDelta = parsedAmount;
        }

        if (sourceDelta !== 0) {
          const newSourceBal = (parseFloat((selectedBank as any).balance) || 0) + sourceDelta;
          const { error: srcBankErr } = await supabase
            .from('company_banks')
            .update({ balance: newSourceBal })
            .eq('id', selectedBank.id);
          if (srcBankErr) throw new Error("Failed to update source bank balance: " + srcBankErr.message);
        }

        // Handle destination bank credit for internal bank-to-bank transfer
        if (type === 'self' && category === 'bank-to-bank' && transferDestinationType === 'internal' && selectedDestBank) {
          const newDestBal = (parseFloat(selectedDestBank.balance) || 0) + parsedAmount;
          const { error: destBankErr } = await supabase
            .from('company_banks')
            .update({ balance: newDestBal })
            .eq('id', selectedDestBank.id);
          if (destBankErr) throw new Error("Failed to update destination bank balance: " + destBankErr.message);
        }

        // --- 3. If investor funding, accumulate investment on the equity member ---
        if (isInvestorFunding && selectedEquityMember) {
          const prevInvestment = parseFloat(selectedEquityMember.investment) || 0;
          const newInvestment = Math.round((prevInvestment + parsedAmount) * 100) / 100;
          const { error: equityErr } = await supabase
            .from('equity_members')
            .update({ investment: newInvestment })
            .eq('id', selectedEquityMember.id);
          if (equityErr) throw new Error("Failed to update equity member investment: " + equityErr.message);
        }

        // --- 4. Custom Purposes in company_settings ---
        if (type !== 'cycle' && category && selectedPurpose === "other" && customPurpose.trim()) {
          const trimmedCustom = customPurpose.trim();
          const { data: latestCS } = await supabase.from('company_settings').select('attendance_config').eq('company_id', resolvedCompanyId).maybeSingle();
          const latestConf = latestCS?.attendance_config || {};
          const currentCustomMap = latestConf.custom_purposes || {};
          const categoryCustomList = currentCustomMap[category] || [];
          if (!categoryCustomList.includes(trimmedCustom)) {
            currentCustomMap[category] = [...categoryCustomList, trimmedCustom];
            latestConf.custom_purposes = currentCustomMap;
            await supabase.from('company_settings').update({ attendance_config: latestConf }).eq('company_id', resolvedCompanyId);
          }
        }
      } else {
        // --- Fallback legacy code ---
        const { data: compSettings, error: fetchErr } = await supabase
          .from('company_settings')
          .select('attendance_config')
          .eq('company_id', resolvedCompanyId)
          .maybeSingle();

        if (fetchErr || !compSettings) {
          throw new Error(fetchErr?.message || "Could not fetch company settings");
        }

        const currentConfig = compSettings.attendance_config || {};
        const existingBanks = currentConfig.company_banks || [];
        const existingTransactions = currentConfig.transactions || [];

        const updatedBanks = existingBanks.map((b: any) => {
          if (b.id === selectedBank.id) {
            const currentBal = parseFloat(b.balance) || 0;
            let newBal = currentBal;
            if (type === 'send' || type === 'self' || type === 'withdraw') {
              newBal = currentBal - parsedAmount;
            } else if (type === 'cycle') {
              const today = new Date().toISOString().split('T')[0];
              const isFutureDate = transactionDate > today;
              if (!isFutureDate) {
                newBal = currentBal - parsedAmount;
              }
            } else if (type === 'received') {
              newBal = currentBal + parsedAmount;
            }
            return { ...b, balance: newBal };
          }
          if (type === 'self' && category === 'bank-to-bank' && transferDestinationType === 'internal' && selectedDestBank && b.id === selectedDestBank.id) {
            const currentBal = parseFloat(b.balance) || 0;
            return { ...b, balance: currentBal + parsedAmount };
          }
          return b;
        });

        const newTransaction = {
          id: generatedId,
          type,
          amount: parsedAmount,
          category: type === 'cycle' ? 'cycle-pay' : category,
          date: transactionDate,
          description: finalDesc,
          attachmentUrl,
          bankId: selectedBank.id,
          bankName: selectedBank.name,
          details,
          createdAt: new Date().toISOString(),
          repeatFrequency: type === 'cycle' ? repeatFrequency : undefined
        };

        const updatedTransactions = [newTransaction, ...existingTransactions];

        if (type !== 'cycle' && category && selectedPurpose === "other" && customPurpose.trim()) {
          const trimmedCustom = customPurpose.trim();
          const currentCustomMap = currentConfig.custom_purposes || {};
          const categoryCustomList = currentCustomMap[category] || [];
          if (!categoryCustomList.includes(trimmedCustom)) {
            currentCustomMap[category] = [...categoryCustomList, trimmedCustom];
            currentConfig.custom_purposes = currentCustomMap;
          }
        }

        let updatedEquityMembers: any[] = currentConfig.equity_members || [];
        if (isInvestorFunding && selectedEquityMember) {
          updatedEquityMembers = updatedEquityMembers.map((m: any) => {
            if (m.id === selectedEquityMember.id) {
              const prevInvestment = parseFloat(m.investment) || 0;
              return { ...m, investment: Math.round((prevInvestment + parsedAmount) * 100) / 100 };
            }
            return m;
          });
        }

        const updatedConfig = {
          ...currentConfig,
          company_banks: updatedBanks,
          transactions: updatedTransactions,
          equity_members: updatedEquityMembers,
        };

        const { error: updateErr } = await supabase
          .from('company_settings')
          .update({ attendance_config: updatedConfig })
          .eq('company_id', resolvedCompanyId);

        if (updateErr) {
          throw new Error(updateErr.message);
        }
      }

      setGeneratedTxId(generatedId);
      setApprovedAmount(parsedAmount);
      setApprovedBank(selectedBank.name);
      setShowSuccessAnimation(true);

      if (onSuccess) {
        onSuccess();
      }

      // Auto close after 3 seconds
      setTimeout(() => {
        handleClose();
        setShowSuccessAnimation(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error approving transaction:", err);
      alert("Error approving transaction: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for slide-out animation
  };

  const getTitle = () => {
    switch (type) {
      case 'send': return "Send Amount";
      case 'received': return "Received Amount";
      case 'cycle': return "Cycle Pay";
      case 'self': return "Self Payment";
      case 'withdraw': return "Withdraw Amount";
      default: return "Make Payment";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-transparent`}
        onClick={handleClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">{getTitle()}</h2>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          
          {/* Pay from Bank Section */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
              {type === 'received' ? "Deposit to Bank" : "Pay from Bank"}
            </h3>
                {selectedBank ? (
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-[14px] border border-gray-100 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#1C1C1E]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[32px] flex items-center justify-start shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedBank.logo} alt={selectedBank.name} className="max-h-[18px] max-w-full object-contain" />
                      </div>
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{selectedBank.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 font-mono">
                      {(selectedBank as any).accountNumber ? `**** ${(selectedBank as any).accountNumber.slice(-4)}` : selectedBank.account}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 rounded-[16px] border border-dashed border-gray-300 dark:border-[#2C2C35] bg-gray-50/50 dark:bg-[#1C1C1E]">
                    <span className="text-[13px] font-medium text-gray-400">No Bank Account Selected</span>
                  </div>
                )}
          </div>

          {/* Enter Amount Section */}
          <div className="mt-2">
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Enter Amount</h3>
            <div className="flex items-center px-5 py-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[20px]">
              <div className="flex items-baseline gap-2 w-full">
                <span className="text-[16px] font-bold text-[#8E8E93] dark:text-gray-400">S$</span>
                <input 
                  type="text" 
                  value={amount}
                  onChange={handleAmountChange}
                  onFocus={handleAmountFocus}
                  onBlur={handleAmountBlur}
                  placeholder="0.00"
                  className={`text-[16px] font-bold bg-transparent w-full focus:outline-none transition-colors ${amount && amount !== "0.00" ? 'text-gray-900 dark:text-white' : 'text-[#C7C7CC] dark:text-gray-500'}`}
                />
              </div>
            </div>
          </div>

          {/* Choose Category or Payment Name */}
          {type === 'cycle' ? (
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Payment Name</h3>
              <input 
                type="text" 
                placeholder="e.g. Office Rent, AWS Subscription"
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
                className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-transparent rounded-[14px] px-4 py-3.5 text-[14px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Choose Category</h3>
                <div className="relative">
                  <select 
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSelectedEmployees([]);
                      setSelectedProject(null);
                      setEmployeeSearchQuery("");
                      setProjectSearchQuery("");
                      setTransferDestinationType('internal');
                      setSelectedDestBank(null);
                      setDestBankName("");
                      setDestHolderName("");
                      setDestAccountNumber("");
                    }}
                    className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] pl-4 pr-10 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                  >
                    <option value="" disabled>Select Category</option>
                    {getCategoryOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Dynamic Purpose Selector Card */}
              {category && (
                <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">
                      {(!hasPurposeOptions(category) || selectedPurpose === "other") ? (hasPurposeOptions(category) ? "Custom Purpose" : "Purpose") : "Purpose"}
                    </h3>
                    {hasPurposeOptions(category) && selectedPurpose === "other" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPurpose("");
                          setCustomPurpose("");
                        }}
                        className="text-[11px] font-bold text-[#007AFF] hover:underline"
                      >
                        Select from list
                      </button>
                    )}
                  </div>

                  {(!hasPurposeOptions(category) || selectedPurpose === "other") ? (
                    <input
                      type="text"
                      placeholder="Type purpose..."
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] px-4 py-3 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedPurpose}
                        onChange={(e) => {
                          setSelectedPurpose(e.target.value);
                          if (e.target.value !== "other") {
                            setCustomPurpose("");
                          }
                        }}
                        className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] pl-4 pr-10 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                      >
                        <option value="" disabled>Select Purpose</option>
                        {(DEFAULT_PURPOSES[category] || []).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        {(customPurposesMap[category] || []).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Equity Member selector for Investor Funding purpose */}
          {(category === "investment" || selectedPurpose === "Investor Funding" || selectedPurpose === "Capital Injection" || selectedPurpose === "Equity Funding") && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white leading-none flex items-center justify-between">
                Select Equity Member <span className="text-red-500 font-bold ml-1">*</span>
              </h3>
              
              {selectedEquityMember ? (
                <div className="flex items-center justify-between p-3.5 bg-[#F0F7FF] dark:bg-[#007AFF]/10 border border-[#007AFF] rounded-[14px]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#007AFF]/25 flex items-center justify-center text-[#007AFF] shrink-0 font-bold text-[11px] overflow-hidden">
                      {selectedEquityMember.avatarUrl ? (
                        <img src={selectedEquityMember.avatarUrl} alt={selectedEquityMember.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedEquityMember.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{selectedEquityMember.name}</div>
                      <div className="text-[10px] font-semibold text-gray-450 dark:text-gray-500 leading-none mt-1">{selectedEquityMember.role} • Share: {selectedEquityMember.share}%</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedEquityMember(null)}
                    className="text-[11px] font-bold text-[#007AFF] hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                    <Search size={16} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Type equity member name..."
                    value={equitySearchQuery}
                    onChange={(e) => setEquitySearchQuery(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] pl-12 pr-4 py-3 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                  />

                  {equityResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-[160px] overflow-y-auto z-55 shadow-lg">
                      {equityResults.map((m) => (
                        <div 
                          key={m.id}
                          onClick={() => {
                            setSelectedEquityMember(m);
                            setEquitySearchQuery("");
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252529] cursor-pointer transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              m.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-none mb-1">{m.name}</div>
                            <div className="text-[10px] font-semibold text-gray-450 leading-none">{m.role} • {m.share}% Share</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {equitySearchQuery && equityResults.length === 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] p-4 text-center z-55 shadow-lg">
                      <span className="text-[12px] font-bold text-gray-455">No matching equity members found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Category-Specific Dynamic Inputs */}
          {(category === "employee-expense" || category === "employee-expenses" || category === "payroll-payment" || category === "employee-usage" || category === "employee-related") && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">
                Search Employee {selectedEmployees.length > 0 && `(${selectedEmployees.length}/10)`}
              </h3>
              
              {selectedEmployees.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50/50 dark:bg-[#1C1C1E] border border-gray-150 dark:border-gray-800 rounded-[14px]">
                  {selectedEmployees.map((emp) => (
                    <div 
                      key={emp.id}
                      className="flex items-center gap-1.5 pl-2 pr-2 py-1 bg-white dark:bg-[#252529] border border-gray-250 dark:border-gray-750 rounded-[8px] animate-in zoom-in-95 duration-100 shrink-0"
                    >
                      <div className="w-4 h-4 rounded-full bg-[#007AFF]/25 flex items-center justify-center text-[#007AFF] font-bold text-[9px] shrink-0">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (emp.name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="text-[11.5px] font-bold text-gray-800 dark:text-white truncate max-w-[120px]">
                        {emp.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedEmployees(selectedEmployees.filter(e => e.id !== emp.id))}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                  <Search size={16} />
                </div>
                <input 
                  type="text"
                  placeholder="Type employee name to search..."
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] pl-12 pr-4 py-3 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                />
                
                {loadingData && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#007AFF] border-t-transparent"></div>
                  </div>
                )}
                
                {employeeResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-[160px] overflow-y-auto z-10 shadow-lg">
                    {employeeResults.map((emp) => (
                      <div 
                        key={emp.id}
                        onClick={() => {
                          if (selectedEmployees.length >= 10) {
                            alert("You can select up to 10 employees");
                            return;
                          }
                          if (selectedEmployees.some(e => e.id === emp.id)) {
                            alert("Employee already tagged");
                            return;
                          }
                          setSelectedEmployees([...selectedEmployees, emp]);
                          setEmployeeSearchQuery("");
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252529] cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-gray-500 font-bold text-[11px]">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (emp.name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-none mb-1">{emp.name}</div>
                          <div className="text-[10px] font-semibold text-gray-400 font-mono leading-none">{emp.mobile || "N/A"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {employeeSearchQuery && !loadingData && employeeResults.length === 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] p-4 text-center z-10 shadow-lg">
                    <span className="text-[12px] font-bold text-gray-405">No matching employees found</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(category === "project-expense" || category === "project-expenses" || category === "project-income" || category === "customer-payment") && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">Search Project (Optional)</h3>
              
              {selectedProject ? (
                <div className="flex items-center justify-between p-3.5 bg-[#F0F7FF] dark:bg-[#007AFF]/10 border border-[#007AFF] rounded-[14px]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#007AFF]/25 flex items-center justify-center text-[#007AFF] shrink-0">
                      <Folder size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{selectedProject.name}</div>
                      <div className="text-[10px] font-semibold text-gray-450 dark:text-gray-500 leading-none mt-1">Code: {selectedProject.code} {selectedProject.client ? `| Client: ${selectedProject.client}` : ""}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="text-[11px] font-bold text-[#007AFF] hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                    <Search size={16} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Type project name..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] pl-12 pr-4 py-3 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                  />

                  {projectResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-[160px] overflow-y-auto z-10 shadow-lg">
                      {projectResults.map((p) => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setSelectedProject(p);
                            setProjectSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252529] cursor-pointer transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-gray-400">
                            <Folder size={14} />
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-none mb-1">{p.name}</div>
                            <div className="text-[10px] font-semibold text-gray-450 leading-none">{p.code} {p.client ? `• ${p.client}` : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {projectSearchQuery && projectResults.length === 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[14px] p-4 text-center z-10 shadow-lg">
                      <span className="text-[12px] font-bold text-gray-400">No matching projects found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {type === 'self' && category === 'bank-to-bank' && (
            <div className="flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
              {/* Destination Type Toggle (Tabs) */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Destination Account Type</h3>
                <div className="flex gap-2 p-1 bg-[#F1F2F4] dark:bg-[#1C1C1E] rounded-xl border border-gray-150 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setTransferDestinationType('internal')}
                    className={`flex-1 py-2 text-[12.5px] font-bold rounded-lg transition-all ${
                      transferDestinationType === 'internal'
                        ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Internal Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferDestinationType('external')}
                    className={`flex-1 py-2 text-[12.5px] font-bold rounded-lg transition-all ${
                      transferDestinationType === 'external'
                        ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    External Account
                  </button>
                </div>
              </div>

              {transferDestinationType === 'internal' ? (
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Select Destination Bank</h3>
                  <div className="relative">
                    <select
                      value={selectedDestBank?.id || ""}
                      onChange={(e) => {
                        const bank = companyBanks.find(b => b.id === e.target.value);
                        setSelectedDestBank(bank || null);
                      }}
                      className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] pl-4 pr-10 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                    >
                      <option value="" disabled>Select Internal Bank</option>
                      {companyBanks
                        .filter(b => b.id !== selectedBank?.id) // exclude source bank
                        .map(b => {
                          const formatAccount = (accountStr: string) => {
                            if (!accountStr) return "";
                            const clean = accountStr.replace("Standard Chartered", "SCB");
                            const parts = clean.split("-");
                            if (parts.length > 1) {
                              const bankName = parts[0].trim();
                              const accNum = parts[1].trim();
                              const suffix = accNum.slice(-4);
                              return `${bankName} - ${suffix}`;
                            }
                            return clean;
                          };
                          return (
                            <option key={b.id} value={b.id}>
                              {formatAccount(b.account || b.name)}
                            </option>
                          );
                        })}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-850 rounded-[20px] p-5 animate-in fade-in duration-200">
                  <h3 className="text-[13.5px] font-black text-gray-900 dark:text-white leading-none border-b border-gray-200 dark:border-gray-800 pb-2.5">
                    External Bank Details
                  </h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bank Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. DBS, OCBC, UOB"
                      value={destBankName}
                      onChange={(e) => setDestBankName(e.target.value)}
                      className="w-full bg-white dark:bg-[#252529] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account Holder Name</label>
                    <input 
                      type="text"
                      placeholder="Enter Holder Name"
                      value={destHolderName}
                      onChange={(e) => setDestHolderName(e.target.value)}
                      className="w-full bg-white dark:bg-[#252529] border border-gray-250 dark:border-gray-850 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account Number</label>
                    <input 
                      type="text"
                      placeholder="Enter Account Number"
                      value={destAccountNumber}
                      onChange={(e) => setDestAccountNumber(e.target.value)}
                      className="w-full bg-white dark:bg-[#252529] border border-gray-250 dark:border-gray-850 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {(category === "third-party-payment" || category === "third-person") && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-850 rounded-[20px] p-5">
              <h3 className="text-[13.5px] font-black text-gray-900 dark:text-white leading-none border-b border-gray-200 dark:border-gray-800 pb-2.5">
                {type === 'received' ? 'Payer Details' : 'Payee Details'}
              </h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {type === 'received' ? 'Payer Name' : 'Payee Name'}
                </label>
                <input 
                  type="text"
                  placeholder="Enter Name"
                  value={thirdPayerName}
                  onChange={(e) => setThirdPayerName(e.target.value)}
                  className="w-full bg-white dark:bg-[#252529] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone number</label>
                <input 
                  type="text"
                  placeholder="Enter Phone number"
                  value={thirdPhone}
                  onChange={(e) => setThirdPhone(e.target.value)}
                  className="w-full bg-white dark:bg-[#252529] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</label>
                <input 
                  type="email"
                  placeholder="Enter Email"
                  value={thirdEmail}
                  onChange={(e) => setThirdEmail(e.target.value)}
                  className="w-full bg-white dark:bg-[#252529] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                />
              </div>
            </div>
          )}

          {/* Upload Attachment Card (For All Categories) */}
          <div className="mt-2">
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Attach Receipt / Document</h3>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="h-11 px-3 w-full bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-gray-800 rounded-[8px] flex items-center justify-between cursor-pointer hover:border-[#007AFF] transition-all group"
            >
              <span className={`text-[13px] font-medium truncate pr-4 ${selectedFile ? 'text-gray-900 dark:text-white font-semibold' : 'text-[#8E8E93]'}`}>
                {selectedFile ? selectedFile.name : "Click to upload"}
              </span>
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="p-1 hover:bg-gray-150 dark:hover:bg-gray-850 rounded transition-colors text-red-500"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <FileText className="h-4 w-4 text-[#007AFF]" strokeWidth={2} />
                </div>
              ) : (
                <UploadCloud className="h-4 w-4 text-[#8E8E93] group-hover:text-[#007AFF]" strokeWidth={2} />
              )}
            </div>
          </div>

          {/* Date & Repeat Options */}
          {type === 'cycle' ? (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Choose Date</h3>
                <div className="relative">
                  <input 
                    type="date" 
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none border border-transparent"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Make Repeat Every</h3>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setRepeatFrequency('month')}
                    className={`flex-1 py-3.5 rounded-[14px] text-[14px] font-bold border transition-all ${repeatFrequency === 'month' ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-400 border-transparent'}`}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setRepeatFrequency('year')}
                    className={`flex-1 py-3.5 rounded-[14px] text-[14px] font-bold border transition-all ${repeatFrequency === 'year' ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-400 border-transparent'}`}
                  >
                    Year
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Date</h3>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setUseCurrentDate(!useCurrentDate)}>
                  <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all ${useCurrentDate ? 'bg-[#007AFF] border-[#007AFF]' : 'bg-transparent border-gray-300'}`}>
                    {useCurrentDate && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-[12px] font-medium text-gray-500">Use Current Date</span>
                </div>
              </div>
              {!useCurrentDate && (
                <input 
                  type="date" 
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none border border-transparent"
                />
              )}
            </div>
          )}


        </div>

        {/* Footer */}
        <div className="p-6 pt-2 pb-8">
          {type === 'cycle' && (
            <div className="mb-4 p-3.5 rounded-2xl text-[12px] font-semibold leading-relaxed border transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 bg-[#EBF5FF] dark:bg-[#007AFF]/10 text-[#007AFF] dark:text-blue-400 border-[#D0E7FF] dark:border-[#007AFF]/20">
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const selectedDate = customDate || today;
                if (selectedDate > today) {
                  return "🕒 Future Recurring Payment: Since the starting date is in the future, the amount will NOT be deducted from your bank balance today.";
                } else {
                  return "💸 Immediate Deduction: Since the starting date is today or in the past, the amount will be deducted from your bank balance immediately.";
                }
              })()}
            </div>
          )}
          <p className="text-[10px] font-medium text-gray-400 text-center mb-4">
            Note: Transactions are data entries, not actual money transfers.
          </p>
          <button 
            onClick={handleApprove}
            disabled={isSubmitting}
            className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-[16px] text-white text-[15px] font-bold"
          >
            {isSubmitting ? 'Processing...' : (type === 'cycle' ? 'Set Recurring Payment' : 'Approve Transaction')}
          </button>
        </div>

        {/* CSS Keyframes and Animation injections */}
        <style>{`
          @keyframes draw-circle {
            100% { stroke-dashoffset: 0; }
          }
          @keyframes draw-check {
            100% { stroke-dashoffset: 0; }
          }
          @keyframes success-pulse {
            0%, 100% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.15); opacity: 0.4; }
          }
          .animate-draw-circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            animation: draw-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          }
          .animate-draw-check {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: draw-check 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.5s forwards;
          }
          .animate-success-pulse {
            animation: success-pulse 2s infinite ease-in-out;
          }
          .animate-progress-shrink {
            animation: progress-shrink 3s linear forwards;
          }
          @keyframes progress-shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/90 dark:bg-[#121217]/90 backdrop-blur-md z-[90] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
            <div className="h-12 w-12 border-[3.5px] border-[#007AFF] border-t-transparent rounded-full animate-spin mb-5" />
            <h4 className="text-[16px] font-black text-gray-900 dark:text-white mb-1.5">
              Approving Payout
            </h4>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed">
              Validating details and recording transaction in company ledgers...
            </p>
          </div>
        )}

        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="absolute inset-0 bg-white/95 dark:bg-[#121217]/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-6">
              {/* Pulsing Outer Glow */}
              <div className="absolute inset-0 bg-[#34C759]/20 rounded-full blur-xl scale-125 animate-success-pulse" />
              
              {/* Circular Ring Base */}
              <div className="relative h-24 w-24 bg-[#EAFBEF] dark:bg-[#142D1C] border border-[#34C759]/10 rounded-full flex items-center justify-center shadow-lg shadow-[#34C759]/10">
                <svg className="w-12 h-12 text-[#34C759]" viewBox="0 0 52 52">
                  <circle className="animate-draw-circle" cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path className="animate-draw-check" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7.5 7.5 16.5-17" />
                </svg>
              </div>
            </div>

            <h3 className="text-[20px] font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Transaction Approved
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-[280px] mb-8 leading-relaxed">
              Your payment has been successfully recorded in the company bank ledgers.
            </p>

            {/* Payout Details Card */}
            <div className="w-full max-w-[320px] bg-gray-50 dark:bg-[#1C1C1E] border border-gray-150 dark:border-white/5 rounded-2xl p-5 mb-8 text-left space-y-3.5 shadow-sm">
              <div className="flex justify-between items-baseline pb-3 border-b border-gray-200/50 dark:border-white/5">
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Amount Approved</span>
                <span className="text-[18px] font-black text-[#34C759]">
                  S$ {approvedAmount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-400 dark:text-gray-500 font-medium">Source Account</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{approvedBank}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-400 dark:text-gray-500 font-medium">Payment ID</span>
                <span className="font-mono text-[11px] font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                  {generatedTxId}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-400 dark:text-gray-500 font-medium">Status</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#34C759] bg-[#EAFBEF] dark:bg-[#142D1C] px-2 py-0.5 rounded-full border border-[#34C759]/20 uppercase">
                  Success
                </span>
              </div>
            </div>

            {/* Timer countdown progress line */}
            <div className="w-full max-w-[120px] bg-gray-100 dark:bg-[#2C2C35] h-1 rounded-full overflow-hidden">
              <div className="bg-[#34C759] h-full rounded-full animate-progress-shrink" />
            </div>
          </div>
        )}

      </div>

      {/* Security PIN dialog overlay */}
      {isPinPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-150 dark:border-gray-800 shadow-2xl rounded-3xl p-8 max-w-sm w-full mx-4 relative flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mb-4">
              <Lock className="h-5 w-5" strokeWidth={2.5} />
            </div>
            
            <h3 className="text-[17px] font-black text-gray-900 dark:text-white text-center mb-1">Enter Security PIN</h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 text-center leading-normal max-w-[260px] mb-4">
              Enter your 4-digit transaction PIN to approve the payment.
            </p>

            <div className="relative flex flex-col items-center w-full my-2">
              {/* Passcode Visual dots */}
              <div className="flex justify-center gap-4.5 my-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border-[2.5px] transition-all duration-200 ${
                      paymentPin.length > index
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
                value={paymentPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setPaymentPin(val);
                  setPaymentPinError("");
                  if (val.length === 4) {
                    if (val === "1234") {
                      setIsPinPromptOpen(false);
                      setPaymentPin("");
                      setPaymentPinError("");
                      executeApprovedPayment();
                    } else {
                      setPaymentPinError("Invalid Security PIN. Please try again.");
                      setPaymentPin("");
                    }
                  }
                }}
                className="absolute inset-0 w-full h-12 opacity-0 cursor-pointer text-center"
                autoFocus
              />
            </div>

            {paymentPinError && (
              <div className="text-[11px] font-bold text-red-500 mt-2 text-center animate-bounce">
                {paymentPinError}
              </div>
            )}

            <button 
              onClick={() => {
                setIsPinPromptOpen(false);
                setPaymentPin("");
                setPaymentPinError("");
              }}
              className="mt-6 text-[12px] font-bold text-[#8E8E93] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
