"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react";

const contactInfo = [
  { icon: Mail, label: "Email", value: "hello@dortasia.com", href: "mailto:hello@dortasia.com" },
  { icon: Phone, label: "Phone", value: "+60 3-1234 5678", href: "tel:+60312345678" },
  { icon: MapPin, label: "Address", value: "Level 15, Menara TM, Jalan Pantai Baharu, 50672 Kuala Lumpur", href: "#" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="bg-[#0a0a12] min-h-screen text-white pt-24 pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
            Get in Touch
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black">Contact Us</h1>
          <p className="mt-4 text-white/50 text-lg max-w-lg mx-auto">
            Have questions? Our team is ready to help. Drop us a message and we&apos;ll
            get back to you within one business day.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            {contactInfo.map((info) => (
              <a
                key={info.label}
                href={info.href}
                className="flex items-start gap-4 glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                  <info.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">
                    {info.label}
                  </p>
                  <p className="text-sm text-white/70 group-hover:text-white transition-colors leading-relaxed">
                    {info.value}
                  </p>
                </div>
              </a>
            ))}

            <div className="glass rounded-xl border border-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">
                Office Hours (MYT)
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Monday – Friday</span>
                  <span className="text-white/80 font-medium">9:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Saturday</span>
                  <span className="text-white/80 font-medium">10:00 AM – 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Sunday</span>
                  <span className="text-white/40">Closed</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-3"
          >
            <div className="glass rounded-2xl border border-white/5 p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                  <p className="text-white/50 text-sm max-w-xs">
                    Thanks for reaching out. Our team will get back to you within
                    one business day.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", company: "", message: "" }); }}
                    className="mt-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Send another message →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <h2 className="text-xl font-bold text-white mb-2">Send us a message</h2>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Full Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ahmad Rashid"
                        className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Work Email *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="ahmad@company.com"
                        className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-company" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Company Name
                    </label>
                    <input
                      id="contact-company"
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Acme Sdn Bhd"
                      className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                      className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="contact-submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 gradient-brand text-white font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all glow-sm disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
