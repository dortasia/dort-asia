export interface MarketplaceFeature {
  id: string;
  title: string;
  description: string;
  tag?: string;
}

export interface MarketplaceModule {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
}

export interface MarketplaceScreenshot {
  id: string;
  title: string;
  image: string;
  caption?: string;
}

export interface MarketplacePricingPlan {
  id: string;
  planCode?: string;
  name: string;
  description: string;
  price: number;
  billingInterval: string;
  currency: string;
  popular?: boolean;
  features: string[];
  ctaText: string;
  ctaRoute: string;
}

export interface MarketplaceBenefit {
  title: string;
  description: string;
}

export interface MarketplaceApp {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: string;
  iconBackground?: string;
  heroImage: string;
  category: string;
  platform: string;
  rating: {
    score: number;
    count: number;
  };
  status: "available" | "coming_soon";
  badge?: string;
  version?: string;
  developer: string;
  lastUpdated: string;
  route: string;
  highlights: Array<{ label: string; value: string }>;
  features: MarketplaceFeature[];
  modules: MarketplaceModule[];
  screenshots: MarketplaceScreenshot[];
  benefits: MarketplaceBenefit[];
  pricingPlans: MarketplacePricingPlan[];
  sortOrder: number;
  matrixData?: any;
}

export const marketplaceApps: MarketplaceApp[] = [
  {
    id: "xentra-people",
    slug: "xentra-people",
    name: "Xentra People",
    tagline: "Employee Tracking, Attendance, Timesheet & Payroll",
    description: "A complete employee management platform designed to simplify workforce operations, attendance, leave, timesheets and payroll from one centralized system.",
    longDescription: "Xentra People is Dort Asia's flagship workforce operations platform built for modern, growing enterprises. It eliminates fragmented HR spreadsheets and disconnected tools by unifying core HR, smart attendance tracking, dynamic shift management, timesheet approvals, and compliant payroll processing into an intuitive, high-performance web and mobile workspace.",
    icon: "/apps-logo/xentra-bluelogo.svg",
    iconBackground: "bg-white",
    heroImage: "/Xentra_people/banner/app-banenr.avif",
    category: "HR & Workforce",
    platform: "Web + Mobile",
    rating: {
      score: 4.9,
      count: 128,
    },
    status: "available",
    badge: "Beta",
    version: "v2.4.0",
    developer: "Dort Asia Technologies",
    lastUpdated: "August 2026",
    route: "/dashboard/marketplace/xentra-people",
    sortOrder: 1,
    highlights: [
      { label: "Category", value: "HR & Workforce" },
      { label: "Platform", value: "Web & Mobile App" },
      { label: "Rating", value: "4.9 ★ (128 reviews)" },
      { label: "Availability", value: "Available (Beta)" },
      { label: "Deployment", value: "Cloud Hosted (Singapore)" },
    ],
    features: [
      {
        id: "feat-employee-mgmt",
        title: "Employee Directory & Profiles",
        description: "Centralize employee personal records, emergency contacts, job histories, department structures, and digital documents in one secure repository.",
        tag: "Core HR",
      },
      {
        id: "feat-attendance",
        title: "Smart Attendance Tracking",
        description: "Seamless check-in/check-out with geolocation fencing, QR verification, real-time presence dashboards, and biometric integration support.",
        tag: "Attendance",
      },
      {
        id: "feat-leave",
        title: "Leave & Absence Management",
        description: "Automated leave policy configuration, customizable approval workflows, real-time entitlement balances, and team leave calendar sync.",
        tag: "Leave",
      },
      {
        id: "feat-timesheets",
        title: "Timesheets & Shift Rostering",
        description: "Log billable project hours, schedule rotational team shifts, track overtime automatically, and route timesheets for manager sign-offs.",
        tag: "Operations",
      },
      {
        id: "feat-payroll",
        title: "Compliant Payroll Engine",
        description: "Automated calculation of gross-to-net salaries, statutory contributions, overtime allowances, itemized payslips, and direct bank GIRO batch exports.",
        tag: "Payroll",
      },
      {
        id: "feat-analytics",
        title: "Workforce Analytics & Reporting",
        description: "Instant visualization of headcount growth, turnover rates, overtime expenditure, attendance anomalies, and exportable audit logs.",
        tag: "Analytics",
      },
    ],
    modules: [
      {
        id: "mod-workforce",
        title: "Core Workforce & Onboarding",
        description: "Manage organizational hierarchy, employee life-cycle transitions, digital signature document compliance, and self-service employee portals.",
        capabilities: [
          "Self-service employee profile updates",
          "Document upload & digital acknowledgement",
          "Organizational chart & reporting line visualization",
          "Custom custom fields and emergency contacts",
        ],
      },
      {
        id: "mod-time-attendance",
        title: "Time, Attendance & Geofencing",
        description: "Capture accurate work hours across office, remote, and field employees with automated break tracking and attendance anomaly alerts.",
        capabilities: [
          "GPS geofenced mobile check-in",
          "Flexible multi-shift roster planning",
          "Automated late arrival and early departure flags",
          "Instant export to payroll calculation engine",
        ],
      },
      {
        id: "mod-payroll-statutory",
        title: "Payroll & Statutory Compliance",
        description: "Generate compliant payroll with zero manual math. Automatically factor in unpaid leaves, approved overtime, and deduction schedules.",
        capabilities: [
          "One-click multi-tier payslip generation",
          "Direct bank batch file (FAST/GIRO) creation",
          "Year-end tax forms and summary statements",
          "Encrypted payslip delivery directly to employee portal",
        ],
      },
    ],
    screenshots: [
      {
        id: "scr-1",
        title: "Workforce Dashboard",
        image: "/marketplace/xentra-people/screenshots/dashboard.webp",
        caption: "Comprehensive dashboard providing real-time headcount, active attendance, and quick team actions.",
      },
      {
        id: "scr-2",
        title: "Shift Rostering & Attendance",
        image: "/marketplace/xentra-people/screenshots/attendance.webp",
        caption: "Interactive calendar view for scheduling shifts, managing leave coverage, and reviewing time entries.",
      },
      {
        id: "scr-3",
        title: "Payroll Processing Engine",
        image: "/marketplace/xentra-people/screenshots/payroll.webp",
        caption: "Automated calculation breakdown showing gross earnings, deductions, and downloadable bank files.",
      },
    ],
    benefits: [
      {
        title: "Save 15+ Hours Weekly on Admin",
        description: "Automate manual data entry between spreadsheets, time cards, and payroll calculation systems.",
      },
      {
        title: "100% Regional Regulatory Compliance",
        description: "Built-in statutory tax rules and labor regulations ensure your payroll and work hours stay fully audit-ready.",
      },
      {
        title: "Unified Dort Asia Ecosystem",
        description: "Single sign-on, centralized company billing, and unified role-based permissions integrated seamlessly across your workspace.",
      },
    ],
    pricingPlans: [],
  },
  {
    id: "xentra-paynote",
    slug: "xentra-paynote",
    name: "Xentra Paynote",
    tagline: "Company Expenses, Project Maintenance, Financial Tracking",
    description: "A centralized financial tracking and company expense management suite built to streamline budgets, vendor invoices, and project cashflows.",
    longDescription: "Xentra Paynote gives business owners and finance teams total visibility over operational spending, project budget burn rates, vendor payables, and client invoicing. Capture receipts with intelligent scanning, allocate costs directly to active projects, and forecast cash flow in real-time.",
    icon: "/apps-logo/xentra_paynote.svg",
    iconBackground: "bg-gradient-to-br from-[#2C2F33] via-[#1A1C1E] to-[#0D0E10]",
    heroImage: "/Xentra_paynote/banner/app-banner.avif",
    category: "Finance & Accounting",
    platform: "Web (Cloud)",
    rating: {
      score: 4.8,
      count: 94,
    },
    status: "coming_soon",
    badge: "Coming Soon",
    version: "v1.0.0-rc",
    developer: "Dort Asia Technologies",
    lastUpdated: "August 2026",
    route: "/dashboard/marketplace/xentra-paynote",
    sortOrder: 2,
    highlights: [
      { label: "Category", value: "Finance & Operations" },
      { label: "Platform", value: "Cloud Web Workspace" },
      { label: "Rating", value: "4.8 ★ (94 beta testers)" },
      { label: "Availability", value: "Coming Soon" },
      { label: "Currency Support", value: "Multi-Currency (SGD, USD, MYR)" },
    ],
    features: [
      {
        id: "feat-expense-tracking",
        title: "Expense Management & Receipt OCR",
        description: "Submit expenses on the fly, automatically extract vendor/amount via OCR, and enforce company category spending limits.",
        tag: "Expenses",
      },
      {
        id: "feat-project-costing",
        title: "Project Costing & Budget Control",
        description: "Assign expense items and resource hours to specific client projects to measure profitability and burn rates in real-time.",
        tag: "Projects",
      },
      {
        id: "feat-invoicing",
        title: "Invoicing & Payment Tracking",
        description: "Create professional branded invoices, track payment status, send automated overdue notices, and record payments.",
        tag: "Invoicing",
      },
      {
        id: "feat-vendor-payables",
        title: "Vendor Management & Payables",
        description: "Maintain verified vendor registries, track payment terms, organize recurring contracts, and schedule outgoing disbursements.",
        tag: "Payables",
      },
      {
        id: "feat-cashflow",
        title: "Real-Time Cash Flow Analytics",
        description: "Live interactive forecasting dashboards visualizing revenue inflows, categorized spending, and projected tax liabilities.",
        tag: "Analytics",
      },
      {
        id: "feat-audit",
        title: "Tax-Ready Audit Trail",
        description: "Every receipt, modification, and approval is logged with immutable timestamps for smooth tax filings and accountant review.",
        tag: "Compliance",
      },
    ],
    modules: [
      {
        id: "mod-expense-engine",
        title: "Intelligent Expense Engine",
        description: "Digitize team expense claims with multi-level approval hierarchies, policy violation alerts, and instant reimbursement tracking.",
        capabilities: [
          "Automatic currency conversion at live rates",
          "Mileage calculation with Google Maps integration",
          "Direct credit card statement reconciliation",
          "Custom expense categories and GL code mapping",
        ],
      },
      {
        id: "mod-project-financials",
        title: "Project Financial Health",
        description: "Keep client projects profitable by continuously monitoring revenue milestones against vendor costs and staff hours.",
        capabilities: [
          "Target budget vs actual spend variance",
          "Margin and gross profitability calculation",
          "Automated client milestone billing triggers",
          "Exportable project audit reports",
        ],
      },
    ],
    screenshots: [
      {
        id: "scr-paynote-1",
        title: "Financial Overview Dashboard",
        image: "/marketplace/xentra-paynote/screenshots/dashboard.webp",
        caption: "High-level summary of month-to-date expenses, pending invoice collections, and project burn rates.",
      },
      {
        id: "scr-paynote-2",
        title: "Expense Claims & Approval Flow",
        image: "/marketplace/xentra-paynote/screenshots/expenses.webp",
        caption: "Review claims submitted by team members with attached receipt scans and budget allocation tags.",
      },
    ],
    benefits: [
      {
        title: "Zero Lost Receipts",
        description: "Eliminate paper clutter with cloud-stored digital receipts mapped directly to accounting entries.",
      },
      {
        title: "Total Project Profitability Visibility",
        description: "Know exactly which client projects are generating margin and which are over-budget before month end.",
      },
      {
        title: "Seamless Dort Asia Integration",
        description: "Shares company profile, tax numbers, and team member directory directly with Xentra People.",
      },
    ],
    pricingPlans: [
      {
        id: "plan-paynote-standard",
        name: "Paynote Standard",
        description: "Expense tracking and project financials for small-to-medium teams.",
        price: 79,
        billingInterval: "month",
        currency: "SGD",
        popular: true,
        features: [
          "Up to 20 Expense Claim Submitters",
          "Unlimited Project Cost Tracking",
          "OCR Receipt Scanning",
          "Client Invoicing & Payment Links",
          "Standard Financial Reports",
        ],
        ctaText: "Join Waitlist / Pre-Subscribe",
        ctaRoute: "/dashboard/subscriptions?app=xentra-paynote",
      },
      {
        id: "plan-paynote-pro",
        name: "Paynote Enterprise",
        description: "Advanced multi-entity financial tracking, ERP export, and custom GL integrations.",
        price: 189,
        billingInterval: "month",
        currency: "SGD",
        popular: false,
        features: [
          "Unlimited submitters and projects",
          "Multi-currency auto-reconciliation",
          "Custom ERP / Xero / QuickBooks Sync",
          "Dedicated Financial Onboarding",
          "Priority Support SLA",
        ],
        ctaText: "Contact Sales",
        ctaRoute: "/contact",
      },
    ],
  },
];
