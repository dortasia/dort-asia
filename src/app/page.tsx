import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { ApproachSection } from "@/components/sections/approach";
import { SoftwareProductsSection } from "@/components/sections/software-products";
import { CustomTechnologySection } from "@/components/sections/custom-technology";
import { Metadata } from "next";
import { constructMetadata } from "@/config/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/config/urls";

export const metadata: Metadata = constructMetadata({
  title: "Dort Asia | Bespoke Software & Tech Talent",
  description: "Dort Asia specializes in bespoke software solutions, enterprise SaaS products, and providing specialized tech talent for modern businesses.",
  alternates: {
    canonical: "/",
  },
});

export default function Home() {
  const siteUrl = getSiteUrl();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Dort Asia",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/services?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={websiteJsonLd} />
      <Navbar />
      <Hero />
      <ApproachSection />
      <SoftwareProductsSection />
      <CustomTechnologySection />
      <Footer />
    </main>
  );
}
