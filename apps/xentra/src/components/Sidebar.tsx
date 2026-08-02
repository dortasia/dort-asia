"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronsUpDown, X, Users, PlusCircle, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials, getUserAvatarUrl, getCompanyLogoUrl } from "@/utils/avatarColor";
import { useAppStore } from "@/store";
import { 
  StreamlineHome,
  StreamlineEmployees,
  StreamlineAttendance,
  StreamlineTimesheet,
  StreamlineDepartments,
  StreamlineExpiryAlerts,
  StreamlineStorage,
  StreamlineNotifications,
  StreamlineSettings,
  StreamlineSubscription
} from "@/components/StreamlineIcons";

const mainNavItems = [
  { name: "Home", href: "/", icon: StreamlineHome },
  { name: "Employees", href: "/employees", icon: StreamlineEmployees },
  { name: "Attendance", href: "/attendance", icon: StreamlineAttendance },
  { name: "Timesheet", href: "/timesheet", icon: StreamlineTimesheet },
  { name: "Departments", href: "/departments", icon: StreamlineDepartments },
  { name: "Expiry Alerts", href: "/expiry-alerts", icon: StreamlineExpiryAlerts },
  { name: "Your Storage", href: "/storage", icon: StreamlineStorage },
];

const ROLE_ORDER = ["Super Admin", "Admin", "Sub Admin", "Employee"];

type TeamPerson = { name: string; initials: string; avatarUrl: string; isCurrentUser?: boolean };
type RoleBucket = { role: string; members: TeamPerson[] };

