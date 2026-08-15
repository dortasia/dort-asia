"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChevronLeft, Download, MousePointerClick, Loader2, Mail } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

/* ─── PDF Generation Helper ─── */
async function downloadVisitingCardPDF(setIsDownloading?: (v: boolean) => void) {
  if (setIsDownloading) setIsDownloading(true);
  try {
    const { default: jsPDF } = await import("jspdf");

    const loadImg = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const fetchSvgBlobUrl = async (url: string) => {
      const res = await fetch(url);
      const text = await res.text();
      const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
      return URL.createObjectURL(blob);
    };

    const frontBlobUrl = await fetchSvgBlobUrl("/assets/dinesh_vc_front.svg");
    const backBlobUrl = await fetchSvgBlobUrl("/assets/dinesh_vc_back.svg");
    const logoBlobUrl = await fetchSvgBlobUrl("/company_logo/DortAsiaOfflLogo.svg");

    const [frontImg, backImg, logoImg] = await Promise.all([
      loadImg(frontBlobUrl),
      loadImg(backBlobUrl),
      loadImg(logoBlobUrl),
    ]);

    const canvasW = 2100;
    const canvasH = 1200;

    // 1. Render Front Side
    const frontCanvas = document.createElement("canvas");
    frontCanvas.width = canvasW;
    frontCanvas.height = canvasH;
    const frontCtx = frontCanvas.getContext("2d");
    if (frontCtx) {
      frontCtx.drawImage(frontImg, 0, 0, canvasW, canvasH);
    }

    // 2. Render Back Side with QR Code & Logo
    const backCanvas = document.createElement("canvas");
    backCanvas.width = canvasW;
    backCanvas.height = canvasH;
    const backCtx = backCanvas.getContext("2d");
    if (backCtx) {
      backCtx.drawImage(backImg, 0, 0, canvasW, canvasH);

      // Get the QR code SVG from the DOM or render it
      const qrSvgEl = document.querySelector("#visiting-card-qr-container svg");
      if (qrSvgEl) {
        const qrSvgString = new XMLSerializer().serializeToString(qrSvgEl);
        const qrBlob = new Blob([qrSvgString], { type: "image/svg+xml;charset=utf-8" });
        const qrBlobUrl = URL.createObjectURL(qrBlob);
        const qrImg = await loadImg(qrBlobUrl);

        const qrW = canvasW * 0.23;
        const qrH = qrW;
        const qrX = canvasW * 0.55;
        const qrY = (canvasH * 0.405) - (20 * (canvasH / 600));

        // Draw white rounded background box
        backCtx.fillStyle = "#ffffff";
        backCtx.beginPath();
        if (typeof backCtx.roundRect === "function") {
          backCtx.roundRect(qrX, qrY, qrW, qrH, 24);
        } else {
          backCtx.rect(qrX, qrY, qrW, qrH);
        }
        backCtx.fill();

        // Draw QR SVG inside with padding
        const pad = qrW * 0.08;
        backCtx.drawImage(qrImg, qrX + pad, qrY + pad, qrW - pad * 2, qrH - pad * 2);

        // Draw soft-edged center logo box
        const centerBoxW = qrW * 0.32;
        const centerBoxH = qrH * 0.32;
        const centerBoxX = qrX + (qrW - centerBoxW) / 2;
        const centerBoxY = qrY + (qrH - centerBoxH) / 2;

        backCtx.fillStyle = "#ffffff";
        backCtx.beginPath();
        if (typeof backCtx.roundRect === "function") {
          backCtx.roundRect(centerBoxX, centerBoxY, centerBoxW, centerBoxH, 12);
        } else {
          backCtx.rect(centerBoxX, centerBoxY, centerBoxW, centerBoxH);
        }
        backCtx.fill();

        // Draw black logo in center
        const logoW = centerBoxW * 0.75;
        const logoH = logoW * (logoImg.height / logoImg.width);
        const logoX = centerBoxX + (centerBoxW - logoW) / 2;
        const logoY = centerBoxY + (centerBoxH - logoH) / 2;

        // Make logo black
        const logoCanvas = document.createElement("canvas");
        logoCanvas.width = Math.max(logoW * 2, 10);
        logoCanvas.height = Math.max(logoH * 2, 10);
        const logoCtx = logoCanvas.getContext("2d");
        if (logoCtx) {
          logoCtx.drawImage(logoImg, 0, 0, logoCanvas.width, logoCanvas.height);
          logoCtx.globalCompositeOperation = "source-in";
          logoCtx.fillStyle = "#1d1d1f";
          logoCtx.fillRect(0, 0, logoCanvas.width, logoCanvas.height);
          backCtx.drawImage(logoCanvas, logoX, logoY, logoW, logoH);
        }

        URL.revokeObjectURL(qrBlobUrl);
      }
    }

    URL.revokeObjectURL(frontBlobUrl);
    URL.revokeObjectURL(backBlobUrl);
    URL.revokeObjectURL(logoBlobUrl);

    // 3. Create PDF
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [105, 60],
    });

    // Page 1: Front
    pdf.addImage(frontCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 105, 60, undefined, "FAST");

    // Page 2: Back
    pdf.addPage([105, 60], "landscape");
    pdf.addImage(backCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 105, 60, undefined, "FAST");

    // Save
    pdf.save("Dinesh_VC_DORT_Asia_Visiting_Card.pdf");
  } catch (error) {
    console.error("Failed to generate PDF:", error);
  } finally {
    if (setIsDownloading) setIsDownloading(false);
  }
}

