"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Key01Icon, 
  FingerPrintIcon, 
  Shield01Icon, 
  Layers01Icon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons";
import { Monitor } from "lucide-react";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { TwoFactorModal } from "@/components/auth/TwoFactorModal";
import { ReauthModal } from "@/components/auth/ReauthModal";
import { Disable2FAModal } from "@/components/auth/Disable2FAModal";
import { StepUpMfaModal } from "@/components/auth/StepUpMfaModal";
import { RecoveryCodesModal } from "@/components/auth/RecoveryCodesModal";
import { getRecoveryCodesCount } from "@/app/dashboard/settings/security/recovery-actions";

interface AccountSettingsCache {
  userEmail: string;
  hasEmailPassword: boolean;
  signInProvider: "google" | "email" | "unknown";
  twoFactorEnabled: boolean;
  twoFactorId: string | null;
  passkeys: any[];
  recoveryCodesCount: number;
}

// Module-level cache: persists across internal client navigation, reloads on tab refresh
let cachedAccountSettings: AccountSettingsCache | null = null;

function AccountSettingsSkeleton() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
        {/* 1. Change Password Skeleton */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="h-5 bg-gray-200/80 rounded-md w-40" />
            <div className="h-4 bg-gray-100 rounded-md w-72" />
          </div>
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gray-200/70" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200/70 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-56" />
              </div>
            </div>
            <div className="h-4 bg-gray-200/70 rounded w-28" />
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* 2. Two-Factor & Passkeys Skeleton */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="h-5 bg-gray-200/80 rounded-md w-48" />
            <div className="h-4 bg-gray-100 rounded-md w-80" />
          </div>
          <div className="space-y-4">
            {/* 2FA Row */}
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gray-200/70" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200/70 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-64" />
                </div>
              </div>
              <div className="h-9 w-28 bg-gray-200/70 rounded-full" />
            </div>
            {/* Passkey Row */}
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gray-200/70" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200/70 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-60" />
                </div>
              </div>
              <div className="h-9 w-28 bg-gray-200/70 rounded-full" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* 3. Sign-in Method Skeleton */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="h-5 bg-gray-200/80 rounded-md w-36" />
            <div className="h-4 bg-gray-100 rounded-md w-72" />
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-100 rounded w-48 mb-2" />
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gray-200/70" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200/70 rounded w-28" />
                  <div className="h-3 bg-gray-100 rounded w-44" />
                  <div className="h-3 bg-gray-200/70 rounded w-36" />
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-200/70 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    cachedAccountSettings ? cachedAccountSettings.twoFactorEnabled : false
  );
  const [twoFactorId, setTwoFactorId] = useState<string | null>(
    cachedAccountSettings ? cachedAccountSettings.twoFactorId : null
  );
  const [passkeys, setPasskeys] = useState<any[]>(
    cachedAccountSettings ? cachedAccountSettings.passkeys : []
  );
  const [recoveryCodesCount, setRecoveryCodesCount] = useState(
    cachedAccountSettings ? cachedAccountSettings.recoveryCodesCount : 0
  );
  
  const [userEmail, setUserEmail] = useState(
    cachedAccountSettings ? cachedAccountSettings.userEmail : ""
  );
  const [hasEmailPassword, setHasEmailPassword] = useState(
    cachedAccountSettings ? cachedAccountSettings.hasEmailPassword : false
  );
  const [signInProvider, setSignInProvider] = useState<"google" | "email" | "unknown" | null>(
    cachedAccountSettings ? cachedAccountSettings.signInProvider : null
  );

  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [isStepUpMfaModalOpen, setIsStepUpMfaModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [actionIntent, setActionIntent] = useState("");

  const [isLoading, setIsLoading] = useState(!cachedAccountSettings);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (force = false) => {
    if (cachedAccountSettings && !force) {
      setIsLoading(false);
      return;
    }

    try {
      const [userRes, methodRes, mfaRes, passkeysRes, recoveryRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch("/api/auth/login-method")
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
        supabase.auth.mfa.listFactors(),
        (supabase.auth as any).passkey?.list().catch(() => ({ data: [] })),
        getRecoveryCodesCount().catch(() => 0),
      ]);

      const user = userRes.data?.user;
      if (!user) return;

      const email = user.email || "";
      let provider: "google" | "email" | "unknown" = "unknown";

      if (methodRes?.provider === "google") {
        provider = "google";
      } else if (methodRes?.provider === "email") {
        provider = "email";
      } else {
        const appProvider = user.app_metadata?.provider;
        if (appProvider === "google") provider = "google";
        else if (appProvider === "email") provider = "email";
      }

      const hasPassword = user.app_metadata?.providers?.includes("email") || false;

      let is2FA = false;
      let factorId: string | null = null;

      if (!mfaRes.error && mfaRes.data) {
        const totpFactor = mfaRes.data.totp.find((f) => f.status === "verified");
        if (totpFactor) {
          is2FA = true;
          factorId = totpFactor.id;
        }
      }

      const pkeys = passkeysRes?.data || [];

      const newCache: AccountSettingsCache = {
        userEmail: email,
        hasEmailPassword: hasPassword,
        signInProvider: provider,
        twoFactorEnabled: is2FA,
        twoFactorId: factorId,
        passkeys: pkeys,
        recoveryCodesCount: recoveryRes || 0,
      };

      cachedAccountSettings = newCache;

      setUserEmail(email);
      setHasEmailPassword(hasPassword);
      setSignInProvider(provider);
      setTwoFactorEnabled(is2FA);
      setTwoFactorId(factorId);
      setPasskeys(pkeys);
      setRecoveryCodesCount(recoveryRes || 0);
    } catch (e) {
      console.error("Error loading account settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAAction = (intent: string) => {
    setActionIntent(intent);
    setIsReauthOpen(true);
  };

  const handleAddPasskey = async () => {
    try {
      setIsLoading(true);
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
        setActionIntent("add_passkey");
        setIsStepUpMfaModalOpen(true);
        return;
      }
      
      await performRegisterPasskey();
    } catch (e: any) {
      console.error("Failed to check AAL for passkey:", e);
      alert(e.message || "Failed to initiate passkey registration");
    } finally {
      setIsLoading(false);
    }
  };

  const performRegisterPasskey = async () => {
    try {
      setIsLoading(true);
      const res = await supabase.auth.registerPasskey();
      if (res.error) throw res.error;
      await loadSettings(true);
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        console.log("Passkey creation cancelled.");
        return;
      }
      console.error("Failed to register passkey:", e);
      alert(e.message || "Failed to register passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePasskey = async (passkeyId: string) => {
    if (!confirm("Are you sure you want to remove this passkey?")) return;
    try {
      setIsLoading(true);
      const res = await supabase.auth.passkey.delete({ passkeyId });
      if (res.error) throw res.error;
      await loadSettings(true);
    } catch (e: any) {
      console.error("Failed to remove passkey:", e);
      alert(e.message || "Failed to remove passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const onReauthSuccess = () => {
    setIsReauthOpen(false);
    if (actionIntent === "enable_2fa") {
      setIs2FAModalOpen(true);
    } else if (actionIntent === "disable_2fa") {
      setIsDisable2FAModalOpen(true);
    }
  };

  if (isLoading) {
    return <AccountSettingsSkeleton />;
  }

  return (
    <>
      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          {/* 1. Change Password */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                <HugeiconsIcon icon={Key01Icon} className="w-5 h-5 text-gray-500" />
                <span>Change Password</span>
              </h3>
              <p className="text-[13.5px] text-gray-500 mt-0.5">Update your Dort Asia account password securely.</p>
            </div>

            <Link href="/dashboard/settings/security/password" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                    <HugeiconsIcon icon={Key01Icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-semibold text-gray-900 group-hover:text-black transition-colors">Change Password</h4>
                    <p className="text-[12.5px] text-gray-500">Update your credentials or set up a new password</p>
                  </div>
                </div>
                <span className="text-[13.5px] font-medium text-gray-900 group-hover:translate-x-0.5 transition-transform">
                  Change Password →
                </span>
              </div>
            </Link>
          </div>

          <div className="border-t border-gray-100" />

          {/* 2. Authentication & Passkey (Enable 2FA / Enable Passkey) */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5 text-gray-500" />
                <span>Two-Factor & Passkeys</span>
              </h3>
              <p className="text-[13.5px] text-gray-500 mt-0.5">Add an extra layer of security to your Dort Asia account.</p>
            </div>

            <div className="space-y-4">
              {/* Two-Factor Auth */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 relative overflow-hidden">
                    {twoFactorEnabled && (
                      <div className="absolute inset-0 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5" />
                      </div>
                    )}
                    {!twoFactorEnabled && <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-semibold text-gray-900">
                      Two-Factor Authentication (2FA)
                    </h4>
                    {twoFactorEnabled ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12.5px] font-medium text-emerald-600">Enabled</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-[12.5px] text-gray-500">Authenticator app</span>
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-gray-500">Secure sign-in with an authenticator app.</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handle2FAAction(twoFactorEnabled ? "disable_2fa" : "enable_2fa")}
                  className={`px-4 py-2 text-[13.5px] font-medium rounded-full transition-all cursor-pointer ${
                    twoFactorEnabled
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {twoFactorEnabled ? (
                    "Disable 2FA"
                  ) : (
                    "Enable 2FA"
                  )}
                </button>
              </div>

              {/* Recovery Codes */}
              {twoFactorEnabled && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                      <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-semibold text-gray-900">Recovery Codes</h4>
                      <p className="text-[12.5px] text-gray-500">
                        {recoveryCodesCount > 0 ? `${recoveryCodesCount} unused codes remaining.` : "No unused codes remaining."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsRecoveryModalOpen(true)}
                    className="px-4 py-2 text-[13.5px] font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-full transition-all cursor-pointer"
                  >
                    Generate New Codes
                  </button>
                </div>
              )}

              {/* Passkeys Link */}
              <Link href="/dashboard/settings/account/passkeys" className="group block cursor-pointer">
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                      <HugeiconsIcon icon={FingerPrintIcon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-semibold text-gray-900">Passkeys / Biometric Login</h4>
                      <p className="text-[12.5px] text-gray-500">Sign in effortlessly using Touch ID, Face ID, or Windows Hello.</p>
                    </div>
                  </div>
                  <span className="text-[13.5px] font-medium text-gray-900 group-hover:translate-x-0.5 transition-transform">
                    Manage Passkeys →
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* 3. Sign-in Method */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                <HugeiconsIcon icon={Layers01Icon} className="w-5 h-5 text-gray-500" />
                <span>Sign-in Method</span>
              </h3>
              <p className="text-[13.5px] text-gray-500 mt-0.5">Manage how you sign in to your Dort Asia account.</p>
            </div>

            <div className="space-y-3">
              <p className="text-[12.5px] text-gray-500 mb-2 px-1">You're currently signed in using:</p>
              {signInProvider === "google" ? (
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 overflow-hidden">
                      <GoogleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-semibold text-gray-900">Google</h4>
                      <p className="text-[12.5px] text-gray-500">Signed in with Google</p>
                      <p className="text-[12.5px] text-gray-900 mt-0.5">{userEmail}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-medium">
                    Active
                  </span>
                </div>
              ) : signInProvider === "email" ? (
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 overflow-hidden relative">
                      <img src="/company_logo/DortAsiaOfflLogo.svg" alt="DORT" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-semibold text-gray-900">Dort Asia Account</h4>
                      <p className="text-[12.5px] text-gray-500">Signed in with your Dort Asia account</p>
                      <p className="text-[12.5px] text-gray-900 mt-0.5">{userEmail}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-medium">
                    Active
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 overflow-hidden relative bg-gray-100">
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-semibold text-gray-900">Current login method unavailable</h4>
                      <p className="text-[12.5px] text-gray-500">Sign in again to identify your current login method.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-full text-[12px] font-medium">
                    Unknown
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* 4. Security & Sessions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5 text-gray-500" />
                <span>Security & Sessions</span>
              </h3>
              <p className="text-[13.5px] text-gray-500 mt-0.5">Manage your signed-in devices and review recent security events.</p>
            </div>

            <Link href="/dashboard/settings/security" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-semibold text-gray-900 group-hover:text-black transition-colors">Active Sessions</h4>
                    <p className="text-[12.5px] text-gray-500">View where you're currently logged in and manage devices</p>
                  </div>
                </div>
                <span className="text-[13.5px] font-medium text-gray-900 group-hover:translate-x-0.5 transition-transform">
                  Manage Sessions →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <TwoFactorModal 
        isOpen={is2FAModalOpen} 
        onClose={() => setIs2FAModalOpen(false)} 
        onSuccess={() => {
          setIs2FAModalOpen(false);
          loadSettings(true);
        }} 
      />

      <Disable2FAModal
        isOpen={isDisable2FAModalOpen}
        onClose={() => setIsDisable2FAModalOpen(false)}
        onSuccess={() => {
          setIsDisable2FAModalOpen(false);
          loadSettings(true);
        }}
      />

      <ReauthModal
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onSuccess={onReauthSuccess}
        userEmail={userEmail}
        hasEmailPassword={hasEmailPassword}
        actionIntent={actionIntent}
      />

      <StepUpMfaModal
        isOpen={isStepUpMfaModalOpen}
        onClose={() => setIsStepUpMfaModalOpen(false)}
        onSuccess={() => {
          setIsStepUpMfaModalOpen(false);
          if (actionIntent === "add_passkey") {
            performRegisterPasskey();
          }
        }}
      />

      <RecoveryCodesModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        onSuccess={() => {
          setIsRecoveryModalOpen(false);
          loadSettings(true);
        }}
      />
    </>
  );
}
