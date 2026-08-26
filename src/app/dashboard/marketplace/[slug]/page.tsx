import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPublishedMarketplaceAppBySlug, getPublishedMarketplaceApps } from "@/lib/marketplace-data";
import { AppDetailsView } from "@/components/marketplace/AppDetailsView";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const app = await getPublishedMarketplaceAppBySlug(params.slug);

  if (!app) {
    return {
      title: "App Not Found | Dort Asia Marketplace",
    };
  }

  return {
    title: `${app.name} | Dort Asia Marketplace`,
    description: app.description,
  };
}

export default async function MarketplaceAppDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const app = await getPublishedMarketplaceAppBySlug(params.slug);

  if (!app) {
    notFound();
  }

  return <AppDetailsView app={app} />;
}
