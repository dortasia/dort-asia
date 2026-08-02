"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search, FileText, Image as ImageIcon, Trash2, Users, Link2,
  AlertCircle, RefreshCw, X, CheckCircle2, MoreVertical, Unplug,
} from "lucide-react";

import HeaderSearchBar from "@/components/HeaderSearchBar";
import { createClient } from "@/utils/supabase/client";
import { buildStorageFileName, getStorageFolderPath, toCompanySlug as storageSlug, PRIVATE_BUCKET } from "@/utils/storageHelper";

type StorageListItem = {
  name: string;
  created_at?: string;
  metadata?: { size?: number } | null;
};

/* ─── Helpers ─────────────────────────────────────────── */
const getFileIconSrc = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return '/Icons/ExtensionIcons/PDF_file_icon.svg';
    case 'csv': return '/Icons/ExtensionIcons/csv_icon.svg';
    case 'doc':
    case 'docx': return '/Icons/ExtensionIcons/docx_icon.svg';
    case 'ppt':
    case 'pptx': return '/Icons/ExtensionIcons/pptx_icon_(2019).svg';
    case 'xls':
    case 'xlsx': return '/Icons/ExtensionIcons/xlsx_icon.svg';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp': return '/Icons/ExtensionIcons/img.svg';
    default: return '/Icons/ExtensionIcons/docx_icon.svg'; // Default fallback
  }
};

/* ─── Drive Config ─────────────────────────────────────── */
const DRIVE_CONFIG = [
  {
    key: "google_drive",
    name: "Google Drive",
    color: "#4285F4",
    bgColor: "#EAF1FF",
    connectNote: "Connects via Google OAuth — read-only storage info",
  },
];

