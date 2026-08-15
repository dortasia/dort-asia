"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LaptopProgrammingIcon,
  WebDesign01Icon,
  Search01Icon,
  CodeIcon,
  Layers01Icon,
  SparklesIcon,
  SmartPhone01Icon,
  DatabaseIcon,
  ArtificialIntelligence01Icon,
  Settings01Icon
} from "@hugeicons/core-free-icons";
import { 
  Globe, 
  Server, 
  Database, 
  Cpu, 
  Cloud,
  Check,
  Compass,
  LayoutTemplate,
  Code2,
  TrendingUp,
  Zap,
  ShieldCheck,
  Smartphone,
  Network,
  Lock,
  RefreshCw,
  Box,
  Bot,
  Search,
  Shuffle,
  Activity,
  GitMerge
} from "lucide-react";
import Image from "next/image";

const WE_BUILD_SERVICES = [
  { 
    name: "Websites", 
    tag: "Marketing & Portals",
    icon: WebDesign01Icon,
    subtitle: "High-speed Next.js web experiences"
  },
  { 
    name: "Web Applications", 
    tag: "SaaS Platforms",
    icon: LaptopProgrammingIcon,
    subtitle: "Real-time interactive business apps"
  },
  { 
    name: "Mobile Apps", 
    tag: "iOS & Android",
    icon: SmartPhone01Icon,
    subtitle: "High-performance native experiences"
  },
  { 
    name: "ERP Systems", 
    tag: "Bespoke Logic",
    icon: DatabaseIcon,
    subtitle: "Zero-spreadsheet resource engines"
  },
  { 
    name: "AI Solutions", 
    tag: "Agentic Workflows",
    icon: ArtificialIntelligence01Icon,
    subtitle: "Autonomous LLM & data agents"
  },
  { 
    name: "Automation", 
    tag: "API Integrations",
    icon: Settings01Icon,
    subtitle: "Event-driven system orchestration"
  },
];

const PROCESS_STAGES = [
  {
    number: "01",
    phase: "Understand",
    headline: "We learn how your business actually works.",
    description: "Before writing any code, we dive deep into your operational bottlenecks, team workflows, and commercial objectives to blueprint the ideal solution architecture.",
    tagline: "Discovery & Blueprint",
    icon: Compass,
    deliverables: ["Workflow mapping", "Tech feasibility", "Architecture plan"],
  },
  {
    number: "02",
    phase: "Design",
    headline: "We turn requirements into a simple, intuitive experience.",
    description: "We craft frictionless user journeys, clean interface design systems, and interactive clickable prototypes tailored for maximum speed and zero learning curve.",
    tagline: "UI/UX & Prototyping",
    icon: LayoutTemplate,
    deliverables: ["Figma prototypes", "Design tokens", "Frictionless UX"],
  },
  {
    number: "03",
    phase: "Build",
    headline: "We engineer the product using modern technology.",
    description: "Full-stack development using high-performance modern frameworks (Next.js, Node, Supabase, Cloud Native) with type-safe architectures and bank-grade security.",
    tagline: "Engineering & QA",
    icon: Code2,
    deliverables: ["Next.js & Supabase", "CI/CD pipelines", "SOC2 compliance"],
  },
  {
    number: "04",
    phase: "Scale",
    headline: "We continue improving it as your business grows.",
    description: "Continuous proactive monitoring, telemetry optimization, rapid feature iterations, and dedicated engineering support as your business scales.",
    tagline: "Growth & Iteration",
    icon: TrendingUp,
    deliverables: ["Uptime monitoring", "Performance scaling", "Active roadmaps"],
  },
];

