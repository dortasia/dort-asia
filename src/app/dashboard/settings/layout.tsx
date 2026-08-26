"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Building03Icon, 
  UserIcon, 
  CreditCardIcon,
  Shield01Icon
} from "@hugeicons/core-free-icons";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Company Profile", href: "/dashboard/settings/company", icon: Building03Icon },
    { name: "Account", href: "/dashboard/settings/account", icon: UserIcon },
    { name: "Security & Sessions", href: "/dashboard/settings/security", icon: Shield01Icon },
    { name: "Billing", href: "/dashboard/settings/billing", icon: CreditCardIcon },
  ];

  return (
    <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] text-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-[15px] text-gray-500 mt-1">Manage your company and account preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-56 lg:w-60 shrink-0">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-white shadow-xs border border-gray-200/80 text-blue-600 font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 font-medium"
                  }`}
                >
                  <HugeiconsIcon 
                    icon={item.icon} 
                    className={`w-4.5 h-4.5 ${isActive ? "text-blue-600" : "text-gray-400"}`} 
                  />
                  <span className="text-[14px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}

