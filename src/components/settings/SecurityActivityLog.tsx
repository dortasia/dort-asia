"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Monitor, Smartphone, Globe, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { isLocalOrPrivateIp } from "@/lib/security/ip";

interface LoginEvent {
  id: string;
  created_at: string;
  event_type: string;
  device_type: string;
  browser: string;
  os: string;
  city: string | null;
  country_name: string | null;
  ip_address: string | null;
  is_new_device: boolean;
  is_new_location: boolean;
}

const fetchInitialEvents = async () => {
  const res = await fetch("/api/auth/security-activity?limit=10");
  if (!res.ok) throw new Error("Failed to fetch security activity");
  return await res.json();
};

export function SecurityActivityLog() {
  const { data: initialData, isLoading } = useSWR("securityActivityLog", fetchInitialEvents, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (initialData) {
      setEvents(initialData.events || []);
      setNextCursor(initialData.nextCursor || null);
      setHasMore(initialData.hasMore || false);
    }
  }, [initialData]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await fetch(`/api/auth/security-activity?limit=10&cursor=${encodeURIComponent(nextCursor)}`);
      if (!res.ok) throw new Error("Failed to load more activity");
      const data = await res.json();
      setEvents((prev) => [...prev, ...(data.events || [])]);
      setNextCursor(data.nextCursor || null);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Error loading more activity:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl">
        <p className="text-sm text-gray-500">No recent security activity found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review your recent login history and security events.
        </p>
      </div>

      <div className="relative border-s border-gray-200 dark:border-zinc-800 ml-3 space-y-6">
        {events.map((event) => {
          const isAlert = event.event_type !== "login" || event.is_new_device || event.is_new_location;
          const date = new Date(event.created_at);
          const isLocal = isLocalOrPrivateIp(event.ip_address) || event.country_name === "Local Development";
          const locationLabel = [event.city, event.country_name].filter(Boolean).join(", ") || (isLocal ? "Local Development" : "Unknown Location");
          
          return (
            <div key={event.id} className="ml-6 relative">
              <span className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full -left-[37px] ring-4 ring-white dark:ring-zinc-950 ${
                isAlert ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400" : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400"
              }`}>
                {isAlert ? <ShieldAlert className="w-3 h-3" /> : (
                  event.device_type === "mobile" || event.device_type === "tablet" ? 
                  <Smartphone className="w-3 h-3" /> : 
                  <Monitor className="w-3 h-3" />
                )}
              </span>
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Successful Login
                    </h4>
                    {event.event_type === "new_device_and_location" && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                        New Device & Location
                      </span>
                    )}
                    {event.event_type === "new_device" && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                        New Device
                      </span>
                    )}
                    {event.event_type === "new_location" && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                        New Location
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                <div className="flex flex-col gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span>{event.browser} on {event.os}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {locationLabel}
                      {event.ip_address && !isLocal && (
                        <span className="text-gray-400 dark:text-gray-500 ml-1">({event.ip_address})</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="pt-2 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoadingMore ? "Loading more..." : "Load more activity"}
          </button>
        </div>
      )}
    </div>
  );
}
