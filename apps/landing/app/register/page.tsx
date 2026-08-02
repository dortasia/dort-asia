"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Minus, X, Check, Undo2 } from "lucide-react";
import Cropper from "react-easy-crop";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/auth-layout";
import otpIllust from "@/public/OTPVectorArt.svg";
import profileIllust from "@/public/ProfileUpdatePage.svg";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { createClient } from "@/utils/supabase/client";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const GOOGLE_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#9C27B0', '#00BCD4', '#FF9800', '#FF5722'];
const getAvatarColor = (name: string) => {
  if (!name) return GOOGLE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GOOGLE_COLORS[Math.abs(hash) % GOOGLE_COLORS.length];
};

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"signup" | "otp" | "company_details" | "profile">("signup");
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Signup State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempt, setResendAttempt] = useState(0);

  const clearPendingFlow = () => {
    localStorage.removeItem("dort_pending_flow");
    localStorage.removeItem("dort_pending_step");
    localStorage.removeItem("dort_pending_method");
    localStorage.removeItem("dort_pending_mobile");
    localStorage.removeItem("dort_pending_email");
    localStorage.removeItem("dort_pending_first_name");
    localStorage.removeItem("dort_pending_last_name");
    localStorage.removeItem("dort_pending_company_name");
  };

  // State Restoration & Cross-Redirects
  useEffect(() => {
    const pendingFlow = localStorage.getItem("dort_pending_flow");
    if (pendingFlow === "login") {
      router.replace("/login");
      return;
    }

    if (pendingFlow === "register") {
      const pendingStep = localStorage.getItem("dort_pending_step") as any;
      if (pendingStep === "otp" || pendingStep === "company_details" || pendingStep === "profile") {
        const storedFirstName = localStorage.getItem("dort_pending_first_name") || "";
        const storedLastName = localStorage.getItem("dort_pending_last_name") || "";
        const storedCompanyName = localStorage.getItem("dort_pending_company_name") || "";
        const storedEmail = localStorage.getItem("dort_pending_email") || "";
        const storedMobile = localStorage.getItem("dort_pending_mobile") || "";

        if (storedFirstName) setFirstName(storedFirstName);
        if (storedLastName) setLastName(storedLastName);
        if (storedCompanyName) setCompanyName(storedCompanyName);
        if (storedEmail) setEmail(storedEmail);
        if (storedMobile) setMobile(storedMobile);

        setStep(pendingStep);

        if (!storedFirstName) {
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
              const meta = data.user.user_metadata;
              const nameStr = meta?.full_name || meta?.name || "";
              if (nameStr) {
                const parts = nameStr.trim().split(/\s+/);
                setFirstName(meta.first_name || parts[0] || "");
                setLastName(meta.last_name || parts.slice(1).join(' ') || "");
              } else if (data.user.email) {
                setFirstName(data.user.email.split('@')[0]);
              }
              if (!storedEmail && data.user.email) setEmail(data.user.email);
              
              const avatar = meta?.avatar_url || meta?.picture;
              if (avatar) setSsoAvatarUrl(avatar);
            }
          });
        }
      }
    }
  }, [router]);

  // Save profile updates to localStorage in real time
  useEffect(() => {
    if (step === "profile") {
      localStorage.setItem("dort_pending_first_name", firstName);
      localStorage.setItem("dort_pending_last_name", lastName);
      localStorage.setItem("dort_pending_company_name", companyName);
    }
  }, [firstName, lastName, companyName, step]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendTimer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Profile State
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [ssoAvatarUrl, setSsoAvatarUrl] = useState<string | null>(null);
  const [showSsoPrompt, setShowSsoPrompt] = useState(false);
  const [ssoAvatarAsProfile, setSsoAvatarAsProfile] = useState(true);
  const [ssoAvatarAsLogo, setSsoAvatarAsLogo] = useState(false);
  
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (step === "profile" && ssoAvatarUrl && !localStorage.getItem("dort_sso_prompt_shown")) {
      setShowSsoPrompt(true);
    }
  }, [step, ssoAvatarUrl]);

  const profileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropType, setCropType] = useState<"profile" | "logo" | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropTemplateImage, setCropTemplateImage] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 });
  
  const cropContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cropModalOpen && cropContainerRef.current) {
      const el = cropContainerRef.current;
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
           setCropSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [cropModalOpen, cropImageSrc]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg("");
    setSuccessMsg("");

    // 1. Name validation (should already be handled by input restriction, but good for backup)
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      setErrorMsg("First and Last Name should not contain numbers or special characters.");
      return;
    }

    // 2. Mobile validation (Exactly 8 digits)
    if (mobile.length !== 8) {
      setErrorMsg("Mobile number must be exactly 8 digits.");
      return;
    }

    // 3. Email validation (basic)
    if (!email.includes("@") || !email.includes(".")) {
      setErrorMsg("Please enter a valid company email address.");
      return;
    }

    // 4. Password validation
    const hasCap = /[A-Z]/.test(password);
    const hasSmall = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasCap || !hasSmall || !hasNum || !hasSpecial) {
      setErrorMsg("Password must contain: at least one capital letter, one small letter, one number, and one special character.");
      return;
    }

    // Should not contain personal info (case insensitive)
    const lowerPass = password.toLowerCase();
    const blacklistInfo = [firstName, lastName, companyName, mobile, email].filter(info => info && info.length >= 3);
    for (const info of blacklistInfo) {
      if (lowerPass.includes(info.toLowerCase())) {
        setErrorMsg("Due to Security Concerns The Password Contains your Registered Name, Email, Mobile no and Email is not Allowed");
        return;
      }
    }

    // Blacklist "admin"
    if (lowerPass.includes("admin")) {
      setErrorMsg("Password is Too Weak, Try Another");
      return;
    }

    // 5. Confirm password
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    // 6. Terms and Conditions validation
    if (!acceptTerms) {
      setErrorMsg("You must agree to the Terms and Conditions to continue.");
      return;
    }

    // All validations passed — create the account
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            company_name: companyName,
            mobile: `+65${mobile}`,
          },
        },
      });

      if (error) {
        console.error("Supabase signup error:", error);
        let msg = error.message;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        if (!msg || msg === "{}" || msg === "[object Object]") {
          msg = "Signup Failed: " + JSON.stringify(error, null, 2);
        }
        setErrorMsg(msg);
        return;
      }

      // If identities is empty, the email is already registered and confirmed
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMsg("An account with this email already exists. Please sign in.");
        return;
      }

      // Save pending register flow state to localStorage
      localStorage.setItem("dort_pending_flow", "register");
      localStorage.setItem("dort_pending_first_name", firstName);
      localStorage.setItem("dort_pending_last_name", lastName);
      localStorage.setItem("dort_pending_company_name", companyName);
      localStorage.setItem("dort_pending_email", email);
      localStorage.setItem("dort_pending_mobile", mobile);

      if (data.session) {
        // Email confirmations are disabled in Supabase. Skip OTP.
        await fetch("/api/storage/create-company-bucket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            firstName,
            lastName,
            email,
            mobile,
            userId: data.session.user.id,
            avatarBase64: null,
            avatarExt: null,
            companyLogoBase64: null,
            companyLogoExt: null,
            ssoAvatarUrl: null,
            ssoAvatarAsProfile: false,
            ssoAvatarAsLogo: false,
            provider: "email",
            userMetadata: data.session.user.user_metadata
          }),
        });
        clearPendingFlow();
        router.push("/");
      } else {
        localStorage.setItem("dort_pending_step", "otp");
        setSuccessMsg("OTP sent to your email.");
        setStep("otp");
      }
    } catch (err: any) {
      console.error("Signup exception:", err);
      let msg = err.message;
      if (typeof msg === 'object') msg = JSON.stringify(msg);
      if (!msg || msg === "{}" || msg === "[object Object]") {
        msg = "Exception: " + JSON.stringify(err, null, 2);
      }
      setErrorMsg(msg || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Note: createCompanySettings has been removed. The database insertion now occurs securely on the server-side inside /api/storage/create-company-bucket.

  const handleVerifyOtp = async () => {
    if (loading) return;
    setIsResending(false);
    setErrorMsg("");
    setSuccessMsg("");
    const token = otp.join("");
    if (token.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg("Email verified! Finalizing setup...");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch("/api/storage/create-company-bucket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            firstName,
            lastName,
            email,
            mobile,
            userId: user.id,
            avatarBase64: null,
            avatarExt: null,
            companyLogoBase64: null,
            companyLogoExt: null,
            ssoAvatarUrl: null,
            ssoAvatarAsProfile: false,
            ssoAvatarAsLogo: false,
            provider: "email",
            userMetadata: user.user_metadata
          }),
        });
      }

      clearPendingFlow();
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setIsResending(true);
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("A new OTP has been sent to your email.");
        const waitTime = 180 * Math.pow(2, resendAttempt);
        setResendTimer(waitTime);
        setResendAttempt(prev => prev + 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
      setIsResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const pastedNumbers = pastedData.replace(/\D/g, "").slice(0, 6);
    
    if (pastedNumbers) {
      const newOtp = [...otp];
      for (let i = 0; i < newOtp.length; i++) {
        newOtp[i] = pastedNumbers[i] || "";
      }
      setOtp(newOtp);
      
      const focusIndex = Math.min(pastedNumbers.length, 5);
      // Wait for React to re-render, then focus if the pasted string is < 6 length.
      // If length is 6, focus on the last input.
      if (focusIndex < 6) {
        inputRefs[focusIndex === 6 ? 5 : focusIndex].current?.focus();
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "logo") => {
    const file = e.target.files?.[0];
    if (file) {
      setCropType(type);
      setCropImageSrc(URL.createObjectURL(file));
      setCropTemplateImage(file);
      setCropModalOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !cropTemplateImage) return;

    try {
       const image = new window.Image();
       image.src = cropImageSrc;
       await new Promise((resolve) => (image.onload = resolve));
       
       const canvas = document.createElement("canvas");
       canvas.width = croppedAreaPixels.width;
       canvas.height = croppedAreaPixels.height;
       const ctx = canvas.getContext("2d");
       
       if (ctx) {
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
         
         const base64Image = canvas.toDataURL("image/png");
         canvas.toBlob((blob) => {
           if (blob) {
             const croppedFile = new File([blob], cropTemplateImage.name.replace(/\.[^/.]+$/, "") + ".png", { type: "image/png" });
             if (cropType === "profile") {
               setProfilePhoto(croppedFile);
               setProfilePreview(base64Image);
             } else {
               setCompanyLogo(croppedFile);
               setLogoPreview(base64Image);
             }
             setCropModalOpen(false);
             setCropImageSrc(null);
             if (profileRef.current) profileRef.current.value = "";
             if (logoRef.current) logoRef.current.value = "";
           }
         }, "image/png");
       }
    } catch (e) {
      console.error(e);
    }
  };

  const uploadImages = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      // Determine file extensions
      const avatarExt = profilePhoto ? "png" : null;
      const logoExt = companyLogo ? "png" : null;

      const resolvedEmail = email || user.email;
      const resolvedFirstName = firstName || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || "Admin";
      const resolvedLastName = lastName || user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.name?.split(' ').slice(1).join(' ') || "";

      // Call the secure server-side API route to create bucket, upload files, and insert into DB (bypassing RLS)
      const response = await fetch("/api/storage/create-company-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          email: resolvedEmail,
          mobile,
          userId: user.id,
          avatarBase64: profilePreview,
          avatarExt,
          companyLogoBase64: logoPreview,
          companyLogoExt: logoExt,
          ssoAvatarUrl,
          ssoAvatarAsProfile,
          ssoAvatarAsLogo,
          provider: user.app_metadata?.provider || "email",
          userMetadata: user.user_metadata
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMsg(result.error || "Failed to set up company storage and profile.");
        setLoading(false);
        return;
      }

      clearPendingFlow();
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete profile setup. Please try again.");
      setLoading(false);
    }
  };


  if (step === "profile") {
    return (
      <>
        {loading && <FullPageLoader messages={["Finalizing Profile...", "Setting up your workspace...", "Securing details..."]} />}
        <AuthLayout 
        title="Update Profile Photo" 
        subtitle="Update Profile Photo of Yourself & Company's Logo"
        type="register"
        illustration={profileIllust}
        hideBottomText={true}
      >
        <div className="space-y-6 mt-6 w-full max-w-[440px]">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 text-[13px] font-semibold rounded-[12px] text-center">
              {errorMsg}
            </div>
          )}

          <input 
            type="file" 
            accept="image/*" 
            ref={profileRef} 
            onChange={(e) => handleImageChange(e, "profile")} 
            className="hidden" 
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={logoRef} 
            onChange={(e) => handleImageChange(e, "logo")} 
            className="hidden" 
          />

          <motion.div 
            variants={fadeUp}
            onClick={() => { if (!profilePreview) profileRef.current?.click(); }}
            className="group flex items-center gap-6 p-6 bg-[#F8F9FA] rounded-[30px] border border-transparent hover:border-[#007AFF]/10 transition-all cursor-pointer"
          >
            <div className="relative flex-shrink-0">
              <div 
                className="w-[90px] h-[90px] rounded-full flex items-center justify-center overflow-hidden shadow-sm text-white text-[32px] font-normal uppercase"
                style={{ backgroundColor: profilePreview ? "transparent" : ((ssoAvatarUrl && ssoAvatarAsProfile) ? "transparent" : getAvatarColor(firstName || "U")) }}
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (ssoAvatarUrl && ssoAvatarAsProfile) ? (
                  <img src={ssoAvatarUrl} alt="SSO Profile" className="w-full h-full object-cover" />
                ) : (
                  `${(firstName.charAt(0) || "U").toUpperCase()}${(lastName.charAt(0) || "").toUpperCase()}`
                )}
              </div>
              <div 
                className="absolute bottom-0 right-0 w-7 h-7 bg-[#007AFF] rounded-full flex items-center justify-center shadow-sm cursor-pointer z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  profileRef.current?.click();
                }}
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start">
              <h3 className="text-[17px] font-bold text-slate-900 mb-0.5">Your Profile Photo</h3>
              <p className="text-[13px] font-medium text-[#6D6D6D]">Upload Photo of Yourself</p>
              {profilePreview && (
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setProfilePhoto(null); setProfilePreview(null); }} 
                    className="text-[#6D6D6D] text-[13px] font-bold hover:underline"
                  >
                    Use Default
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            variants={fadeUp}
            onClick={() => { if (!logoPreview) logoRef.current?.click(); }}
            className="group flex items-center gap-6 p-6 bg-[#F8F9FA] rounded-[30px] border border-transparent hover:border-[#007AFF]/10 transition-all cursor-pointer"
          >
            <div className="relative flex-shrink-0">
              <div 
                className="w-[90px] h-[90px] rounded-full flex items-center justify-center overflow-hidden shadow-sm text-white text-[32px] font-normal uppercase"
                style={{ backgroundColor: logoPreview ? "transparent" : ((ssoAvatarUrl && ssoAvatarAsLogo) ? "transparent" : getAvatarColor(companyName || "C")) }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain bg-white" />
                ) : (ssoAvatarUrl && ssoAvatarAsLogo) ? (
                  <img src={ssoAvatarUrl} alt="SSO Logo" className="w-full h-full object-contain bg-white" />
                ) : (
                  (companyName || "C").charAt(0).toUpperCase()
                )}
              </div>
              <div 
                className="absolute bottom-0 right-0 w-7 h-7 bg-[#007AFF] rounded-full flex items-center justify-center shadow-sm cursor-pointer z-10"
                 onClick={(e) => {
                  e.stopPropagation();
                  logoRef.current?.click();
                }}
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start">
              <h3 className="text-[17px] font-bold text-slate-900 mb-0.5">Your Company Logo</h3>
              <p className="text-[13px] font-medium text-[#6D6D6D]">Upload Photo of Your Company</p>
              {logoPreview && (
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCompanyLogo(null); setLogoPreview(null); }} 
                    className="text-[#6D6D6D] text-[13px] font-bold hover:underline"
                  >
                    Use Default
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={() => {
                clearPendingFlow();
                window.location.href = "/";
              }}
              className="text-[18px] font-bold text-[#007AFF] hover:underline px-4"
              disabled={loading}
            >
              Skip
            </button>
            <motion.button 
              variants={fadeUp}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={uploadImages}
              disabled={loading}
              className="w-[200px] py-[15px] bg-[#007AFF] text-white font-bold rounded-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300 text-[18px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Continue"}
            </motion.button>
          </div>

          <AnimatePresence>
            {showSsoPrompt && ssoAvatarUrl && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white w-full max-w-[400px] rounded-[32px] shadow-2xl p-6 flex flex-col items-center text-center"
                >
                  <img src={ssoAvatarUrl} className="w-20 h-20 rounded-full mb-4 shadow-md object-cover" alt="SSO Profile" />
                  <h3 className="text-[18px] font-bold text-slate-900 mb-2">Use this photo?</h3>
                  <p className="text-[14px] text-slate-500 mb-6">We found your Google profile picture. Where would you like to use it?</p>
                  
                  <div className="flex flex-col gap-3 w-full">
                    <button 
                      onClick={() => { setSsoAvatarAsProfile(true); setSsoAvatarAsLogo(false); setShowSsoPrompt(false); localStorage.setItem("dort_sso_prompt_shown", "true"); }}
                      className="w-full py-3 bg-[#F8F9FA] hover:bg-[#E9ECEF] text-slate-700 font-semibold rounded-[12px] transition-colors"
                    >
                      Use as Your Avatar
                    </button>
                    <button 
                      onClick={() => { setSsoAvatarAsProfile(false); setSsoAvatarAsLogo(true); setShowSsoPrompt(false); localStorage.setItem("dort_sso_prompt_shown", "true"); }}
                      className="w-full py-3 bg-[#F8F9FA] hover:bg-[#E9ECEF] text-slate-700 font-semibold rounded-[12px] transition-colors"
                    >
                      Use as Company Logo
                    </button>
                    <button 
                      onClick={() => { setSsoAvatarAsProfile(true); setSsoAvatarAsLogo(true); setShowSsoPrompt(false); localStorage.setItem("dort_sso_prompt_shown", "true"); }}
                      className="w-full py-3 bg-[#007AFF] hover:bg-blue-600 text-white font-semibold rounded-[12px] transition-colors shadow-md shadow-blue-500/20"
                    >
                      Use for Both
                    </button>
                    <button 
                      onClick={() => { setSsoAvatarAsProfile(false); setSsoAvatarAsLogo(false); setShowSsoPrompt(false); localStorage.setItem("dort_sso_prompt_shown", "true"); }}
                      className="w-full py-2 text-slate-400 hover:text-slate-600 font-medium text-[14px] transition-colors mt-2"
                    >
                      Skip
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {cropModalOpen && cropImageSrc && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
                >
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-slate-900">Adjust Photo</h3>
                    <button 
                      onClick={() => setCropModalOpen(false)} 
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative w-full aspect-square bg-[#F8F9FA]" ref={cropContainerRef}>
                    {/* @ts-ignore - React 19 typing mismatch with react-easy-crop */}
                    <Cropper
                      image={cropImageSrc}
                      crop={crop}
                      zoom={zoom}
                      maxZoom={10}
                      aspect={1}
                      cropShape={"round"}
                      cropSize={cropSize.width > 0 ? cropSize : undefined}
                      showGrid={false}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      style={{
                        containerStyle: { background: "transparent" },
                        cropAreaStyle: { border: "2px solid #007AFF", boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.5)" }
                      }}
                    />
                    <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-10">
                      <button 
                        onClick={() => setZoom(z => Math.min(z + 0.5, 10))} 
                        className="w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-slate-50 transition border border-slate-100 text-slate-700"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setZoom(z => Math.max(z - 0.5, 1))} 
                        className="w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-slate-50 transition border border-slate-100 text-slate-700"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="px-6 py-5 bg-white border-t border-slate-100 flex items-center justify-between">
                    <button 
                      onClick={() => setCropModalOpen(false)}
                      className="px-4 py-2.5 text-[15px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </AuthLayout>
      </>
    );
  }

  if (step === "company_details") {
    return (
      <>
        {loading && <FullPageLoader messages={["Preparing setup...", "Loading preferences..."]} />}
        <AuthLayout 
          title="Company Details" 
          subtitle="Tell us about your company"
          type="register"
          hideBottomText={true}
        >
          <div className="space-y-6 mt-4 max-w-[440px] w-full">
            {errorMsg && (
              <motion.div variants={fadeUp} className="p-3 bg-red-50 text-red-600 border border-red-200 text-[13px] font-semibold rounded-[12px] text-center">
                {errorMsg}
              </motion.div>
            )}

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              if (!companyName) {
                setErrorMsg("Company Name is required.");
                return;
              }
              setErrorMsg("");
              localStorage.setItem("dort_pending_company_name", companyName);
              localStorage.setItem("dort_pending_mobile", mobile);
              localStorage.setItem("dort_pending_step", "profile");
              setStep("profile");
            }}>
              <motion.div variants={fadeUp}>
                 <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
                  placeholder="Company Name"
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                 <input 
                  type="text" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
                  placeholder="Mobile Number (Optional)"
                />
              </motion.div>
              <motion.button 
                variants={fadeUp}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full py-[15px] bg-[#007AFF] text-white font-bold rounded-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300 text-[16px] mt-2"
              >
                Continue to Profile Setup
              </motion.button>
            </form>
          </div>
        </AuthLayout>
      </>
    );
  }

  if (step === "otp") {
    return (
      <>
        {loading && <FullPageLoader messages={isResending ? ["Resending OTP...", "Generating a new secure code...", "Sending email..."] : ["Verifying OTP...", "Validating information...", "Securing connection..."]} />}
        <AuthLayout 
        title="Enter Your OTP" 
        subtitle="Verify Your Details"
        type="register"
        illustration={otpIllust}
        hideBottomText={true}
      >
        <div className="space-y-8 mt-6 w-full max-w-[440px]">
          {errorMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-red-50 text-red-600 border border-red-200 text-[13px] font-semibold rounded-[12px] text-center">
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-green-50 text-green-600 border border-green-200 text-[13px] font-semibold rounded-[12px] text-center">
              {successMsg}
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="text-center">
            <p className="text-[17px] text-[#6D6D6D] font-medium block">
              OTP Sent to your generic email <br />
              <span className="text-[#007AFF] font-bold inline-block mt-1">{email}</span>
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="flex justify-between gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  disabled={loading}
                  className="w-14 h-16 bg-white border border-gray-200 rounded-[18px] text-center text-2xl font-bold text-slate-900 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all placeholder:text-gray-100 disabled:opacity-50"
                  placeholder="0"
                />
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-between px-1">
             <button 
               type="button"
               onClick={() => {
                 setErrorMsg("");
                 setSuccessMsg("");
                 setStep("signup");
                 localStorage.setItem("dort_pending_step", "signup");
               }}
               disabled={loading}
               className="text-[16px] font-normal text-[#007AFF] hover:underline disabled:opacity-50"
             >
               Edit Details
             </button>
             <button 
               type="button"
               onClick={handleResendOtp}
               disabled={loading || resendTimer > 0} 
               className={`text-[16px] font-normal transition-colors ${resendTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-[#007AFF] hover:underline"}`}
             >
               {resendTimer > 0 ? `Resend OTP (${formatTimer(resendTimer)})` : "Resend OTP"}
             </button>
          </motion.div>

          <motion.button 
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full py-[15px] bg-[#007AFF] text-white font-bold rounded-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300 text-[18px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Verify
          </motion.button>
        </div>
      </AuthLayout>
      </>
    );
  }

  // default "signup" step
  return (
    <>
      {loading && <FullPageLoader messages={["Creating account...", "Saving your details..."]} />}
      <AuthLayout 
        title="Hello, User" 
      subtitle="Provide Details to get in"
      type="register"
    >
      <div className="space-y-6 mt-4">
        {errorMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-[12px] text-center">
              {errorMsg}
            </motion.div>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={fadeUp}>
               <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                
                className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
                placeholder="First Name"
              />
            </motion.div>
            <motion.div variants={fadeUp}>
               <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                
                className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
                placeholder="Last Name"
              />
            </motion.div>
          </div>

          <motion.div variants={fadeUp}>
            <input 
              type="text" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              
              className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
              placeholder="Company name"
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
              className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
              placeholder="Company Email Address"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="relative group">
            <div className="flex items-center w-full bg-white border border-gray-200 rounded-[18px] focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/5 transition-all overflow-hidden">
              <div className="pl-6 pr-3 border-r border-gray-100 py-[14px] bg-[#F8F9FA] text-[15px] font-bold text-slate-500 flex-shrink-0">
                +65
              </div>
              <input 
                type="tel" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="w-full px-4 py-[14px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none bg-transparent"
                placeholder="Mobile Number"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={fadeUp}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                
                className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
                placeholder="Password"
              />
            </motion.div>
            
            <motion.div variants={fadeUp}>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                
                className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
                placeholder="Confirm Password"
              />
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="flex items-center gap-2.5 px-2">
            <input 
              type="checkbox" 
              id="terms" 
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-5 h-5 rounded-[6px] border-gray-300 text-[#007AFF] focus:ring-[#007AFF]/20 cursor-pointer transition-all" 
            />
            <label htmlFor="terms" className="text-[14px] font-medium text-[#6D6D6D] cursor-pointer">
              I agree to the <Link href="#" className="text-[#007AFF] hover:underline font-semibold">Terms and Conditions</Link>
            </label>
          </motion.div>

          <motion.button 
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-[15px] bg-[#007AFF] text-white font-bold rounded-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300 text-[16px] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Continue"}
          </motion.button>
        </form>

        <motion.div variants={fadeUp} className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[13px]">
            <span className="px-3 bg-white text-slate-500 font-medium">or sign in with</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
           <motion.button 
             variants={fadeUp}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => {
               localStorage.setItem("dort_pending_flow", "register");
               localStorage.setItem("dort_pending_step", "company_details");
               supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/register` } });
             }}
             className="flex items-center justify-center gap-3 px-4 py-3 bg-[#F8F9FA] border border-gray-100 rounded-full hover:bg-gray-50 transition-all pointer"
           >
             <svg width="18" height="18" viewBox="0 0 18 18">
               <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.248h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
               <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.248c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
               <path d="M3.964 10.717c-.18-.54-.282-1.117-.282-1.717s.102-1.177.282-1.717V4.951H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.049l3.007-2.332z" fill="#FBBC05"/>
               <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.048.957 4.951l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
             </svg>
             <span className="text-[14px] font-semibold text-slate-700">Google</span>
           </motion.button>

           <motion.button 
             variants={fadeUp}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => {
               localStorage.setItem("dort_pending_flow", "register");
               localStorage.setItem("dort_pending_step", "company_details");
               supabase.auth.signInWithOAuth({ provider: 'azure', options: { redirectTo: `${window.location.origin}/register` } });
             }}
             className="flex items-center justify-center gap-3 px-4 py-3 bg-[#F8F9FA] border border-gray-100 rounded-full hover:bg-gray-50 transition-all"
           >
             <svg width="18" height="18" viewBox="0 0 23 23">
               <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
               <path fill="#f35325" d="M1 1h10v10H1z"/>
               <path fill="#81bc06" d="M12 1h10v10H12z"/>
               <path fill="#05a6f0" d="M1 12h10v10H1z"/>
               <path fill="#ffba08" d="M12 12h10v10H12z"/>
             </svg>
             <span className="text-[14px] font-semibold text-slate-700">Microsoft</span>
           </motion.button>
        </div>
      </div>
    </AuthLayout>
    </>
  );
}
