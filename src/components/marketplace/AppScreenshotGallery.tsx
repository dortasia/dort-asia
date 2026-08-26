"use client";

import Image from "next/image";
import { MarketplaceScreenshot } from "@/data/marketplace";
import { Image as ImageIcon } from "lucide-react";

interface AppScreenshotGalleryProps {
  screenshots: MarketplaceScreenshot[];
  appName: string;
}

export function AppScreenshotGallery({ screenshots, appName }: AppScreenshotGalleryProps) {

  if (!screenshots || screenshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm mb-3">
          <ImageIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h4 className="text-[15px] font-semibold text-gray-800">Screenshots Coming Soon</h4>
        <p className="text-[13px] text-gray-500 mt-1 max-w-sm">
          Interactive screenshots and product previews for {appName} will be available in the upcoming release.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-stretch gap-6 overflow-x-auto pb-4 pt-2 px-4 md:px-8 scrollbar-none snap-x snap-mandatory">
      {screenshots.map((s, idx) => (
        <div 
          key={s.id || idx}
          className="relative w-[85%] sm:w-[75%] md:w-[60%] lg:w-[45%] shrink-0 aspect-[16/10] rounded-[24px] border border-gray-200 bg-slate-50 overflow-hidden shadow-sm snap-center group"
        >
          <Image
            src={s.image}
            alt={s.title || `${appName} screenshot ${idx + 1}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={idx === 0}
          />
          {s.caption && (
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <p className="text-[14px] font-medium text-white/95 leading-snug drop-shadow-md">
                {s.caption}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
