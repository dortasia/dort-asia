"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { hrmsUrl, xentraUrl } from "@/utils/routes";

type Plan = {
  name: string;
  price: number;
  features: string[];
  highlighted: boolean;
};

type Feature = {
  icon: string;
  title: string;
  desc: string;
};

type AppData = {
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  tagline: string;
  features: Feature[];
  screenshots: { label: string; placeholder: string }[];
  plans: Plan[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function AppDetailClient({ app }: { app: AppData }) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await createClient().auth.getSession();
        setSession(session);
      } catch (e) {
        console.error("Error loading session:", e);
      }
    };
    fetchSession();
  }, []);

  const getAppUrl = (slug: string) => {
    if (slug === "vertex-hrms") {
      const baseHrmsUrl = (process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL!).replace(/\/$/, "");
      if (session) {
        return `${baseHrmsUrl}/api/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
      }
      return baseHrmsUrl;
    }
    if (slug === "xentra") {
      return xentraUrl();
    }
    return "/register";
  };

  return (
    <div className="bg-[#0a0a12] min-h-screen text-white pt-24 pb-24">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center gap-10 mb-20"
        >
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              {app.category}
            </span>
            <div className="flex items-center gap-4 mt-3">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-3xl`}>
                {app.icon}
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-black">{app.name}</h1>
                <p className="text-white/40 text-sm mt-1">{app.tagline}</p>
              </div>
            </div>
            <p className="mt-6 text-lg text-white/60 max-w-2xl leading-relaxed">
              {app.description}
            </p>
            <div className="mt-8 flex items-center gap-4">
              {app.status === "Live" ? (
                <Link
                  href={getAppUrl(app.slug)}
                  target={app.slug === "vertex-hrms" || app.slug === "xentra" ? "_blank" : undefined}
                  rel={app.slug === "vertex-hrms" || app.slug === "xentra" ? "noopener noreferrer" : undefined}
                  id={`app-detail-cta-${app.slug}`}
                  className="inline-flex items-center gap-2 gradient-brand text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:opacity-90 glow-sm transition-all"
                >
                  {app.slug === "xentra" ? "Launch Xentra" : "Subscribe Now"} <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  className="inline-flex items-center gap-2 glass border border-white/10 text-white/60 font-semibold px-7 py-3.5 rounded-xl text-base cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </button>
              )}
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
                app.status === "Live"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}>
                {app.status === "Live" && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                {app.status}
              </span>
            </div>
          </div>

          {/* Mini stats */}
          <div className="lg:w-80 glass rounded-2xl border border-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
              Quick Info
            </p>
            {[
              { label: "Category", value: app.category },
              { label: "Starting Price", value: "Free" },
              { label: "Support", value: "Email + Chat" },
              { label: "Availability", value: "Malaysia + SEA" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/40">{item.label}</span>
                <span className="text-sm font-medium text-white/80">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-black mb-8">Key Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {app.features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="glass rounded-xl border border-white/5 p-5 hover:border-violet-500/20 transition-all group"
                >
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Pricing */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black">Simple, Transparent Pricing</h2>
              <p className="mt-2 text-white/50">All prices in Malaysian Ringgit (MYR). Billed monthly.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {app.plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl border p-7 flex flex-col transition-all ${
                    plan.highlighted
                      ? "gradient-brand border-transparent glow-brand relative"
                      : "glass border-white/5 hover:border-white/10"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-900" /> Most Popular
                    </div>
                  )}
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">{plan.name}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      {plan.price === 0 ? (
                        <span className="text-4xl font-black text-white">Free</span>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-white/60">RM</span>
                          <span className="text-4xl font-black text-white">{plan.price}</span>
                          <span className="text-sm text-white/50">/mo</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2.5 flex-1 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-white/80" : "text-violet-400"}`} />
                        <span className={plan.highlighted ? "text-white/80" : "text-white/60"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={app.status === "Live" ? getAppUrl(app.slug) : "#"}
                    target={app.slug === "vertex-hrms" || app.slug === "xentra" ? "_blank" : undefined}
                    rel={app.slug === "vertex-hrms" || app.slug === "xentra" ? "noopener noreferrer" : undefined}
                    id={`plan-${app.slug}-${plan.name.toLowerCase()}`}
                    className={`inline-flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm transition-all ${
                      plan.highlighted
                        ? "bg-white text-violet-700 hover:bg-white/90"
                        : "glass border border-white/10 text-white hover:bg-white/5"
                    } ${app.status !== "Live" ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                  >
                    {app.status === "Live" ? `Get ${plan.name}` : "Coming Soon"}
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
