"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LeadershipProps {
  name?: string;
  designation?: string;
  bio?: string;
  profileUrl?: string;
  imageSrc?: string;
}

export function AboutLeadershipSection({
  name = "Dinesh",
  designation = "Founder",
  bio = "Architecting high-velocity engineering teams and scalable digital ecosystems. Dinesh leads DORT Asia with a simple conviction: technology shouldn't just run operations—it should unlock unfair competitive advantages.",
  profileUrl = "/about/leadership/dinesh",
  imageSrc = "/assets/dinesh_PP.avif",
}: LeadershipProps) {
  return (
    <section id="leadership" className="w-full py-16 md:py-24 px-6 md:px-10 bg-white flex justify-center font-text">
      <div className="max-w-[1400px] w-full">
        
        {/* Modern Hyper-Minimal Wide Grey Leadership Card */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[#f5f5f7] rounded-[32px] p-8 md:p-12 lg:p-14 overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12"
        >
          {/* Left Column: Designation, Name, Bio, CTA */}
          <div className="flex-1 flex flex-col justify-center text-left z-10">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-3">
              Leadership
            </span>
            
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight leading-[1.08]">
              {name}
            </h3>

            <p className="text-lg sm:text-xl md:text-2xl font-medium text-[#1d1d1f]/60 mt-2 tracking-tight">
              {designation}
            </p>

            <p className="text-[16px] md:text-[17px] text-[#1d1d1f]/60 leading-relaxed font-medium mt-6 max-w-xl">
              {bio}
            </p>

            {/* Hyper-Minimal Pill Button */}
            <div className="mt-8">
              <Link 
                href={profileUrl}
                className="inline-flex items-center gap-3 bg-[#1d1d1f] hover:bg-black text-white px-5 py-3 rounded-full transition-colors font-medium text-[15px] group"
              >
                <span>View Profile</span>
                <div className="bg-white text-black rounded-full p-1 group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </Link>
            </div>
          </div>

          {/* Right Column: Sleek Full-Fit Portrait Rectangle Card */}
          <div className="w-full sm:w-[260px] md:w-[300px] lg:w-[340px] aspect-[4/5] rounded-[24px] overflow-hidden bg-[#e8e8ed] border border-black/[0.06] relative shrink-0 shadow-lg flex items-center justify-center group">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={name}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-3xl font-bold mb-3 shadow-md">
                  {name.charAt(0)}
                </div>
                <div className="text-[14px] font-bold text-[#1d1d1f]">
                  {name}
                </div>
                <div className="text-[12px] font-medium text-[#86868b]">
                  DORT Asia Lead
                </div>
              </div>
            )}
          </div>

        </motion.div>

      </div>
    </section>
  );
}
