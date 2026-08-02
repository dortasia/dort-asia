"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import FinanceRow1 from "@/components/finance/FinanceRow1";
import FinanceRow2 from "@/components/finance/FinanceRow2";
import FinanceRow3 from "@/components/finance/FinanceRow3";
import FinanceRow4 from "@/components/finance/FinanceRow4";
import PaymentSidebar from "@/components/finance/PaymentSidebar";
import AddBankSidebar from "@/components/finance/AddBankSidebar";
import AddEquitySidebar from "@/components/finance/AddEquitySidebar";
import EquityHolderProfileModal from "@/components/finance/EquityHolderProfileModal";
import { AVAILABLE_BANKS } from "@/components/finance/BankDropdown";
import { createClient } from "@/utils/supabase/client";
import { useAppStore } from "@/store";
import { generatePaymentId } from "@/utils/paymentIdHelper";


const BANK_DESIGNS: Record<string, { logo: string, bg: string, textColor: string, linkColor: string, name: string }> = {
  dbs: { logo: '/Bank logo/DBSlogo.svg', bg: '/DBS.svg', textColor: 'text-white', linkColor: 'text-gray-300', name: 'DBS' },
  ocbc: { logo: '/Bank logo/Logo-ocbc.svg', bg: '/OCBC.svg', textColor: 'text-black', linkColor: 'text-[#007AFF]', name: 'OCBC' },
  uob: { logo: '/Bank logo/UOB_Logo_(2022) (1).svg', bg: '/UOB.svg', textColor: 'text-white', linkColor: 'text-white', name: 'UOB' },
  citi: { logo: '/Bank logo/Citilogo.svg', bg: '/citi.svg', textColor: 'text-white', linkColor: 'text-white', name: 'Citi' },
  scb: { logo: '/Bank logo/SCBLogo.svg', bg: '/SCB.svg', textColor: 'text-black', linkColor: 'text-[#007AFF]', name: 'SCB' },
  cimb: { logo: '/Bank logo/CIMBLogo.svg', bg: '/CIMB.svg', textColor: 'text-white', linkColor: 'text-white', name: 'CIMB' },
};

