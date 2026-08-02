"use client";

import React, { useState, useEffect } from "react";
import { User, PieChart, Clock, FileText, StickyNote, AlertCircle, ArrowLeft, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

interface EquityHolderProfileViewProps {
  holderName?: string;
}

const BANK_OPTIONS = [
  { id: "dbs", name: "DBS Bank", logo: "/Bank logo/DBSlogo.svg" },
  { id: "citi", name: "Citi Bank", logo: "/Bank logo/Citilogo.svg" },
  { id: "ocbc", name: "OCBC Bank", logo: "/Bank logo/Logo-ocbc.svg" },
  { id: "scb", name: "Standard Charted Bank", logo: "/Bank logo/SCBLogo.svg" },
  { id: "uob", name: "UOB Bank", logo: "/Bank logo/UOB_Logo_(2022) (1).svg" },
  { id: "cimb", name: "CIMB Bank", logo: "/Bank logo/CIMBLogo.svg" },
];

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

export default function EquityHolderProfileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("personal");
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stakeholderId, setStakeholderId] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [investment, setInvestment] = useState("");
  const [share, setShare] = useState("");
  const [salary, setSalary] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isYouAlreadyUsed, setIsYouAlreadyUsed] = useState(false);

  // Delete Popup & Processing States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'remove-funds' | 'keep-funds' | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  const [useDbTables, setUseDbTables] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setAvatarError(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if database tables exist
        const { data: dbCheck, error: dbErr } = await supabase
          .from('company_banks')
          .select('id')
          .eq('company_id', user.id)
          .limit(1);
        const hasDbTables = !dbErr;
        setUseDbTables(hasDbTables);

        if (hasDbTables) {
          const [
            { data: dbEquity },
            { data: dbTransactions },
            { data: adminSettings }
          ] = await Promise.all([
            supabase.from('equity_members').select('*').eq('company_id', user.id),
            supabase.from('transactions').select('*').eq('company_id', user.id).order('created_at', { ascending: false }),
            supabase.from("company_settings").select("super_admin_name, company_email, company_phone, super_admin_avatar_url").eq("company_id", user.id).maybeSingle()
          ]);

          const savedEquity = (dbEquity || []).map((m: any) => ({
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

          const found = id ? savedEquity.find((m: any) => m.id === id) : savedEquity[0];
          
          const hasYou = savedEquity.some((m: any) => m.role === "You" && m.id !== (found?.id || id));
          setIsYouAlreadyUsed(hasYou);
          
          const mappedTxs = (dbTransactions || []).map((tx: any) => ({
            id: tx.payment_id,
            dbId: tx.id,
            type: tx.type,
            amount: parseFloat(tx.amount) || 0,
            category: tx.category,
            date: tx.transaction_date,
            time: tx.transaction_time,
            description: tx.description,
            attachmentUrl: tx.attachment_url,
            bankId: tx.bank_id,
            bankName: tx.bank_name,
            details: tx.details || {},
            createdAt: tx.created_at
          }));
          setTransactions(mappedTxs);
          
          if (found) {
            let updatedFound = { ...found };
            
            // Fetch live, real-time up-to-date data for Employee & You categories
            if (found.role === "You") {
              if (adminSettings) {
                updatedFound.avatarUrl = adminSettings.super_admin_avatar_url || updatedFound.avatarUrl;
                updatedFound.email = adminSettings.company_email || updatedFound.email;
                updatedFound.name = adminSettings.super_admin_name || updatedFound.name;
                
                let rawPhone = (adminSettings.company_phone || "").replace(/\D/g, "");
                if (rawPhone.startsWith("65")) rawPhone = rawPhone.substring(2);
                updatedFound.phone = rawPhone ? `+65 ${rawPhone}` : updatedFound.phone;
                updatedFound.dob = updatedFound.dob || "1990-01-01";
              }
            } else if (found.role === "Employee") {
              const { data: empData } = await supabase
                .from("employees")
                .select("avatar_url, date_of_birth, mobile, email, name")
                .eq("email", found.email)
                .maybeSingle();
              if (empData) {
                updatedFound.avatarUrl = empData.avatar_url || updatedFound.avatarUrl;
                updatedFound.email = empData.email || updatedFound.email;
                updatedFound.name = empData.name || updatedFound.name;
                updatedFound.phone = empData.mobile || updatedFound.phone;
                updatedFound.dob = empData.date_of_birth || updatedFound.dob || "1990-01-01";
              }
            }
            
            setMember(updatedFound);
            
            // Populate form states
            const names = (updatedFound.name || "").split(" ");
            setFirstName(names[0] || "");
            setLastName(names.slice(1).join(" ") || "");
            setStakeholderId(updatedFound.stakeholderId || `STK-${savedEquity.indexOf(found) + 1}`);
            setRole(updatedFound.role || "Stake Holder");
            setEmail(updatedFound.email || "");
            
            let cleanPhone = (updatedFound.phone || "").replace(/\D/g, "");
            if (cleanPhone.startsWith("65")) cleanPhone = cleanPhone.substring(2);
            setPhone(cleanPhone.substring(0, 8));
            
            setDob(updatedFound.dob || "");
            setInvestment(String(updatedFound.investment || ""));
            setShare(String(updatedFound.share || ""));
            setSalary(String(updatedFound.salary || ""));
            setAccountHolderName(updatedFound.accountHolderName || "");
            setAccountNumber(updatedFound.accountNumber || "");
            
            const matchedBank = BANK_OPTIONS.find(b => b.id === updatedFound.bankName) || null;
            setSelectedBank(matchedBank);
          } else {
            setMember(null);
          }
        } else {
          const { data } = await supabase.from('company_settings').select('*').eq('company_id', user.id).maybeSingle();
          if (data) {
            const savedEquity = data.attendance_config?.equity_members || [];
            const found = id ? savedEquity.find((m: any) => m.id === id) : savedEquity[0];
            
            const hasYou = savedEquity.some((m: any) => m.role === "You" && m.id !== (found?.id || id));
            setIsYouAlreadyUsed(hasYou);
            
            const allTxs = data.attendance_config?.transactions || [];
            setTransactions(allTxs);
            
            if (found) {
              let updatedFound = { ...found };
              
              // Fetch live, real-time up-to-date data for Employee & You categories
              if (found.role === "You") {
                const { data: adminSettings } = await supabase
                  .from("company_settings")
                  .select("super_admin_name, company_email, company_phone, super_admin_avatar_url, shift_start") // using shift_start as fallback or standard settings
                  .eq("company_id", user.id)
                  .maybeSingle();
                if (adminSettings) {
                  updatedFound.avatarUrl = adminSettings.super_admin_avatar_url || updatedFound.avatarUrl;
                  updatedFound.email = adminSettings.company_email || updatedFound.email;
                  updatedFound.name = adminSettings.super_admin_name || updatedFound.name;
                  
                  let rawPhone = (adminSettings.company_phone || "").replace(/\D/g, "");
                  if (rawPhone.startsWith("65")) rawPhone = rawPhone.substring(2);
                  updatedFound.phone = rawPhone ? `+65 ${rawPhone}` : updatedFound.phone;
                  updatedFound.dob = updatedFound.dob || "1990-01-01";
                }
              } else if (found.role === "Employee") {
                const { data: empData } = await supabase
                  .from("employees")
                  .select("avatar_url, date_of_birth, mobile, email, name")
                  .eq("email", found.email)
                  .maybeSingle();
                if (empData) {
                  updatedFound.avatarUrl = empData.avatar_url || updatedFound.avatarUrl;
                  updatedFound.email = empData.email || updatedFound.email;
                  updatedFound.name = empData.name || updatedFound.name;
                  updatedFound.phone = empData.mobile || updatedFound.phone;
                  updatedFound.dob = empData.date_of_birth || updatedFound.dob || "1990-01-01";
                }
              }
              
              setMember(updatedFound);
              
              // Populate form states
              const names = (updatedFound.name || "").split(" ");
              setFirstName(names[0] || "");
              setLastName(names.slice(1).join(" ") || "");
              setStakeholderId(updatedFound.stakeholderId || `STK-${savedEquity.indexOf(found) + 1}`);
              setRole(updatedFound.role || "Stake Holder");
              setEmail(updatedFound.email || "");
              
              let cleanPhone = (updatedFound.phone || "").replace(/\D/g, "");
              if (cleanPhone.startsWith("65")) cleanPhone = cleanPhone.substring(2);
              setPhone(cleanPhone.substring(0, 8));
              
              setDob(updatedFound.dob || "");
              setInvestment(String(updatedFound.investment || ""));
              setShare(String(updatedFound.share || ""));
              setSalary(updatedFound.salary || "");
              setAccountHolderName(updatedFound.accountHolderName || "");
              setAccountNumber(updatedFound.accountNumber || "");
              
              const matchedBank = BANK_OPTIONS.find(b => b.id === updatedFound.bankName) || null;
              setSelectedBank(matchedBank);
            } else {
              setMember(null);
            }
          }
        }
      } catch (e) {
        console.error("Error loading equity:", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, supabase]);

  // Deletion count down effect
  useEffect(() => {
    if (!isProcessingDelete) return;
    if (deleteCountdown <= 0) {
      executeDeletion();
      return;
    }
    const timer = setTimeout(() => {
      setDeleteCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isProcessingDelete, deleteCountdown]);

  const startDeletionProcess = (option: 'remove-funds' | 'keep-funds') => {
    setDeleteOption(option);
    setShowDeleteModal(false);
    setIsProcessingDelete(true);
    setDeleteCountdown(5);
  };

  const executeDeletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (useDbTables) {
        // 1. Get the current details of the member and their transactions to create backup
        const { data: dbMember } = await supabase.from('equity_members').select('*').eq('id', member.id).maybeSingle();
        const { data: dbTxs } = await supabase.from('transactions').select('*').eq('company_id', user.id);
        const relatedTxs = (dbTxs || []).filter((tx: any) => tx.details?.equityMember?.id === member.id);

        const backupData = {
          config: null,
          useDbTables: true,
          member: dbMember,
          relatedTxs: relatedTxs,
          deletedAt: Date.now(),
          deleteOption
        };
        localStorage.setItem("vertex_undo_equity_member", JSON.stringify(backupData));

        // 2. Delete the equity member
        const { error: delMemErr } = await supabase.from('equity_members').delete().eq('id', member.id);
        if (delMemErr) throw new Error("Failed to delete stakeholder: " + delMemErr.message);

        // 3. Handle fundings reversal if needed
        if (deleteOption === 'remove-funds') {
          // Reverse bank balances
          for (const tx of relatedTxs) {
            const amt = parseFloat(tx.amount) || 0;
            if (tx.bank_id) {
              const { data: bankObj } = await supabase.from('company_banks').select('balance').eq('id', tx.bank_id).maybeSingle();
              if (bankObj) {
                const currentBal = parseFloat(bankObj.balance) || 0;
                await supabase.from('company_banks').update({ balance: Math.max(0, currentBal - amt) }).eq('id', tx.bank_id);
              }
            }
          }

          // Delete transactions
          if (relatedTxs.length > 0) {
            const txIds = relatedTxs.map((tx: any) => tx.id);
            const { error: delTxErr } = await supabase.from('transactions').delete().in('id', txIds);
            if (delTxErr) throw new Error("Failed to delete transactions: " + delTxErr.message);
          }
        }
      } else {
        const { data } = await supabase.from('company_settings').select('attendance_config').eq('company_id', user.id).maybeSingle();
        const currentConfig = data?.attendance_config || {};
        const savedEquity = currentConfig.equity_members || [];
        const savedTransactions = currentConfig.transactions || [];
        const savedBanks = currentConfig.company_banks || [];

        // 1. Create a backup of the current config for Undo
        const backupData = {
          config: currentConfig,
          member: member,
          deletedAt: Date.now(),
          deleteOption
        };
        localStorage.setItem("vertex_undo_equity_member", JSON.stringify(backupData));

        // 2. Remove the equity member
        const updatedEquity = savedEquity.filter((m: any) => m.id !== member.id);

        let updatedTransactions = [...savedTransactions];
        let updatedBanks = [...savedBanks];

        if (deleteOption === 'remove-funds') {
          // Find transactions related to this member's funding
          const relatedTxs = savedTransactions.filter((tx: any) => 
            tx.details?.equityMember?.id === member.id
          );

          // Reverse bank balances for these transactions
          relatedTxs.forEach((tx: any) => {
            const amt = parseFloat(tx.amount) || 0;
            updatedBanks = updatedBanks.map((b: any) => {
              if (b.id === tx.bankId) {
                const currentBal = parseFloat(b.balance) || 0;
                // Reversing: it was received (credited), so we subtract it
                return { ...b, balance: Math.max(0, currentBal - amt) };
              }
              return b;
            });
          });

          // Filter out these transactions from transactions list
          updatedTransactions = savedTransactions.filter((tx: any) => 
            tx.details?.equityMember?.id !== member.id
          );
        }

        const updatedConfig = {
          ...currentConfig,
          equity_members: updatedEquity,
          transactions: updatedTransactions,
          company_banks: updatedBanks
        };

        const { error } = await supabase
          .from('company_settings')
          .update({ attendance_config: updatedConfig })
          .eq('company_id', user.id);

        if (error) {
          throw new Error(error.message);
        }
      }

      // Redirect to /finance with trigger for undo toast
      router.push(`/finance?undoDelete=true&memberName=${encodeURIComponent(member.name)}`);
    } catch (e: any) {
      console.error("Error executing deletion:", e);
      alert("Failed to delete member: " + e.message);
      setIsProcessingDelete(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Not authenticated");
        return;
      }

      const targetId = member?.id || id;

      const dbMember = {
        name: `${firstName} ${lastName}`.trim(),
        role,
        share: parseFloat(share) || 0,
        investment: parseFloat(investment) || 0,
        stakeholder_id: stakeholderId,
        email,
        phone: phone.trim() ? `+65 ${phone.trim()}` : "",
        dob: dob || null,
        salary: parseFloat(salary) || 0,
        bank_name: selectedBank?.id || null,
        account_holder_name: accountHolderName,
        account_number: accountNumber,
        avatar_url: member.avatarUrl || null
      };

      if (useDbTables) {
        const { error } = await supabase
          .from('equity_members')
          .update(dbMember)
          .eq('id', targetId);

        if (error) {
          alert("Failed to save changes: " + error.message);
          return;
        }
      } else {
        const { data } = await supabase.from('company_settings').select('attendance_config').eq('company_id', user.id).maybeSingle();
        const currentConfig = data?.attendance_config || {};
        const savedEquity = currentConfig.equity_members || [];

        // Find member index
        const index = savedEquity.findIndex((m: any) => m.id === targetId);
        
        const legacyMember = {
          ...(savedEquity[index] || {}),
          id: targetId,
          name: `${firstName} ${lastName}`.trim(),
          role,
          share: parseFloat(share) || 0,
          investment: parseFloat(investment) || 0,
          stakeholderId,
          email,
          phone: phone.trim() ? `+65 ${phone.trim()}` : "",
          dob,
          salary,
          bankName: selectedBank?.id || null,
          accountHolderName,
          accountNumber,
          avatarUrl: member.avatarUrl // retain loaded avatar url
        };

        let updatedEquity = [...savedEquity];
        if (index > -1) {
          updatedEquity[index] = legacyMember;
        } else {
          updatedEquity.push(legacyMember);
        }

        const updatedConfig = {
          ...currentConfig,
          equity_members: updatedEquity
        };

        const { error } = await supabase
          .from('company_settings')
          .update({ attendance_config: updatedConfig })
          .eq('company_id', user.id);

        if (error) {
          alert("Failed to save changes: " + error.message);
          return;
        }
      }

      const localMemberState = {
        id: targetId,
        name: `${firstName} ${lastName}`.trim(),
        role,
        share: parseFloat(share) || 0,
        investment: parseFloat(investment) || 0,
        stakeholderId,
        email,
        phone: phone.trim() ? `+65 ${phone.trim()}` : "",
        dob,
        salary,
        bankName: selectedBank?.id || null,
        accountHolderName,
        accountNumber,
        avatarUrl: member.avatarUrl
      };

      alert("Changes saved successfully!");
      setMember(localMemberState);
      
      // ─── If salary is applicable, sync/upsert in employees table ───
      const salaryNum = parseFloat(salary) || 0;
      if (salaryNum > 0 && email.trim()) {
        const empEmail = email.trim().toLowerCase();
        // Check if employee already exists by email
        const { data: existingEmp } = await supabase
          .from('employees')
          .select('id, emp_id')
          .eq('email', empEmail)
          .maybeSingle();

        if (existingEmp) {
          // Update existing employee's details
          await supabase
            .from('employees')
            .update({
              name: `${firstName} ${lastName}`.trim(),
              mobile: phone.trim() ? `+65 ${phone.trim()}` : "",
              salary: salaryNum,
              bank_name: selectedBank?.name || selectedBank?.id || "",
              account_holder_name: accountHolderName,
              account_number: accountNumber,
              date_of_birth: dob || null,
              employment_status: "Active",
              job_role: role
            })
            .eq('id', existingEmp.id);
        } else {
          // Generate custom unique employee ID
          const empSuffix = Math.floor(1000 + Math.random() * 9000);
          const generatedEmpId = `EMP-${empSuffix}`;

          // Insert new employee
          await supabase
            .from('employees')
            .insert({
              company_id: user.id,
              name: `${firstName} ${lastName}`.trim(),
              email: empEmail,
              role: "Employee",
              mobile: phone.trim() ? `+65 ${phone.trim()}` : "",
              salary: salaryNum,
              bank_name: selectedBank?.name || selectedBank?.id || "",
              account_holder_name: accountHolderName,
              account_number: accountNumber,
              date_of_birth: dob || null,
              emp_id: generatedEmpId,
              date_of_joining: new Date().toISOString().split('T')[0],
              employment_status: "Active",
              job_role: role
            });
        }
      }

    } catch (e: any) {
      console.error("Error saving profile:", e);
      alert("Error saving profile: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fullName = member ? `${firstName} ${lastName}`.trim() || member.name : "";
  const isBlocked = role === "You" || role === "Employee";

  // Compute equity holder transactions including Initial Capital
  const equityTransactions = React.useMemo(() => {
    if (!member) return [];

    // Filter normal transactions
    const filtered = transactions.filter(
      (tx: any) => tx.details?.equityMember?.id === member.id
    );

    // Sum of all subsequent incoming fundings that accumulate on m.investment
    const subsequentFundingsSum = filtered.reduce((sum: number, tx: any) => {
      const isCredit = tx.type === 'received' || tx.type === 'Credit';
      const isIncomingInvestment = isCredit && (
        tx.category === 'investment' ||
        tx.details?.purpose === 'Investor Funding' ||
        tx.details?.purpose === 'Capital Injection' ||
        tx.details?.purpose === 'Equity Funding'
      );
      return isIncomingInvestment ? sum + (parseFloat(tx.amount) || 0) : sum;
    }, 0);

    // Initial Capital is the registered capital amount (member.investment minus subsequent fundings)
    // Avoid going negative
    const initialCapitalAmount = Math.max(0, (parseFloat(member.investment) || 0) - subsequentFundingsSum);

    // Generate deterministic Payment ID for initial capital
    const timestampStr = member.createdAt 
      ? new Date(member.createdAt).toISOString().replace(/[-T:.Z]/g, "").slice(0, 14) 
      : "20260531120000";
    const shortId = member.id ? member.id.split("-").pop()?.toUpperCase().slice(0, 6) : "INITCAP";
    const initCapId = `RCV-${timestampStr}-${shortId}-DA`;

    const joiningDate = member.joiningDate || (member.createdAt ? new Date(member.createdAt).toLocaleDateString("en-SG", { day: '2-digit', month: 'short', year: 'numeric' }) : "31 May 2026");

    const initialCapitalTx = {
      id: initCapId,
      date: joiningDate,
      time: "12:00:00",
      type: "received", // credit
      amount: initialCapitalAmount,
      bankName: member.bankName ? BANK_OPTIONS.find(b => b.id === member.bankName)?.name || "Corporate Bank" : "Corporate Capital",
      category: "investment",
      description: `Initial Share Capital Contribution on company registration`,
      isInitialCapital: true,
      attachmentUrl: null,
      details: {
        purpose: "Initial Capital Contribution",
        equityMember: {
          id: member.id,
          name: fullName,
          role: role,
          share: parseFloat(member.share) || 0
        }
      }
    };

    // Return the initial capital prepended to any subsequent transactions
    return [initialCapitalTx, ...filtered];
  }, [transactions, member, fullName, role]);
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1C1C1E] text-gray-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px] font-semibold text-gray-400">Loading profile details...</span>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#1C1C1E] p-8 text-center text-[#8E8E93]">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-2">No Stakeholder Selected</h3>
        <p className="text-[13px] max-w-sm mb-6">
          Please add a new equity member or select one from the Financial dashboard to view their profile.
        </p>
        <button 
          onClick={() => router.push("/finance")}
          className="px-5 py-3 bg-[#007AFF] text-white text-[13px] font-bold rounded-xl shadow-sm hover:bg-[#0062CC] transition-colors"
        >
          Go to Financial Dashboard
        </button>
      </div>
    );
  }



  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Equity Holder Profile</h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">View and manage equity information and settings</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[260px] bg-[#F8F9FA] dark:bg-[#121217] border-r border-[#F2F2F7] dark:border-[#2C2C35] flex flex-col">
          {/* Profile Info */}
          <div className="flex flex-col items-center py-8 px-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
            <div className="w-20 h-20 rounded-full bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center text-[24px] font-bold mb-3 shadow-sm overflow-hidden shrink-0">
              {member.avatarUrl && !avatarError ? (
                <img src={member.avatarUrl} alt={fullName} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
              ) : (
                getInitials(fullName)
              )}
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white text-center leading-tight">{fullName}</h3>
            <p className="text-[12px] text-[#8E8E93] mt-1.5 font-semibold uppercase tracking-wider">{role}</p>
            <div className="mt-3 bg-[#E5F9E5] text-[#34C759] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Active
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
            {[
              { id: 'personal', label: 'Personal Information', icon: User },
              { id: 'equity', label: 'Equity Details', icon: PieChart },
              { id: 'vesting', label: 'Vesting Schedule', icon: Clock },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'notes', label: 'Notes', icon: StickyNote },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors ${
                  activeTab === item.id 
                    ? 'bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF]' 
                    : 'text-[#8E8E93] hover:bg-gray-100 dark:hover:bg-[#2C2C35] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1C1C1E] p-8">
          <div className={activeTab === 'personal' ? "max-w-[1000px] w-full" : "w-full"}>
            {activeTab === 'personal' && (
              <div className="flex flex-col gap-8">
                {/* Content Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Personal Information</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-[#8E8E93] font-medium">Last updated: {member.createdAt ? new Date(member.createdAt).toLocaleDateString("en-SG", { day: '2-digit', month: 'short', year: 'numeric' }) : "Just now"}</span>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-[#007AFF] hover:bg-[#0062CC] text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      Delete Stakeholder
                    </button>
                  </div>
                </div>

                {/* Form Sections */}
                <div className="flex flex-col gap-8">
                  {/* Personal Information Grid (3 Columns) */}
                  <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">First Name</label>
                      <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isBlocked}
                        className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors disabled:opacity-75 disabled:cursor-not-allowed" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isBlocked}
                        className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors disabled:opacity-75 disabled:cursor-not-allowed" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Stakeholder ID</label>
                      <input 
                        type="text" 
                        value={stakeholderId} 
                        onChange={(e) => setStakeholderId(e.target.value)}
                        className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Equity Category</label>
                      <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isBlocked}
                        className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {!isYouAlreadyUsed && <option value="You">You</option>}
                        <option value="Founder">Founder</option>
                        <option value="Stake Holder">Stake Holder</option>
                        <option value="Investor">Investor</option>
                        <option value="Partner">Partner</option>
                        <option value="Advisory">Advisory</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Email Address</label>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isBlocked}
                        className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors disabled:opacity-75 disabled:cursor-not-allowed" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Phone Number</label>
                      <div className="flex">
                        <div className="bg-[#E5E5EA] dark:bg-[#2C2C35] border border-r-0 border-[#E5E7EB] dark:border-[#2C2C35] rounded-l-lg px-3 py-2.5 text-[13px] font-bold text-gray-700 dark:text-gray-300 flex items-center pointer-events-none">
                          +65
                        </div>
                        <input 
                          type="text" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          disabled={isBlocked}
                          maxLength={8}
                          className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-r-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors disabled:opacity-75 disabled:cursor-not-allowed" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Date of Birth</label>
                      <input 
                        type="date" 
                        value={dob} 
                        onChange={(e) => setDob(e.target.value)}
                        disabled={isBlocked}
                        className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors disabled:opacity-75 disabled:cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="h-px w-full bg-[#F2F2F7] dark:bg-[#2C2C35]" />

                  {/* Investment Section */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Investment Details</h3>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Initial Capital</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">S$</span>
                          <input 
                            type="text" 
                            value={investment} 
                            onChange={(e) => setInvestment(e.target.value.replace(/[^0-9.]/g, ""))}
                            className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg pl-9 pr-3 py-2.5 text-[13px] font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF]" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Equity Percentage</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={share} 
                            onChange={(e) => setShare(e.target.value.replace(/[^0-9.]/g, ""))}
                            className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF]" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Monthly Salary (if applicable)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">S$</span>
                          <input 
                            type="text" 
                            value={salary} 
                            onChange={(e) => setSalary(e.target.value.replace(/[^0-9.]/g, ""))}
                            className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg pl-9 pr-3 py-2.5 text-[13px] font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF]" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-[#F2F2F7] dark:bg-[#2C2C35]" />

                  {/* Bank Details */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Bank Details</h3>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                      <div className="flex flex-col gap-1.5 relative">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Bank Name</label>
                        <button 
                          onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                          className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] flex items-center justify-between transition-all hover:bg-gray-50 dark:hover:bg-[#1C1C1E]"
                        >
                          <div className="flex items-center gap-3">
                            {selectedBank ? (
                              <>
                                <div className="w-8 flex justify-center items-center">
                                  <Image src={selectedBank.logo} alt={selectedBank.name} width={24} height={24} className="object-contain max-h-5 w-auto" />
                                </div>
                                <span className="font-bold">{selectedBank.name}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 font-semibold text-[13px]">Select Bank</span>
                            )}
                          </div>
                          <ChevronDown size={16} className={`text-[#8E8E93] transition-transform duration-200 ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isBankDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsBankDropdownOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                              {BANK_OPTIONS.map((bank) => (
                                <button
                                  key={bank.id}
                                  onClick={() => {
                                    setSelectedBank(bank);
                                    setIsBankDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-3 text-[13px] flex items-center gap-4 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] text-gray-900 dark:text-white transition-colors group"
                                >
                                  <div className="w-8 flex justify-center items-center flex-shrink-0">
                                    <Image src={bank.logo} alt={bank.name} width={24} height={24} className="object-contain max-h-5 w-auto transition-transform group-hover:scale-110" />
                                  </div>
                                  <span className={`font-semibold ${selectedBank && selectedBank.id === bank.id ? 'text-[#007AFF]' : ''}`}>{bank.name}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Account Holder Name</label>
                        <input 
                          type="text" 
                          value={accountHolderName} 
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF]" 
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Account Number</label>
                        <input 
                          type="text" 
                          value={accountNumber} 
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF]" 
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
            
            {activeTab === 'equity' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Transaction History</h3>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">Overview of investments and fundings associated with {fullName}</p>
                  </div>
                  <span className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF]">
                    Total Transactions: {equityTransactions.length}
                  </span>
                </div>

                {equityTransactions.length === 0 ? (
                  <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-[20px] p-12 text-center text-[#8E8E93]">
                    <PieChart size={40} className="mx-auto mb-3 opacity-25" />
                    <h4 className="text-[14px] font-bold text-gray-800 dark:text-gray-200 mb-1">No Transactions Found</h4>
                    <p className="text-[12px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                      There are no investment fundings or equity payouts logged for this stakeholder yet.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-850 rounded-[20px] overflow-hidden bg-white dark:bg-[#1C1C1E] shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#F8F9FA] dark:bg-[#252529] border-b border-gray-200 dark:border-gray-800">
                            <th className="w-10 px-4 py-4"></th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment ID</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bank Name</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Attachments</th>
                            <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150/60 dark:divide-gray-800">
                          {equityTransactions.map(tx => {
                              const isExpanded = expandedRowId === tx.id;
                              const isCredit = tx.type === 'received' || tx.type === 'Credit';
                              
                              return (
                                <React.Fragment key={tx.id}>
                                  <tr 
                                    onClick={() => setExpandedRowId(isExpanded ? null : tx.id)}
                                    className={`hover:bg-gray-50/30 dark:hover:bg-[#2C2C2E]/20 transition-all duration-150 cursor-pointer ${isExpanded ? 'bg-gray-50/20 dark:bg-[#2C2C2E]/10' : ''}`}
                                  >
                                    <td className="px-4 py-4.5 text-center">
                                      <ChevronDown 
                                        size={14} 
                                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#007AFF]' : ''}`} 
                                      />
                                    </td>
                                    <td className="px-6 py-4.5 text-[13px] font-bold text-gray-900 dark:text-white">{tx.id}</td>
                                    <td className="px-6 py-4.5 whitespace-nowrap text-[13px] font-semibold text-gray-850 dark:text-gray-200">
                                      {tx.date ? tx.date.split(',')[0] : "Just now"}
                                    </td>
                                    <td className="px-6 py-4.5">
                                      <span className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold ${!isCredit ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-[#34C759]'}`}>
                                        {isCredit ? 'Credited' : 'Debited'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4.5 text-[13px] font-medium text-gray-700 dark:text-gray-350">{tx.bankName || "Corporate Bank"}</td>
                                    <td className="px-6 py-4.5 text-[13px] font-semibold text-gray-900 dark:text-white max-w-[450px] truncate">
                                      {tx.description}
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
                                    <td className={`px-6 py-4.5 text-right text-[13px] font-black whitespace-nowrap ${!isCredit ? 'text-red-500' : 'text-[#34C759]'}`}>
                                      {isCredit ? '+' : '-'}S$ {tx.amount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                  
                                  {isExpanded && (
                                    <tr className="bg-gray-50/10 dark:bg-[#1C1C1E]/5">
                                      <td colSpan={8} className="px-6 py-4">
                                        <div className="flex flex-col gap-2.5 text-[12px] text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-[#252529]/40 p-4 rounded-[14px] border border-gray-150 dark:border-gray-800 animate-in fade-in duration-200">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <span className="font-semibold text-gray-400">Transaction ID:</span>
                                              <span className="ml-1.5 font-bold text-gray-850 dark:text-gray-100">{tx.id}</span>
                                            </div>
                                            <div>
                                              <span className="font-semibold text-gray-400">Status:</span>
                                              <span className="ml-1.5 font-bold text-emerald-500">Completed & Reconciled</span>
                                            </div>
                                            <div>
                                              <span className="font-semibold text-gray-400">Bank Destination:</span>
                                              <span className="ml-1.5 font-bold text-gray-850 dark:text-gray-100">{tx.bankName}</span>
                                            </div>
                                            <div>
                                              <span className="font-semibold text-gray-400">Purpose Category:</span>
                                              <span className="ml-1.5 font-bold text-gray-850 dark:text-gray-100 capitalize">{tx.category || "Investment"}</span>
                                            </div>
                                          </div>
                                          <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                                          <div>
                                            <span className="font-semibold text-gray-400">Full Description:</span>
                                            <p className="mt-1 font-semibold text-gray-850 dark:text-gray-200 text-[12.5px] leading-relaxed">{tx.description}</p>
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
                  </div>
                )}
              </div>
            )}
            
            {activeTab !== 'personal' && activeTab !== 'equity' && (
              <div className="flex flex-col items-center justify-center h-[400px] text-[#8E8E93]">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-[14px] font-semibold">This section is currently under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-gray-150 dark:border-[#2C2C35] rounded-[24px] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-5">
              <Trash2 size={22} className="text-red-500" />
            </div>
            
            <h3 className="text-[18px] font-black text-gray-900 dark:text-white mb-2">Delete Equity Member?</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              You are about to remove <strong>{fullName}</strong> ({role}) from the Equity Management list. Please select how you wish to handle their investment fundings:
            </p>

            <div className="flex flex-col gap-3.5 mb-6">
              {/* Option 1: Remove funding */}
              <button
                onClick={() => startDeletionProcess('remove-funds')}
                className="flex flex-col text-left p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all group"
              >
                <span className="text-[13.5px] font-black text-red-500 dark:text-red-400">Remove Fundings of the Investor</span>
                <span className="text-[11.5px] font-semibold text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  Delete the stakeholder and reverse all bank balances and transactions associated with their investor funding.
                </span>
              </button>

              {/* Option 2: Keep funding */}
              <button
                onClick={() => startDeletionProcess('keep-funds')}
                className="flex flex-col text-left p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 hover:bg-gray-50/60 dark:hover:bg-gray-900/20 transition-all"
              >
                <span className="text-[13.5px] font-black text-gray-900 dark:text-white">Keep the Investor Funding</span>
                <span className="text-[11.5px] font-semibold text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  Delete the stakeholder but keep their transactions history and preserve the current bank balances.
                </span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-[13px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing countdown screen overlay ── */}
      {isProcessingDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-150 dark:border-[#2C2C35] rounded-[32px] p-10 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="relative w-20 h-20 flex items-center justify-center mb-6">
              {/* Outer circular track */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800" />
              {/* Spinning progress */}
              <div className="absolute inset-0 rounded-full border-4 border-[#007AFF] border-t-transparent animate-spin" />
              {/* Countdown text */}
              <span className="text-[22px] font-black text-[#007AFF]">{deleteCountdown}s</span>
            </div>
            
            <h3 className="text-[18px] font-black text-gray-900 dark:text-white mb-2">Processing Deletion...</h3>
            <p className="text-[12px] text-gray-550 dark:text-gray-400 max-w-[240px] leading-relaxed">
              {deleteOption === 'remove-funds' 
                ? "Removing stakeholder and reversing associated investor funding from company ledgers."
                : "Removing stakeholder from list while preserving all transactions and balances."
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