/* ─── Connect Drive Modal ────────────────────────────────── */
function ConnectDriveModal({
  drive,
  userId,
  onClose,
}: {
  drive: typeof DRIVE_CONFIG[0];
  userId: string;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleConnect = () => {
    window.location.href = `/api/oauth/google?userId=${userId}`;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-2xl p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: drive.bgColor }}>
              <Image src="/Icons/GoogleDrive.svg" alt="Google Drive" width={24} height={24} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Connect {drive.name}</h2>
              <p className="text-[12px] text-gray-400">{drive.connectNote}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-[12px] p-4 mb-5 flex gap-3">
          <AlertCircle className="h-4 w-4 text-[#4285F4] shrink-0 mt-0.5" />
          <div className="text-[13px] text-gray-600">
            <p className="font-bold text-gray-900 mb-1">You will be redirected to Google</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500 text-[12px]">
              <li>Sign in with your Google account</li>
              <li>Grant read-only access to storage info</li>
              <li>Your real storage usage will sync automatically</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#F1F3F5] rounded-[10px] text-[13px] font-semibold text-gray-700 hover:bg-[#E5E7EB]">
            Cancel
          </button>
          <button
            onClick={handleConnect}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: drive.color }}
          >
            <Link2 className="h-4 w-4" />
            Connect with Google
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Upload File Modal ─────────────────────────────────── */
function UploadFileModal({
  isOpen,
  onClose,
  companyBucket,
  folderPath,
  onUploadSuccess,
  supabase,
  driveConnected,
  userId,
  companyId
}: {
  isOpen: boolean;
  onClose: () => void;
  companyBucket: string;
  folderPath: string;
  onUploadSuccess: () => void;
  supabase: any;
  driveConnected: boolean;
  userId?: string;
  companyId?: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreviewList, setShowPreviewList] = useState(false);
  const [destination, setDestination] = useState<"company" | "external">("company");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files as FileList)].slice(0, 10));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)].slice(0, 10));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !companyBucket) return;
    
    if (destination === "external") {
      alert("External Cloud upload requires elevated Google API scopes currently not assigned. Proceeding to securely upload to your isolated Company Storage.");
    }

    setLoading(true);

    try {
      for (const file of selectedFiles) {
        const safeCompanyId = companyId || "default";
        
        // Build standardized filename: {companyId}_{sanitizedName}_{DDMMYYYY}.{ext}
        const newFileName = buildStorageFileName({
          companyId: safeCompanyId,
          originalFileName: file.name,
        });
        const uploadPath = `${folderPath}${newFileName}`;
        
        const { error } = await supabase.storage
          .from(companyBucket)
          .upload(uploadPath, file, {
            upsert: true
          });
        
        if (error) {
          console.error("Upload error:", error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
        }
      }
      setSelectedFiles([]);
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      alert("An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[650px] bg-white rounded-[24px] shadow-2xl p-6 relative h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-bold text-gray-900">Upload File</h2>
            {driveConnected && (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-400 font-medium w-5">To</span>
                <select 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value as "company" | "external")}
                  className="text-[13px] border border-gray-200 rounded-[8px] px-2.5 py-1.5 outline-none focus:border-[#007AFF] bg-white text-gray-700 font-medium w-[220px]"
                >
                  <option value="company">Company Cloud (Default)</option>
                  <option value="external">External Cloud</option>
                </select>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setSelectedFiles([]);
              onClose();
            }} 
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {/* Drag Drop Zone or Upload Animation */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-gray-100 rounded-[16px] mb-6 bg-[#FAFAFA]">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#007AFF]/20 rounded-full animate-ping" />
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10 border border-[#E5E7EB]">
                <RefreshCw className="h-8 w-8 text-[#007AFF] animate-spin" />
              </div>
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 mb-1 animate-pulse">Uploading...</h3>
            <p className="text-[13px] text-gray-500">Securing your files to Company Storage.</p>
          </div>
        ) : (
          <div 
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-[16px] transition-colors mb-6 ${dragActive ? "border-[#007AFF] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"} cursor-pointer`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input 
              ref={inputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleChange} 
            />
            <div className="h-20 w-20 rounded-full border border-gray-200 flex items-center justify-center mb-4 bg-white shadow-sm">
              <div className="relative">
                <Image src="/Icons/DragDropIcon.svg" alt="Drag and Drop" width={32} height={32} />
              </div>
            </div>
            <p className="text-[15px] font-medium text-gray-400 max-w-[150px] text-center leading-snug">Drag and Drop the File</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-auto">
          {/* File Preview */}
          <div 
            className="flex items-center gap-3 relative"
            onMouseEnter={() => setShowPreviewList(true)}
            onMouseLeave={() => setShowPreviewList(false)}
          >
             <div className="flex -space-x-4">
              {selectedFiles.length > 0 ? (
                selectedFiles.slice(0, 3).map((file, i) => (
                  <div key={i} className="w-12 h-12 bg-[#F1F3F5] border-[2.5px] border-white rounded-[10px] flex items-center justify-center shrink-0 shadow-sm relative z-10 overflow-hidden" style={{ zIndex: 3 - i }}>
                    <Image src={getFileIconSrc(file.name)} alt="icon" width={22} height={22} />
                  </div>
                ))
              ) : (
                <div className="w-12 h-12 bg-gray-100 border-2 border-white rounded-[8px] shrink-0 opacity-50" />
              )}
             </div>
             {selectedFiles.length > 3 && (
               <span className="text-[13px] font-medium text-gray-500">+ {selectedFiles.length - 3} Files Selected</span>
             )}

             {/* Hover Dropdown */}
             {showPreviewList && selectedFiles.length > 0 && (
               <div className="absolute bottom-full left-0 mb-2 w-[280px] bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 p-2 z-[9999] max-h-[200px] overflow-y-auto page-scrollbar">
                 {selectedFiles.map((f, idx) => (
                   <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-[8px] transition-colors group">
                     <div className="flex items-center gap-2 min-w-0">
                       <Image src={getFileIconSrc(f.name)} alt="icon" width={16} height={16} className="shrink-0" />
                       <span className="text-[13px] text-gray-700 truncate font-medium">{f.name}</span>
                     </div>
                     <button
                       onClick={() => removeFile(idx)}
                       className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                     >
                       <X className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>

          <div className="flex items-center gap-5">
            <button 
              onClick={() => inputRef.current?.click()} 
              className="text-[#007AFF] text-[14px] font-medium hover:underline whitespace-nowrap"
            >
              Choose From File
            </button>
            <button 
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || loading}
              className="bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-[12px] text-[14px] font-medium transition-colors min-w-[100px] flex items-center justify-center"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const toCompanySlug = (companyName: string): string => {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/* ─── Main Page ─────────────────────────────────────────── */
export default function StoragePage() {
  const [userName, setUserName] = useState("Admin");
  const [greeting, setGreeting] = useState("Good Morning");
  const [userId, setUserId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("Your Company");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Company storage
  const [storageUsedGB, setStorageUsedGB] = useState(0);
  const [storageTotalGB, setStorageTotalGB] = useState(100);

  // Google Drive
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveUsed, setDriveUsed] = useState(0);
  const [driveTotal, setDriveTotal] = useState(0);
  const [driveAccount, setDriveAccount] = useState("");
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // File Upload & Storage State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [companyBucket, setCompanyBucket] = useState("");
  const [companyFolder, setCompanyFolder] = useState("");
  const [companyFiles, setCompanyFiles] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState({
    documents: { count: 0, size: 0 },
    images: { count: 0, size: 0 },
    recycleBin: { count: 0, size: 0 },
  });

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDriveMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Fetch all data ── */
  const fetchData = async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin";
    setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    setUserId(user.id);

    let resolvedCompanyId = user.id;
    let comp = null;

    // Check if user is Super Admin
    const { data: directComp } = await sb
      .from("company_settings")
      .select("company_id, company_name, storage_used_gb, storage_total_gb, connected_drives")
      .eq("company_id", user.id)
      .maybeSingle();

    if (directComp) {
      comp = directComp;
      resolvedCompanyId = user.id;
    } else {
      // Check if user is an employee
      const { data: emp } = await sb
        .from("employees")
        .select("company_id")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (emp && emp.company_id) {
        resolvedCompanyId = emp.company_id;
        const { data: empComp } = await sb
          .from("company_settings")
          .select("company_id, company_name, storage_used_gb, storage_total_gb, connected_drives")
          .eq("company_id", resolvedCompanyId)
          .maybeSingle();
        if (empComp) {
          comp = empComp;
        }
      }
    }

    if (comp) {
      setCompanyName(comp.company_name);
      setCompanyId(resolvedCompanyId);
      setStorageUsedGB(comp.storage_used_gb || 0);
      setStorageTotalGB(comp.storage_total_gb ?? 100);

      if (comp.connected_drives && Array.isArray(comp.connected_drives)) {
        const gd = comp.connected_drives.find((d: any) => d.key === "google_drive");
        if (gd) {
          setDriveConnected(true);
          setDriveUsed(gd.used ?? 0);
          setDriveTotal(gd.total ?? 15);
          setDriveAccount(gd.account ?? "");
        } else {
          setDriveConnected(false);
          setDriveUsed(0);
          setDriveTotal(0);
          setDriveAccount("");
        }
      } else {
        setDriveConnected(false);
        setDriveUsed(0);
        setDriveTotal(0);
        setDriveAccount("");
      }

      // Fetch Real Files from Supabase Storage using private_data bucket
      if (comp.company_name) {
        const companySlug = toCompanySlug(comp.company_name);
        const resolvedBucket = "private_data";
        const folderPath = `Company_Storage/${companySlug}/Company Storage/`;
        
        setCompanyBucket(resolvedBucket);
        setCompanyFolder(folderPath);

        const { data: files, error } = await sb.storage.from(resolvedBucket).list(folderPath);
        if (!error && files) {
          // Filter out generic folders placeholder and .gitkeep files
          const realFiles = (files as StorageListItem[]).filter(
            (f: StorageListItem) => f.name !== ".gitkeep" && f.metadata && f.metadata.size
          );
          setCompanyFiles(realFiles);

          let docCount = 0; let docSize = 0;
          let imgCount = 0; let imgSize = 0;

          realFiles.forEach((f: StorageListItem) => {
            const size = f.metadata?.size || 0;
            const ext = f.name.split('.').pop()?.toLowerCase() || '';
            const isDoc = ['pdf','doc','docx','xls','xlsx','txt','csv'].includes(ext);
            const isImg = ['jpg','jpeg','png','gif','svg','webp'].includes(ext);

            if (isDoc) { docCount++; docSize += size; }
            if (isImg) { imgCount++; imgSize += size; }
          });

          setCategoryStats({
            documents: { count: docCount, size: docSize },
            images: { count: imgCount, size: imgSize },
            recycleBin: { count: 0, size: 0 },
          });
        }
      }
    }
  };

  /* ── Load data action ── */
  const loadData = async () => {
    await fetchData();
    setToast({ msg: "✅ Storage data refreshed.", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");

    const params = new URLSearchParams(window.location.search);
    const connected = params.get("drive_connected");
    const driveError = params.get("drive_error");

    if (connected) {
      setToast({ msg: "✅ Google Drive connected! Real storage data loaded.", type: "success" });
      setTimeout(() => setToast(null), 5000);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (driveError) {
      setToast({ msg: `❌ Connection failed: ${driveError}. Please try again.`, type: "error" });
      setTimeout(() => setToast(null), 6000);
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Initial load (no toast)
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Disconnect ── */
  const handleDisconnect = async () => {
    setDriveConnected(false);
    setDriveUsed(0);
    setDriveTotal(0);
    setDriveAccount("");
    setSaving(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      await sb.from("company_settings")
        .update({ connected_drives: [] } as any)
        .eq("company_id", user.id);
      setToast({ msg: "Google Drive disconnected.", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getVisualPct = (used: number, total: number) => {
    if (total <= 0 || used <= 0) return 0;
    const raw = (used / total) * 100;
    // ensure at least 2% so the rounded pill shape is cleanly visible
    return Math.min(100, Math.max(2, raw));
  };

  const getDisplayPct = (used: number, total: number) => {
    if (total <= 0) return "0";
    const raw = (used / total) * 100;
    if (used > 0 && Math.round(raw) === 0) return "<1";
    return Math.min(100, Math.round(raw)).toString();
  };

  const usedVisualPct = getVisualPct(storageUsedGB, storageTotalGB);
  const usedDisplayPct = getDisplayPct(storageUsedGB, storageTotalGB);

  const driveVisualPct = getVisualPct(driveUsed, driveTotal);
  const driveDisplayPct = getDisplayPct(driveUsed, driveTotal);

  const formatGB = (gb: number) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(0)} TB`;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${Math.round(gb * 1024)} MB`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white">

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Your Storage</h1>
          <p className="text-[13px] text-gray-500 font-medium mt-0.5">Company Centralized Cloud Storage</p>
        </div>
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col gap-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-[14px] text-[13px] font-semibold shadow-xl flex items-center gap-2 ${
            toast.type === "success" ? "bg-[#1d1d1f] text-white" : "bg-red-600 text-white"
          }`}>
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Employee"
              className="pl-9 pr-4 py-2 w-[280px] border border-gray-200 rounded-full text-[13px] text-gray-900 focus:outline-none focus:border-gray-300 transition-colors"
            />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2 bg-[#007AFF] text-white text-[14px] font-medium rounded-full hover:bg-[#0062CC] transition-colors"
          >
            Upload
          </button>
        </div>

        {/* Top Row: Company Storage + Quick Folders */}
        <div className="grid grid-cols-[1fr_380px] gap-4">

          {/* Company Storage Card */}
          <div className="rounded-[16px] p-5 bg-[#F4F4F5] border-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0">
                <Image src="/Icons/VertexLogo.svg" alt="Vertex Logo" width={24} height={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Cloud Storage</p>
                <p className="text-[14px] font-bold text-gray-900 leading-tight">{companyName}</p>
              </div>
            </div>

            <div className="flex items-end justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold text-gray-900 leading-none">{storageUsedGB.toFixed(1)}</span>
                <span className="text-[14px] text-gray-500 font-medium">GB Used</span>
              </div>
              <span className="text-[13px] text-gray-400 font-medium">of {storageTotalGB} GB</span>
            </div>

            <div className="h-2 w-full bg-white rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${usedVisualPct}%`, backgroundColor: "#00C853" }}
              />
            </div>
            <p className="text-[12px] text-gray-400">You have used <span className="font-bold text-gray-700">{usedDisplayPct}%</span> of your storage.</p>
          </div>

          {/* Quick Folders */}
          <div className="flex flex-col gap-3">
            {/* Shared With You */}
            <div className="flex items-center gap-3 px-4 py-4 rounded-[16px] cursor-pointer hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)" }}>
              <div className="h-11 w-11 rounded-[12px] bg-white/60 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#1E3A8A]">Shared With You</p>
                <p className="text-[12px] text-[#3B82F6] font-medium mt-0.5">24 files · 1.2 GB</p>
              </div>
            </div>

            {/* Team Assets */}
            <div className="flex items-center gap-3 px-4 py-4 rounded-[16px] cursor-pointer hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)" }}>
              <div className="h-11 w-11 rounded-[12px] bg-white/60 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#4C1D95]">Team Assets</p>
                <p className="text-[12px] text-[#8B5CF6] font-medium mt-0.5">24 files · 1.2 GB</p>
              </div>
            </div>
          </div>
        </div>

        {/* External Cloud Integration */}
        <div>
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">External Cloud Integeration</h2>

          {driveConnected ? (
            /* Connected state */
            <div className="border border-[#E5E7EB] rounded-[16px] p-5 bg-white max-w-[520px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Image src="/Icons/GoogleDrive.svg" alt="Google Drive" width={30} height={30} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">External Cloud</p>
                    <p className="text-[15px] font-bold text-gray-900 leading-tight">Google Drive</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#34C759] flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setDriveMenuOpen(!driveMenuOpen)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {driveMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-[160px] bg-white rounded-[12px] shadow-lg border border-[#E5E7EB] py-1.5 z-50">
                        <button
                          onClick={() => { setDriveMenuOpen(false); loadData(); }}
                          className="w-full px-4 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-[#F8F9FA] flex items-center gap-2 transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Refresh Data
                        </button>
                        <button
                          onClick={() => { setDriveMenuOpen(false); handleDisconnect(); }}
                          className="w-full px-4 py-2 text-left text-[13px] font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Unplug className="h-3.5 w-3.5" />
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between mb-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] font-bold text-gray-900 leading-none">{driveUsed.toFixed(2)}</span>
                  <span className="text-[13px] text-gray-500 font-medium">GB Used</span>
                </div>
                <span className="text-[13px] text-gray-400 font-medium">of {formatGB(driveTotal)}</span>
              </div>

              <div className="h-2 w-full bg-[#F0F0F0] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${driveVisualPct}%`, backgroundColor: "#4285F4" }}
                />
              </div>

              {driveAccount && (
                <p className="text-[12px] text-gray-400">Storage used by <span className="font-semibold text-gray-600">{driveAccount}</span></p>
              )}
            </div>
          ) : (
            /* Disconnected state */
            <div className="border border-dashed border-[#D1D5DB] rounded-[16px] p-5 bg-white max-w-[520px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-[12px] bg-[#EAF1FF] flex items-center justify-center">
                  <Image src="/Icons/GoogleDrive.svg" alt="Google Drive" width={24} height={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">External Cloud</p>
                  <p className="text-[15px] font-bold text-gray-900">Google Drive</p>
                  <p className="text-[12px] text-gray-400">Not connected</p>
                </div>
              </div>
              <button
                onClick={() => setConnectingDrive(true)}
                className="px-4 py-2 bg-[#4285F4] text-white text-[13px] font-semibold rounded-[10px] hover:bg-[#3367D6] transition-colors flex items-center gap-1.5"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect
              </button>
            </div>
          )}

          {saving && (
            <p className="text-[12px] text-gray-400 mt-2 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> Saving…
            </p>
          )}
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">Categories</h2>
          <div className="flex gap-3">
            {[
              { name: "Documents", icon: FileText,  color: "#2563EB", bg: "#EBF5FF", count: categoryStats.documents.count, size: formatSize(categoryStats.documents.size) },
              { name: "Images",    icon: ImageIcon,  color: "#D97706", bg: "#FFFBEB", count: categoryStats.images.count, size: formatSize(categoryStats.images.size) },
              { name: "Recycle Bin", icon: Trash2,  color: "#DC2626", bg: "#FEF2F2", count: categoryStats.recycleBin.count, size: formatSize(categoryStats.recycleBin.size) },
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={i}
                  className="group border border-[#E5E7EB] rounded-[16px] p-5 bg-white cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all w-[150px]"
                >
                  <div
                    className="h-10 w-10 rounded-[10px] flex items-center justify-center mb-3 relative"
                    style={{ backgroundColor: cat.bg }}
                  >
                    {cat.name === "Documents" ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute transition-all duration-300 transform -translate-x-1 group-hover:-translate-x-3.5 group-hover:-translate-y-0.5 group-hover:-rotate-12 opacity-70 group-hover:opacity-90">
                          <Image src="/Icons/ExtensionIcons/xlsx_icon.svg" alt="xlsx" width={16} height={16} />
                        </div>
                        <div className="absolute transition-all duration-300 transform translate-x-1 group-hover:translate-x-3.5 group-hover:-translate-y-0.5 group-hover:rotate-12 opacity-70 group-hover:opacity-90">
                          <Image src="/Icons/ExtensionIcons/PDF_file_icon.svg" alt="pdf" width={16} height={16} />
                        </div>
                        <div className="absolute transition-all duration-300 transform group-hover:-translate-y-1.5 z-10">
                          <Image src="/Icons/ExtensionIcons/docx_icon.svg" alt="docx" width={18} height={18} />
                        </div>
                      </div>
                    ) : (
                      <Icon className="h-5 w-5" style={{ color: cat.color }} />
                    )}
                  </div>
                  <p className="text-[14px] font-bold text-gray-900">{cat.name}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {cat.count} Files · <span className="font-bold" style={{ color: cat.color }}>{cat.size}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recents */}
        <div>
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">Recents</h2>
          <div className="border border-[#E5E7EB] rounded-[16px] overflow-hidden bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_200px_150px_180px_100px] gap-4 px-5 py-3 bg-[#F8F9FA] border-b border-[#E5E7EB]">
              <div className="w-5" />
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">File Name</p>
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Date Uploaded</p>
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">File Size</p>
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Uploaded By</p>
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide text-right">Actions</p>
            </div>

            {/* Rows */}
            {companyFiles.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-[13px] font-medium">No recents found. Upload a file manually.</div>
            ) : (
              companyFiles.slice().sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((file, i) => {
                const dateObj = new Date(file.created_at);
                const dateUploaded = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
                
                // Friendly display name for the UI
                let displayName = file.name;
                const parts = file.name.split('__');
                if (parts.length >= 3) {
                  displayName = `${parts[1]} - ${parts.slice(2).join('__')}`;
                }

                const handleDownload = async () => {
                  try {
                    const sb = createClient();
                    const fullPath = `${companyFolder}${file.name}`;
                    const { data, error } = await sb.storage.from(companyBucket).download(fullPath);
                    if (error) throw error;
                    
                    let downloadName = file.name;
                    if (parts.length >= 3) {
                      const employeeName = parts[1];
                      const categoryAndExt = parts.slice(2).join('__');
                      downloadName = `${employeeName}_${categoryAndExt}`;
                    }

                    const url = window.URL.createObjectURL(data);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = downloadName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (err: any) {
                    console.error("Download failed:", err);
                    alert(`Download failed: ${err.message}`);
                  }
                };

                const handlePreview = async () => {
                  const newWindow = window.open('', '_blank');
                  if (!newWindow) {
                    alert("Popup blocked! Please allow popups for this site.");
                    return;
                  }
                  
                  newWindow.document.write(`
                    <html>
                      <head>
                        <title>Loading Preview...</title>
                        <style>
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #F8F9FA;
                            color: #4B5563;
                          }
                          .loader {
                            text-align: center;
                          }
                          .spinner {
                            border: 3px solid #E5E7EB;
                            border-top: 3px solid #007AFF;
                            border-radius: 50%;
                            width: 30px;
                            height: 30px;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 15px auto;
                          }
                          @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="loader">
                          <div class="spinner"></div>
                          <p>Generating secure preview link...</p>
                        </div>
                      </body>
                    </html>
                  `);
                  
                  try {
                    const sb = createClient();
                    const fullPath = `${companyFolder}${file.name}`;
                    const { data, error } = await sb.storage
                      .from(companyBucket)
                      .createSignedUrl(fullPath, 3600); // 1 hour expiry
                    
                    if (error) throw error;
                    
                    if (data?.signedUrl) {
                      newWindow.location.href = data.signedUrl;
                    } else {
                      throw new Error("No signed URL was returned");
                    }
                  } catch (err: any) {
                    console.error("Preview failed:", err);
                    newWindow.document.body.innerHTML = `
                      <div style="text-align: center; max-width: 400px; padding: 20px;">
                        <svg style="width: 48px; height: 48px; color: #DC2626; margin-bottom: 15px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <p style="font-weight: 600; color: #111827; margin-bottom: 5px;">Failed to Open Preview</p>
                        <p style="color: #6B7280; font-size: 14px; margin-bottom: 20px;">${err.message || 'An unknown error occurred while retrieving the file.'}</p>
                        <button onclick="window.close()" style="background-color: #007AFF; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;">Close Window</button>
                      </div>
                    `;
                  }
                };

                return (
                  <div
                    key={file.id || i}
                    className="grid grid-cols-[auto_1fr_200px_150px_180px_100px] gap-4 px-5 py-3.5 border-b border-[#F1F3F5] hover:bg-[#FAFAFA] transition-colors items-center"
                  >
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-[#4285F4]" />
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-[6px] bg-[#F8F9FA] flex items-center justify-center shrink-0 border border-gray-100">
                        <Image src={getFileIconSrc(file.name)} alt="icon" width={16} height={16} />
                      </div>
                      <span 
                        onClick={handlePreview}
                        className="text-[13px] font-semibold text-gray-900 truncate cursor-pointer hover:underline hover:text-[#007AFF] transition-colors" 
                        title={`Click to preview: ${file.name}`}
                      >
                        {displayName}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-500">{dateUploaded}</p>
                    <p className="text-[13px] text-gray-500">{formatSize(file.metadata?.size || 0)}</p>
                    <p className="text-[13px] text-gray-500 truncate">Admin</p>
                    <div className="flex justify-end">
                      <button 
                        onClick={handleDownload}
                        className="text-[12px] font-bold text-[#007AFF] hover:underline px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Empty space to fill */}
            <div className="h-32" />
          </div>
        </div>

      </main>

      {/* Connect Drive Modal */}
      {connectingDrive && (
        <ConnectDriveModal
          drive={DRIVE_CONFIG[0]}
          userId={userId}
          onClose={() => setConnectingDrive(false)}
        />
      )}

      {/* Upload File Modal */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        companyBucket={companyBucket}
        folderPath={companyFolder}
        onUploadSuccess={loadData}
        supabase={createClient()}
        driveConnected={driveConnected}
        userId={userId}
        companyId={companyId}
      />
    </div>
  );
}
