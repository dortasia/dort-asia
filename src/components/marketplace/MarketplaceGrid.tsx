import { getPublishedMarketplaceApps } from "@/lib/marketplace-data";
import { MarketplaceCard } from "./MarketplaceCard";

export const dynamic = "force-dynamic";

export async function MarketplaceGrid() {
  const publishedApps = await getPublishedMarketplaceApps();

  if (!publishedApps || publishedApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-gray-50 border border-gray-200/80 rounded-3xl mt-6">
        <h3 className="text-lg font-bold text-gray-900">No applications currently available</h3>
        <p className="text-[13.5px] text-gray-500 mt-1">Check back later for new published apps in the marketplace.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {publishedApps.map((app) => (
        <MarketplaceCard key={app.id} app={app} />
      ))}
    </div>
  );
}
