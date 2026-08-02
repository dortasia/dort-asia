"use client";
import React, { useState } from "react";
import { X, User, PieChart, Clock, FileText, StickyNote, AlertCircle } from "lucide-react";

interface EquityHolderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  holderName?: string;
}

export default function EquityHolderProfileModal({ isOpen, onClose, holderName = "Dinesh VC" }: EquityHolderProfileModalProps) {
  const [activeTab, setActiveTab] = useState("personal");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1C1C1E] w-[1100px] max-w-[95vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Equity Holder Profile</h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">View and manage equity information and settings</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-[260px] bg-[#F8F9FA] dark:bg-[#121217] border-r border-[#F2F2F7] dark:border-[#2C2C35] flex flex-col">
            {/* Profile Info */}
            <div className="flex flex-col items-center py-8 px-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div className="w-20 h-20 rounded-full bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center text-[24px] font-bold mb-3">
                {holderName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase()}
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">{holderName}</h3>
              <p className="text-[12px] text-[#8E8E93] mt-1">UI Designer & Developer</p>
              <div className="mt-3 bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
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
            {activeTab === 'personal' && (
              <div className="flex flex-col gap-8 max-w-[800px]">
                {/* Content Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Personal Information</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-[#8E8E93]">Last updated: 12 Jun 2026, 10:30 AM</span>
                    <button className="bg-[#007AFF] hover:bg-[#0062CC] text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Form Sections */}
                <div className="flex flex-col gap-8">
                  {/* Personal Information Grid */}
                  <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Full Name</label>
                      <input type="text" defaultValue={holderName} className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Employee ID</label>
                      <input type="text" defaultValue="EMP0001" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Email Address</label>
                      <input type="email" defaultValue="dinesh.vc@company.com" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Designation</label>
                      <input type="text" defaultValue="UI Designer & Developer" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Department</label>
                      <input type="text" defaultValue="Engineering" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Date of Joining</label>
                      <input type="text" defaultValue="15 Jun 2024" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Phone Number</label>
                      <div className="flex">
                        <select className="bg-[#F8F9FA] dark:bg-[#121217] border border-r-0 border-[#E5E7EB] dark:border-[#2C2C35] rounded-l-lg px-2 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF]">
                          <option>🇸🇬 +65</option>
                        </select>
                        <input type="text" defaultValue="9123 4567" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-r-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Location</label>
                      <input type="text" defaultValue="Singapore Office" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-[#8E8E93]">Employment Type</label>
                      <select className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors">
                        <option>Full-Time</option>
                        <option>Part-Time</option>
                        <option>Contract</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-px w-full bg-[#F2F2F7] dark:bg-[#2C2C35]" />

                  {/* Equity Configuration */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Equity Configuration</h3>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Equity Grant Date</label>
                        <input type="text" defaultValue="01 Jan 2025" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Equity Type</label>
                        <select className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors">
                          <option>ESOP</option>
                          <option>RSU</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Equity Class</label>
                        <select className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors">
                          <option>Common Stock</option>
                          <option>Preferred Stock</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Total Units Granted</label>
                        <input type="number" defaultValue="15000" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Exercise Price (per unit)</label>
                        <input type="text" defaultValue="S$ 12.00" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Grant Fair Value (per unit)</label>
                        <input type="text" defaultValue="S$ 24.50" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Equity Status Cards */}
                  <div className="flex flex-col gap-4 mt-2">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Equity Status</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {/* Vested */}
                      <div className="bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl p-4 relative overflow-hidden">
                        <div className="text-[11px] font-semibold text-[#8E8E93] mb-1">Vested Units</div>
                        <div className="text-[20px] font-bold text-[#007AFF]">4,500</div>
                        <div className="text-[10px] font-medium text-[#8E8E93] mt-1">30.0%</div>
                        <PieChart className="absolute right-4 bottom-4 w-10 h-10 text-[#007AFF]/10" />
                      </div>
                      {/* Unvested */}
                      <div className="bg-[#FFF4E5] dark:bg-[#FF9500]/10 border border-[#FFE0B2] dark:border-[#FF9500]/20 rounded-xl p-4 relative overflow-hidden">
                        <div className="text-[11px] font-semibold text-[#FF9500] mb-1">Unvested Units</div>
                        <div className="text-[20px] font-bold text-[#FF9500]">10,500</div>
                        <div className="text-[10px] font-medium text-[#FF9500]/70 mt-1">70.0%</div>
                        <Clock className="absolute right-4 bottom-4 w-10 h-10 text-[#FF9500]/20" />
                      </div>
                      {/* Exercised */}
                      <div className="bg-[#E5F9E5] dark:bg-[#34C759]/10 border border-[#BDECB6] dark:border-[#34C759]/20 rounded-xl p-4 relative overflow-hidden">
                        <div className="text-[11px] font-semibold text-[#34C759] mb-1">Exercised Units</div>
                        <div className="text-[20px] font-bold text-[#34C759]">0</div>
                        <div className="text-[10px] font-medium text-[#34C759]/70 mt-1">0.00%</div>
                        <FileText className="absolute right-4 bottom-4 w-10 h-10 text-[#34C759]/20" />
                      </div>
                      {/* Available */}
                      <div className="bg-[#F3E5F5] dark:bg-[#AF52DE]/10 border border-[#E1BEE7] dark:border-[#AF52DE]/20 rounded-xl p-4 relative overflow-hidden">
                        <div className="text-[11px] font-semibold text-[#AF52DE] mb-1">Available to Exercise</div>
                        <div className="text-[20px] font-bold text-[#AF52DE]">4,500</div>
                        <div className="text-[10px] font-medium text-[#AF52DE]/70 mt-1">100.0%</div>
                        <Clock className="absolute right-4 bottom-4 w-10 h-10 text-[#AF52DE]/20" />
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-[#F2F2F7] dark:bg-[#2C2C35]" />

                  {/* Bank Details */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Bank Details for Payout (Optional)</h3>
                    <div className="grid grid-cols-4 gap-x-4 gap-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Account Holder Name</label>
                        <input type="text" defaultValue={holderName} className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Bank Name</label>
                        <input type="text" defaultValue="HDFC Bank" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">Account Number</label>
                        <input type="text" defaultValue="XXXX XXXX XXXX 1234" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#8E8E93]">IFSC Code</label>
                        <input type="text" defaultValue="HDFC0001231" className="w-full bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
            
            {activeTab !== 'personal' && (
              <div className="flex flex-col items-center justify-center h-full text-[#8E8E93]">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-[14px] font-semibold">This section is currently under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
