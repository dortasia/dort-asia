'use client';

import React, { useState } from 'react';
import {
  Home01Icon,
  Calendar03Icon,
  UserGroupIcon,
  Building03Icon,
  HardDriveIcon,
  Alert01Icon,
  Settings01Icon,
  CommandIcon
} from 'hugeicons-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { useCompanyStore } from '@/store/useCompanyStore';

const TOP_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home01Icon, href: '/' },
  { id: 'attendance', label: 'Attendance', icon: Calendar03Icon, href: '/attendance' },
  { id: 'employees', label: 'Employees', icon: UserGroupIcon, href: '/employees' },
  { id: 'department', label: 'Departments', icon: Building03Icon, href: '/department' },
  { id: 'drive', label: 'Drive', icon: HardDriveIcon, href: '/drive' },
  { id: 'alerts', label: 'Alerts', icon: Alert01Icon, href: '/alerts' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { company } = useCompanyStore();
  const activeItem = TOP_NAV_ITEMS.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  );
  const activeId = activeItem?.id ?? null;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[80px] flex-col items-center justify-between bg-[#FBFBFD] py-6">
      <div className="flex flex-col items-center gap-8 w-full">
        {/* App Logo */}
        <Link href="/" className="flex h-12 w-12 items-center justify-center">
          <Image
            src="/software-logo/black_icon.svg"
            alt="Logo"
            width={24}
            height={24}
            className="h-6 w-auto"
          />
        </Link>

        {/* Top Nav Icons */}
        <nav className="flex flex-col items-center gap-6 w-full">
          {TOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;

            return (
              <div key={item.id} className="relative flex w-full items-center justify-center group">
                {/* Sliding Active Left Indicator Bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 h-9 w-[3px] rounded-tr-[25px] rounded-br-[25px] bg-[#007AFF]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <Link
                  href={item.href}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors ${
                    isActive ? 'text-[#007AFF]' : 'text-[#6B7280] hover:bg-gray-100/60 hover:text-gray-900'
                  }`}
                >
                  {/* Sliding Active Background */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-[18px] bg-[#EAF2FF]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    <Icon size={20} />
                  </span>
                </Link>

                {/* Hover Tooltip */}
                <div className="absolute left-[70px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[60] flex items-center">
                  <div className="bg-[#111827] text-white text-[14px] font-medium px-4 py-2 rounded-xl whitespace-nowrap shadow-md">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-6 pb-2 w-full">
        {/* Bottom Nav Icons */}
        <div className="relative flex w-full items-center justify-center group">
          {pathname.startsWith('/settings') && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 h-9 w-[3px] rounded-tr-[25px] rounded-br-[25px] bg-[#007AFF]"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}

          <Link
            href="/settings"
            className={`relative flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors ${
              pathname.startsWith('/settings') 
                ? 'text-[#007AFF]' 
                : 'text-[#6B7280] hover:bg-gray-100/60 hover:text-gray-900'
            }`}
          >
            {pathname.startsWith('/settings') && (
              <motion.div
                layoutId="sidebar-active-bg"
                className="absolute inset-0 rounded-[18px] bg-[#EAF2FF]"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <Settings01Icon size={20} />
            </span>
          </Link>

          {/* Hover Tooltip */}
          <div className="absolute left-[70px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[60] flex items-center">
            <div className="bg-[#111827] text-white text-[14px] font-medium px-4 py-2 rounded-xl whitespace-nowrap shadow-md">
              Settings
            </div>
          </div>
        </div>
        
        {/* Company Logo / Bottom Logo */}
        <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-white shadow-sm overflow-hidden p-1">
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.company_name || company.name || "Company Logo"} className="h-full w-full object-contain rounded-lg" />
          ) : (
            <span className="text-[14px] font-bold text-white uppercase font-sans">
              {company?.company_name?.[0] || company?.name?.[0] || 'C'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
