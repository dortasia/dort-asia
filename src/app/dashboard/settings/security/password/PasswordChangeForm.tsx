"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Eye, EyeOff } from "lucide-react";
import { createPasswordChangeNotification } from "./actions";

export default function PasswordChangeForm({ 
  hasEmailPassword, 
  userEmail, 
  isRecovery 
}: { 
  hasEmailPassword: boolean; 
  userEmail: string;
  isRecovery: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      
      // If the user already has a password and is not in a recovery session, require current password re-auth
      if (hasEmailPassword && !isRecovery) {
        if (!currentPassword) {
          setMessage({ type: "error", text: "Current password is required." });
          setLoading(false);
          return;
        }

        const { error: reAuthError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        });

        if (reAuthError) {
          setMessage({ type: "error", text: "Incorrect current password." });
          setLoading(false);
          return;
        }
      }

      // Proceed to update the password securely
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Password updated successfully." });
        
        // Trigger server-side notification
        try {
          await createPasswordChangeNotification();
        } catch (notifErr) {
          console.error("Failed to create password change notification:", notifErr);
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update password." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendSetupLink = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard/settings/security/password&recovery=true`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Password setup link sent to your email! Please check your inbox." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to send setup link." });
    } finally {
      setLoading(false);
    }
  };

  // State 1: Password change form (Email users OR Google users in a recovery session)
  if (hasEmailPassword || isRecovery) {
    return (
      <form onSubmit={handlePasswordChange} className="space-y-5">
        {hasEmailPassword && !isRecovery && (
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-gray-700">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14.5px] text-gray-900"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-gray-100/60"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? (
                  <Eye className="w-4.5 h-4.5 text-gray-500" />
                ) : (
                  <EyeOff className="w-4.5 h-4.5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[14px] font-medium text-gray-700">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-4 pr-11 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14.5px] text-gray-900"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-gray-100/60"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <Eye className="w-4.5 h-4.5 text-gray-500" />
              ) : (
                <EyeOff className="w-4.5 h-4.5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[14px] font-medium text-gray-700">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-4 pr-11 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14.5px] text-gray-900"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-gray-100/60"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <Eye className="w-4.5 h-4.5 text-gray-500" />
              ) : (
                <EyeOff className="w-4.5 h-4.5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div>
            {message && (
              <div className={`flex items-center gap-2 text-[13.5px] font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {message.type === 'success' ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4.5 h-4.5" />
                ) : (
                  <HugeiconsIcon icon={InformationCircleIcon} className="w-4.5 h-4.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || (message?.type === 'success')}
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-full font-medium text-[14px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? "Updating..." : (hasEmailPassword ? "Update Password" : "Set Password")}
          </button>
        </div>
      </form>
    );
  }

  // State 2: Google-only user, not in a recovery session
  return (
    <div className="space-y-5">
      {message && (
        <div className={`flex items-center gap-2 text-[13.5px] font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} bg-${message.type === 'success' ? 'emerald' : 'rose'}-50 p-4 rounded-xl border border-${message.type === 'success' ? 'emerald' : 'rose'}-100`}>
          {message.type === 'success' ? (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5 flex-shrink-0" />
          ) : (
            <HugeiconsIcon icon={InformationCircleIcon} className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {!message || message.type !== 'success' ? (
        <div className="pt-2">
          <button
            onClick={handleSendSetupLink}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-full font-medium text-[14px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? "Sending..." : "Send Password Setup Link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
