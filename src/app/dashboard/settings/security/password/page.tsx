import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PasswordChangeForm from "./PasswordChangeForm";
import { HugeiconsIcon } from "@hugeicons/react";
import { Key01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

export const metadata = {
  title: "Change Password | Dort Asia",
};

export default async function PasswordPage(props: { searchParams?: Promise<{ recovery?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  const providers = user.app_metadata?.providers || [];
  const hasEmailPassword = providers.includes("email");

  const searchParams = await props.searchParams;
  const isRecovery = searchParams?.recovery === "true";

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link 
          href="/dashboard/settings/account" 
          className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Security Settings
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
        <div>
          <h3 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
            <HugeiconsIcon icon={Key01Icon} className="w-5 h-5 text-gray-500" />
            <span>{hasEmailPassword || isRecovery ? "Change Password" : "Create Password"}</span>
          </h3>
          <p className="text-[14px] text-gray-500 mt-1">
            {hasEmailPassword || isRecovery 
              ? "Update your Dort Asia account password securely." 
              : "Your account currently uses Google Sign-In. Create a password to also sign in with your email."}
          </p>
        </div>

        <PasswordChangeForm 
          hasEmailPassword={hasEmailPassword} 
          userEmail={user.email || ""} 
          isRecovery={isRecovery} 
        />
      </div>
    </div>
  );
}
