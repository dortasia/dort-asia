"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  Share2,
  Check,
  Printer,
  ChevronRight,
  ArrowUp,
  ArrowRight,
  Shield,
  Scale
} from 'lucide-react';

type ContentItem =
  | { type: 'paragraph'; text: string }
  | { type: 'definitions'; items: { term: string; desc: string }[] }
  | { type: 'list'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'subheading'; title: string }
  | { type: 'callout'; title: string; text: string }
  | { type: 'flowchart'; steps: string[] }
  | { type: 'contactCard'; company: string; location: string; email: string; website: string };

interface Section {
  id: string;
  number: string;
  title: string;
  category: string;
  content: ContentItem[];
}

const privacySections: Section[] = [
  {
    "id": "preamble",
    "number": "0",
    "title": "PREAMBLE & SCOPE",
    "category": "General",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia Pte. Ltd. (“DORT Asia”, “we”, “us”, or “our”) operates Xentra, a cloud-based Human Resource Management System (“Xentra” or the “Service”)."
      },
      {
        "type": "paragraph",
        "text": "This Privacy Policy explains how we collect, use, disclose, store, protect and otherwise process personal data in connection with the Xentra website, web application, mobile application, customer accounts, employee management features, customer support, and related services provided by DORT Asia."
      },
      {
        "type": "paragraph",
        "text": "By using Xentra or providing personal data to us, you acknowledge that your personal data may be processed in accordance with this Privacy Policy and applicable law."
      },
      {
        "type": "callout",
        "title": "Data Controller vs Data Processor Role",
        "text": "For business customers using Xentra to manage their employees, contractors or workforce members, DORT Asia generally processes workforce personal data on behalf of the customer (Data Processor). The customer determines the purposes and means of processing. For personal data relating to direct account holders, billing contacts, and website visitors, DORT Asia acts in its own capacity (Data Controller)."
      }
    ]
  },
  {
    "id": "about-xentra",
    "number": "1",
    "title": "1. ABOUT XENTRA",
    "category": "Overview",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra is designed to help businesses manage employee information, lifecycle records, attendance, leave, payroll workflows, documents, work-pass records, workforce administration, employee self-service, reporting, and compliance workflows."
      },
      {
        "type": "paragraph",
        "text": "Xentra is designed around a central employee record. Other workforce modules use this information to provide connected operations."
      },
      {
        "type": "callout",
        "title": "No Continuous Monitoring",
        "text": "Xentra is NOT designed to continuously monitor, surveil, or background-track employees."
      }
    ]
  },
  {
    "id": "who-this-applies-to",
    "number": "2",
    "title": "2. WHO THIS PRIVACY POLICY APPLIES TO",
    "category": "Overview",
    "content": [
      {
        "type": "paragraph",
        "text": "This Privacy Policy applies to:"
      },
      {
        "type": "numbered",
        "items": [
          "Visitors to the Xentra website;",
          "Customers and prospective customers;",
          "Authorised users of Xentra;",
          "Administrators, HR personnel, managers and employees using Xentra;",
          "Individuals whose information is entered into Xentra by a customer;",
          "Individuals who communicate with DORT Asia;",
          "Billing and account contacts; and",
          "Other individuals whose personal data is processed in connection with Xentra."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where a customer uses Xentra to process workforce data, the customer is responsible for providing appropriate privacy notices to their employees and workforce members."
      }
    ]
  },
  {
    "id": "types-of-personal-data",
    "number": "3",
    "title": "3. TYPES OF PERSONAL DATA WE MAY PROCESS",
    "category": "Data Collection",
    "content": [
      {
        "type": "paragraph",
        "text": "The personal data processed through Xentra depends on the features used by the customer and the information provided."
      },
      {
        "type": "subheading",
        "title": "3.1 Account and User Information"
      },
      {
        "type": "list",
        "items": [
          "Name, email address, phone number, username or account identifier;",
          "Authentication information, user role, company or organisation;",
          "Account status, login and security audit information."
        ]
      },
      {
        "type": "subheading",
        "title": "3.2 Employee and Workforce Information"
      },
      {
        "type": "list",
        "items": [
          "Employee name, employee ID, contact details, date of birth, nationality, identification information, residential address;",
          "Employment type, status, joining date, probation, confirmation, department, designation, team, reporting manager;",
          "Work-pass information, education and qualifications, emergency contacts, employee documents;",
          "Bank and payment details, compensation information, salary history, attendance records, leave records, payroll information, claims or expenses, and assigned company assets."
        ]
      },
      {
        "type": "subheading",
        "title": "3.3 Attendance and Location Information"
      },
      {
        "type": "callout",
        "title": "Location Verification Policy",
        "text": "Where a customer enables location verification for attendance, Xentra collects location data ONLY when an employee performs a location-enabled attendance check-in or check-out. Xentra does NOT continuously track employee location. Minimum location data is captured solely to validate geofence and attendance rules."
      },
      {
        "type": "subheading",
        "title": "3.4 Payroll and Financial Information"
      },
      {
        "type": "list",
        "items": [
          "Salary information, allowances, deductions, compensation history;",
          "Bank account numbers, payroll records, CPF-related information, SDL contributions, IRAS tax reporting records, and payslip data."
        ]
      },
      {
        "type": "subheading",
        "title": "3.5 Documents"
      },
      {
        "type": "paragraph",
        "text": "Customers may upload employment contracts, offer letters, identity documents, passports, work passes, education certificates, salary letters, medical certificates, and related HR files."
      },
      {
        "type": "subheading",
        "title": "3.6 Technical and Usage Information"
      },
      {
        "type": "list",
        "items": [
          "IP address, browser type, device information, operating system;",
          "Authentication events, security logs, timestamps, error records, and service usage telemetry."
        ]
      }
    ]
  },
  {
    "id": "how-we-collect-data",
    "number": "4",
    "title": "4. HOW WE COLLECT PERSONAL DATA",
    "category": "Data Collection",
    "content": [
      {
        "type": "paragraph",
        "text": "Personal data is collected through account registration, onboarding, employee imports, employee self-service check-in/out, leave applications, payroll workflows, document uploads, support requests, mobile app interactions, integrations, and automated security audit systems."
      }
    ]
  },
  {
    "id": "why-we-use-data",
    "number": "5",
    "title": "5. WHY WE USE PERSONAL DATA",
    "category": "Purpose & Use",
    "content": [
      {
        "type": "subheading",
        "title": "5.1 Providing Xentra Services"
      },
      {
        "type": "paragraph",
        "text": "To administer accounts, maintain employee records, process attendance and leave, compute payroll workflows, generate payslips, provide reporting, store documents, and run customer-configured workforce automations."
      },
      {
        "type": "subheading",
        "title": "5.2 Authentication and Security"
      },
      {
        "type": "paragraph",
        "text": "To authenticate users, protect accounts, detect suspicious activities, prevent unauthorized access, investigate incidents, and maintain tamper-evident audit trails."
      },
      {
        "type": "subheading",
        "title": "5.3 Transactional Communications"
      },
      {
        "type": "paragraph",
        "text": "To send verification emails, authentication messages, password resets, plan expiry alerts, billing invoices, and security notifications."
      },
      {
        "type": "subheading",
        "title": "5.4 Customer Support & Billing"
      },
      {
        "type": "paragraph",
        "text": "To respond to technical enquiries, process subscription payments, manage renewals, and handle billing administration."
      }
    ]
  },
  {
    "id": "workforce-data-b2b",
    "number": "6",
    "title": "6. EMPLOYEE AND WORKFORCE DATA (B2B CONTEXT)",
    "category": "Workforce Data",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra is primarily a business-to-business (B2B) HRMS. When a customer uses Xentra to process workforce data:"
      },
      {
        "type": "list",
        "items": [
          "The customer determines the purpose and lawful basis for collecting employee information;",
          "The customer is responsible for providing appropriate privacy notices under the Singapore PDPA;",
          "Xentra processes the information strictly to provide the subscribed software services;",
          "Access is strictly partitioned by customer tenant boundaries and role-based permissions."
        ]
      }
    ]
  },
  {
    "id": "location-data-gps",
    "number": "7",
    "title": "7. LOCATION DATA AND GPS ATTENDANCE",
    "category": "Workforce Data",
    "content": [
      {
        "type": "paragraph",
        "text": "When GPS attendance is configured by a customer: the mobile app captures the device location exclusively at the exact moment of check-in or check-out to validate customer geofence boundaries."
      },
      {
        "type": "callout",
        "title": "Zero Background Location Tracking",
        "text": "Location is NEVER collected in the background or when the app is idle. Location capture occurs only during explicit user-initiated check-in/out actions."
      }
    ]
  },
  {
    "id": "cookies-and-tracking",
    "number": "8",
    "title": "8. COOKIES AND SIMILAR TECHNOLOGIES",
    "category": "Technology",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra uses essential cookies and local session storage necessary for authentication, session persistence, security, and preference preservation."
      },
      {
        "type": "paragraph",
        "text": "The Xentra HRMS application does not employ employee-level advertising or third-party behavioural ad tracking. On the public marketing website, privacy-preserving web analytics (e.g. Google Analytics) may be enabled."
      }
    ]
  },
  {
    "id": "third-party-processors",
    "number": "9",
    "title": "9. THIRD-PARTY SERVICES AND DATA PROCESSORS",
    "category": "Infrastructure",
    "content": [
      {
        "type": "paragraph",
        "text": "We partner with trusted infrastructure and service providers to operate Xentra:"
      },
      {
        "type": "subheading",
        "title": "9.1 Supabase (Database & Storage)"
      },
      {
        "type": "paragraph",
        "text": "Provides PostgreSQL database hosting, file storage, authentication, and backend infrastructure. Xentra’s production environment is hosted in the Singapore AWS region (ap-southeast-1)."
      },
      {
        "type": "subheading",
        "title": "9.2 Stripe (Payment Processing)"
      },
      {
        "type": "paragraph",
        "text": "Handles subscription billing and payment processing. Credit card details are securely vaulted directly by Stripe and never stored on DORT Asia servers."
      },
      {
        "type": "subheading",
        "title": "9.3 Brevo (Transactional Email)"
      },
      {
        "type": "paragraph",
        "text": "Delivers authentication emails, password resets, verification codes, and service notices."
      },
      {
        "type": "subheading",
        "title": "9.4 Firebase Cloud Messaging (FCM)"
      },
      {
        "type": "paragraph",
        "text": "Delivers push notifications to mobile devices."
      },
      {
        "type": "subheading",
        "title": "9.5 WhatsApp"
      },
      {
        "type": "paragraph",
        "text": "Sends service alerts such as plan expiry and subscription renewal reminders."
      }
    ]
  },
  {
    "id": "third-party-integrations",
    "number": "10",
    "title": "10. THIRD-PARTY INTEGRATIONS",
    "category": "Infrastructure",
    "content": [
      {
        "type": "paragraph",
        "text": "Where customers enable third-party software integrations, data is exchanged strictly according to configured permissions. Customers are responsible for reviewing third-party terms and privacy policies."
      }
    ]
  },
  {
    "id": "how-we-protect-data",
    "number": "11",
    "title": "11. HOW WE PROTECT PERSONAL DATA",
    "category": "Security",
    "content": [
      {
        "type": "paragraph",
        "text": "We enforce rigorous technical and organizational security controls designed to safeguard personal data:"
      },
      {
        "type": "list",
        "items": [
          "Multi-factor authentication & role-based access control (RBAC);",
          "Row Level Security (RLS) and database tenant logical isolation;",
          "Encryption in transit (TLS 1.3) and encryption at rest (AES-256);",
          "Least-privilege access enforcement and automated audit logging;",
          "Regular automated backups and disaster recovery verification;",
          "Server-side validation for all external API events and webhook signatures."
        ]
      }
    ]
  },
  {
    "id": "multi-tenant-isolation",
    "number": "12",
    "title": "12. MULTI-TENANT DATA ISOLATION",
    "category": "Security",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra enforces strict multi-tenant data partitioning at both the application and database levels. A user from one customer organisation cannot access or query another customer’s data."
      }
    ]
  },
  {
    "id": "data-retention",
    "number": "13",
    "title": "13. DATA RETENTION",
    "category": "Data Lifecycle",
    "content": [
      {
        "type": "subheading",
        "title": "13.1 Customer Workforce Data"
      },
      {
        "type": "paragraph",
        "text": "Data remains accessible throughout the active subscription. Following cancellation, data is retained for a reasonable transitional window to facilitate customer export, compliance, and continuity before secure deletion."
      },
      {
        "type": "subheading",
        "title": "13.2 GPS Attendance Data"
      },
      {
        "type": "paragraph",
        "text": "Location coordinates are retained only as long as necessary for attendance dispute resolution, statutory payroll audits, and operational records."
      },
      {
        "type": "subheading",
        "title": "13.3 Account Deletion (7-Day Workflow)"
      },
      {
        "type": "callout",
        "title": "7-Day Deletion Commitment",
        "text": "Upon receiving a verified account deletion request from a customer administrator, DORT Asia will initiate and complete the deletion workflow within seven (7) days, subject to mandatory statutory tax and accounting retention requirements."
      }
    ]
  },
  {
    "id": "data-export",
    "number": "14",
    "title": "14. DATA EXPORT",
    "category": "Data Lifecycle",
    "content": [
      {
        "type": "paragraph",
        "text": "Customers can export their workforce data, employee records, attendance logs, and payroll summaries during their subscription or transitional retrieval period prior to account closure."
      }
    ]
  },
  {
    "id": "international-transfers",
    "number": "15",
    "title": "15. INTERNATIONAL DATA TRANSFERS",
    "category": "Compliance",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra’s primary production database and storage environment is located in Singapore (AWS ap-southeast-1). Where auxiliary third-party processors handle transactional data globally, DORT Asia ensures comparable protections in alignment with the Singapore Personal Data Protection Act (PDPA)."
      }
    ]
  },
  {
    "id": "access-and-correction",
    "number": "16",
    "title": "16. ACCESS AND CORRECTION REQUESTS",
    "category": "User Rights",
    "content": [
      {
        "type": "paragraph",
        "text": "Individuals may request access to or correction of personal data held by DORT Asia. For workforce records controlled by an employer customer, individuals should submit requests directly to their employer organisation."
      }
    ]
  },
  {
    "id": "withdrawal-of-consent",
    "number": "17",
    "title": "17. WITHDRAWAL OF CONSENT",
    "category": "User Rights",
    "content": [
      {
        "type": "paragraph",
        "text": "Where processing relies on consent, individuals may withdraw consent at any time. Withdrawal does not affect lawful processing conducted prior to withdrawal, nor does it override statutory obligations."
      }
    ]
  },
  {
    "id": "accuracy-of-data",
    "number": "18",
    "title": "18. ACCURACY OF PERSONAL DATA",
    "category": "User Rights",
    "content": [
      {
        "type": "paragraph",
        "text": "We rely on customers and users to provide accurate and up-to-date workforce records. Authorised users can update and verify their information through Xentra self-service portals."
      }
    ]
  },
  {
    "id": "childrens-data",
    "number": "19",
    "title": "19. CHILDREN’S DATA",
    "category": "Compliance",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra is an enterprise workforce management system and is not directed at children. Customers must not submit children’s personal data unless lawful under applicable employment regulations."
      }
    ]
  },
  {
    "id": "marketing-communications",
    "number": "20",
    "title": "20. MARKETING COMMUNICATIONS",
    "category": "Communications",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra communications are strictly transactional and operational (e.g. security alerts, invoices, verification codes). Optional marketing updates can be unsubscribed from at any time."
      }
    ]
  },
  {
    "id": "customer-responsibilities",
    "number": "21",
    "title": "21. EMPLOYEE PRIVACY & CUSTOMER RESPONSIBILITIES",
    "category": "Compliance",
    "content": [
      {
        "type": "paragraph",
        "text": "Customer organisations remain responsible for obtaining required employee consent, issuing privacy notices, configuring role permissions appropriately, and complying with the Employment Act and Singapore PDPA."
      }
    ]
  },
  {
    "id": "data-breach-response",
    "number": "22",
    "title": "22. DATA BREACH AND SECURITY INCIDENTS",
    "category": "Security",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia maintains an incident response protocol to contain, investigate, and remediate security events. Affected customer administrators and regulatory bodies will be notified in compliance with statutory requirements."
      }
    ]
  },
  {
    "id": "changes-to-policy",
    "number": "23",
    "title": "23. CHANGES TO THIS PRIVACY POLICY",
    "category": "General",
    "content": [
      {
        "type": "paragraph",
        "text": "We may update this Privacy Policy as new features, integrations, or regulatory standards evolve. Updated versions will be published with a revised “Last Updated” date."
      }
    ]
  },
  {
    "id": "relationship-terms",
    "number": "24",
    "title": "24. RELATIONSHIP WITH TERMS AND CONDITIONS",
    "category": "General",
    "content": [
      {
        "type": "paragraph",
        "text": "This Privacy Policy should be read in conjunction with the Xentra Terms and Conditions and any applicable Data Processing Addendum (DPA)."
      }
    ]
  },
  {
    "id": "no-professional-advice",
    "number": "25",
    "title": "25. NO LEGAL, TAX OR EMPLOYMENT ADVICE",
    "category": "Legal Disclaimer",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra provides software tools and automation workflows. Nothing provided through Xentra constitutes legal, tax, accounting, or employment advisory services."
      }
    ]
  },
  {
    "id": "contact-us",
    "number": "26",
    "title": "26. CONTACT US & DATA PROTECTION OFFICER",
    "category": "General",
    "content": [
      {
        "type": "paragraph",
        "text": "For questions regarding this Privacy Policy or data protection inquiries, contact:"
      },
      {
        "type": "contactCard",
        "company": "DORT Asia Pte. Ltd.",
        "location": "18 Kaki Bukit Road 3, #03-09 Entrepreneur Business Centre, Singapore 415978",
        "email": "enquiry@dortasia.com",
        "website": "https://xentra.dortasia.com"
      }
    ]
  },
  {
    "id": "key-practices-summary",
    "number": "27",
    "title": "27. SUMMARY OF KEY PRIVACY PRACTICES",
    "category": "Summary",
    "content": [
      {
        "type": "list",
        "items": [
          "Xentra is a B2B HRMS; customer organisation controls workforce data.",
          "Zero background location tracking; GPS recorded only at check-in/out.",
          "Primary database & storage hosted in Singapore AWS (ap-southeast-1).",
          "Stripe processes all payments securely; card credentials never stored on DORT Asia servers.",
          "Brevo handles transactional email; FCM delivers push alerts.",
          "Verified account deletion requests processed within 7 business days.",
          "Full support for data export prior to account closure."
        ]
      }
    ]
  }
];

