"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, Check, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

type Notification = {
  id: string;
  employee_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

const TYPE_CONFIG: Record<string, { icon: typeof Info; color: string; bg: string; border: string; dot: string }> = {
  info:    { icon: Info,          color: "text-[#007AFF]",  bg: "bg-[#E5F1FF] dark:bg-[#0A84FF]/15",  border: "border-[#007AFF]/20", dot: "bg-[#007AFF]"  },
  success: { icon: CheckCircle,   color: "text-[#34C759]",  bg: "bg-[#E8FAF0] dark:bg-[#34C759]/15",  border: "border-[#34C759]/20", dot: "bg-[#34C759]"  },
  warning: { icon: AlertTriangle, color: "text-[#FF9500]",  bg: "bg-[#FFF2DF] dark:bg-[#FF9500]/15",  border: "border-[#FF9500]/20", dot: "bg-[#FF9500]"  },
  error:   { icon: AlertCircle,   color: "text-[#FF3B30]",  bg: "bg-[#FFF1F1] dark:bg-[#FF3B30]/15",  border: "border-[#FF3B30]/20", dot: "bg-[#FF3B30]"  },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Load notifications for the current logged-in user
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Resolve employee record
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("email", user.email)
        .single();

      const empId = emp?.id ?? null;
      setEmployeeId(empId);

      // If super admin (no employee record), fetch all notifications for their company
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (empId) {
        query = query.eq("employee_id", empId);
      }

      const { data } = await query;
      setNotifications(data ?? []);
      setLoading(false);
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel("notifications-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const displayed = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0B0B0F] overflow-y-auto page-scrollbar">

      {/* Header */}
      <header className="p-4 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight font-sans">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#FF3B30] px-1.5 text-[12px] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <p className="text-[14px] text-gray-500 font-medium">
              Your alerts, updates and reminders
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-4 py-2 text-[13px] font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="h-9 w-9 flex items-center justify-center rounded-[12px] bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A31] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1C1C22] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-5">
          {(["all", "unread"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all border ${
                filter === f
                  ? "bg-[#007AFF] text-white border-[#007AFF] shadow-sm"
                  : "bg-white dark:bg-[#121217] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#2A2A31] hover:bg-gray-50 dark:hover:bg-[#1C1C22]"
              }`}
            >
              {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 p-4 pt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
            <p className="text-[14px] text-gray-400 font-medium">Loading notifications…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-[#1C1C22] flex items-center justify-center">
              <Bell className="h-9 w-9 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-[16px] font-bold text-gray-900 dark:text-white mb-1">
                {filter === "unread" ? "All caught up!" : "No notifications yet"}
              </p>
              <p className="text-[13px] text-gray-400 font-medium">
                {filter === "unread"
                  ? "You have no unread notifications."
                  : "You'll see alerts, reminders and updates here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-3xl">
            {displayed.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  className={`group relative flex items-start gap-4 p-4 rounded-[18px] border transition-all cursor-pointer ${
                    notif.is_read
                      ? "bg-white dark:bg-[#121217] border-gray-100 dark:border-[#1C1C22] opacity-70 hover:opacity-100"
                      : `bg-white dark:bg-[#121217] border-gray-200 dark:border-[#2A2A31] shadow-sm hover:shadow-md`
                  }`}
                >
                  {/* Unread dot */}
                  {!notif.is_read && (
                    <span className={`absolute top-4 right-4 h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                  )}

                  {/* Icon */}
                  <div className={`h-10 w-10 shrink-0 rounded-[12px] ${cfg.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-10">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className={`text-[14px] font-bold leading-snug ${notif.is_read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                        {notif.title}
                      </p>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                        {notif.type}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">{timeAgo(notif.created_at)}</span>
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                        title="Mark as read"
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-[#E5F1FF] dark:bg-[#0A84FF]/15 text-[#007AFF] hover:bg-[#007AFF] hover:text-white transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      title="Delete"
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-[#FFF1F1] dark:bg-[#FF3B30]/15 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
