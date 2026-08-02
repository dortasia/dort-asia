"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Users, Building2, Utensils, Store, Wallet, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Sparkles, LayoutGrid, LogOut, Settings, CreditCard, MessageSquare, HelpCircle, BarChart3, ChevronUp, Briefcase, Search, Settings2, SlidersHorizontal, Landmark } from "lucide-react";
import { UserGroupIcon, Invoice01Icon, MoneyBag01Icon } from "hugeicons-react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import logoImg from "@/public/DortAsiaLogo.svg";
import vertexLogo from "@/public/VertexLogo.svg";
import xentraLogo from "@/public/XentraLogo.svg";
import employeesIcon from "@/public/Employees.svg";
import payrollIcon from "@/public/Payroll.svg";
import projectsIcon from "@/public/Projects.svg";

/* ─── Product dropdown data ─────────────────────────────────────────────────── */

const productItems = [
  {
    name: "Vertex",
    category: "Company Management",
    description: "Employee management, attendance, leave & claims",
    icon: Users,
    color: "#007AFF",
    bgColor: "bg-blue-50",
    status: "released" as const,
    href: process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL || "https://vertex.dortasia.com",
    purchased: true, // Super Admin has this on registration
    subModules: [
      {
        title: "Employee Management",
        description: "Manage employee data, profiles, and organizational structure",
        icon: employeesIcon,
        color: "#007AFF",
        bgColor: "bg-blue-50",
        href: process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL || "http://localhost:3002",
      },
      {
        title: "Payroll",
        description: "Process payroll, manage payslips, deductions and payments",
        icon: payrollIcon,
        color: "#10B981",
        bgColor: "bg-emerald-50",
        href: process.env.NEXT_PUBLIC_PAYROLL_URL || "http://localhost:3003",
      },
      {
        title: "Project Management",
        description: "Track projects, timelines, tasks, and team milestones",
        icon: projectsIcon,
        color: "#8B5CF6",
        bgColor: "bg-purple-50",
        href: process.env.NEXT_PUBLIC_PROJECT_MANAGEMENT_URL || "http://localhost:3004",
      },
    ],
  },
  {
    name: "Xentra",
    category: "Enterprise HRMS",
    description: "Enterprise HR management, departments & workforce operations",
    icon: xentraLogo,
    color: "#F59E0B",
    bgColor: "bg-amber-50",
    status: "released" as const,
    href: process.env.NEXT_PUBLIC_XENTRA_URL || "http://localhost:5173/",
    purchased: true,
  },
  {
    name: "Folio",
    category: "Hotel Management",
    description: "Room check-in/out, availability & guest tracking",
    icon: Building2,
    color: "#FF5252",
    bgColor: "bg-red-50",
    status: "coming-soon" as const,
    href: "#products",
    purchased: false,
  },
  {
    name: "Tablr",
    category: "Restaurant Management",
    description: "Table management, ordering & payment receiving",
    icon: Utensils,
    color: "#FFA31A",
    bgColor: "bg-amber-50",
    status: "coming-soon" as const,
    href: "#products",
    purchased: false,
  },
  {
    name: "Vendo",
    category: "Store Management",
    description: "Inventory, barcode scanning & sales dashboard",
    icon: Store,
    color: "#7B1FA2",
    bgColor: "bg-purple-50",
    status: "coming-soon" as const,
    href: "#products",
    purchased: false,
  },
  {
    name: "Payd",
    category: "External Payroll Services",
    description: "Payroll processing, salary disbursement & compliance",
    icon: Wallet,
    color: "#10B981",
    bgColor: "bg-emerald-50",
    status: "coming-soon" as const,
    href: "#products",
    purchased: false,
  },
];

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "PRODUCTS", href: "#products", hasDropdown: true },
  { label: "ABOUT US", href: "/about" },
  { label: "NEWS ROOM", href: "/newsroom" },
  { label: "PRICING", href: "/pricing" },
];

