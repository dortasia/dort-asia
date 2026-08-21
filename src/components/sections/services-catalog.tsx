"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, Layers, Globe, Smartphone, Users, Bot, Cloud, Database } from "lucide-react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  WebDesign01Icon,
  SmartPhone01Icon,
  UserGroupIcon,
  ArtificialIntelligence01Icon,
  CloudSavingDone02Icon,
  DatabaseIcon,
  LaptopProgrammingIcon,
  Layers01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

const SERVICES_CATALOG = [
  {
    id: "web-saas",
    number: "01",
    title: "Custom Web & SaaS Engineering",
    category: "Full-Stack Development",
    icon: LaptopProgrammingIcon,
    summary:
      "High-speed, scalable web applications and SaaS platforms engineered with Next.js, modern React, and type-safe server architectures.",
    capabilities: [
      "Custom SaaS platforms & client portals",
      "Next.js App Router with Server Components & Edge SSR",
      "Real-time collaborative dashboards & WebSockets",
      "Payment gateway & Stripe subscription billing integration",
      "Multi-tenant data isolation & role-based permissions"
    ],
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js", "Supabase"],
    highlight: "Sub-100ms Page Hydration",
  },
  {
    id: "mobile",
    number: "02",
    title: "Mobile App Development",
    category: "iOS & Android",
    icon: SmartPhone01Icon,
    summary:
      "High-performance native and cross-platform mobile apps delivering silky 60fps animations, offline data synchronization, and biometric security.",
    capabilities: [
      "Cross-platform iOS & Android with Flutter & React Native",
      "Offline-first SQLite local caching & background sync",
      "Hardware telemetry: GPS geofencing & camera scanners",
      "Native push notifications & real-time alerts",
      "App Store & Google Play Store release pipeline management"
    ],
    techStack: ["Flutter", "Dart", "React Native", "Firebase", "Apple HealthKit"],
    highlight: "Single Codebase 60fps",
  },
  {
    id: "talent",
    number: "03",
    title: "Dedicated Engineering Squads",
    category: "Tech Talent & Squads",
    icon: UserGroupIcon,
    summary:
      "Augment your in-house team with pre-vetted senior software engineers, tech leads, and QA specialists who integrate directly into your agile sprints.",
    capabilities: [
      "Pre-vetted top 1% software developers & technical leads",
      "Immediate 48-hour onboarding into your Slack & Jira",
      "Flexible squad scaling with month-to-month contracts",
      "Autonomous sprint execution with daily standup sync",
      "Full IP ownership & strict non-disclosure compliance"
    ],
    techStack: ["Full-Stack", "DevOps", "AI Engineers", "QA Automation", "Tech Leads"],
    highlight: "48h Fast Deployment",
  },
  {
    id: "ai-systems",
    number: "04",
    title: "AI Integration & Autonomous Agents",
    category: "Generative AI & LLMs",
    icon: ArtificialIntelligence01Icon,
    summary:
      "Embed state-of-the-art generative AI, multi-agent reasoning workflows, and semantic vector search into your operational software.",
    capabilities: [
      "Autonomous tool-calling LLM agents (OpenAI, Gemini, Claude)",
      "Vector search & Retrieval-Augmented Generation (RAG)",
      "Automated document processing & PDF data extraction",
      "Model-agnostic fallback routing for cost & speed optimization",
      "Private enterprise data compliance & prompt guardrails"
    ],
    techStack: ["OpenAI", "Google Gemini", "Claude", "Pinecone", "LangChain"],
    highlight: "Multi-Agent Automation",
  },
  {
    id: "cloud-infra",
    number: "05",
    title: "Cloud Modernization & Microservices",
    category: "Infrastructure & DevOps",
    icon: CloudSavingDone02Icon,
    summary:
      "Transform rigid legacy monoliths into agile, cloud-native microservices with zero downtime, robust API integrations, and multi-region resilience.",
    capabilities: [
      "Monolith decomposition into event-driven microservices",
      "Serverless architecture & Docker container orchestration",
      "PostgreSQL clustering, read-replicas & automated backups",
      "Global CDN caching & Edge compute routing",
      "CI/CD pipelines with automated testing and branch previews"
    ],
    techStack: ["AWS", "Google Cloud", "Vercel", "Docker", "PostgreSQL"],
    highlight: "99.99% Uptime Architecture",
  },
  {
    id: "erp-automation",
    number: "06",
    title: "Custom ERP & Workflow Automation",
    category: "Enterprise Systems",
    icon: DatabaseIcon,
    summary:
      "Eliminate manual spreadsheets with bespoke business software, automated invoicing engines, inventory trackers, and API orchestration.",
    capabilities: [
      "Custom ERP & operational management suites",
      "Automated payroll, tax, and Singapore CPF computation",
      "Event-driven webhook integrations across third-party tools",
      "Granular audit telemetry & administrative logs",
      "Real-time executive reporting & analytics exports"
    ],
    techStack: ["Custom ERP", "Webhooks", "REST / GraphQL", "Python", "Redis"],
    highlight: "Zero-Spreadsheet Ops",
  },
];

