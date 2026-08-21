import { Metadata } from "next";
import { constructMetadata } from "@/config/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/config/urls";

export const metadata: Metadata = constructMetadata({
  title: "About Us",
  description: "DORT Asia exists to help businesses solve real operational and technology challenges by bringing together software, digital innovation, and skilled talent.",
  alternates: {
    canonical: "/about",
  },
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = getSiteUrl();
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Dort Asia",
    "url": `${siteUrl}/about`,
    "description": "DORT Asia exists to help businesses solve real operational and technology challenges by bringing together software, digital innovation, and skilled talent.",
    "publisher": {
      "@type": "Organization",
      "name": "Dort Asia"
    }
  };

  return (
    <>
      <JsonLd data={aboutJsonLd} />
      {children}
    </>
  );
}
