"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { FingerPrintIcon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { StepUpMfaModal } from "@/components/auth/StepUpMfaModal";

export default function PasskeysPage() {
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStepUpMfaModalOpen, setIsStepUpMfaModalOpen] = useState(false);
  const [actionIntent, setActionIntent] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      setIsLoading(true);
      const res = await (supabase.auth as any).passkey?.list().catch(() => ({ data: [] }));
      setPasskeys(res?.data || []);
    } catch (error) {
      console.error("Failed to load passkeys:", error);
    } finally {
      setIsLoading(false);
    }
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
      await loadPasskeys();
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
      await loadPasskeys();
    } catch (e: any) {
      console.error("Failed to remove passkey:", e);
      alert(e.message || "Failed to remove passkey");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link 
            href="/dashboard/settings/account"
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="w-5 h-5" />
          </Link>
          <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">
            Passkeys & Biometrics
          </h2>
        </div>
        <p className="text-[13.5px] text-gray-500 mt-1">
          Manage your passkeys to sign in effortlessly without a password.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
              <HugeiconsIcon icon={FingerPrintIcon} className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[14.5px] font-semibold text-gray-900">Passkeys</h4>
              <p className="text-[12.5px] text-gray-500">Sign in effortlessly using Touch ID, Face ID, or Windows Hello.</p>
            </div>
          </div>
          <button
            onClick={handleAddPasskey}
            disabled={isLoading}
            className="px-4 py-2 text-[13.5px] font-medium rounded-full transition-all bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Adding..." : "Add Passkey"}
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {isLoading && passkeys.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-500 text-sm">
            You haven't added any passkeys yet.
          </div>
        ) : (
          <div className="space-y-3">
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-gray-900">{pk.friendly_name || "Registered Passkey"}</span>
                  <span className="text-[12.5px] text-gray-500">Added on {new Date(pk.created_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => handleRemovePasskey(pk.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[12.5px] font-medium rounded-md text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