// Structured Technology Categories with Architectural Layers & Deep Specs
const TECH_CATEGORIES = [
  {
    id: "frontend",
    category: "Frontend & Mobile",
    layer: "Layer 01 — Client Experience",
    icon: Globe,
    headline: "Frictionless interfaces engineered for instant interaction.",
    description: "We engineer high-performance web applications and native mobile interfaces with type-safe state machines, zero bundle bloat, and silky 60fps micro-animations.",
    metrics: [
      { label: "Sub-100ms FCP", desc: "Instant page hydration & Edge SSR", icon: Zap },
      { label: "100% Type-Safe", desc: "Strict end-to-end TypeScript schemas", icon: ShieldCheck },
      { label: "Native Parity", desc: "Single codebase iOS & Android parity", icon: Smartphone },
    ],
    techs: [
      { name: "React", logo: "/technologies_mark_logo/React-icon.svg", role: "Component UI", highlight: "Modular reactive state & concurrent rendering" },
      { name: "Next.js", logo: "/technologies_mark_logo/nextdotjs.svg", role: "Fullstack Web", highlight: "Server components, streaming & edge routing" },
      { name: "TypeScript", logo: "/technologies_mark_logo/Typescript_logo_2020.svg", role: "Type Safety", highlight: "Compile-time correctness across all layers" },
      { name: "JavaScript", logo: "/technologies_mark_logo/Unofficial_JavaScript_logo_2.svg", role: "Web Engine", highlight: "Modern ESNext optimized runtime standards" },
      { name: "Tailwind CSS", logo: "/technologies_mark_logo/Tailwind_CSS_Logo.svg", role: "Design Tokens", highlight: "Utility-first design tokens & zero CSS bloat" },
      { name: "Vite", logo: "/technologies_mark_logo/Vite_Logo_2026.svg", role: "Build Tooling", highlight: "Instant HMR & lightning production packaging" },
      { name: "Flutter", logo: "/technologies_mark_logo/Flutter_logo.svg", role: "Native Mobile", highlight: "Cross-platform high-performance GPU UI" },
    ],
  },
  {
    id: "backend",
    category: "Backend & Logic",
    layer: "Layer 02 — Compute & Microservices",
    icon: Server,
    headline: "Resilient server engines with zero-latency event loops.",
    description: "We architect event-driven backend services and high-throughput APIs capable of handling millions of concurrent operations with strict fault isolation.",
    metrics: [
      { label: "Async Microservices", desc: "Non-blocking event-driven architecture", icon: Cpu },
      { label: "REST & GraphQL", desc: "Type-safe RPC & schema validation", icon: Network },
      { label: "Bank-Grade Auth", desc: "Role-based access & JWT encryption", icon: Lock },
    ],
    techs: [
      { name: "Node.js", logo: "/technologies_mark_logo/Node.js_logo.svg", role: "Event Runtime", highlight: "Asynchronous non-blocking microservices" },
      { name: "Python", logo: "/technologies_mark_logo/Python-logo-notext.svg", role: "Logic & Data", highlight: "Robust algorithmic computing & backend logic" },
    ],
  },
  {
    id: "database",
    category: "Database & Storage",
    layer: "Layer 03 — Persistence & Sync",
    icon: Database,
    headline: "High-throughput storage with realtime sync & ACID integrity.",
    description: "Distributed data pipelines and relational database systems designed for zero data loss, millisecond queries, and automated point-in-time recovery.",
    metrics: [
      { label: "ACID Compliance", desc: "Strict transactional integrity", icon: Database },
      { label: "Sub-10ms Sync", desc: "Realtime WebSocket subscriptions", icon: RefreshCw },
      { label: "Container Isolation", desc: "Deterministic Docker environments", icon: Box },
    ],
    techs: [
      { name: "PostgreSQL", logo: "/technologies_mark_logo/Postgresql_elephant.svg", role: "Relational DB", highlight: "Battle-tested relational schema with JSONB" },
      { name: "Supabase", logo: "/technologies_mark_logo/supabase.svg", role: "Realtime Postgres", highlight: "PostgreSQL with instant WebSocket sync & auth" },
      { name: "Firebase", logo: "/technologies_mark_logo/firebase.svg", role: "Cloud NoSQL", highlight: "Document storage & event-driven cloud triggers" },
      { name: "Docker", logo: "/technologies_mark_logo/docker-mark-ocean-blue.svg", role: "Containers", highlight: "Reproducible, isolated runtime packaging" },
    ],
  },
  {
    id: "ai",
    category: "AI & Intelligence",
    layer: "Layer 04 — Autonomous Reasoning",
    icon: Cpu,
    headline: "Next-gen LLMs and multi-agent reasoning pipelines.",
    description: "We integrate enterprise-grade generative AI models, autonomous multi-agent tool callers, and vector embedding search directly into your business workflows.",
    metrics: [
      { label: "Autonomous Agents", desc: "Multi-step tool-calling workflows", icon: Bot },
      { label: "Vector Search", desc: "Semantic retrieval & RAG pipelines", icon: Search },
      { label: "Model Agnostic", desc: "Dynamically routed LLM fallbacks", icon: Shuffle },
    ],
    techs: [
      { name: "ChatGPT / OpenAI", logo: "/ai_mark_logo/chatgpt-6.svg", role: "LLM & Reasoning", highlight: "Advanced reasoning, tool execution & GPT-4o" },
      { name: "Google Gemini", logo: "/ai_mark_logo/Google_Gemini_icon_2025.svg", role: "Multimodal AI", highlight: "Long-context understanding & multimodal vision" },
      { name: "Claude", logo: "/ai_mark_logo/claude-logo.svg", role: "Deep Analysis", highlight: "Superior coding, deep analysis & safety guardrails" },
      { name: "DeepSeek", logo: "/ai_mark_logo/deepseek-2.svg", role: "Logic & Math", highlight: "Deep mathematical reasoning & efficiency" },
      { name: "Perplexity", logo: "/ai_mark_logo/perplexity-color.svg", role: "Neural Search", highlight: "Realtime web synthesis & verified citation" },
      { name: "Grok", logo: "/ai_mark_logo/grok-1.svg", role: "Realtime AI", highlight: "Live data comprehension & fast inference" },
    ],
  },
  {
    id: "cloud",
    category: "Cloud & DevOps",
    layer: "Layer 05 — Global Edge Infrastructure",
    icon: Cloud,
    headline: "Global edge deployment and automated continuous delivery.",
    description: "Zero-configuration serverless hosting, automated CI/CD pipelines, and multi-region edge delivery ensuring your application is always fast and available everywhere.",
    metrics: [
      { label: "99.99% Uptime", desc: "Multi-region fallback resilience", icon: Activity },
      { label: "Automated CI/CD", desc: "Branch preview & zero-downtime deploys", icon: GitMerge },
      { label: "Global Edge CDN", desc: "Worldwide edge caching under 15ms", icon: Globe },
    ],
    techs: [
      { name: "AWS", logo: "/technologies_mark_logo/Amazon_Web_Services_Logo.svg", role: "Cloud Engine", highlight: "Global compute, S3 storage & Lambda serverless" },
      { name: "Google Cloud", logo: "/technologies_mark_logo/Google_Cloud_icon_(2026).svg", role: "Cloud Services", highlight: "BigQuery analytics, Kubernetes & vertex infra" },
      { name: "Vercel", logo: "/technologies_mark_logo/vercel-icon-light.svg", role: "Edge Platform", highlight: "Global serverless compute with zero config" },
      { name: "GitHub", logo: "/technologies_mark_logo/Octicons-mark-github.svg", role: "CI/CD & Code", highlight: "Automated linting, test suites & pipelines" },
    ],
  },
];

