"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import QRCode from "react-qr-code";
import {
  User, Bell, Lock, Palette, Globe, CreditCard, Shield, ChevronRight, ChevronLeft,
  Plus, Minus, X, Camera, Moon, Sun, Monitor, Check, Search, MessageSquare, Briefcase, Users, Building, 
  Settings, Key, CalendarCheck, FileStack, Cloud, HardDrive, Database, RefreshCw, Server,
  Clock, Calendar, MapPin, Fingerprint, Zap, History, Eye, EyeOff, Download, Trash2,
  Megaphone, Share2, FileText, Mail, ShieldAlert, LogOut, Edit,
  HelpCircle, LifeBuoy, MessageSquareHeart, Star, Navigation2, Target, Landmark, Banknote
} from "lucide-react";
import { useAppStore } from "@/store";
import Cropper from "react-easy-crop";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import CompanyPayrollSettingsPage from "./payroll/company/page";
import AttendanceIntegrationPage from "./payroll/attendance/page";
import PayslipSettingsPage from "./payroll/payslip/page";
import ApprovalFlowSettingsPage from "./payroll/approval/page";

const sections = [
  { id: "profile",       label: "Edit Profile",    icon: User },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "security",      label: "Password and security", icon: Lock },
  { id: "appearance",   label: "Appearance",      icon: Palette },
  { id: "language",     label: "Language & Region", icon: Globe },
  { id: "billing",      label: "Subscriptions",   icon: CreditCard },
  { id: "messages",     label: "Messages",        icon: MessageSquare },
  { id: "privacy",      label: "Account privacy", icon: Shield },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? "bg-[#007AFF] dark:bg-white" : "bg-[#E5E5EA] dark:bg-[#3A3A3C]"}`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white dark:bg-black shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

// Reusable styling components for the new layout
const SectionLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-[14px] font-bold text-gray-900 dark:text-white mb-2 ml-1 ${className}`}>{children}</label>
);

const FieldContainer = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-[#F8F9FA] dark:bg-[#121217] rounded-[16px] px-5 py-4 border border-transparent hover:border-[#E5E7EB] dark:border-white/5 dark:hover:border-white/10 transition-colors ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </div>
);

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (croppedFile: File, croppedPreviewUrl: string) => void;
}

