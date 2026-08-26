import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace | Dort Asia",
  description: "Purchase apps from the Store",
};

export default function MarketplacePage() {
  return (
    <div className="w-full max-w-[1200px] px-8 py-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Market Place</h1>
        <p className="text-[15px] text-gray-500">Purchase apps from the Store</p>
      </div>

      <MarketplaceGrid />
    </div>
  );
}