// Scrolling Cloud Rows - Clean Mark Logos & Rich Metadata
const CLOUD_ROW_1 = [
  { name: "React", logo: "/technologies_mark_logo/React-icon.svg", category: "Frontend Framework" },
  { name: "Next.js", logo: "/technologies_mark_logo/nextdotjs.svg", category: "Fullstack React" },
  { name: "TypeScript", logo: "/technologies_mark_logo/Typescript_logo_2020.svg", category: "Type Safety" },
  { name: "Tailwind CSS", logo: "/technologies_mark_logo/Tailwind_CSS_Logo.svg", category: "Styling Engine" },
  { name: "ChatGPT / OpenAI", logo: "/ai_mark_logo/chatgpt-6.svg", category: "LLM & Reasoning" },
  { name: "Google Cloud", logo: "/technologies_mark_logo/Google_Cloud_icon_(2026).svg", category: "Cloud Infrastructure" },
  { name: "PostgreSQL", logo: "/technologies_mark_logo/Postgresql_elephant.svg", category: "Relational DB" },
  { name: "Node.js", logo: "/technologies_mark_logo/Node.js_logo.svg", category: "Backend Runtime" },
];

const CLOUD_ROW_2 = [
  { name: "Python", logo: "/technologies_mark_logo/Python-logo-notext.svg", category: "AI & Backend" },
  { name: "Supabase", logo: "/technologies_mark_logo/supabase.svg", category: "Realtime Database" },
  { name: "Google Gemini", logo: "/ai_mark_logo/Google_Gemini_icon_2025.svg", category: "Multimodal AI" },
  { name: "AWS", logo: "/technologies_mark_logo/Amazon_Web_Services_Logo.svg", category: "Cloud Services" },
  { name: "Flutter", logo: "/technologies_mark_logo/Flutter_logo.svg", category: "Cross-Platform Mobile" },
  { name: "Docker", logo: "/technologies_mark_logo/docker-mark-ocean-blue.svg", category: "Containerization" },
  { name: "Claude", logo: "/ai_mark_logo/claude-logo.svg", category: "AI Intelligence" },
  { name: "Vercel", logo: "/technologies_mark_logo/vercel-icon-light.svg", category: "Edge Platform" },
];

