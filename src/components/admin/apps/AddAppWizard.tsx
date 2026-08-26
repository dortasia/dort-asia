"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  PlusSignIcon,
  Delete01Icon,
  Image01Icon,
  Upload01Icon,
  Store01Icon,
  Layers01Icon,
  CreditCardIcon,
  EyeIcon,
  Cancel01Icon,
  SparklesIcon,
  Clock01Icon,
  Shield01Icon,
  Folder02Icon,
  ArrowRight01Icon,
  HelpCircleIcon
} from "@hugeicons/core-free-icons";
import { AppDetailsView } from "@/components/marketplace/AppDetailsView";
import { MarketplaceApp } from "@/data/marketplace";

const CATEGORIES = [
  "HR & Workforce",
  "Finance & Accounting",
  "Sales & CRM",
  "Operations & Logistics",
  "Marketing & Growth",
  "Productivity & Collaboration",
  "Retail & E-commerce",
  "Hospitality & Tourism",
  "Restaurant & F&B",
  "Healthcare & Wellness",
  "Legal & Compliance",
  "Other",
];

const PLATFORMS = [
  "Web + Mobile",
  "Web",
  "Mobile",
  "Desktop",
  "Web + Mobile + Desktop",
  "Cloud & API",
];

interface ScreenshotItem {
  id: string;
  image: string;
  title: string;
  caption?: string;
  sort_order: number;
}

interface CoreFeatureItem {
  id: string;
  title: string;
  description: string;
  tag?: string;
}

interface ModuleItem {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
}

interface BenefitItem {
  title: string;
  description: string;
}

interface EntitlementFeatureItem {
  id?: string;
  feature_key: string;
  name: string;
  description?: string;
  value_type: "BOOLEAN" | "NUMBER" | "STRING" | "JSON";
  default_value: any;
  category?: string;
  status?: string;
}

interface PlanItem {
  id?: string;
  plan_code: string;
  name: string;
  description?: string;
  price: number;
  yearly_price?: number | null;
  currency: string;
  billing_interval: string;
  trial_days: number;
  popular: boolean;
  cta_text: string;
  status: string;
  features?: Array<{
    feature_id?: string;
    feature_key?: string;
    enabled: boolean;
    limits: {
      is_unlimited?: boolean;
      value?: any;
      [key: string]: any;
    };
  }>;
}

interface AppFormState {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  long_description: string;
  category: string;
  platform: string;
  logo_url: string;
  hero_image: string;
  icon_background: string;
  badge: string;
  version: string;
  developer: string;
  route: string;
  status: string;
  sort_order: number;
  screenshots: ScreenshotItem[];
  highlights: Array<{ label: string; value: string }>;
  core_features: CoreFeatureItem[];
  modules: ModuleItem[];
  benefits: BenefitItem[];
  entitlement_features: EntitlementFeatureItem[];
  plans: PlanItem[];
}

const DEFAULT_STATE: AppFormState = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  long_description: "",
  category: "HR & Workforce",
  platform: "Web + Mobile",
  logo_url: "",
  hero_image: "",
  icon_background: "bg-white",
  badge: "New",
  version: "1.0.0",
  developer: "Dort Asia Technologies",
  route: "",
  status: "draft",
  sort_order: 0,
  screenshots: [],
  highlights: [
    { label: "Category", value: "HR & Workforce" },
    { label: "Platform", value: "Web & Mobile App" },
    { label: "Deployment", value: "Cloud Hosted (Singapore)" },
  ],
  core_features: [],
  modules: [],
  benefits: [],
  entitlement_features: [],
  plans: [],
};

const WIZARD_STEPS = [
  { id: "01", name: "Basic Information", desc: "Identity & Platform" },
  { id: "02", name: "Media & Branding", desc: "Icons & Screenshots" },
  { id: "03", name: "Marketplace Content", desc: "Overview, Modules, Benefits" },
  { id: "04", name: "Feature Catalog", desc: "Entitlement Keys" },
  { id: "05", name: "Subscription Plans", desc: "Pricing & Tiers" },
  { id: "06", name: "Entitlements Matrix", desc: "Limits & Quotas" },
  { id: "07", name: "Preview & Publish", desc: "Review & Verification" },
];

