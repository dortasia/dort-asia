"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { AdminUnauthorizedView } from "@/components/admin/AdminUnauthorizedView";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Store01Icon,
  CreditCardIcon,
  HierarchySquare02Icon,
  UserMultiple02Icon,
  Invoice01Icon,
  Shield01Icon,
  UserCheck01Icon,
  Layers01Icon
} from "@hugeicons/core-free-icons";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAdmin, role, isLoading } = useAdminStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-[13.5px] text-gray-500 font-medium">Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminUnauthorizedView />;
  }

  const adminNavTabs = [
    {
      name: "Overview",
      href: "/dashboard/admin",
      icon: DashboardSquare01Icon,
      active: pathname === "/dashboard/admin",
    },
    {
      name: "Apps",
      href: "/dashboard/admin/apps",
      icon: Store01Icon,
      active: pathname.startsWith("/dashboard/admin/apps"),
    },
    {
      name: "Subscription Plans",
      href: "/dashboard/admin/plans",
      icon: CreditCardIcon,
      active: pathname.startsWith("/dashboard/admin/plans"),
    },
    {
      name: "Features",
      href: "/dashboard/admin/features",
      icon: Layers01Icon,
      active: pathname.startsWith("/dashboard/admin/features"),
    },
    {
      name: "Subscriptions",
      href: "/dashboard/admin/subscriptions",
      icon: HierarchySquare02Icon,
      active: pathname.startsWith("/dashboard/admin/subscriptions"),
    },
    {
      name: "Customers",
      href: "/dashboard/admin/customers",
      icon: UserMultiple02Icon,
      active: pathname.startsWith("/dashboard/admin/customers"),
    },
    {
      name: "Payments",
      href: "/dashboard/admin/payments",
      icon: Invoice01Icon,
      active: pathname.startsWith("/dashboard/admin/payments"),
    },
    {
      name: "Audit Logs",
      href: "/dashboard/admin/audit-logs",
      icon: Shield01Icon,
      active: pathname.startsWith("/dashboard/admin/audit-logs"),
    },
    ...(role === "SUPER_ADMIN"
      ? [
          {
            name: "Admin Users",
            href: "/dashboard/admin/users",
            icon: UserCheck01Icon,
            active: pathname.startsWith("/dashboard/admin/users"),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50/40">
      {/* Top Admin Header & Subnavigation */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">SaaS Marketplace Admin</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  role === "SUPER_ADMIN" 
                    ? "bg-purple-50 text-purple-700 border-purple-200" 
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
                </span>
              </div>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Centralized platform governance, product catalogs, and subscription operations
              </p>
            </div>

            {/* Breadcrumb back to Dashboard */}
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="text-[13px] text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-gray-100 pt-1 -mb-px">
            {adminNavTabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-[13.5px] font-medium border-b-2 whitespace-nowrap transition-all ${
                  tab.active
                    ? "border-black text-black font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  className={`w-4 h-4 ${tab.active ? "text-black" : "text-gray-400"}`}
                />
                <span>{tab.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Admin Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
