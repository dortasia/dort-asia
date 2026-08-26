"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Upload01Icon, 
  CheckmarkCircle02Icon, 
  InformationCircleIcon,
  LockKeyIcon,
  CropIcon,
  Delete01Icon
} from "@hugeicons/core-free-icons";
import { PhotoAdjustmentModal } from "@/components/settings/photo-adjustment-modal";

const fetchCompanyData = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let email = "";
  let firstName = "";
  let lastName = "";
  let mobileNumber = "";
  let uen = "";
  let metaCompany = "";
  let metaLogo = "";

  if (user) {
    email = user.email || "";
    const meta = user.user_metadata || {};
    firstName = meta.firstName || meta.first_name || (meta.full_name ? meta.full_name.split(" ")[0] : "");
    lastName = meta.lastName || meta.last_name || (meta.full_name ? meta.full_name.split(" ").slice(1).join(" ") : "");
    
    let rawMobile = meta.phone || meta.mobile || user.phone || "";
    rawMobile = rawMobile.replace(/^\+?65\s*/, "");
    const digits = rawMobile.replace(/\D/g, "").slice(0, 8);
    mobileNumber = digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits;

    uen = meta.uen || "";
    metaCompany = meta.companyName || meta.company_name || "";

    // Set logo from user metadata
    metaLogo = meta.company_logo || meta.companyLogo || "/icons/company-profile.svg";
  }

  // Fetch company DB data
  let company_name = metaCompany;
  let country_code = "SG";
  let timezone = "Asia/Singapore";

  const res = await fetch("/api/user/company", { cache: "no-store" });
  if (res.ok) {
    const data = await res.json();
    if (data.company) {
      if (data.company.company_name) company_name = data.company.company_name;
      if (data.company.country_code) country_code = data.company.country_code;
      if (data.company.timezone) timezone = data.company.timezone;
    }
  }

  return {
    companyLogo: metaLogo,
    formData: {
      company_name,
      email,
      firstName,
      lastName,
      mobileNumber,
      uen,
      country_code,
      timezone,
    }
  };
};