/* ─── 3D Visiting Card Component ─── */
function VisitingCard3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [clickFlipped, setClickFlipped] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Scale: subtle breathing effect
  const scale = useTransform(scrollYProgress, [0.0, 0.5, 1.0], [0.92, 1, 0.92]);
  // Vertical float (locked to center)
  const y = useTransform(scrollYProgress, [0.0, 0.5, 1.0], [0, 0, 0]);
  // Shadow intensity
  const shadowOpacity = useTransform(scrollYProgress, [0.0, 0.5, 1.0], [0.08, 0.35, 0.08]);

  // Flip from 0 to 180 across the sticky scroll journey
  // Stays at 180 when the scroll finishes and the section unpins
  const rawScrollRotateY = useTransform(scrollYProgress, [0.15, 0.85], [0, 180]);
  
  // Make the scroll scrubbing buttery smooth
  const scrollRotateY = useSpring(rawScrollRotateY, { stiffness: 150, damping: 25, mass: 0.5 });

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[200vh] bg-white"
    >
      <div 
        className="sticky top-0 w-full h-screen flex flex-col justify-center overflow-hidden px-6 md:px-10 py-6"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(6,81,233,0.04) 0%, transparent 70%), #fafafa",
        }}
      >
        <div className="max-w-[1200px] w-full mx-auto flex flex-col items-center justify-center">
          {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5 sm:mb-6"
        >
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.2em] uppercase text-[#86868b] mb-1">
            Business Card
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1d1d1f] tracking-tight">
            Get in Touch
          </h2>
        </motion.div>

        {/* 3D Card Container */}
        <div
          className="relative w-full flex justify-center items-center cursor-pointer"
          style={{ perspective: "1500px" }}
          onClick={() => setClickFlipped(!clickFlipped)}
        >
          {/* Ambient glow behind card */}
          <motion.div
            className="absolute w-[100vw] max-w-[494px] sm:max-w-none sm:w-[650px] sm:h-[377px] md:w-[754px] md:h-[442px] aspect-[1050/600] rounded-[40px] pointer-events-none"
            style={{
              opacity: shadowOpacity,
              background:
                "radial-gradient(ellipse at center, rgba(6,81,233,0.25) 0%, rgba(6,81,233,0.08) 40%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          {/* Outer scroll-driven rotation wrapper */}
          <motion.div
            className="relative w-[90vw] max-w-[442px] sm:max-w-none sm:w-[598px] sm:h-[342px] md:w-[683px] md:h-[390px] aspect-[1050/600]"
            style={{
              scale,
              y,
              rotateY: scrollRotateY,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Inner click-driven rotation wrapper */}
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ rotateY: clickFlipped ? 180 : 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* ── Front Face ── */}
              <div
                className="absolute inset-0 rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-2xl"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
              <Image
                src="/assets/dinesh_vc_front.svg"
                alt="Dinesh V C – Business Card Front"
                fill
                className="object-cover"
                priority
              />
              {/* Subtle glass edge reflection */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.06) 100%)",
                }}
              />
            </div>

            {/* ── Back Face ── */}
            <div
              className="absolute inset-0 rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-2xl"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <Image
                src="/assets/dinesh_vc_back.svg"
                alt="Dinesh V C – Business Card Back"
                fill
                className="object-cover"
                priority
              />
              
              {/* QR Code Overlay (Matching Red Box Size & Position) */}
              <div 
                id="visiting-card-qr-container"
                className="absolute flex items-center justify-center p-[2%] shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-white rounded-xl" 
                style={{ 
                  top: 'calc(40.5% - 20px)', 
                  left: '55%', 
                  width: '23%', 
                  aspectRatio: '1/1',
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* High Error Correction QR with excavated center */}
                  <QRCodeSVG 
                    value="https://dortasia.com/about/leadership/dinesh?scan=true" 
                    size={256}
                    style={{ width: '100%', height: '100%' }} 
                    fgColor="#1d1d1f"
                    level="H"
                    imageSettings={{
                      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
                      x: undefined,
                      y: undefined,
                      height: 56,
                      width: 56,
                      excavate: true,
                    }}
                  />
                  
                  {/* Center Soft-Edged Logo Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[32%] h-[32%] bg-white rounded-[8px] flex items-center justify-center shadow-sm">
                      <Image 
                        src="/company_logo/DortAsiaOfflLogo.svg"
                        alt="DORT Asia Logo"
                        width={40}
                        height={40}
                        className="w-[75%] h-auto brightness-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle glass edge reflection */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(225deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.06) 100%)",
                }}
              />
            </div>
          </motion.div>
          </motion.div>
        </div>

        {/* Interaction Hint & Download Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[#86868b] mt-5 sm:mt-6 tracking-wide font-medium"
        >
          <MousePointerClick className="w-3.5 h-3.5 text-[#0651e9]" />
          <span>Scroll or click card to flip</span>
        </motion.div>

        {/* Big Download E-Visiting Card Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-center mt-3.5 sm:mt-4"
        >
          <button
            onClick={() => downloadVisitingCardPDF(setIsGeneratingPdf)}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center gap-3 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#1d1d1f] hover:bg-black disabled:opacity-75 text-white text-[15px] sm:text-[16px] font-semibold tracking-tight transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-black/25 hover:scale-[1.03] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span>Download E-Visiting Card (PDF)</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
      </div>
    </section>
  );
}

export default function DineshProfilePage() {
  const [showScanModal, setShowScanModal] = useState(false);

  useEffect(() => {
    // Check if the user arrived via QR Code scan
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("scan") === "true") {
        setShowScanModal(true);
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-white font-text flex flex-col justify-between">
      <Navbar />

      {/* QR Code Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Close button */}
            <button 
              onClick={() => setShowScanModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-black/50 transition-colors"
            >
              ✕
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f7] mb-4 flex items-center justify-center shadow-inner overflow-hidden border border-black/5">
                <Image 
                  src="/assets/dinesh_PP.avif" 
                  alt="Dinesh V C Profile" 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">
                Dinesh V C
              </h3>
              <p className="text-[14px] text-[#86868b] font-medium mb-8">
                Founder @ DORT Asia
              </p>
              
              <div className="w-full flex flex-col gap-3">
                <Link 
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] font-semibold text-[15px] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Company Website
                </Link>
                
                <button 
                  onClick={() => setShowScanModal(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] font-semibold text-[15px] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile Page
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Header Section (Apple Executive Style) */}
      <section className="w-full bg-[#f5f5f7] pt-24 md:pt-28 border-b border-black/[0.04] flex justify-center px-6 md:px-10 overflow-hidden">
        <div className="max-w-[1200px] w-full flex flex-col justify-between">
          
          {/* Back to About navigation */}
          <div className="mb-4 md:mb-6">
            <Link 
              href="/about" 
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to About</span>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
            
            {/* Left Column: Name, Designation & Social Links */}
            <div className="pb-6 md:pb-8 flex flex-col justify-end">
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight leading-[1.08]"
              >
                Dinesh V C
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl sm:text-2xl text-[#86868b] font-normal mt-1 tracking-tight"
              >
                Founder
              </motion.p>

              {/* Social Media Links */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-3 mt-6"
              >
                {/* Email / Mail */}
                <a
                  href="mailto:sales@dortasia.com"
                  className="w-10 h-10 rounded-full bg-white hover:bg-[#EA4335] text-[#1d1d1f] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-110 active:scale-95 border border-black/[0.06] group"
                  aria-label="Send Email"
                >
                  <Mail className="w-4.5 h-4.5 transition-transform group-hover:scale-105" />
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/dinesh-v-c-/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white hover:bg-[#0A66C2] text-[#1d1d1f] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-110 active:scale-95 border border-black/[0.06] group"
                  aria-label="LinkedIn Profile"
                >
                  <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>

                {/* Twitter / X */}
                <a
                  href="https://x.com/dinesh_nc?s=11"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white hover:bg-black text-[#1d1d1f] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-110 active:scale-95 border border-black/[0.06] group"
                  aria-label="Twitter X Profile"
                >
                  <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/ncdinesh?igsh=MTN2bDV4MWd1MWMyMA=="
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] text-[#1d1d1f] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-110 active:scale-95 border border-black/[0.06] group"
                  aria-label="Instagram Profile"
                >
                  <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/dinesh.nc.3/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white hover:bg-[#1877F2] text-[#1d1d1f] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-110 active:scale-95 border border-black/[0.06] group"
                  aria-label="Facebook Profile"
                >
                  <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </motion.div>
            </div>

            {/* Right Column: Executive Portrait Frame (Apple style) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="w-[260px] sm:w-[280px] md:w-[300px] lg:w-[320px] aspect-[4/5] sm:aspect-auto sm:h-[300px] md:h-[340px] relative flex items-end justify-center shrink-0 self-center md:self-end"
            >
              {/* Full-Fit Portrait Rectangle Card */}
              <div className="w-full h-full rounded-t-[28px] rounded-b-none overflow-hidden relative shadow-lg border-t border-x border-black/[0.06] group">
                <Image 
                  src="/assets/dinesh_PP.avif" 
                  alt="Dinesh V C Profile" 
                  fill 
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105" 
                  priority
                />
                
                {/* Mild dark gray vignette (bottom only) */}
                <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#1d1d20]/55 via-[#1d1d20]/20 to-transparent pointer-events-none" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Editorial Content Section (2-Column Apple Bio Style) */}
      <section className="w-full py-14 md:py-20 px-6 md:px-10 bg-white flex justify-center">
        <div className="max-w-[1200px] w-full">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 text-[17px] md:text-[18px] text-[#1d1d1f]/80 leading-[1.75] font-normal">
            
            {/* Left Column */}
            <div className="space-y-8">
              <p>
                Dinesh V C is the Founder of DORT Asia, a technology and workforce solutions company focused on helping businesses access specialized technology talent and software solutions. He brings professional experience from the railway and enterprise technology sector, having worked at Alstom in Singapore as a Maximo and GSI Engineer specializing in asset maintenance, asset management, and change management.
              </p>

              <p>
                Before founding DORT Asia, Dinesh developed specialized experience working with enterprise asset-management and operational systems within Singapore's railway environment. His work at Alstom included exposure to IBM Maximo, GSI, railway asset maintenance, and operational processes, including work associated with the R151 Singapore project. This experience provided him with an understanding of how technology, engineering, maintenance, and operational requirements come together within large-scale infrastructure environments.
              </p>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <p>
                At DORT Asia, Dinesh is focused on building a technology organization that bridges business requirements with technology talent and software solutions. The company's direction encompasses IT manpower solutions, technology services, and software products designed to help businesses improve their operations through modern digital systems.
              </p>

              <p>
                His professional background combines engineering, enterprise technology, asset management, change management, and international experience in Singapore. As the Founder of DORT Asia, he brings this industry experience into an entrepreneurial environment, with a focus on developing technology solutions and building a business capable of serving organizations across Asia and international markets.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 3D Visiting Card Section */}
      <VisitingCard3D />

      <Footer />
    </main>
  );
}