function ImageCropperModal({ isOpen, imageSrc, onClose, onConfirm }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 });
  const cropContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && cropContainerRef.current) {
      const el = cropContainerRef.current;
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setCropSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [isOpen, imageSrc]);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [isOpen, imageSrc]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        const base64Image = canvas.toDataURL("image/jpeg", 0.92);
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
            onConfirm(croppedFile, base64Image);
          }
        }, "image/jpeg", 0.92);
      }
    } catch (e) {
      console.error("Cropping error:", e);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1A1A1E] w-full max-w-[480px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Adjust Photo</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative w-full aspect-square bg-[#F8F9FA] dark:bg-[#121217]" ref={cropContainerRef}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            maxZoom={10}
            aspect={1}
            cropShape="round"
            cropSize={cropSize.width > 0 ? cropSize : undefined}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{
              containerStyle: { background: "transparent" },
              cropAreaStyle: { border: "2px solid #007AFF", boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.6)" }
            }}
          />
          <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-10">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.5, 10))}
              className="w-10 h-10 bg-white dark:bg-[#1A1A1E] shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
              className="w-10 h-10 bg-white dark:bg-[#1A1A1E] shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 bg-white dark:bg-[#1A1A1E] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-[15px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCropConfirm}
            className="px-8 py-2.5 bg-[#007AFF] text-white text-[15px] font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailUpdateAuthModal({
  isOpen,
  onClose,
  userId,
  currentEmail,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentEmail: string;
  onSuccess: (newEmail: string) => Promise<void>;
}) {
  const [step, setStep] = useState<"select" | "verify" | "new_email">("select");
  const [method, setMethod] = useState<"email" | "mobile" | null>(null);
  const [otp, setOtp] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waitingForMobile, setWaitingForMobile] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setMethod(null);
      setOtp("");
      setSentCode("");
      setNewEmail("");
      setError("");
      setLoading(false);
      setWaitingForMobile(false);
    }
  }, [isOpen]);

  // Listen for mobile app's verification response via Supabase Realtime
  useEffect(() => {
    if (step !== "verify" || method !== "mobile" || !userId) return;

    const supabase = createClient();
    const channel = supabase.channel(`otp_reply_${userId}`);

    channel.on('broadcast', { event: 'otp_verified' }, async (msg: any) => {
      console.log('[Web] Received otp_verified broadcast!', msg);
      // In supabase-js v2, the payload is inside msg.payload
      const mobileCode = msg?.payload?.code || msg?.code; 
      if (!mobileCode) {
        console.error('[Web] No code found in payload!', msg);
        return;
      }

      console.log('[Web] Mobile code received:', mobileCode);
      setWaitingForMobile(false);
      setLoading(true);
      try {
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, code: mobileCode }),
        });
        const data = await res.json();
        console.log('[Web] Verify response:', data);
        if (data.success) {
          setStep("new_email");
        } else {
          setError(data.error || "The code entered on the mobile app was incorrect. Please try again.");
          setWaitingForMobile(true);
        }
      } catch (err: any) {
        console.error('[Web] Verify fetch error:', err);
        setError(err.message || "Verification failed");
        setWaitingForMobile(true);
      } finally {
        setLoading(false);
      }
    });

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Web] Listening for otp_verified on otp_reply_' + userId);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [step, method, userId]);

  if (!isOpen) return null;

  const handleSendOtp = async (selectedMethod: "email" | "mobile") => {
    setLoading(true);
    setError("");
    setMethod(selectedMethod);
    try {
      const res = await fetch("/api/auth/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, method: selectedMethod, email: currentEmail }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send OTP");
      
      // Store the code so we can display it on the web for mobile method
      if (data.devCode) {
        setSentCode(data.devCode);
      }
      
      if (selectedMethod === "mobile") {
        setWaitingForMobile(true);
      }
      setStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Invalid OTP");
      setStep("new_email");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmail = async () => {
    if (!newEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSuccess(newEmail);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update email. Note: Test environment may block auth updates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A1A1E] w-full max-w-[420px] rounded-[24px] shadow-2xl p-6 flex flex-col relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6">
          {step === "select" ? "Verify Identity" : step === "verify" ? (method === "mobile" ? "Mobile Verification" : "Enter OTP") : "New Email Address"}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-[13px] font-medium border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        {step === "select" && (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
              For your security, please verify your identity before changing your email address.
            </p>
            <button
              onClick={() => handleSendOtp("email")}
              disabled={loading}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[#007AFF] dark:hover:border-[#007AFF] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white group-hover:text-[#007AFF] transition-colors">Verify by Email</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Send a code to {currentEmail || "your email"}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </button>
            <button
              onClick={() => handleSendOtp("mobile")}
              disabled={loading}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">Verify by Mobile App</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Send a code to Vertex App</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
            </button>
          </div>
        )}

        {step === "verify" && method === "mobile" && (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
              Open your <strong>Vertex Mobile App</strong> and enter the code shown below to verify your identity.
            </p>
            {/* Display code prominently — read-only, user reads this on web and types it on mobile */}
            <div className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-5 flex flex-col items-center gap-2 border border-purple-100 dark:border-purple-500/20">
              <span className="text-[10px] font-bold tracking-[3px] text-purple-500 uppercase">Verification Code</span>
              <span className="text-[42px] font-black text-purple-600 dark:text-purple-400 tracking-[0.4em] ml-[0.4em] leading-none">
                {sentCode || "----"}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Enter this code in your Vertex App</span>
            </div>
            {/* Waiting indicator */}
            {waitingForMobile && (
              <div className="flex items-center justify-center gap-3 py-3">
                <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-gray-500 dark:text-gray-400">Waiting for verification from your mobile app…</span>
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-3 py-3">
                <div className="h-5 w-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-gray-500 dark:text-gray-400">Verifying code…</span>
              </div>
            )}
          </div>
        )}

        {step === "verify" && method === "email" && (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
              Enter the 4-digit verification code sent to your email.
            </p>
            <input
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full text-center text-[32px] tracking-[0.5em] font-bold text-gray-900 dark:text-white bg-[#F8F9FA] dark:bg-[#121217] rounded-xl py-4 border border-transparent focus:border-[#007AFF] outline-none transition-colors"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 4 || loading}
              className="mt-2 w-full py-3 bg-[#007AFF] text-white text-[15px] font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        )}

        {step === "new_email" && (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
              Verification successful. Please enter your new email address.
            </p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="w-full text-[15px] text-gray-900 dark:text-white bg-[#F8F9FA] dark:bg-[#121217] rounded-xl px-4 py-3 border border-transparent focus:border-[#007AFF] outline-none transition-colors"
            />
            <button
              onClick={handleSubmitEmail}
              disabled={!newEmail || loading}
              className="mt-2 w-full py-3 bg-[#007AFF] text-white text-[15px] font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Email"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSection() {
  const router = useRouter();
  const supabase = createClient();
  
  // Zustant state for fallbacks
  const { cachedSidebar } = useAppStore();
  
  // Supabase-backed state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [userId, setUserId] = useState("");
  const [empId, setEmpId] = useState("");

  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminBio, setAdminBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const handleEmailUpdateSuccess = async (newEmail: string) => {
    // 1. Try to update via Supabase Auth (this might send a confirmation link, but we update our DB too)
    const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
    if (authError) {
      console.warn("Auth update user error (could be expected in test env):", authError);
    }

    // 2. Update employees table
    if (isEmployee && empId) {
      const { error } = await supabase.from("employees").update({ email: newEmail }).eq("id", empId);
      if (error) throw error;
    }
    
    // Update local state
    setAdminEmail(newEmail);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Try multiple methods to get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("🔍 Auth getUser - User:", user?.email, "Error:", userError);
      
      // If no user from getUser, try getSession
      let currentUser = user;
      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user;
        console.log("🔍 Auth getSession - User:", currentUser?.email);
      }

      if (!currentUser) { 
        console.log("❌ No user found - redirecting");
        setLoading(false); 
        return; 
      }
      
      setUserId(currentUser.id);
      setAdminEmail(currentUser.email || "");

      // First, try to find in employees table
      const { data: emp, error: empError } = await supabase
        .from("employees")
        .select("id, name, role, avatar_url, mobile, bio")
        .eq("email", currentUser.email)
        .maybeSingle();

      console.log("👤 Employee query result:", emp, "Error:", empError);

      if (emp) {
        console.log("✅ Found as employee");
        setIsEmployee(true);
        setEmpId(emp.id);
        const parts = (emp.name || "").trim().split(/\s+/);
        setAdminFirstName(parts[0] || "");
        setAdminLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
        setAdminRole(emp.role || "Employee");
        const rawMobile = emp.mobile || "";
        const cleanedMobile = rawMobile.replace(/^\+65\s*/, "").replace(/\D/g, "");
        setAdminPhone(cleanedMobile);
        setAdminBio(emp.bio || "");
        setAvatarUrl(emp.avatar_url || "");
        setAvatarPreview(emp.avatar_url || "");
      } else {
        // If not an employee, check if they're a Super Admin
        const { data: comp, error: compError } = await supabase
          .from("company_settings")
          .select("super_admin_name, super_admin_role, super_admin_avatar_url, super_admin_phone, super_admin_bio")
          .eq("company_id", currentUser.id)
          .maybeSingle();

        console.log("🏢 Company query result:", comp, "Error:", compError);

        if (comp && comp.super_admin_name) {
          console.log("✅ Found as super admin in company_settings");
          setIsSuperAdmin(true);
          let nameStr = comp.super_admin_name;
          
          const parts = (nameStr || "").trim().split(/\s+/);
          setAdminFirstName(parts[0] || "");
          setAdminLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
          setAdminRole(comp.super_admin_role || "Super Admin");
          const rawPhone = comp.super_admin_phone || "";
          const cleanedPhone = rawPhone.replace(/^\+65\s*/, "").replace(/\D/g, "");
          setAdminPhone(cleanedPhone);
          setAdminBio(comp.super_admin_bio || "");
          setAvatarUrl(comp.super_admin_avatar_url || "");
          setAvatarPreview(comp.super_admin_avatar_url || "");
        } else {
          // 3. Fallback: Use auth metadata
          console.log("⚠️ Using fallback auth metadata");
          setIsSuperAdmin(true);
          
          let nameStr = cachedSidebar?.userProfile?.name;
          if (!nameStr && currentUser.user_metadata?.full_name) nameStr = currentUser.user_metadata.full_name;
          if (!nameStr) {
             const fn = currentUser.user_metadata?.first_name || "";
             const ln = currentUser.user_metadata?.last_name || "";
             if (fn || ln) nameStr = `${fn} ${ln}`.trim();
             else nameStr = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
          }

          console.log("📝 Fallback name:", nameStr);
          const parts = (nameStr || "").trim().split(/\s+/);
          setAdminFirstName(parts[0] || "");
          setAdminLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
          setAdminRole("Super Admin");
          setAdminPhone("");
          setAdminBio("");
          setAvatarUrl(cachedSidebar?.userProfile?.avatarUrl || "");
          setAvatarPreview(cachedSidebar?.userProfile?.avatarUrl || "");
        }
      }
    } catch (error) {
      console.error("❌ Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, cachedSidebar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getInitialsFor = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropModalOpen(true);
  };

  const handleCropConfirm = (croppedFile: File, croppedPreviewUrl: string) => {
    setAvatarFile(croppedFile);
    setAvatarPreview(croppedPreviewUrl);
    setCropModalOpen(false);
    setCropImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!isSuperAdmin && !isEmployee) return;
    if (adminPhone) {
      const cleanPhone = adminPhone.replace(/\D/g, "");
      if (cleanPhone.length !== 8) {
        alert("Singapore phone number must be exactly 8 digits.");
        return;
      }
      if (!cleanPhone.startsWith("8") && !cleanPhone.startsWith("9")) {
        alert("Singapore mobile number must start with 8 or 9.");
        return;
      }
    }
    setSaving(true);
    setSaveStatus("idle");
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        // Fetch company name for folder slug
        let companyIdToUse = userId;
        if (isEmployee) {
          const { data: empData } = await supabase
            .from("employees")
            .select("company_id")
            .eq("email", adminEmail)
            .maybeSingle();
          if (empData?.company_id) {
            companyIdToUse = empData.company_id;
          }
        }

        const { data: csRow } = await supabase
          .from("company_settings")
          .select("company_name")
          .eq("company_id", companyIdToUse)
          .maybeSingle();
        const companySlug = (csRow?.company_name || companyIdToUse)
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          
        const path = `User_Avatar/${companySlug}/${userId}_profile.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("public_assets")
          .upload(path, avatarFile, { 
            contentType: "image/jpeg",
            upsert: true 
          });
          
        if (!uploadErr) {
          // Cleanup old avatar if it exists and has a different path
          if (avatarUrl && avatarUrl.includes("User_Avatar/")) {
            try {
              const urlObj = new URL(avatarUrl);
              const parts = urlObj.pathname.split("public_assets/");
              if (parts.length > 1) {
                const oldPath = parts[1];
                if (oldPath !== path) {
                  await supabase.storage.from("public_assets").remove([oldPath]);
                }
              }
            } catch (err) {
              console.error("Failed to delete old avatar", err);
            }
          }

          const { data: urlData } = supabase.storage.from("public_assets").getPublicUrl(path);
          finalAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }

      if (isSuperAdmin) {
        const { error } = await supabase
          .from("company_settings")
          .update({
            super_admin_name: `${adminFirstName.trim()} ${adminLastName.trim()}`,
            super_admin_role: adminRole.trim(),
            super_admin_avatar_url: finalAvatarUrl,
            super_admin_phone: adminPhone.trim() ? `+65 ${adminPhone.trim()}` : "",
            super_admin_bio: adminBio.trim(),
          })
          .eq("company_id", userId);

        if (error) throw error;
      } else if (isEmployee) {
        const { error } = await supabase
          .from("employees")
          .update({
            name: `${adminFirstName.trim()} ${adminLastName.trim()}`,
            avatar_url: finalAvatarUrl,
            mobile: adminPhone.trim() ? `+65 ${adminPhone.trim()}` : null,
          })
          .eq("id", empId);

        if (error) throw error;
      }
      setAvatarUrl(finalAvatarUrl);
      setAvatarPreview(finalAvatarUrl);
      setAvatarFile(null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };


  const initials = adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || "")).toUpperCase() : "??";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Edit Profile</h2>

      {/* Avatar + Name banner */}
      <div className="bg-[#D8EBFF] dark:bg-[#1a3a5c] rounded-[20px] p-5 flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (isSuperAdmin || isEmployee) && fileInputRef.current?.click()}
            title={(isSuperAdmin || isEmployee) ? "Change photo" : undefined}
            className={`h-[60px] w-[60px] rounded-[18px] bg-white text-[#5856D6] flex items-center justify-center font-bold text-[22px] relative overflow-hidden shadow-sm group ${(isSuperAdmin || isEmployee) ? "cursor-pointer" : "cursor-default"}`}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt={adminFirstName} className="w-full h-full object-cover" />
            ) : initials}
            {(isSuperAdmin || isEmployee) && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[18px]">
                <Camera className="h-5 w-5 text-white" />
              </div>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div>
            <p className="text-[16px] font-bold text-[#1C1C22] leading-tight">{adminFirstName} {adminLastName || "—"}</p>
            <p className="text-[13px] text-[#4A4A4A] font-medium mt-0.5">{adminRole || "—"}</p>
          </div>
        </div>
        {(isSuperAdmin || isEmployee) && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#007AFF] text-white text-[13px] font-semibold rounded-[10px] hover:bg-[#0062CC] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" />
            Change photo
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Name Sections */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <SectionLabel>First Name</SectionLabel>
            <FieldContainer>
              <input
                type="text"
                value={adminFirstName}
                onChange={e => setAdminFirstName(e.target.value)}
                disabled={!isSuperAdmin && !isEmployee}
                placeholder="First name"
                className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </FieldContainer>
          </div>
          {/* Second Name */}
          <div>
            <SectionLabel>Second Name</SectionLabel>
            <FieldContainer>
              <input
                type="text"
                value={adminLastName}
                onChange={e => setAdminLastName(e.target.value)}
                disabled={!isSuperAdmin && !isEmployee}
                placeholder="Second name"
                className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </FieldContainer>
          </div>
        </div>

        {/* App Role */}
        <div>
          <SectionLabel>App Role</SectionLabel>
          <FieldContainer className="flex items-center justify-between opacity-80 bg-gray-50 dark:bg-gray-800/40">
            <span className="text-[15px] text-gray-900 dark:text-white font-medium">Super Admin</span>
            <Lock className="h-4 w-4 text-gray-400" />
          </FieldContainer>
          <p className="text-[11px] text-gray-500 mt-2 px-1">
            Your system permission role is fixed and cannot be changed.
          </p>
        </div>

        {/* Designation */}
        <div>
          <SectionLabel>Designation</SectionLabel>
          {isSuperAdmin ? (
            <FieldContainer>
              <input
                type="text"
                value={adminRole}
                onChange={e => setAdminRole(e.target.value)}
                placeholder="Super Admin designation (e.g. CEO, Founder)"
                className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none"
              />
            </FieldContainer>
          ) : (
            <FieldContainer className="flex items-center justify-between opacity-80">
              <span className="text-[15px] text-gray-900 dark:text-white font-medium">{adminRole || "Super Admin"}</span>
              <Lock className="h-4 w-4 text-gray-400" />
            </FieldContainer>
          )}
          <p className="text-[11px] text-gray-500 mt-2 px-1">
            Configure your actual designation in the company.
          </p>
        </div>

        <div>
          <SectionLabel>Email Address</SectionLabel>
          <FieldContainer className="flex items-center justify-between opacity-80 group hover:opacity-100 transition-opacity">
            <span className="text-[15px] text-gray-900 dark:text-white font-medium">{adminEmail || "—"}</span>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-[13px] font-semibold text-[#007AFF] hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
          </FieldContainer>
          <p className="text-[11px] text-gray-500 mt-2 px-1">
            Your email is your secure login credential. Authentication is required to change it.
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <SectionLabel>Phone Number</SectionLabel>
          {isSuperAdmin ? (
            <FieldContainer className="flex items-center gap-2">
              <span className="text-[15px] text-gray-500 dark:text-gray-400 font-bold border-r border-gray-200 dark:border-gray-800 pr-2 select-none">
                +65
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={8}
                value={adminPhone}
                onChange={e => setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="8123 4567"
                className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none"
              />
            </FieldContainer>
          ) : (
            <FieldContainer className="flex items-center justify-between opacity-80">
              <span className="text-[15px] text-gray-900 dark:text-white font-medium">
                {adminPhone ? `+65 ${adminPhone}` : "—"}
              </span>
              <Lock className="h-4 w-4 text-gray-400" />
            </FieldContainer>
          )}
        </div>

        {/* Bio */}
        <div>
          <SectionLabel>Bio</SectionLabel>
          {isSuperAdmin ? (
            <FieldContainer>
              <textarea
                value={adminBio}
                onChange={e => setAdminBio(e.target.value.slice(0, 280))}
                placeholder="Tell your team a little about yourself…"
                rows={4}
                className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none resize-none leading-relaxed"
              />
              <p className="text-[11px] text-gray-400 text-right mt-1">{adminBio.length}/280</p>
            </FieldContainer>
          ) : (
            <FieldContainer className="flex items-start justify-between opacity-80">
              <span className="text-[15px] text-gray-900 dark:text-white font-medium leading-relaxed">{adminBio || "—"}</span>
              <Lock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0 ml-2" />
            </FieldContainer>
          )}
          {isSuperAdmin && (
            <p className="text-[11px] text-gray-500 mt-2 px-1 leading-relaxed">
              Visible to team members on your profile card.
            </p>
          )}
        </div>

        {/* Save */}
        <div className="pt-4 flex items-center justify-between">
          { (isSuperAdmin || isEmployee) ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-3 rounded-[12px] font-bold text-[14px] transition-colors flex items-center gap-2 disabled:opacity-70 ${
                saveStatus === "success"
                  ? "bg-[#34C759] text-white"
                  : saveStatus === "error"
                  ? "bg-[#FF3B30] text-white"
                  : "bg-[#007AFF] text-white hover:bg-[#0062CC]"
              }`}
            >
              {saving ? (
                <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
              ) : saveStatus === "success" ? (
                <><Check className="h-4 w-4" /> Saved!</>
              ) : saveStatus === "error" ? (
                "Error — try again"
              ) : (
                "Save Changes"
              )}
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      <ImageCropperModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onConfirm={handleCropConfirm}
      />

      <EmailUpdateAuthModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        userId={userId}
        currentEmail={adminEmail}
        onSuccess={handleEmailUpdateSuccess}
      />
    </div>
  );
}


function NotificationsSection() {
  const [states, setStates] = useState({
    pauseAll: false,
    clockIn: true,
    monthlyAttendance: true,
    monthlyClaims: true,
  });
  const toggle = (k: keyof typeof states) => setStates((s) => ({ ...s, [k]: !s[k] }));

  const sectionsList = [
    { title: "Push Notifications", desc: "Choose which alerts you want to receive on your devices.", items: [
      { key: "pauseAll", label: "Pause All", sub: "Temporarily pause all notifications" },
      { key: "clockIn", label: "Attendance Clock in", sub: "Get mobile alerts for check-ins and check-outs" },
    ]},
    { title: "Email Notifications", desc: "Manage the logs you receive related to your company activity.", items: [
      { key: "monthlyAttendance", label: "Monthly Attendance Logs", sub: "Summary of your total attendance for the month" },
      { key: "monthlyClaims", label: "Monthly Claim Logs", sub: "Detailed report of all processed expense claims" }
    ]}
  ];

  return (
    <div className="flex flex-col gap-10 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Notifications</h2>
      
      {sectionsList.map(section => (
        <div key={section.title} className="flex flex-col gap-3">
          <SectionLabel>{section.title}</SectionLabel>
          <div className="flex flex-col gap-2">
            {section.items.map(({ key, label, sub }) => (
              <FieldContainer key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">{label}</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">{sub}</p>
                </div>
                <Toggle on={states[key as keyof typeof states]} onChange={() => toggle(key as keyof typeof states)} />
              </FieldContainer>
            ))}
          </div>
          {section.desc && <p className="text-[11px] text-gray-500 mt-1 px-1">{section.desc}</p>}
        </div>
      ))}
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Password and security</h2>
      
      <div className="flex flex-col gap-6">
        <div>
          <SectionLabel>Login & recovery</SectionLabel>
          <div className="flex flex-col gap-2">
            {[
              { label: "Change password", sub: "Last updated 3 months ago" },
              { label: "Two-factor authentication", sub: "On · Authenticator app" },
              { label: "Saved login", sub: "Save your login info on this device" }
            ].map(item => (
              <FieldContainer key={item.label} className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">{item.label}</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">{item.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
              </FieldContainer>
            ))}
          </div>
        </div>

        <div>
           <SectionLabel>Security checks</SectionLabel>
           <div className="flex flex-col gap-2">
              <FieldContainer className="flex items-center justify-between cursor-pointer group">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Where you're logged in</p>
                <div className="flex items-center gap-2">
                   <span className="text-[12px] text-gray-500 font-medium">2 devices</span>
                   <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                </div>
              </FieldContainer>
              <FieldContainer className="flex items-center justify-between cursor-pointer group">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Login alerts</p>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
              </FieldContainer>
              <FieldContainer className="flex items-center justify-between cursor-pointer group">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Recent emails</p>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
              </FieldContainer>
           </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const theme = useAppStore((s: any) => s.theme);
  const setTheme = useAppStore((s: any) => s.setTheme);
  const accentColor = useAppStore((s: any) => s.accentColor);
  const setAccentColor = useAppStore((s: any) => s.setAccentColor);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
      
      <div className="flex flex-col gap-6">
        <div>
          <SectionLabel>Mode</SectionLabel>
          <div className="flex flex-col gap-2">
             {[
               { id: "light", label: "Light mode", sub: "A bright and clean interface" },
               { id: "dark", label: "Dark mode", sub: "Easier on your eyes in low light" },
               { id: "system", label: "System settings", sub: "Match your device's active theme" },
               { id: "shift", label: "Shift Based", sub: "Automatically adapt based on employee working hours" }
             ].map(item => (
                <FieldContainer key={item.id} className="flex items-center justify-between cursor-pointer group" >
                  <div className="flex-1" onClick={() => setTheme(item.id as any)}>
                    <p className={`text-[15px] font-semibold leading-tight transition-colors ${theme === item.id ? "text-[#007AFF] dark:text-white" : "text-gray-900 dark:text-gray-300"}`}>{item.label}</p>
                    <p className="text-[12px] text-gray-500 font-medium mt-0.5">{item.sub}</p>
                  </div>
                  <div className="shrink-0 flex items-center justify-center p-2" onClick={() => setTheme(item.id as any)}>
                     <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${theme === item.id ? "border-[#007AFF] bg-[#007AFF]" : "border-gray-300 dark:border-gray-600"}`}>
                        {theme === item.id && <div className="h-2 w-2 bg-white rounded-full"/>}
                     </div>
                  </div>
                </FieldContainer>
             ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-2 px-1">
             Adjust the display mode to make the app more comfortable to look at.
          </p>
        </div>
      </div>
    </div>
  );
}

function LanguageSection() {
  const langs = ["English (US)", "Tamil", "Hindi", "Bahasa Melayu", "中文 (简体)", "日本語"];
  const [selected, setSelected] = useState("English (US)");
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Language & Region</h2>
      
      <div>
         <SectionLabel>Display Language</SectionLabel>
         <div className="flex flex-col gap-2">
            {langs.map((l) => (
              <FieldContainer key={l} className="flex items-center justify-between cursor-pointer" >
                 <div className="flex-1" onClick={() => setSelected(l)}>
                   <p className={`text-[15px] font-semibold ${selected === l ? "text-[#007AFF] dark:text-white" : "text-gray-900 dark:text-gray-300"}`}>{l}</p>
                 </div>
                 <div className="shrink-0 flex items-center justify-center p-2" onClick={() => setSelected(l)}>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected === l ? "border-[#007AFF] bg-[#007AFF]" : "border-gray-300 dark:border-gray-600"}`}>
                       {selected === l && <div className="h-2 w-2 bg-white rounded-full"/>}
                    </div>
                 </div>
              </FieldContainer>
            ))}
         </div>
      </div>
      <div>
         <SectionLabel>Region</SectionLabel>
         <FieldContainer className="flex items-center justify-between cursor-not-allowed opacity-80">
           <span className="text-[15px] text-gray-900 dark:text-white font-medium">India</span>
           <Lock className="h-4 w-4 text-gray-400" />
         </FieldContainer>
         <p className="text-[11px] text-gray-500 mt-2 px-1">
           Your region is automatically determined based on your organization's primary headquarters and cannot be changed manually.
         </p>
      </div>
    </div>
  );
}

function BillingSection() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Subscriptions</h2>
      
      <div className="flex flex-col gap-6">
         <div>
            <SectionLabel>Plan Overview</SectionLabel>
            <div className="bg-gradient-to-br from-[#007AFF] to-[#0055CC] rounded-[20px] p-6 text-white mb-2">
              <p className="text-[13px] font-bold opacity-80 tracking-wide uppercase mb-1">Enterprise Pro</p>
              <p className="text-[32px] font-extrabold leading-tight">49 <span className="text-[16px] font-medium opacity-80">/ 50 seats</span></p>
              <div className="w-full h-1.5 bg-black/20 rounded-full mt-4 overflow-hidden">
                 <div className="h-full bg-white rounded-full" style={{ width: '98%' }} />
              </div>
              <p className="text-[12px] opacity-80 mt-3">Active · Renews annually on Mar 13, 2027</p>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 px-1">
               Almost at your seat limit. Contact our sales team to arrange for bulk expansion.
            </p>
         </div>

         <div>
           <SectionLabel>Billing tools</SectionLabel>
           <div className="flex flex-col gap-2">
              {[
                { label: "Payment methods", sub: "Manage recurring payment profiles" },
                { label: "Billing history", sub: "View and download past invoices" },
                { label: "Storage usage", sub: "View data lake configuration" },
              ].map(item => (
                <FieldContainer key={item.label} className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">{item.label}</p>
                    <p className="text-[12px] text-gray-500 font-medium mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                </FieldContainer>
              ))}
           </div>
         </div>
      </div>
    </div>
  );
}

function PrivacySection() {
  const [states, setStates] = useState({ analytics: true, crashReports: false, profile: true });
  const toggle = (k: keyof typeof states) => setStates((s) => ({ ...s, [k]: !s[k] }));
  
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Privacy & Data</h2>
      
      <div className="flex flex-col gap-6">
         <div>
           <SectionLabel>Data sharing</SectionLabel>
           <div className="flex flex-col gap-2">
             <FieldContainer className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Usage analytics</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Help improve the product by sharing usage</p>
                </div>
                <Toggle on={states.analytics} onChange={() => toggle('analytics')} />
             </FieldContainer>
             <FieldContainer className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Crash reports</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Automatically send error logs when apps crash</p>
                </div>
                <Toggle on={states.crashReports} onChange={() => toggle('crashReports')} />
             </FieldContainer>
           </div>
           <p className="text-[11px] text-gray-500 mt-2 px-1">
             Your data is anonymized before being transmitted.
           </p>
         </div>

         <div>
           <SectionLabel>Visibility</SectionLabel>
           <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Public profile</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow other teams to see your workspace profile</p>
              </div>
              <Toggle on={states.profile} onChange={() => toggle('profile')} />
           </FieldContainer>
         </div>
         
         <div className="pt-4">
            <button className="text-[#FF3B30] font-bold text-[14px] hover:underline transition-colors px-1">
              Delete workspace account
            </button>
         </div>
      </div>
    </div>
  );
}

function MessagesSettingsSection() {
  const [states, setStates] = useState({
    readReceipts: true,
    blockUnknown: true,
    disableLinkPreviews: false,
    spellCheck: true,
    replaceEmoji: true,
    enterIsSend: true,
    notifMessages: false,
    notifGroups: false,
    notifStatus: false,
    showPreviews: true,
    playSound: false,
    backgroundSync: false,
  });
  const toggle = (k: keyof typeof states) => setStates((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="flex flex-col gap-10 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Messages</h2>
      
      {/* Privacy Section */}
      <div className="flex flex-col gap-6">
        <div>
          <SectionLabel>Who can see my personal info</SectionLabel>
          <div className="flex flex-col gap-2">
            {[
              { label: "Last seen and online", right: "Nobody" },
              { label: "Profile picture", right: "Everyone" },
              { label: "About", right: "Everyone" },
              { label: "Status", right: "0 contacts included" },
            ].map(item => (
              <FieldContainer key={item.label} className="flex items-center justify-between cursor-pointer group">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">{item.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-500 font-medium">{item.right}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                </div>
              </FieldContainer>
            ))}
            <FieldContainer className="flex items-center justify-between mt-2">
              <div className="pr-4">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Read receipts</p>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">
                  If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
                </p>
              </div>
              <Toggle on={states.readReceipts} onChange={() => toggle('readReceipts')} />
            </FieldContainer>
          </div>
        </div>

        <div>
          <SectionLabel>Disappearing messages</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-col">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Default message timer</p>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">Off</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>
            
            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-col">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Groups</p>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">1 contact excluded</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>

            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-col">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Blocked contacts</p>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">32</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>

            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-col">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">App lock</p>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">Require password to unlock WhatsApp</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>
          </div>
        </div>

        <div>
          <SectionLabel>Advanced</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Block unknown account messages</p>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">
                  To protect your account and improve device performance, WhatsApp will block messages from unknown accounts if they exceed a certain volume. <span className="text-[#32D74B] cursor-pointer hover:underline">Learn more</span>
                </p>
              </div>
              <Toggle on={states.blockUnknown} onChange={() => toggle('blockUnknown')} />
            </FieldContainer>
            
            <FieldContainer className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Disable link previews</p>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">
                  To help protect your IP address from being inferred by third-party websites, previews for the links you share in chats will no longer be generated. <span className="text-[#32D74B] cursor-pointer hover:underline">Learn more</span>
                </p>
              </div>
              <Toggle on={states.disableLinkPreviews} onChange={() => toggle('disableLinkPreviews')} />
            </FieldContainer>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gray-200 dark:bg-white/10 my-2"></div>

      {/* Chats Section */}
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white -mb-2">Chats</h2>
      <div className="flex flex-col gap-6">
        <div>
          <SectionLabel>Display</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-col">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Theme</p>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">System default</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Wallpaper</p>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>
          </div>
        </div>

        <div>
          <SectionLabel>Chat settings</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Media upload quality</p>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between cursor-pointer group">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Media auto-download</p>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
            </FieldContainer>
            
            <FieldContainer className="flex items-center justify-between mt-2">
              <div className="pr-4">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Spell check</p>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">Check spelling while typing</p>
              </div>
              <Toggle on={states.spellCheck} onChange={() => toggle('spellCheck')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Replace text with emoji</p>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">Emoji will replace specific text as you type</p>
              </div>
              <Toggle on={states.replaceEmoji} onChange={() => toggle('replaceEmoji')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Enter is send</p>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">Enter key will send your message</p>
              </div>
              <Toggle on={states.enterIsSend} onChange={() => toggle('enterIsSend')} />
            </FieldContainer>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gray-200 dark:bg-white/10 my-2"></div>

      {/* Notifications Section */}
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white -mb-2">Notifications</h2>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <FieldContainer className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Messages</p>
              <p className="text-[13px] text-gray-500 font-medium mt-0.5">Off</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
          </FieldContainer>
          <FieldContainer className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Groups</p>
              <p className="text-[13px] text-gray-500 font-medium mt-0.5">Off</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
          </FieldContainer>
          <FieldContainer className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Status</p>
              <p className="text-[13px] text-gray-500 font-medium mt-0.5">Off</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
          </FieldContainer>
        </div>

        <div className="flex flex-col gap-2">
          <FieldContainer className="flex items-center justify-between">
            <div className="pr-4">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Show previews</p>
              <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">Preview message text inside message notifications.</p>
            </div>
            <Toggle on={states.showPreviews} onChange={() => toggle('showPreviews')} />
          </FieldContainer>
          <FieldContainer className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Play sound for outgoing messages</p>
            <Toggle on={states.playSound} onChange={() => toggle('playSound')} />
          </FieldContainer>
          <FieldContainer className="flex items-center justify-between">
            <div className="pr-4">
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Background sync</p>
              <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">Get faster performance by syncing messages in the background.</p>
            </div>
            <Toggle on={states.backgroundSync} onChange={() => toggle('backgroundSync')} />
          </FieldContainer>
        </div>
        
        <p className="text-[13px] text-gray-500 px-2 mt-4">
          To get notifications, make sure they're turned on in your browser and device settings.
        </p>
      </div>

    </div>
  );
}

function AdminEmployeesSection({ setActive }: any) {
  const [states, setStates] = useState({
    autoWelcome: true,
    requireApproval: true,
    publicDirectory: true,
    managerVisibility: true,
    allowExport: false,
    orgChart: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('company_settings').select('require_approval_new_hire').eq('company_id', user.id).maybeSingle();
      if (data) {
        setStates(s => ({ ...s, requireApproval: data.require_approval_new_hire ?? true }));
      }
    }
    load();
  }, []);

  const toggle = async (k: keyof typeof states) => {
    const newVal = !states[k];
    setStates((s) => ({ ...s, [k]: newVal }));
    
    if (k === 'requireApproval') {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('company_settings').update({ require_approval_new_hire: newVal }).eq('company_id', user.id);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Employees Settings</h2>
      
      <div className="flex flex-col gap-6">
        <div onClick={() => setActive?.('admin_custom_fields')} className="relative overflow-hidden bg-gradient-to-r from-[#007AFF]/10 to-[#00CCFF]/10 dark:from-[#007AFF]/20 dark:to-[#00CCFF]/20 p-5 rounded-[16px] border border-[#007AFF]/30 group cursor-pointer hover:shadow-md transition-all">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#007AFF]">Customize Data</span>
              </div>
              <p className="text-[17px] font-bold text-gray-900 dark:text-white leading-tight group-hover:text-[#007AFF] transition-colors">Manage Custom Profile & Form Fields</p>
              <p className="text-[13px] text-gray-600 dark:text-gray-300 font-medium mt-1">Enhance employee profiles by mapping unique data-points specific to your company needs (e.g. T-Shirt Size, Dietary Preferences).</p>
            </div>
            <div className="h-10 w-10 shrink-0 bg-white dark:bg-black/30 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-[#007AFF] group-hover:text-white transition-all shadow-sm">
              <ChevronRight className="h-5 w-5 ml-0.5" />
            </div>
          </div>
        </div>



        <div>
          <SectionLabel>Onboarding & Offboarding</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Require approval for new hires</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Super admin must approve before account creation</p>
              </div>
              <Toggle on={states.requireApproval} onChange={() => toggle('requireApproval')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Automated welcome emails</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Send onboarding instructions automatically</p>
              </div>
              <Toggle on={states.autoWelcome} onChange={() => toggle('autoWelcome')} />
            </FieldContainer>
          </div>
        </div>

        <div>
          <SectionLabel>Directory & Visibility</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Public Directory</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow employees to see each other's contact info</p>
              </div>
              <Toggle on={states.publicDirectory} onChange={() => toggle('publicDirectory')} />
            </FieldContainer>
          </div>
        </div>

        <div>
          <SectionLabel>Data Export & Reports</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Allow employees to export directory</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Employees can download employee lists as CSV</p>
              </div>
              <Toggle on={states.allowExport} onChange={() => toggle('allowExport')} />
            </FieldContainer>
          </div>
        </div>

      </div>


    </div>
  );
}

function AdminCompanySection() {
  const [states, setStates] = useState({
    sessionTimeout: true,
    require2FA: true,
    passwordComplexity: true,
    ipWhitelisting: false,
  });
  const toggle = (k: keyof typeof states) => setStates((s) => ({ ...s, [k]: !s[k] }));

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [userId, setUserId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // New fields states
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [website, setWebsite] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [branchLocation, setBranchLocation] = useState("");

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const normalizeTime = (t: string) => {
    if (!t) return "";
    return t.replace(/\s+/g, "");
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: comp } = await supabase
        .from("company_settings")
        .select("company_name, logo_url, start_time, end_time, website, company_type, branch_location")
        .eq("company_id", user.id)
        .maybeSingle();

      if (comp) {
        setCompanyName(comp.company_name || "");
        setCompanyLogoUrl(comp.logo_url || "");
        setLogoPreview(comp.logo_url || "");
        setStartTime(normalizeTime(comp.start_time || "09:00"));
        setEndTime(normalizeTime(comp.end_time || "18:00"));
        setWebsite(comp.website || "");
        setCompanyType(comp.company_type || "");
        setBranchLocation(comp.branch_location || "");
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropModalOpen(true);
  };

  const handleCropConfirm = (croppedFile: File, croppedPreviewUrl: string) => {
    setLogoFile(croppedFile);
    setLogoPreview(croppedPreviewUrl);
    setCropModalOpen(false);
    setCropImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      alert("Company name is required");
      return;
    }
    
    setSaving(true);
    setSaveStatus("idle");
    try {
      let finalLogoUrl = companyLogoUrl;

      if (logoFile) {
        const { data: csRow2 } = await supabase
          .from("company_settings")
          .select("company_name")
          .eq("company_id", userId)
          .maybeSingle();
        const companySlug2 = (csRow2?.company_name || companyName || userId)
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        // Streamlined path: Company_Logo/{company_slug}/{company_id}.png
        const path = `Company_Logo/${companySlug2}/${userId}.png`;
        const { error: uploadErr } = await supabase.storage
          .from("public_assets")
          .upload(path, logoFile, { 
            contentType: "image/png",
            upsert: true 
          });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("public_assets").getPublicUrl(path);
          finalLogoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }

      const { error } = await supabase
        .from("company_settings")
        .update({
          company_name: companyName.trim(),
          logo_url: finalLogoUrl,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          website: website.trim(),
          company_type: companyType.trim(),
          branch_location: branchLocation.trim()
        })
        .eq("company_id", userId);

      if (error) throw error;
      setCompanyLogoUrl(finalLogoUrl);
      setLogoPreview(finalLogoUrl);
      setLogoFile(null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Company Profile</h2>
      
      <div className="flex flex-col gap-8">
        {/* Workspace Identity */}
        <div>
          <SectionLabel>Workspace Identity</SectionLabel>
          <div className="bg-[#D8EBFF] dark:bg-[#1a3a5c] rounded-[20px] p-5 flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Change logo"
                className="h-[60px] w-[60px] rounded-full bg-white text-[#5856D6] flex items-center justify-center font-bold text-[22px] relative overflow-hidden shadow-sm group cursor-pointer"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt={companyName} className="w-full h-full object-cover" />
                ) : (
                  companyName ? getInitials(companyName) : <Building className="h-7 w-7 text-[#007AFF]" />
                )}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div>
                <p className="text-[16px] font-bold text-[#1C1C22] dark:text-white leading-tight">{companyName || "—"}</p>
                <p className="text-[13px] text-[#4A4A4A] dark:text-gray-300 font-medium mt-0.5">Workspace ID: DA-{userId ? userId.substring(0,5).toUpperCase() : "99012"}-IN</p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#007AFF] text-white text-[13px] font-semibold rounded-[10px] hover:bg-[#0062CC] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              Change logo
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <SectionLabel>Company Name</SectionLabel>
              <FieldContainer>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                  className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none font-medium"
                />
              </FieldContainer>
            </div>
            <div>
              <SectionLabel>Workspace Domain</SectionLabel>
              <FieldContainer className="flex items-center gap-2 opacity-80 cursor-not-allowed">
                <span className="text-gray-400 font-medium text-[15px]">https://</span>
                <input 
                  type="text" 
                  disabled
                  value={`${companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '') : "workspace"}.hrms.io`} 
                  className="flex-1 bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none font-medium cursor-not-allowed"
                />
                <Lock className="h-4 w-4 text-gray-400" />
              </FieldContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <SectionLabel>Website</SectionLabel>
                <FieldContainer>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none font-medium"
                  />
                </FieldContainer>
              </div>
              <div>
                <SectionLabel>Company Type</SectionLabel>
                <FieldContainer>
                  <input
                    type="text"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    placeholder="e.g. Technology, Retail, Finance"
                    className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none font-medium"
                  />
                </FieldContainer>
              </div>
            </div>
            <div>
              <SectionLabel>Company Location</SectionLabel>
              <FieldContainer>
                <input
                  type="text"
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value)}
                  placeholder="e.g. Singapore, Chennai, New York"
                  className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none font-medium"
                />
              </FieldContainer>
            </div>
          </div>
        </div>

        {/* Global Configuration */}
        <div>
          <SectionLabel>Global Configuration</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Organization Default Timezone</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Used for log timestamps and attendance</p>
              </div>
              <div className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all">
                <span className="text-[13px] font-bold text-gray-900 dark:text-white">(GMT+05:30) Kolkata</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF]" />
              </div>
            </FieldContainer>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <SectionLabel>Business Hours (Start Time)</SectionLabel>
                <FieldContainer className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none font-medium"
                  />
                </FieldContainer>
              </div>
              <div>
                <SectionLabel>Business Hours (End Time)</SectionLabel>
                <FieldContainer className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white focus:outline-none font-medium"
                  />
                </FieldContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Security */}
        <div>
          <SectionLabel>Workspace Security</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Enforce Two-Factor Authentication</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Require all employees to setup 2FA</p>
              </div>
              <Toggle on={states.require2FA} onChange={() => toggle('require2FA')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Session Timeout</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Automatically log out inactive sessions</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500">24 Hours</span>
                <Toggle on={states.sessionTimeout} onChange={() => toggle('sessionTimeout')} />
              </div>
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">IP Whitelisting</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Restrict access to specific IP ranges</p>
              </div>
              <Toggle on={states.ipWhitelisting} onChange={() => toggle('ipWhitelisting')} />
            </FieldContainer>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3.5 rounded-[14px] font-bold text-[15px] transition-colors flex items-center gap-2 disabled:opacity-70 ${
              saveStatus === "success"
                ? "bg-[#34C759] text-white"
                : saveStatus === "error"
                ? "bg-[#FF3B30] text-white"
                : "bg-[#007AFF] text-white hover:bg-[#0062CC]"
            }`}
          >
            {saving ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : saveStatus === "success" ? (
              <><Check className="h-4 w-4" /> Saved!</>
            ) : saveStatus === "error" ? (
              "Error — try again"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      <ImageCropperModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

function AdminDeptsSection() {
  const [states, setStates] = useState({
    publicDashboards: true,
    deptHolidays: false,
    resourceSharing: true,
    crossDeptCollab: false,
  });
  const toggle = (k: keyof typeof states) => setStates((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Department Settings</h2>
      
      <div className="flex flex-col gap-8">
        {/* Department Visibility */}
        <div>
          <SectionLabel>Department Visibility</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Public Team Dashboards</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow other departments to view team performance</p>
              </div>
              <Toggle on={states.publicDashboards} onChange={() => toggle('publicDashboards')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Cross-Department Collaboration</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Show other department Globaly</p>
              </div>
              <Toggle on={states.crossDeptCollab} onChange={() => toggle('crossDeptCollab')} />
            </FieldContainer>
          </div>
        </div>

        {/* Resource Access */}
        <div>
          <SectionLabel>Resource Access</SectionLabel>
          <div className="flex flex-col gap-2">

            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Centralized Resource Library</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Enable shared document folder for all departments</p>
              </div>
              <Toggle on={states.resourceSharing} onChange={() => toggle('resourceSharing')} />
            </FieldContainer>
          </div>
        </div>

        {/* Standardized Workflows */}
        <div>
          <SectionLabel>Standardized Workflows</SectionLabel>
          <div className="flex flex-col gap-2">

            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Department-Specific Holidays</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow teams to define regional or team-specific breaks</p>
              </div>
              <Toggle on={states.deptHolidays} onChange={() => toggle('deptHolidays')} />
            </FieldContainer>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminRolesSection() {
  const [loading, setLoading] = useState(true);
  const [appRoles, setAppRoles] = useState([
    { id: "app_super_admin", label: "Super Admin", desc: "Full system access, including security, billing, and system configurations.", users: 0 },
    { id: "app_admin", label: "Admin", desc: "Can manage app settings, users, and global configurations.", users: 0 },
    { id: "app_sub_admin", label: "Sub Admin", desc: "Limited administrative access to specific modules.", users: 0 },
    { id: "app_user", label: "Employee", desc: "Standard app access with personal dashboard capabilities.", users: 0 },
  ]);

  useEffect(() => {
    async function loadRoles() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: employees } = await supabase
        .from("employees")
        .select("role")
        .eq("company_id", user.id);

      const counts: Record<string, number> = {};
      employees?.forEach((e: any) => {
        const r = e.role || "Employee";
        counts[r] = (counts[r] || 0) + 1;
      });

      // Update app roles counts
      setAppRoles(prev => prev.map(r => ({ ...r, users: counts[r.label] || 0 })));
      setLoading(false);
    }
    loadRoles();
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl relative">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Roles and Access</h2>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* App Roles */}
          <div>
            <SectionLabel>App Roles</SectionLabel>
            <div className="flex flex-col gap-3">
              {appRoles.map((role) => (
                <FieldContainer key={role.id} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-gray-900 dark:text-white group-hover:text-[#007AFF] transition-colors">{role.label}</p>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-[11px] font-bold text-gray-500 rounded-md whitespace-nowrap">{role.users} Users</span>
                    </div>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">{role.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors shrink-0" />
                </FieldContainer>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-3 px-1 leading-relaxed">
               App roles are core system permissions that govern what parts of the application a user can access.
            </p>
          </div>

          {/* System Management */}
          <div>
            <SectionLabel>System Security</SectionLabel>
            <div className="flex flex-col gap-2">
              <FieldContainer className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#FF3B30] transition-colors">Emergency System Lock</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Immediately disable all non-admin access</p>
                </div>
                <Shield className="h-4 w-4 text-gray-400 group-hover:text-[#FF3B30] transition-colors" />
              </FieldContainer>
            </div>
          </div>
          
          <div className="pt-2">
            <button className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminApprovalsSection() {
  const [states, setStates] = useState({
    multiLevel: true,
    leaveRequests: true,
    expenseRequests: true,
    overtimeRequests: false,
    autoApproveLowRisk: true,
    autoApprovals: true,
    escalateOverdue: true,
  });
  const toggle = (k: keyof typeof states) => setStates((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Approvals & Request</h2>
      
      <div className="flex flex-col gap-8">
        {/* Workflow Configuration */}
        <div>
          <SectionLabel>Workflow Configuration</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Multi-Level Approval Chain</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Require both Manager and Admin approval for requests</p>
              </div>
              <Toggle on={states.multiLevel} onChange={() => toggle('multiLevel')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Auto-Approve Low-Risk Requests</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Automatically approve 1-day leave or small expenses</p>
              </div>
              <Toggle on={states.autoApproveLowRisk} onChange={() => toggle('autoApproveLowRisk')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Automated Leave Approvals</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Auto-approve requests within HR guidelines</p>
              </div>
              <Toggle on={states.autoApprovals} onChange={() => toggle('autoApprovals')} />
            </FieldContainer>
          </div>
        </div>

        {/* Request Types */}
        <div>
          <SectionLabel>Enabled Request Types</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldContainer className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-gray-900 dark:text-white">Leave & Time Off</span>
              <Toggle on={states.leaveRequests} onChange={() => toggle('leaveRequests')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-gray-900 dark:text-white">Expense Claims</span>
              <Toggle on={states.expenseRequests} onChange={() => toggle('expenseRequests')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-gray-900 dark:text-white">Overtime Requests</span>
              <Toggle on={states.overtimeRequests} onChange={() => toggle('overtimeRequests')} />
            </FieldContainer>
          </div>
        </div>

        {/* SLA & Escalations */}
        <div>
          <SectionLabel>SLA & Escalations</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Escalate Overdue Requests</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Notify Admins if a request isn't acted upon within 48h</p>
              </div>
              <Toggle on={states.escalateOverdue} onChange={() => toggle('escalateOverdue')} />
            </FieldContainer>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminCloudSection() {
  const [states, setStates] = useState({
    autoBackup: true,
    gDriveEnabled: false,
    oneDriveEnabled: false,
    personalCloud: false,
  });
  
  const [retention, setRetention] = useState("365");
  const [backupFreq, setBackupFreq] = useState("Daily");
  const [backupTime, setBackupTime] = useState("03:00");

  const toggle = (k: keyof typeof states) => setStates((s) => ({ ...s, [k]: !s[k] }));

  const customers = [
    { id: 1, name: "Engineering Team", usage: "45GB", limit: "50GB" },
    { id: 2, name: "Marketing Dept", usage: "12GB", limit: "20GB" },
    { id: 3, name: "HR & Finance", usage: "8GB", limit: "15GB" },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Cloud Settings</h2>
      
      <div className="flex flex-col gap-8">
        {/* Employee Storage Customization */}
        <div>
          <SectionLabel>Employee Storage Limits</SectionLabel>
          <div className="flex flex-col gap-3">
            {customers.map((cust) => (
              <FieldContainer key={cust.id} className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white">{cust.name}</p>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 rounded-md">
                      {cust.usage} / {cust.limit}
                    </span>
                  </div>
                  <div className="w-48 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-[#007AFF] rounded-full" 
                      style={{ width: `${(parseFloat(cust.usage)/parseFloat(cust.limit)) * 100}%` }} 
                    />
                  </div>
                </div>
                <button className="text-[13px] font-bold text-[#007AFF] hover:underline transition-colors focus:outline-none">
                  Customize
                </button>
              </FieldContainer>
            ))}
          </div>
        </div>

        {/* Back up Configuration */}
        <div>
          <SectionLabel>Back up Settings</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Back up Execution</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Automated snapshots for system data</p>
                </div>
              </div>
              <Toggle on={states.autoBackup} onChange={() => toggle('autoBackup')} />
            </FieldContainer>

            {states.autoBackup && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 transition-all">
                <FieldContainer className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Frequency</span>
                  </div>
                  <select 
                    value={backupFreq}
                    onChange={(e) => setBackupFreq(e.target.value)}
                    className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 text-right outline-none cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </FieldContainer>
                <FieldContainer className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Execution Time</span>
                  </div>
                  <input 
                    type="time"
                    value={backupTime}
                    onChange={(e) => setBackupTime(e.target.value)}
                    className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 text-right outline-none cursor-pointer p-0"
                    style={{ colorScheme: 'dark' }}
                  />
                </FieldContainer>
              </div>
            )}
          </div>
        </div>

        {/* Infrastructure Integrations */}
        <div>
          <SectionLabel>Custom Cloud Providers</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldContainer className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/Google_Drive_icon_(2020).svg" alt="Google Drive" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">Google Drive</p>
                  <Toggle on={states.gDriveEnabled} onChange={() => toggle('gDriveEnabled')} />
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Connect G-Suite storage</p>
              </div>
            </FieldContainer>
            <FieldContainer className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-[#0078D4]/5 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/Microsoft_OneDrive_Icon_(2025_-_present).svg" alt="OneDrive" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">OneDrive</p>
                  <Toggle on={states.oneDriveEnabled} onChange={() => toggle('oneDriveEnabled')} />
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Integrate Microsoft 365</p>
              </div>
            </FieldContainer>
          </div>
        </div>

        {/* Individual Storage Setting */}
        <div>
          <SectionLabel>Individual Storage</SectionLabel>
          <FieldContainer className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-[#007AFF]" />
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Make People use their own Cloud Drive</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Let employees connect personal storage for their work files</p>
              </div>
            </div>
            <Toggle on={states.personalCloud} onChange={() => toggle('personalCloud')} />
          </FieldContainer>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Google Maps Geofence Radius Picker ──────────────────────────────────────
declare global {
  interface Window {
    google: any;
    initGoogleMapsForHRMS: () => void;
  }
}

function GeoRadiusPicker({
  radius,
  onRadiusChange,
  onCenterChange,
  onAddressChange,
}: {
  radius: number;
  onRadiusChange: (r: number) => void;
  onCenterChange?: (c: { lat: number; lng: number }) => void;
  onAddressChange?: (a: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [center, setCenter] = useState({ lat: 13.0827, lng: 80.2707 }); // Chennai default
  const [address, setAddress] = useState("Chennai, Tamil Nadu, India");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const gm = window.google.maps;

    const map = new gm.Map(mapRef.current, {
      center,
      zoom: 15,
      mapTypeId: "roadmap",
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e8fd" }] },
      ],
    });

    mapInstanceRef.current = map;

    // Marker
    const marker = new gm.Marker({
      position: center,
      map,
      draggable: true,
      icon: {
        path: gm.SymbolPath.CIRCLE,
        fillColor: "#007AFF",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 10,
      },
      title: "Office Location",
    });
    markerRef.current = marker;

    // Circle
    const circle = new gm.Circle({
      map,
      center,
      radius,
      fillColor: "#007AFF",
      fillOpacity: 0.15,
      strokeColor: "#007AFF",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      editable: false,
    });
    circleRef.current = circle;

    // Drag events
    marker.addListener("dragend", (e: any) => {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      circle.setCenter(newPos);
      setCenter(newPos);
      onCenterChange?.(newPos);

      // Reverse geocode
      const geocoder = new gm.Geocoder();
      geocoder.geocode({ location: newPos }, (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          setAddress(results[0].formatted_address);
          onAddressChange?.(results[0].formatted_address);
        }
      });
    });

    // Click on map to move pin
    map.addListener("click", (e: any) => {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      marker.setPosition(newPos);
      circle.setCenter(newPos);
      setCenter(newPos);
      onCenterChange?.(newPos);

      const geocoder = new gm.Geocoder();
      geocoder.geocode({ location: newPos }, (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          setAddress(results[0].formatted_address);
          onAddressChange?.(results[0].formatted_address);
          if (searchRef.current) searchRef.current.value = results[0].formatted_address;
        }
      });
    });

    setMapsLoaded(true);
  }, []);

  // Update circle radius when prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  // Handle Search Input Change (Debounced Geocoding)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      if (!window.google) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: val }, (results: any[], status: string) => {
        if (status === "OK" && results && results.length > 0) {
          setSearchResults(results);
          setShowResults(true);
        } else {
          setSearchResults([]);
        }
      });
    }, 400); // 400ms debounce
  };

  // Handle selecting a result from dropdown
  const handleSelectResult = (result: any) => {
    if (!result) return;
    if (searchRef.current) searchRef.current.value = result.formatted_address;
    
    const loc = result.geometry.location;
    const newPos = { lat: loc.lat(), lng: loc.lng() };
    setCenter(newPos);
    setAddress(result.formatted_address);
    onCenterChange?.(newPos);
    onAddressChange?.(result.formatted_address);

    if (result.geometry.viewport) {
      mapInstanceRef.current?.fitBounds(result.geometry.viewport);
    } else {
      mapInstanceRef.current?.setCenter(newPos);
      mapInstanceRef.current?.setZoom(16);
    }
    
    markerRef.current?.setPosition(newPos);
    circleRef.current?.setCenter(newPos);
    
    setShowResults(false);
  };

  // Hard Search handler (Clicking "Find" or "Enter")
  const handleSearch = () => {
    if (!window.google || !searchRef.current?.value.trim()) return;
    setSearching(true);
    setShowResults(false);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchRef.current.value }, (results: any[], status: string) => {
      setSearching(false);
      if (status === "OK" && results[0]) {
        handleSelectResult(results[0]);
      } else {
        alert("Location not found. Please try a different address.");
      }
    });
  };

  const GMAPS_KEY = process.env.NEXT_PUBLIC_GMAPS_KEY || "";
  const PRESETS = [100, 200, 500, 1000, 2000];

  return (
    <div className="flex flex-col gap-4 relative">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`}
        strategy="lazyOnload"
        onLoad={initMap}
      />

      {/* Address Search */}
      <div className="flex gap-2 relative z-50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            defaultValue="Chennai, Tamil Nadu, India"
            placeholder="Search office address…"
            onChange={handleInputChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            onBlur={() => {
              // slight delay to allow click on result
              setTimeout(() => setShowResults(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[10px] text-[13px] font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
          />
          {/* Custom Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[240px] overflow-y-auto bg-white dark:bg-[#1C1C22] border border-gray-100 dark:border-white/10 rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 custom-scrollbar">
              {searchResults.map((res: any, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectResult(res);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-none flex items-start gap-3 group"
                >
                  <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#007AFF]/10 transition-colors">
                    <MapPin className="h-3.5 w-3.5 text-gray-500 group-hover:text-[#007AFF] transition-colors" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate w-full">
                      {res.address_components?.[0]?.short_name || res.formatted_address.split(',')[0]}
                    </span>
                    <span className="text-[12px] text-gray-500 font-medium truncate w-full mt-0.5">
                      {res.formatted_address}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2.5 bg-[#007AFF] text-white text-[13px] font-bold rounded-[10px] hover:bg-[#0062CC] transition-colors disabled:opacity-60 flex items-center gap-1.5 shrink-0"
        >
          {searching ? (
            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation2 className="h-3.5 w-3.5" />
          )}
          Find
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-[16px] overflow-hidden border border-gray-200 dark:border-white/10" style={{ height: 320 }}>
        <div ref={mapRef} className="w-full h-full" />
        {!mapsLoaded && (
          <div className="absolute inset-0 bg-[#F8F9FA] dark:bg-[#1C1C22] flex flex-col items-center justify-center gap-3">
            {GMAPS_KEY && GMAPS_KEY !== "YOUR_GOOGLE_MAPS_API_KEY_HERE" ? (
              <>
                <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
                <p className="text-[13px] font-medium text-gray-500">Loading map…</p>
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <MapPin className="h-7 w-7 text-blue-500" />
                </div>
                <div className="text-center px-6">
                  <p className="text-[14px] font-bold text-gray-800 dark:text-white mb-1">Google Maps API Key Required</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    Add <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">NEXT_PUBLIC_GMAPS_KEY</code> to your <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">.env.local</code> to enable the interactive map.
                  </p>
                </div>
                {/* Preview overlay — static map placeholder */}
                <div className="mt-2 rounded-[12px] overflow-hidden border border-dashed border-blue-300 dark:border-blue-500/30 w-full max-w-xs">
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=13.0827,80.2707&zoom=14&size=400x200&markers=color:blue%7C13.0827,80.2707&key=${GMAPS_KEY || "DEMO"}`}
                    alt="Map preview"
                    className="w-full h-[120px] object-cover opacity-40"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              </>
            )}
          </div>
        )}
        {/* Coordinate badge */}
        {mapsLoaded && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-[10px] px-3 py-2 flex items-center gap-2 shadow-sm border border-gray-200/60 dark:border-white/10">
            <Target className="h-3.5 w-3.5 text-[#007AFF]" />
            <span className="text-[11px] font-mono font-semibold text-gray-700 dark:text-gray-300">
              {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-[10px] px-3 py-1.5 shadow-sm border border-gray-200/60 dark:border-white/10">
          <span className="text-[11px] font-bold text-[#007AFF]">{radius >= 1000 ? `${(radius/1000).toFixed(1)} km` : `${radius} m`} radius</span>
        </div>
      </div>

      {/* Radius Controls */}
      <div className="flex flex-col gap-3 p-4 bg-[#F2F2F7] dark:bg-[#1C1C22] rounded-[14px]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">Geofence Radius</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={radius}
              min={100}
              max={5000}
              step={50}
              onChange={(e) => {
                const v = Math.max(100, Math.min(5000, parseInt(e.target.value) || 100));
                onRadiusChange(v);
              }}
              className="w-20 text-right bg-white dark:bg-[#2C2C35] border border-gray-200 dark:border-white/10 rounded-[8px] px-2 py-1 text-[13px] font-bold text-[#007AFF] outline-none focus:ring-2 focus:ring-[#007AFF]/30"
            />
            <span className="text-[12px] font-semibold text-gray-500">meters</span>
          </div>
        </div>

        {/* Slider */}
        <div className="relative flex items-center">
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={radius}
            onChange={(e) => onRadiusChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #007AFF 0%, #007AFF ${((radius - 100) / 4900) * 100}%, #E5E7EB ${((radius - 100) / 4900) * 100}%, #E5E7EB 100%)`
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <span>100 m</span>
          <span>5 km</span>
        </div>

        {/* Preset Pills */}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick set:</span>
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => onRadiusChange(p)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                radius === p
                  ? "bg-[#007AFF] text-white"
                  : "bg-white dark:bg-[#2C2C35] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#007AFF]/40"
              }`}
            >
              {p >= 1000 ? `${p/1000}km` : `${p}m`}
            </button>
          ))}
        </div>

        {/* Address display */}
        {address && (
          <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-white/10">
            <MapPin className="h-3.5 w-3.5 text-[#007AFF] mt-0.5 shrink-0" />
            <span className="text-[12px] text-gray-600 dark:text-gray-400 font-medium leading-snug">{address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminAttendanceSection ──────────────────────────────────────────────
function AdminAttendanceSection() {
  // null = main view, 'qr' = QR landing, 'map' = manual map picker
  const [setupView, setSetupView] = useState<null | 'qr' | 'map'>(null);

  // Supabase
  const supabase = require("@/utils/supabase/client").createClient();
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [ownerId, setOwnerId]   = useState("");

  // Attendance toggles
  const [geofencing,        setGeofencing]        = useState(true);
  const [ipLock,            setIpLock]            = useState(false);
  const [selfieVerification,setSelfieVerification] = useState(true);
  const [autoOvertime,      setAutoOvertime]       = useState(true);

  // Schedule
  const [shiftStart,   setShiftStart]   = useState("09:00");
  const [shiftEnd,     setShiftEnd]     = useState("18:00");
  const [gracePeriod,  setGracePeriod]  = useState("15");
  const [workingDays,  setWorkingDays]  = useState(["Mon","Tue","Wed","Thu","Fri"]);

  // Geofence
  const [geoRadius,      setGeoRadius]      = useState(200);
  const [geoCenter,      setGeoCenter]      = useState<{lat:number;lng:number} | null>(null);
  const [geoAddress,     setGeoAddress]     = useState("");

  // IP lock
  const [ipAddress, setIpAddress] = useState("192.168.1.1");

  // ── Load from Supabase ───────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setOwnerId(user.id);

      const { data } = await supabase
        .from("company_settings")
        .select(`
          geofencing_enabled, office_lat, office_lng, office_radius, office_address,
          shift_start, shift_end, working_days, grace_period_mins,
          ip_lock_enabled, ip_lock_address, selfie_verification, auto_overtime
        `)
        .eq("company_id", user.id)
        .single();

      if (data) {
        setGeofencing(data.geofencing_enabled ?? true);
        setGeoRadius(data.office_radius ?? 200);
        setGeoAddress(data.office_address ?? "");
        if (data.office_lat && data.office_lng)
          setGeoCenter({ lat: data.office_lat, lng: data.office_lng });
        setShiftStart(data.shift_start ?? "09:00");
        setShiftEnd(data.shift_end ?? "18:00");
        setWorkingDays(data.working_days ?? ["Mon","Tue","Wed","Thu","Fri"]);
        setGracePeriod(String(data.grace_period_mins ?? 15));
        setIpLock(data.ip_lock_enabled ?? false);
        setIpAddress(data.ip_lock_address ?? "192.168.1.1");
        setSelfieVerification(data.selfie_verification ?? true);
        setAutoOvertime(data.auto_overtime ?? true);
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save to Supabase ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!ownerId) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const { error } = await supabase
        .from("company_settings")
        .update({
          geofencing_enabled:  geofencing,
          office_radius:       geoRadius,
          office_address:      geoAddress || null,
          office_lat:          geoCenter?.lat ?? null,
          office_lng:          geoCenter?.lng ?? null,
          shift_start:         shiftStart,
          shift_end:           shiftEnd,
          working_days:        workingDays,
          grace_period_mins:   parseInt(gracePeriod),
          ip_lock_enabled:     ipLock,
          ip_lock_address:     ipLock ? ipAddress : null,
          selfie_verification: selfieVerification,
          auto_overtime:       autoOvertime,
        })
        .eq("company_id", ownerId);
      if (error) throw error;
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── QR Code Landing View ────────────────────────────────────────────────────
  if (setupView === 'qr') {
    // Android deep-link that opens the Vertex app directly when scanned
    const QR_URL = "vertexapp://setup-location";

    const steps = [
      { n: "1", text: "Open Vertex app on your phone" },
      { n: "2", text: "Walk to your office location" },
      { n: "3", text: "Scan this QR code with the app" },
      { n: "4", text: "Confirm location in the app" },
    ];

    return (
      <div className="flex flex-col w-full max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSetupView(null)}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6 rotate-180 text-gray-500" />
          </button>
          <div>
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">Setup Geofence Range</h2>
            <p className="text-[13px] text-gray-500 font-medium mt-0.5">Scan with Vertex to set office location</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-[#121217] rounded-[24px] border border-gray-100 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">

          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-[#007AFF] to-[#0055CC] px-6 py-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-[14px] bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-blue-200 mb-0.5">Vertex Mobile</p>
              <p className="text-[17px] font-extrabold text-white leading-tight">On-Site Location Setup</p>
              <p className="text-[12px] text-blue-100 font-medium mt-0.5">Use your phone's GPS for maximum accuracy</p>
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row gap-8 items-start">

            {/* Left — QR Code */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,122,255,0.12)] border border-[#007AFF]/10">
                <QRCode
                  value={QR_URL}
                  size={176}
                  fgColor="#007AFF"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Scan with Vertex App</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-[180px] leading-relaxed">
                  Point your phone camera at the QR code after opening Vertex
                </p>
              </div>
            </div>

            {/* Right — Steps + Info */}
            <div className="flex-1 flex flex-col gap-6">

              {/* Steps */}
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">How it works</p>
                {steps.map(({ n, text }) => (
                  <div key={n} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-[#007AFF] flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-extrabold text-white">{n}</span>
                    </div>
                    <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">{text}</p>
                  </div>
                ))}
              </div>

              {/* Info box */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-500/20 rounded-[14px] p-4 flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-[#007AFF]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Navigation2 className="h-3.5 w-3.5 text-[#007AFF]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#007AFF] mb-0.5">Why use the app?</p>
                  <p className="text-[12px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                    Your phone provides real-time GPS coordinates directly from your office, ensuring employees can only clock in from the exact company premises.
                  </p>
                </div>
              </div>

              {/* Current radius summary */}
              <div className="flex items-center gap-3 bg-[#F8F9FA] dark:bg-[#1C1C22] rounded-[12px] px-4 py-3 border border-gray-100 dark:border-white/5">
                <Target className="h-4 w-4 text-[#007AFF] shrink-0" />
                <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
                  Current radius:{" "}
                  <span className="font-bold text-[#007AFF]">
                    {geoRadius >= 1000 ? `${(geoRadius / 1000).toFixed(1)} km` : `${geoRadius} m`}
                  </span>
                </span>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <button
              onClick={() => setSetupView('map')}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-[#007AFF] transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Set Manually Instead
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
            <button
              onClick={() => setSetupView(null)}
              className="px-6 py-3 bg-[#007AFF] text-white rounded-[12px] font-bold text-[14px] hover:bg-[#0062CC] transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Map Picker View ────────────────────────────────────────────────────────
  if (setupView === 'map') {
    return (
      <div className="flex flex-col w-full max-w-4xl h-full animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSetupView('qr')}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6 rotate-180 text-gray-500" />
          </button>
          <div>
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">Setup Geofence Range</h2>
            <p className="text-[13px] text-gray-500 font-medium mt-0.5">Drag to move the pin and use the slider to set the radius</p>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-[#121217] rounded-[24px] border border-gray-100 dark:border-white/5 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <GeoRadiusPicker
            radius={geoRadius}
            onRadiusChange={setGeoRadius}
            onCenterChange={setGeoCenter}
            onAddressChange={setGeoAddress}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setSetupView(null)}
              className="px-6 py-3 bg-[#007AFF] text-white rounded-[12px] font-bold text-[14px] hover:bg-[#0062CC] transition-colors shadow-sm"
            >
              Done Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Attendance Settings View ──────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Attendance Configuration</h2>
      
      <div className="flex flex-col gap-8">
        {/* Work Schedule */}
        <div>
          <SectionLabel>Global Work Schedule</SectionLabel>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldContainer className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Shift Start</span>
                </div>
                <input 
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 text-right outline-none cursor-pointer p-0"
                  style={{ colorScheme: 'dark' }}
                />
              </FieldContainer>
              <FieldContainer className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Shift End</span>
                </div>
                <input 
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 text-right outline-none cursor-pointer p-0"
                  style={{ colorScheme: 'dark' }}
                />
              </FieldContainer>
            </div>
            
            <FieldContainer className="py-4">
              <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300 block mb-3">Working Days</span>
              <div className="flex flex-wrap gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                      workingDays.includes(day)
                        ? "bg-[#007AFF] text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </FieldContainer>
          </div>
        </div>

        {/* Grace Period & Penalties */}
        <div>
          <SectionLabel>Grace Period &amp; Lateness</SectionLabel>
          <FieldContainer className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Allowed Grace Period</p>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Buffer time (minutes) before marking as Late</p>
            </div>
            <select 
              value={gracePeriod}
              onChange={(e) => setGracePeriod(e.target.value)}
              className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
            >
              <option value="0">On Time</option>
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
            </select>
          </FieldContainer>
        </div>

        {/* Attendance Tracking Methods */}
        <div>
          <SectionLabel>Tracking &amp; Verification</SectionLabel>
          <div className="flex flex-col gap-3">

            {/* ── Geofencing Card ───────────────────────────────────────── */}
            <FieldContainer className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white">Geofencing Control</p>
                    <Toggle on={geofencing} onChange={() => setGeofencing(v => !v)} />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Limit clock-ins to a defined radius around your office location</p>
                </div>
              </div>

              {geofencing && (
                <div className="pt-3 pb-1 border-t border-gray-100 dark:border-white/8 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-800 dark:text-white">Office Location &amp; Radius</span>
                    <span className="text-[12px] text-gray-500 mt-0.5 font-medium">
                      {geoAddress ? <span className="truncate max-w-[180px] block">{geoAddress}</span> : null}
                      Current Range: <span className="font-bold text-[#007AFF] ml-1">{geoRadius >= 1000 ? `${(geoRadius/1000).toFixed(1)} km` : `${geoRadius} m`}</span>
                    </span>
                  </div>
                  <button 
                    onClick={() => setSetupView('qr')}
                    className="px-4 py-2 bg-[#007AFF]/10 text-[#007AFF] text-[13px] font-bold rounded-[10px] hover:bg-[#007AFF]/20 transition-colors shadow-sm"
                  >
                    Setup Range
                  </button>
                </div>
              )}
            </FieldContainer>

            {/* IP Restriction */}
            <FieldContainer className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white">IP Restriction Lock</p>
                    <Toggle on={ipLock} onChange={() => setIpLock(v => !v)} />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Restrict clock-ins to company network IP</p>
                </div>
              </div>
              {ipLock && (
                <div className="flex items-center justify-between pl-14 pt-2 border-t border-gray-100 dark:border-white/5">
                  <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400">Fixed IP Address</span>
                  <input 
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 text-right outline-none w-40"
                  />
                </div>
              )}
            </FieldContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldContainer className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Camera className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white">Selfie Verification</p>
                    <Toggle on={selfieVerification} onChange={() => setSelfieVerification(v => !v)} />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Require photo on clock-in</p>
                </div>
              </FieldContainer>
              <FieldContainer className="flex items-start gap-4 opacity-70">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Fingerprint className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white">Biometric Sync</p>
                    <p className="text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">Enterprise</p>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Hardware integration</p>
                </div>
              </FieldContainer>
            </div>
          </div>
        </div>

        {/* Overtime Policies */}
        <div>
          <SectionLabel>Overtime &amp; Labor Rules</SectionLabel>
          <FieldContainer className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Automated OT Calculation</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Calculate OT after 8h of daily work</p>
              </div>
            </div>
            <Toggle on={autoOvertime} onChange={() => setAutoOvertime(v => !v)} />
          </FieldContainer>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3.5 rounded-[14px] font-bold text-[15px] transition-colors flex items-center gap-2 disabled:opacity-70 ${
              saveStatus === 'success' ? 'bg-[#34C759] text-white'
              : saveStatus === 'error'   ? 'bg-[#FF3B30] text-white'
              : 'bg-[#007AFF] text-white hover:bg-[#0062CC]'
            }`}
          >
            {saving ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : saveStatus === 'success' ? (
              <><Check className="h-4 w-4" /> Saved!</>
            ) : saveStatus === 'error' ? (
              'Error — try again'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



// ─── Main AdminPayrollSection ────────────────────────────────────────────────
function AdminPayrollSection({ setActive }: { setActive: (s: string) => void }) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Payroll Settings</h2>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">Configure company payroll cycles, attendance integration rules, payslip formats, and approval workflows.</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* 1. Company Payroll Settings Card */}
        <FieldContainer onClick={() => setActive('admin_payroll_company')} className="flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Company Payroll Settings</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Specify cycle boundaries and payment dates</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
        </FieldContainer>

        {/* 2. Attendance Integration Card */}
        <FieldContainer onClick={() => setActive('admin_payroll_attendance')} className="flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Attendance Integration</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Automate calculations between timesheet and payroll</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#FF9500] transition-colors" />
        </FieldContainer>

        {/* 3. Payslip Settings Card */}
        <FieldContainer onClick={() => setActive('admin_payroll_payslip')} className="flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Payslip Settings</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Configure visual layout and content for generated employee payslips</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#34C759] transition-colors" />
        </FieldContainer>

        {/* 4. Payroll Approval Flow Card */}
        <FieldContainer onClick={() => setActive('admin_payroll_approval')} className="flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Payroll Approval Flow</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Design multi-level steps required to release salary payments</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#9B51E0] transition-colors" />
        </FieldContainer>
      </div>
    </div>
  );
}



function AdminLogsSection() {
  const [states, setStates] = useState({
    employeeVisibility: true,
    automatedExports: false,
    extendedAudit: true,
  });

  const [retention, setRetention] = useState("1year");
  const [exportDay, setExportDay] = useState("Monday");

  const toggle = (k: keyof typeof states) => setStates(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Log & Security Settings</h2>
      
      <div className="flex flex-col gap-8">
        {/* Retention Policy */}
        <div>
          <SectionLabel>Data Storage & Retention</SectionLabel>
          <FieldContainer className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Log Retention Period</p>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Duration to keep attendance and system logs</p>
            </div>
            <select 
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
              className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
            >
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
              <option value="2years">2 Years</option>
              <option value="5years">5 Years</option>
              <option value="permanent">Permanent</option>
            </select>
          </FieldContainer>
        </div>

        {/* Employee Visibility */}
        <div>
          <SectionLabel>Access & Visibility</SectionLabel>
          <FieldContainer className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Employee Self-Viewing</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow employees to view their own log history</p>
              </div>
            </div>
            <Toggle on={states.employeeVisibility} onChange={() => toggle('employeeVisibility')} />
          </FieldContainer>
        </div>

        {/* Automated Exports */}
        <div>
          <SectionLabel>Reporting & Compliance</SectionLabel>
          <FieldContainer className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">Automated Log Exports</p>
                  <Toggle on={states.automatedExports} onChange={() => toggle('automatedExports')} />
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Send weekly CSV reports to administrative emails</p>
              </div>
            </div>
            {states.automatedExports && (
              <div className="flex items-center justify-between pl-14 pt-2 border-t border-gray-100 dark:border-white/5">
                <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400">Export Day</span>
                <select 
                  value={exportDay}
                  onChange={(e) => setExportDay(e.target.value)}
                  className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}
          </FieldContainer>
        </div>

        {/* Audit Trail */}
        <div>
          <SectionLabel>Security & Auditing</SectionLabel>
          <FieldContainer className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Extended Audit Trail</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Track all administrative and settings changes</p>
              </div>
            </div>
            <Toggle on={states.extendedAudit} onChange={() => toggle('extendedAudit')} />
          </FieldContainer>
        </div>

        {/* Danger Zone */}
        <div className="mt-4">
          <SectionLabel className="text-red-500">Danger Zone</SectionLabel>
          <FieldContainer className="border-red-200/50 bg-red-50/10 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-red-600 dark:text-red-400 leading-tight">Clear Old Logs</p>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Permanently delete logs older than 1 year</p>
            </div>
            <button className="px-5 py-2.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-xl text-[13px] font-bold transition-all flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Purge Logs
            </button>
          </FieldContainer>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminMessagesSection() {
  const [states, setStates] = useState({
    globalAnnouncements: true,
    fileSharing: true,
    readReceiptsGlobal: true,
    helpdeskEnabled: true,
    autoArchive: false,
  });

  const [permissions, setPermissions] = useState("everyone");
  const [fileLimit, setFileLimit] = useState("25MB");
  const [retention, setRetention] = useState("permanent");

  const toggle = (k: keyof typeof states) => setStates(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Company Messaging Settings</h2>
      
      <div className="flex flex-col gap-8">
        {/* Messaging Permissions */}
        <div>
          <SectionLabel>Communication Permissions</SectionLabel>
          <FieldContainer className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Who can initiate chats?</p>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Control the messaging scope for employees</p>
            </div>
            <select 
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
            >
              <option value="everyone">Everyone (Open)</option>
              <option value="dept">Department Only</option>
              <option value="manager">Managers & Above Only</option>
            </select>
          </FieldContainer>
        </div>

        {/* Global Features */}
        <div>
          <SectionLabel>Global Features</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Company-wide Announcements</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow managers to broadcast messages to all employees</p>
                </div>
              </div>
              <Toggle on={states.globalAnnouncements} onChange={() => toggle('globalAnnouncements')} />
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-[#007AFF]" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">External Contact Sharing</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow sharing contact cards with external guests</p>
                </div>
              </div>
              <Toggle on={states.fileSharing} onChange={() => toggle('fileSharing')} />
            </FieldContainer>
          </div>
        </div>

        {/* File Sharing Rules */}
        <div>
          <SectionLabel>File Sharing & Storage</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Max File Size Limit</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Maximum size allowed for message attachments</p>
                </div>
              </div>
              <select 
                value={fileLimit}
                onChange={(e) => setFileLimit(e.target.value)}
                className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
              >
                <option value="10MB">10 MB</option>
                <option value="25MB">25 MB</option>
                <option value="100MB">100 MB</option>
                <option value="500MB">500 MB</option>
              </select>
            </FieldContainer>
          </div>
        </div>

        {/* Retention & Privacy */}
        <div>
          <SectionLabel>Retention & Archiving</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Message Retention Policy</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">How long to keep message history company-wide</p>
              </div>
              <select 
                value={retention}
                onChange={(e) => setRetention(e.target.value)}
                className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
              >
                <option value="90days">90 Days</option>
                <option value="1year">1 Year</option>
                <option value="2years">2 Years</option>
                <option value="permanent">Permanent</option>
              </select>
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Auto-Archive Inactive Chats</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Move chats with no activity for 30 days to archive</p>
              </div>
              <Toggle on={states.autoArchive} onChange={() => toggle('autoArchive')} />
            </FieldContainer>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminCredentialsSection() {
  const supabase = createClient();
  const [view, setView] = useState<"settings" | "list">("settings");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live auth status: { [employeeId]: { exists, confirmed, lastSignIn, userId } }
  const [authStatus, setAuthStatus] = useState<Record<string, any>>({});
  const [statusLoading, setStatusLoading] = useState(false);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Global Settings State
  const [autoLogout, setAutoLogout] = useState("Never");
  const [ssoProviders, setSsoProviders] = useState({ Google: true, Microsoft: false, Github: false });
  const [forgotPasswordFlow, setForgotPasswordFlow] = useState("Self");
  const [passMinChars, setPassMinChars] = useState(6);
  const [passMinNumbers, setPassMinNumbers] = useState(3);
  const [passMinSpecial, setPassMinSpecial] = useState(1);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      if (data) setUsers(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // Fetch auth status for all employees whenever the list view is shown
  useEffect(() => {
    if (view !== 'list' || users.length === 0) return;
    async function fetchAllStatus() {
      setStatusLoading(true);
      const results: Record<string, any> = {};
      await Promise.all(
        users
          .filter(u => u.email)
          .map(async (u) => {
            try {
              const res = await fetch(`/api/employee-credentials?email=${encodeURIComponent(u.email)}`);
              if (res.ok) results[u.id] = await res.json();
            } catch {}
          })
      );
      setAuthStatus(results);
      setStatusLoading(false);
    }
    fetchAllStatus();
  }, [view, users]);

  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleSso = (key: string) => setSsoProviders(prev => ({ ...prev, [key]: !prev[key as keyof typeof ssoProviders] }));

  const handleCredAction = async (action: 'create' | 'reset_password', emp: any) => {
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/employee-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: emp.email, password: newPassword, employeeId: emp.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: action === 'create' ? 'Account created! Employee can now log in.' : 'Password updated successfully.' });
      setNewPassword('');
      // Refresh status for this employee
      const statusRes = await fetch(`/api/employee-credentials?email=${encodeURIComponent(emp.email)}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setAuthStatus(prev => ({ ...prev, [emp.id]: statusData }));
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (view === "list") {
    return (
      <div className="flex flex-col gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setView("settings")} className="h-10 w-10 flexItems justify-center bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ChevronRight className="h-5 w-5 rotate-180 m-auto" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Employee Credentials List</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F8F9FA] dark:bg-white/5 border border-transparent focus:border-[#007AFF] rounded-xl py-2 pl-9 pr-4 text-[13px] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="py-10 flex justify-center text-[#007AFF]"><RefreshCw className="h-6 w-6 animate-spin" /></div>
          ) : filteredUsers.map((user) => {
            const auth = authStatus[user.id];
            const hasAccount = auth?.exists ?? null; // null = still loading
            const isActive = hasAccount === true;
            const lastSignIn = auth?.lastSignIn;
            const confirmed = auth?.confirmed;

            return (
              <div key={user.id} className="flex flex-col gap-0 bg-[#F8F9FA] dark:bg-[#1C1C22] rounded-[16px] overflow-hidden border border-transparent hover:border-[#E5E7EB] dark:border-white/5 dark:hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center text-[18px] font-extrabold text-[#007AFF] tracking-wider overflow-hidden">
                      {user.personal_info?.profile_pic ? (
                        <img src={user.personal_info.profile_pic} alt="Profile" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        (user.name || "UN").substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-gray-900 dark:text-white">{user.name || "Unnamed Employee"}</p>
                        {/* Account status badge */}
                        {hasAccount === null && statusLoading ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-400 dark:bg-white/5">…</span>
                        ) : isActive ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                            {confirmed ? 'Active' : 'Pending'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-500">No Account</span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF]">2FA: Off</span>
                      </div>
                      <p className="text-[12px] text-gray-500 font-medium">{user.email || "No email mapped"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-transparent rounded-full text-[14px] font-black tracking-widest text-[#7B7B87] opacity-60">
                      ••••••••
                    </div>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors" title="Force Logout">
                      <LogOut className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors" title="Account Security">
                      <ShieldAlert className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-[3.5rem] px-5 py-3 border-t border-gray-100 dark:border-white/5">
                  {user.email ? (
                    <>
                      <button
                        onClick={() => { setResetTarget(user); setNewPassword(''); setMsg(null); setShowPass(false); }}
                        className="text-[12px] font-bold text-[#007AFF] hover:underline"
                      >
                        {isActive ? 'Reset Password' : 'Create Account'}
                      </button>
                      <div className="w-px h-3 bg-gray-200 dark:bg-white/10" />
                      <span className={`text-[12px] font-bold ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {isActive ? (confirmed ? '✓ Setup Complete' : '⏳ Pending Verification') : '✗ No Login Access'}
                      </span>
                      <div className="w-px h-3 bg-gray-200 dark:bg-white/10" />
                      <p className="text-[12px] text-[#7B7B87] font-medium">
                        Last login: {lastSignIn ? new Date(lastSignIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                      </p>
                    </>
                  ) : (
                    <p className="text-[12px] text-orange-500 font-semibold">No email — cannot manage credentials</p>
                  )}
                </div>
              </div>
            );
          })}
          {!loading && filteredUsers.length === 0 && (
            <p className="py-10 text-center text-[13px] text-gray-500">No employees found.</p>
          )}
        </div>

        {/* Reset / Create Password Modal */}
        {resetTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="w-full max-w-[420px] bg-white dark:bg-[#1C1C22] rounded-[24px] shadow-2xl border border-[#E5E7EB] dark:border-[#2C2C35] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-[#2C2C35] flex items-center justify-between">
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">
                    {authStatus[resetTarget.id]?.exists ? 'Reset Password' : 'Create Login Account'}
                  </h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">{resetTarget.name} · {resetTarget.email}</p>
                </div>
                <button onClick={() => { setResetTarget(null); setMsg(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all font-mono"
                    onKeyDown={e => { if (e.key === 'Enter') handleCredAction(authStatus[resetTarget.id]?.exists ? 'reset_password' : 'create', resetTarget); }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {msg && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13px] font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {msg.type === 'success' ? '✓' : '✗'} {msg.text}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setResetTarget(null); setMsg(null); }} className="flex-1 py-3 bg-[#F2F2F7] dark:bg-[#2C2C35] text-gray-700 dark:text-gray-300 rounded-[12px] font-bold text-[14px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCredAction(authStatus[resetTarget.id]?.exists ? 'reset_password' : 'create', resetTarget)}
                    disabled={saving || newPassword.length < 6}
                    className="flex-1 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[12px] font-bold text-[14px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                    {saving ? 'Saving...' : authStatus[resetTarget.id]?.exists ? 'Update Password' : 'Create Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
        <div onClick={() => setView('list')} className="mb-[-12px] relative overflow-hidden bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 p-6 rounded-[16px] border border-purple-500/30 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-purple-600 dark:text-purple-400 mb-1.5">Employee Credentials</p>
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-1">Manage Employee Credentials</h2>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 font-medium tracking-tight">Centralized oversight for employee profile security, 2FA status, and company-wide password parameter enforcements.</p>
          </div>
          <div className="h-10 w-10 shrink-0 bg-white dark:bg-black/30 text-gray-400 rounded-full flex items-center justify-center shadow-sm group-hover:bg-purple-500 group-hover:text-white transition-all">
            <ChevronRight className="h-5 w-5 ml-0.5" />
          </div>
        </div>

      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white -mb-2 mt-4">Credentials Settings</h2>
      
      <div className="flex flex-col gap-6">
        <div>
          <SectionLabel>Session Controls</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Auto Logout Policy</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Force users to re-authenticate periodically</p>
              </div>
              <select 
                value={autoLogout}
                onChange={(e) => setAutoLogout(e.target.value)}
                className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Never">Never</option>
              </select>
            </FieldContainer>
          </div>
        </div>

        <div>
          <SectionLabel>Authentication Handlers</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex flex-col gap-3">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">SSO Providers Allowed</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5 mb-2">Toggle specific Single Sign-On platforms for workspace access</p>
              </div>
              <div className="flex items-center gap-4">
                {Object.keys(ssoProviders).map(provider => (
                  <label key={provider} className="flex items-center gap-2 cursor-pointer bg-[#F2F2F7] dark:bg-[#2C2C35] px-3 py-1.5 rounded-[8px]">
                    <input type="checkbox" checked={ssoProviders[provider as keyof typeof ssoProviders]} onChange={() => toggleSso(provider)} className="rounded border-[#007AFF] text-[#007AFF] focus:ring-[#007AFF]/50 h-3.5 w-3.5 bg-white" />
                    <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">{provider}</span>
                  </label>
                ))}
              </div>
            </FieldContainer>

            <FieldContainer className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Forgot Password Flow</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Who facilitates recovery options when locked out</p>
              </div>
              <select 
                value={forgotPasswordFlow}
                onChange={(e) => setForgotPasswordFlow(e.target.value)}
                className="bg-transparent border-none text-[14px] font-bold text-[#007AFF] focus:ring-0 cursor-pointer text-right outline-none"
              >
                <option value="Self">Self Recovery</option>
                <option value="Contact Admin">Contact Admin</option>
              </select>
            </FieldContainer>
          </div>
        </div>

        {forgotPasswordFlow === "Self" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionLabel>Password Minimum Requirements</SectionLabel>
            <div className="flex flex-col gap-2 relative">
              <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-[#007AFF]/20 rounded-full" />
              <FieldContainer className="ml-8 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">Total Characters</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Minimum required block length</p>
                </div>
                <input 
                  type="number" 
                  min={6}
                  value={passMinChars} 
                  onChange={e => setPassMinChars(Math.max(6, parseInt(e.target.value) || 6))}
                  className="w-20 bg-[#F2F2F7] dark:bg-[#2C2C35] text-center font-bold text-[#007AFF] rounded-lg py-1.5 focus:outline-none" 
                />
              </FieldContainer>
              <FieldContainer className="ml-8 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">Numeric Characters</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Minimum numeric values (0-9)</p>
                </div>
                <input 
                  type="number" 
                  min={3}
                  value={passMinNumbers} 
                  onChange={e => setPassMinNumbers(Math.max(3, parseInt(e.target.value) || 3))}
                  className="w-20 bg-[#F2F2F7] dark:bg-[#2C2C35] text-center font-bold text-[#007AFF] rounded-lg py-1.5 focus:outline-none" 
                />
              </FieldContainer>
              <FieldContainer className="ml-8 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">Special Characters</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Requirements for symbols (!@#$%^&*)</p>
                </div>
                <input 
                  type="number" 
                  min={1}
                  value={passMinSpecial} 
                  onChange={e => setPassMinSpecial(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-[#F2F2F7] dark:bg-[#2C2C35] text-center font-bold text-[#007AFF] rounded-lg py-1.5 focus:outline-none" 
                />
              </FieldContainer>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 flex items-center gap-4">
        <button 
          onClick={() => {
            setSaving(true);
            setTimeout(() => setSaving(false), 1000);
          }}
          disabled={saving}
          className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors disabled:opacity-50"
        >
          {saving ? 'Updating Rules...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function HelpSupportSection() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Help & Support</h2>
      
      <div className="flex flex-col gap-8">
        <div>
          <SectionLabel>Resources</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Documentation", desc: "Browse technical guides", icon: FileText, href: "/help" },
              { title: "Help Center", desc: "Search for answers", icon: HelpCircle, href: "/help" },
              { title: "Community", desc: "Connect with others", icon: Users, href: "/help" },
              { title: "Video Tutorials", desc: "Watch how-to guides", icon: LifeBuoy, href: "/help" },
            ].map((item, i) => (
              <FieldContainer 
                key={i} 
                className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                onClick={() => router.push(item.href)}
              >
                <div className="h-10 w-10 rounded-xl bg-[#007AFF]/5 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-[#007AFF]" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </FieldContainer>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Support Channels</SectionLabel>
          <div className="flex flex-col gap-2">
            <FieldContainer className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Email Support</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Average response time: 24h</p>
                </div>
              </div>
              <button className="text-[13px] font-bold text-[#007AFF] hover:underline transition-colors focus:outline-none">
                Contact
              </button>
            </FieldContainer>
            <FieldContainer className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquareHeart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Live Chat</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">Talk to our experts now</p>
                </div>
              </div>
              <button className="px-5 py-2 bg-[#007AFF] text-white rounded-lg font-bold text-[13px] hover:bg-[#0062CC] transition-colors">
                Chat Now
              </button>
            </FieldContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackSection() {
  const [rating, setRating] = useState(0);
  
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-2">Feedback</h2>
      
      <div className="flex flex-col gap-8">
        <div>
          <SectionLabel>Your Rating</SectionLabel>
          <FieldContainer className="flex flex-col gap-4">
            <p className="text-[15px] text-gray-700 dark:text-gray-300 font-medium">How would you rate your experience with the platform?</p>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`h-8 w-8 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-white/10'}`} 
                  />
                </button>
              ))}
            </div>
          </FieldContainer>
        </div>

        <div>
          <SectionLabel>Share Your Thoughts</SectionLabel>
          <FieldContainer className="flex flex-col gap-4">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">Feature Suggestions & Bugs</p>
              <p className="text-[12px] text-gray-500 font-medium mt-1">What can we do to improve? Tell us about any issues you've encountered.</p>
            </div>
            <textarea 
              placeholder="Tell us what's on your mind..."
              className="w-full h-32 bg-[#F8F9FA] dark:bg-white/5 border border-transparent focus:border-[#007AFF] rounded-xl p-4 text-[14px] outline-none transition-all resize-none dark:text-white"
            />
          </FieldContainer>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button className="px-8 py-3.5 bg-[#007AFF] text-white rounded-[14px] font-bold text-[15px] hover:bg-[#0062CC] transition-colors">
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminCustomFieldsSection({ setActive }: any) {
  const [fields, setFields] = useState<{ id: string, label: string, type: string, required: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("text");
  const [newRequired, setNewRequired] = useState(false);

  // Advanced Configurations
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [textCase, setTextCase] = useState("hybrid"); // caps, small, hybrid
  const [allowSpecialChars, setAllowSpecialChars] = useState(true);
  const [allowNumbers, setAllowNumbers] = useState(true);
  const [allowSpaces, setAllowSpaces] = useState(true);
  const [allowedExtensions, setAllowedExtensions] = useState<string[]>(['pdf', 'jpg', 'png']);
  const [newMaxChars, setNewMaxChars] = useState("");
  const [newMinChars, setNewMinChars] = useState("");

  const supabase = createClient();
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCompanyId(user.id);
      const { data } = await supabase.from('company_settings').select('custom_fields').eq('company_id', user.id).single();
      if (data && data.custom_fields) setFields(data.custom_fields);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const saveToDb = async (updatedFields: any[]) => {
    setSaving(true);
    await supabase.from('company_settings').update({ custom_fields: updatedFields }).eq('company_id', companyId);
    setFields(updatedFields);
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    if (newType === "dropdown" && dropdownOptions.length === 0) return alert("Please add at least one dropdown option.");
    if (newType === "file" && allowedExtensions.length === 0) return alert("Please select at least one allowed file extension.");
    if ((newType === "text" || newType === "number") && (!newMaxChars || isNaN(Number(newMaxChars)) || Number(newMaxChars) <= 0)) {
      return alert("Please specify a valid Maximum Characters limit for this field.");
    }

    const newField: any = { 
      id: newLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36),
      label: newLabel.trim(), 
      type: newType, 
      required: newRequired 
    };

    if (newType === "dropdown") {
      newField.options = dropdownOptions;
    } else if (newType === "text") {
      newField.textCase = textCase;
      newField.allowSpecialChars = allowSpecialChars;
      newField.allowNumbers = allowNumbers;
      newField.allowSpaces = allowSpaces;
      newField.maxChars = parseInt(newMaxChars);
      if (newMinChars && !isNaN(Number(newMinChars))) newField.minChars = parseInt(newMinChars);
    } else if (newType === "number") {
      newField.maxChars = parseInt(newMaxChars);
      if (newMinChars && !isNaN(Number(newMinChars))) newField.minChars = parseInt(newMinChars);
    } else if (newType === "file") {
      newField.allowedExtensions = allowedExtensions;
    }

    const newArr = [...fields, newField];
    await saveToDb(newArr);
    
    setAdding(false);
    setNewLabel("");
    setNewType("text");
    setNewRequired(false);
    setDropdownOptions([]);
    setNewOption("");
    setTextCase("hybrid");
    setAllowSpecialChars(true);
    setAllowNumbers(true);
    setAllowSpaces(true);
    setAllowedExtensions(['pdf', 'jpg', 'png']);
    setNewMaxChars("");
    setNewMinChars("");
  };

  const handleRemove = async (id: string) => {
    const newArr = fields.filter(f => f.id !== id);
    await saveToDb(newArr);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setActive?.('admin_employees')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500">
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Custom Profile & Form Fields</h2>
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="animate-pulse bg-gray-100 dark:bg-[#1C1C22] h-20 rounded-2xl w-full"></div>
        ) : (
          <>
            <div className="space-y-3">
              {fields.map(f => (
                <FieldContainer key={f.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">{f.label}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">{f.type}</span>
                      {f.required && <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 px-2 py-0.5 rounded-md">Required</span>}
                    </div>
                  </div>
                  <button onClick={() => handleRemove(f.id)} disabled={saving} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </FieldContainer>
              ))}
              {fields.length === 0 && !adding && (
                <div className="text-center py-10 bg-[#F2F2F7] dark:bg-[#1C1C22] rounded-[16px] border border-dashed border-gray-300 dark:border-white/10">
                  <p className="text-[#007AFF] font-bold text-[14px]">No custom fields added yet.</p>
                  <p className="text-gray-500 text-[12px] mt-1">Start customizing your employee profiles.</p>
                </div>
              )}
            </div>

            {adding ? (
              <div className="p-5 border border-gray-200 dark:border-[#2C2C35] rounded-[16px] bg-white dark:bg-[#1C2A3A] space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 mb-2">Field Label *</label>
                  <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} maxLength={20} placeholder="e.g. T-Shirt Size (Max 20 chars)" className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[10px] text-[13px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-500 mb-2">Input Type</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[10px] text-[13px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all font-medium appearance-none">
                      <option value="text">Short Text</option>
                      <option value="dropdown">Dropdown Options</option>
                      <option value="date">Date</option>
                      <option value="number">Number</option>
                      <option value="file">File Upload</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-3 bg-[#F2F2F7] dark:bg-[#2C2C35] w-full px-4 pt-3 rounded-[10px]">
                      <input type="checkbox" checked={newRequired} onChange={e => setNewRequired(e.target.checked)} className="rounded border-[#007AFF] text-[#007AFF] focus:ring-[#007AFF]/50 h-4 w-4" />
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white">Required Field</span>
                    </label>
                  </div>
                </div>

                {newType === "file" && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                    <label className="block text-[12px] font-semibold text-gray-500 mb-3">Allowed File Extensions</label>
                    <div className="flex flex-wrap gap-3">
                      {['pdf', 'jpg', 'png', 'docx', 'xlsx', 'csv'].map(ext => (
                        <label key={ext} className="flex items-center gap-2 cursor-pointer p-2 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[8px]">
                          <input 
                            type="checkbox" 
                            checked={allowedExtensions.includes(ext)} 
                            onChange={e => {
                              if (e.target.checked) setAllowedExtensions([...allowedExtensions, ext]);
                              else setAllowedExtensions(allowedExtensions.filter(x => x !== ext));
                            }} 
                            className="rounded border-[#007AFF] text-[#007AFF] focus:ring-[#007AFF]/50 h-3.5 w-3.5 bg-white" 
                          />
                          <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 uppercase">.{ext}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {newType === "dropdown" && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                    <label className="block text-[12px] font-semibold text-gray-500 mb-2">Dropdown Options</label>
                    <div className="flex items-center gap-2 mb-3">
                      <input 
                        type="text" 
                        value={newOption} 
                        onChange={e => setNewOption(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newOption.trim() && !dropdownOptions.includes(newOption.trim())) {
                              setDropdownOptions([...dropdownOptions, newOption.trim()]);
                              setNewOption("");
                            }
                          }
                        }}
                        placeholder="Enter property option..." 
                        className="flex-1 px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[10px] text-[13px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all font-medium" 
                      />
                      <button 
                        onClick={() => {
                          if (newOption.trim() && !dropdownOptions.includes(newOption.trim())) {
                            setDropdownOptions([...dropdownOptions, newOption.trim()]);
                            setNewOption("");
                          }
                        }}
                        className="px-4 py-3 bg-[#007AFF]/10 text-[#007AFF] font-bold text-[13px] rounded-[10px] hover:bg-[#007AFF]/20 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {dropdownOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dropdownOptions.map(opt => (
                          <div key={opt} className="flex items-center gap-1.5 bg-[#F2F2F7] dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                            {opt}
                            <button onClick={() => setDropdownOptions(options => options.filter(o => o !== opt))} className="text-gray-400 hover:text-red-500 ml-1">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(newType === "text" || newType === "number") && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                    <label className="block text-[12px] font-semibold text-gray-500 mb-3">Length Constraints</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Maximum Characters *</p>
                        <input type="number" value={newMaxChars} onChange={e => setNewMaxChars(e.target.value)} placeholder="e.g. 50" className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[10px] text-[13px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all font-medium" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Minimum Characters</p>
                        <input type="number" value={newMinChars} onChange={e => setNewMinChars(e.target.value)} placeholder="Optional" className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[10px] text-[13px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all font-medium" />
                      </div>
                    </div>
                  </div>
                )}

                {newType === "text" && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                    <label className="block text-[12px] font-semibold text-gray-500 mb-3">Text Validation Rules</label>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Letter Casing</p>
                        <select value={textCase} onChange={e => setTextCase(e.target.value)} className="w-full px-3 py-2 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[8px] text-[12px] text-gray-900 dark:text-white outline-none font-medium appearance-none">
                          <option value="caps">All Caps (UPPERCASE)</option>
                          <option value="small">All Small (lowercase)</option>
                          <option value="hybrid">Hybrid (Mixed Case)</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Allowed Characters</p>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 cursor-pointer p-2 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[8px]">
                        <input type="checkbox" checked={allowSpaces} onChange={e => setAllowSpaces(e.target.checked)} className="rounded border-[#007AFF] text-[#007AFF] focus:ring-[#007AFF]/50 h-3.5 w-3.5 bg-white" />
                        <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Allow Spaces</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[8px]">
                        <input type="checkbox" checked={allowNumbers} onChange={e => setAllowNumbers(e.target.checked)} className="rounded border-[#007AFF] text-[#007AFF] focus:ring-[#007AFF]/50 h-3.5 w-3.5 bg-white" />
                        <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Allow Numbers</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C35] rounded-[8px]">
                        <input type="checkbox" checked={allowSpecialChars} onChange={e => setAllowSpecialChars(e.target.checked)} className="rounded border-[#007AFF] text-[#007AFF] focus:ring-[#007AFF]/50 h-3.5 w-3.5 bg-white" />
                        <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Allow Special Characters</span>
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleAdd} disabled={saving} className="flex-1 py-3 bg-[#007AFF] text-white text-[13px] font-bold rounded-[10px] hover:bg-[#0062CC] transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Field'}
                  </button>
                  <button onClick={() => setAdding(false)} disabled={saving} className="flex-1 py-3 bg-[#F2F2F7] dark:bg-[#2C2C35] text-gray-600 dark:text-gray-300 text-[13px] font-semibold rounded-[10px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} className="flex items-center justify-center gap-2 w-full py-4 text-[#007AFF] bg-[#007AFF]/5 hover:bg-[#007AFF]/10 border border-transparent hover:border-[#007AFF]/20 border-dashed rounded-[16px] transition-all font-bold text-[14px]">
                <span>+ Create New Custom Field</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AdminDesignationsSection({ setActive }: any) {
  const [companyRoles, setCompanyRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newRoleSaving, setNewRoleSaving] = useState(false);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleEmployees, setRoleEmployees] = useState<any[]>([]);
  const [loadingRoleEmployees, setLoadingRoleEmployees] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleSaving, setEditRoleSaving] = useState(false);

  const loadRoles = async () => {
    setLoadingRoles(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const [
      { data: employees },
      { data: comp }
    ] = await Promise.all([
      supabase.from("employees").select("role").eq("company_id", user.id),
      supabase.from("company_settings").select("custom_roles").eq("company_id", user.id).maybeSingle()
    ]);

    const counts: Record<string, number> = {};
    employees?.forEach((e: any) => {
      const r = e.role || "Employee";
      counts[r] = (counts[r] || 0) + 1;
    });

    const appRoleNames = ["Super Admin", "Admin", "Sub Admin", "Employee"];
    const dbCustomRoles = (comp?.custom_roles || []) as string[];
    
    const compRolesMap = new Map();
    dbCustomRoles.forEach(r => compRolesMap.set(r, 0));
    
    Object.entries(counts).forEach(([r, count]) => {
      if (!appRoleNames.includes(r)) {
        compRolesMap.set(r, Number(count));
      }
    });
    
    const arr = Array.from(compRolesMap.entries()).map(([label, users]) => ({
      id: label,
      label,
      desc: "Custom organizational designation.",
      users
    }));
    setCompanyRoles(arr);
    setLoadingRoles(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateRole = async () => {
    if (!newRole.trim()) return;
    setNewRoleSaving(true);
    try {
       const supabase = createClient();
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         const { data: comp, error: fetchErr } = await supabase.from("company_settings").select("custom_roles").eq("company_id", user.id).maybeSingle();
         if (fetchErr) throw fetchErr;

         const existing = comp?.custom_roles || [];
         if (!existing.includes(newRole.trim())) {
           const { error: updateErr } = await supabase.from("company_settings").update({ custom_roles: [...existing, newRole.trim()] }).eq("company_id", user.id);
           if (updateErr) throw updateErr;

           setCompanyRoles(prev => [...prev, { id: newRole.trim(), label: newRole.trim(), desc: "Custom organizational designation.", users: 0 }]);
         }
       }
       setShowModal(false);
       setNewRole("");
    } catch (e: any) {
       console.error("Error creating designation", e);
       alert("Failed to create designation. Ensure your database is updated (custom_roles column). Error: " + e?.message);
    } finally {
       setNewRoleSaving(false);
    }
  };

  const loadRoleEmployees = async (roleName: string) => {
    setLoadingRoleEmployees(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("employees").select("id, name, email, departments!employees_department_id_fkey(name)").eq("company_id", user.id).eq("role", roleName);
      setRoleEmployees(data || []);
    }
    setLoadingRoleEmployees(false);
  };

  const openDetail = (roleName: string) => {
    setSelectedRole(roleName);
    loadRoleEmployees(roleName);
  };

  const handleEditRole = async () => {
    if (!editRoleName.trim() || !selectedRole) return;
    if (editRoleName.trim() === selectedRole) {
      setShowEditModal(false);
      return;
    }
    setEditRoleSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: comp, error: fetchErr } = await supabase.from("company_settings").select("custom_roles").eq("company_id", user.id).maybeSingle();
      if (fetchErr) throw fetchErr;

      let existing = (comp?.custom_roles || []) as string[];
      if (existing.includes(editRoleName.trim())) {
         alert("This designation already exists.");
         setEditRoleSaving(false);
         return;
      }

      // Replace old role name directly into the array at old index
      const newRolesArray = existing.map(r => r === selectedRole ? editRoleName.trim() : r);
      
      const { error: updateErr } = await supabase.from("company_settings").update({ custom_roles: newRolesArray }).eq("company_id", user.id);
      if (updateErr) throw updateErr;

      // Cascade update to employees. Update any employee with the old role text.
      const { error: empErr } = await supabase.from("employees").update({ role: editRoleName.trim() }).eq("company_id", user.id).eq("role", selectedRole);
      if (empErr) throw empErr;

      setSelectedRole(editRoleName.trim());
      setShowEditModal(false);
      loadRoles(); // Refresh the list numbers
    } catch (e: any) {
      console.error("Error updating designation", e);
      alert("Failed to update designation. Error: " + e?.message);
    } finally {
      setEditRoleSaving(false);
    }
  };


  if (selectedRole) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedRole(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">{selectedRole}</h2>
              <p className="text-[13px] text-gray-500 font-medium">Custom Designation</p>
            </div>
          </div>
          <button onClick={() => { setEditRoleName(selectedRole); setShowEditModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#2C2C35] text-gray-700 dark:text-gray-300 text-[13px] font-bold rounded-[10px] hover:bg-gray-200 dark:hover:bg-[#3A3A41] transition-colors">
             Rename
          </button>
        </div>

        <div>
          <SectionLabel>Assigned Employees</SectionLabel>
          <div className="flex flex-col gap-3">
            {loadingRoleEmployees ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
              </div>
            ) : roleEmployees.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-[#121217] border border-transparent dark:border-white/5 rounded-[16px]">
                <p className="text-[14px] text-gray-500 font-medium">No employees currently hold this designation.</p>
              </div>
            ) : (
              roleEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1C1C22] border border-[#E5E7EB] dark:border-[#2A2A31] rounded-[16px] shadow-sm">
                  <div className="h-10 w-10 shrink-0 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[14px] flex items-center justify-center rounded-full">
                    {emp.name?.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">{emp.name}</h4>
                    <p className="text-[13px] text-gray-500 mt-0.5">{emp.email} • {emp.departments?.name || "No Department"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#1C1C22] rounded-[24px] p-6 w-full max-w-[360px] shadow-2xl border border-transparent dark:border-[#2A2A31] animate-in zoom-in-95 duration-200">
              <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-2">Rename Designation</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Enter the new designation name. This will automatically update all assigned employees.
              </p>
              <div className="mb-6">
                <input 
                  type="text" 
                  value={editRoleName} 
                  onChange={e => setEditRoleName(e.target.value)} 
                  className="w-full px-4 py-3 bg-[#F8F9FA] dark:bg-[#121217] border border-transparent focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 rounded-[14px] text-[14px] text-gray-900 dark:text-white font-medium focus:outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleEditRole} disabled={editRoleSaving || !editRoleName.trim()} className="w-full py-3 bg-[#007AFF] text-white rounded-[14px] font-bold text-[14px] hover:bg-[#0062CC] transition-colors disabled:opacity-50">
                  {editRoleSaving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setShowEditModal(false)} disabled={editRoleSaving} className="w-full py-3 text-gray-500 rounded-[14px] font-bold text-[13px] hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl relative animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setActive?.('admin_employees')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Designation</h2>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <SectionLabel>Designations List</SectionLabel>
          <div className="flex flex-col gap-3">
            {loadingRoles ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
              </div>
            ) : companyRoles.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-[#121217] border border-transparent dark:border-white/5 rounded-[16px]">
                <p className="text-[13px] text-gray-500 font-medium">No custom designations created yet.</p>
              </div>
            ) : companyRoles.map((role) => (
              <FieldContainer key={role.id} onClick={() => openDetail(role.id)} className="flex items-center justify-between cursor-pointer group">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-gray-900 dark:text-white group-hover:text-[#007AFF] transition-colors">{role.label}</p>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-[11px] font-bold text-gray-500 rounded-md whitespace-nowrap">{role.users} Users</span>
                  </div>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">{role.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#007AFF] transition-colors shrink-0" />
              </FieldContainer>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#007AFF]/10 text-[#007AFF] text-[13px] font-bold rounded-[10px] hover:bg-[#007AFF]/15 transition-colors border border-[#007AFF]/20 w-fit">
            <Plus className="h-4 w-4" />
            Create Custom Designation
          </button>
        </div>
      </div>

      {/* Create Designation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1C1C22] rounded-[24px] p-6 w-full max-w-[360px] shadow-2xl border border-transparent dark:border-[#2A2A31] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-2">Create Custom Designation</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Define a new organizational designation for your company directory.
            </p>
            <div className="mb-6">
              <label className="block text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-0.5">Designation Name</label>
              <input 
                type="text" 
                value={newRole} 
                onChange={e => setNewRole(e.target.value)} 
                placeholder="e.g. Intern, Contractor, Engineer" 
                className="w-full px-4 py-3 bg-[#F8F9FA] dark:bg-[#121217] border border-transparent focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 rounded-[14px] text-[14px] text-gray-900 dark:text-white font-medium placeholder:text-gray-400 focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleCreateRole} disabled={newRoleSaving || !newRole.trim()} className="w-full py-3 bg-[#007AFF] text-white rounded-[14px] font-bold text-[14px] hover:bg-[#0062CC] transition-colors disabled:opacity-50">
                {newRoleSaving ? "Creating..." : "Create Designation"}
              </button>
              <button onClick={() => { setShowModal(false); setNewRole(""); }} disabled={newRoleSaving} className="w-full py-3 text-gray-500 rounded-[14px] font-bold text-[13px] hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionComponents: Record<string, React.ComponentType<any>> = {
  profile:       ProfileSection,
  notifications: NotificationsSection,
  security:      SecuritySection,
  appearance:    AppearanceSection,
  language:      LanguageSection,
  billing:       BillingSection,
  privacy:       PrivacySection,
  messages_settings: MessagesSettingsSection,
  admin_employees: AdminEmployeesSection,
  admin_company: AdminCompanySection,
  admin_depts: AdminDeptsSection,
  admin_roles: AdminRolesSection,
  admin_approvals: AdminApprovalsSection,
  admin_cloud: AdminCloudSection,
  admin_attendance: AdminAttendanceSection,
  admin_payroll: AdminPayrollSection,
  admin_payroll_company: CompanyPayrollSettingsPage,
  admin_payroll_attendance: AttendanceIntegrationPage,
  admin_payroll_payslip: PayslipSettingsPage,
  admin_payroll_approval: ApprovalFlowSettingsPage,
  admin_logs: AdminLogsSection,
  admin_messages: AdminMessagesSection,
  admin_credentials: AdminCredentialsSection,
  admin_custom_fields: AdminCustomFieldsSection,

  help_support: HelpSupportSection,
  feedback: FeedbackSection,
};

export default function SettingsPage() {
  const [active, setActive] = useState("profile");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActive(tab);
  }, [searchParams]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    }
    loadUser();
  }, [supabase]);

  const renderSection = () => {
    const ActiveComp = sectionComponents[active] as any;
    if (ActiveComp) return <ActiveComp setActive={setActive} />;
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 pt-20">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Settings className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
        <p className="text-[14px] text-gray-500 max-w-[280px]">
          This settings section is currently under development.
        </p>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#0B0B0F] rounded-[24px] overflow-hidden">

      {/* Header Container */}
      <div className="px-6 pt-6 pb-6 w-full flex items-center justify-between shrink-0">
        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Settings</h1>
      </div>

      <main className="flex-1 px-6 pb-6 w-full flex flex-col md:flex-row overflow-hidden">

        {/* Left Nav */}
        <div className="w-full md:w-[340px] shrink-0 flex flex-col pt-2 md:mb-0 overflow-y-auto page-scrollbar mb-6 pr-6">
          
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search settings..." 
              className="w-full bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-[14px] font-medium rounded-[12px] py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
          </div>

          <div className="mb-6">
             <div className="bg-[#F8F9FA] dark:bg-[#121217] rounded-[16px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-[#E5E7EB] dark:border-white/5 transition-colors relative group flex flex-col">
                <div className="flex items-center gap-1.5 mb-2">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src="/DortAsiaLogo.svg" alt="DortAsia" className="h-7 w-auto object-contain" />
                </div>
                <h3 className="text-[20px] font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">
                   Company Management
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-5">
                   Manage your workspace identity, company information, and global directory settings.
                </p>
                <div className="flex flex-col gap-1 mb-5">
                   <div className="flex items-center gap-3.5 group/link cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 py-2.5 px-4 -mx-4 rounded-xl transition-colors" onClick={() => setActive("admin_company")}>
                      <Briefcase className="h-[20px] w-[20px] text-gray-500 group-hover/link:text-gray-900 dark:group-hover/link:text-white transition-colors" strokeWidth={1.5} />
                      <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300 group-hover/link:text-gray-900 dark:group-hover/link:text-white transition-colors">Company Profile</span>
                   </div>
                   <div className="flex items-center gap-3.5 group/link cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 py-2.5 px-4 -mx-4 rounded-xl transition-colors" onClick={() => setActive("billing")}>
                      <CreditCard className="h-[20px] w-[20px] text-gray-500 group-hover/link:text-gray-900 dark:group-hover/link:text-white transition-colors" strokeWidth={1.5} />
                      <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300 group-hover/link:text-gray-900 dark:group-hover/link:text-white transition-colors">Subscriptions</span>
                   </div>
                </div>
                <div className="text-[13px] font-semibold text-[#007AFF] hover:underline cursor-pointer transition-colors" onClick={() => setActive("profile")}>
                   See more in Company Profile
                </div>
             </div>
          </div>
          {(() => {
            const NavItem = ({ id, label, svgSrc, Icon }: { id: string; label: string; svgSrc?: string; Icon?: React.ElementType }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[12px] text-left transition-all ${
                  active === id
                    ? "bg-[#EEF4FF] dark:bg-[#0A84FF]/15 text-[#007AFF]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-[#F8F9FA] dark:hover:bg-[#121217]"
                }`}
              >
                {svgSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={svgSrc}
                    alt={label}
                    className={`h-[20px] w-[20px] shrink-0 object-contain ${active === id ? '' : 'opacity-60 dark:invert'}`}
                  />
                ) : Icon ? (
                  <Icon className={`h-[20px] w-[20px] shrink-0 ${active === id ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400"}`} strokeWidth={active === id ? 2.5 : 1.75} />
                ) : null}
                <span className={`text-[14px] ${active === id ? "font-semibold text-[#007AFF]" : "font-medium"} truncate`}>{label}</span>
              </button>
            );

            return (
              <>
                {/* ── Your Preferences ── */}
                <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase px-2 mb-2 mt-2">Your Preferences</h4>
                <div className="flex flex-col gap-0.5 mb-6">
                  <NavItem id="profile" label="Edit Your Profile" svgSrc="/Icons/Employees.svg" />
                </div>

                {/* ── Company ── */}
                <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase px-2 mb-2">Company</h4>
                <div className="flex flex-col gap-0.5 mb-6">
                  <NavItem id="admin_employees" label="Employee Settings"    svgSrc="/Icons/Employees.svg" />
                  <NavItem id="admin_depts"     label="Department Settings"  svgSrc="/Icons/Company.svg" />
                  <NavItem id="admin_attendance" label="Attendance Settings" svgSrc="/Icons/Attendance.svg" />
                  <NavItem id="admin_payroll"   label="Payroll Settings"     svgSrc="/Icons/Payroll.svg" />
                  <NavItem id="admin_financial" label="Financial Settings"   svgSrc="/Icons/Finance.svg" />
                  <NavItem id="admin_logs"      label="Log Settings"         svgSrc="/Icons/LogHistories.svg" />
                  <NavItem id="admin_projects"  label="Project Settings"     svgSrc="/Icons/Projects.svg" />
                </div>

                {/* ── App Settings ── */}
                <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase px-2 mb-2">App Settings</h4>
                <div className="flex flex-col gap-0.5">
                  <NavItem id="admin_roles"       label="Roles and Access"  Icon={Key} />
                  <NavItem id="admin_cloud"       label="Storage Settings"  svgSrc="/Icons/YourCloud.svg" />
                  <NavItem id="notifications"     label="Notifications"     Icon={Bell} />
                  <NavItem id="admin_credentials" label="User Credentials"  Icon={Lock} />
                  <NavItem id="appearance"        label="Appearance"        Icon={Palette} />
                  <NavItem id="privacy"           label="Account & Privacy" Icon={Shield} />
                  <NavItem id="feedback"          label="Feedback"          Icon={MessageSquareHeart} />
                </div>
              </>
            );
          })()}

        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0 pt-2 pb-12 md:pl-8 lg:pl-12 md:border-l border-[#F1F3F5] dark:border-white/5 overflow-y-auto page-scrollbar pr-2">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
