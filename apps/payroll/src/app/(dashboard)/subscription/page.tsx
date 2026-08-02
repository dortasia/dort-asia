"use client";

import React, { useState } from "react";
import { Check, Download, Info, Users, Calendar, Headphones, Briefcase, BarChart, Workflow, Target, UserCheck, Phone, Blocks, Shield, Zap, Database, HardDrive, Filter, MessageSquare, PlusSquare, Image as ImageIcon } from "lucide-react";
import HeaderSearchBar from "@/components/HeaderSearchBar";

export default function SubscriptionPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      name: "Basic",
      price: billing === "yearly" ? "$4" : "$5",
      period: "/user/month",
      description: "Essential HR tools for small teams.",
      features: [
        { text: "Up to 10 Employees", icon: Users },
        { text: "Basic Attendance Tracking", icon: Calendar },
        { text: "Leave Management", icon: Briefcase },
        { text: "Standard Support", icon: Headphones },
        { text: "1 GB File Storage", icon: Database },
      ],
      buttonText: "Current Plan",
      buttonVariant: "secondary"
    },
    {
      name: "Plus",
      price: billing === "yearly" ? "$8" : "$10",
      period: "/user/month",
      description: "Advanced tools for growing companies.",
      features: [
        { text: "Up to 50 Employees", icon: Users },
        { text: "Advanced Analytics", icon: BarChart },
        { text: "Detailed Reporting", icon: Filter },
        { text: "Priority Support", icon: Zap },
        { text: "50 GB File Storage", icon: Database },
      ],
      buttonText: "Upgrade to Plus",
      buttonVariant: "secondary"
    },
    {
      name: "Pro",
      price: billing === "yearly" ? "$16" : "$20",
      period: "/user/month",
      description: "Maximum productivity for larger teams.",
      features: [
        { text: "Unlimited Employees", icon: Users },
        { text: "Dedicated Success Manager", icon: UserCheck },
        { text: "Performance Management", icon: Target },
        { text: "Custom Approval Workflows", icon: Workflow },
        { text: "Team Group Messaging", icon: MessageSquare },
        { text: "500 GB Storage", icon: Database },
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "primary",
      highlight: true
    },
    {
      name: "Custom",
      price: "Custom",
      period: "",
      description: "Tailored solutions for large organizations.",
      features: [
        { text: "All Pro Features", icon: Check },
        { text: "On-Premise Deployment", icon: Blocks },
        { text: "Advanced Security", icon: Shield },
        { text: "24/7 Phone Support", icon: Phone },
        { text: "Unlimited Storage", icon: Database },
        { text: "Dedicated Engineering", icon: UserCheck }
      ],
      buttonText: "Contact Sales",
      buttonVariant: "secondary"
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
            Subscription
          </h1>
          <p className="text-[14px] text-gray-500 font-medium tracking-wide mt-1">
            Manage your billing and plan
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col gap-5 max-w-[1600px] mx-auto w-full justify-center">
        
        {/* Top Section: Tracker */}
        <div className="bg-white/40 dark:bg-[#1C1C22]/40 backdrop-blur-xl rounded-[20px] p-5 border border-white/20 dark:border-white/5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#1d1d1f] flex items-center gap-2">
                Current Plan: <span className="text-[#007AFF] dark:text-[#0A84FF]">PRO</span>
              </h2>
              <p className="text-[13px] text-[#86868b] font-medium mt-0.5">Billing cycle renews on Apr 1, 2026</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-bold text-[#1d1d1f]">49 <span className="text-[#86868b] font-medium text-[13px]">/ 50 seats used</span></p>
            </div>
          </div>
          
          <div className="w-full h-2 bg-[#E5E5EA] dark:bg-[#2A2A31] rounded-full overflow-hidden border border-[#D1D1D6] dark:border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="h-full bg-gradient-to-r from-[#FFCC00] to-[#FF9500] rounded-full shadow-[0_0_10px_rgba(255,204,0,0.4)]" style={{ width: '98%' }} />
          </div>
          <p className="text-[13px] text-[#D08A00] dark:text-[#FFD60A] font-semibold flex items-center gap-1.5 mt-0.5">
            <Info className="h-4 w-4" /> Almost at your seat limit. Upgrade to add more employees.
          </p>
        </div>

        {/* Middle Section: Switches */}
        <div className="flex flex-col items-center mt-1 gap-6">
          
          {/* Billing Cycle Switch */}
          <div className="bg-[#F1F3F5] dark:bg-[#1C1C22] p-1 rounded-full inline-flex items-center relative mb-5 w-[240px]">
            <div 
              className="absolute top-1 bottom-1 bg-white dark:bg-[#2A2A31] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none transition-all duration-300 pointer-events-none"
              style={{
                left: billing === 'monthly' ? '4px' : '106px',
                width: billing === 'monthly' ? '100px' : '130px'
              }}
            />
            <button 
              onClick={() => setBilling("monthly")}
              className={`relative w-[100px] py-1.5 rounded-full text-[14px] font-medium transition-colors z-10 ${billing === "monthly" ? "text-[#1d1d1f] dark:text-white" : "text-[#64748B] hover:text-[#1d1d1f] dark:text-[#86868b] dark:hover:text-[#E5E5EA]"}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBilling("yearly")}
              className={`relative w-[130px] flex items-center justify-center gap-2 py-1.5 rounded-full text-[14px] font-medium transition-colors z-10 ${billing === "yearly" ? "text-[#1d1d1f] dark:text-white" : "text-[#64748B] hover:text-[#1d1d1f] dark:text-[#86868b] dark:hover:text-[#E5E5EA]"}`}
            >
              Yearly
              <span className="bg-[#10B981]/15 text-[#10B981] text-[10px] px-2 py-[2px] rounded-full font-bold">Save 20%</span>
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-2 transition-all duration-500">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`relative flex flex-col rounded-[24px] p-7 transition-all duration-300 backdrop-blur-xl ${
                  plan.highlight 
                    ? "bg-gradient-to-b from-[#F0F7FF]/90 to-white/90 dark:from-[#0A84FF]/10 dark:to-[#121217]/80 border border-[#0A84FF]/50 shadow-[0_16px_40px_rgba(10,132,255,0.2)] ring-1 ring-[#0A84FF]/20 md:-translate-y-2 scale-[1.02] z-10" 
                    : "bg-gradient-to-b from-white/90 to-white/40 dark:from-[#1C1C22]/90 dark:to-[#1C1C22]/50 border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03] dark:ring-white/5"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#007AFF] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md tracking-wider">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-[17px] font-bold text-[#1d1d1f] tracking-wide">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-[32px] font-extrabold text-[#1d1d1f] tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-[12px] text-[#86868b] font-medium ml-1">{plan.period}</span>}
                  </div>
                </div>
                <p className="text-[13px] text-[#86868b] font-medium mb-8">{plan.description}</p>

                <div className="flex-1 flex flex-col gap-4 mb-8">
                  {plan.features.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-[#86868b] dark:text-[#A1A1AA]" strokeWidth={2} />
                        <span className="text-[13px] font-medium text-[#4A4A4A] dark:text-[#E5E5EA]">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  className={`w-full py-3 rounded-[12px] text-[14px] font-bold transition-all mt-auto mb-4 ${
                    plan.buttonVariant === "primary"
                      ? "bg-[var(--user-accent)] hover:bg-[#0062CC] text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98]"
                      : "bg-[#F1F3F5]/80 hover:bg-[#E5E7EB] dark:bg-[#2A2A31]/60 dark:hover:bg-[#3A3A41] text-[#1d1d1f] active:scale-[0.98]"
                  }`}
                >
                  {plan.buttonText}
                </button>

                <p className="text-center text-[11px] text-[#86868b] underline decoration-[#86868b]/30 underline-offset-2 cursor-pointer hover:text-[#1d1d1f] transition-colors">
                  This plan may include add-ons. Learn more
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
