import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ServicesHero } from "@/components/sections/services-hero";
import { ServicesCatalogSection } from "@/components/sections/services-catalog";
import { ServicesIndustriesSection } from "@/components/sections/services-industries";
import { ServicesEngagementSection } from "@/components/sections/services-engagement";
import { ServicesProcessSection } from "@/components/sections/services-process";
import { ServicesCommitmentsSection } from "@/components/sections/services-commitments";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Metadata } from "next";
import { constructMetadata } from "@/config/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/config/urls";

export const metadata: Metadata = constructMetadata({
  title: "Services & Capabilities",
  description: "Explore Dort Asia's end-to-end technology services, bespoke software engineering, dedicated developer squads, proprietary SaaS, and AI solutions.",
  alternates: {
    canonical: "/services",
  },
});

export default function ServicesPage() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bespoke Software Engineering & Technology Services",
    "provider": {
      "@type": "Organization",
      "name": "Dort Asia",
      "url": siteUrl
    },
    "description": "End-to-end technology services, bespoke software engineering, dedicated developer squads, proprietary SaaS, and AI solutions."
  };

  return (
    <main className="min-h-screen bg-white font-text flex flex-col justify-between">
      <JsonLd data={jsonLd} />
      <Navbar />
      
      {/* 1. Services Hero Header with Anchor Navigation */}
      <ServicesHero />

      {/* 2. Core Services Catalog (6 Detailed Technical Pillars) */}
      <div id="catalog">
        <ServicesCatalogSection />
      </div>

      {/* 3. Industry-Tailored Solutions (Workforce, Fintech, Retail, Enterprise) */}
      <div id="industries">
        <ServicesIndustriesSection />
      </div>

      {/* 4. Enterprise Engagement & Delivery Models */}
      <div id="engagement">
        <ServicesEngagementSection />
      </div>

      {/* 5. 4-Stage Delivery Lifecycle (Blueprint, UX Prototype, Agile Sprints, Edge Scale) */}
      <div id="process">
        <ServicesProcessSection />
      </div>

      {/* 6. Engineering Commitments & Standards (100% IP, Type-Safe, Bank-Grade Security, Direct Access) */}
      <div id="commitments">
        <ServicesCommitmentsSection />
      </div>

      {/* 7. Enterprise Bottom Conversion Banner */}
      <section className="w-full py-20 md:py-24 px-6 md:px-10 bg-[#fafafc] border-t border-gray-100 flex justify-center text-center">
        <div className="max-w-4xl w-full">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-gray-200/80 text-[12px] md:text-[13px] font-semibold text-[#86868b] tracking-wider uppercase mb-5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Ready to Build or Scale?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-5 leading-[1.15]">
            Let’s discuss your technical roadmap,<br className="hidden sm:inline" />
            <span className="text-[#86868b]">talent needs, or custom software build.</span>
          </h2>

          <p className="text-[16px] md:text-[18px] text-[#515154] mb-9 max-w-2xl mx-auto leading-relaxed">
            From single-feature MVPs to full enterprise modernization, our engineering teams are ready to deliver.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/work-with-us"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#1d1d1f] hover:bg-black text-white font-semibold text-[15px] rounded-full transition-all shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-[0.99] group"
            >
              <span>Work With Our Team</span>
              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-4 bg-white hover:bg-gray-50 text-[#1d1d1f] font-semibold text-[15px] rounded-full transition-all border border-gray-200/90 shadow-2xs"
            >
              <span>View Product Pricing</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