/* ─── Navbar ────────────────────────────────────────────────────────────────── */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [activeModalView, setActiveModalView] = useState<"library" | "xentra">("library");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getVertexUrl = () => {
    const baseHrmsUrl = (process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL || "https://vertex.dortasia.com").replace(/\/$/, "");
    if (session) {
      return `${baseHrmsUrl}/api/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
    }
    return baseHrmsUrl;
  };

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";

  useEffect(() => {
    // Initialize supabase client on client side only
    if (typeof window === 'undefined') return;
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Initial session check — if token is invalid, sign out gracefully
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        // Clear any stale token data to prevent repeated refresh errors
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setAvatarUrl(null);
        return;
      }
      if (!session) {
        setUser(null);
        setSession(null);
        setAvatarUrl(null);
        return;
      }
      setUser(session.user);
      setSession(session);
      // Load avatar from cache immediately for instant display
      const userId = session.user.id;
      const cached = localStorage.getItem(`avatar_url_${userId}`);
      if (cached) {
        setAvatarUrl(cached);
        setAvatarLoaded(true);
      }
      fetchAvatar(session.user);
    };
    getInitialSession();

    // Listen for auth changes — handle TOKEN_REFRESHED failure as sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" && !session) {
        setUser(null);
        setSession(null);
        setAvatarUrl(null);
        setAvatarLoaded(false);
        return;
      }
      setUser(session?.user ?? null);
      setSession(session);
      if (session?.user) {
        // Load from cache immediately
        const userId = session.user.id;
        const cached = localStorage.getItem(`avatar_url_${userId}`);
        if (cached) {
          setAvatarUrl(cached);
          setAvatarLoaded(true);
        }
        fetchAvatar(session.user);
      } else {
        setAvatarUrl(null);
        setAvatarLoaded(false);
      }
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchAvatar = async (currentUser: User) => {
    if (!supabase) return;
    // Try OAuth avatar first (instant — already in user metadata)
    const oauthAvatar = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture;
    if (oauthAvatar) {
      setAvatarUrl(oauthAvatar);
      setAvatarLoaded(true);
      localStorage.setItem(`avatar_url_${currentUser.id}`, oauthAvatar);
      return;
    }

    try {
      // 1. Direct database check: Check if current user is Super Admin in company_settings
      const { data: compSettings } = await supabase
        .from("company_settings")
        .select("super_admin_avatar_url, company_name, super_admin_name")
        .eq("company_id", currentUser.id)
        .maybeSingle();

      if (compSettings) {
        if (compSettings.super_admin_avatar_url) {
          setAvatarUrl(compSettings.super_admin_avatar_url);
          setAvatarLoaded(true);
          localStorage.setItem(`avatar_url_${currentUser.id}`, compSettings.super_admin_avatar_url);
          return;
        }

        // If Super Admin has no avatar URL saved directly, fetch from signedUrl API
        if (compSettings.company_name) {
          const parts = (compSettings.super_admin_name || "").trim().split(/\s+/);
          const firstName = parts[0] || "Admin";
          const res = await fetch("/api/storage/get-avatar-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyName: compSettings.company_name,
              firstName,
              userId: currentUser.id,
            }),
          });
          const data = await res.json();
          if (data.signedUrl) {
            setAvatarUrl(data.signedUrl);
            setAvatarLoaded(true);
            localStorage.setItem(`avatar_url_${currentUser.id}`, data.signedUrl);
            return;
          }
        }
      } else {
        // 2. Direct database check: Check if current user is Employee
        const { data: empRecord } = await supabase
          .from("employees")
          .select("avatar_url, name, company_id")
          .eq("email", currentUser.email)
          .maybeSingle();

        if (empRecord) {
          if (empRecord.avatar_url) {
            setAvatarUrl(empRecord.avatar_url);
            setAvatarLoaded(true);
            localStorage.setItem(`avatar_url_${currentUser.id}`, empRecord.avatar_url);
            return;
          }

          // Fetch company slug from company_settings to resolve signedUrl
          if (empRecord.company_id) {
            const { data: cSettings } = await supabase
              .from("company_settings")
              .select("company_name")
              .eq("company_id", empRecord.company_id)
              .maybeSingle();

            if (cSettings?.company_name) {
              const parts = (empRecord.name || "").trim().split(/\s+/);
              const firstName = parts[0] || "User";
              const res = await fetch("/api/storage/get-avatar-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  companyName: cSettings.company_name,
                  firstName,
                  userId: currentUser.id,
                }),
              });
              const data = await res.json();
              if (data.signedUrl) {
                setAvatarUrl(data.signedUrl);
                setAvatarLoaded(true);
                localStorage.setItem(`avatar_url_${currentUser.id}`, data.signedUrl);
                return;
              }
            }
          }
        }
      }

      // 3. Fallback: check user metadata
      const companyName = currentUser.user_metadata?.company_name;
      const firstName = currentUser.user_metadata?.first_name;
      if (companyName && firstName) {
        const res = await fetch("/api/storage/get-avatar-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, firstName, userId: currentUser.id }),
        });
        const data = await res.json();
        if (data.signedUrl) {
          setAvatarUrl(data.signedUrl);
          localStorage.setItem(`avatar_url_${currentUser.id}`, data.signedUrl);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch avatar from DB/API:", err);
    } finally {
      setAvatarLoaded(true);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    if (user) localStorage.removeItem(`avatar_url_${user.id}`);
    await supabase.auth.signOut();
    setUser(null);
    setAvatarUrl(null);
    setAvatarLoaded(false);
  };

  const getInitials = (user: User) => {
    const fullName = user.user_metadata?.full_name || user.email || "";
    if (!fullName) return "??";
    const parts = fullName.split("@")[0].split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return fullName.substring(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showProducts) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProducts(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showProducts]);

  // Prevent body scrolling when side panels are open
  useEffect(() => {
    if (showApps || showProfileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showApps, showProfileMenu]);

  const handleMouseEnter = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setShowProducts(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setShowProducts(false), 300);
  };

  if (isAuthPage) return null;

  return (
    <>
      <header 
        className="fixed top-[15px] lg:top-[27px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] lg:w-[calc(100%-128px)] max-w-[2200px] transition-all duration-300"
      >
        <nav className="glass-nav rounded-[20px] lg:rounded-[25px] h-[60px] lg:h-[70px] w-full px-5 lg:px-10 xl:px-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image src={logoImg} alt="Dort Asia" width={140} height={40} className="h-7 lg:h-9 w-auto" />
          </Link>

          {/* Desktop Menu - Centered */}
          <div className="hidden lg:flex items-center justify-center gap-10 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                /* Products with dropdown */
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className="flex items-center gap-1.5 text-[16px] font-[500] text-black hover:text-[#007AFF] transition-colors duration-200 tracking-tight"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProducts(!showProducts);
                    }}
                  >
                    {link.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${showProducts ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showProducts && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-[calc(100%+20px)] -left-[340px] w-[880px] bg-white/95 backdrop-blur-2xl rounded-[28px] shadow-2xl shadow-black/8 border border-gray-100/80 overflow-hidden"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="px-8 pt-7 pb-4 border-b border-gray-50">
                          <h3 className="text-[20px] font-bold text-slate-900 tracking-tight">Our Products</h3>
                          <p className="text-[14px] text-slate-400 font-medium mt-1">Purpose-built tools for every industry</p>
                        </div>

                        {/* Product Grid */}
                        <div className="p-4 grid grid-cols-3 gap-2">
                          {productItems.map((product) => {
                            const Icon = product.icon;
                            return (
                              <Link
                                key={product.name}
                                href={product.name === "Vertex" ? getVertexUrl() : product.href}
                                target={product.name === "Vertex" || product.name === "Xentra" ? "_blank" : undefined}
                                rel={product.name === "Vertex" || product.name === "Xentra" ? "noopener noreferrer" : undefined}
                                onClick={() => setShowProducts(false)}
                                className="group flex items-start gap-4 p-4 rounded-[20px] hover:bg-slate-50 transition-all duration-200 relative"
                              >
                                {/* Icon */}
                                <div
                                  className={`w-11 h-11 ${product.bgColor} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 overflow-hidden`}
                                >
                                  {product.name === "Vertex" ? (
                                    <Image
                                      src={vertexLogo}
                                      alt="Vertex"
                                      width={30}
                                      height={30}
                                      className="object-contain"
                                    />
                                  ) : (
                                    <Icon className="w-5 h-5" style={{ color: product.color }} />
                                  )}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[15px] font-bold text-slate-900 group-hover:text-[#007AFF] transition-colors">
                                      {product.name}
                                    </span>
                                    {product.status === "released" ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        LIVE
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-full border border-slate-100">
                                        SOON
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                    {product.category}
                                  </p>
                                  <p className="text-[12px] text-slate-500 font-medium leading-snug mt-1">
                                    {product.description}
                                  </p>
                                </div>

                                {/* Hover arrow */}
                                <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 mt-1 shrink-0" />
                              </Link>
                            );
                          })}
                        </div>

                        {/* Footer highlight - Vertex */}
                        <div className="mx-4 mb-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-[20px] p-5 flex items-center gap-5 border border-blue-100/60">
                          <Image src={vertexLogo} alt="Vertex" width={38} height={38} className="w-[38px] h-[38px] object-contain" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-slate-900">Vertex HRMS is now live!</p>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5">Start managing your workforce with our flagship product.</p>
                          </div>
                          <Link
                            href={getVertexUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowProducts(false)}
                            className="px-4 py-2 bg-[#007AFF] text-white text-[12px] font-bold rounded-xl hover:bg-blue-600 transition-colors shrink-0"
                          >
                            Explore
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[16px] font-[500] text-black hover:text-[#007AFF] transition-colors duration-200 tracking-tight"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right Action */}
          <div className="flex items-center shrink-0">
            {user ? (
              <div className="hidden lg:flex items-center gap-6">
              {/* App Launcher */}
                <div ref={appsRef}>
                  <button 
                    onClick={() => { setShowApps(true); setShowProfileMenu(false); }}
                    className="w-10 h-10 flex items-center justify-center text-[#29ABE2] hover:bg-slate-50 rounded-xl transition-all active:scale-95 group"
                  >
                    <LayoutGrid className="w-7 h-7 group-hover:rotate-6 transition-transform" />
                  </button>
                </div>
                
                {/* User Avatar with Premium Subscription Ring */}
                <div className="relative cursor-pointer">
                  {/* Gradient ring with white gap */}
                  <div
                    className="absolute -inset-[4px] rounded-full p-[3px] z-0"
                    style={{ background: "linear-gradient(135deg, #007AFF 0%, #00C2FF 40%, #5E9EFF 70%, #0051D4 100%)" }}
                  >
                    <div className="w-full h-full rounded-full bg-white" />
                  </div>

                  {/* Avatar button — click opens dropdown */}
                  <button
                    onClick={() => { setShowProfileMenu(true); setShowApps(false); }}
                    className="relative z-10 w-11 h-11 rounded-full bg-[#FFB6E1] ring-[3px] ring-white flex items-center justify-center text-[#FF2D92] font-bold text-[15px] hover:scale-105 transition-all overflow-hidden focus:outline-none"
                  >
                    {/* Shimmer skeleton while loading */}
                    {!avatarLoaded && (
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100 animate-pulse" />
                    )}
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={44}
                        height={44}
                        className={`w-full h-full rounded-full object-cover transition-opacity duration-300 ${avatarLoaded ? "opacity-100" : "opacity-0"}`}
                        unoptimized
                        onLoad={() => setAvatarLoaded(true)}
                      />
                    ) : avatarLoaded ? (
                      getInitials(user)
                    ) : null}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/register"
                className="hidden lg:flex w-[127px] h-[47px] items-center justify-center bg-[#007AFF] text-white text-[15px] font-semibold rounded-[15px] hover:bg-blue-600 transition-all active:scale-95"
              >
                Sign up
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-900 transition-transform active:scale-90"
            >
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[85px] left-1/2 -translate-x-1/2 z-[49] w-[calc(100%-24px)] max-w-[500px] lg:hidden"
          >
            <div className="mobile-menu-panel rounded-[25px] p-6 flex flex-col gap-2">
              {navLinks.map((link) =>
                link.hasDropdown ? (
                  <div key={link.label}>
                    <button
                      onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                      className="w-full px-4 py-3 text-[18px] font-semibold text-slate-900 rounded-[15px] hover:bg-slate-50 transition-all flex items-center justify-between"
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${mobileProductsOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {mobileProductsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pr-2 pb-2 pt-1 space-y-1">
                            {productItems.map((product) => {
                              const Icon = product.icon;
                              return (
                                <Link
                                  key={product.name}
                                  href={product.name === "Vertex" ? getVertexUrl() : product.href}
                                  target={product.name === "Vertex" || product.name === "Xentra" ? "_blank" : undefined}
                                  rel={product.name === "Vertex" || product.name === "Xentra" ? "noopener noreferrer" : undefined}
                                  onClick={() => { setIsOpen(false); setMobileProductsOpen(false); }}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-slate-50 transition-all"
                                >
                                  <div
                                    className={`w-9 h-9 ${product.bgColor} rounded-xl flex items-center justify-center shrink-0 overflow-hidden`}
                                  >
                                    {product.name === "Vertex" ? (
                                      <Image
                                        src={vertexLogo}
                                        alt="Vertex"
                                        width={36}
                                        height={36}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <Icon className="w-4 h-4" style={{ color: product.color }} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[15px] font-bold text-slate-900">
                                        {product.name}
                                      </span>
                                      {product.status === "released" ? (
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full border border-emerald-100">
                                          LIVE
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded-full border border-slate-100">
                                          SOON
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[12px] text-slate-400 font-medium">{product.category}</p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 text-[18px] font-semibold text-slate-900 rounded-[15px] hover:bg-slate-50 transition-all active:scale-95"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="h-px bg-slate-100 my-2 mx-4" />
              {user ? (
                <div className="space-y-3 px-4 pb-4">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[20px] border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-[#FFB6E1] flex items-center justify-center text-[#FF2D92] font-bold text-[16px] overflow-hidden">
                      {avatarUrl ? (
                        <Image 
                          src={avatarUrl} 
                          alt="Profile" 
                          width={48} 
                          height={48} 
                          className="w-full h-full rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        getInitials(user)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-900 truncate">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-[12px] text-slate-400 font-medium truncate uppercase tracking-wider">Super Admin</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="w-full h-[55px] flex items-center justify-center bg-red-50 text-red-500 text-[17px] font-bold rounded-[15px] hover:bg-red-100 transition-all active:scale-95 border border-red-100 gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-[55px] flex items-center justify-center bg-[#007AFF] text-white text-[17px] font-bold rounded-[15px] hover:bg-blue-600 transition-all active:scale-95 shadow-lg"
                >
                  Sign up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Launcher Side Panel */}
      <AnimatePresence>
        {showApps && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              onClick={() => setShowApps(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-[90%] max-w-[760px] h-[85vh] max-h-[800px] bg-white rounded-[25px] shadow-lg border border-[#ECECEC] z-[101] flex flex-col overflow-hidden"
            >
               {/* Header */}
               <div className="flex items-start justify-between p-6 bg-white z-10 shrink-0">
                 <div className="flex items-center gap-3">
                   {activeModalView === "xentra" ? (
                     <button
                       onClick={() => setActiveModalView("library")}
                       className="p-2 hover:bg-[#FAFAF9] rounded-[25px] transition-colors text-[#161616] shrink-0 mr-1"
                       title="Back to App Library"
                     >
                       <ArrowLeft className="w-5 h-5" />
                     </button>
                   ) : (
                     <div className="mt-1">
                       <LayoutGrid className="w-6 h-6 text-[#161616]" />
                     </div>
                   )}
                   <div>
                     {activeModalView === "xentra" ? (
                       <>
                         <div className="flex items-center gap-2">
                           <Image src={xentraLogo} alt="Xentra" width={22} height={22} className="object-contain" />
                           <h2 className="text-[24px] font-semibold text-[#161616] tracking-tight leading-none">Xentra</h2>
                         </div>
                         <p className="text-[15px] text-[#616161] mt-1.5">Enterprise HRMS & Business Modules</p>
                       </>
                     ) : (
                       <>
                         <h2 className="text-[24px] font-semibold text-[#161616] tracking-tight leading-none">App Library</h2>
                         <p className="text-[15px] text-[#616161] mt-1.5">All your workplace tools in one place</p>
                       </>
                     )}
                   </div>
                 </div>
                 <button onClick={() => { setShowApps(false); setActiveModalView("library"); }} className="p-2 hover:bg-[#FAFAF9] rounded-[25px] transition-colors text-[#616161] shrink-0">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               {/* Body (Grid) */}
               <div className="flex-1 overflow-y-auto px-6 pb-6">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   {activeModalView === "library" ? (
                     // App Library View: Shows Xentra Card
                     <div
                       onClick={() => setActiveModalView("xentra")}
                       className="flex flex-col items-center justify-center text-center p-4 bg-white border border-[#ECECEC] rounded-[25px] aspect-square overflow-hidden hover:bg-[#FAFAF9] transition-colors group cursor-pointer"
                     >
                       <div className="w-10 h-10 mb-3 flex items-center justify-center shrink-0">
                         <Image src={xentraLogo} alt="Xentra" width={28} height={28} className="object-contain group-hover:scale-110 transition-transform duration-200" />
                       </div>
                       <h4 className="text-[15px] font-medium text-[#161616] leading-tight mb-1 line-clamp-1 px-1">Xentra</h4>
                       <p className="text-[13px] text-[#616161] leading-snug line-clamp-2 px-1">Enterprise HR management, departments & workforce operations</p>
                     </div>
                   ) : (
                     // Xentra Apps View: Shows Employee Management, Payroll, Financials
                     [
                       {
                         name: "Employee Management",
                         description: "Manage employee data, profiles, and organizational structure",
                         icon: UserGroupIcon,
                         isImage: false,
                         href: process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL || "http://localhost:3002",
                       },
                       {
                         name: "Payroll",
                         description: "Process payroll, manage payslips, deductions and payments",
                         icon: Invoice01Icon,
                         isImage: false,
                         href: process.env.NEXT_PUBLIC_PAYROLL_URL || "http://localhost:3003",
                       },
                       {
                         name: "Financials",
                         description: "Financial management, accounting, expenses & revenue",
                         icon: MoneyBag01Icon,
                         isImage: false,
                         href: process.env.NEXT_PUBLIC_FINANCIALS_URL || "http://localhost:5173/financials",
                       },
                     ].map((subApp) => (
                       <Link
                         key={subApp.name}
                         href={subApp.href}
                         target="_blank"
                         onClick={() => { setShowApps(false); setActiveModalView("library"); }}
                         className="flex flex-col items-center justify-center text-center p-4 bg-white border border-[#ECECEC] rounded-[25px] aspect-square overflow-hidden hover:bg-[#FAFAF9] transition-colors group"
                       >
                         <div className="w-10 h-10 mb-3 flex items-center justify-center shrink-0">
                           {subApp.isImage ? (
                             <Image src={subApp.icon as any} alt={subApp.name} width={28} height={28} className="object-contain group-hover:scale-110 transition-transform duration-200" />
                           ) : (
                             (() => {
                               const Icon = subApp.icon as any;
                               return <Icon className="w-6 h-6 text-[#161616] group-hover:scale-110 transition-transform duration-200" strokeWidth={1.5} />;
                             })()
                           )}
                         </div>
                         <h4 className="text-[15px] font-medium text-[#161616] leading-tight mb-1 line-clamp-1 px-1">{subApp.name}</h4>
                         <p className="text-[13px] text-[#616161] leading-snug line-clamp-2 px-1">{subApp.description}</p>
                       </Link>
                     ))
                   )}
                 </div>
               </div>
               
               {/* Footer */}
               <div className="px-6 py-4 border-t border-[#ECECEC] flex items-center justify-between bg-white shrink-0">
                 <button className="flex items-center gap-2 text-[15px] font-medium text-[#616161] hover:text-[#161616] transition-colors rounded-[25px] hover:bg-[#FAFAF9] px-3 py-1.5 -ml-2">
                   <Settings2 className="w-4 h-4" />
                   Manage apps
                 </button>
                 <button className="flex items-center gap-2 px-4 py-2 bg-[#161616] hover:bg-[#333333] rounded-[25px] text-[15px] font-semibold text-white transition-colors">
                   View all apps
                   <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Side Panel */}
      <AnimatePresence>
        {showProfileMenu && user && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
              onClick={() => setShowProfileMenu(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-[101] flex flex-col"
            >
               {/* Header Info */}
               <div className="relative p-6 bg-gradient-to-br from-slate-50 to-white border-b border-gray-100 flex flex-col items-center text-center">
                 <button onClick={() => setShowProfileMenu(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 z-10">
                   <X className="w-4 h-4" />
                 </button>
                 
                 <div className="w-16 h-16 rounded-full bg-[#FFB6E1] ring-2 ring-white shadow-sm flex items-center justify-center text-[#FF2D92] font-bold text-2xl overflow-hidden mb-3 relative mt-2">
                    {!avatarLoaded && (
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100 animate-pulse" />
                    )}
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={64}
                        height={64}
                        className={`w-full h-full rounded-full object-cover transition-opacity duration-300 ${avatarLoaded ? "opacity-100" : "opacity-0"}`}
                        unoptimized
                      />
                    ) : avatarLoaded ? (
                      getInitials(user)
                    ) : null}
                 </div>
                 <h2 className="text-[16px] font-bold text-slate-900 uppercase tracking-wider">
                   {user.user_metadata?.full_name || user.user_metadata?.name || (user.user_metadata?.first_name
                     ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ?? ""}`
                     : user.email?.split('@')[0])}
                 </h2>
                 <p className="text-[13px] text-slate-400 mt-1">{user.email}</p>
                 
                 {/* Subscription Plan Box */}
                 <div className="w-full mt-5 p-4 bg-[#F4F7FA] rounded-2xl flex items-center justify-between text-left">
                   <div>
                     <div className="text-[14px] font-bold text-slate-900">
                       {user.user_metadata?.subscription_plan || "Free User"}
                     </div>
                     <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                       {user.user_metadata?.plan_expire_date || "No Plan Expire Date"}
                     </div>
                   </div>
                   <Link 
                     href="/subscriptions"
                     onClick={() => setShowProfileMenu(false)}
                     className="px-4 py-2 bg-[#FFF9E6] border border-[#FFE29A] text-[#D97706] hover:bg-[#FFF3D1] text-[12px] font-bold rounded-xl transition-all"
                   >
                     Upgrade
                   </Link>
                 </div>
               </div>
               
               {/* Action Links */}
               <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                 <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-slate-50 transition-colors text-slate-700 font-semibold group border border-transparent hover:border-slate-100">
                   <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-500 transition-all">
                     <Settings className="w-4 h-4" />
                   </div>
                   <div className="flex-1 text-[13px]">Manage Profile</div>
                   <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </Link>
                 
                 <Link href="/subscriptions" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-slate-50 transition-colors text-slate-700 font-semibold group border border-transparent hover:border-slate-100">
                   <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-500 transition-all">
                     <CreditCard className="w-4 h-4" />
                   </div>
                   <div className="flex-1 text-[13px]">Subscriptions</div>
                   <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </Link>
                 
                 <Link href="/feedback" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-slate-50 transition-colors text-slate-700 font-semibold group border border-transparent hover:border-slate-100">
                   <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-500 transition-all">
                     <MessageSquare className="w-4 h-4" />
                   </div>
                   <div className="flex-1 text-[13px]">Feedback</div>
                   <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </Link>
                 
                 <Link href="/help" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-slate-50 transition-colors text-slate-700 font-semibold group border border-transparent hover:border-slate-100">
                   <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-500 transition-all">
                     <HelpCircle className="w-4 h-4" />
                   </div>
                   <div className="flex-1 text-[13px]">Help and Support</div>
                   <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </Link>
               </div>
               
               {/* Sign Out */}
               <div className="p-4 border-t border-gray-100">
                 <button
                   onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                   className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 text-[13px] font-bold rounded-[14px] hover:bg-red-100 hover:text-red-600 transition-colors active:scale-95"
                 >
                   <LogOut className="w-4 h-4" />
                   Sign Out
                 </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
