"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ServiceIcon,
  OfficeIcon,
  PackageIcon,
  Wallet02Icon,
  UserGroupIcon,
  Money02Icon,
  KanbanIcon,
  BookOpen01Icon,
  CustomerServiceIcon,
  Calendar01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";

const NAV_LINKS = [
  { name: "Services", href: "/#services", icon: ServiceIcon, hasDropdown: false },
  { name: "About us", href: "/#about", icon: OfficeIcon, hasDropdown: false },
  { name: "Products", href: "#", icon: PackageIcon, hasDropdown: true },
  { name: "Pricings", href: "/pricing", icon: Wallet02Icon, hasDropdown: false },
];

const PRODUCTS = [
  {
    name: "Xentra People",
    domain: "xentrapeople.dortasia.com",
    description: "Complete HR, Payroll & Workforce Management",
    logoSrc: "/apps-logo/xentra-bluelogo.svg",
    icon: UserGroupIcon,
    url: "https://xentrapeople.dortasia.com",
  },
  {
    name: "Xentra Paynote",
    domain: "xentrapaynote.dortasia.com",
    description: "Smart Accounting & Financial Intelligence",
    logoSrc: "/apps-logo/xentra_paynote.svg",
    bgClass: "bg-gradient-to-b from-[#27272a] via-[#18181b] to-[#09090b] border-zinc-700/60",
    icon: Wallet02Icon,
    url: "https://xentrapaynote.dortasia.com",
  },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none font-text">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-transparent h-[120px] -z-10" />
      <div className="w-full flex items-center justify-between h-14 relative pointer-events-auto pt-[20px] px-6 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 z-50">
          <Image
            src="/company_logo/DortAsiaLogo.svg"
            alt="Dort Asia Logo"
            width={120}
            height={49}
            className="h-8 md:h-9 w-auto block object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation - Frosted Dark Grey Glossy Pill Bar */}
        <nav className="hidden lg:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 rounded-full bg-[#18181b]/85 backdrop-blur-2xl border border-white/20 shadow-none p-1.5 z-50">
          {NAV_LINKS.map((link) => (
            <div
              key={link.name}
              onClick={() => {
                if (link.hasDropdown) {
                  toggleDropdown(link.name);
                } else if (link.href) {
                  router.push(link.href);
                }
              }}
              className={`relative cursor-pointer group rounded-full px-4 py-2 hover:bg-white/15 transition-all flex items-center gap-2 ${
                activeDropdown === link.name ? "bg-white/20" : ""
              }`}
            >
              <HugeiconsIcon icon={link.icon} className="w-5 h-5 text-zinc-300 group-hover:text-white group-hover:scale-110 transition-all" />
              <span className="text-[14px] font-medium text-white tracking-tight transition-colors">
                {link.name}
              </span>
              {link.hasDropdown && (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className={`w-4 h-4 text-zinc-400 group-hover:text-white transition-transform ${
                    activeDropdown === link.name ? "rotate-180 text-white" : ""
                  }`}
                />
              )}
            </div>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Button
            onClick={handlePrimaryAction}
            className="group rounded-full bg-[#2b7fff] hover:bg-[#1a6eff] text-white font-medium text-[14.5px] tracking-tight pl-6 pr-1.5 py-1.5 h-auto flex items-center gap-3 transition-all shadow-none"
          >
            <span className="font-medium">{isAuthenticated ? "Dashboard" : "Get Started"}</span>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black transition-transform group-hover:scale-105">
              <ArrowUpRight className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden z-50 p-2 text-[#1a1a1a]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Clean 2-Column Dropdown Panel */}
      <AnimatePresence>
        {activeDropdown === "Products" && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block absolute top-[75px] left-1/2 -translate-x-1/2 w-[840px] max-w-[calc(100vw-40px)] bg-white rounded-[25px] shadow-[0_30px_90px_rgba(0,0,0,0.12)] border border-gray-100 p-7 pointer-events-auto z-40"
          >
            <div className="grid grid-cols-12 gap-7">
              {/* Column 1: PRODUCTS (7 cols) */}
              <div className="col-span-7 flex flex-col gap-2">
                <span className="text-[11px] font-semibold tracking-[0.06em] text-[#86868b] uppercase mb-2 block">
                  PRODUCTS
                </span>
                {PRODUCTS.map((prod) => (
                  <Link
                    key={prod.name}
                    href={prod.url}
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-[#f5f5f7] transition-colors group/item"
                  >
                    <div className={`w-[42px] h-[42px] rounded-[11px] border transition-all shrink-0 p-2 flex items-center justify-center ${prod.bgClass || "border-gray-200/80 bg-white text-gray-700"}`}>
                      {prod.logoSrc ? (
                        <Image
                          src={prod.logoSrc}
                          alt={prod.name}
                          width={28}
                          height={28}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <HugeiconsIcon icon={prod.icon} className="w-5 h-5 text-gray-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <span className="font-semibold text-[14px] text-gray-900 transition-colors block leading-tight">
                        {prod.name}
                      </span>
                      <p className="text-[12px] text-gray-500 line-clamp-1 mt-1 group-hover/item:text-gray-600 transition-colors">
                        {prod.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Column 2: EXPLORE (5 cols) */}
              <div className="col-span-5 bg-[#f8fafc] rounded-[20px] p-4.5 border border-slate-100/90 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold tracking-[0.06em] text-[#86868b] uppercase mb-2.5 block">
                    EXPLORE
                  </span>
                  <div className="space-y-2.5">
                    {/* Help */}
                    <Link
                      href="#"
                      onClick={() => setActiveDropdown(null)}
                      className="group/exp block bg-white p-3 rounded-xl border border-slate-200/60 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2b7fff] flex items-center justify-center shrink-0 mt-0.5">
                          <HugeiconsIcon icon={BookOpen01Icon} className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[13.5px] text-gray-900 transition-colors block">
                            Help
                          </span>
                          <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug group-hover/exp:text-gray-600 transition-colors">
                            Guides, setup tutorials, and FAQs to get started.
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Contact */}
                    <Link
                      href="#"
                      onClick={() => setActiveDropdown(null)}
                      className="group/exp block bg-white p-3 rounded-xl border border-slate-200/60 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <HugeiconsIcon icon={CustomerServiceIcon} className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[13.5px] text-gray-900 transition-colors block">
                            Contact
                          </span>
                          <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug group-hover/exp:text-gray-600 transition-colors">
                            Talk to sales and get enterprise support.
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Book Demo */}
                    <Link
                      href="#"
                      onClick={() => setActiveDropdown(null)}
                      className="group/exp block bg-white p-3 rounded-xl border border-slate-200/60 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                          <HugeiconsIcon icon={Calendar01Icon} className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[13.5px] text-gray-900 transition-colors block">
                            Book Demo
                          </span>
                          <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug group-hover/exp:text-gray-600 transition-colors">
                            Schedule a live 1-on-1 walkthrough with our team.
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Banner */}
            <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7.5 h-7.5 rounded-full bg-blue-50 text-[#2b7fff] flex items-center justify-center font-bold">
                  <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4" />
                </div>
                <span className="text-[13.5px] text-gray-600 font-medium">
                  <strong className="text-gray-900 font-semibold">Want a Live Demo?</strong> Take Dort Asia for a Test Drive
                </span>
              </div>
              <Button
                onClick={() => {
                  setActiveDropdown(null);
                  handlePrimaryAction();
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-[13px] px-4 py-1.5 h-auto rounded-lg shadow-none border border-gray-200/60 transition-colors"
              >
                {isAuthenticated ? "Dashboard" : "Get Started"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-xl p-6 flex flex-col gap-4 lg:hidden rounded-2xl mt-2 mx-4 pointer-events-auto"
          >
            {NAV_LINKS.map((link) => (
              <div key={link.name} className="border-b border-border/50 py-2">
                <div
                  onClick={() => {
                    if (link.hasDropdown) {
                      toggleDropdown(link.name);
                    } else if (link.href) {
                      setIsMobileMenuOpen(false);
                      router.push(link.href);
                    }
                  }}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={link.icon} className="w-5 h-5 text-[#2b7fff]" />
                    <span className="text-base font-semibold text-[#1a1a1a]">{link.name}</span>
                  </div>
                  {link.hasDropdown && (
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      className={`w-5 h-5 opacity-50 transition-transform ${
                        activeDropdown === link.name ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>

                {/* Mobile Dropdown Submenu */}
                {link.hasDropdown && activeDropdown === link.name && (
                  <div className="pl-8 pt-2 pb-2 flex flex-col gap-3">
                    {PRODUCTS.map((prod) => (
                      <Link
                        key={prod.name}
                        href={prod.url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50"
                      >
                        <div className={`w-10 h-10 rounded-[10px] border transition-all shrink-0 p-1.5 flex items-center justify-center ${prod.bgClass || "border-gray-200/80 bg-white text-[#2b7fff]"}`}>
                          {prod.logoSrc ? (
                            <Image
                              src={prod.logoSrc}
                              alt={prod.name}
                              width={20}
                              height={20}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <HugeiconsIcon icon={prod.icon} className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-[#1a1a1a] block">{prod.name}</span>
                          <span className="text-[11px] text-gray-400 block">{prod.domain}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="flex flex-col mt-4">
              <Button onClick={handlePrimaryAction} className="group w-full rounded-full bg-[#2b7fff] hover:bg-[#1a6eff] text-white font-medium text-base pl-6 pr-2 py-2.5 h-auto flex items-center justify-between transition-all">
                <span>{isAuthenticated ? "Dashboard" : "Get Started"}</span>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black">
                  <ArrowUpRight className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