export default function CompanyProfileSettings() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading } = useSWR("companyProfileData", fetchCompanyData, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  // Logo state
  const [companyLogo, setCompanyLogo] = useState<string>("/icons/company-profile.svg");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Company Profile
    company_name: "",
    // User & Identity
    email: "",
    firstName: "",
    lastName: "",
    mobileNumber: "",
    uen: "",
    // Region & Timezone
    country_code: "SG",
    timezone: "Asia/Singapore",
  });

  useEffect(() => {
    if (data) {
      setCompanyLogo(data.companyLogo);
      setFormData(data.formData);
    }
  }, [data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image file is too large. Please select an image under 8MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImageSrc(event.target.result as string);
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleSaveAdjustedLogo = async (croppedDataUrl: string) => {
    try {
      setCompanyLogo(croppedDataUrl); // instant optimistic update

      const res = await fetch("/api/user/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: croppedDataUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setCompanyLogo(data.url);
        }
        window.dispatchEvent(new Event("company-logo-updated"));
        setMessage({ type: "success", text: "Company logo updated successfully." });
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: errData.error || "Failed to upload logo." });
      }
    } catch (err) {
      console.error("Error saving logo:", err);
      setMessage({ type: "error", text: "Failed to upload logo." });
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const defaultLogo = "/icons/company-profile.svg";
      setCompanyLogo(defaultLogo);

      await fetch("/api/user/logo", {
        method: "DELETE",
      });

      window.dispatchEvent(new Event("company-logo-updated"));
      setMessage({ type: "success", text: "Company logo removed." });
    } catch (err) {
      console.error("Error removing logo:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage(null);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Strip accidental +65 prefix if typed or pasted
    val = val.replace(/^\+?65\s*/, "");
    // Extract only digits up to 8 max
    const digits = val.replace(/\D/g, "").slice(0, 8);
    // Format as Singapore standard 4-4 format (e.g. 9123 4567)
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`;
    }
    setFormData((prev) => ({ ...prev, mobileNumber: formatted }));
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const digits = formData.mobileNumber.replace(/\D/g, "");
      const fullPhone = digits ? `+65 ${formData.mobileNumber.trim()}` : "";

      // 1. Update user metadata in Supabase Auth
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: fullPhone,
          mobile: fullPhone,
          uen: formData.uen,
          companyName: formData.company_name,
        },
      });

      if (userUpdateError) {
        console.warn("User metadata update note:", userUpdateError.message);
      }

      // 2. Update company table via API
      const res = await fetch("/api/user/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: formData.company_name,
          country_code: formData.country_code,
          timezone: formData.timezone,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Company profile and user details updated successfully." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update company settings." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  if (!data && isLoading) {
    return (
      <div className="animate-pulse max-w-3xl">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8 w-full">
          <div className="space-y-4">
            <div className="h-5 bg-gray-200/70 rounded w-1/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
          </div>
          <div className="border-t border-gray-100 pt-8 space-y-4">
            <div className="h-5 bg-gray-200/70 rounded w-1/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-100 rounded-xl"></div>
              <div className="h-10 bg-gray-100 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSave}>
        {/* Single Full Card Container with No Shadow */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          
          {/* 1. Company Logo & Company Name */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900">Company Profile</h3>
              <p className="text-[13.5px] text-gray-500 mt-0.5">Manage your company's logo and official organization name.</p>
            </div>

            {/* Logo Upload Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-1">
              <div className="w-20 h-20 rounded-[20px] bg-[#f6f6f6] border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-[13.5px] font-medium rounded-xl transition-all active:scale-95 shadow-2xs">
                    <HugeiconsIcon icon={Upload01Icon} className="w-4 h-4 text-gray-600" />
                    <span>{companyLogo !== "/icons/company-profile.svg" ? "Change Logo" : "Upload Logo"}</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg, image/webp" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>

                  {companyLogo !== "/icons/company-profile.svg" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageSrc(companyLogo);
                          setIsCropModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        <HugeiconsIcon icon={CropIcon} className="w-4 h-4 text-gray-500" />
                        <span>Adjust Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4 text-rose-500" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[12.5px] text-gray-400">PNG, JPG, or WebP • Interactive crop, zoom & filter editor</p>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2 pt-2">
              <label className="text-[14px] font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                placeholder="Enter company name"
                className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14.5px] text-gray-900"
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* 2. User & Business Identity Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900">User Information</h3>
              <p className="text-[13.5px] text-gray-500 mt-0.5">Personal and registration details associated with this account.</p>
            </div>

            {/* Email (Non-editable) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-medium text-gray-700">Email Address</label>
                <span className="flex items-center gap-1 text-[11.5px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                  <HugeiconsIcon icon={LockKeyIcon} className="w-3 h-3" />
                  Non-editable
                </span>
              </div>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/80 text-gray-500 cursor-not-allowed text-[14.5px] select-none"
              />
            </div>

            {/* User Name (First & Last) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14.5px] text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14.5px] text-gray-900"
                />
              </div>
            </div>

            {/* Mobile Number & UEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-gray-700">Mobile Number</label>
                <div className="relative flex items-center rounded-[12px] border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50/80 border-r border-gray-200 text-[14px] font-medium text-gray-600 select-none shrink-0">
                    <span className="text-base leading-none">🇸🇬</span>
                    <span>+65</span>
                  </div>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleMobileChange}
                    placeholder="Enter mobile number"
                    maxLength={9}
                    className="w-full px-3.5 py-2.5 bg-transparent focus:outline-none text-[14.5px] text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-gray-700">UEN (Unique Entity Number)</label>
                <input
                  type="text"
                  name="uen"
                  value={formData.uen}
                  onChange={handleChange}
                  placeholder="Enter UEN"
                  className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14.5px] text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* 3. Block Region and Timezone */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900">Region & Timezone</h3>
                <p className="text-[13.5px] text-gray-500 mt-0.5">Organization locale and operational timezone locked to Singapore.</p>
              </div>
              <span className="flex items-center gap-1 text-[11.5px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                <HugeiconsIcon icon={LockKeyIcon} className="w-3 h-3" />
                Non-editable
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value="Singapore (SG)"
                  disabled
                  className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/80 text-gray-500 cursor-not-allowed text-[14.5px] select-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-gray-700">Timezone</label>
                <input
                  type="text"
                  value="Asia/Singapore (SGT)"
                  disabled
                  className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/80 text-gray-500 cursor-not-allowed text-[14.5px] select-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Save Bar */}
          <div className="flex items-center justify-between pt-1">
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
              disabled={saving}
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-full font-medium text-[14px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {/* Photo Adjustment Modal */}
      <PhotoAdjustmentModal
        isOpen={isCropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onSave={handleSaveAdjustedLogo}
      />
    </div>
  );
}