export default function PrivacyPolicyPage() {
  const [activeSectionId, setActiveSectionId] = useState('preamble');
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentProgress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(currentProgress);
      setShowBackToTop(window.scrollY > 400);

      const sectionElements = privacySections.map(sec => document.getElementById(sec.id)).filter(Boolean);
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSectionId(privacySections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navbar with Dark Theme */}
      <Navbar theme="dark" />

      {/* HERO BANNER - MIDNIGHT BLACK & DEEP BLUE */}
      <header className="relative bg-[#050811] overflow-hidden pt-36 pb-16 sm:pt-40 sm:pb-20 text-white">
        
        {/* Ambient Radial Glows */}
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute -right-24 -top-24 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-transparent blur-3xl" />
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-transparent blur-2xl" />
          <div className="absolute -left-20 bottom-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-slate-900 via-blue-950/40 to-transparent blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-blue-600 text-white shadow-xs">
                <Shield className="w-3.5 h-3.5" />
                Privacy & Data Protection
              </span>
              <span className="text-slate-400 text-xs font-medium">
                Effective: 17 August 2026
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Privacy Policy
            </h1>
          </div>

          {/* Right Action: Share & Print */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center print:hidden">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 px-4 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-900" />}
              <span>{copied ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              aria-label="Print Document"
              className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg border border-white/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BLUE ACCENT SEPARATOR LINE */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-sky-400 to-blue-600" />

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-grow bg-white py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        
        {/* 2-COLUMN LAYOUT: QUICK NAV ON LEFT + CLAUSES ON RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* LEFT COLUMN: STICKY SECTION NAV (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto minimal-scrollbar pr-2 print:hidden">
            <div className="bg-[#f8fafc] rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Sections ({privacySections.length})
                </h4>
                <span className="text-[11px] font-medium text-slate-400">
                  Quick Jump
                </span>
              </div>

              <nav className="space-y-0.5 text-xs">
                {privacySections.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(sec.id);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth' });
                          setActiveSectionId(sec.id);
                        }
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate pr-2">{sec.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:translate-x-0.5'}`} />
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* RIGHT COLUMN: PRIVACY CLAUSES */}
          <div className="lg:col-span-8 space-y-12">
            {privacySections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="scroll-mt-28 transition-all border-b border-slate-200 pb-10 last:border-b-0"
              >
                {/* Modern Bold Heading */}
                <div className="mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-slate-900 mb-1">
                    {sec.title}
                  </h2>
                </div>

                {/* Section Content */}
                <div className="space-y-3.5 text-slate-700 text-sm sm:text-[15px] leading-relaxed">
                  {sec.content.map((item, index) => {
                    switch (item.type) {
                      case 'paragraph':
                        return <p key={index}>{item.text}</p>;

                      case 'definitions':
                        return (
                          <div key={index} className="grid grid-cols-1 gap-2.5 my-4">
                            {item.items.map((def, dIdx) => (
                              <div key={dIdx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                                <span className="font-bold text-slate-900">{def.term} </span>
                                <span className="text-slate-700">{def.desc}</span>
                              </div>
                            ))}
                          </div>
                        );

                      case 'list':
                        return (
                          <ul key={index} className="space-y-1.5 my-3 pl-2">
                            {item.items.map((li, lIdx) => (
                              <li key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-[15px] text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                                <span>{li}</span>
                              </li>
                            ))}
                          </ul>
                        );

                      case 'numbered':
                        return (
                          <ol key={index} className="space-y-1.5 my-3 pl-2">
                            {item.items.map((li, lIdx) => (
                              <li key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-[15px] text-slate-700">
                                <span className="font-mono font-bold text-xs text-blue-600 mt-1 shrink-0">{lIdx + 1}.</span>
                                <span>{li}</span>
                              </li>
                            ))}
                          </ol>
                        );

                      case 'subheading':
                        return (
                          <h3 key={index} className="text-sm font-bold uppercase tracking-wider text-slate-900 mt-5 mb-1.5">
                            {item.title}
                          </h3>
                        );

                      case 'callout':
                        return (
                          <div key={index} className="my-4 p-4 rounded-xl bg-slate-900 text-white shadow-xs">
                            <h4 className="text-xs uppercase font-bold tracking-wider text-sky-400 mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                              {item.text}
                            </p>
                          </div>
                        );

                      case 'flowchart':
                        return (
                          <div key={index} className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-900 mb-2.5">
                              Process Flow
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                              {item.steps.map((step, sIdx) => (
                                <React.Fragment key={sIdx}>
                                  <span className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-800 shadow-2xs">
                                    {step}
                                  </span>
                                  {sIdx < item.steps.length - 1 && (
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );

                      case 'contactCard':
                        return (
                          <div key={index} className="my-4 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{item.company}</h4>
                              <p className="text-xs text-slate-500">{item.location}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <a
                                href={`mailto:${item.email}`}
                                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
                              >
                                Email: {item.email}
                              </a>
                              <a
                                href={item.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                              >
                                Website
                              </a>
                            </div>
                          </div>
                        );

                      default:
                        return null;
                    }
                  })}
                </div>
              </section>
            ))}

            {/* STATUTORY JURISDICTION BANNER */}
            <div className="bg-slate-950 text-white rounded-2xl p-8 sm:p-10 shadow-md border border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <Scale className="w-6 h-6 text-sky-400" />
                <h3 className="text-xl font-bold text-white">Singapore PDPA Compliance Statement</h3>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                DORT Asia Pte. Ltd. processes personal data in accordance with the Singapore Personal Data Protection Act (PDPA 2012) and applicable international data protection standards.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                <span>© 2026 DORT Asia Pte. Ltd. All rights reserved.</span>
                <span>Singapore 415978</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 z-40 p-3.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center print:hidden group cursor-pointer border border-slate-700"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      <Footer />
    </div>
  );
}
