"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  CloudIcon, 
  ArtificialIntelligence04Icon, 
  Database01Icon, 
  SmartPhone01Icon, 
  Shield02Icon, 
  CodeCircleIcon 
} from "@hugeicons/core-free-icons";

const capabilities = [
  {
    title: "Cloud Infrastructure",
    description: "Scalable, secure, and highly available architectures deployed on AWS, GCP, and Azure.",
    icon: CloudIcon,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Data & AI",
    description: "Transforming raw data into actionable intelligence through predictive modeling and analytics.",
    icon: ArtificialIntelligence04Icon,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "Enterprise Software",
    description: "Custom ERPs, CRMs, and core operational systems built for performance at scale.",
    icon: Database01Icon,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Digital Experiences",
    description: "Frictionless web and mobile applications designed with user-centric methodologies.",
    icon: SmartPhone01Icon,
    color: "bg-orange-50 text-orange-600",
  },
  {
    title: "Cybersecurity",
    description: "Proactive threat modeling, compliance, and robust security posture management.",
    icon: Shield02Icon,
    color: "bg-red-50 text-red-600",
  },
  {
    title: "Legacy Modernization",
    description: "Seamless refactoring of monolithic systems into agile, microservices-based architectures.",
    icon: CodeCircleIcon,
    color: "bg-gray-100 text-gray-700",
  },
];

export function AboutCapabilitiesSection() {
  return (
    <section id="capabilities" className="w-full py-24 md:py-32 px-6 md:px-10 bg-white flex justify-center font-text">
      <div className="max-w-[1400px] w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mb-4"
            >
              Technology Capabilities
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight leading-[1.1]"
            >
              Engineered for scale. <br className="hidden md:block" />
              Built for performance.
            </motion.h3>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[17px] text-[#1d1d1f]/60 font-medium max-w-md"
          >
            Our multidisciplinary teams leverage the modern technology stack to solve complex technical challenges and accelerate digital transformation.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] border border-black/[0.03] hover:border-black/[0.08] p-8 md:p-10 rounded-[32px] transition-all duration-500 overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${cap.color}`}>
                  <HugeiconsIcon icon={Icon} className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-[#1d1d1f] mb-3 tracking-tight">
                  {cap.title}
                </h4>
                <p className="text-[15px] text-[#1d1d1f]/60 leading-relaxed font-medium">
                  {cap.description}
                </p>
                
                {/* Subtle hover flare */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-black/[0.02] blur-3xl transition-transform duration-700 group-hover:scale-150" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
