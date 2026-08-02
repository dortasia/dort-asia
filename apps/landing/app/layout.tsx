import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";


export const viewport: Viewport = {
  themeColor: "#007AFF",
};

export const metadata: Metadata = {
  title: {
    default: "Dort Asia — Your All-in-One Business App Hub",
    template: "%s | Dort Asia",
  },
  description:
    "Access all your business applications from one centralized platform. Dort Asia brings HRMS, Accounts, and more together for growing companies across Asia.",
  keywords: ["HRMS", "SaaS", "business apps", "Malaysia", "Asia", "HR software"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dort Asia",
  },
  openGraph: {
    title: "Dort Asia — Your All-in-One Business App Hub",
    description: "Access all your business applications from one centralized platform.",
    type: "website",
    locale: "en_MY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