const COLOR_PAIRS = [
  { bg: "bg-[#BDD7FF]", text: "text-[#007AFF]" },
  { bg: "bg-[#FFE4B5]", text: "text-[#FF9500]" },
  { bg: "bg-[#B8F0CC]", text: "text-[#34C759]" },
  { bg: "bg-[#E8D5FF]", text: "text-[#AF52DE]" },
  { bg: "bg-[#FFD6D6]", text: "text-[#FF3B30]" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const setCachedSidebar = useAppStore((s) => s.setCachedSidebar);
  const clearCache = useAppStore((s) => s.clearCache);

  const [userProfile, setUserProfile] = useState(
    cachedSidebar?.userProfile ?? { name: "Loading...", title: "Administrator", avatar: "..", avatarUrl: "" }
  );
  const [companyProfile, setCompanyProfile] = useState(
    cachedSidebar?.companyProfile ?? { name: "Loading...", location: "Setup pending", logoUrl: "", initials: ".." }
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(cachedSidebar?.isSuperAdmin ?? false);
  type LinkedCompany = { id: string; name: string; industry: string; logoUrl: string; initials: string };
  const [linkedCompanies, setLinkedCompanies] = useState<LinkedCompany[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [superAdmin, setSuperAdmin] = useState<TeamPerson | null>(null);
  const [roleBuckets, setRoleBuckets] = useState<RoleBucket[]>(cachedSidebar?.roleBuckets ?? []);
  const [totalTeamCount, setTotalTeamCount] = useState(cachedSidebar?.totalTeamCount ?? 0);
  const [attendanceBadge, setAttendanceBadge] = useState<number>(cachedSidebar?.attendanceBadge ?? 0);
  const [previewMembers, setPreviewMembers] = useState<TeamPerson[]>(cachedSidebar?.previewMembers ?? []);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const teamPanelRef = useRef<HTMLDivElement>(null);
  const teamRowRef = useRef<HTMLButtonElement>(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const companyCardRef = useRef<HTMLButtonElement>(null);


  const handleLogout = async () => {
    clearCache();
    await supabase.auth.signOut();
    const landingUrl = (process.env.NEXT_PUBLIC_LANDING_URL || 'https://dortasia.vercel.app').replace(/\/$/, '');
    window.location.href = `${landingUrl}/login?logout=true`;
  };

  // Hover expand/collapse with small debounce to prevent flicker
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsExpanded(true), 60);
  };
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setShowTeamPanel(false);
      setShowCompanyDropdown(false);
    }, 120);
  };

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? null);

      let nameStr = user.user_metadata?.full_name;
      if (!nameStr && user.user_metadata?.first_name) {
        nameStr = `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim();
      }
      if (!nameStr) {
        nameStr = user.email?.split('@')[0] || "User";
        nameStr = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
      }

      const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.avatar || "";

      // Query the `companies` table where super_admin_id = auth user ID
      // This is where super_admin_name, super_admin_avatar_url, super_admin_designation live
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('super_admin_id', user.id)
        .maybeSingle();

      let currentUserRole = "Employee";
      let currentUserDeptId: string | null = null;
      let companyId = user.id;
      let adminName = nameStr;
      let adminRole = "Super Admin";
      let adminAvatar = googleAvatarUrl;
      let resolvedUserProfile = { name: nameStr, title: "Administrator", avatar: getInitials(nameStr), avatarUrl: googleAvatarUrl };
      let resolvedCompanyProfile = { name: "Company", location: "Setup pending", logoUrl: "", initials: "Co" };
      let resolvedIsSuperAdmin = false;

      if (company) {

        const cp = {
          name: company.company_name || "Company",
          location: company.branch_location || company.sector || "Singapore",
          logoUrl: company.logo_url || "",
          initials: getInitials(company.company_name || "Co"),
        };
        setCompanyProfile(cp);
        resolvedCompanyProfile = cp;

        adminName = company.super_admin_name || nameStr || "Super Admin";
        adminRole = company.super_admin_designation || "Super Admin";
        
        // Only trust super_admin_avatar_url if it was explicitly uploaded to our storage.
        // If it's a stale/external URL (e.g. from another account), skip it and use Google OAuth.
        const storedAdminAvatar = company.super_admin_avatar_url;
        const isTrustedAdminAvatar = storedAdminAvatar && storedAdminAvatar.includes("User_Avatar/");
        adminAvatar = isTrustedAdminAvatar ? storedAdminAvatar : (googleAvatarUrl || storedAdminAvatar || "");

        console.log('[Sidebar] companies loaded:', {
          logo_url: company.logo_url,
          super_admin_avatar_url: company.super_admin_avatar_url,
          adminAvatar,
          googleAvatarUrl,
        });

        const up = { name: adminName, title: adminRole, avatar: getInitials(adminName), avatarUrl: adminAvatar };
        setUserProfile(up);
        resolvedUserProfile = up;
        setIsSuperAdmin(true);
        resolvedIsSuperAdmin = true;
        currentUserRole = "Super Admin";
        companyId = company.id;

        try {
          const stored = localStorage.getItem(`linked_companies_${user.id}`);
          if (stored) setLinkedCompanies(JSON.parse(stored));
        } catch {}

        const superAdminPerson: TeamPerson = { name: adminName, initials: getInitials(adminName), avatarUrl: adminAvatar };
        setSuperAdmin(superAdminPerson);
      } else {
        const { data: empRecord } = await supabase
          .from('employees')
          .select('*')
          .eq('email', user.email)
          .single();

        if (empRecord) {
          currentUserRole = empRecord.role || "Employee";
          currentUserDeptId = empRecord.department_id;
          companyId = empRecord.company_id;

          // For employees, get company info from companies table
          const { data: empCompany } = await supabase
            .from('companies')
            .select('company_name, logo_url, branch_location, sector')
            .eq('id', companyId)
            .maybeSingle();

          let userAvatar = empRecord.avatar_url;
          if (!userAvatar) userAvatar = googleAvatarUrl;

          const up = { name: empRecord.name, title: empRecord.role, avatar: getInitials(empRecord.name), avatarUrl: userAvatar };
          setUserProfile(up);
          resolvedUserProfile = up;
          const cp = {
            name: empCompany?.company_name || "Company",
            initials: getInitials(empCompany?.company_name || "Co"),
            logoUrl: empCompany?.logo_url || "",
            location: empCompany?.branch_location || empCompany?.sector || "Singapore"
          };
          setCompanyProfile(cp);
          resolvedCompanyProfile = cp;
          setIsSuperAdmin(false);
          resolvedIsSuperAdmin = false;
          setSuperAdmin(null);
        } else {
          setUserProfile({ name: nameStr, title: "Administrator", avatar: getInitials(nameStr), avatarUrl: googleAvatarUrl });
          setCompanyProfile({ name: "Setup Company", location: "Not Completed", logoUrl: "", initials: "SC" });
          setIsSuperAdmin(false);
          setSuperAdmin(null);
          return;
        }
      }

      let teamQuery = supabase
        .from('employees')
        .select('name, role, is_head, department_id, id, avatar_url', { count: 'exact' })
        .eq('company_id', companyId)
        .order('is_head', { ascending: false });

      if (currentUserRole === "Sub Admin" || currentUserRole === "Employee") {
        if (currentUserDeptId) teamQuery = teamQuery.eq('department_id', currentUserDeptId);
      }

      const { data: emps, count } = await teamQuery;

      const bucketMap = new Map<string, TeamPerson[]>();
      (emps ?? []).forEach((e: { id: string; name: string | null; role: string | null; is_head: boolean | null; avatar_url: string | null }) => {
        const r = e.role || "Employee";
        if (!bucketMap.has(r)) bucketMap.set(r, []);
        bucketMap.get(r)!.push({
          name: e.name || "",
          initials: getInitials(e.name || "??"),
          avatarUrl: e.avatar_url || "",
          isCurrentUser: e.id === user.id
        });
      });

      const knownRoles = ROLE_ORDER.filter(r => bucketMap.has(r) && r !== "Super Admin");
      const customRoles = Array.from(bucketMap.keys()).filter(r => !ROLE_ORDER.includes(r));
      const orderedBuckets: RoleBucket[] = [];
      knownRoles.forEach(r => orderedBuckets.push({ role: r, members: bucketMap.get(r)! }));
      customRoles.forEach(r => orderedBuckets.push({ role: r, members: bucketMap.get(r)! }));
      setRoleBuckets(orderedBuckets);

      const allMembers: TeamPerson[] = [];
      orderedBuckets.forEach(b => allMembers.push(...b.members));
      const previewPool = allMembers.slice(0, 3);
      setPreviewMembers(previewPool);
      setTotalTeamCount(count ?? 0);

      const todayDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { count: presentCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("date", todayDate)
        .eq("status", "present");

      const attBadge = Math.max(0, (count ?? 0) - (presentCount ?? 0));
      setAttendanceBadge(attBadge);

      setCachedSidebar({
        userProfile: resolvedUserProfile,
        companyProfile: resolvedCompanyProfile,
        isSuperAdmin: resolvedIsSuperAdmin,
        roleBuckets: orderedBuckets,
        totalTeamCount: count ?? 0,
        previewMembers: previewPool,
        attendanceBadge: attBadge,
      });
    }
    loadData();

    const channel = supabase
      .channel('sidebar-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, () => loadData())
      .subscribe();

    const handleReload = () => loadData();
    window.addEventListener('sidebar-reload', handleReload);

    return () => { 
      supabase.removeChannel(channel); 
      window.removeEventListener('sidebar-reload', handleReload);
    };
  }, [supabase]);

  useEffect(() => {
    if (!showTeamPanel) return;
    function handle(e: MouseEvent) {
      if (teamPanelRef.current && !teamPanelRef.current.contains(e.target as Node) &&
          teamRowRef.current && !teamRowRef.current.contains(e.target as Node)) {
        setShowTeamPanel(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showTeamPanel]);

  useEffect(() => {
    if (!showCompanyDropdown) return;
    function handle(e: MouseEvent) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node) &&
          companyCardRef.current && !companyCardRef.current.contains(e.target as Node)) {
        setShowCompanyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showCompanyDropdown]);

  const isCollapsed = !isExpanded;

  // Shared transition style for fade+slide text reveals
  const textRevealStyle = {
    opacity: isExpanded ? 1 : 0,
    maxWidth: isExpanded ? '185px' : '0px',
    overflow: 'hidden' as const,
    whiteSpace: 'nowrap' as const,
    transition: 'opacity 200ms ease, max-width 260ms cubic-bezier(0.4,0,0.2,1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", system-ui, sans-serif',
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isExpanded ? '258px' : '72px',
        transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", system-ui, sans-serif',
      }}
      className="flex h-full flex-col bg-[#F9F9FB] dark:bg-[#0B0B0F] shrink-0 relative z-40 overflow-hidden font-sf"
    >

      {/* Team flyout panel */}
      {showTeamPanel && isExpanded && (
        <div
          ref={teamPanelRef}
          className="absolute left-[calc(100%+8px)] top-[140px] z-50 w-[280px] bg-white dark:bg-[#0B0B0F] rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-[#E5E5EA] dark:border-[#2A2A31] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7] dark:border-[#2A2A31]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#007AFF]" />
              <span className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">Team</span>
              <span className="text-[13px] font-semibold text-[#8E8E93] dark:text-gray-500 font-sf-rounded">· {totalTeamCount}</span>
            </div>
            <button onClick={() => setShowTeamPanel(false)} className="text-[#8E8E93] hover:bg-[#F2F2F7] dark:hover:bg-[#1C1C22] p-1.5 rounded-full transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto py-3 px-4 flex flex-col gap-4">
            {roleBuckets.map((bucket) => (
              <div key={bucket.role}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">{bucket.role}</span>
                  <span className="text-[11px] font-semibold text-[#C7C7CC] font-sf-rounded">{bucket.members.length}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {bucket.members.slice(0, 5).map((m, i) => {
                    const { color, bg } = getAvatarColor(m.name);
                    return (
                      <div key={i} title={m.name} className="flex flex-col items-center gap-1">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-[12px] border-2 ${m.isCurrentUser ? 'border-[#007AFF]' : 'border-white dark:border-[#0B0B0F]'} overflow-hidden`}
                          style={{ backgroundColor: bg, color }}
                        >
                          {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" /> : m.initials}
                        </div>
                        <span className={`text-[9px] font-medium truncate max-w-[42px] text-center leading-tight ${m.isCurrentUser ? 'text-[#007AFF] font-bold' : 'text-[#8E8E93]'}`}>
                          {m.isCurrentUser ? "You" : m.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                  {bucket.members.length > 5 && (
                    <div className="h-9 w-9 rounded-full bg-[#F2F2F7] dark:bg-[#1C1C22] flex items-center justify-center text-[11px] font-bold text-[#8E8E93] border-2 border-white dark:border-[#0B0B0F] font-sf-rounded">
                      +{bucket.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {roleBuckets.length === 0 && (
              <p className="text-[13px] text-[#8E8E93] text-center py-4">No team members yet</p>
            )}
          </div>
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <div className="flex flex-col pt-4 pb-1 shrink-0 px-3 gap-2">

        {/* User Profile */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar — always visible, same size as company logo */}
          <div className="relative shrink-0">
            <div className="h-[44px] w-[44px] rounded-[14px] bg-[#F2F2FB] flex items-center justify-center overflow-hidden">
              <img src={getUserAvatarUrl(userProfile.avatarUrl)} alt={userProfile.name} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#34C759] border-[2.5px] border-[#F9F9FB] dark:border-[#0B0B0F] z-10" />
          </div>

          {/* Name + Role — slides in */}
          <div
            style={{
              opacity: isExpanded ? 1 : 0,
              transform: isExpanded ? 'translateX(0)' : 'translateX(-6px)',
              transition: 'opacity 220ms ease, transform 240ms cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: isExpanded ? 'auto' : 'none',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
            className="flex flex-col justify-center"
          >
            <span className="text-[16px] font-semibold text-[#111827] dark:text-white leading-tight truncate">{userProfile.name}</span>
            <span className="text-[14px] font-normal text-[#6B7280] dark:text-gray-400 mt-[1px] truncate">{userProfile.title}</span>
          </div>
        </div>

        {/* Team People — collapses to zero height when not expanded */}
        <div
          style={{
            opacity: isExpanded ? 1 : 0,
            maxHeight: isExpanded ? '80px' : '0px',
            overflow: 'hidden',
            transition: 'opacity 200ms ease, max-height 280ms cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: isExpanded ? 'auto' : 'none',
          }}
        >
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Team People</span>
              <button
                ref={teamRowRef}
                onClick={() => setShowTeamPanel(p => !p)}
                className={`flex items-center gap-2 rounded-xl px-2 py-1 transition-colors ${showTeamPanel ? 'bg-[#E5F1FF] dark:bg-[#0A84FF]/15' : 'hover:bg-[#F2F2F7] dark:hover:bg-[#1C1C22]'}`}
              >
                <div className="flex -space-x-3">
                  {previewMembers.slice(0, 3).map((m, i) => {
                    const { color, bg } = getAvatarColor(m.name);
                    const z = ['z-30', 'z-20', 'z-10'][i] ?? 'z-10';
                    return (
                      <div
                        key={i}
                        title={m.name}
                        className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[11px] border-[2.5px] ${m.isCurrentUser ? 'border-[#007AFF]' : 'border-[#F9F9FB] dark:border-[#0B0B0F]'} ${z} overflow-hidden shrink-0`}
                        style={{ backgroundColor: bg, color }}
                      >
                        {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" /> : m.initials}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[13px] font-medium text-[#6B7280] dark:text-gray-300 ml-0.5 font-sf-rounded">
                  {totalTeamCount > previewMembers.length ? `+ ${totalTeamCount - previewMembers.length}` : `${totalTeamCount}`}
                </span>
              </button>
            </div>
            <div className="h-[1px] bg-gray-200 dark:bg-[#2A2A31] w-full" />
          </div>
        </div>

        {/* "Main Menu" label */}
        <div style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 180ms ease', pointerEvents: isExpanded ? 'auto' : 'none' }}>
          <span className="text-[13px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Main Menu</span>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <div className="flex-1 overflow-y-auto nav-scrollbar py-1 px-2 min-h-0">
        <nav className="flex flex-col space-y-[2px]">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || (item.name === "Home" && pathname === "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-[14px] transition-colors ${
                  isCollapsed
                    ? `justify-center py-2.5 ${isActive ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
                    : `justify-between py-[10px] px-[14px] ml-2 ${isActive ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3.5 flex-1 min-w-0"}`}>
                  <item.icon
                    size={22}
                    className={`shrink-0 pointer-events-none select-none transition-colors ${isActive ? 'text-[#161616] dark:text-white' : 'text-[#737373]'}`}
                  />
                  <span style={textRevealStyle} className={`text-[14px] ${isActive ? 'font-medium text-[#161616] dark:text-white' : 'text-[#737373]'}`}>
                    {item.name}
                  </span>
                </div>
                {isExpanded && item.name === "Attendance" && attendanceBadge > 0 && (
                  <span className="flex h-[24px] min-w-[24px] shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/30 px-1.5 text-[12px] font-bold text-[#C93400] font-sf-rounded">
                    {attendanceBadge > 9 ? '9+' : attendanceBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── BOTTOM SECTION ── */}
      <div className="shrink-0 border-t border-gray-200 dark:border-[#2A2A31] px-2 py-3 flex flex-col space-y-[2px]">

        {/* Notifications */}
        <Link
          href="/notifications"
          title={isCollapsed ? "Notifications" : undefined}
          className={`flex items-center rounded-[14px] transition-colors ${
            isCollapsed
              ? `justify-center py-2.5 ${pathname === "/notifications" ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
              : `py-[10px] px-[14px] ml-2 ${pathname === "/notifications" ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3.5 flex-1 min-w-0"}`}>
            <StreamlineNotifications
              size={22}
              className={`shrink-0 pointer-events-none select-none transition-colors ${pathname === "/notifications" ? 'text-[#161616] dark:text-white' : 'text-[#737373]'}`}
            />
            <span style={textRevealStyle} className={`text-[14px] ${pathname === "/notifications" ? "font-medium text-[#161616] dark:text-white" : "text-[#737373]"}`}>
              Notifications
            </span>
          </div>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          title={isCollapsed ? "Settings" : undefined}
          className={`flex items-center rounded-[14px] transition-colors ${
            isCollapsed
              ? `justify-center py-2.5 ${pathname === "/settings" ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
              : `py-[10px] px-[14px] ml-2 ${pathname === "/settings" ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3.5 flex-1 min-w-0"}`}>
            <StreamlineSettings
              size={22}
              className={`shrink-0 pointer-events-none select-none transition-colors ${pathname === "/settings" ? 'text-[#161616] dark:text-white' : 'text-[#737373]'}`}
            />
            <span style={textRevealStyle} className={`text-[14px] ${pathname === "/settings" ? "font-medium text-[#161616] dark:text-white" : "text-[#737373]"}`}>
              Settings
            </span>
          </div>
        </Link>

        {/* Subscription */}
        <Link
          href="/subscription"
          title={isCollapsed ? "Subscription" : undefined}
          className={`flex items-center rounded-[14px] transition-colors ${
            isCollapsed
              ? `justify-center py-2.5 ${pathname === "/subscription" ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
              : `py-[10px] px-[14px] ml-2 ${pathname === "/subscription" ? "bg-[#E5F1FF] dark:bg-[#0A84FF]/15" : "hover:bg-gray-100 dark:hover:bg-[#1C1C22]"}`
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3.5 flex-1 min-w-0"}`}>
            <StreamlineSubscription
              size={22}
              className={`shrink-0 pointer-events-none select-none transition-colors ${pathname === "/subscription" ? 'text-[#161616] dark:text-white' : 'text-[#737373]'}`}
            />
            <span style={textRevealStyle} className={`text-[14px] ${pathname === "/subscription" ? "font-medium text-[#161616] dark:text-white" : "text-[#737373]"}`}>
              Subscription
            </span>
          </div>
        </Link>

        {/* Company Logo — same 44×44 as user avatar in collapsed, full card in expanded */}
        <div className="mt-2 relative">
          {showCompanyDropdown && isExpanded && (
            <div
              ref={companyDropdownRef}
              className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#0B0B0F] rounded-[18px] shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-[#E5E5EA] dark:border-[#2A2A31] overflow-hidden z-50"
            >
              {isSuperAdmin && (
                <>
                  {linkedCompanies.length > 0 ? (
                    linkedCompanies.map((lc) => (
                      <button
                        key={lc.id}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#F2F2F7] dark:hover:bg-[#1C1C22] transition-colors"
                        onClick={() => setShowCompanyDropdown(false)}
                      >
                        <div className="h-9 w-9 rounded-full bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center font-bold text-[13px] shrink-0 overflow-hidden">
                          {lc.logoUrl ? <img src={lc.logoUrl} alt={lc.name} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : lc.initials}
                        </div>
                        <div className="flex flex-col text-left flex-1 min-w-0">
                          <span className="text-[13px] font-semibold text-[#161616] dark:text-white truncate">{lc.name}</span>
                          <span className="text-[11px] text-[#737373] truncate">{lc.industry}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-5 px-4 gap-1">
                      <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">No Branch Profiles</span>
                      <span className="text-[11px] text-[#8E8E93] text-center leading-snug">Add another branch account<br />using the button below.</span>
                    </div>
                  )}
                  <div className="h-px bg-[#F2F2F7] dark:bg-[#1C1C22]" />
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F2F2F7] dark:hover:bg-[#1C1C22] transition-colors"
                    onClick={() => setShowCompanyDropdown(false)}
                  >
                    <PlusCircle className="h-[18px] w-[18px] text-[#007AFF] shrink-0" />
                    Add Another Branch
                  </button>
                  <div className="h-px bg-[#F2F2F7] dark:bg-[#1C1C22]" />
                </>
              )}
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-[18px] w-[18px] text-[#FF3B30] shrink-0" />
                Logout
              </button>
            </div>
          )}

          {isCollapsed ? (
            /* Collapsed: show company logo as 44×44 rounded square — same size/style as user avatar */
            <button
              ref={companyCardRef}
              onClick={() => setShowCompanyDropdown(p => !p)}
              title={companyProfile.name}
              className="flex items-center justify-center h-[44px] w-[44px] mx-auto rounded-[14px] bg-[#E5F1FF] dark:bg-[#0A84FF]/15 hover:ring-2 hover:ring-blue-200 transition-all overflow-hidden"
            >
              <img src={getCompanyLogoUrl(companyProfile.logoUrl, companyProfile.name)} alt="Logo" crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </button>
          ) : (
            /* Expanded: full company card */
            <button
              ref={companyCardRef}
              onClick={() => setShowCompanyDropdown(p => !p)}
              className={`flex w-full items-center justify-between rounded-2xl bg-white dark:bg-[#0B0B0F] p-2.5 shadow-sm hover:bg-gray-50 dark:hover:bg-[#1C1C22] transition-colors border ${showCompanyDropdown ? 'border-[#007AFF]/30 ring-2 ring-[#007AFF]/10' : 'border-gray-100 dark:border-[#2A2A31]'}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-[10px] bg-[#E5F1FF] dark:bg-[#0A84FF]/15 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={getCompanyLogoUrl(companyProfile.logoUrl, companyProfile.name)} alt="Logo" crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-[#161616] dark:text-white truncate">{companyProfile.name}</span>
                  <span className="text-[12px] text-[#737373] truncate">{companyProfile.location}</span>
                </div>
              </div>
              <ChevronsUpDown className={`h-4 w-4 shrink-0 ml-2 transition-colors ${showCompanyDropdown ? 'text-[#007AFF]' : 'text-gray-400'}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
