"use client";

import { useEffect } from "react";

export default function ScrollTracker() {
  useEffect(() => {
    const scrollTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
    // Track which elements are currently marked as scrolling to avoid redundant classList.add
    const activeScrollers = new WeakSet<HTMLElement>();
    let rafId: number | null = null;
    let pendingTargets: HTMLElement[] = [];

    const processScroll = () => {
      rafId = null;
      for (const target of pendingTargets) {
        if (!activeScrollers.has(target)) {
          target.classList.add("is-scrolling");
          activeScrollers.add(target);
        }

        // Clear existing timer
        const existing = scrollTimers.get(target);
        if (existing) clearTimeout(existing);

        // Set a new timer to remove the class after scroll stops
        const timer = setTimeout(() => {
          target.classList.remove("is-scrolling");
          activeScrollers.delete(target);
          scrollTimers.delete(target);
        }, 800);

        scrollTimers.set(target, timer);
      }
      pendingTargets = [];
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target?.classList) return;

      if (
        target.classList.contains("nav-scrollbar") ||
        target.classList.contains("page-scrollbar")
      ) {
        pendingTargets.push(target);
        // Batch DOM operations in a single rAF
        if (!rafId) {
          rafId = requestAnimationFrame(processScroll);
        }
      }
    };

    // Passive listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (rafId) cancelAnimationFrame(rafId);
      scrollTimers.forEach((timer) => clearTimeout(timer));
      scrollTimers.clear();
    };
  }, []);

  return null;
}
