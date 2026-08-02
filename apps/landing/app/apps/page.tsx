"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, ArrowRight, Filter } from "lucide-react";

const apps = [
  {
    name: "Vertex HRMS",
    slug: "vertex-hrms",
    category: "Human Resources",
    description:
      "Complete HR management — payroll, leave, attendance, recruitment, and performance reviews in one powerful platform.",
    icon: "👥",
    color: "from-violet-500 to-purple-600",
    status: "Live",
    features: ["Payroll", "Leave & Attendance", "Recruitment", "Performance Reviews", "Org Chart"],
    startingPrice: "Free",
  },
  {
    name: "Xentra",
    slug: "xentra",
    category: "Human Resources",
    description:
      "Enterprise HR management platform — departments, workforce management, employee profiles, and HR operations.",
    icon: "⚡",
    color: "from-amber-500 to-orange-600",
    status: "Live",
    features: ["Departments", "Employee Directory", "HR Operations", "Enterprise Roles"],
    startingPrice: "Free",
  },
  {
    name: "Dort Accounts",
    slug: "dort-accounts",
    category: "Finance & Accounting",
    description:
      "Smart accounting software for Malaysian businesses. GST-compliant invoicing, expense tracking, and financial reports.",
    icon: "📊",
    color: "from-blue-500 to-cyan-600",
    status: "Coming Soon",
    features: ["Invoicing", "GST Reports", "Expense Tracking", "Payables", "Dashboards"],
    startingPrice: "Free",
  },
  {
    name: "Dort Desk",
    slug: "dort-desk",
    category: "Customer Support",
    description:
      "Unified customer support ticketing with AI-powered routing, SLA management, and omni-channel inbox.",
    icon: "🎯",
    color: "from-emerald-500 to-teal-600",
    status: "Coming Soon",
    features: ["Ticketing", "Live Chat", "SLA Tracking", "AI Routing"],
    startingPrice: "Free",
  },
  {
    name: "Dort CRM",
    slug: "dort-crm",
    category: "Sales & CRM",
    description:
      "Manage leads, deals, and customer relationships with a beautifully simple CRM built for Asian sales teams.",
    icon: "🤝",
    color: "from-orange-500 to-rose-600",
    status: "Coming Soon",
    features: ["Pipeline", "Contacts", "Email Sequences", "Reports"],
    startingPrice: "Free",
  },
];

const categories = ["All", "Human Resources", "Finance & Accounting", "Customer Support", "Sales & CRM"];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AppsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#0a0a12] min-h-screen text-white pt-24 pb-24">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
            App Catalog
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black">
            All Dort Asia Apps
          </h1>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            One subscription hub for all the tools your company needs. New apps
            added every quarter.
          </p>
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-10"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              id="apps-search"
              type="text"
              placeholder="Search apps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-white/30" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-medium px-3 py-2 rounded-lg transition-all ${
                  activeCategory === cat
                    ? "gradient-brand text-white"
                    : "glass border border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* App Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-white/30">
              No apps match your search.
            </div>
          ) : (
            filtered.map((app) => (
              <motion.div key={app.slug} variants={fadeUp}>
                <Link
                  href={`/apps/${app.slug}`}
                  className="flex flex-col sm:flex-row gap-5 glass rounded-2xl border border-white/5 hover:border-white/10 p-6 transition-all card-hover group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-2xl shrink-0`}>
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h2 className="font-bold text-white group-hover:gradient-brand-text transition-all">
                          {app.name}
                        </h2>
                        <p className="text-xs text-violet-400/70 font-medium">{app.category}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                        app.status === "Live"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}>
                        {app.status === "Live" && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">{app.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {app.features.map((f) => (
                        <span key={f} className="text-[11px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-white/30">
                        Starting from{" "}
                        <span className="text-violet-400 font-semibold">
                          {app.startingPrice}
                        </span>
                      </p>
                      <span className="flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:gap-2 transition-all">
                        View details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
