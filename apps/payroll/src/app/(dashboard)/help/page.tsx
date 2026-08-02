"use client";

import React, { useState } from "react";
import { 
  Search, FileText, HelpCircle, Users, LifeBuoy, 
  Mail, MessageSquareHeart, ChevronRight, Zap,
  BookOpen, ShieldCheck, CreditCard, Settings
} from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { title: "Getting Started", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10", count: 12 },
    { title: "Features & Tools", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", count: 24 },
    { title: "Account & Security", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10", count: 18 },
    { title: "Billing & Plans", icon: CreditCard, color: "text-purple-500", bg: "bg-purple-500/10", count: 8 },
    { title: "System Settings", icon: Settings, color: "text-gray-500", bg: "bg-gray-500/10", count: 15 },
  ];

  const faqs = [
    { q: "How do I reset my password?", a: "Go to Settings > Profile or contact your administrator." },
    { q: "Can I use multiple cloud accounts?", a: "Yes, you can connect both Google Drive and OneDrive in Cloud Settings." },
    { q: "How is attendance calculated?", a: "Attendance is tracked based on your check-in/out times and global overtime policies." },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#0B0B0F] rounded-[24px] overflow-hidden">
      {/* Hero Section */}
      <div className="bg-[#007AFF] px-8 py-16 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-[32px] font-bold text-white mb-4">How can we help you?</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search for articles, guides, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1C1C22] rounded-[18px] py-4 pl-12 pr-6 text-[15px] outline-none shadow-xl shadow-blue-900/10"
            />
          </div>
        </div>
        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-5%] w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto page-scrollbar p-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          
          {/* Categories Grid */}
          <section>
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6">Explore Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat, i) => (
                <button 
                  key={i}
                  className="p-6 rounded-[22px] bg-[#F8F9FA] dark:bg-white/5 border border-transparent hover:border-[#007AFF] hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left flex flex-col gap-4 group"
                >
                  <div className={`h-12 w-12 rounded-2xl ${cat.bg} flex items-center justify-center`}>
                    <cat.icon className={`h-6 w-6 ${cat.color}`} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-gray-900 dark:text-white group-hover:text-[#007AFF] transition-colors">{cat.title}</p>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">{cat.count} articles</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top FAQs */}
            <section className="lg:col-span-2">
              <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6">Popular Questions</h2>
              <div className="flex flex-col gap-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-5 rounded-[20px] bg-white dark:bg-white/5 border border-[#F1F3F5] dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200">{faq.q}</p>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Support Channels */}
            <section>
              <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6">Direct Support</h2>
              <div className="flex flex-col gap-4">
                <div className="p-6 rounded-[22px] bg-[#007AFF]/5 border border-[#007AFF]/10 flex flex-col gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white">
                    <MessageSquareHeart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Live Chat</h3>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">Talk to our product specialists right now.</p>
                  </div>
                  <button className="w-full py-3 bg-[#007AFF] text-white rounded-[14px] font-bold text-[14px] hover:bg-[#0062CC] transition-colors">
                    Start Chat
                  </button>
                </div>
                
                <div className="p-6 rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Email Us</h3>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">Support tickets are handled within 24 hours.</p>
                  </div>
                  <button className="w-full py-3 bg-white dark:bg-white/10 text-gray-900 dark:text-white rounded-[14px] font-bold text-[14px] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 transition-colors">
                    Create Ticket
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Callout */}
          <div className="p-10 rounded-[32px] bg-[#F1F3F5] dark:bg-white/5 text-center mt-4">
            <h3 className="text-[22px] font-bold text-gray-900 dark:text-white mb-2">Can't find what you're looking for?</h3>
            <p className="text-[15px] text-gray-500 font-medium mb-6">Our community and support teams are here to help you 24/7.</p>
            <div className="flex items-center justify-center gap-4">
              <button className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[16px] font-bold text-[15px] hover:opacity-90 transition-opacity">
                Visit Community
              </button>
              <button className="px-8 py-3 bg-transparent text-gray-900 dark:text-white rounded-[16px] font-bold text-[15px] border border-gray-300 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
