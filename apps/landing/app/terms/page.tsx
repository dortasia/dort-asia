"use client";

import React from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import {
  FileText, ChevronRight, Building2, Globe, ShieldCheck,
  AlertTriangle, Mail, UserCheck, CreditCard, Lock,
  Scale, XCircle, Gavel, RefreshCw, Server
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

function Section({ id, icon, title, children, badge }: SectionProps) {
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

function AlertBox({ type, children }: { type: "info" | "warning" | "danger" }) {
  const styles = {
    info: "bg-blue-50/60 border-blue-100 text-blue-800",
    warning: "bg-amber-50/60 border-amber-100 text-amber-800",
    danger: "bg-red-50/60 border-red-100 text-red-800",
  };
  const icons = {
    info: <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />,
    danger: <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />,
  };
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-[14px] leading-relaxed font-medium ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/30">
      {children}
    </div>
  );
}

// ─── TOC ──────────────────────────────────────────────────────────────────────

const tocSections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "services", title: "Description of Services" },
  { id: "eligibility", title: "Eligibility & Registration" },
  { id: "account", title: "Account Responsibilities" },
  { id: "subscription", title: "Subscription & Payments" },
  { id: "acceptable-use", title: "Acceptable Use" },
  { id: "ip", title: "Intellectual Property" },
  { id: "data", title: "Data & Privacy" },
  { id: "warranties", title: "Disclaimers & Warranties" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing Law" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact Us" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsOfServicePage() {
  return (
    <>
      <title>Terms of Service — Dort Asia</title>
      <meta
        name="description"
        content="Dort Asia's Terms of Service governing the use of Vertex HRMS and all associated platforms operated by Dort Asia Technologies Pte. Ltd."
      />

      <div className="min-h-screen bg-white text-slate-900">

        {/* ── Breadcrumb ── */}
        <div className="border-b border-slate-100">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-4 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Home
            </Link>
            <span className="text-slate-200">/</span>
            <span className="text-[13px] text-slate-400 font-medium">Terms of Service</span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-slate-50/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-20 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-[13px] font-bold text-blue-600 uppercase tracking-widest">Legal Document</span>
            </div>
            <h1 className="text-[48px] sm:text-[60px] font-bold leading-tight tracking-tight text-slate-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-[18px] text-slate-600 max-w-2xl leading-relaxed mb-8 font-medium">
              These terms govern your use of all Dort Asia platforms and services. Please read them carefully before accessing or using our software.
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
                Jurisdiction: <strong className="text-slate-700 font-semibold ml-1">Singapore</strong>
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

              {/* 1 — Acceptance */}
              <Section id="acceptance" icon={<Gavel className="w-5 h-5" />} title="Acceptance of Terms">
                <p>
                  By accessing, registering for, or using any service provided by <strong className="text-slate-800">Dort Asia Technologies Pte. Ltd.</strong> (&quot;Dort Asia&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), including but not limited to <strong className="text-slate-800">Vertex HRMS</strong>, you (&quot;User&quot;, &quot;Operator&quot;, or &quot;Client&quot;) agree to be legally bound by these Terms of Service (&quot;Terms&quot;).
                </p>
                <p>
                  If you are entering into these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these Terms. If you do not have such authority, or if you do not agree to these Terms, you must not use our services.
                </p>
                <AlertBox type="warning">
                  <strong>Important:</strong> Continued use of any Dort Asia service after changes to these Terms have been published constitutes your acceptance of the revised Terms. We recommend bookmarking this page and reviewing it periodically.
                </AlertBox>
              </Section>

              {/* 2 — Services */}
              <Section id="services" icon={<Server className="w-5 h-5" />} title="Description of Services">
                <p>
                  Dort Asia operates a suite of business software-as-a-service (SaaS) applications designed for companies operating primarily in Singapore and Southeast Asia. Our current live service is:
                </p>
                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-[13px] font-bold text-blue-600">V</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-800 mb-1">Vertex HRMS <span className="ml-2 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-[11px] font-semibold text-green-700">Live</span></p>
                      <p className="text-[14px] text-slate-600 font-medium">
                        A comprehensive Human Resource Management System (HRMS) providing employee management, attendance tracking, payroll processing (including Singapore CPF compliance), project management, finance management, document storage, and organisational chart features.
                      </p>
                    </div>
                  </div>
                </Card>
                <p>
                  Additional products (Tablr, Payd, Vendo, Folio) are under development and will be governed by these Terms or supplemental agreements upon their launch. Dort Asia reserves the right to modify, suspend, or discontinue any service at any time with reasonable notice to active subscribers.
                </p>
                <AlertBox type="info">
                  <strong>Service Availability:</strong> We target 99.5% uptime for Vertex HRMS. Scheduled maintenance windows will be communicated at least 24 hours in advance. Dort Asia is not liable for service interruptions caused by third-party infrastructure providers (e.g., Supabase, Vercel).
                </AlertBox>
              </Section>

              {/* 3 — Eligibility */}
              <Section id="eligibility" icon={<UserCheck className="w-5 h-5" />} title="Eligibility & Registration">
                <p>To register for and use Dort Asia services, you must meet all of the following requirements:</p>
                <ul className="space-y-3 !mt-2">
                  {[
                    "You must be at least 18 years of age or the legal age of majority in your jurisdiction.",
                    "You must be acting as a duly authorised representative of a registered business entity.",
                    "Your use of the service must not violate any applicable law or regulation in Singapore or your country of operation.",
                    "You must provide accurate, complete, and current information during registration and keep it updated at all times.",
                    "You must not have been previously suspended or terminated from any Dort Asia service for violation of these Terms.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50/10">
                      <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[14px] text-slate-600 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  Dort Asia reserves the right to reject any registration application at our sole discretion without providing a reason.
                </p>
              </Section>

              {/* 4 — Account */}
              <Section id="account" icon={<Lock className="w-5 h-5" />} title="Account Responsibilities">
                <p>
                  When you create an account with Dort Asia, you take on certain responsibilities for maintaining the security and integrity of that account:
                </p>
                <div className="space-y-4 !mt-4">
                  {[
                    {
                      title: "Credential Security",
                      desc: "You are solely responsible for safeguarding your login credentials, including your password and any Multi-Factor Authentication (MFA) devices. You must not share your account credentials with any unauthorized person.",
                    },
                    {
                      title: "Super Admin Oversight",
                      desc: "The Super Admin account for your Vertex instance has elevated privileges including payroll configuration and data export. This account must be held by a senior, trusted individual within your organization. Access must be revoked immediately upon that person's departure or role change.",
                    },
                    {
                      title: "Unauthorized Access",
                      desc: "You must notify Dort Asia immediately at enquiry@dortasia.com if you suspect any unauthorized access to your account or any security breach. Dort Asia is not liable for any loss or damage resulting from your failure to comply with this requirement.",
                    },
                    {
                      title: "Accurate Information",
                      desc: "You must ensure all company, employee, and financial information entered into Dort Asia services is accurate, current, and complete. Dort Asia processes data based on what you input and cannot be held responsible for errors resulting from inaccurate data entry.",
                    },
                  ].map((item) => (
                    <Card key={item.title}>
                      <p className="text-[14px] font-bold text-slate-800 mb-1">{item.title}</p>
                      <p className="text-[14px] text-slate-600 font-medium">{item.desc}</p>
                    </Card>
                  ))}
                </div>
              </Section>

              {/* 5 — Subscription */}
              <Section id="subscription" icon={<CreditCard className="w-5 h-5" />} title="Subscription & Payments" badge="Commercial">
                <p>
                  Access to Dort Asia services is provided on a subscription basis. The following terms govern all commercial arrangements:
                </p>
                <div className="space-y-4 !mt-4">
                  {[
                    {
                      title: "Subscription Plans",
                      desc: "Dort Asia offers subscription plans as detailed on our Pricing page. Plans are billed on a monthly or annual basis as selected at the time of purchase. Annual plans are offered at a discounted rate compared to monthly billing.",
                    },
                    {
                      title: "Payment Terms",
                      desc: "All fees are payable in Singapore Dollars (SGD) unless otherwise agreed in writing. Payment is due in advance for each billing period. Dort Asia reserves the right to suspend access to services if payment is not received within 7 days of the due date.",
                    },
                    {
                      title: "Taxes",
                      desc: "All fees are exclusive of applicable taxes. Singapore companies are subject to GST at the prevailing rate. International clients are responsible for any applicable taxes, duties, or levies in their own jurisdiction.",
                    },
                    {
                      title: "Refund Policy",
                      desc: "Monthly subscriptions are non-refundable once a billing period has commenced. Annual subscriptions may be refunded on a pro-rata basis within 30 days of initial purchase, minus a 15% processing fee. After 30 days, annual subscriptions are non-refundable.",
                    },
                    {
                      title: "Price Changes",
                      desc: "Dort Asia reserves the right to modify subscription pricing with 30 days' prior written notice to active subscribers. Continued use of the service after the effective date of a price change constitutes acceptance of the new pricing.",
                    },
                  ].map((item) => (
                    <Card key={item.title}>
                      <p className="text-[14px] font-bold text-slate-800 mb-1">{item.title}</p>
                      <p className="text-[14px] text-slate-600 font-medium">{item.desc}</p>
                    </Card>
                  ))}
                </div>
              </Section>

              {/* 6 — Acceptable Use */}
              <Section id="acceptable-use" icon={<ShieldCheck className="w-5 h-5" />} title="Acceptable Use">
                <p>
                  You agree to use Dort Asia services only for lawful purposes and in accordance with these Terms. You specifically agree <strong className="text-slate-800">not</strong> to:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 !mt-4">
                  {[
                    "Use the service for any fraudulent, illegal, or unauthorized purpose.",
                    "Upload or transmit any malware, viruses, or malicious code.",
                    "Attempt to gain unauthorized access to any part of the service or its infrastructure.",
                    "Reverse engineer, decompile, or attempt to extract the source code of any Dort Asia software.",
                    "Use the service to process data for any third party without their explicit consent.",
                    "Use automated tools, bots, or scrapers to interact with the service without written permission.",
                    "Violate any applicable Singapore law or regulation, including the PDPA and Employment Act.",
                    "Resell, sublicense, or white-label Dort Asia services without an explicit written reseller agreement.",
                    "Interfere with or disrupt the integrity or performance of the service or its underlying infrastructure.",
                    "Engage in any action that imposes an unreasonable or disproportionate load on our servers.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 border border-red-100 bg-red-50/30 rounded-xl p-3.5">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-[13px] text-slate-600 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <AlertBox type="danger">
                  Violation of this Acceptable Use Policy may result in immediate account suspension or termination without refund, and may expose you to civil or criminal liability under Singapore law.
                </AlertBox>
              </Section>

              {/* 7 — IP */}
              <Section id="ip" icon={<FileText className="w-5 h-5" />} title="Intellectual Property">
                <p>
                  All intellectual property rights in and to the Dort Asia services — including but not limited to software code, UI designs, logos, trademarks, databases, and documentation — are and shall remain the exclusive property of Dort Asia Technologies Pte. Ltd.
                </p>
                <div className="space-y-4 !mt-4">
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">License to Use</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Subject to these Terms and timely payment of applicable fees, Dort Asia grants you a limited, non-exclusive, non-transferable, revocable license to access and use the services solely for your internal business operations during the subscription period.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Your Data</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      You retain full ownership of all data you input into Dort Asia services (&quot;Your Data&quot;). By using our services, you grant Dort Asia a limited license to store, process, and transmit Your Data solely for the purpose of delivering the contracted services. We will never claim ownership of Your Data.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Feedback</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Any feedback, suggestions, or ideas you provide to Dort Asia regarding our services may be used by us without restriction or compensation to you. You waive any rights in such feedback to the fullest extent permitted by law.
                    </p>
                  </Card>
                </div>
              </Section>

              {/* 8 — Data */}
              <Section id="data" icon={<Lock className="w-5 h-5" />} title="Data & Privacy">
                <p>
                  Your use of Dort Asia services is also governed by our <Link href="/privacy" className="text-blue-600 hover:text-blue-500 font-semibold underline underline-offset-2 transition-colors">Privacy Policy</Link>, which is incorporated into these Terms by reference. By accepting these Terms, you acknowledge and agree to our data practices as described in the Privacy Policy.
                </p>
                <div className="space-y-4 !mt-4">
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Data Processing Agreement</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      For the purposes of the Singapore Personal Data Protection Act 2012 (PDPA), you are the <strong className="text-slate-700">Data Controller</strong> and Dort Asia acts as a <strong className="text-slate-700">Data Processor</strong> when processing personal data of your employees on your behalf. You are responsible for ensuring that any personal data you upload has been collected with valid consent and in accordance with the PDPA.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Data Export & Portability</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      You may request an export of Your Data at any time during an active subscription. Data exports are provided in CSV or JSON format and will be delivered within 14 business days of a valid written request to enquiry@dortasia.com. Upon account termination, Your Data will be retained for 30 days before permanent deletion, after which it cannot be recovered.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Compliance Obligation</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      While Dort Asia provides tools to assist with Singapore statutory compliance (CPF, MOM, IRAS), it is your sole responsibility as the employer to ensure that your company&apos;s payroll and employment practices are fully compliant with all applicable Singapore laws and regulations. Dort Asia does not provide legal or accounting advice.
                    </p>
                  </Card>
                </div>
              </Section>

              {/* 9 — Warranties */}
              <Section id="warranties" icon={<AlertTriangle className="w-5 h-5" />} title="Disclaimers & Warranties">
                <AlertBox type="warning">
                  <strong>As-Is Service:</strong> Dort Asia services are provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without any warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
                </AlertBox>
                <p>
                  Dort Asia does not warrant that:
                </p>
                <ul className="space-y-2 !mt-2">
                  {[
                    "The service will be uninterrupted, error-free, or completely secure.",
                    "Any specific feature will remain available in future versions.",
                    "The service will meet all of your specific business requirements.",
                    "Calculations produced by the system (including CPF, levy, or payroll figures) are legally definitive. Always verify outputs with a qualified accountant or HR professional.",
                    "Data exported from the system will be admissible as legal evidence without independent verification.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] font-medium text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p>
                  To the maximum extent permitted by Singapore law, Dort Asia expressly disclaims all warranties, express or implied, with respect to our services.
                </p>
              </Section>

              {/* 10 — Liability */}
              <Section id="liability" icon={<Scale className="w-5 h-5" />} title="Limitation of Liability" badge="Important">
                <AlertBox type="danger">
                  <strong>Read carefully:</strong> This section limits Dort Asia&apos;s financial liability to you. If you do not agree to these limitations, you must not use our services.
                </AlertBox>
                <p>
                  To the maximum extent permitted by applicable Singapore law, in no event shall Dort Asia Technologies Pte. Ltd., its directors, employees, contractors, or affiliates be liable for:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 !mt-4">
                  {[
                    "Any indirect, incidental, special, or consequential damages.",
                    "Loss of profits, revenue, data, business, or goodwill.",
                    "Statutory fines or penalties resulting from non-compliance with MOM, IRAS, or CPF regulations.",
                    "Errors in payroll, levy, or statutory contribution calculations arising from inaccurate data input.",
                    "Unauthorized access to your data by a third party unless caused solely by Dort Asia's negligence.",
                    "Loss of data following account termination if data export was not requested within the 30-day window.",
                    "Business interruption resulting from service downtime or maintenance.",
                    "Any actions taken by your employees or administrators within the platform.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 border border-slate-200 bg-slate-50/30 rounded-xl p-3.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-[13px] text-slate-600 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <p>
                  In all cases where Dort Asia is found to be liable, our maximum aggregate liability to you shall not exceed the <strong className="text-slate-800">total fees paid by you to Dort Asia in the three (3) months immediately preceding the event giving rise to the claim</strong>.
                </p>
              </Section>

              {/* 11 — Termination */}
              <Section id="termination" icon={<XCircle className="w-5 h-5" />} title="Termination">
                <p>
                  Either party may terminate the service agreement in accordance with the following terms:
                </p>
                <div className="space-y-4 !mt-4">
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Termination by You</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      You may cancel your subscription at any time by providing written notice to enquiry@dortasia.com. Monthly subscriptions will continue until the end of the current billing period. Annual subscriptions are subject to the refund policy detailed in Section 5. Upon termination, your access to the service will be revoked at the end of the paid period.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Termination by Dort Asia (For Cause)</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Dort Asia may terminate your account immediately and without notice if you: (a) materially breach these Terms and fail to cure such breach within 7 days of written notice; (b) engage in fraudulent or illegal activity; (c) fail to make payment within 14 days of the due date; or (d) use the service in a manner that poses a risk to Dort Asia&apos;s infrastructure, other clients, or reputation.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Termination by Dort Asia (Convenience)</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Dort Asia may terminate or discontinue any service with 60 days&apos; written notice. In such cases, you will be entitled to a pro-rata refund of any prepaid subscription fees for the period after the termination date.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Effect of Termination</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      Upon termination: your license to use the service ends immediately; your data will be retained for 30 days during which you may request an export; after 30 days, all your data will be permanently and irreversibly deleted from our systems. Sections relating to intellectual property, liability, and governing law shall survive termination.
                    </p>
                  </Card>
                </div>
              </Section>

              {/* 12 — Governing Law */}
              <Section id="governing-law" icon={<Gavel className="w-5 h-5" />} title="Governing Law & Dispute Resolution">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the <strong className="text-slate-800">Republic of Singapore</strong>, without regard to its conflict of law principles.
                </p>
                <div className="space-y-4 !mt-4">
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Negotiation First</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      In the event of any dispute, controversy, or claim arising out of or in connection with these Terms, both parties agree to first attempt to resolve the matter through good-faith negotiation for a period of not less than 30 days from the date of written notice of the dispute.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Mediation</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      If the dispute cannot be resolved through negotiation, either party may refer the matter to mediation administered by the Singapore Mediation Centre (SMC) in accordance with its mediation rules in force at the time of the referral.
                    </p>
                  </Card>
                  <Card>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">Courts</p>
                    <p className="text-[14px] text-slate-600 font-medium">
                      If mediation fails or is not pursued, both parties irrevocably submit to the exclusive jurisdiction of the courts of Singapore to settle any dispute or claim arising out of or in connection with these Terms.
                    </p>
                  </Card>
                </div>
                <AlertBox type="info">
                  Nothing in this clause prevents Dort Asia from seeking injunctive or other equitable relief in any court of competent jurisdiction to protect its intellectual property rights or confidential information.
                </AlertBox>
              </Section>

              {/* 13 — Changes */}
              <Section id="changes" icon={<RefreshCw className="w-5 h-5" />} title="Changes to These Terms">
                <p>
                  Dort Asia reserves the right to modify these Terms at any time. When we make changes, we will:
                </p>
                <ul className="space-y-2 !mt-4">
                  {[
                    "Update the Effective Date at the top of this page.",
                    "Send email notification to the registered account holder at least 14 days before material changes take effect.",
                    "Display a prominent in-app banner in Vertex HRMS for at least 14 days following the update.",
                    "For material changes that significantly affect your rights, obtain your explicit re-acceptance before the changes apply to you.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] font-medium text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p>
                  If you do not agree to the revised Terms, you must stop using our services before the effective date of the change and notify us to arrange account closure and, where applicable, a pro-rata refund.
                </p>
              </Section>

              {/* 14 — Contact */}
              <Section id="contact" icon={<Mail className="w-5 h-5" />} title="Contact Us">
                <p>
                  For any questions, concerns, or notices relating to these Terms of Service, please contact us:
                </p>
                <div className="mt-6 max-w-md">
                  <a href="mailto:enquiry@dortasia.com" className="block border border-slate-200 hover:border-blue-300 rounded-xl p-5 bg-slate-50/30 hover:bg-blue-50/30 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <p className="text-[14px] font-bold text-slate-800">General Enquiries</p>
                    </div>
                    <p className="text-[13px] text-blue-600 group-hover:text-blue-500 transition-colors font-semibold">enquiry@dortasia.com</p>
                    <p className="text-[12px] text-slate-500 mt-1 font-medium">For all support, billing, and Terms-related questions</p>
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
                <div className="flex flex-wrap gap-4 !mt-6 text-[13px] font-medium">
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  <span className="text-slate-300">·</span>
                  <Link href="/terms" className="text-slate-400 font-semibold">
                    Terms of Service (current)
                  </Link>
                </div>
              </Section>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-8 text-center">
                <p className="text-[13px] text-slate-400 font-medium">
                  © {new Date().getFullYear()} Dort Asia Technologies Pte. Ltd. · Terms of Service · Effective 5 July 2026
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
