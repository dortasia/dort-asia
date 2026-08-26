"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Home01Icon, 
  Store01Icon, 
  Notification01Icon, 
  UserIcon, 
  CreditCardIcon, 
  Logout01Icon, 
  ArrowRight01Icon, 
  ArrowLeft01Icon,
  Building03Icon,
  Menu01Icon,
  Cancel01Icon,
  Layers01Icon,
  Shield01Icon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";
import { useNotifications, NotificationItem } from "@/hooks/useNotifications";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { getAppInfoForNotification } from "@/utils/notification-helpers";

const cardVariants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    y: 16,
    rotateX: -12,
    filter: "blur(2px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 340,
      damping: 26,
      mass: 0.7,
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    scale: 0.92,
    y: -24,
    rotateZ: dir > 0 ? -3 : 3,
    rotateX: 10,
    filter: "blur(3px)",
    transition: {
      duration: 0.28,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  }),
};
function StackedNotificationCard({
  notifications,
  onDismiss,
  onClick,
}: {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onClick?: (notif: NotificationItem) => void;
}) {
  const unreadList = notifications.filter((n) => n.unread);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  // Keep index valid
  useEffect(() => {
    if (activeIdx >= unreadList.length && unreadList.length > 0) {
      setActiveIdx(0);
    }
  }, [unreadList.length, activeIdx]);

  // 15-second rotation timer
  useEffect(() => {
    if (unreadList.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setDirection(1);
      setActiveIdx((prev) => (prev + 1) % unreadList.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [unreadList.length, isPaused]);

  if (unreadList.length === 0) return null;

  const currentNotif = unreadList[activeIdx] || unreadList[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(1);
    setActiveIdx((prev) => (prev + 1) % unreadList.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(-1);
    setActiveIdx((prev) => (prev - 1 + unreadList.length) % unreadList.length);
  };

  return (
    <div 
      className="relative mb-2.5 pt-3 px-0.5 select-none [perspective:1000px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Stack Layer 2 (Furthest card in deck) */}
      {unreadList.length >= 3 && (
        <motion.div 
          animate={{
            scale: 0.90,
            y: -10,
            opacity: 0.5,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute top-0 inset-x-4 h-[92px] rounded-[22px] bg-gradient-to-b from-blue-100/50 to-blue-50/20 border border-blue-200/50 shadow-2xs -z-20 pointer-events-none"
        />
      )}

      {/* 3D Stack Layer 1 (Middle card in deck) */}
      {unreadList.length >= 2 && (
        <motion.div 
          animate={{
            scale: 0.95,
            y: -5,
            opacity: 0.85,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute top-0 inset-x-2 h-[96px] rounded-[22px] bg-gradient-to-b from-blue-50 to-white/80 border border-blue-200/70 shadow-xs -z-10 pointer-events-none" 
        />
      )}

      {/* Front Active Interactive Card */}
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={currentNotif.id}
          custom={direction}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 bg-white/95 backdrop-blur-md border border-blue-200/90 rounded-[22px] p-3.5 shadow-md hover:shadow-lg hover:border-blue-300 transition-all overflow-hidden cursor-pointer group/card [transform-style:preserve-3d]"
          onClick={() => onClick && onClick(currentNotif)}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

          {/* 15s Smooth Progress Countdown Bar */}
          {unreadList.length > 1 && !isPaused && (
            <motion.div
              key={`progress-${currentNotif.id}-${activeIdx}`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 15, ease: "linear" }}
              className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            />
          )}

          {/* Header Row */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[12px] font-medium text-gray-400 truncate">{currentNotif.time}</span>

            {/* Dismiss (Mark Read) Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(currentNotif.id);
              }}
              title="Mark as read"
              className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title & Message */}
          <div className="flex items-start gap-3 mt-0.5">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-center shadow-2xs overflow-hidden">
              {currentNotif.metadata?.appLogo ? (
                <img src={currentNotif.metadata.appLogo} alt="App Logo" className="w-5 h-5 object-contain" />
              ) : (
                <HugeiconsIcon icon={Notification01Icon} className="w-4.5 h-4.5 text-blue-600" />
              )}
            </div>
            <div className="space-y-0.5 pt-0.5">
              <h5 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover/card:text-blue-600 transition-colors">
                {currentNotif.title}
              </h5>
              <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 font-normal">
                {currentNotif.message}
              </p>
            </div>
          </div>

          {/* Footer Controls & Stack Pagination */}
          {unreadList.length > 1 && (
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100/90 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 text-[10.5px]">
                  {activeIdx + 1} / {unreadList.length}
                </span>
                {/* Visual mini-dots for deck indicator */}
                <div className="flex items-center gap-1 ml-0.5">
                  {unreadList.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === activeIdx ? "w-3 bg-blue-600" : "w-1 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const getCountryName = (code?: string) => {
  if (!code || code === "SG") return "Singapore";
  const countryMap: Record<string, string> = {
    SG: "Singapore",
    MY: "Malaysia",
    ID: "Indonesia",
    TH: "Thailand",
    VN: "Vietnam",
    PH: "Philippines",
    US: "United States",
    GB: "United Kingdom",
    IN: "India",
    AU: "Australia",
    JP: "Japan",
    KR: "South Korea",
    CN: "China",
    HK: "Hong Kong",
    TW: "Taiwan",
    DE: "Germany",
    FR: "France",
    CA: "Canada",
    AE: "United Arab Emirates",
  };
  return countryMap[code.toUpperCase()] || code;
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [companyName, setCompanyName] = useState("DORT Asia");
  const [companyLogo, setCompanyLogo] = useState<string>("/icons/company-profile.svg");
  const [companyCountry, setCompanyCountry] = useState("Singapore");
  const [userEmail, setUserEmail] = useState("");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [activeSubscriptionsCount, setActiveSubscriptionsCount] = useState<number>(0);

  // Real-time Supabase notifications hook
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch company & user info
  const fetchCompanyAndSubscription = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        // Fetch company logo from metadata
        const metaLogo = user.user_metadata?.company_logo || user.user_metadata?.companyLogo;
        if (metaLogo) {
          setCompanyLogo(metaLogo);
        }

        let companyFound = false;
        const res = await fetch("/api/user/company", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.company) {
            if (data.company.company_name) {
              setCompanyName(data.company.company_name);
              companyFound = true;
            }
            if (data.company.country_code) {
              setCompanyCountry(getCountryName(data.company.country_code));
            }
          }
        }

        if (!companyFound) {
          const metaCompany = user.user_metadata?.companyName || user.user_metadata?.company_name;
          if (metaCompany) {
            setCompanyName(metaCompany);
          } else {
            const metaFirst = user.user_metadata?.first_name || user.user_metadata?.firstName || user.user_metadata?.full_name?.split(' ')[0];
            if (metaFirst) {
              setCompanyName(`${metaFirst}'s Workspace`);
            } else {
              setCompanyName("My Workspace");
            }
          }
        }
      }
    } catch {
      // Silent catch
    }

    try {
      const res = await fetch("/api/user/subscription", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.hasSubscription && data.plan) {
          setHasSubscription(true);
          setPlanName(data.plan);
          setActiveSubscriptionsCount(data.activeCount ?? 1);
        } else if (data.plan) {
          setHasSubscription(true);
          setPlanName(data.plan);
          setActiveSubscriptionsCount(data.activeCount ?? 1);
        } else {
          setHasSubscription(false);
          setPlanName("");
          setActiveSubscriptionsCount(data.activeCount ?? 0);
        }
      }
    } catch {
      // Unsubscribed / free
    }
  }, []);

  useEffect(() => {
    fetchCompanyAndSubscription();

    const handleLogoUpdate = () => {
      fetchCompanyAndSubscription();
    };

    window.addEventListener("company-logo-updated", handleLogoUpdate);
    return () => window.removeEventListener("company-logo-updated", handleLogoUpdate);
  }, [fetchCompanyAndSubscription]);

  const { isAdmin, role } = useAdminStatus();

  const handleSignOut = async () => {
    const supabase = createClient();
    await fetch('/api/auth/login-method', { method: 'DELETE' }).catch(() => {});
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const mainNavItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home01Icon,
      active: pathname === "/dashboard",
    },
    {
      name: "Marketplace",
      href: "/dashboard/marketplace",
      icon: Store01Icon,
      active: pathname === "/dashboard/marketplace" || pathname.startsWith("/dashboard/marketplace"),
    },
    ...(isAdmin
      ? [
          {
            name: "Admin Control",
            href: "/dashboard/admin",
            icon: Shield01Icon,
            active: pathname.startsWith("/dashboard/admin"),
            badge: role === "SUPER_ADMIN" ? "Super" : "Admin",
          },
        ]
      : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 select-none">
      {/* Top: Brand & Main Navigation */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="px-3 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <img src="/company_logo/DortAsiaLogo.svg" alt="Dort Asia" className="h-6" />
          </Link>
          {isMobileOpen && (
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {mainNavItems.map((item: any) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                item.active
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon 
                  icon={item.icon} 
                  className={`w-4.5 h-4.5 ${item.active ? "text-white" : "text-gray-500"}`} 
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                  item.active ? "bg-white/20 text-white" : "bg-purple-50 text-purple-700 border border-purple-200"
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom: Notifications & Company Profile */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        {/* Stacked Unread Notification Card (Auto-cycles every 15s) */}
        <StackedNotificationCard
          notifications={notifications}
          onDismiss={dismissNotification}
          onClick={(notif) => {
            if (notif && notif.unread) markAsRead(notif.id);
            if (notif && notif.actionUrl) {
              router.push(notif.actionUrl);
            } else {
              setIsNotifOpen(true);
              setIsProfileOpen(false);
            }
          }}
        />

        {/* Notifications Button & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
              isNotifOpen
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <HugeiconsIcon icon={Notification01Icon} className="w-4.5 h-4.5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
                )}
              </div>
              <span>Notifications</span>
            </div>

            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-full border border-blue-200/50">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown / Popover */}
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/80 p-4 z-50 text-gray-900"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-semibold text-gray-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10.5px] font-bold bg-blue-600 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 text-[12.5px]">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => {
                          if (notif.unread) markAsRead(notif.id);
                          if (notif.actionUrl) {
                            router.push(notif.actionUrl);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-start gap-2.5 ${
                          notif.unread ? "bg-blue-50/50 border border-blue-100/60" : "hover:bg-gray-50"
                        }`}
                      >
                        {(() => {
                          const appInfo = getAppInfoForNotification(notif);
                          const displayTitle = appInfo?.subscription ? appInfo.subscription.title : notif.title;
                          const displayDesc = appInfo?.subscription ? appInfo.subscription.description : notif.message;

                          return (
                            <>
                              {appInfo ? (
                                <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-[10px] border shadow-2xs flex items-center justify-center p-1.5 overflow-hidden ${appInfo.iconBg}`}>
                                  <img src={appInfo.icon} alt={appInfo.name} className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-blue-50/50 border border-blue-100/50 flex items-center justify-center overflow-hidden">
                                  <HugeiconsIcon icon={Notification01Icon} className="w-4 h-4 text-blue-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="text-[13px] font-semibold text-gray-900 line-clamp-1">{displayTitle}</h5>
                                  <span className="text-[11px] text-gray-400 shrink-0">{notif.time}</span>
                                </div>
                                <p className="text-[12px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{displayDesc}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ))
                  )}
                </div>

                {/* Link to Full Notifications Center */}
                <div className="pt-2.5 border-t border-gray-100 text-center">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <span>View all notifications</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Company Profile Card & Popover */}
        <div className="relative pt-1" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left group cursor-pointer ${
              isProfileOpen
                ? "bg-gray-100 border-gray-300 shadow-sm"
                : "bg-gray-50/60 hover:bg-gray-100/80 border-gray-200/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                <img 
                  src={companyLogo} 
                  alt={companyName} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-gray-900 truncate leading-tight">
                  {companyName}
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5 font-medium truncate">
                  {companyCountry}
                </p>
              </div>
            </div>
            
            <HugeiconsIcon 
              icon={ArrowRight01Icon} 
              className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform ${
                isProfileOpen ? "rotate-90 text-gray-700" : ""
              }`} 
            />
          </button>

          {/* Profile Dropdown / Popover */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-[24px] shadow-2xl border border-gray-200/90 p-4 z-50 text-gray-900"
              >
                {/* Company Header Card */}
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsMobileOpen(false);
                    router.push("/dashboard/settings/company");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-[18px] bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60 cursor-pointer transition-colors mb-3 text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-[14px] bg-[#f6f6f6] flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                      <img 
                        src={companyLogo} 
                        alt={companyName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[14.5px] font-semibold text-gray-900 truncate leading-tight">
                        {companyName}
                      </h4>
                      <p className="text-[12px] text-gray-500 mt-0.5 font-medium truncate">
                        {userEmail || "Company Profile"}
                      </p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-gray-400 group-hover:text-gray-700 shrink-0 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Navigation Links */}
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsMobileOpen(false);
                      router.push("/dashboard/settings/company");
                    }}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-[13.5px] font-medium text-left cursor-pointer"
                  >
                    <HugeiconsIcon icon={Building03Icon} className="w-4.5 h-4.5 text-gray-500" />
                    <span>Company Profile</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsMobileOpen(false);
                      router.push("/dashboard/settings/account");
                    }}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-[13.5px] font-medium text-left cursor-pointer"
                  >
                    <HugeiconsIcon icon={UserIcon} className="w-4.5 h-4.5 text-gray-500" />
                    <span>Account Settings</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsMobileOpen(false);
                      router.push("/dashboard/subscriptions");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-[13.5px] font-medium text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <HugeiconsIcon icon={Layers01Icon} className="w-4.5 h-4.5 text-gray-500" />
                      <span>App Subscriptions</span>
                    </div>
                    {activeSubscriptionsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold text-[11px] border border-blue-100/60 min-w-[20px] text-center">
                        {activeSubscriptionsCount}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium text-[11px] min-w-[20px] text-center">
                        0
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsMobileOpen(false);
                      router.push("/dashboard/settings/billing");
                    }}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-[13.5px] font-medium text-left cursor-pointer"
                  >
                    <HugeiconsIcon icon={CreditCardIcon} className="w-4.5 h-4.5 text-gray-500" />
                    <span>Billing & Invoices</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="my-2 border-t border-gray-100" />

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold transition-colors text-[13.5px] text-left cursor-pointer"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="w-4.5 h-4.5 text-rose-600 stroke-[2]" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/company_logo/DortAsiaLogo.svg" alt="Dort Asia" className="h-6" />
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Menu01Icon} className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-72 bg-white border-r border-gray-200 z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sticky/Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 shrink-0 bg-white border-r border-gray-200/80 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
