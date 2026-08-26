"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export const dynamic = 'force-dynamic';

interface AppItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  logo: string;
  bgClass: string;
  url: string;
  manageUrl: string;
  isUpcoming: boolean;
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Welcome");
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const metaFirst = user.user_metadata?.first_name || user.user_metadata?.firstName;
          const metaFull = user.user_metadata?.full_name?.split(' ')[0];
          const resolvedName = metaFirst || metaFull;
          if (resolvedName) {
            setFirstName(resolvedName);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchUser();
  }, []);

  const apps: AppItem[] = [
    {
      id: "people",
      slug: "xentra-people",
      name: "Xentra People",
      category: "HR & Workforce",
      description: "Streamline employee management, automated attendance tracking, and smart timesheets seamlessly.",
      logo: "/apps-logo/xentra-bluelogo.svg",
      bgClass: "bg-white border-gray-200/80 shadow-sm",
      url: process.env.NEXT_PUBLIC_XENTRA_PEOPLE_URL || "http://localhost:3000",
      manageUrl: "/dashboard/subscriptions/xentra-people",
      isUpcoming: false,
    },
    {
      id: "paynote",
      slug: "xentra-paynote",
      name: "Xentra Paynote",
      category: "Finance & Expenses",
      description: "Company financial management, including an expense tracking system and company equity management.",
      logo: "/apps-logo/xentra_paynote.svg",
      bgClass: "bg-zinc-900 border-zinc-700/60 shadow-sm",
      url: "#",
      manageUrl: "/pricing",
      isUpcoming: true,
    }
  ];

  return (
    <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] text-gray-900 space-y-8">

      {/* 1. Header & Welcome Area */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <span>{greeting}{firstName ? `, ${firstName}` : ""}!</span>
          <span className="inline-block select-none">👋</span>
        </h1>
        <p className="text-[15px] text-gray-500 mt-1.5">
          Here's an overview of your applications.
        </p>
      </div>

      {/* 2. Apps Section */}
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Apps</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-200/90 rounded-[28px] p-6 shadow-xs flex flex-col justify-between relative"
            >
              <div>
                {/* Top Header Row */}
                <div className="flex items-start gap-4">
                  {/* App Logo Holding Card with 20px radius */}
                  <div className={`w-14 h-14 rounded-[20px] overflow-hidden flex items-center justify-center shrink-0 border p-2.5 ${app.bgClass}`}>
                    <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />
                  </div>

                  {/* App Title & Category / Status Pill */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[18px] font-bold text-gray-900 truncate">
                      {app.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] font-medium text-gray-500">
                        {app.category}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${app.isUpcoming
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        }`}>
                        {app.isUpcoming ? "Coming Soon" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* App Description */}
                <p className="text-[13.5px] text-gray-500 mt-4 leading-relaxed line-clamp-3">
                  {app.description}
                </p>
              </div>

              {/* Bottom Actions Row (Two Buttons) */}
              <div className="grid grid-cols-2 gap-3 pt-6 mt-4 border-t border-gray-100">
                {/* Button 1: Manage / Subscription */}
                <Link
                  href={app.manageUrl}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium text-[13px] transition-colors text-center flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>{app.isUpcoming ? "View Plan" : "Manage"}</span>
                </Link>

                {/* Button 2: Launch / Status */}
                {app.isUpcoming ? (
                  <button
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-medium text-[13px] cursor-not-allowed text-center"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] transition-colors shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Launch</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
