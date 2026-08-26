"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg("Please enter a company name.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/complete-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete setup");
      }

      router.push("/"); // Redirect to dashboard
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0A0A0A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mb-8">
        <div className="dark:brightness-0 dark:invert mb-6 flex items-center justify-center">
          <Image
            src="/company_logo/DortAsiaLogo.svg"
            alt="DORT Asia Logo"
            width={140}
            height={44}
            className="h-10 w-auto object-contain drop-shadow-sm"
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Complete your setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Just one last step before you can access the dashboard.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[440px]">
        <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl py-10 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] sm:rounded-3xl border border-gray-100 dark:border-zinc-800/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                {errorMsg}
              </div>
            )}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !companyName.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finish Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