const CLOUD_ROW_3 = [
  { name: "JavaScript", logo: "/technologies_mark_logo/Unofficial_JavaScript_logo_2.svg", category: "Web Standards" },
  { name: "Vite", logo: "/technologies_mark_logo/Vite_Logo_2026.svg", category: "Modern Bundler" },
  { name: "Firebase", logo: "/technologies_mark_logo/firebase.svg", category: "App Platform" },
  { name: "DeepSeek", logo: "/ai_mark_logo/deepseek-2.svg", category: "Deep Reasoning AI" },
  { name: "GitHub", logo: "/technologies_mark_logo/Octicons-mark-github.svg", category: "DevOps & CI/CD" },
  { name: "Perplexity", logo: "/ai_mark_logo/perplexity-color.svg", category: "Neural Search" },
  { name: "Grok", logo: "/ai_mark_logo/grok-1.svg", category: "Realtime Intelligence" },
];

export function CustomTechnologySection() {
  const targetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxScrollDistance, setMaxScrollDistance] = useState(0);
  const [activeTab, setActiveTab] = useState("frontend");
  
  const currentCategory = TECH_CATEGORIES.find((c) => c.id === activeTab) || TECH_CATEGORIES[0];
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate exact pixel offset so Card 04 stops flush with the right boundary of container
  useEffect(() => {
    const updateDistance = () => {
      if (trackRef.current && containerRef.current) {
        const trackWidth = trackRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        const distance = Math.max(0, trackWidth - containerWidth);
        setMaxScrollDistance(distance);
      }
    };

    updateDistance();
    const timer = setTimeout(updateDistance, 100);
    window.addEventListener("resize", updateDistance);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateDistance);
    };
  }, []);

  // Transform vertical scroll progress into exact pixel translation
  const x = useTransform(smoothProgress, [0, 1], [0, -maxScrollDistance]);
  const progressBarWidth = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="relative w-full bg-white font-text border-t border-gray-100">
      
      {/* Top Part: Editorial Hero Statement + Full-Width We Build Row */}
      <div className="w-[96%] max-w-[1440px] mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-8 md:pb-12">
        
        {/* Section Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[13px] md:text-[14px] font-semibold text-[#86868b] tracking-wider uppercase mb-4"
        >
          03 — Custom Technology
        </motion.div>

        {/* Hero Statement Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start pb-6 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.1]">
              Your business is unique.<br />
              <span className="text-[#86868b]">Your technology should be too.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 lg:pt-1"
          >
            <p className="text-[16px] md:text-[18px] text-[#424245] leading-relaxed font-normal">
              We design and build custom digital solutions around the way your business works — from websites and web applications to automation, integrations and AI-powered platforms.
            </p>
          </motion.div>
        </div>

        {/* Full-Width Single Row: We Build Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-6 border-t border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">
              We build
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-4.5">
            {WE_BUILD_SERVICES.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.name}
                  className="group relative p-5.5 sm:p-6 rounded-[24px] bg-linear-to-b from-[#fafafa] to-[#f4f4f6] hover:from-white hover:to-white border border-black/[0.04] hover:border-[#007AFF]/35 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_14px_34px_rgba(0,122,255,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-default flex flex-col justify-between min-h-[175px]"
                >
                  <div>
                    <div className="w-11 h-11 rounded-[14px] bg-white group-hover:bg-blue-50 border border-black/[0.04] group-hover:border-blue-100 flex items-center justify-center text-[#007AFF] shadow-2xs transition-all mb-4 group-hover:scale-105">
                      <HugeiconsIcon icon={Icon} className="w-5 h-5 text-[#007AFF] stroke-[1.9]" />
                    </div>

                    <div className="text-[16.5px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
                      {srv.name}
                    </div>

                    <div className="text-[12px] font-medium text-[#424245] mt-1 tracking-wide">
                      {srv.tag}
                    </div>
                  </div>

                  <div className="text-[12.5px] text-[#86868b] mt-3 leading-snug font-normal">
                    {srv.subtitle}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>

      {/* Sticky Scroll Section: "Our Methodology / From idea to impact." */}
      <div ref={targetRef} className="relative h-[220vh] bg-white">
        
        {/* Sticky Viewport Container */}
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
          
          <div ref={containerRef} className="w-[95%] max-w-7xl mx-auto px-4 w-full">
            
            {/* Methodology Header & Live Scroll Progress Bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-[12.5px] font-semibold text-[#86868b] tracking-wider uppercase">
                  Our Methodology
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-[#1d1d1f] tracking-tight mt-1">
                  From idea to impact.
                </h3>
              </div>

              {/* Progress Indicator Bar */}
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-medium text-[#86868b]">Scroll to explore process</span>
                <div className="w-28 sm:w-36 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    style={{ width: progressBarWidth }}
                    className="h-full bg-[#007AFF] rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Horizontal Moving Stage Track */}
            <div className="relative overflow-visible py-4">
              <motion.div 
                ref={trackRef}
                style={{ x }} 
                className="flex gap-6 w-max"
              >
                {PROCESS_STAGES.map((stage) => {
                  const StageIcon = stage.icon;
                  return (
                    <div
                      key={stage.number}
                      className="group w-[85vw] sm:w-[380px] md:w-[420px] bg-[#f5f5f7] rounded-[28px] md:rounded-[32px] p-7 md:p-9 flex flex-col justify-between min-h-[380px] md:min-h-[400px] border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:-translate-y-1"
                    >
                      {/* Stage Top */}
                      <div>
                        <div className="flex items-center justify-between mb-7">
                          <span className="text-4xl md:text-5xl font-semibold text-[#1d1d1f]/40 tracking-tight font-['SF_Pro_Rounded']">
                            {stage.number}
                          </span>
                          <div className="w-11 h-11 md:w-12 md:h-12 rounded-[16px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-black/[0.05] flex items-center justify-center text-[#007AFF] group-hover:scale-105 group-hover:shadow-[0_8px_24px_rgba(0,122,255,0.15)] group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-all">
                            <StageIcon className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#007AFF] stroke-[2.2]" />
                          </div>
                        </div>

                        <span className="text-[12px] font-semibold text-[#007AFF] tracking-wider uppercase block mb-2">
                          {stage.tagline}
                        </span>

                        <h4 className="text-xl md:text-[22px] font-semibold text-[#1d1d1f] tracking-tight mb-2.5">
                          {stage.headline}
                        </h4>

                        <p className="text-[14px] md:text-[14.5px] text-[#86868b] leading-relaxed font-normal mb-6">
                          {stage.description}
                        </p>
                      </div>

                      {/* Deliverables Chip Strip */}
                      <div className="pt-5 border-t border-black/[0.05]">
                        <div className="flex flex-wrap gap-1.5">
                          {stage.deliverables.map((del) => (
                            <span
                              key={del}
                              className="text-[11.5px] font-medium text-[#1d1d1f] bg-white px-2.5 py-1 rounded-full border border-black/[0.04] shadow-2xs"
                            >
                              {del}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

          </div>

        </div>

      </div>

      {/* Technology Categories Section: Interactive Architectural Explorer */}
      <div className="w-[95%] max-w-7xl mx-auto px-4 pt-12 md:pt-16 pb-8 md:pb-12 border-t border-gray-100">
        
        {/* Tech Section Header */}
        <div className="max-w-3xl mb-8 md:mb-10">
          <span className="text-[13px] font-semibold text-[#86868b] tracking-wider uppercase block mb-3">
            Technology Stack & Architecture
          </span>
          <h3 className="text-3xl sm:text-4xl md:text-[44px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.15]">
            Engineered with modern,<br />
            <span className="text-[#86868b]">battle-tested technologies.</span>
          </h3>
          <p className="text-[16px] md:text-[17.5px] text-[#424245] mt-4 leading-relaxed font-normal">
            We build with type-safe architectures, modern cloud engines, and state-of-the-art AI frameworks to guarantee speed, security, and effortless scaling.
          </p>
        </div>

        {/* Apple-Style Segmented Category Tabs */}
        <div className="flex items-center justify-start overflow-x-auto no-scrollbar pb-3 mb-8">
          <div className="inline-flex p-1.5 rounded-[22px] bg-[#f5f5f7] border border-black/[0.04] gap-1.5 shadow-2xs">
            {TECH_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`relative px-4 sm:px-5 py-2.5 rounded-[16px] text-[13.5px] font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
                    isActive ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute inset-0 bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.04]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <IconComp className={`w-4 h-4 ${isActive ? "text-[#007AFF]" : "text-[#86868b]"}`} />
                    <span className="whitespace-nowrap">{cat.category}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Category Architectural Showcase Panel */}
        <AnimatePresence mode="wait">
          {currentCategory && (
            <motion.div
              key={currentCategory.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-9 md:p-12 rounded-[32px] bg-linear-to-b from-[#ffffff] via-[#fbfbfd] to-[#f6f6f9] border border-black/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
            >
              {/* Left Column: Architectural Intent, Description & Guarantees */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight leading-[1.2] mb-3.5">
                    {currentCategory.headline}
                  </h4>

                  <p className="text-[15px] sm:text-[16px] text-[#515154] leading-relaxed mb-8 font-normal">
                    {currentCategory.description}
                  </p>
                </div>

                {/* Architectural Guarantees / Metrics */}
                <div className="space-y-3 pt-6 border-t border-black/[0.06]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                    Architectural Guarantees
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentCategory.metrics.map((m) => {
                      const MetricIcon = m.icon;
                      return (
                        <div
                          key={m.label}
                          className="flex items-start gap-3.5 p-3.5 rounded-[16px] bg-white border border-black/[0.04] shadow-2xs hover:border-[#007AFF]/25 transition-all group/metric"
                        >
                          <div className="w-8 h-8 rounded-[11px] bg-blue-50/70 border border-blue-100/70 text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5 group-hover/metric:scale-105 group-hover:bg-blue-100/60 transition-all">
                            <MetricIcon className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <div>
                            <div className="text-[13.5px] font-semibold text-[#1d1d1f] leading-tight">
                              {m.label}
                            </div>
                            <div className="text-[12px] text-[#86868b] mt-0.5 leading-normal">
                              {m.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Technology Grid */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] mb-4">
                  Core Engine Stack ({currentCategory.techs.length} Selected Technologies)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {currentCategory.techs.map((tech) => (
                    <div
                      key={tech.name}
                      className="p-4.5 rounded-[20px] bg-white hover:bg-white border border-black/[0.05] hover:border-[#007AFF]/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,122,255,0.08)] hover:-translate-y-1 transition-all duration-200 group cursor-default flex flex-col justify-between min-h-[135px]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-[13px] bg-[#f8f8fa] border border-black/[0.04] p-2 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-50/60 group-hover:border-blue-100 transition-all shadow-2xs">
                          <Image
                            src={tech.logo}
                            alt={tech.name}
                            width={28}
                            height={28}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <span className="text-[10.5px] font-bold text-[#86868b] uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/[0.03] group-hover:bg-blue-50 group-hover:text-[#007AFF] transition-colors">
                          {tech.role}
                        </span>
                      </div>

                      <div>
                        <div className="text-[15.5px] font-semibold text-[#1d1d1f] tracking-tight leading-tight group-hover:text-[#007AFF] transition-colors">
                          {tech.name}
                        </div>
                        <div className="text-[12px] text-[#86868b] mt-1 leading-snug font-normal">
                          {tech.highlight}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Multi-Row Infinite Scrolling Technology Cloud (Bigger Icons & Cards) */}
      <div className="w-full pb-12 md:pb-16 overflow-hidden relative">
        
        {/* Cloud Header Label */}
        <div className="w-[95%] max-w-7xl mx-auto px-4 mb-6 md:mb-8 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">
            Connected Ecosystem
          </span>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1d1d1f]">
            <Globe className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>23 Platforms & Integrations</span>
          </div>
        </div>

        {/* Ambient Left and Right Fade Gradients */}
        <div className="absolute top-10 bottom-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-10 bottom-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="space-y-4 md:space-y-6">
          
          {/* Row 1: Leftward Scroll */}
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 32 }}
              className="flex gap-5 md:gap-6 pr-5 md:pr-6 shrink-0 w-max py-2"
            >
              {[...CLOUD_ROW_1, ...CLOUD_ROW_1].map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center gap-4 px-6 py-4 rounded-[22px] bg-linear-to-b from-[#ffffff] to-[#f6f6f9] hover:from-white hover:to-white border border-black/[0.06] hover:border-[#007AFF]/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,122,255,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-default group"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-[16px] bg-white border border-black/[0.06] p-2.5 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(0,122,255,0.12)] transition-all">
                    <Image 
                      src={item.logo} 
                      alt={item.name} 
                      width={40} 
                      height={40} 
                      className="w-7 h-7 md:w-9 md:h-9 object-contain" 
                    />
                  </div>
                  <div>
                    <div className="text-[16px] md:text-[17px] font-semibold text-[#1d1d1f] whitespace-nowrap leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[12px] font-normal text-[#86868b] whitespace-nowrap mt-0.5">
                      {item.category}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Row 2: Rightward Scroll */}
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: ["-50%", "0%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 36 }}
              className="flex gap-5 md:gap-6 pr-5 md:pr-6 shrink-0 w-max py-2"
            >
              {[...CLOUD_ROW_2, ...CLOUD_ROW_2].map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center gap-4 px-6 py-4 rounded-[22px] bg-linear-to-b from-[#ffffff] to-[#f6f6f9] hover:from-white hover:to-white border border-black/[0.06] hover:border-[#007AFF]/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,122,255,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-default group"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-[16px] bg-white border border-black/[0.06] p-2.5 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(0,122,255,0.12)] transition-all">
                    <Image 
                      src={item.logo} 
                      alt={item.name} 
                      width={40} 
                      height={40} 
                      className="w-7 h-7 md:w-9 md:h-9 object-contain" 
                    />
                  </div>
                  <div>
                    <div className="text-[16px] md:text-[17px] font-semibold text-[#1d1d1f] whitespace-nowrap leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[12px] font-normal text-[#86868b] whitespace-nowrap mt-0.5">
                      {item.category}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Row 3: Leftward Scroll */}
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
              className="flex gap-5 md:gap-6 pr-5 md:pr-6 shrink-0 w-max py-2"
            >
              {[...CLOUD_ROW_3, ...CLOUD_ROW_3].map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center gap-4 px-6 py-4 rounded-[22px] bg-linear-to-b from-[#ffffff] to-[#f6f6f9] hover:from-white hover:to-white border border-black/[0.06] hover:border-[#007AFF]/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,122,255,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-default group"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-[16px] bg-white border border-black/[0.06] p-2.5 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(0,122,255,0.12)] transition-all">
                    <Image 
                      src={item.logo} 
                      alt={item.name} 
                      width={40} 
                      height={40} 
                      className="w-7 h-7 md:w-9 md:h-9 object-contain" 
                    />
                  </div>
                  <div>
                    <div className="text-[16px] md:text-[17px] font-semibold text-[#1d1d1f] whitespace-nowrap leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[12px] font-normal text-[#86868b] whitespace-nowrap mt-0.5">
                      {item.category}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

        </div>

      </div>

    </section>
  );
}
