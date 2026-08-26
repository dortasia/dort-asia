"use client";

import React from "react";
import { Check } from "lucide-react";

interface AppFeaturesSectionProps {
  matrixData?: {
    plans: any[];
    categories: { category: string; features: any[] }[];
  };
}

export function AppFeaturesSection({ matrixData }: AppFeaturesSectionProps) {
  if (!matrixData || !matrixData.plans || matrixData.plans.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto py-16 px-4 text-center text-gray-500">
        Feature comparison is not available for this application.
      </div>
    );
  }

  const { plans, categories } = matrixData;

  return (
    <div className="space-y-16 w-full max-w-6xl mx-auto pt-6 pb-16 px-1">
      {/* 1. Compare Capabilities Matrix Section */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Compare plan capabilities & limits</h2>
          <p className="text-[15px] text-gray-600">
            A granular comparison of modules, limits, and enterprise features across every tier.
          </p>
        </div>

        {/* Compare Capabilities Matrix Table (Stroke Only Style) */}
        <div className="overflow-hidden border border-gray-200 rounded-[28px] bg-white shadow-2xs">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="py-4.5 px-6 text-[13px] font-semibold text-gray-500 uppercase tracking-wider w-[40%]">Features & Capabilities</th>
                  {plans.map((plan, idx) => (
                    <th key={plan.id} className={`py-4.5 px-6 text-[13px] font-semibold uppercase tracking-wider text-center border-l border-gray-100 ${idx === 1 ? 'text-[#0061FF] font-bold bg-blue-50/20' : 'text-gray-500'}`} style={{ width: `${60 / Math.max(1, plans.length)}%` }}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat, idx) => (
                  <React.Fragment key={idx}>
                    {/* Category Header */}
                    <tr className="bg-gray-50/60 border-t border-b border-gray-200/80">
                      <td colSpan={plans.length + 1} className="py-3 px-6 text-[11.5px] font-bold text-gray-800 uppercase tracking-widest">
                        {cat.category}
                      </td>
                    </tr>

                    {/* Features */}
                    {cat.features.map((feature, fIdx) => (
                      <tr key={fIdx} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-4 px-6 text-[14px] font-medium text-gray-800">
                          {feature.name}
                        </td>
                        
                        {plans.map((plan, pIdx) => {
                          const val = feature[plan.id];
                          const isHighlighted = pIdx === 1;
                          
                          return (
                            <td key={plan.id} className={`py-4 px-6 text-center text-[13.5px] text-gray-600 border-l border-gray-100 ${isHighlighted ? 'bg-blue-50/10' : ''}`}>
                              {typeof val === 'boolean' ? (
                                val ? <Check className="w-4.5 h-4.5 text-[#0061FF] mx-auto stroke-[2.5]" /> : <span className="text-gray-300 font-light">—</span>
                              ) : (
                                <span className={`font-semibold ${isHighlighted ? 'text-[#0061FF]' : 'text-gray-900'}`}>{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
