"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";

export default function ThemeProvider() {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--user-accent', accentColor);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(t: string) {
      if (t === "dark" || (t === "system" && mediaQuery.matches)) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    applyTheme(theme);

    if (theme === "system") {
      const handler = () => applyTheme("system");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme, accentColor]);

  return null;
}
