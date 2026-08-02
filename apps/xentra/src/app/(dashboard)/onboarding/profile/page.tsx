"use client";

import React, { useState } from "react";
import { ChevronDown, Save, ArrowRight, ArrowLeft, Calendar } from "lucide-react";

export default function EmployeeProfileSetup() {
  const steps = [
    { id: 1, label: "Personal Information" },
    { id: 2, label: "Identity Information" },
    { id: 3, label: "Contact Information" },
    { id: 4, label: "Emergency Contact" },
    { id: 5, label: "Education" },
    { id: 6, label: "Certifications" },
    { id: 7, label: "Medical Information" },
    { id: 8, label: "Bank Details" },
    { id: 9, label: "Documents Upload" },
    { id: 10, label: "Review & Submit" },
  ];

  const currentStep = 1;
  const progressPercent = 10;

  return (
    <div className="flex h-full w-full bg-white text-gray-900 overflow-hidden relative z-[100] rounded-tl-[24px] rounded-bl-[24px]">
      {/* Left Sidebar (Stepper) */}
      <div className="w-[280px] shrink-0 border-r border-[#E5E5EA] bg-white flex flex-col pt-8 pb-6 h-full relative z-10 overflow-y-auto page-scrollbar">
        <div className="px-6 mb-8">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Onboarding</p>
          <h1 className="text-[20px] font-bold leading-tight mb-2 text-[#1C1C1E]">Employee Details</h1>
          <p className="text-[12px] text-gray-500 leading-relaxed font-medium pr-2">
            Please provide accurate information for your employee profile.
          </p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-1 relative">
          {steps.map((step, idx) => {
            const isActive = step.id === currentStep;
            return (
              <div key={step.id} className="relative group">
                <button
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-[12px] transition-all relative z-10
                    ${isActive ? "bg-[#EEF4FF] text-[#007AFF]" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  <div className={`h-[22px] w-[22px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors
                    ${isActive ? "bg-[#007AFF] text-white" : "bg-[#F2F2F7] text-[#8E8E93] group-hover:bg-[#E5E5EA]"}`}
                  >
                    {step.id}
                  </div>
                  <span className={`text-[13px] truncate ${isActive ? "font-bold" : "font-medium"}`}>
                    {step.label}
                  </span>
                </button>
                {/* Connecting line */}
                {idx < steps.length - 1 && (
                  <div className="absolute left-[23px] top-[34px] bottom-[-10px] w-[1px] bg-[#E5E5EA] z-0 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Progress */}
        <div className="mt-8 px-6 pb-2">
          <div className="border border-[#E5E5EA] rounded-[12px] p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-gray-700">Onboarding Progress</span>
              <span className="text-[11px] font-bold text-[#1C1C1E]">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#F2F2F7] rounded-full overflow-hidden">
              <div className="h-full bg-[#007AFF] rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-[10px] text-[#8E8E93] mt-2 font-medium">Please complete all steps to continue</p>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-[#F9F9FB] relative min-w-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto page-scrollbar px-8 py-8 pb-[100px]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 max-w-[1000px] mx-auto w-full">
            <div>
              <h2 className="text-[22px] font-bold text-gray-900 mb-1">Personal Information</h2>
              <p className="text-[13px] text-gray-500 font-medium">Let's start with your basic personal details.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#007AFF] text-[#007AFF] text-[13px] font-bold hover:bg-[#EEF4FF] transition-colors shadow-sm bg-white">
              <Save className="h-4 w-4" strokeWidth={2.5} />
              Save Draft
            </button>
          </div>

          <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full">
            
            {/* Basic Details Card */}
            <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <h3 className="text-[16px] font-bold text-gray-900 mb-5">Basic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">First Name <span className="text-[#FF3B30]">*</span></label>
                  <input type="text" placeholder="John" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Last Name / Surname <span className="text-[#FF3B30]">*</span></label>
                  <input type="text" placeholder="Doe" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Preferred Name <span className="text-[#8E8E93] font-medium">(Optional)</span></label>
                  <input type="text" placeholder="Johnny" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Personal Email Address <span className="text-[#FF3B30]">*</span></label>
                  <input type="email" placeholder="john.doe@email.com" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Date of Birth <span className="text-[#FF3B30]">*</span></label>
                  <div className="relative">
                    <input type="text" placeholder="15/08/1990" className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Gender <span className="text-[#FF3B30]">*</span></label>
                  <div className="relative">
                    <select className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer shadow-sm">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Marital Status <span className="text-[#FF3B30]">*</span></label>
                  <div className="relative">
                    <select className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer shadow-sm">
                      <option>Single</option>
                      <option>Married</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Nationality <span className="text-[#FF3B30]">*</span></label>
                  <div className="relative">
                    <select className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer shadow-sm">
                      <option>Singaporean</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Country of Residence <span className="text-[#FF3B30]">*</span></label>
                  <div className="relative">
                    <select className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer shadow-sm">
                      <option>Singapore</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Residential Status <span className="text-[#FF3B30]">*</span></label>
                  <div className="relative">
                    <select className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer shadow-sm">
                      <option>Singapore Citizen</option>
                      <option>Permanent Resident</option>
                      <option>Foreigner</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                  </div>
                </div>

              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <h3 className="text-[16px] font-bold text-gray-900 mb-5">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Mobile Number <span className="text-[#FF3B30]">*</span></label>
                  <div className="flex shadow-sm rounded-[8px]">
                    <div className="relative w-[90px] shrink-0">
                      <select className="h-10 pl-3 pr-8 w-full bg-[#F8F9FA] border border-[#E5E5EA] border-r-0 rounded-l-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer">
                        <option>+65</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                    </div>
                    <input type="text" placeholder="9123 4567" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-r-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Personal Email Address <span className="text-[#8E8E93] font-medium">(if different)</span></label>
                  <input type="email" placeholder="john.doe.personal@email.com" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                </div>

                <div className="md:col-span-2 grid grid-cols-[1fr_200px] gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#1C1C1E]">Residential Address <span className="text-[#FF3B30]">*</span></label>
                    <input type="text" placeholder="123 Orchard Road, #05-01" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#1C1C1E]">Postal Code <span className="text-[#FF3B30]">*</span></label>
                    <input type="text" placeholder="238883" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                  </div>
                </div>

                 <div className="md:col-span-2 grid grid-cols-[1fr_1fr] gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#1C1C1E]">City <span className="text-[#FF3B30]">*</span></label>
                    <input type="text" placeholder="Singapore" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#1C1C1E]">Country <span className="text-[#FF3B30]">*</span></label>
                    <div className="relative">
                      <select className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer shadow-sm">
                        <option>Singapore</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <h3 className="text-[16px] font-bold text-gray-900 mb-5">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1.5fr] gap-x-6 gap-y-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Emergency Contact Name <span className="text-[#FF3B30]">*</span></label>
                  <input type="text" placeholder="Jane Doe" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Relationship <span className="text-[#FF3B30]">*</span></label>
                  <div className="relative">
                    <select className="h-10 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer shadow-sm">
                      <option>Sister</option>
                      <option>Spouse</option>
                      <option>Parent</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Secondary Emergency Contact Number <span className="text-[#FF3B30]">*</span></label>
                  <div className="flex shadow-sm rounded-[8px]">
                    <div className="relative w-[90px] shrink-0">
                      <select className="h-10 pl-3 pr-8 w-full bg-[#F8F9FA] border border-[#E5E5EA] border-r-0 rounded-l-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer">
                        <option>+65</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
                    </div>
                    <input type="text" placeholder="9876 5432" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-r-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all" />
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-col gap-1.5 mt-2">
                  <label className="text-[12px] font-bold text-[#1C1C1E]">Emergency Contact Address <span className="text-[#FF3B30]">*</span></label>
                  <input type="text" placeholder="456 Bukit Timah Road, #02-12, Singapore 259012" className="h-10 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm" />
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E5E5EA] px-8 py-4 flex items-center justify-between z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-[1000px] mx-auto w-full flex items-center justify-between">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[#E5E5EA] text-[#1C1C1E] text-[14px] font-bold hover:bg-gray-50 transition-colors bg-white shadow-sm">
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              Back
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#007AFF] text-white text-[14px] font-bold hover:bg-[#0062CC] transition-colors shadow-sm">
              Save & Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
