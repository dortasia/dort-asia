"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full relative overflow-hidden bg-white border-t border-gray-100 font-text pt-10 md:pt-12 pb-6 px-6 md:px-10 flex flex-col justify-between min-h-[420px] md:min-h-[500px]">
      <div className="max-w-7xl mx-auto w-full relative z-20 flex flex-col justify-between h-full flex-grow">
        
        {/* Top & Main Section: Logo on Left, Social & Links Grid on Right (Right-to-left anchored) */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-28 md:mb-36 w-full">
          
          {/* Left Column: Brand Logo (Monochrome black for footer only) */}
          <div className="shrink-0">
            <Link href="/" className="inline-block">
              <Image 
                src="/company_logo/DortAsiaLogo.svg" 
                alt="Dort Asia" 
                width={150} 
                height={48} 
                className="h-8 md:h-9 w-auto object-contain brightness-0" 
              />
            </Link>
          </div>

          {/* Right Column: Social Media + 3 Link Categories (Anchored to Right Edge) */}
          <div className="flex flex-col items-start md:items-end w-full md:w-auto md:ml-auto">
            
            {/* Social Media Header Row - pinned to the right */}
            <div className="flex items-center gap-3.5 mb-8 md:mb-10 self-start md:self-end">
              <span className="text-[#1d1d1f] font-medium text-sm">Social Media</span>
              <div className="flex items-center gap-2">
                <a 
                  href="https://x.com/dortasia?s=11"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-9 h-9 rounded-xl border border-gray-200/90 flex items-center justify-center text-[#1d1d1f] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {/* X (Twitter) Icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/dortasiasg?igsh=MThwaGNkMWVlaDl0Yg=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-xl border border-gray-200/90 flex items-center justify-center text-[#1d1d1f] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {/* Instagram Icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/company/dort-asia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-xl border border-gray-200/90 flex items-center justify-center text-[#1d1d1f] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {/* LinkedIn Icon */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a 
                  href="https://youtube.com/@dortasiayt?si=4W9whVtgUmn1UsXh"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-xl border border-gray-200/90 flex items-center justify-center text-[#1d1d1f] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {/* YouTube Icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.17 1 12 1 12s0 3.83.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.83 23 12 23 12s0-3.83-.46-5.58z"></path>
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap justify-start md:justify-end gap-10 sm:gap-14 md:gap-16 lg:gap-20 w-full sm:w-auto self-start md:self-end">
              <div className="text-left">
                <h4 className="text-[#1d1d1f] font-semibold text-[15px] mb-3.5">Features</h4>
                <ul className="space-y-2.5">
                  <li><span className="text-[#86868b] text-[14px] transition-colors whitespace-nowrap">Subscription Management</span></li>
                  <li><span className="text-[#86868b] text-[14px] transition-colors whitespace-nowrap">Custom checkout</span></li>
                  <li><span className="text-[#86868b] text-[14px] transition-colors whitespace-nowrap">Campaign strategy</span></li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-[#1d1d1f] font-semibold text-[15px] mb-3.5">Explore</h4>
                <ul className="space-y-2.5">
                  <li><Link href="/services" className="text-[#86868b] hover:text-[#1d1d1f] text-[14px] transition-colors whitespace-nowrap">Services</Link></li>
                  <li><Link href="/work-with-us" className="text-[#86868b] hover:text-[#1d1d1f] text-[14px] transition-colors whitespace-nowrap">Work With Us</Link></li>
                  <li><Link href="/about" className="text-[#86868b] hover:text-[#1d1d1f] text-[14px] transition-colors whitespace-nowrap">About Us</Link></li>
                  <li><Link href="/pricing" className="text-[#86868b] hover:text-[#1d1d1f] text-[14px] transition-colors whitespace-nowrap">Pricing</Link></li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-[#1d1d1f] font-semibold text-[15px] mb-3.5">Help</h4>
                <ul className="space-y-2.5">
                  <li><Link href="/work-with-us" className="text-[#86868b] hover:text-[#1d1d1f] text-[14px] transition-colors whitespace-nowrap">FAQs</Link></li>
                  <li><a href="mailto:enquiry@dortasia.com" className="text-[#86868b] hover:text-[#1d1d1f] text-[14px] transition-colors whitespace-nowrap">Email</a></li>
                  <li><span className="text-[#86868b] text-[14px] transition-colors whitespace-nowrap">Help centre</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Edge Legal Bar: Rights Reserved */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 text-[#676767] text-[13px] pt-4 mt-auto relative z-30">
          <p className="font-normal text-[#676767]">@2026 Dort Asia all rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[#676767]">
            <Link href="/terms-and-conditions" className="transition-colors hover:text-[#1d1d1f]">Terms and Conditions</Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-[#1d1d1f]">Privacy Policy</Link>
            <span className="transition-colors">Cookie Policy</span>
          </div>
        </div>
      </div>

      {/* Giant Centered Watermark Logo + Text */}
      <div className="absolute -bottom-4 sm:-bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[1600px] flex items-center justify-center gap-6 px-4 pointer-events-none z-0">
        
        {/* Symbol from DortAsiaLogo.svg */}
        <div className="text-[#676767] opacity-25 flex items-center justify-center shrink-0">
          <svg 
            className="w-[12vw] h-auto max-w-[200px] md:w-[180px] lg:w-[220px]" 
            viewBox="0 0 40 42" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20.8435 26.7991C20.7563 26.3512 20.7849 24.7449 20.7866 24.2157L20.8066 19.3635C20.9679 19.0983 21.1608 18.8503 21.346 18.6005C22.6049 16.9019 23.8019 15.1485 25.1561 13.5186C26.0392 13.7525 26.7775 14.1515 27.4213 14.7808C29.45 16.7645 29.1524 19.2962 29.1461 21.8522L29.1415 26.3799C31.0331 27.5277 32.9362 28.6578 34.8504 29.77C35.8871 30.344 36.9615 30.9899 37.9891 31.5864L37.9832 40.3353C34.8459 38.3944 31.5542 36.6011 28.4192 34.6541C24.6419 32.3083 21.5479 31.539 20.8435 26.7991Z" fill="currentColor"/>
            <path d="M2.87452 18.8815L2.92384 18.8281C3.78891 19.3208 4.15966 19.7785 5.3547 19.8952C9.5819 20.2779 11.351 16.8839 13.4591 14.1286C15.4871 11.478 17.5601 8.03504 20.1496 5.95693C21.9548 4.50745 24.7143 4.04048 26.9601 4.3326C29.2512 4.63026 32.4894 6.11374 33.9047 7.93305L33.876 8.01076L33.6552 7.92819C33.4475 7.85603 33.2381 7.78873 33.0273 7.72558C28.2079 6.31843 24.4493 11.5848 22.1174 14.7815C21.1459 16.1227 20.1652 17.4584 19.1755 18.7871C17.9539 20.4169 16.7284 22.1067 14.849 23.0653C12.9089 24.0549 10.5657 24.2228 8.48299 23.584C5.88125 22.7862 4.12498 21.17 2.87452 18.8815Z" fill="currentColor"/>
            <path d="M26.533 11.8825C26.6726 11.7 26.8626 11.5106 27.0228 11.3399C29.1583 9.06127 33.0369 7.9483 35.5754 10.3192C36.85 11.5099 37.6066 13.9419 37.8573 15.6162C38.0592 16.9658 37.9876 18.6449 37.988 20.0457L37.9858 26.854L37.979 29.7291C35.7483 28.5387 33.0324 26.8451 30.8148 25.5424L30.8271 20.0016C30.8338 17.4986 31.132 14.6878 28.9579 12.8491C28.2526 12.253 27.4423 12.0005 26.533 11.8825Z" fill="currentColor"/>
            <path d="M20.0953 30.0941C17.6033 31.2237 15.3811 31.7423 12.6031 31.5301C9.04967 31.2383 5.7587 29.6037 3.44458 26.9813C1.08472 24.2861 -0.256647 20.5088 0.0410226 16.9866C0.309897 16.9179 0.224029 16.9713 0.404811 16.8027C1.76455 22.3762 6.71071 26.4111 12.8518 25.4129C15.5942 24.9672 17.3629 23.6039 19.0899 21.5752C19.1084 24.8041 18.7367 27.0776 20.0953 30.0941Z" fill="currentColor"/>
            <path d="M6.71338 25.4457L6.79114 25.3485C6.99668 25.2582 7.25027 25.3098 7.48755 25.33L7.4345 25.3899C7.21724 25.4836 6.9605 25.4511 6.71338 25.4457Z" fill="currentColor"/>
            <path d="M5.78809 6.23055C9.02952 3.65979 18.7195 -0.354448 22.9016 0.0250955C25.1576 0.230477 28.7284 1.4038 30.4332 2.86438C30.2393 3.18009 29.6988 3.16552 29.3395 3.24809C24.2782 1.81595 19.5097 2.20429 13.384 10.4936C11.7374 9.54027 7.37973 7.29007 5.78809 6.23055Z" fill="currentColor"/>
            <path d="M25.1719 1.21854C25.614 1.04646 26.3703 1.10197 26.8563 1.12764C26.6177 1.31776 25.5337 1.22826 25.1719 1.21854Z" fill="currentColor"/>
            <path d="M1.92286 14.7913C1.76182 13.8803 1.67753 12.3309 1.93442 11.4497C2.60307 8.12531 5.78843 6.2306 5.78843 6.2306C5.78843 6.2306 14.1194 9.3095 13.3843 10.4937C12.6492 11.6779 11.179 15.2304 9.79887 16.3476C8.41869 17.4649 2.96562 19.4105 1.92286 14.7913Z" fill="currentColor"/>
            <path d="M32.754 4.91753C31.5531 4.15428 30.689 3.73519 29.3394 3.2481C29.6986 3.16553 30.2392 3.1801 30.433 2.86439C31.2486 3.35356 32.1102 4.2424 32.754 4.91753Z" fill="currentColor"/>
            <path d="M0.0410156 16.9866C0.0715265 16.5508 0.0924214 16.0485 0.168738 15.6231C0.25116 16.0152 0.32985 16.4086 0.404804 16.8027C0.224022 16.9713 0.30989 16.9179 0.0410156 16.9866Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Text */}
        <div 
          className="text-[#676767] opacity-25 font-semibold tracking-tight leading-none whitespace-nowrap"
          style={{ 
            fontFamily: "'SF Pro Display', 'SF Pro', -apple-system, sans-serif", 
            fontSize: "clamp(60px, 15vw, 250px)"
          }}
        >
          DORT ASIA
        </div>
      </div>

      {/* Gradient Mask to fade out the bottom half of the background logo */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
    </footer>
  );
}
