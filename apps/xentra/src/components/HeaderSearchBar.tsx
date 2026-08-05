"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, User, Settings, Network, LogOut, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { createClient } from "@/utils/supabase/client";
import { getUserAvatarUrl } from "@/utils/avatarColor";
import { 
  Notification01Icon, 
  UserIcon, 
  Diamond01Icon, 
  MagicWand01Icon, 
  ToggleOffIcon, 
  CheckmarkCircle01Icon, 
  Logout01Icon,
  Luggage01Icon 
} from 'hugeicons-react';
import { StreamlineNotifications } from "@/components/StreamlineIcons";

type RecentNotification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
};

export default function HeaderSearchBar() {
  const router = useRouter();
  const { setSpotlightOpen, cachedSidebar } = useAppStore();
  const userName = cachedSidebar?.userProfile?.name?.split(" ")[0] || "there";
  const cachedAvatar = cachedSidebar?.userProfile?.avatarUrl;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(cachedAvatar || null);
  const [fullUserName, setFullUserName] = useState<string>(cachedSidebar?.userProfile?.name || "User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Super Admin");

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifs, setRecentNotifs] = useState<RecentNotification[]>([]);

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [phrases, setPhrases] = useState<string[]>([
    `Hey ${userName}, Search something`,
    `Ctrl + K to search something`
  ]);
  const [shortcutLabel, setShortcutLabel] = useState("⌘ K");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Detect platform on mount
  useEffect(() => {
    const isMac = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("mac");
    const shortcut = isMac ? "⌘ + K" : "Ctrl + K";
    setShortcutLabel(isMac ? "⌘ K" : "Ctrl K");
    setPhrases([
      `Hey ${userName}, Search something`,
      `${shortcut} to search something`
    ]);
  }, [userName]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [phrases.length]);

  // Click outside listener for dropdown popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch live notifications, unread count & user profile
  useEffect(() => {
    let mounted = true;
    let channel: any = null;
    const supabase = createClient();

    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      setUserEmail(user.email || "");

      let dispName = user.user_metadata?.full_name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim();
      if (!dispName) dispName = user.email?.split("@")[0] || "User";
      setFullUserName(dispName);

      // Fetch Employee record for avatar and role
      const { data: emp } = await supabase
        .from("employees")
        .select("id, avatar_url, role")
        .eq("email", user.email)
        .maybeSingle();

      if (!mounted) return;

      if (emp?.avatar_url) {
        setAvatarUrl(emp.avatar_url);
      } else {
        setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
      }

      if (emp?.role) {
        setUserRole(emp.role);
      }

      // Fetch initial notifications
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (emp?.id) {
        query = query.eq("employee_id", emp.id);
      } else {
        query = query.is("employee_id", null);
      }

      const { data: notifsData } = await query;
      if (notifsData && mounted) {
        setRecentNotifs(notifsData);
        setUnreadCount(notifsData.filter((n: any) => !n.is_read).length);
      }

      if (!mounted) return;

      // Subscribe to real-time notification inserts using a unique channel name per component instance
      const channelName = `header_notifs_${user.id}_${Math.random().toString(36).slice(2, 7)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload: any) => {
            if (!mounted) return;
            if (payload.new.employee_id === emp?.id || (!emp?.id && payload.new.employee_id === null)) {
              setRecentNotifs((prev) => [payload.new as RecentNotification, ...prev].slice(0, 10));
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();
    }

    loadUserData();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleMarkAllRead = async () => {
    const supabase = createClient();
    const unreadIds = recentNotifs.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    }
    setRecentNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3">
      {/* Search Bar Pill */}
      <div 
        onClick={() => setSpotlightOpen(true)}
        className="group relative flex items-center h-[42px] min-w-[320px] bg-white dark:bg-[#1A1A1C] border border-[#D1D5DB] dark:border-white/20 rounded-full px-4 cursor-text transition-all duration-300 hover:border-gray-400"
      >
        <Search className="h-5 w-5 text-[#A1A1AA] shrink-0" />
        
        <div className="flex-1 ml-3 h-full flex items-center overflow-hidden">
          <span className={`text-[14px] font-medium text-[#A1A1AA] whitespace-nowrap transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
            {phrases[phraseIndex]}
          </span>
        </div>

        <div className="flex items-center shrink-0 ml-2">
          <span className="text-[14px] font-medium text-[#A1A1AA] tracking-wide">
            {shortcutLabel}
          </span>
        </div>
      </div>

      {/* Notification Bell & Menu Wrapper */}
      <div className="relative" ref={notifRef}>
        <button 
          onClick={() => {
            setShowNotifMenu(!showNotifMenu);
            if (showProfileMenu) setShowProfileMenu(false);
          }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-200/50 transition-colors focus:outline-none"
        >
          <Notification01Icon size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[11px] font-bold text-white shadow-sm font-rounded">
              {unreadCount > 9 ? "+9" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown Menu */}
        {showNotifMenu && (
          <div className="absolute right-0 mt-3 w-[380px] rounded-[24px] bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-4.5 z-50 font-sans text-gray-900">
            <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto page-scrollbar pr-1">
              {[
                { 
                  title: 'New Leave Request', 
                  desc: 'Sarah submitted a sick leave request', 
                  time: '10m ago', 
                  icon: <Luggage01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                },
                { 
                  title: 'Claim Approval', 
                  desc: 'Krishna submitted a travel expense claim', 
                  time: '1h ago', 
                  icon: <UserIcon size={20} strokeWidth={1.5} className="text-gray-700" />
                },
                { 
                  title: 'Company Update', 
                  desc: 'New policy update published by HR', 
                  time: '3h ago', 
                  icon: <Notification01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                },
                { 
                  title: 'System Alert', 
                  desc: 'Monthly storage cleanup completed', 
                  time: '5h ago', 
                  icon: <CheckmarkCircle01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl flex gap-3.5 items-start hover:bg-gray-100/70 transition-colors cursor-pointer">
                  <div className="mt-0.5 shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-semibold text-[#111827] font-sans truncate">{item.title}</span>
                      <span className="text-[11px] text-[#9CA3AF] font-sans shrink-0 ml-2">{item.time}</span>
                    </div>
                    <p className="text-[12px] font-medium text-[#6B7280] font-sans mt-0.5 leading-snug truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100 mt-2 text-center">
              <Link href="/notifications" onClick={() => setShowNotifMenu(false)} className="text-[12px] font-normal text-[#007AFF] font-sans hover:underline">View all notifications</Link>
            </div>
          </div>
        )}
      </div>
      {/* User Profile Avatar & Menu Wrapper */}
      <div className="relative" ref={profileRef}>
        <button 
          onClick={() => {
            setShowProfileMenu(!showProfileMenu);
            setShowNotifMenu(false);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFEFEF] border border-gray-200/80 text-[#C7C7C7] hover:ring-2 hover:ring-gray-200 transition-all focus:outline-none overflow-hidden"
        >
          {avatarUrl || cachedAvatar ? (
            <img src={getUserAvatarUrl(avatarUrl || cachedAvatar)} alt="User Profile" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full scale-125 translate-y-[2px]">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </button>

        {/* Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute right-0 mt-3 w-[240px] rounded-[24px] bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-2 z-50 font-sans font-medium text-gray-900">
            <div className="flex flex-col gap-0.5">
              <Link href="/onboarding/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                <UserIcon size={20} strokeWidth={1.5} className="text-gray-700" />
                <span className="text-[15px]">Profile</span>
              </Link>
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                <Diamond01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                <span className="text-[15px]">Subscription</span>
              </button>
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-100/70 hover:bg-gray-100 transition-colors text-left w-full">
                <MagicWand01Icon size={20} strokeWidth={1.5} className="text-gray-900" />
                <span className="text-[15px] text-gray-900">Inspirations</span>
              </button>
              <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                <ToggleOffIcon size={20} strokeWidth={1.5} className="text-gray-700" />
                <span className="text-[15px]">Settings</span>
              </Link>
              
              <div className="h-[1px] bg-gray-100 my-1.5 mx-2"></div>
              
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                <CheckmarkCircle01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                <span className="text-[15px]">Updates</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                <Logout01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                <span className="text-[15px]">Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
