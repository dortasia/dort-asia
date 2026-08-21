import { Metadata } from "next";
import { constructMetadata } from "@/config/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/config/urls";

export const metadata: Metadata = constructMetadata({
  title: "Pricing & Plans",
  description: "Transparent pricing for the Xentra People platform. S$99/month for small businesses or S$999/year. Scale up to custom enterprise features.",
  alternates: {
    canonical: "/pricing",
  },
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = getSiteUrl();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Xentra People",
    "description": "A comprehensive HRMS platform for startups and SMEs, including GPS check-ins, payroll, and document vaults.",
    "brand": {
      "@type": "Brand",
      "name": "Dort Asia"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "SGD",
      "lowPrice": "99",
      "highPrice": "999",
      "offerCount": "2"
    }
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      {children}
    </>
  );
}
