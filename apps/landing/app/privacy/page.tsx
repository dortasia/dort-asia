"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import {
  ShieldCheck, Lock, Eye, Database, UserCheck, FileText,
  Globe, AlertTriangle, Mail, ChevronDown, ChevronRight,
  Building2, Users, CreditCard, Server, Key, Fingerprint
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  badge?: string;
}

// ─── Components ───────────────────────────────────────────────────────────────

function TableOfContents({ sections }: { sections: { id: string; title: string }[] }) {
  return (
    <nav className="sticky top-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Contents</p>
      <ul className="flex flex-col gap-1">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="flex items-center gap-2 text-[13px] text-slate-600 hover:text-blue-600 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-all group font-medium"
            >
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity shrink-0" />
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PolicySection({ id, icon, title, children, badge }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-sm">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[22px] font-bold text-slate-900">{title}</h2>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                {badge}
              </span>
            )}
          </div>
          <div className="w-12 h-0.5 bg-blue-500 rounded-full" />
        </div>
      </div>
      <div className="ml-14 space-y-4 text-[15px] text-slate-600 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function InfoCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-600">{icon}</span>
        <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[14px] text-slate-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70 mt-2 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertBox({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) {
  const styles = {
    info: "bg-blue-50/60 border-blue-100 text-blue-800",
    warning: "bg-amber-50/60 border-amber-100 text-amber-800",
    success: "bg-green-50/60 border-green-100 text-green-800",
  };
  const icons = {
    info: <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />,
    success: <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />,
  };
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-[14px] leading-relaxed font-medium ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const tocSections = [
  { id: "introduction", title: "Introduction" },
  { id: "data-collected", title: "Data We Collect" },
  { id: "how-we-use", title: "How We Use Your Data" },
  { id: "vertex-specific", title: "Vertex HRMS — App-Specific Policies" },
  { id: "data-security", title: "Data Security & Architecture" },
  { id: "access-controls", title: "Data Visibility & Access Controls" },
  { id: "data-retention", title: "Data Retention" },
  { id: "third-parties", title: "Third-Party Services" },
  { id: "your-rights", title: "Your Rights" },
  { id: "company-policies", title: "Company Policies" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* SEO */}
      <title>Privacy Policy — Dort Asia</title>
      <meta
        name="description"
        content="Dort Asia's comprehensive Privacy Policy covering how we collect, use, protect and retain personal, employment and financial data across our Vertex HRMS platform."
      />

      <div className="min-h-screen bg-white text-slate-900">
        {/* ── Navbar spacer / back link ── */}
        <div className="border-b border-slate-100">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-4 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Home
            </Link>
            <span className="text-slate-200">/</span>
            <span className="text-[13px] text-slate-400 font-medium">Privacy Policy</span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-slate-50/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-20 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-[13px] font-bold text-blue-600 uppercase tracking-widest">Legal Document</span>
            </div>
            <h1 className="text-[48px] sm:text-[60px] font-bold leading-tight tracking-tight text-slate-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-[18px] text-slate-600 max-w-2xl leading-relaxed mb-8 font-medium">
              We take your data seriously. This policy explains exactly what we collect, why we collect it, how we protect it, and what rights you have — with full transparency.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-[13px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Effective Date: <strong className="text-slate-700 font-semibold ml-1">5 July 2026</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                Entity: <strong className="text-slate-700 font-semibold ml-1">Dort Asia Technologies Pte. Ltd.</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                Jurisdiction: <strong className="text-slate-700 font-semibold ml-1">Singapore (PDPA 2012)</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <TableOfContents sections={tocSections} />
            </aside>

            {/* Content */}
            <div className="space-y-16">

              {/* 1 — Introduction */}
              <PolicySection id="introduction" icon={<ShieldCheck className="w-5 h-5" />} title="Introduction">
                <p>
                  Dort Asia Technologies Pte. Ltd. (&quot;Dort Asia&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates a suite of business applications, with <span className="text-slate-900 font-semibold">Vertex</span> being our live, fully operational HRMS platform. Vertex is a complete company operations platform that unifies people management, payroll, finance, equity, project tracking, and documents.
                </p>
                <p>
                  This Privacy Policy applies to all data we collect and process when you use Vertex or any Dort Asia service. It is written in compliance with the Singapore <span className="text-slate-900 font-semibold">Personal Data Protection Act 2012 (PDPA)</span> and is designed to be transparent, specific, and legally protective for both our users and our company.
                </p>
                <AlertBox type="info">
                  <strong>Scope:</strong> This policy covers Vertex HRMS (live), all future Dort Asia products, and Dort Asia&apos;s own internal company operations. It governs employees, clients, and any individual whose data is processed through our systems.
                </AlertBox>
              </PolicySection>

              {/* 2 — Data We Collect */}
              <PolicySection id="data-collected" icon={<Database className="w-5 h-5" />} title="Data We Collect">
                <p>
                  We collect personal data only when it is necessary to provide our services, meet statutory obligations, or fulfil legitimate business purposes. Below is a comprehensive breakdown of every category of data we process:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 !mt-6">
                  <InfoCard
                    icon={<Users className="w-4 h-4" />}
                    title="Identity & Personal"
                    items={[
                      "Full legal name, preferred name",
                      "Date of birth, nationality",
                      "NRIC (Singapore Citizens & PRs)",
                      "FIN number (foreign workers)",
                      "Passport number & expiry date",
                      "Identity document scans (front & back)",
                      "Work pass type, number, issue & expiry dates",
                    ]}
                  />
                  <InfoCard
                    icon={<Building2 className="w-4 h-4" />}
                    title="Employment"
                    items={[
                      "Job title, department, reporting line",
                      "Work email address",
                      "Monthly gross salary (SGD)",
                      "Employment start & end dates",
                      "CPF contribution rates & residential status",
                      "Skills Development Fund (SDF) status",
                      "Foreign worker levy details",
                    ]}
                  />
                  <InfoCard
                    icon={<CreditCard className="w-4 h-4" />}
                    title="Financial"
                    items={[
                      "Bank name (from approved bank list)",
                      "Account holder name",
                      "Bank account number",
                      "Bank code & branch code",
                      "Payment records & unique payment IDs",
                      "Payroll history and payslips",
                    ]}
                  />
                  <InfoCard
                    icon={<Server className="w-4 h-4" />}
                    title="System & Audit"
                    items={[
                      "Full audit trail of all system activity",
                      "Login timestamps & IP addresses",
                      "Who made what changes and when",
                      "Document access and download logs",
                      "OTP verification records",
                      "Financial PIN authorization attempts",
                    ]}
                  />
                </div>
                <AlertBox type="warning">
                  <strong>Sensitive Data:</strong> NRIC, FIN, passport numbers, and bank details are treated as sensitive personal data under the PDPA. They are encrypted at rest and only accessible to authorised personnel for statutory or payroll purposes.
                </AlertBox>
              </PolicySection>

              {/* 3 — How We Use */}
              <PolicySection id="how-we-use" icon={<Eye className="w-5 h-5" />} title="How We Use Your Data">
                <p>
                  Every piece of data we collect has a specific, documented purpose. We do not sell, rent, or trade your personal data. Below are the lawful bases under which we process your information:
                </p>
                <div className="space-y-4 !mt-6">
                  {[
                    {
                      title: "Statutory Compliance (Singapore)",
                      desc: "We apply exact CPF contribution rates based on your age bracket and residential status. We process ethnicity-based community fund contributions (SINDA, CDAC, ECF), the Skills Development Fund (SDF), and Foreign Worker Levy. This processing is mandated by Singapore law and cannot be refused.",
                    },
                    {
                      title: "Payroll & Financial Ledger Processing",
                      desc: "Salary calculations occur strictly inside the Payroll module, which acts as the single source of truth. Every approved payment automatically generates a unique, immutable Payment ID (e.g., PAY-DORTASIA-20260531-0001) to create an unbreakable financial audit trail.",
                    },
                    {
                      title: "Project Cost Tracking & P&L",
                      desc: "Once payroll is generated, salary data is automatically posted to the assigned project's expense ledger. This maintains accurate, real-time company Profit & Loss (P&L) statements and ensures project billing accuracy.",
                    },
                    {
                      title: "Onboarding & Workforce Management",
                      desc: "We use your identity and employment data to create and manage your employee profile, configure role-based access, assign you to departments and projects, and maintain your employment history record.",
                    },
                    {
                      title: "Security & Fraud Prevention",
                      desc: "Audit logs and system access records are used to detect unauthorized access, investigate incidents, and maintain the integrity of financial records. PIN authorization logs are retained to verify the legitimacy of all financial transactions.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="border border-slate-200 rounded-xl p-5 bg-slate-50/30">
                      <p className="text-[14px] font-bold text-slate-800 mb-2">{item.title}</p>
                      <p className="text-[14px] text-slate-600 font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </PolicySection>

              {/* 4 — Vertex Specific */}
              <PolicySection id="vertex-specific" icon={<Fingerprint className="w-5 h-5" />} title="Vertex HRMS — App-Specific Policies" badge="Live App">
                <p>
                  Vertex is currently our only live, publicly deployed application. The following policies apply specifically and exclusively to data processed within Vertex HRMS:
                </p>
                <div className="space-y-5 !mt-6">
                  <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-blue-700 mb-2">Attendance & Geofencing</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Vertex supports GPS-based attendance tracking and QR code check-ins. When GPS attendance is enabled, your device&apos;s location coordinates are captured <em>at the moment of check-in only</em>. We do not continuously track your location. Location data is used solely to verify that the check-in occurred within the approved worksite radius. Raw GPS coordinates are not stored beyond 90 days.
                    </p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-blue-700 mb-2">Document Storage</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Identity documents (NRIC scans, passport copies, work pass copies), payslips, and company documents uploaded to Vertex are stored in a private, access-controlled Supabase Storage bucket. These files are not publicly accessible. Signed URLs with short expiry windows are used to serve files to authorised users. Documents are never shared with third parties unless required by law.
                    </p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-blue-700 mb-2">Payroll PIN Authorization</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      All financial transactions in Vertex mandate a 6-digit PIN confirmation from an authorized user. This PIN is never stored in plaintext. It is hashed using SHA-256 and bcrypt algorithms before storage. A failed PIN attempt is logged and may trigger account lockout after repeated failures to prevent unauthorized financial operations.
                    </p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-blue-700 mb-2">Realtime Notifications</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Vertex uses Supabase Realtime WebSockets for live notifications (e.g., attendance check-ins, payroll approvals). These connections are authenticated and tenant-scoped. Notification payloads contain only the minimum information required and are not persisted in third-party notification queues.
                    </p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-blue-700 mb-2">OTP Verification</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Vertex uses OTP (One-Time Password) sent via email and mobile for authentication. OTPs expire within 10 minutes and are single-use. Phone numbers and email addresses used for OTP delivery are subject to this Privacy Policy and are not used for marketing communications without explicit consent.
                    </p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-blue-700 mb-2">Org Chart & Hierarchy Data</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Vertex maintains an organisation chart reflecting reporting lines. Your name, job title, and department may be visible to other employees within your company&apos;s Vertex instance according to the role-based visibility rules set by your company&apos;s Super Admin.
                    </p>
                  </div>
                </div>
                <AlertBox type="success">
                  <strong>Tenant Isolation Guarantee:</strong> Each company (tenant) using Vertex has a completely isolated data environment. Company A&apos;s data is never accessible to Company B, even on shared infrastructure, due to PostgreSQL Row Level Security (RLS) enforced at the database query level.
                </AlertBox>
              </PolicySection>

              {/* 5 — Security */}
              <PolicySection id="data-security" icon={<Lock className="w-5 h-5" />} title="Data Security & Architecture">
                <p>
                  We implement enterprise-grade security measures across all layers of our infrastructure. Security is not an afterthought — it is built into the architecture of every system we operate.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 !mt-6">
                  {[
                    { icon: <Database className="w-4 h-4" />, title: "Database Security", desc: "PostgreSQL with Row Level Security (RLS) policies enforced on every table. All queries are tenant-scoped at the database layer, not just the application layer." },
                    { icon: <Key className="w-4 h-4" />, title: "Encryption", desc: "Data encrypted at rest (AES-256) and in transit (TLS 1.3). Financial PINs are double-hashed with SHA-256 + bcrypt. No plaintext secrets are stored." },
                    { icon: <ShieldCheck className="w-4 h-4" />, title: "Authentication", desc: "Supabase Auth with OTP (email & mobile). Session tokens are short-lived JWTs. Refresh tokens are rotated on each use and invalidated on logout." },
                    { icon: <Server className="w-4 h-4" />, title: "Infrastructure", desc: "Deployed on Vercel (Edge Network) with Next.js 16. Database hosted on Supabase (Singapore region). No data leaves the Singapore/APAC zone for primary storage." },
                    { icon: <FileText className="w-4 h-4" />, title: "Audit Logging", desc: "Full immutable audit trail of all data changes, access events, and financial transactions. Logs cannot be deleted by application users, only by Super Admins with forensic records." },
                    { icon: <Globe className="w-4 h-4" />, title: "API Security", desc: "All API routes are protected by Supabase JWT validation. Server-side rendering prevents client-side data exposure. Environment variables are never exposed to the browser." },
                  ].map((item) => (
                    <div key={item.title} className="border border-slate-200 rounded-xl p-5 bg-slate-50/30">
                      <div className="flex items-center gap-2 mb-2 text-blue-600">
                        {item.icon}
                        <p className="text-[13px] font-bold text-slate-800">{item.title}</p>
                      </div>
                      <p className="text-[13px] text-slate-600 font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </PolicySection>

              {/* 6 — Access Controls */}
              <PolicySection id="access-controls" icon={<UserCheck className="w-5 h-5" />} title="Data Visibility & Access Controls">
                <p>
                  Within any Vertex instance, data visibility is heavily restricted by design. Access is not assumed — it must be explicitly granted through the permission system:
                </p>
                <ul className="space-y-3 !mt-4">
                  {[
                    "By default, an employee cannot view their coworkers' personal details, salary, or documents.",
                    "Data visibility is strictly governed by Role Permissions, the \"Reports To\" hierarchy, explicit project assignment, and Admin rights — not simply by department membership.",
                    "Only Super Admins can modify Admin Payroll Settings (CPF configurations, allowance templates, levy rates). This ensures no unauthorized personnel can alter company-wide calculations.",
                    "Finance module access is separate from HR access. An employee with HR permissions does not automatically gain access to financial records.",
                    "Document downloads generate a time-limited signed URL (15 minutes). The access event is logged with the user's identity, timestamp, and IP address.",
                    "Departing employees have their accounts deactivated immediately upon termination. Deactivated accounts cannot log in but their data is retained for statutory compliance periods.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50/10">
                      <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[14px] text-slate-600 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </PolicySection>

              {/* 7 — Retention */}
              <PolicySection id="data-retention" icon={<FileText className="w-5 h-5" />} title="Data Retention">
                <p>
                  We retain personal data for as long as required to fulfil the purpose for which it was collected, or as mandated by Singapore law, whichever is longer.
                </p>
                <div className="overflow-x-auto !mt-6 border border-slate-200 rounded-xl shadow-sm">
                  <table className="w-full text-[13px] border-collapse bg-white">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="text-left py-3 px-4 text-slate-500 font-bold uppercase tracking-wider">Data Category</th>
                        <th className="text-left py-3 px-4 text-slate-500 font-bold uppercase tracking-wider">Retention Period</th>
                        <th className="text-left py-3 px-4 text-slate-500 font-bold uppercase tracking-wider">Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["Employee identity & employment records", "7 years after termination", "MOM / IRAS / Employment Act"],
                        ["Payroll & CPF records", "7 years", "CPF Act, IRAS guidelines"],
                        ["Financial transaction records", "7 years", "Singapore Companies Act"],
                        ["Audit logs & access records", "3 years", "Internal policy / PDPA"],
                        ["GPS check-in coordinates", "90 days", "Operational necessity"],
                        ["OTP & authentication logs", "90 days", "Security investigation"],
                        ["Work pass copies", "Until pass expiry + 2 years", "MOM Work Pass Conditions"],
                        ["Document uploads (general)", "Duration of employment + 3 years", "Internal policy"],
                      ].map(([cat, period, basis]) => (
                        <tr key={cat} className="hover:bg-slate-50/50 transition-colors font-medium">
                          <td className="py-3 px-4 text-slate-800">{cat}</td>
                          <td className="py-3 px-4 text-slate-600">{period}</td>
                          <td className="py-3 px-4 text-slate-400 text-[12px]">{basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AlertBox type="warning">
                  Upon request, we will delete personal data that is no longer required, provided no overriding legal obligation requires its retention. Deletion requests that conflict with statutory obligations will be partially fulfilled where technically feasible.
                </AlertBox>
              </PolicySection>

              {/* 8 — Third Parties */}
              <PolicySection id="third-parties" icon={<Globe className="w-5 h-5" />} title="Third-Party Services">
                <p>
                  We use a limited number of trusted third-party services to operate our platform. All sub-processors are vetted for security compliance and are contractually bound to protect your data:
                </p>
                <div className="space-y-3 !mt-6">
                  {[
                    { name: "Supabase (PostgreSQL & Storage)", role: "Primary database, authentication, file storage, and realtime infrastructure. Data region: Singapore.", link: "supabase.com/privacy" },
                    { name: "Vercel", role: "Application hosting and edge deployment. All server-side code; no customer data stored in Vercel's persistent storage.", link: "vercel.com/legal/privacy-policy" },
                    { name: "Google Maps API", role: "Used for geolocation-based attendance verification only. No user location data is sent to Google beyond the API call needed to resolve coordinates to an address.", link: "policies.google.com/privacy" },
                  ].map((tp) => (
                    <div key={tp.name} className="border border-slate-200 rounded-xl p-5 bg-slate-50/30 flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-[14px] font-bold text-slate-800 mb-1">{tp.name}</p>
                        <p className="text-[13px] text-slate-600 font-medium">{tp.role}</p>
                      </div>
                      <span className="text-[12px] text-slate-400 font-medium">{tp.link}</span>
                    </div>
                  ))}
                </div>
                <AlertBox type="info">
                  We do <strong>not</strong> sell, rent, or share your personal data with advertising networks, data brokers, or any third party for marketing purposes.
                </AlertBox>
              </PolicySection>

              {/* 9 — Your Rights */}
              <PolicySection id="your-rights" icon={<UserCheck className="w-5 h-5" />} title="Your Rights">
                <p>
                  Under the Singapore PDPA and as a matter of our company policy, you have the following rights with respect to your personal data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 !mt-6">
                  {[
                    { title: "Right of Access", desc: "You may request a copy of all personal data we hold about you at any time." },
                    { title: "Right to Correction", desc: "You may request correction of inaccurate or incomplete personal data." },
                    { title: "Right to Withdraw Consent", desc: "Where processing is consent-based, you may withdraw consent. Withdrawal does not affect prior processing." },
                    { title: "Right to Data Portability", desc: "You may request your data in a machine-readable format (JSON/CSV) for portability." },
                    { title: "Right to Deletion", desc: "You may request deletion of data not subject to a legal retention obligation." },
                    { title: "Right to Know", desc: "You have the right to know how your data is used, who can access it, and where it is stored." },
                  ].map((r) => (
                    <div key={r.title} className="border border-slate-200 rounded-xl p-5 bg-slate-50/30">
                      <p className="text-[14px] font-bold text-slate-800 mb-1">{r.title}</p>
                      <p className="text-[13px] text-slate-600 font-medium">{r.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="!mt-4">
                  To exercise any right, submit a written request to <strong className="text-slate-800 font-semibold">enquiry@dortasia.com</strong>. We will respond within <strong className="text-slate-800 font-semibold">30 calendar days</strong>. Identity verification may be required before fulfilling any request.
                </p>
              </PolicySection>

              {/* 10 — Company Policies */}
              <PolicySection id="company-policies" icon={<Building2 className="w-5 h-5" />} title="Company Policies" badge="Operator Guide">
                <p>
                  If your company uses Vertex HRMS as an operator (i.e., you are an employer using Vertex to manage your workforce), the following additional obligations apply to your company:
                </p>
                <div className="space-y-5 !mt-6">
                  <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-amber-800 mb-2">Data Collection Consent</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      As the operator, you are responsible for obtaining valid informed consent from your employees before collecting and uploading their personal data into Vertex. This includes NRIC/FIN numbers, bank details, and sensitive identity documents. Dort Asia acts as a data processor on your behalf; you remain the data controller.
                    </p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-amber-800 mb-2">Super Admin Responsibilities</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      The Super Admin account for your Vertex instance carries elevated data access. It is the operator&apos;s responsibility to ensure the Super Admin credential is held only by an authorised individual, is protected by a strong password and MFA, and that access is revoked immediately when the relevant person&apos;s role changes.
                    </p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-amber-800 mb-2">Payroll Accuracy</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      The operator is responsible for ensuring that all salary figures, CPF categories, allowance types, and levy details entered into Vertex are accurate and current. Dort Asia provides the calculation engine; the accuracy of inputs and ultimate payroll liability remains with the employer.
                    </p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-amber-800 mb-2">Offboarding & Termination</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      When an employee is terminated, it is the operator&apos;s responsibility to deactivate the employee&apos;s Vertex account promptly. Dort Asia enforces account deactivation controls but cannot guarantee this occurs if the operator does not initiate the action.
                    </p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-amber-800 mb-2">Breach Notification</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      In the event of a data breach affecting your company&apos;s Vertex instance, Dort Asia will notify the operator within 72 hours of becoming aware. The operator is then responsible for notifying affected employees and the PDPC (Personal Data Protection Commission) if the breach is notifiable under the PDPA Mandatory Breach Notification Obligation.
                    </p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5">
                    <p className="text-[14px] font-bold text-amber-800 mb-2">Limitation of Liability</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Dort Asia Technologies Pte. Ltd. is not liable for any loss, damage, or regulatory penalty arising from the operator&apos;s incorrect input of data, failure to obtain employee consent, failure to deactivate accounts, or misuse of the Super Admin access. Dort Asia&apos;s liability is limited to the direct costs of rectifying any data breach caused by a failure in our systems or infrastructure.
                    </p>
                  </div>
                </div>
              </PolicySection>

              {/* 11 — Changes */}
              <PolicySection id="changes" icon={<AlertTriangle className="w-5 h-5" />} title="Changes to This Policy">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our services, legal obligations, or best practices. When we make material changes, we will:
                </p>
                <ul className="space-y-2 !mt-4">
                  {[
                    "Update the Effective Date at the top of this page.",
                    "Send a notification to registered operators and administrators via email.",
                    "Display an in-app banner in Vertex for at least 14 days following the update.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] font-medium text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="!mt-4">
                  Continued use of Dort Asia services after a policy update constitutes acceptance of the revised terms. We encourage you to review this page periodically.
                </p>
              </PolicySection>

              {/* 12 — Contact */}
              <PolicySection id="contact" icon={<Mail className="w-5 h-5" />} title="Contact Us">
                <p>
                  For any questions, data access requests, corrections, or privacy concerns, please reach out through:
                </p>
                <div className="mt-6 max-w-md">
                  <a href="mailto:enquiry@dortasia.com" className="block border border-slate-200 hover:border-blue-300 rounded-xl p-5 bg-slate-50/30 hover:bg-blue-50/30 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <p className="text-[14px] font-bold text-slate-800">General Enquiries</p>
                    </div>
                    <p className="text-[13px] text-blue-600 group-hover:text-blue-500 transition-colors font-semibold">enquiry@dortasia.com</p>
                    <p className="text-[12px] text-slate-500 mt-1 font-medium">For all support, data requests, and general questions</p>
                  </a>
                </div>
                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/30 !mt-4">
                  <p className="text-[13px] font-bold text-slate-700 mb-1">Registered Address</p>
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                    Dort Asia Technologies Pte. Ltd.<br />
                    Singapore<br />
                    UEN: (to be provided upon registration)
                  </p>
                </div>
                <p className="text-[13px] text-slate-500 !mt-4 font-medium">
                  We aim to respond to all privacy-related requests within <strong className="text-slate-700 font-bold">30 calendar days</strong>. For complex requests, we may extend this period by a further 30 days and will notify you accordingly.
                </p>
              </PolicySection>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-8 text-center">
                <p className="text-[13px] text-slate-400 font-medium">
                  © {new Date().getFullYear()} Dort Asia Technologies Pte. Ltd. · Privacy Policy · Effective 5 July 2026
                </p>
              </div>

            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
