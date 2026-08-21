import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dinesh | Managing Director & Founder",
  description: "Dinesh brings over two decades of global technology leadership experience to Dort Asia, specializing in bespoke software, SaaS, and digital transformation.",
  alternates: {
    canonical: "/about/leadership/dinesh",
  },
  openGraph: {
    title: "Dinesh | Managing Director & Founder",
    description: "Dinesh brings over two decades of global technology leadership experience to Dort Asia, specializing in bespoke software, SaaS, and digital transformation.",
    url: "/about/leadership/dinesh",
    images: ["/img_assets/og-image.png"],
    type: "profile",
  },
};

export default function DineshProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": "Dinesh",
      "jobTitle": "Managing Director & Founder",
      "worksFor": {
        "@type": "Organization",
        "name": "Dort Asia",
        "url": "https://dortasia.com"
      },
      "url": "https://dortasia.com/about/leadership/dinesh",
      "description": "Dinesh brings over two decades of global technology leadership experience to Dort Asia, specializing in bespoke software, SaaS, and digital transformation."
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      {children}
    </>
  );
}
