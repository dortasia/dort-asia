"use client"

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'

export function SettingsEmployeesPage() {
  const [publicDirectory, setPublicDirectory] = useState(true)

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div>
        <h2 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">Employees Settings</h2>
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col">
        {/* Leave Management */}
        <Link href="/settings/leave" className="p-6 flex items-center justify-between border-b border-[#E5E7EB] cursor-pointer hover:bg-gray-50 transition-colors first:rounded-t-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
              <Icon icon="hugeicons:calendar-03" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="type-body-medium text-[#161616]">Leave Management</span>
              <span className="type-small text-[#737373]">Configure leave policies, entitlements, carry-forward, and half-day rules</span>
            </div>
          </div>
          <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B]" />
        </Link>

        {/* Claim Management */}
        <Link href="/settings/claims/advanced" className="p-6 flex items-center justify-between border-b border-[#E5E7EB] cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
              <Icon icon="hugeicons:invoice-01" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="type-body-medium text-[#161616]">Claim Management</span>
              <span className="type-small text-[#737373]">Setup reimbursement limits, receipt rules, and overseas travel claims</span>
            </div>
          </div>
          <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B]" />
        </Link>

        {/* OT Management */}
        <Link href="/settings/overtime/advanced" className="p-6 flex items-center justify-between border-b border-[#E5E7EB] cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
              <Icon icon="hugeicons:clock-01" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="type-body-medium text-[#161616]">OT Management</span>
              <span className="type-small text-[#737373]">Setup overtime pay multipliers, approval workflows, and monthly caps</span>
            </div>
          </div>
          <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B]" />
        </Link>

        {/* Public Directory */}
        <div className="p-6 flex items-center justify-between last:rounded-b-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
              <Icon icon="hugeicons:user-group" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="type-body-medium text-[#161616]">Public Directory</span>
              <span className="type-small text-[#737373]">Allow employees to see each other's contact info</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setPublicDirectory(!publicDirectory)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${publicDirectory ? 'bg-[#34C759]' : 'bg-[#E5E7EB]'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${publicDirectory ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
