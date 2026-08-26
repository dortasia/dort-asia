import Image from "next/image";
import Link from "next/link";
import { MarketplaceApp } from "@/data/marketplace";

export function MarketplaceCard({ app }: { app: MarketplaceApp }) {
  return (
    <div className="group relative flex flex-col bg-white rounded-[28px] border border-[#DBDBDB] overflow-hidden">
      {/* Top Image Section - Increased height */}
      <div className="relative w-full aspect-[16/9] bg-gray-100">
        <Image
          src={app.heroImage}
          alt={app.name}
          fill
          className="object-cover"
        />

        {/* Dark Gray Frosted Glassy Pill Badge */}
        {app.badge && (
          <div 
            className="absolute top-4 right-4 z-10 px-3.5 py-1 rounded-full text-[12px] font-medium text-white/90 border border-white/20 shadow-md flex items-center justify-center backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(45, 48, 56, 0.75) 0%, rgba(22, 24, 28, 0.75) 100%)",
              boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.15)",
            }}
          >
            {app.badge}
          </div>
        )}
      </div>
      
      {/* Bottom Content Section - Exact Figma Glass Configuration */}
      <div 
        className="relative -mt-14 px-6 py-4 flex flex-col gap-3 z-10"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(249, 249, 249, 0.25) 100%)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className={`relative w-[48px] h-[48px] rounded-[15px] overflow-hidden shrink-0 border border-gray-100 shadow-sm flex items-center justify-center ${app.iconBackground || "bg-white"}`}>
            <Image 
              src={app.icon} 
              alt={`${app.name} icon`} 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-gray-900 truncate">{app.name}</h3>
            <p className="text-[13.5px] text-gray-500 leading-tight mt-0.5 line-clamp-1">
              {app.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-5">
          <Link 
            href={`/dashboard/subscriptions?app=${app.slug}`} 
            className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Subscribe
          </Link>
          <Link 
            href={app.route} 
            className="px-5 py-2 bg-[#0061FF] hover:bg-blue-700 text-white text-[14px] font-medium rounded-full transition-colors shadow-sm active:scale-95"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
