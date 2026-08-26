import { Suspense } from "react";
import { ActiveSessionsList } from "@/components/settings/ActiveSessionsList";
import { SecurityActivityLog } from "@/components/settings/SecurityActivityLog";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Security & Sessions | DORT Asia",
  description: "Manage your active sessions and view security activity.",
};

export default function SecuritySettingsPage() {
  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Security & Sessions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your signed-in devices and review recent security events.
        </p>
      </div>

      {/* Active Sessions */}
      <section>
        <ActiveSessionsList />
      </section>

      <hr className="border-gray-200 dark:border-zinc-800" />

      {/* Security Activity Log */}
      <section>
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        }>
          <SecurityActivityLog />
        </Suspense>
      </section>
    </div>
  );
}
