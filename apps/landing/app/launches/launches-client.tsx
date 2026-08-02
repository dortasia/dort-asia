"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Pin, Bell } from "lucide-react";

type TagType = "New" | "Improved" | "Fixed" | "Breaking";

const TAG_COLORS: Record<TagType, string> = {
  New: "bg-green-500/15 text-green-400",
  Improved: "bg-blue-500/15 text-blue-400",
  Fixed: "bg-orange-500/15 text-orange-400",
  Breaking: "bg-red-500/15 text-red-400",
};

const releases = [
  {
    version: "v1.0.0",
    date: "April 2026",
    title: "Dort Asia Platform Launch 🎉",
    description:
      "The Dort Asia platform is officially live! Vertex HRMS is now available with full payroll, leave, attendance, and recruitment modules. Sign up and get a 14-day Pro trial for free.",
    app: "Platform",
    tags: ["New"] as TagType[],
    pinned: true,
    highlights: [
      "Vertex HRMS — full HR suite for Malaysian companies",
      "Single Sign-On across all Dort Asia apps",
      "EPF, SOCSO, PCB payroll calculations",
      "Geofenced clock-in with GPS verification",
      "Self-service leave portal with approval workflows",
    ],
  },
  {
    version: "v1.0.1",
    date: "April 2026",
    title: "Vertex HRMS — Org Chart & Performance Reviews",
    description:
      "Added visual org chart with drill-down navigation and the full Performance Review module with 360-degree feedback cycles.",
    app: "Vertex HRMS",
    tags: ["New", "Improved"] as TagType[],
    pinned: false,
    highlights: [
      "Interactive org chart with department drill-down",
      "360-degree performance review templates",
      "Automated review reminder notifications",
    ],
  },
  {
    version: "v0.9.5",
    date: "March 2026",
    title: "Beta: Attendance geofencing improvements",
    description:
      "Resolved edge cases in GPS clock-in verification. Reduced false negatives for employees on office perimeter.",
    app: "Vertex HRMS",
    tags: ["Fixed", "Improved"] as TagType[],
    pinned: false,
    highlights: [
      "Increased geofence accuracy from 85% to 99.2%",
      "Added manual override for admins",
    ],
  },
];

export function LaunchesClient() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const pinned = releases.find((r) => r.pinned);
  const rest = releases.filter((r) => !r.pinned);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="bg-[#0a0a12] min-h-screen text-white pt-24 pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
            Changelog
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black">New Launches</h1>
          <p className="mt-4 text-white/50 text-lg max-w-lg mx-auto">
            Stay up to date with the latest features, fixes, and announcements
            from the Dort Asia team.
          </p>
        </motion.div>

        {/* Email opt-in */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass border border-white/10 rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Get notified on new launches</p>
              <p className="text-xs text-white/40">We send maximum 1-2 emails per month.</p>
            </div>
          </div>
          {subscribed ? (
            <p className="text-sm text-green-400 font-medium">✓ You&apos;re subscribed!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto">
              <input
                id="launches-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 sm:w-52 glass border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                required
              />
              <button
                type="submit"
                className="gradient-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </motion.div>

        {/* Pinned release */}
        {pinned && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8"
          >
            <div className="relative glass rounded-2xl border border-violet-500/30 p-7 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 gradient-brand" />
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                  <Pin className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-bold text-violet-400">{pinned.version}</span>
                    <span className="text-xs text-white/30">·</span>
                    <span className="text-xs text-white/40">{pinned.date}</span>
                    <span className="text-xs text-white/30">·</span>
                    <span className="text-xs font-medium text-white/50">{pinned.app}</span>
                    {pinned.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[tag]}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    {pinned.title}
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </h2>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{pinned.description}</p>
                  {pinned.highlights && (
                    <ul className="mt-4 flex flex-col gap-2">
                      {pinned.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="gradient-brand-text font-bold mt-0.5">✦</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Release list */}
        <div className="flex flex-col gap-6">
          {rest.map((release, i) => (
            <motion.div
              key={release.version + release.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="glass rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-xs font-bold text-violet-400">{release.version}</span>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs text-white/40">{release.date}</span>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs font-medium text-white/50">{release.app}</span>
                {release.tags.map((tag) => (
                  <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[tag]}`}>
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="font-bold text-white mb-2">{release.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{release.description}</p>
              {release.highlights && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {release.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="text-violet-400 mt-0.5">▸</span> {h}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