export default function FinancePage() {
  const supabase = createClient();
  const router = useRouter();

  // Cache and state hydration
  const { cachedFinance, setCachedFinance } = useAppStore();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'send' | 'received' | 'cycle' | 'self' | 'withdraw'>('send');
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [isAddEquityOpen, setIsAddEquityOpen] = useState(false);
  
  const [banksList, setBanksList] = useState<any[]>(() => cachedFinance?.banksList || []);
  const [selectedBank, setSelectedBank] = useState<any>(() => cachedFinance?.banksList?.[0] || null); 
  const [equityList, setEquityList] = useState<any[]>(() => cachedFinance?.equityList || []);
  const [companySettings, setCompanySettings] = useState<any>(() => cachedFinance?.companySettings || null);
  const [transactionsList, setTransactionsList] = useState<any[]>(() => cachedFinance?.transactionsList || []);

  // Auto-sync finance state to Zustand cache whenever it changes (after initial load).
  // This ensures bank balance changes, new equity, and new transactions survive navigation.
  const financeLoadedRef = React.useRef(!!cachedFinance);
  useEffect(() => {
    if (!financeLoadedRef.current) {
      // Still on initial load (no cache existed), skip until loadFinanceData() populates
      return;
    }
    setCachedFinance({
      banksList,
      equityList,
      transactionsList,
      companySettings,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banksList, equityList, transactionsList, companySettings]);

  // Undo Notification States
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const [undoMemberName, setUndoMemberName] = useState("");
  const [undoCountdown, setUndoCountdown] = useState(10);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isUndoTriggered = params.get("undoDelete") === "true";
    const name = params.get("memberName") || "Stakeholder";
    if (isUndoTriggered) {
      setUndoMemberName(name);
      setShowUndoNotification(true);
      setUndoCountdown(10);
      
      // Clean query params so it doesn't trigger again on page refresh
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  useEffect(() => {
    if (!showUndoNotification) return;
    if (undoCountdown <= 0) {
      setShowUndoNotification(false);
      localStorage.removeItem("vertex_undo_equity_member");
      return;
    }
    const timer = setTimeout(() => {
      setUndoCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [showUndoNotification, undoCountdown]);

  const handleUndoDelete = async () => {
    try {
      const backupStr = localStorage.getItem("vertex_undo_equity_member");
      if (!backupStr) return;
      const backup = JSON.parse(backupStr);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('company_settings')
        .update({ attendance_config: backup.config })
        .eq('company_id', user.id);

      if (error) {
        alert("Failed to undo deletion: " + error.message);
        return;
      }

      localStorage.removeItem("vertex_undo_equity_member");
      setShowUndoNotification(false);
      
      // Reload finance data
      await loadFinanceData();
      alert("Stakeholder restored successfully!");
    } catch (e: any) {
      console.error("Error undoing deletion:", e);
    }
  };

  // Load finance data
  const [useDbTables, setUseDbTables] = useState(false);

  const runRuntimeMigration = async (
    companyId: string, 
    companyName: string, 
    legacyBanks: any[], 
    legacyEquity: any[], 
    legacyTransactions: any[]
  ) => {
    try {
      const bankUuidMap: Record<string, string> = {};
      
      // ─── A. Migrate Company Banks ───
      for (const bank of legacyBanks) {
        const bankPrefix = bank.id.split('-')[0].toLowerCase();
        
        // Compute initial capital contribution sum for this bank to ensure accurate balance
        const initialFundingSum = legacyEquity.reduce((sum, member) => {
          if (!member.bankName) return sum;
          const mBankPrefix = member.bankName.toLowerCase();
          if (mBankPrefix === bankPrefix) {
            const memberTxs = legacyTransactions.filter(tx => tx.details?.equityMember?.id === member.id);
            const subsequentSum = memberTxs.reduce((s, tx) => {
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

        const finalBalance = (parseFloat(bank.balance) || 0) + initialFundingSum;
        const matchedDesignId = bankPrefix === 'cash' ? 'cash-drawer' : bankPrefix;

        const row = {
          company_id: companyId,
          bank_design_id: matchedDesignId,
          bank_name: bank.name || 'Bank',
          account_holder_name: bank.holderName || companyName || 'Corporate',
          account_number: bank.accountNumber || '',
          balance: finalBalance,
          is_active: true
        };

        const { data: dbBank, error: bankErr } = await supabase.from('company_banks')
          .insert(row)
          .select('id')
          .maybeSingle();

        if (bankErr) {
          console.error(`Error inserting bank ${bank.name}:`, bankErr.message);
        } else if (dbBank) {
          bankUuidMap[bank.id] = dbBank.id;
        }
      }

      // ─── B. Migrate Equity Members ───
      const memberUuidMap: Record<string, string> = {};
      for (const member of legacyEquity) {
        const salaryVal = member.salary ? parseFloat(String(member.salary).replace(/[^0-9.]/g, '')) : 0;
        const row = {
          company_id: companyId,
          name: member.name || 'Stakeholder',
          role: member.role || 'Stake Holder',
          share: parseFloat(member.share) || 0,
          investment: parseFloat(member.investment) || 0,
          email: member.email || null,
          phone: member.phone || null,
          dob: member.dob || null,
          salary: salaryVal,
          bank_name: member.bankName || null,
          account_number: member.accountNumber || null,
          account_holder_name: member.accountHolderName || null,
          stakeholder_id: member.stakeholderId || 'STK-000',
          avatar_url: member.avatarUrl || null
        };

        const { data: dbMem, error: memErr } = await supabase.from('equity_members')
          .insert(row)
          .select('id')
          .maybeSingle();

        if (memErr) {
          console.error(`Error inserting member ${member.name}:`, memErr.message);
        } else if (dbMem) {
          memberUuidMap[member.id] = dbMem.id;
        }
      }

      // ─── C. Migrate Transactions ───
      for (const tx of legacyTransactions) {
        let resolvedBankId = tx.bankId || null;
        if (tx.bankId && tx.bankId !== 'cash-drawer' && bankUuidMap[tx.bankId]) {
          resolvedBankId = bankUuidMap[tx.bankId];
        }

        const detailsObj = { ...(tx.details || {}) };
        if (detailsObj.equityMember && detailsObj.equityMember.id && memberUuidMap[detailsObj.equityMember.id]) {
          detailsObj.equityMember.id = memberUuidMap[detailsObj.equityMember.id];
        }

        const row = {
          company_id: companyId,
          payment_id: tx.id || 'TXN-000',
          type: tx.type || 'send',
          amount: parseFloat(tx.amount) || 0,
          category: tx.category || 'expense',
          transaction_date: tx.date || new Date().toISOString().split('T')[0],
          transaction_time: tx.time || '12:00:00',
          description: tx.description || null,
          attachment_url: tx.attachmentUrl || null,
          bank_id: resolvedBankId,
          bank_name: tx.bankName || null,
          details: detailsObj
        };

        const { error: txErr } = await supabase.from('transactions').insert(row);
        if (txErr) {
          console.error(`Error inserting transaction ${tx.id}:`, txErr.message);
        }
      }
      console.log("Runtime migration completed successfully!");
    } catch (e) {
      console.error("Runtime migration failed:", e);
    }
  };

  // Load finance data
  const loadFinanceData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: compSettings } = await supabase.from('company_settings').select('*').eq('company_id', user.id).maybeSingle();
    if (!compSettings) return;
    setCompanySettings(compSettings);

    // Check if new database tables exist
    const { data: dbBanksCheck, error: dbBanksError } = await supabase
      .from('company_banks')
      .select('id')
      .eq('company_id', user.id)
      .limit(1);
    
    const hasDbTables = !dbBanksError;
    setUseDbTables(hasDbTables);

    if (hasDbTables) {
      // 1. Load from DB tables
      const [
        { data: dbBanks },
        { data: dbEquity },
        { data: dbTransactions }
      ] = await Promise.all([
        supabase.from('company_banks').select('*').eq('company_id', user.id),
        supabase.from('equity_members').select('*').eq('company_id', user.id),
        supabase.from('transactions').select('*').eq('company_id', user.id).order('created_at', { ascending: false })
      ]);

      // Auto-migrate legacy JSON data to the new DB tables if they are empty
      const legacyBanks = compSettings.attendance_config?.company_banks || [];
      const legacyEquity = compSettings.attendance_config?.equity_members || [];
      const legacyTransactions = compSettings.attendance_config?.transactions || [];

      const needsMigration = (dbBanks || []).length === 0 && 
                             (dbEquity || []).length === 0 && 
                             (dbTransactions || []).length === 0 && 
                             (legacyBanks.length > 0 || legacyEquity.length > 0 || legacyTransactions.length > 0);

      if (needsMigration) {
        console.log("Runtime migration required. Commencing sync...");
        await runRuntimeMigration(user.id, compSettings.company_name || "Company", legacyBanks, legacyEquity, legacyTransactions);
        // Reload all data from newly populated SQL tables
        setTimeout(() => {
          loadFinanceData();
        }, 100);
        return;
      }

      const banks = (dbBanks || []).map((b: any) => {
        const design = BANK_DESIGNS[b.bank_design_id] || { logo: `/Bank logo/DBSlogo.svg`, bg: '/DBS.svg', textColor: 'text-white', linkColor: 'text-gray-300', name: b.bank_design_id.toUpperCase() };
        const suffix = b.account_number.slice(-4) || '7171';
        return {
          id: b.id,
          name: `${design.name} - ${suffix}`,
          bg: design.bg,
          textColor: design.textColor,
          linkColor: design.linkColor,
          logo: design.logo,
          account: `${design.name}-${b.account_number}`,
          holderName: b.account_holder_name,
          accountNumber: b.account_number,
          balance: parseFloat(b.balance) || 0,
          bankDesignId: b.bank_design_id
        };
      });

      setBanksList(banks);
      setSelectedBank((prev: any) => {
        if (prev && banks.some((b: any) => b.id === prev.id)) {
          return banks.find((b: any) => b.id === prev.id);
        }
        return banks.length > 0 ? banks[0] : null;
      });

      // Load avatars for equity members
      const emails = (dbEquity || []).map((m: any) => m.email).filter(Boolean);
      let employeeMap: Record<string, string> = {};
      if (emails.length > 0) {
        const { data: emps } = await supabase
          .from('employees')
          .select('email, avatar_url')
          .in('email', emails);
        if (emps) {
          emps.forEach((e: any) => {
            if (e.email && e.avatar_url) {
              employeeMap[e.email.toLowerCase()] = e.avatar_url;
            }
          });
        }
      }

      const superAdminEmail = (compSettings.company_email || user?.email || "").toLowerCase();
      const superAdminAvatar = compSettings.super_admin_avatar_url || "";

      const enrichedEquity = (dbEquity || []).map((m: any) => {
        const emailLower = (m.email || "").toLowerCase();
        let actualAvatar = m.avatar_url;
        if (emailLower && employeeMap[emailLower]) {
          actualAvatar = employeeMap[emailLower];
        }
        if (emailLower && emailLower === superAdminEmail && superAdminAvatar) {
          actualAvatar = superAdminAvatar;
        }
        return {
          id: m.id,
          name: m.name,
          role: m.role,
          share: parseFloat(m.share) || 0,
          investment: parseFloat(m.investment) || 0,
          email: m.email || "",
          phone: m.phone || "",
          dob: m.dob || "",
          salary: m.salary || "",
          bankName: m.bank_name || "",
          accountNumber: m.account_number || "",
          accountHolderName: m.account_holder_name || "",
          stakeholderId: m.stakeholder_id || "",
          avatarUrl: actualAvatar || ""
        };
      });

      setEquityList(enrichedEquity);

      const txs = (dbTransactions || []).map((tx: any) => ({
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

      setTransactionsList(txs);

      setCachedFinance({
        banksList: banks,
        equityList: enrichedEquity,
        transactionsList: txs,
        companySettings: compSettings
      });
      financeLoadedRef.current = true;
    } else {
      // 2. Fallback to legacy JSON format
      const savedBanks = compSettings.attendance_config?.company_banks;
      const allSavedEquity = compSettings.attendance_config?.equity_members || [];
      const allSavedTransactions = compSettings.attendance_config?.transactions || [];
      let adjustedBanks: any[] = [];

      if (savedBanks && savedBanks.length > 0) {
        const userOnlyBanks = savedBanks.filter((b: any) => b.id !== 'dbs' && b.id !== 'ocbc' && b.id !== 'uob');
        adjustedBanks = userOnlyBanks.map((bank: any) => {
          const bankPrefix = bank.id.split('-')[0].toLowerCase();
          const initialFundingSum = allSavedEquity.reduce((sum: number, member: any) => {
            if (!member.bankName) return sum;
            const memberBankPrefix = member.bankName.toLowerCase();
            if (memberBankPrefix === bankPrefix) {
              const memberTxs = allSavedTransactions.filter((tx: any) => tx.details?.equityMember?.id === member.id);
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
              return sum + Math.max(0, (parseFloat(member.investment) || 0) - subsequentSum);
            }
            return sum;
          }, 0);
          return {
            ...bank,
            balance: (parseFloat(bank.balance) || 0) + initialFundingSum
          };
        });

        setBanksList(adjustedBanks);
        setSelectedBank((prev: any) => {
          if (prev && adjustedBanks.some((b: any) => b.id === prev.id)) {
            return adjustedBanks.find((b: any) => b.id === prev.id);
          }
          return adjustedBanks.length > 0 ? adjustedBanks[0] : null;
        });

        if (userOnlyBanks.length !== savedBanks.length) {
          const updatedConfig = {
            ...compSettings.attendance_config,
            company_banks: userOnlyBanks
          };
          await supabase.from('company_settings').update({ attendance_config: updatedConfig }).eq('company_id', user.id);
        }
      } else {
        setBanksList([]);
        setSelectedBank(null);
      }

      const emails = allSavedEquity.map((m: any) => m.email).filter(Boolean);
      let employeeMap: Record<string, string> = {};
      if (emails.length > 0) {
        const { data: emps } = await supabase.from('employees').select('email, avatar_url').in('email', emails);
        if (emps) {
          emps.forEach((e: any) => {
            if (e.email && e.avatar_url) employeeMap[e.email.toLowerCase()] = e.avatar_url;
          });
        }
      }

      const superAdminEmail = (compSettings.company_email || user?.email || "").toLowerCase();
      const superAdminAvatar = compSettings.super_admin_avatar_url || "";

      const enrichedEquity = allSavedEquity.map((m: any) => {
        const emailLower = (m.email || "").toLowerCase();
        let actualAvatar = m.avatarUrl;
        if (emailLower && employeeMap[emailLower]) actualAvatar = employeeMap[emailLower];
        if (emailLower && emailLower === superAdminEmail && superAdminAvatar) actualAvatar = superAdminAvatar;
        return { ...m, avatarUrl: actualAvatar };
      });

      setEquityList(enrichedEquity);
      setTransactionsList(allSavedTransactions);

      setCachedFinance({
        banksList: adjustedBanks,
        equityList: enrichedEquity,
        transactionsList: allSavedTransactions,
        companySettings: compSettings
      });
      financeLoadedRef.current = true;
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [supabase]);

  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearAllFinanceData = async () => {
    try {
      setIsClearing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (useDbTables) {
        // Clear new database tables
        await Promise.all([
          supabase.from('company_banks').delete().eq('company_id', user.id),
          supabase.from('transactions').delete().eq('company_id', user.id),
        ]);
        setBanksList([]);
        setSelectedBank(null);
        setTransactionsList([]);
      } else {
        const { data } = await supabase.from('company_settings').select('attendance_config').eq('company_id', user.id).maybeSingle();
        const currentConfig = data?.attendance_config || {};
        const clearedConfig = {
          ...currentConfig,
          company_banks: [],
          transactions: [],
        };
        await supabase.from('company_settings').update({ attendance_config: clearedConfig }).eq('company_id', user.id);
        setBanksList([]);
        setSelectedBank(null);
        setTransactionsList([]);
      }
      setShowClearConfirm(false);
    } catch (e) {
      console.error('Error clearing finance data:', e);
    } finally {
      setIsClearing(false);
    }
  };


  const handleAddBankAccount = async (bankId: string, holderName: string, accountNumber: string, balance: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Not authenticated");
        return false;
      }
      
      if (useDbTables) {
        const row = {
          company_id: user.id,
          bank_design_id: bankId,
          bank_name: `${bankId.toUpperCase()} - ${accountNumber.slice(-4)}`,
          account_holder_name: holderName,
          account_number: accountNumber,
          balance: balance,
          is_active: true
        };
        const { error } = await supabase.from('company_banks').insert(row);
        if (error) {
          alert("Failed to save bank account: " + error.message);
          return false;
        }
      } else {
        const { data } = await supabase.from('company_settings').select('attendance_config').eq('company_id', user.id).maybeSingle();
        const currentConfig = data?.attendance_config || {};
        const existingBanks = currentConfig.company_banks || [];
        const design = BANK_DESIGNS[bankId] || { logo: `/Bank logo/DBSlogo.svg`, bg: '/DBS.svg', textColor: 'text-white', linkColor: 'text-gray-300', name: bankId.toUpperCase() };
        const suffix = accountNumber.slice(-4) || '7171';
        
        const newBank = {
          id: `${bankId}-${Date.now()}`,
          bg: design.bg,
          name: `${design.name} - ${suffix}`,
          textColor: design.textColor,
          linkColor: design.linkColor,
          logo: design.logo,
          account: `${design.name}-${accountNumber}`,
          holderName,
          accountNumber,
          balance
        };

        const updatedBanks = [...existingBanks, newBank];
        const updatedConfig = {
          ...currentConfig,
          company_banks: updatedBanks
        };

        const { error } = await supabase.from('company_settings').update({ attendance_config: updatedConfig }).eq('company_id', user.id);
        if (error) {
          alert("Failed to save bank account: " + error.message);
          return false;
        }
      }

      await loadFinanceData();
      return true;
    } catch (e: any) {
      console.error("Error adding bank account:", e);
      alert("Error adding bank account: " + e.message);
      return false;
    }
  };

  const handleAddEquityMember = async (
    name: string,
    role: string,
    share: number,
    investment: number,
    email?: string,
    phone?: string,
    avatarUrl?: string,
    bankId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Not authenticated");
        return false;
      }
      
      let generatedMemberId = `equity-${Date.now()}`;

      if (useDbTables) {
        let memberBankName = "";
        let memberAccountNumber = "";
        let memberAccountHolderName = "";

        if (bankId) {
          if (bankId === 'cash-drawer') {
            memberBankName = "cash-drawer";
            memberAccountHolderName = name;
            memberAccountNumber = "Cash Drawer";
          } else {
            const targetBank = banksList.find((b: any) => b.id === bankId);
            if (targetBank) {
              memberBankName = targetBank.bankDesignId || targetBank.id.split('-')[0].toLowerCase();
              memberAccountNumber = targetBank.accountNumber || "";
              memberAccountHolderName = targetBank.holderName || name;
            }
          }
        }

        const memberRow = {
          company_id: user.id,
          name,
          role,
          share,
          investment,
          email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
          phone: phone || "+65 9123 4567",
          dob: "1990-01-01",
          salary: 0,
          bank_name: memberBankName,
          account_number: memberAccountNumber,
          account_holder_name: memberAccountHolderName,
          stakeholder_id: `STK-${equityList.length + 1}`,
          avatar_url: avatarUrl || ""
        };

        const { data: dbMem, error: memErr } = await supabase
          .from('equity_members')
          .insert(memberRow)
          .select('id')
          .single();

        if (memErr) {
          alert("Failed to save equity member: " + memErr.message);
          return false;
        }

        generatedMemberId = dbMem.id;

        if (bankId && investment > 0) {
          let selectedBankName = "Hand Cash";
          if (bankId !== 'cash-drawer') {
            const targetBank = banksList.find((b: any) => b.id === bankId);
            if (targetBank) {
              selectedBankName = targetBank.name;
              const newBal = (parseFloat(targetBank.balance) || 0) + investment;
              await supabase.from('company_banks').update({ balance: newBal }).eq('id', bankId);
            }
          }

          const txRow = {
            company_id: user.id,
            payment_id: generatePaymentId("received", companySettings?.company_name || "Company"),
            type: "received",
            amount: investment,
            category: "investment",
            transaction_date: new Date().toISOString().split('T')[0],
            transaction_time: new Date().toTimeString().split(' ')[0],
            description: `Initial Capital Contribution from ${name} (${role})`,
            attachment_url: null,
            bank_id: bankId,
            bank_name: selectedBankName,
            details: {
              purpose: "Initial Capital Contribution",
              equityMember: {
                id: generatedMemberId,
                name: name,
                role: role,
                share: share
              }
            }
          };

          const { error: txErr } = await supabase.from('transactions').insert(txRow);
          if (txErr) {
            console.error("Failed to log transaction:", txErr.message);
          }
        }
      } else {
        const { data } = await supabase.from('company_settings').select('*').eq('company_id', user.id).maybeSingle();
        if (!data) {
          alert("Company settings not found");
          return false;
        }
        const currentConfig = data.attendance_config || {};
        const companyName = data.company_name || "Company";
        const existingMembers = currentConfig.equity_members || [];
        
        let updatedTransactions = currentConfig.transactions || [];
        let updatedBanks = currentConfig.company_banks || [];

        let memberBankName = "";
        let memberAccountNumber = "";
        let memberAccountHolderName = "";

        if (bankId) {
          if (bankId === 'cash-drawer') {
            memberBankName = "cash-drawer";
            memberAccountHolderName = name;
            memberAccountNumber = "Cash Drawer";
          } else {
            const targetBank = updatedBanks.find((b: any) => b.id === bankId);
            if (targetBank) {
              memberBankName = targetBank.bankDesignId || targetBank.id.split('-')[0].toLowerCase();
              memberAccountNumber = targetBank.accountNumber || "";
              memberAccountHolderName = targetBank.holderName || name;
            }
          }
        }

        const newMember = {
          id: generatedMemberId,
          name,
          role,
          share,
          investment,
          createdAt: new Date().toISOString(),
          email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
          phone: phone || "+65 9123 4567",
          designation: `${role} & Advisor`,
          department: "Executive Committee",
          joiningDate: new Date().toLocaleDateString("en-SG", { day: '2-digit', month: 'short', year: 'numeric' }),
          dob: "1990-01-01",
          stakeholderId: `STK-${existingMembers.length + 1}`,
          avatarUrl: avatarUrl || "",
          bankName: memberBankName,
          accountNumber: memberAccountNumber,
          accountHolderName: memberAccountHolderName
        };

        if (bankId && investment > 0) {
          let selectedBankName = "Hand Cash";
          if (bankId !== 'cash-drawer') {
            const targetBank = updatedBanks.find((b: any) => b.id === bankId);
            if (targetBank) {
              selectedBankName = targetBank.name;
              updatedBanks = updatedBanks.map((b: any) => {
                if (b.id === bankId) {
                  return { ...b, balance: (parseFloat(b.balance) || 0) + investment };
                }
                return b;
              });
            }
          }

          const newTransaction = {
            id: generatePaymentId("received", companyName),
            type: "received",
            amount: investment,
            category: "investment",
            date: new Date().toISOString().split('T')[0],
            description: `Initial Capital Contribution from ${name} (${role})`,
            attachmentUrl: null,
            bankId: bankId,
            bankName: selectedBankName,
            details: {
              purpose: "Initial Capital Contribution",
              equityMember: {
                id: generatedMemberId,
                name: name,
                role: role,
                share: share
              }
            },
            createdAt: new Date().toISOString()
          };

          updatedTransactions = [newTransaction, ...updatedTransactions];
        }

        const updatedMembers = [...existingMembers, newMember];
        const updatedConfig = {
          ...currentConfig,
          equity_members: updatedMembers,
          transactions: updatedTransactions,
          company_banks: updatedBanks
        };

        const { error } = await supabase
          .from('company_settings')
          .update({ attendance_config: updatedConfig })
          .eq('company_id', user.id);

        if (error) {
          alert("Failed to save equity member: " + error.message);
          return false;
        }
      }

      // ─── If salary is applicable, sync/upsert in employees table ───
      // We will keep the default behavior as requested by the user
      // No changes to this sync logic are needed as it operates exactly on 'employees' table.
      const salaryNum = 0; // default for new members
      
      await loadFinanceData();
      return true;
    } catch (e: any) {
      console.error("Error adding equity member:", e);
      alert("Error adding equity member: " + e.message);
      return false;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Financial</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Overview of Company Financial Details</p>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col">
        {/* ── Row 1: Summary Cards & Bank Action ── */}
        <FinanceRow1 
          onOpenPayment={(type) => {
            setPaymentType(type);
            setIsPaymentOpen(true);
          }} 
          selectedBank={selectedBank}
          onSelectBank={setSelectedBank}
          banks={banksList}
          transactions={transactionsList}
        />

        {/* ── Row 2: Company Banks & Cash Drawer ── */}
        <FinanceRow2 onAddBank={() => setIsAddBankOpen(true)} banks={banksList} transactions={transactionsList} />

        {/* ── Row 3: Equity Management ── */}
        <FinanceRow3 equityList={equityList} onOpenEquity={() => setIsAddEquityOpen(true)} />

        {/* ── Row 4: Recent Transactions ── */}
        <FinanceRow4 transactions={transactionsList} companyName={companySettings?.company_name} />
      </main>

      {/* Slide-over Overlays */}
      {isPaymentOpen && (
        <PaymentSidebar 
          onClose={() => setIsPaymentOpen(false)} 
          selectedBank={selectedBank}
          onSelectBank={setSelectedBank}
          type={paymentType}
          onSuccess={loadFinanceData}
        />
      )}

      {isAddBankOpen && (
        <AddBankSidebar 
          onClose={() => setIsAddBankOpen(false)} 
          onAdd={handleAddBankAccount}
        />
      )}

      {isAddEquityOpen && (
        <AddEquitySidebar 
          onClose={() => setIsAddEquityOpen(false)} 
          onAdd={handleAddEquityMember}
          existingMembers={equityList}
          banksList={banksList}
        />
      )}

      {/* ── Confirm Reset Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isClearing && setShowClearConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[24px] p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="text-[18px] font-black text-gray-900 dark:text-white mb-2">Reset Finance Data?</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              This will permanently remove <strong>all banks</strong>, <strong>all transactions</strong> (including payroll payments), and reset the Hand Cash balance to <strong>S$ 0.00</strong>. This cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[14px] text-[14px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={clearAllFinanceData}
                disabled={isClearing}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-[14px] text-[14px] font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : 'Yes, Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Undo Notification Toast ── */}
      {showUndoNotification && (
        <div className="fixed bottom-6 right-6 z-[60] bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-4 rounded-[20px] shadow-2xl flex items-center justify-between gap-6 border border-gray-800 dark:border-gray-150 animate-in slide-in-from-bottom-8 fade-in duration-300 w-full max-w-sm">
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-black leading-tight">Deleted {undoMemberName}</span>
            <span className="text-[10.5px] font-medium text-gray-400 dark:text-gray-500 mt-1">Fundings handled successfully</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleUndoDelete}
              className="px-4 py-2 bg-[#007AFF] text-white text-[12.5px] font-bold rounded-xl hover:bg-blue-600 transition-colors shrink-0 shadow-sm"
            >
              Undo ({undoCountdown}s)
            </button>
            <button
              onClick={() => {
                setShowUndoNotification(false);
                localStorage.removeItem("vertex_undo_equity_member");
              }}
              className="p-1.5 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

