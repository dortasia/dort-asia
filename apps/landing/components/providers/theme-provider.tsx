"use client";

// import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps & { children: React.ReactNode }) {
  // Temporarily bypassed due to React 19 / Next 16 strict <script> parsing errors
  return <>{children}</>;
}
