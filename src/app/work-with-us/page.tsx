import { Suspense } from 'react';
import WorkWithUsForm from '@/components/sections/work-with-us-form';
import { MapPin, Mail, Phone, ChevronDown, ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

import { constructMetadata } from "@/config/seo";
export const metadata: Metadata = constructMetadata({
  title: 'Work With Us',
  description: 'Connect with Dort Asia for world-class technology talent, dedicated engineers, and bespoke software solutions.',
  alternates: {
    canonical: "/work-with-us",
  },
});

const faqs = [
  {
    question: 'What technology talent engagement models do you offer?',
    answer: 'We provide flexible engagement models tailored to your roadmap, including dedicated engineering squads, staff augmentation to quickly scale your existing teams, and end-to-end managed project delivery.'
  },
  {
    question: 'How quickly can we onboard engineers or begin development?',
    answer: 'Thanks to our pre-vetted network of senior software engineers, architects, and product specialists, we can typically match and introduce talent within 48 to 72 hours, with project kickoffs scheduled in under a week.'
  },
  {
    question: 'What types of custom software solutions do you build?',
    answer: 'We design and build high-performance web platforms, enterprise SaaS applications, iOS/Android mobile apps, and tailored AI/ML integrations designed for scale and security.'
  },
  {
    question: 'Where is Dort Asia located and what markets do you serve?',
    answer: 'Dort Asia is headquartered in Singapore at 18 Kaki Bukit Road 3. We partner with high-growth startups, scale-ups, and multinational enterprises across the Asia-Pacific region and globally.'
  },
  {
    question: 'How does the discovery and consultation process work?',
    answer: 'Simply submit your inquiry through the form above or email enquiry@dortasia.com. Our technical solutions team will review your objectives and schedule an introductory discovery call to discuss requirements, feasibility, and timelines.'
  }
];

export default function WorkWithUsPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <main className="min-h-screen bg-[#fafafc] text-[#1d1d1f] font-text pb-24 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      
      {/* Top clean white background transition */}
      <div className="absolute top-0 left-0 right-0 h-[480px] lg:h-[540px] bg-white border-b border-gray-100 z-0"></div>

      <div className="relative z-10">
        {/* Spacer for fixed navbar */}
        <div className="h-24 md:h-28"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
          
          {/* Header Section - Editorial Apple Typography matching website */}
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f5f5f7] border border-gray-200/80 text-[12px] md:text-[13px] font-semibold text-[#86868b] tracking-wider uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Connect with Dort Asia</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.15] mb-4">
              Get in touch with our team today.
            </h1>
            <p className="text-[#6e6e73] text-[16px] md:text-[18px] max-w-xl mx-auto leading-relaxed">
              Whether you need elite technology talent or custom software solutions built from the ground up, we’re ready to accelerate your vision.
            </p>
          </div>

          {/* Form Container */}
          <div className="max-w-5xl mx-auto mb-16 md:mb-20">
            <Suspense fallback={
              <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center text-[#86868b] min-h-[380px] flex items-center justify-center">
                Loading form...
              </div>
            }>
              <WorkWithUsForm />
            </Suspense>
          </div>

          {/* Contact Info Cards */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 md:mb-32">
            
            {/* Address */}
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-between text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-gray-300 transition-all group">
              <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-5 border border-gray-200/60 group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 text-[#1d1d1f]" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">Singapore Office</h3>
                <p className="text-[#6e6e73] text-[14px] leading-relaxed max-w-[260px]">
                  18 Kaki Bukit Road 3, #03-09 Entrepreneur Business Centre, Singapore 415978
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 w-full text-xs font-medium text-[#86868b]">
                Headquarters
              </div>
            </div>

            {/* Email */}
            <a 
              href="mailto:enquiry@dortasia.com"
              className="bg-white rounded-3xl p-8 flex flex-col items-center justify-between text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-gray-300 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-5 border border-gray-200/60 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6 text-[#1d1d1f]" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">Email Inquiries</h3>
                <p className="text-[#0071e3] text-[15px] font-medium hover:underline">
                  enquiry@dortasia.com
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 w-full text-xs font-medium text-[#86868b] flex items-center justify-center gap-1">
                <span>Direct response</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </div>
            </a>

            {/* Phone */}
            <a 
              href="tel:+6593412340"
              className="bg-white rounded-3xl p-8 flex flex-col items-center justify-between text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-gray-300 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-5 border border-gray-200/60 group-hover:scale-105 transition-transform">
                <Phone className="w-6 h-6 text-[#1d1d1f]" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">Direct Line</h3>
                <p className="text-[#1d1d1f] text-[15px] font-medium">
                  +65 9341 2340
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 w-full text-xs font-medium text-[#86868b] flex items-center justify-center gap-1">
                <span>Mon – Fri, 9am – 6pm SGT</span>
              </div>
            </a>
          </div>

          {/* FAQ Section */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-24 md:mb-32 items-start">
            
            {/* Left Side: Title & CTA */}
            <div className="lg:col-span-5 flex flex-col justify-start">
              <div className="text-[13px] font-semibold text-[#86868b] tracking-wider uppercase mb-3">
                02 — Common Questions
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-[42px] font-semibold tracking-tight text-[#1d1d1f] mb-5 leading-tight">
                Frequently asked questions
              </h2>
              <p className="text-[#6e6e73] text-[16px] mb-8 leading-relaxed">
                Learn more about how we engage with partners, source dedicated engineering talent, and deliver custom digital solutions.
              </p>
              <div>
                <a 
                  href="mailto:enquiry@dortasia.com?subject=Consultation%20Request"
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-[#1d1d1f] hover:bg-black text-white text-[15px] font-medium rounded-full transition-all duration-200 shadow-sm active:scale-[0.99] gap-2"
                >
                  <span>Request a Consultation</span>
                  <ArrowUpRight className="w-4 h-4 text-white/80" />
                </a>
              </div>
            </div>

            {/* Right Side: Accordion */}
            <div className="lg:col-span-7 space-y-3.5">
              {faqs.map((faq, index) => (
                <details 
                  key={index}
                  className="group bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-gray-300 transition-all [&_summary::-webkit-details-marker]:hidden overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 md:p-6 cursor-pointer font-medium text-[16px] md:text-[17px] text-[#1d1d1f] outline-none select-none">
                    <span className="pr-4">{faq.question}</span>
                    <span className="ml-auto flex-shrink-0 w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center group-open:rotate-180 group-open:bg-[#1d1d1f] group-open:text-white transition-all duration-200">
                      <ChevronDown className="w-4 h-4 text-current" />
                    </span>
                  </summary>
                  <div className="px-5 md:px-6 pb-6 text-[#6e6e73] text-[15px] leading-relaxed">
                    <div className="pt-3 border-t border-gray-100">
                      {faq.answer}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      <Footer />
    </main>
  );
}
