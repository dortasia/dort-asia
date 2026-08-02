import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppDetailClient } from "./app-detail-client";

// Static app data (will be replaced with API calls in Phase 3)
const APP_DATA = {
  "vertex-hrms": {
    name: "Vertex HRMS",
    slug: "vertex-hrms",
    category: "Human Resources",
    description:
      "The complete HR platform for modern Malaysian companies — from hire to retire. Manage your entire workforce from one powerful, intuitive dashboard.",
    icon: "👥",
    color: "from-violet-500 to-purple-600",
    status: "Live",
    tagline: "HR management, simplified for Asia",
    features: [
      {
        icon: "👤",
        title: "Employee Management",
        desc: "Centralized employee profiles, document storage, org chart, and department management.",
      },
      {
        icon: "💰",
        title: "Payroll Processing",
        desc: "Automated payroll with EPF, SOCSO, PCB calculations. Generate payslips in one click.",
      },
      {
        icon: "📅",
        title: "Leave & Attendance",
        desc: "Geofenced clock-in, leave applications, approval workflows, and real-time reports.",
      },
      {
        icon: "🎯",
        title: "Recruitment",
        desc: "Job posting, candidate tracking, interview scheduling, and offer management.",
      },
      {
        icon: "⭐",
        title: "Performance Reviews",
        desc: "360-degree reviews, KPI tracking, goal setting with automated reminder cycles.",
      },
      {
        icon: "🏢",
        title: "Org Chart",
        desc: "Visual organizational chart with drill-down reporting lines and team structures.",
      },
    ],
    screenshots: [
      { label: "Dashboard", placeholder: "Dashboard overview" },
      { label: "Payroll", placeholder: "Payroll batch processing" },
      { label: "Leave Calendar", placeholder: "Team leave calendar" },
    ],
    plans: [
      {
        name: "Free",
        price: 0,
        features: [
          "Up to 10 employees",
          "Basic leave management",
          "Employee profiles",
          "Email support",
        ],
        highlighted: false,
      },
      {
        name: "Pro",
        price: 49,
        features: [
          "Up to 100 employees",
          "Full payroll (EPF, SOCSO, PCB)",
          "Geofenced attendance",
          "Recruitment module",
          "Performance reviews",
          "Priority support",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: 149,
        features: [
          "Unlimited employees",
          "All Pro features",
          "Custom org chart",
          "API access",
          "SSO integration",
          "Dedicated account manager",
          "SLA guarantee",
        ],
        highlighted: false,
      },
    ],
  },
  "xentra": {
    name: "Xentra",
    slug: "xentra",
    category: "Human Resources",
    description:
      "Enterprise HR management platform for modern organizations — manage departments, employees, and workforce operations seamlessly.",
    icon: "⚡",
    color: "from-amber-500 to-orange-600",
    status: "Live",
    tagline: "Enterprise HR management simplified",
    features: [
      {
        icon: "🏢",
        title: "Department Management",
        desc: "Organize teams, assign department heads, and manage organizational hierarchy.",
      },
      {
        icon: "👥",
        title: "Employee Directory",
        desc: "Centralized employee profiles, job titles, status tracking, and details.",
      },
      {
        icon: "⚡",
        title: "HR Operations",
        desc: "Streamlined HR workflows, quick actions, and automated management tools.",
      },
    ],
    screenshots: [
      { label: "Dashboard", placeholder: "Xentra HRMS dashboard" },
      { label: "Departments", placeholder: "Department management" },
    ],
    plans: [
      {
        name: "Free",
        price: 0,
        features: ["Up to 10 employees", "Department management", "Employee directory"],
        highlighted: false,
      },
      {
        name: "Pro",
        price: 49,
        features: ["Up to 100 employees", "Full HR workflows", "Custom roles", "Priority support"],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: 149,
        features: ["Unlimited employees", "All Pro features", "Advanced analytics", "SSO integration"],
        highlighted: false,
      },
    ],
  },
  "dort-accounts": {
    name: "Dort Accounts",
    slug: "dort-accounts",
    category: "Finance & Accounting",
    description:
      "Smart accounting software built for Malaysian businesses. GST-compliant, SST-ready, and deeply integrated with Malaysian banking.",
    icon: "📊",
    color: "from-blue-500 to-cyan-600",
    status: "Coming Soon",
    tagline: "Accounting made simple for Malaysia",
    features: [
      { icon: "🧾", title: "GST/SST Invoicing", desc: "Compliant invoicing with automatic tax calculation." },
      { icon: "📈", title: "P&L Reports", desc: "Real-time profit & loss, balance sheet, and cash flow statements." },
      { icon: "💳", title: "Expense Tracking", desc: "Receipt scanning, category rules, and approval workflows." },
      { icon: "🏦", title: "Bank Reconciliation", desc: "Auto-match transactions with your bank statements." },
    ],
    screenshots: [],
    plans: [
      { name: "Free", price: 0, features: ["5 invoices/month", "Basic reports"], highlighted: false },
      { name: "Pro", price: 49, features: ["Unlimited invoices", "Full reports", "Bank reconciliation"], highlighted: true },
      { name: "Enterprise", price: 149, features: ["All Pro features", "Multi-entity", "API access"], highlighted: false },
    ],
  },
};

type AppParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: AppParams): Promise<Metadata> {
  const { slug } = await params;
  const app = APP_DATA[slug as keyof typeof APP_DATA];
  if (!app) return { title: "App Not Found" };
  return {
    title: `${app.name} — Dort Asia`,
    description: app.description,
  };
}

export default async function AppDetailPage({ params }: AppParams) {
  const { slug } = await params;
  const app = APP_DATA[slug as keyof typeof APP_DATA];
  if (!app) notFound();
  return <AppDetailClient app={app} />;
}
