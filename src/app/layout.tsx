import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getSiteUrl } from "@/config/urls";

import { constructMetadata } from "@/config/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const sfProText = localFont({
  src: [
    {
      path: "../../public/fonts/SF-Pro_text/SF-Pro-Text-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SF-Pro_text/SF-Pro-Text-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/SF-Pro_text/SF-Pro-Text-Semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/SF-Pro_text/SF-Pro-Text-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-pro-text",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Dort Asia",
    "url": siteUrl,
    "logo": `${siteUrl}/company_logo/DortAsiaLogo.svg`,
    "description": "Bespoke software solutions, enterprise SaaS products, and specialized tech talent.",
  };

  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", sfProText.variable)}
    >
      <head>
        <JsonLd data={jsonLd} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
