"use client";

import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Notification01Icon, UserIcon, CreditCardIcon, Logout01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

export function DashboardHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [companyName, setCompanyName] = useState("DORT Asia");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchCompanyAndSubscription() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let companyFound = false;

          // 1. Fetch from secure API route first (Source of Truth)
          const res = await fetch("/api/user/company", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.company && data.company.company_name) {
              setCompanyName(data.company.company_name);
              companyFound = true;
            }
          } 
          
          if (!companyFound) {
            // 2. Fallback to metadata if DB company doesn't exist yet
            const metaCompany = user.user_metadata?.companyName || user.user_metadata?.company_name;
            if (metaCompany) {
              setCompanyName(metaCompany);
            } else {
              // 3. Ultimate fallback (e.g. manual login without company)
              const metaFirst = user.user_metadata?.first_name || user.user_metadata?.firstName || user.user_metadata?.full_name?.split(' ')[0];
              if (metaFirst) {
                setCompanyName(`${metaFirst}'s Workspace`);
              } else {
                setCompanyName("My Workspace");
              }
            }
          }
        }
      } catch (err) {
        // Silent catch
      }

      // Check subscription status
      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const data = await res.json();
          if (data.plan) {
            setHasSubscription(true);
            setPlanName(data.plan);
          }
        }
      } catch (err) {
        // Unsubscribed / free
      }
    }
    fetchCompanyAndSubscription();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await fetch('/api/auth/login-method', { method: 'DELETE' }).catch(() => {});
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between text-gray-900 z-50">
      <div className="flex items-center">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          <img src="/company_logo/DortAsiaLogo.svg" alt="Dort Asia" className="h-6" />
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search apps..." 
            className="bg-transparent border-none outline-none text-[13px] w-48 placeholder:text-gray-400 text-gray-900"
          />
        </div>

        {/* Notifications */}
        <Link 
          href="/dashboard/notifications" 
          aria-label="View notifications"
          className="relative flex items-center justify-center hover:bg-gray-50 transition-colors outline-none w-10 h-10 rounded-full bg-white border border-gray-200"
        >
          <HugeiconsIcon icon={Notification01Icon} className="w-4.5 h-4.5 text-gray-500 hover:text-gray-700" />
        </Link>

        {/* Company Profile Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            aria-label="Company Profile"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-center transition-all outline-none w-10 h-10 rounded-full overflow-hidden bg-[#f6f6f6] active:scale-95 ${
              hasSubscription 
                ? "ring-2 ring-blue-600 ring-offset-2 ring-offset-white shadow-sm" 
                : ""
            }`}
          >
            <img 
              src="/icons/company-profile.svg" 
              alt="Company Profile" 
              className="w-full h-full object-cover" 
            />
          </button>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-80 bg-white rounded-[24px] shadow-2xl border border-gray-100 p-4 z-50 text-gray-900"
              >
                {/* Company Header Card */}
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/dashboard/settings/company");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-[18px] bg-gray-50/80 hover:bg-gray-100/80 border border-gray-100/80 cursor-pointer transition-colors mb-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[14px] bg-[#f6f6f6] flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                      <img 
                        src="/icons/company-profile.svg" 
                        alt={companyName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-semibold text-gray-900 leading-tight">
                        {companyName}
                      </h4>
                      <p className="text-[12px] text-gray-500 mt-0.5 font-medium">
                        Company Profile
                      </p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-gray-400 shrink-0" />
                </button>

                {/* Menu List */}
                <div className="flex flex-col gap-1">
                  {/* User Profile */}
                  <button 
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[12px] hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-[13.5px] font-medium text-left"
                  >
                    <HugeiconsIcon icon={UserIcon} className="w-4.5 h-4.5 text-gray-500 stroke-[1.8]" />
                    <span>User Profile</span>
                  </button>

                  {/* Subscriptions */}
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/pricing");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-[13.5px] font-medium text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <HugeiconsIcon icon={CreditCardIcon} className="w-4.5 h-4.5 text-gray-500 stroke-[1.8]" />
                      <span>Subscriptions</span>
                    </div>
                    {hasSubscription && planName ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold text-[11.5px] border border-blue-100/60 capitalize">
                        {planName} Plan
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-[11.5px]">
                        Free
                      </span>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="my-2 border-t border-gray-100" />

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[12px] hover:bg-rose-50 text-rose-600 font-semibold transition-colors text-[13.5px] text-left"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="w-4.5 h-4.5 text-rose-600 stroke-[2]" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