export function ServicesCatalogSection() {
  const [selectedService, setSelectedService] = useState<string>("web-saas");

  return (
    <section id="services-catalog" className="w-full py-16 md:py-24 bg-white font-text border-t border-gray-100">
      <div className="w-[95%] max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[13px] md:text-[14px] font-semibold text-[#86868b] tracking-wider uppercase mb-3"
          >
            01 — Core Services Catalog
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.12]">
                End-to-end technical execution.<br />
                <span className="text-[#86868b]">From idea to enterprise scale.</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 lg:pt-1"
            >
              <p className="text-[16px] md:text-[17.5px] text-[#515154] leading-relaxed font-normal">
                We combine deep engineering rigor, modern full-stack frameworks, and experienced technical talent to build digital products that move businesses forward.
              </p>
            </motion.div>
          </div>
        </div>

        {/* 6-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {SERVICES_CATALOG.map((service, idx) => {
            const IconComp = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative bg-[#f5f5f7] hover:bg-white rounded-[28px] md:rounded-[32px] p-7 md:p-8 border border-black/[0.04] hover:border-[#007AFF]/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,122,255,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Number + Icon + Highlight Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-[16px] bg-white group-hover:bg-blue-50 border border-black/[0.04] group-hover:border-blue-100 flex items-center justify-center text-[#007AFF] shadow-2xs transition-all group-hover:scale-105">
                      <HugeiconsIcon icon={IconComp} className="w-6 h-6 text-[#007AFF] stroke-[1.9]" />
                    </div>

                    <span className="text-[11.5px] font-semibold text-[#007AFF] bg-white group-hover:bg-blue-50 px-3 py-1 rounded-full border border-black/[0.04] group-hover:border-blue-100 shadow-2xs transition-colors">
                      {service.highlight}
                    </span>
                  </div>

                  {/* Category & Title */}
                  <div className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    {service.category}
                  </div>
                  <h3 className="text-xl md:text-[22px] font-semibold text-[#1d1d1f] tracking-tight leading-snug mb-3">
                    {service.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-[14px] text-[#6e6e73] leading-relaxed mb-6 font-normal">
                    {service.summary}
                  </p>

                  {/* Key Capabilities */}
                  <div className="space-y-2 pt-4 border-t border-black/[0.04] mb-6">
                    {service.capabilities.map((cap) => (
                      <div key={cap} className="flex items-start gap-2 text-[13px] text-[#1d1d1f]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#007AFF] shrink-0 mt-0.5 stroke-[2.2]" />
                        <span className="leading-snug">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Tech Pills + CTA */}
                <div className="pt-4 border-t border-black/[0.04] flex flex-col gap-4">
                  {/* Tech Stack Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {service.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-[11px] font-medium text-[#515154] bg-white px-2.5 py-0.5 rounded-md border border-black/[0.04]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Action Link */}
                  <Link
                    href="/work-with-us"
                    className="inline-flex items-center justify-between text-[13.5px] font-semibold text-[#1d1d1f] group-hover:text-[#007AFF] transition-colors pt-1"
                  >
                    <span>Request this service</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
