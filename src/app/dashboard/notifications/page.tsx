"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  KeyRound, 
  Monitor, 
  Smartphone, 
  Laptop, 
  Globe, 
  Clock, 
  Check, 
  X, 
  ArrowRight, 
  CreditCard, 
  Layers, 
  Info, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useNotifications, NotificationItem } from "@/hooks/useNotifications";
import { getAppInfoForNotification } from "@/utils/notification-helpers";

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeTab === "unread") return notif.unread;
      if (activeTab === "billing") return notif.type === "billing";
      if (activeTab === "subscription") return notif.type === "subscription";
      if (activeTab === "security") return notif.type === "security";
      if (activeTab === "system") return notif.type === "system";
      return true;
    });
  }, [notifications, activeTab]);

  // If selected notification is removed from the filtered list, reset selection
  useEffect(() => {
    if (selectedNotifId && !filteredNotifications.find(n => n.id === selectedNotifId)) {
      setSelectedNotifId(null);
    }
  }, [filteredNotifications, selectedNotifId]);

  const selectedNotif = useMemo(() => {
    return notifications.find(n => n.id === selectedNotifId);
  }, [notifications, selectedNotifId]);

  const tabs = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "subscription", label: "Subscriptions", count: notifications.filter(n => n.type === "subscription").length },
    { id: "billing", label: "Billing", count: notifications.filter(n => n.type === "billing").length },
    { id: "security", label: "Security", count: notifications.filter(n => n.type === "security").length },
  ];

  return (
    <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] text-gray-900 dark:text-gray-100 space-y-6">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-blue-600 text-white shadow-xs">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
            Stay updated with workspace subscriptions, payments, and account security events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 text-[13px] font-medium rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-gray-500" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs font-semibold"
                : "bg-gray-100/80 dark:bg-zinc-800/80 hover:bg-gray-200/80 dark:hover:bg-zinc-700/80 text-gray-600 dark:text-gray-400"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id 
                  ? "bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900" 
                  : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3. Main Content: List + Detail Pane */}
      <div className="flex flex-col lg:flex-row items-start gap-6 pt-2">
        
        {/* Left Column: Notification Feed */}
        <div className={`w-full transition-all duration-200 ${
          selectedNotif ? "lg:w-7/12 xl:w-7/12" : "max-w-4xl"
        } space-y-3`}>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 dark:bg-zinc-800/60 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-gray-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">All caught up!</h3>
              <p className="text-[13.5px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                You have no notifications in this category. New security events and alerts will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((notif) => {
                const isSelected = notif.id === selectedNotifId;
                const eventConfig = getSecurityEventConfig(notif);

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.unread) markAsRead(notif.id);
                      setSelectedNotifId(notif.id);
                    }}
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4.5 transition-all flex items-start gap-4 group cursor-pointer ${
                      isSelected
                        ? "border-blue-500/80 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/20 shadow-sm"
                        : notif.unread
                        ? "border-blue-200/90 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 shadow-2xs"
                        : "border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    {/* Feed Item Icon Badge - Marketplace App Logo Frame */}
                    {(() => {
                      const appInfo = getAppInfoForNotification(notif);
                      if (appInfo) {
                        return (
                          <div className={`w-10 h-10 rounded-[13px] overflow-hidden shrink-0 border flex items-center justify-center p-2 ${appInfo.iconBg}`}>
                            <img 
                              src={appInfo.icon} 
                              alt={appInfo.name} 
                              className="w-full h-full object-contain" 
                            />
                          </div>
                        );
                      }
                      return (
                        <div className={`w-8.5 h-8.5 rounded-[9px] flex items-center justify-center shrink-0 ${eventConfig.iconBg}`}>
                          <FeedItemIcon type={eventConfig.iconType} />
                        </div>
                      );
                    })()}

                    {/* Content Preview */}
                    {(() => {
                      const appInfo = getAppInfoForNotification(notif);
                      const displayTitle = appInfo?.subscription ? appInfo.subscription.title : eventConfig.title;
                      const displayDesc = appInfo?.subscription ? appInfo.subscription.description : notif.message;

                      return (
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className={`text-[14px] text-gray-900 dark:text-white truncate ${
                                notif.unread ? "font-bold" : "font-semibold"
                              }`}>
                                {displayTitle}
                              </h4>
                              {notif.unread && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </div>
                            <span className="text-[11.5px] text-gray-400 dark:text-gray-500 shrink-0">{notif.time}</span>
                          </div>

                          <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-snug line-clamp-2">
                            {displayDesc}
                          </p>

                          <div className="pt-1.5 flex items-center gap-1 text-[12px] font-medium text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <span>Review event</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notif.id);
                        if (selectedNotifId === notif.id) {
                          setSelectedNotifId(null);
                        }
                      }}
                      title="Dismiss notification"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Production-Grade Security Alert Detail Card */}
        {selectedNotif && (
          <div className="w-full lg:w-5/12 xl:w-5/12 sticky top-6">
            <SecurityAlertDetailPane
              notification={selectedNotif}
              onClose={() => setSelectedNotifId(null)}
              onAcknowledge={() => {
                dismissNotification(selectedNotif.id);
                setSelectedNotifId(null);
              }}
              onMarkRead={() => markAsRead(selectedNotif.id)}
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Security Alert Detail Pane Component
// ---------------------------------------------------------------------------

function SecurityAlertDetailPane({
  notification,
  onClose,
  onAcknowledge,
  onMarkRead,
}: {
  notification: NotificationItem;
  onClose: () => void;
  onAcknowledge: () => void;
  onMarkRead: () => void;
}) {
  const config = getSecurityEventConfig(notification);
  const appInfo = getAppInfoForNotification(notification);

  const formattedDate = new Date(notification.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const exactTimeStr = new Date(notification.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const displayTitle = appInfo?.subscription ? appInfo.subscription.title : config.title;
  const displayDesc = appInfo?.subscription ? appInfo.subscription.description : config.description;

  return (
    <div className="border border-gray-200/90 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm p-6 sm:p-7 min-h-[460px] flex flex-col relative animate-in fade-in-50 duration-200 text-gray-900 dark:text-gray-100">
      
      {/* 1. Header with App Logo / Security Status */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          {appInfo ? (
            <div className={`w-12 h-12 rounded-[15px] overflow-hidden shrink-0 border flex items-center justify-center p-2.5 ${appInfo.iconBg}`}>
              <img 
                src={appInfo.icon} 
                alt={appInfo.name} 
                className="w-full h-full object-contain" 
              />
            </div>
          ) : (
            <>
              <div className={`w-8.5 h-8.5 rounded-[9px] flex items-center justify-center shrink-0 ${config.iconBg}`}>
                <FeedItemIcon type={config.iconType} />
              </div>
              <span className={`text-[10.5px] font-bold tracking-wider px-2 py-0.5 rounded-md uppercase ${config.badgeStyle}`}>
                {config.badgeLabel}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-[12px] font-medium bg-gray-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-gray-100 dark:border-zinc-800">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Title & Explanation */}
      <div className="pt-5 space-y-1.5">
        <h2 className="text-[18px] sm:text-[19px] font-bold text-gray-900 dark:text-white tracking-tight">
          {displayTitle}
        </h2>
        <p className="text-[13.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
          {displayDesc}
        </p>
      </div>

      {/* 3. Structured Content: Security Box OR Clean SaaS Subscription Details Table */}
      {config.isSecurity ? (
        <div className="mt-5 bg-gray-50/80 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 rounded-xl p-4 divide-y divide-gray-200/50 dark:divide-zinc-800/80 text-[13px] space-y-2.5">
          {/* Device & Browser */}
          <div className="flex items-center justify-between pt-0 first:pt-0">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-gray-400" /> Device & Browser
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {config.device}
            </span>
          </div>

          {/* Operating System */}
          <div className="flex items-center justify-between pt-2.5">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-gray-400" /> Operating System
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {config.os}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between pt-2.5">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-gray-400" /> Location / Network
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {config.location}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between pt-2.5">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-400" /> Time Detected
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formattedDate} at {exactTimeStr}
            </span>
          </div>

          {/* Auth Method */}
          <div className="flex items-center justify-between pt-2.5 last:pb-0">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-gray-400" /> Auth Method
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {config.authMethod}
            </span>
          </div>
        </div>
      ) : appInfo?.subscription ? (
        <div className="mt-5 bg-gray-50/80 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 rounded-xl p-4.5 space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            SUBSCRIPTION DETAILS
          </h4>
          <div className="divide-y divide-gray-200/50 dark:divide-zinc-800/80 text-[13.5px]">
            {/* Application */}
            <div className="flex items-center justify-between pb-2.5 first:pt-0">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Application</span>
              <span className="font-semibold text-gray-900 dark:text-white">{appInfo.subscription.appName}</span>
            </div>

            {/* Plan */}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Plan</span>
              <span className="font-semibold text-gray-900 dark:text-white">{appInfo.subscription.planName}</span>
            </div>

            {/* Billing */}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Billing</span>
              <span className="font-semibold text-gray-900 dark:text-white">{appInfo.subscription.billingInterval}</span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between pt-2.5 last:pb-0">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Status</span>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>{appInfo.subscription.status}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Action Buttons */}
      {config.isSecurity ? (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 space-y-3">
          <div>
            <h4 className="text-[13.5px] font-bold text-gray-900 dark:text-white">
              {config.wasThisYouPrompt}
            </h4>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
              Review the details above. If you recognize this activity, you can safely confirm it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            {/* Primary Safe Action */}
            <button
              onClick={onAcknowledge}
              className="flex-1 h-10 px-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-gray-900 text-[13px] font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{config.primaryActionLabel}</span>
            </button>

            {/* Secondary Danger Action */}
            <Link
              href={config.dangerActionUrl}
              onClick={onMarkRead}
              className="flex-1 h-10 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center active:scale-98"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{config.dangerActionLabel}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-6 flex gap-2.5">
          {appInfo?.subscription ? (
            <a
              href={appInfo.subscription.launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMarkRead}
              className="flex-1 h-10 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-gray-900 text-[13px] font-semibold flex items-center justify-center gap-1.5 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <span>{appInfo.subscription.primaryCtaText}</span>
            </a>
          ) : notification.actionUrl ? (
            <Link
              href={notification.actionUrl}
              onClick={onMarkRead}
              className="flex-1 h-10 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-gray-900 text-[13px] font-semibold flex items-center justify-center gap-1.5 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <span>Take Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}
          <button
            onClick={onAcknowledge}
            className="flex-1 h-10 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-[13px] font-medium rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 5. Explanatory Security Footer */}
      {config.isSecurity && (
        <div className="mt-auto pt-5 text-[11.5px] text-gray-400 dark:text-gray-500 leading-relaxed border-t border-gray-100 dark:border-zinc-800/80 flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
          <span>{config.footerNote}</span>
        </div>
      )}

    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers & Event Resolver
// ---------------------------------------------------------------------------

function FeedItemIcon({ type }: { type: string }) {
  switch (type) {
    case "shield-alert":
      return <ShieldAlert className="w-4 h-4 text-white stroke-[2.25]" />;
    case "shield-check":
      return <ShieldCheck className="w-4 h-4 text-white stroke-[2.25]" />;
    case "login":
    case "key":
      return <KeyRound className="w-4 h-4 text-white stroke-[2.25]" />;
    case "billing":
      return <CreditCard className="w-4 h-4 text-white stroke-[2.25]" />;
    case "subscription":
      return <Layers className="w-4 h-4 text-white stroke-[2.25]" />;
    case "monitor":
      return <Monitor className="w-4 h-4 text-white stroke-[2.25]" />;
    default:
      return <Info className="w-4 h-4 text-white stroke-[2.25]" />;
  }
}

function formatAuthMethod(method?: string) {
  if (!method) return "Email & Password";
  switch (method.toLowerCase()) {
    case "passkey":
    case "webauthn":
      return "Passkey (FIDO2)";
    case "mfa_totp":
    case "totp":
      return "Authenticator App (TOTP)";
    case "google_oauth":
    case "google":
      return "Google Workspace SSO";
    case "sso":
      return "Enterprise SSO (SAML)";
    case "otp":
    case "magiclink":
      return "One-Time Password / Magic Link";
    case "email_password":
    default:
      return "Email & Password";
  }
}

function extractFromMessage(message?: string) {
  if (!message) return { device: undefined, location: undefined };
  const match = message.match(/detected from (.+?) near (.+?)\./i);
  if (match) {
    return {
      device: match[1],
      location: match[2],
    };
  }
  return { device: undefined, location: undefined };
}

function getSecurityEventConfig(notif: NotificationItem) {
  const meta = notif.metadata || {};
  const eventType = (meta.eventType || meta.event_type || "").toLowerCase();
  const title = notif.title || "";
  const lowerTitle = title.toLowerCase();
  const extracted = extractFromMessage(notif.message);

  // 1. Password changed
  if (eventType === "password_changed" || lowerTitle.includes("password changed") || lowerTitle.includes("password reset")) {
    return {
      isSecurity: true,
      badgeLabel: "SECURITY EVENT",
      badgeStyle: "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400",
      iconType: "key",
      iconBg: "bg-gradient-to-b from-[#60A5FA] to-[#2563EB] text-white shadow-xs shadow-blue-500/25",
      title: "Account password updated",
      description: "Your Dort Asia account password was successfully changed. If this wasn't you, your account may be compromised.",
      device: meta.browser && meta.os ? `${meta.browser} on ${meta.os}` : "Current Session",
      os: meta.os || "Windows",
      location: meta.location || meta.city || "Local Development",
      authMethod: formatAuthMethod(meta.authMethod || "email_password"),
      primaryActionLabel: "Acknowledge",
      dangerActionLabel: "I didn't do this",
      dangerActionUrl: "/dashboard/settings/security/password",
      wasThisYouPrompt: "Did you request or change this password?",
      footerNote: "If you did not change your password, secure your account immediately to recover access.",
    };
  }

  // 2. Passkey added
  if (eventType === "passkey_added" || lowerTitle.includes("passkey")) {
    return {
      isSecurity: true,
      badgeLabel: "SECURITY UPDATE",
      badgeStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400",
      iconType: "shield-check",
      iconBg: "bg-gradient-to-b from-[#34D399] to-[#059669] text-white shadow-xs shadow-emerald-500/25",
      title: "New passkey registered",
      description: "A biometric passkey / security key was successfully registered for passwordless sign-in.",
      device: meta.browser && meta.os ? `${meta.browser} on ${meta.os}` : "FIDO2 Device",
      os: meta.os || "Windows",
      location: meta.location || meta.city || "Local Development",
      authMethod: "Passkey (FIDO2)",
      primaryActionLabel: "Got it",
      dangerActionLabel: "Manage Passkeys",
      dangerActionUrl: "/dashboard/settings/account/passkeys",
      wasThisYouPrompt: "Did you add this passkey?",
      footerNote: "You can view and revoke registered passkeys anytime in your Security settings.",
    };
  }

  // 3. 2FA enabled
  if (eventType === "2fa_enabled" || lowerTitle.includes("two-factor authentication enabled") || lowerTitle.includes("2fa enabled")) {
    return {
      isSecurity: true,
      badgeLabel: "SECURITY UPDATE",
      badgeStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400",
      iconType: "shield-check",
      iconBg: "bg-gradient-to-b from-[#34D399] to-[#059669] text-white shadow-xs shadow-emerald-500/25",
      title: "Two-factor authentication enabled",
      description: "Two-factor authentication (2FA) is now active and protecting your Dort Asia workspace account.",
      device: meta.browser && meta.os ? `${meta.browser} on ${meta.os}` : "Workspace Account",
      os: meta.os || "Windows",
      location: meta.location || meta.city || "Local Development",
      authMethod: "Authenticator App (TOTP)",
      primaryActionLabel: "Got it",
      dangerActionLabel: "Review Security",
      dangerActionUrl: "/dashboard/settings/security",
      wasThisYouPrompt: "Did you enable two-factor authentication?",
      footerNote: "Your account now requires a time-based verification code on every fresh sign-in.",
    };
  }

  // 4. 2FA disabled
  if (eventType === "2fa_disabled" || lowerTitle.includes("two-factor authentication disabled") || lowerTitle.includes("2fa disabled")) {
    return {
      isSecurity: true,
      badgeLabel: "CRITICAL ALERT",
      badgeStyle: "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-400",
      iconType: "shield-alert",
      iconBg: "bg-gradient-to-b from-[#F87171] to-[#DC2626] text-white shadow-xs shadow-red-500/25",
      title: "Two-factor authentication disabled",
      description: "Two-factor authentication was turned off. Your account is now vulnerable to single-factor attacks.",
      device: meta.browser && meta.os ? `${meta.browser} on ${meta.os}` : "Workspace Account",
      os: meta.os || "Windows",
      location: meta.location || meta.city || "Local Development",
      authMethod: formatAuthMethod(meta.authMethod || "email_password"),
      primaryActionLabel: "Acknowledge",
      dangerActionLabel: "Re-enable 2FA",
      dangerActionUrl: "/dashboard/settings/security",
      wasThisYouPrompt: "Did you disable two-factor authentication?",
      footerNote: "We strongly recommend keeping two-factor authentication enabled for account safety.",
    };
  }

  // 5. Session revoked
  if (eventType === "session_revoked" || lowerTitle.includes("session revoked") || lowerTitle.includes("signed out")) {
    return {
      isSecurity: true,
      badgeLabel: "SESSION EVENT",
      badgeStyle: "bg-gray-100 text-gray-700 border border-gray-200/60 dark:bg-zinc-800 dark:text-gray-300",
      iconType: "monitor",
      iconBg: "bg-gradient-to-b from-[#9CA3AF] to-[#4B5563] text-white shadow-xs shadow-zinc-500/25",
      title: "Device session revoked",
      description: "An active device session was terminated and signed out from your account.",
      device: meta.browser && meta.os ? `${meta.browser} on ${meta.os}` : "Revoked Device",
      os: meta.os || "Windows",
      location: meta.location || meta.city || "Local Development",
      authMethod: "Session Termination",
      primaryActionLabel: "Dismiss",
      dangerActionLabel: "Active Sessions",
      dangerActionUrl: "/dashboard/settings/security",
      wasThisYouPrompt: "Did you terminate this session?",
      footerNote: "You can review and revoke any other unrecognized active devices in Security & Sessions.",
    };
  }

  // 6. Suspicious Login
  if (eventType === "suspicious_login" || lowerTitle.includes("suspicious")) {
    return {
      isSecurity: true,
      badgeLabel: "CRITICAL ALERT",
      badgeStyle: "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-400",
      iconType: "shield-alert",
      iconBg: "bg-gradient-to-b from-[#F87171] to-[#DC2626] text-white shadow-xs shadow-red-500/25",
      title: "Suspicious sign-in attempt detected",
      description: "An unusual sign-in attempt with anomalous security characteristics was detected on your account.",
      device: meta.browser ? (meta.os ? `${meta.browser} on ${meta.os}` : meta.browser) : (extracted.device || "Unrecognized Client"),
      os: meta.os || "Windows",
      location: meta.location || meta.city || extracted.location || "Local Development",
      authMethod: formatAuthMethod(meta.authMethod || "email_password"),
      primaryActionLabel: "Yes, it was me",
      dangerActionLabel: "No, secure my account",
      dangerActionUrl: notif.actionUrl || "/dashboard/settings/security",
      wasThisYouPrompt: "Was this you?",
      footerNote: "If you don't recognize this sign-in attempt, secure your account immediately to terminate active sessions and reset your password.",
    };
  }

  // 7. Standard New Sign-in Alert (New Device / New Location / Security Alert)
  if (
    notif.type === "security" ||
    eventType === "new_device" ||
    eventType === "new_location" ||
    eventType === "new_device_and_location" ||
    lowerTitle.includes("sign-in") ||
    lowerTitle.includes("sign in") ||
    lowerTitle.includes("login")
  ) {
    let alertTitle = "New sign-in to your Dort Asia account";
    if (eventType === "new_location") {
      alertTitle = "Sign-in from new location detected";
    }

    const deviceName = meta.browser ? `${meta.browser} on ${meta.os || "Windows"}` : (extracted.device || "Edge 151 on Windows");
    const locationName = meta.location || meta.city || extracted.location || "Local Development";

    return {
      isSecurity: true,
      badgeLabel: "SECURITY ALERT",
      badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400",
      iconType: "login",
      iconBg: "bg-gradient-to-b from-[#FBBF24] to-[#D97706] text-white shadow-xs shadow-amber-500/25",
      title: alertTitle,
      description: "A new sign-in was detected with your workspace credentials. Review the device and location details below.",
      device: deviceName,
      os: meta.os || "Windows",
      location: locationName,
      authMethod: formatAuthMethod(meta.authMethod || "email_password"),
      primaryActionLabel: "Yes, it was me",
      dangerActionLabel: "No, secure my account",
      dangerActionUrl: notif.actionUrl || "/dashboard/settings/security",
      wasThisYouPrompt: "Was this you?",
      footerNote: "If you don't recognize this sign-in, secure your account immediately to terminate all other active sessions and reset your credentials.",
    };
  }

  // 8. General Workspace Notifications (Billing, Subscription, System)
  const isBilling = notif.type === "billing";
  const isSub = notif.type === "subscription";

  return {
    isSecurity: false,
    badgeLabel: isBilling ? "BILLING & PAYMENT" : isSub ? "SUBSCRIPTION" : "SYSTEM UPDATE",
    badgeStyle: isBilling 
      ? "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400" 
      : isSub 
      ? "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400" 
      : "bg-gray-100 text-gray-700 border border-gray-200/60 dark:bg-zinc-800 dark:text-gray-300",
    iconType: notif.type,
    iconBg: isBilling 
      ? "bg-gradient-to-b from-[#FB923C] to-[#EA580C] text-white shadow-xs shadow-orange-500/25" 
      : isSub 
      ? "bg-gradient-to-b from-[#818CF8] to-[#4F46E5] text-white shadow-xs shadow-indigo-500/25" 
      : "bg-gradient-to-b from-[#9CA3AF] to-[#4B5563] text-white shadow-xs shadow-zinc-500/25",
    title: notif.title,
    description: notif.message,
    device: undefined,
    os: undefined,
    location: undefined,
    authMethod: undefined,
    primaryActionLabel: isSub ? "Manage Subscription" : "Take Action",
    dangerActionLabel: "Dismiss",
    dangerActionUrl: notif.actionUrl || "",
    wasThisYouPrompt: "",
    footerNote: "",
  };
}