export function AddAppWizard({ existingAppId }: { existingAppId?: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<AppFormState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(Boolean(existingAppId));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load existing app if editing
  useEffect(() => {
    if (!existingAppId) return;

    async function loadApp() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/apps/${existingAppId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load application data");
        const data = await res.json();
        if (data.app) {
          setForm({
            ...DEFAULT_STATE,
            ...data.app,
            entitlement_features: data.features || [],
            plans: data.plans || [],
          });
        }
      } catch (err: any) {
        setToastMessage({ text: err.message || "Failed to load app", type: "error" });
      } finally {
        setLoading(false);
      }
    }

    loadApp();
  }, [existingAppId]);

  // Slug auto-generator
  const handleNameChange = (name: string) => {
    const isAutoSlug = !form.id && (!form.slug || form.slug === form.name.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
    const newSlug = isAutoSlug ? name.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-") : form.slug;
    setForm((prev) => ({
      ...prev,
      name,
      slug: newSlug,
      route: `/dashboard/marketplace/${newSlug}`,
    }));
    setSaveStatus("unsaved");
  };

  // Upload handler helper
  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      return data.url;
    } catch (err: any) {
      alert(err.message || "File upload failed");
      return null;
    }
  };

  // Save Application (Draft or Published)
  const handleSave = async (targetStatus?: "draft" | "active") => {
    try {
      setIsSaving(true);
      setSaveStatus("saving");
      setValidationErrors([]);

      const statusToSave = targetStatus || form.status || "draft";
      const payload = {
        ...form,
        status: statusToSave,
      };

      const isNew = !form.id;
      const url = isNew ? "/api/admin/apps" : `/api/admin/apps/${form.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        }
        throw new Error(data.error || "Failed to save application");
      }

      if (data.app?.id && !form.id) {
        setForm((prev) => ({ ...prev, id: data.app.id, status: statusToSave }));
      } else {
        setForm((prev) => ({ ...prev, status: statusToSave }));
      }

      setSaveStatus("saved");
      setToastMessage({
        text: statusToSave === "active" ? "Application published to Marketplace!" : "Draft saved successfully.",
        type: "success",
      });
      setTimeout(() => setToastMessage(null), 4000);

      if (statusToSave === "active") {
        router.push("/dashboard/admin/apps");
      }
    } catch (err: any) {
      setToastMessage({ text: err.message || "Failed to save application", type: "error" });
      setTimeout(() => setToastMessage(null), 5000);
      setSaveStatus("unsaved");
    } finally {
      setIsSaving(false);
    }
  };

  // Transform form state into MarketplaceApp for live preview
  const previewApp: MarketplaceApp = {
    id: form.id || form.slug || "preview-app",
    slug: form.slug || "preview-app",
    name: form.name || "Untitled Application",
    tagline: form.tagline || "Your application tagline here",
    description: form.description || "Short description of your application.",
    longDescription: form.long_description || form.description || "Detailed overview.",
    icon: form.logo_url || "/icons/placeholder-app.svg",
    iconBackground: form.icon_background || "bg-white",
    heroImage: form.hero_image || "/Xentra_people/banner/app-banenr.avif",
    category: form.category,
    platform: form.platform,
    rating: { score: 5.0, count: 1 },
    status: form.status === "active" ? "available" : "available",
    badge: form.badge || undefined,
    version: form.version || "1.0.0",
    developer: form.developer || "Dort Asia Team",
    lastUpdated: "Just now",
    route: form.route || `/dashboard/marketplace/${form.slug || "preview"}`,
    sortOrder: form.sort_order,
    highlights: form.highlights || [],
    features: (form.core_features || []).map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      tag: f.tag || "Feature",
    })),
    modules: (form.modules || []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      capabilities: m.capabilities || [],
    })),
    screenshots: (form.screenshots || []).map((s) => ({
      id: s.id,
      title: s.title,
      image: s.image,
      caption: s.caption,
    })),
    benefits: (form.benefits || []).map((b) => ({
      title: b.title,
      description: b.description,
    })),
    pricingPlans: (form.plans || []).map((p) => ({
      id: p.plan_code,
      name: p.name,
      description: p.description || "",
      price: Number(p.price) || 0,
      billingInterval: p.billing_interval || "monthly",
      currency: p.currency || "SGD",
      popular: p.popular,
      features: (p.features || [])
        .filter((pf) => pf.enabled)
        .map((pf) => {
          if (pf.limits?.is_unlimited) return `${pf.feature_key}: Unlimited`;
          if (pf.limits?.value !== undefined && pf.limits?.value !== null) return `${pf.feature_key}: ${pf.limits.value}`;
          return pf.feature_key || "Included";
        }),
      ctaText: p.cta_text || "Select Plan",
      ctaRoute: `/dashboard/subscriptions/${form.slug || "checkout"}`,
    })),
  };

  // Preflight validation check
  const preflightChecks = [
    { label: "App Name & Slug", passed: Boolean(form.name.trim() && form.slug.trim()) },
    { label: "Category & Platform", passed: Boolean(form.category && form.platform) },
    { label: "App Logo / Icon", passed: Boolean(form.logo_url) },
    { label: "Hero / Cover Banner", passed: Boolean(form.hero_image) },
    { label: "Overview & Descriptions", passed: Boolean(form.description.trim()) },
    { label: "At least 1 Subscription Plan", passed: form.plans.length > 0 },
    { label: "Valid Plan Prices", passed: form.plans.length > 0 && form.plans.every((p) => p.price !== undefined && !isNaN(Number(p.price))) },
  ];
  const canPublish = preflightChecks.every((c) => c.passed);

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-400 text-sm animate-pulse">
        Loading application wizard...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-[13.5px] font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === "success"
              ? "bg-gray-900 border-gray-700 text-emerald-300"
              : "bg-red-950 border-red-700 text-red-200"
          }`}
        >
          <HugeiconsIcon
            icon={toastMessage.type === "success" ? CheckmarkCircle02Icon : AlertCircleIcon}
            className="w-4 h-4"
          />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Sticky Header */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs sticky top-20 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard/admin/apps"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {form.name || "Add New Application"}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  form.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {form.status === "active" ? "PUBLISHED" : "DRAFT"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-gray-400 mt-0.5">
              <span className="font-mono">/{form.slug || "new-app"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {saveStatus === "saving" && <span className="text-blue-600 font-semibold">Saving changes...</span>}
                {saveStatus === "saved" && <span className="text-gray-400">All changes saved</span>}
                {saveStatus === "unsaved" && <span className="text-amber-600 font-medium">Unsaved changes</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("draft")}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-[13.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(6)}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[13.5px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HugeiconsIcon icon={EyeIcon} className="w-4 h-4" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("active")}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-emerald-400" />
            <span>Publish App</span>
          </button>
        </div>
      </div>

      {/* Validation Errors Box if any */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-[13.5px] text-red-800 space-y-1.5 animate-in fade-in">
          <div className="font-bold flex items-center gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 text-red-600" />
            <span>Cannot publish application yet ({validationErrors.length} items need attention):</span>
          </div>
          <ul className="list-disc list-inside text-[13px] text-red-700 pl-2 space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Horizontal Stepper */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-2xs overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max gap-1">
          {WIZARD_STEPS.map((step, idx) => {
            const isCurrent = currentStep === idx;
            const isPast = currentStep > idx;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-gray-900 text-white shadow-2xs"
                    : isPast
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                    isCurrent ? "bg-white text-gray-900" : isPast ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isPast ? "✓" : step.id}
                </div>
                <div>
                  <div className="text-[12.5px] font-bold leading-tight">{step.name}</div>
                  <div className={`text-[10.5px] ${isCurrent ? "text-gray-300" : "text-gray-400"}`}>{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 01: BASIC INFORMATION */}
      {currentStep === 0 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">Step 01: Basic Information & Identity</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">Define your application name, slug URL, category, and platform targets</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Application Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Xentra People"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Slug Identifier *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
                  setSaveStatus("unsaved");
                }}
                placeholder="xentra-people"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] font-mono focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Short Tagline *</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => {
                setForm({ ...form, tagline: e.target.value });
                setSaveStatus("unsaved");
              }}
              placeholder="e.g. Employee Tracking, Attendance, Timesheet & Payroll"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value });
                  setSaveStatus("unsaved");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] bg-white focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Platform Target *</label>
              <select
                value={form.platform}
                onChange={(e) => {
                  setForm({ ...form, platform: e.target.value });
                  setSaveStatus("unsaved");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] bg-white focus:outline-hidden"
              >
                {PLATFORMS.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Badge (Optional)</label>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => {
                  setForm({ ...form, badge: e.target.value });
                  setSaveStatus("unsaved");
                }}
                placeholder="e.g. Beta, Popular, New"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Developer / Publisher</label>
              <input
                type="text"
                value={form.developer}
                onChange={(e) => {
                  setForm({ ...form, developer: e.target.value });
                  setSaveStatus("unsaved");
                }}
                placeholder="Dort Asia Technologies"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Version</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => {
                  setForm({ ...form, version: e.target.value });
                  setSaveStatus("unsaved");
                }}
                placeholder="1.0.0"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] font-mono focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Media & Branding</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 02: BRANDING & MEDIA */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">Step 02: Branding & Media Manager</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">Upload square application icon, marketplace cover banner, and gallery screenshots</p>
          </div>

          {/* App Icon & Hero Cover */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App Icon Upload */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-gray-50/50 space-y-4">
              <label className="block text-[13px] font-bold text-gray-800">App Icon (Square) *</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Icon Preview" className="w-12 h-12 object-contain" />
                  ) : (
                    <HugeiconsIcon icon={Store01Icon} className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file);
                        if (url) {
                          setForm({ ...form, logo_url: url });
                          setSaveStatus("unsaved");
                        }
                      }
                    }}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.logo_url}
                    onChange={(e) => {
                      setForm({ ...form, logo_url: e.target.value });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Or paste image URL"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Hero Cover Image Upload */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-gray-50/50 space-y-4">
              <label className="block text-[13px] font-bold text-gray-800">Hero / Cover Banner *</label>
              <div className="space-y-3">
                {form.hero_image && (
                  <div className="w-full h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={form.hero_image} alt="Hero Banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file);
                        if (url) {
                          setForm({ ...form, hero_image: url });
                          setSaveStatus("unsaved");
                        }
                      }
                    }}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={form.hero_image}
                  onChange={(e) => {
                    setForm({ ...form, hero_image: e.target.value });
                    setSaveStatus("unsaved");
                  }}
                  placeholder="Or paste hero banner URL"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Screenshot Gallery Builder */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-bold text-gray-900">App Screenshot Gallery</h4>
                <p className="text-[12.5px] text-gray-500">Add showcase images for the marketplace slider</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newScreenshots = [
                    ...form.screenshots,
                    {
                      id: `shot-${Date.now()}`,
                      image: "",
                      title: `Screenshot ${form.screenshots.length + 1}`,
                      caption: "",
                      sort_order: form.screenshots.length,
                    },
                  ];
                  setForm({ ...form, screenshots: newScreenshots });
                  setSaveStatus("unsaved");
                }}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5" />
                <span>Add Screenshot</span>
              </button>
            </div>

            {form.screenshots.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400 text-xs">
                No screenshots added yet. Click &quot;Add Screenshot&quot; above to include gallery images.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {form.screenshots.map((shot, idx) => (
                  <div key={shot.id} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 relative group">
                    <div className="w-full h-32 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center">
                      {shot.image ? (
                        <img src={shot.image} alt={shot.title} className="w-full h-full object-cover" />
                      ) : (
                        <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 text-gray-300" />
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file);
                          if (url) {
                            const updated = [...form.screenshots];
                            updated[idx].image = url;
                            setForm({ ...form, screenshots: updated });
                            setSaveStatus("unsaved");
                          }
                        }
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-gray-100 file:text-gray-700 cursor-pointer"
                    />

                    <input
                      type="text"
                      value={shot.title}
                      onChange={(e) => {
                        const updated = [...form.screenshots];
                        updated[idx].title = e.target.value;
                        setForm({ ...form, screenshots: updated });
                        setSaveStatus("unsaved");
                      }}
                      placeholder="Title (e.g. Attendance Dashboard)"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-hidden"
                    />

                    <input
                      type="text"
                      value={shot.caption || ""}
                      onChange={(e) => {
                        const updated = [...form.screenshots];
                        updated[idx].caption = e.target.value;
                        setForm({ ...form, screenshots: updated });
                        setSaveStatus("unsaved");
                      }}
                      placeholder="Caption description"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-hidden"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.screenshots.filter((_, i) => i !== idx);
                        setForm({ ...form, screenshots: updated });
                        setSaveStatus("unsaved");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-500 border border-gray-200 shadow-xs hover:bg-red-50 cursor-pointer"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Marketplace Content</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 03: MARKETPLACE OVERVIEW, MODULES & BENEFITS */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-8 shadow-2xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">Step 03: Marketplace Presentation Content</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">Configure rich long-form overview, core feature highlights, integrated modules, and business benefits</p>
          </div>

          {/* Overview text */}
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Short Overview Description *</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  setSaveStatus("unsaved");
                }}
                placeholder="A complete employee management platform designed to simplify workforce operations..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Detailed Long-form Description</label>
              <textarea
                rows={4}
                value={form.long_description}
                onChange={(e) => {
                  setForm({ ...form, long_description: e.target.value });
                  setSaveStatus("unsaved");
                }}
                placeholder="Comprehensive overview of features, architecture, and value proposition..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Core Feature Highlights Builder */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-bold text-gray-900">Core Feature Highlights</h4>
                <p className="text-[12.5px] text-gray-500">Key functional blocks shown on the marketplace details overview</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [
                    ...form.core_features,
                    {
                      id: `feat-${Date.now()}`,
                      title: "New Feature",
                      description: "Feature description...",
                      tag: "Core",
                    },
                  ];
                  setForm({ ...form, core_features: updated });
                  setSaveStatus("unsaved");
                }}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5" />
                <span>Add Feature Block</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.core_features.map((feat, idx) => (
                <div key={feat.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/40 space-y-3 relative">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={feat.title}
                        onChange={(e) => {
                          const updated = [...form.core_features];
                          updated[idx].title = e.target.value;
                          setForm({ ...form, core_features: updated });
                          setSaveStatus("unsaved");
                        }}
                        placeholder="Feature Title (e.g. Smart Attendance Tracking)"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-[13.5px] font-bold bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={feat.tag || ""}
                        onChange={(e) => {
                          const updated = [...form.core_features];
                          updated[idx].tag = e.target.value;
                          setForm({ ...form, core_features: updated });
                          setSaveStatus("unsaved");
                        }}
                        placeholder="Tag (e.g. Core HR, Attendance)"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={feat.description}
                    onChange={(e) => {
                      const updated = [...form.core_features];
                      updated[idx].description = e.target.value;
                      setForm({ ...form, core_features: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Feature capability description..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.core_features.filter((_, i) => i !== idx);
                      setForm({ ...form, core_features: updated });
                      setSaveStatus("unsaved");
                    }}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated Modules Builder */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-bold text-gray-900">Integrated Modules</h4>
                <p className="text-[12.5px] text-gray-500">Modular sub-systems with capability bullet points</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [
                    ...form.modules,
                    {
                      id: `mod-${Date.now()}`,
                      title: "New Module",
                      description: "Module summary...",
                      capabilities: ["Capability 1", "Capability 2"],
                    },
                  ];
                  setForm({ ...form, modules: updated });
                  setSaveStatus("unsaved");
                }}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="space-y-4">
              {form.modules.map((mod, idx) => (
                <div key={mod.id} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 relative shadow-2xs">
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => {
                      const updated = [...form.modules];
                      updated[idx].title = e.target.value;
                      setForm({ ...form, modules: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Module Title (e.g. Core Workforce & Onboarding)"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-[14px] font-bold focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={mod.description}
                    onChange={(e) => {
                      const updated = [...form.modules];
                      updated[idx].description = e.target.value;
                      setForm({ ...form, modules: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Module description..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] focus:outline-hidden"
                  />

                  {/* Bullet points */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[12px] font-bold text-gray-600">Capabilities Bullet Points:</label>
                    {(mod.capabilities || []).map((cap, capIdx) => (
                      <div key={capIdx} className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        <input
                          type="text"
                          value={cap}
                          onChange={(e) => {
                            const updated = [...form.modules];
                            updated[idx].capabilities[capIdx] = e.target.value;
                            setForm({ ...form, modules: updated });
                            setSaveStatus("unsaved");
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.modules];
                            updated[idx].capabilities = updated[idx].capabilities.filter((_, i) => i !== capIdx);
                            setForm({ ...form, modules: updated });
                            setSaveStatus("unsaved");
                          }}
                          className="text-gray-400 hover:text-red-500 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...form.modules];
                        updated[idx].capabilities = [...(updated[idx].capabilities || []), ""];
                        setForm({ ...form, modules: updated });
                        setSaveStatus("unsaved");
                      }}
                      className="text-[12px] font-semibold text-blue-600 hover:underline pt-1"
                    >
                      + Add bullet point
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.modules.filter((_, i) => i !== idx);
                      setForm({ ...form, modules: updated });
                      setSaveStatus("unsaved");
                    }}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Business Benefits Builder */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-bold text-gray-900">Business Benefits</h4>
                <p className="text-[12.5px] text-gray-500">Key ROI & enterprise impact points</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [
                    ...form.benefits,
                    { title: "New Benefit", description: "Benefit description..." },
                  ];
                  setForm({ ...form, benefits: updated });
                  setSaveStatus("unsaved");
                }}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5" />
                <span>Add Benefit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {form.benefits.map((b, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2 relative shadow-2xs">
                  <input
                    type="text"
                    value={b.title}
                    onChange={(e) => {
                      const updated = [...form.benefits];
                      updated[idx].title = e.target.value;
                      setForm({ ...form, benefits: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Benefit Title (e.g. Save 15+ Hours)"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13.5px] font-bold focus:outline-hidden"
                  />
                  <textarea
                    rows={2}
                    value={b.description}
                    onChange={(e) => {
                      const updated = [...form.benefits];
                      updated[idx].description = e.target.value;
                      setForm({ ...form, benefits: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Benefit description..."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.benefits.filter((_, i) => i !== idx);
                      setForm({ ...form, benefits: updated });
                      setSaveStatus("unsaved");
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Feature Catalog</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 04: FEATURE CATALOG & ENTITLEMENTS */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Step 04: Entitlement Feature Catalog</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Define machine-readable entitlement keys (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">employees.max</code>) for backend authorization
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const updated = [
                  ...form.entitlement_features,
                  {
                    feature_key: `feature.${form.entitlement_features.length + 1}`,
                    name: `Feature ${form.entitlement_features.length + 1}`,
                    description: "",
                    value_type: "BOOLEAN" as const,
                    default_value: true,
                    category: "Core",
                    status: "active",
                  },
                ];
                setForm({ ...form, entitlement_features: updated });
                setSaveStatus("unsaved");
              }}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
              <span>Add Entitlement Feature</span>
            </button>
          </div>

          <div className="space-y-3">
            {form.entitlement_features.map((feat, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 grid grid-cols-1 md:grid-cols-4 gap-3 items-center relative">
                <div>
                  <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Feature Key * (dot-notation)</label>
                  <input
                    type="text"
                    value={feat.feature_key}
                    onChange={(e) => {
                      const updated = [...form.entitlement_features];
                      updated[idx].feature_key = e.target.value.toLowerCase().trim();
                      setForm({ ...form, entitlement_features: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="e.g. employees.max"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] font-mono bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Display Name *</label>
                  <input
                    type="text"
                    value={feat.name}
                    onChange={(e) => {
                      const updated = [...form.entitlement_features];
                      updated[idx].name = e.target.value;
                      setForm({ ...form, entitlement_features: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="e.g. Max Employees"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] font-medium bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Value Type *</label>
                  <select
                    value={feat.value_type}
                    onChange={(e) => {
                      const updated = [...form.entitlement_features];
                      updated[idx].value_type = e.target.value as any;
                      setForm({ ...form, entitlement_features: updated });
                      setSaveStatus("unsaved");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-hidden"
                  >
                    <option value="BOOLEAN">BOOLEAN (Enabled/Disabled)</option>
                    <option value="NUMBER">NUMBER (Numeric Quota / Limit)</option>
                    <option value="STRING">STRING (Tier Level / Config)</option>
                    <option value="JSON">JSON (Structured payload)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Category</label>
                    <input
                      type="text"
                      value={feat.category || "Core"}
                      onChange={(e) => {
                        const updated = [...form.entitlement_features];
                        updated[idx].category = e.target.value;
                        setForm({ ...form, entitlement_features: updated });
                        setSaveStatus("unsaved");
                      }}
                      placeholder="Core"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] bg-white focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.entitlement_features.filter((_, i) => i !== idx);
                      setForm({ ...form, entitlement_features: updated });
                      setSaveStatus("unsaved");
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 mt-5"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Subscription Plans</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 05: SUBSCRIPTION PLANS */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Step 05: Subscription Pricing Plans</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">Configure pricing tiers, billing rates, trial periods, and display order</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const planCount = form.plans.length;
                const defaultNames = ["Basic", "Business", "Enterprise"];
                const planName = defaultNames[planCount] || `Plan ${planCount + 1}`;
                const updated = [
                  ...form.plans,
                  {
                    plan_code: planName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    name: planName,
                    description: `${planName} tier for growing teams`,
                    price: planCount === 0 ? 29 : planCount === 1 ? 79 : 199,
                    yearly_price: planCount === 0 ? 290 : planCount === 1 ? 790 : 1990,
                    currency: "SGD",
                    billing_interval: "monthly",
                    trial_days: 14,
                    popular: planCount === 1,
                    cta_text: planCount === 2 ? "Contact Sales" : "Select Plan",
                    status: "active",
                    features: [],
                  },
                ];
                setForm({ ...form, plans: updated });
                setSaveStatus("unsaved");
              }}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
              <span>Add Plan Tier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {form.plans.map((plan, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-white space-y-4 shadow-2xs relative">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-900 text-[15px]">{plan.name || "Plan"}</div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.plans.filter((_, i) => i !== idx);
                      setForm({ ...form, plans: updated });
                      setSaveStatus("unsaved");
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => {
                      const updated = [...form.plans];
                      updated[idx].name = e.target.value;
                      setForm({ ...form, plans: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="e.g. Starter"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Plan Code Identifier *</label>
                  <input
                    type="text"
                    value={plan.plan_code}
                    onChange={(e) => {
                      const updated = [...form.plans];
                      updated[idx].plan_code = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
                      setForm({ ...form, plans: updated });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="e.g. starter"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] font-mono focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Monthly (S$)</label>
                    <input
                      type="number"
                      min="0"
                      value={plan.price}
                      onChange={(e) => {
                        const updated = [...form.plans];
                        updated[idx].price = Number(e.target.value);
                        setForm({ ...form, plans: updated });
                        setSaveStatus("unsaved");
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] font-bold focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Yearly (S$)</label>
                    <input
                      type="number"
                      min="0"
                      value={plan.yearly_price || ""}
                      onChange={(e) => {
                        const updated = [...form.plans];
                        updated[idx].yearly_price = e.target.value ? Number(e.target.value) : null;
                        setForm({ ...form, plans: updated });
                        setSaveStatus("unsaved");
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-gray-600 mb-1">Trial Days</label>
                    <input
                      type="number"
                      min="0"
                      value={plan.trial_days}
                      onChange={(e) => {
                        const updated = [...form.plans];
                        updated[idx].trial_days = Number(e.target.value);
                        setForm({ ...form, plans: updated });
                        setSaveStatus("unsaved");
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.popular}
                        onChange={(e) => {
                          const updated = [...form.plans];
                          updated[idx].popular = e.target.checked;
                          setForm({ ...form, plans: updated });
                          setSaveStatus("unsaved");
                        }}
                        className="rounded border-gray-300 text-gray-900"
                      />
                      <span>Popular Badge</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Entitlements Matrix</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 06: ENTITLEMENTS MATRIX */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">Step 06: Plan-to-Feature Entitlements Matrix</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Map feature quotas and entitlement permissions across each plan tier with explicit unlimited configuration
            </p>
          </div>

          {form.plans.length === 0 || form.entitlement_features.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs border border-gray-200 rounded-2xl">
              Please define at least 1 feature (Step 4) and 1 subscription plan (Step 5) to configure the entitlement matrix.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-gray-50 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3.5 px-6 font-semibold">Entitlement Feature</th>
                    <th className="py-3.5 px-4 font-semibold">Type</th>
                    {form.plans.map((p, pIdx) => (
                      <th key={pIdx} className="py-3.5 px-4 font-semibold text-gray-900">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.entitlement_features.map((feat, fIdx) => (
                    <tr key={fIdx} className="hover:bg-gray-50/50">
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{feat.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{feat.feature_key}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-gray-100 text-gray-700">
                          {feat.value_type}
                        </span>
                      </td>

                      {form.plans.map((plan, pIdx) => {
                        const currentBinding = (plan.features || []).find((pf) => pf.feature_key === feat.feature_key) || {
                          feature_key: feat.feature_key,
                          enabled: true,
                          limits: { is_unlimited: false, value: null },
                        };

                        const updateBinding = (enabled: boolean, limits: any) => {
                          const updatedPlans = [...form.plans];
                          const planFeatures = [...(updatedPlans[pIdx].features || [])];
                          const existingIdx = planFeatures.findIndex((pf) => pf.feature_key === feat.feature_key);

                          const newObj = {
                            feature_key: feat.feature_key,
                            enabled,
                            limits,
                          };

                          if (existingIdx >= 0) {
                            planFeatures[existingIdx] = newObj;
                          } else {
                            planFeatures.push(newObj);
                          }

                          updatedPlans[pIdx].features = planFeatures;
                          setForm({ ...form, plans: updatedPlans });
                          setSaveStatus("unsaved");
                        };

                        return (
                          <td key={pIdx} className="py-4 px-4">
                            {feat.value_type === "BOOLEAN" && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentBinding.enabled}
                                  onChange={(e) => updateBinding(e.target.checked, currentBinding.limits)}
                                  className="rounded border-gray-300 text-gray-900"
                                />
                                <span className="text-xs font-semibold text-gray-700">
                                  {currentBinding.enabled ? "Enabled" : "Disabled"}
                                </span>
                              </label>
                            )}

                            {feat.value_type === "NUMBER" && (
                              <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(currentBinding.limits?.is_unlimited)}
                                    onChange={(e) =>
                                      updateBinding(true, {
                                        ...currentBinding.limits,
                                        is_unlimited: e.target.checked,
                                        value: e.target.checked ? null : currentBinding.limits?.value || 10,
                                      })
                                    }
                                    className="rounded border-gray-300 text-gray-900"
                                  />
                                  <span>Unlimited</span>
                                </label>
                                {!currentBinding.limits?.is_unlimited && (
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentBinding.limits?.value ?? 0}
                                    onChange={(e) =>
                                      updateBinding(true, {
                                        ...currentBinding.limits,
                                        is_unlimited: false,
                                        value: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1 rounded-md border border-gray-200 text-xs font-bold focus:outline-hidden"
                                  />
                                )}
                              </div>
                            )}

                            {feat.value_type === "STRING" && (
                              <input
                                type="text"
                                value={currentBinding.limits?.value ?? ""}
                                onChange={(e) =>
                                  updateBinding(true, {
                                    ...currentBinding.limits,
                                    value: e.target.value,
                                  })
                                }
                                placeholder="Value..."
                                className="w-32 px-2 py-1 rounded-md border border-gray-200 text-xs focus:outline-hidden"
                              />
                            )}

                            {feat.value_type === "JSON" && (
                              <span className="text-[11px] text-gray-400 font-mono">Custom JSON</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Preview & Publish</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 07: PREVIEW & PUBLISH */}
      {currentStep === 6 && (
        <div className="space-y-8">
          {/* Pre-flight Checklist */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pre-Flight Verification & Publishing Gate</h3>
                <p className="text-[13px] text-gray-500 mt-0.5">Automated validation checklist before marketplace release</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSaving || !canPublish}
                  onClick={() => handleSave("active")}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13.5px] font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
                  <span>Publish to Marketplace</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {preflightChecks.map((chk, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    chk.passed
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  <span className="text-sm">{chk.passed ? "✓" : "✕"}</span>
                  <span>{chk.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live In-Place Marketplace Renderer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <HugeiconsIcon icon={EyeIcon} className="w-4 h-4 text-blue-600" />
                <span>Live Marketplace Preview (Exact presentation renderer)</span>
              </span>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden">
              <AppDetailsView app={previewApp} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
