import type { Metadata } from "next";
import { Inter, Noto_Color_Emoji } from "next/font/google";
import { StoreHydration } from "@/components/StoreHydration";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoColorEmoji = Noto_Color_Emoji({
  variable: "--font-noto-emoji",
  weight: "400",
  display: "swap",
  subsets: ["emoji"],
});

export const metadata: Metadata = {
  title: "HRMS — Dort Asia",
  description: "Human Resource Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoColorEmoji.variable}`} suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let isDark = false;
                let accentColor = "#007AFF";
                const storage = localStorage.getItem("hrms-store");
                if (storage) {
                  const state = JSON.parse(storage).state;
                  if (state.theme === "dark") {
                    isDark = true;
                  } else if (state.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
                    isDark = true;
                  }
                  if (state.accentColor) {
                    accentColor = state.accentColor;
                  }
                }
                if (isDark) {
                  document.documentElement.classList.add("dark");
                }
                document.documentElement.style.setProperty("--user-accent", accentColor);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased flex w-full overflow-hidden zoom-container">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
        <StoreHydration />
        {children}
      </body>
    </html>
  );
}
