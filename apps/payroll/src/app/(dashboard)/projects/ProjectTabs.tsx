"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, Filter, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, LayoutList, LayoutGrid, X, Check, Eye, Edit2, Plus, Trash2, Save, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

/* ─── Types ─────────────────────────────────────── */
type ProjectStatus = "Active" | "Closed" | "On Hold";
type ProjectCategory = "Construction" | "Marine" | "Tech" | "Finance" | "Design";

type Project = {
  id: string;
  code: string;
  name: string;
  image: string;
  client: string;
  clientInitials: string;
  owner: string;
  ownerColor: string;
  ownerBg: string;
  category: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number;
  financials: string;
  profit: string;
  classification?: string;
};

interface ProjectTabsProps {
  projects: Project[];
  companySettings: any;
  onRefresh: () => void;
}

/* ─── Category Badge ─────────────────────────────── */
const categoryStyle: Record<ProjectCategory, { bg: string; text: string; icon: string }> = {
  Construction: { bg: "#EEF2FF", text: "#4338CA", icon: "🏗️" },
  Marine:       { bg: "#EFF6FF", text: "#1D4ED8", icon: "⚓" },
  Tech:         { bg: "#FEF9C3", text: "#A16207", icon: "⚙️" },
  Finance:      { bg: "#DCFCE7", text: "#15803D", icon: "📊" },
  Design:       { bg: "#FCE7F3", text: "#BE185D", icon: "🎨" },
};

const statusStyle: Record<ProjectStatus, { dot: string; text: string }> = {
  Active:  { dot: "#22C55E", text: "#166534" },
  Closed:  { dot: "#9CA3AF", text: "#6B7280" },
  "On Hold": { dot: "#F59E0B", text: "#92400E" },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const formatSingaporePhone = (value: string) => {
  if (value.length <= 3) {
    return "+65";
  }
  
  // 1. Keep only '+' and digits
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // 2. Handle explicit '+65' at the start
  if (cleaned.startsWith('+65')) {
    let digits = cleaned.slice(3).replace(/\D/g, '');
    if (digits.length > 8) digits = digits.slice(0, 8);
    return `+65${digits}`;
  }
  
  // 3. Extract all digits
  let digits = cleaned.replace(/\D/g, '');
  
  // 4. If starts with '65' and has more than 8 digits, strip country code '65'
  if (digits.startsWith('65') && digits.length > 8) {
    digits = digits.slice(2);
  }
  
  // 5. Limit local digits to 8
  if (digits.length > 8) digits = digits.slice(0, 8);
  
  // 6. Return country code + local digits
  return `+65${digits}`;
};

export default function ProjectTabs({ projects, companySettings, onRefresh }: ProjectTabsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [filterOpen, setFilterOpen] = useState(false);

  // CRUD & Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleClosePanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 300);
  };

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formClassification, setFormClassification] = useState<"Internal Project" | "External Project">("Internal Project");
  const [formClient, setFormClient] = useState("");
  const [formClientCompany, setFormClientCompany] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formClientPhone, setFormClientPhone] = useState("+65");
  const [formOwner, setFormOwner] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Construction");
  const [formStatus, setFormStatus] = useState<ProjectStatus>("Active");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formProgress, setFormProgress] = useState(0);
  const [formFinancials, setFormFinancials] = useState("S$ 0.00");
  const [formProfit, setFormProfit] = useState("S$ 0.00");

  const [employees, setEmployees] = useState<any[]>([]);
  const [managerSearchOpen, setManagerSearchOpen] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const managerSelectRef = useRef<HTMLDivElement>(null);
  
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const categorySelectRef = useRef<HTMLDivElement>(null);

  const [showSetupConfirm, setShowSetupConfirm] = useState(false);
  const [createdProjectDetails, setCreatedProjectDetails] = useState<any>(null);

  useEffect(() => {
    async function loadEmployees() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, emp_id, avatar_url, role')
        .eq('company_id', user.id)
        .order('name', { ascending: true });
      if (!error && data) {
        setEmployees(data);
      }
    }
    if (isModalOpen) {
      loadEmployees();
    }
  }, [isModalOpen, supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (managerSelectRef.current && !managerSelectRef.current.contains(event.target as Node)) {
        setManagerSearchOpen(false);
      }
      if (categorySelectRef.current && !categorySelectRef.current.contains(event.target as Node)) {
        setCategorySearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);

  // Staged (applied only on "Apply")
  const [stagedStatus, setStagedStatus]     = useState<string[]>([]);
  const [stagedCategory, setStagedCategory] = useState<string[]>([]);
  const [stagedOwner, setStagedOwner]       = useState<string[]>([]);

  const openFilter = () => {
    setStagedStatus([...statusFilter]);
    setStagedCategory([...categoryFilter]);
    setStagedOwner([...ownerFilter]);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setStatusFilter(stagedStatus);
    setCategoryFilter(stagedCategory);
    setOwnerFilter(stagedOwner);
    setPage(1);
    setFilterOpen(false);
  };

  const resetFilter = () => {
    setStagedStatus([]);
    setStagedCategory([]);
    setStagedOwner([]);
  };

  const activeFilterCount = statusFilter.length + categoryFilter.length + ownerFilter.length;

  const toggle = (arr: string[], val: string, set: React.Dispatch<React.SetStateAction<string[]>>) => {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase()) || p.owner.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = statusFilter.length   === 0 || statusFilter.includes(p.status);
    const matchCategory = categoryFilter.length === 0 || categoryFilter.includes(p.category);
    const matchOwner    = ownerFilter.length    === 0 || ownerFilter.includes(p.owner);
    return matchSearch && matchStatus && matchCategory && matchOwner;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const owners     = Array.from(new Set(projects.map(p => p.owner)));
  const statuses   = ["Active", "Closed", "On Hold"] as const;
  const categories = ["Construction", "Marine", "Tech", "Finance", "Design"] as const;

  // Open modal for Create Project
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId("");
    setFormName("");
    // Prefill sequential project code manually matching the RT0001PRJ26 pattern
    const nextSeq = String(projects.length + 1).padStart(4, '0');
    setFormCode(`RT${nextSeq}PRJ26`);
    setFormClassification("Internal Project");
    setFormClient("");
    setFormClientCompany("");
    setFormClientName("");
    setFormClientEmail("");
    setFormClientPhone("+65");
    setFormOwner("");
    setFormCategory("Construction");
    setFormStatus("Active");
    setFormStartDate("");
    setFormEndDate("");
    setFormProgress(0);
    setFormFinancials("S$ 1.00");
    setFormProfit("S$ 0.20");
    setModalError("");
    setIsModalOpen(true);
  };

  // Open modal for Edit Project
  const handleOpenEdit = (proj: Project) => {
    router.push(`/projects/setup?id=${proj.id}`);
  };

  const handleSaveProject = async () => {
    const finalClientCompany = formClassification === "Internal Project" ? "Internal" : "External";
    if (!formName.trim() || !formCode.trim() || !formOwner.trim() || !formStartDate.trim() || !formEndDate.trim()) {
      setModalError("Please fill out all required fields.");
      return;
    }

    setSaving(true);
    try {
      const finalOwner = formOwner.trim();
      let newProj: any = null;

      if (isEditing) {
        // UPDATE in projects table
        const { error } = await supabase
          .from('projects')
          .update({
            project_name: formName.trim(),
            project_code: formCode.trim(),
            client_company: finalClientCompany,
            classification: formClassification,
            owner: finalOwner,
            project_type: formCategory,
            project_status: formStatus === 'Active' ? 'On Process' : formStatus,
            start_date: formStartDate || null,
            end_date: formEndDate || null,
            progress: Number(formProgress),
            financials: formFinancials,
            profit: formProfit,
          })
          .eq('id', editingId);
        if (error) throw error;
        setIsModalOpen(false);
        onRefresh();
      } else {
        // INSERT into projects table
        const { data: inserted, error } = await supabase
          .from('projects')
          .insert({
            company_id: companySettings.company_id,
            project_name: formName.trim(),
            project_code: formCode.trim(),
            client_company: finalClientCompany,
            classification: formClassification,
            owner: finalOwner,
            project_type: formCategory,
            project_status: formStatus === 'Active' ? 'On Process' : formStatus,
            start_date: formStartDate || null,
            end_date: formEndDate || null,
            progress: Number(formProgress),
            financials: formFinancials,
            profit: formProfit,
            image: (categoryStyle[formCategory as ProjectCategory]?.icon) || '🏗️',
            is_draft: false,
          })
          .select()
          .single();
        if (error) throw error;
        newProj = {
          id: inserted.id,
          code: formCode.trim(),
          name: formName.trim(),
        };
        setCreatedProjectDetails(newProj);
        handleClosePanel();
        onRefresh();
        setTimeout(() => {
          setShowSetupConfirm(true);
        }, 300);
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: string, name: string) => {
    if (id === "default-project" || name === "Default Project" || name === "Company Expenditure") {
      alert("The Company Expenditure project is a system-level project and cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;

    try {
      // DELETE from projects table by UUID
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert("Failed to delete project: " + err.message);
    }
  };

  return (
    <div className="flex flex-col relative">

      {/* ── Filter Side Panel Backdrop ── */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* ── Filter Side Panel ── */}
      <div
        className={`fixed top-0 right-0 h-full w-[360px] z-50 bg-white dark:bg-[#0B0B0F] shadow-[0_0_60px_rgba(0,0,0,0.18)] flex flex-col transition-transform duration-300 ease-in-out ${
          filterOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F2F2F7] dark:border-[#2A2A31] shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#007AFF]" />
            <span className="text-[16px] font-bold text-gray-900 dark:text-white">Filters</span>
            {(stagedStatus.length + stagedCategory.length + stagedOwner.length) > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#007AFF] text-white text-[11px] font-bold flex items-center justify-center">
                {stagedStatus.length + stagedCategory.length + stagedOwner.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setFilterOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-[#F2F2F7] dark:hover:bg-[#1C1C22] hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-7">

          {/* Status */}
          <div>
            <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => {
                const active = stagedStatus.includes(s);
                const dot = statusStyle[s as ProjectStatus].dot;
                return (
                  <button
                    key={s}
                    onClick={() => toggle(stagedStatus, s, setStagedStatus)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-all ${
                      active
                        ? "bg-[#007AFF] text-white border-[#007AFF] shadow-sm"
                        : "bg-white dark:bg-[#1C1C22] border-[#E5E5EA] dark:border-[#2A2A31] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/50"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "#fff" : dot }} />
                    {s}
                    {active && <Check size={11} className="ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => {
                const active = stagedCategory.includes(c);
                const style  = categoryStyle[c as ProjectCategory];
                return (
                  <button
                    key={c}
                    onClick={() => toggle(stagedCategory, c, setStagedCategory)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-all ${
                      active
                        ? "bg-[#007AFF] text-white border-[#007AFF] shadow-sm"
                        : "bg-white dark:bg-[#1C1C22] border-[#E5E5EA] dark:border-[#2A2A31] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/50"
                    }`}
                  >
                    <span>{style?.icon}</span>
                    {c}
                    {active && <Check size={11} className="ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Owner */}
          <div>
            <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Project Manager / Owner</p>
            <div className="flex flex-col gap-2">
              {owners.length === 0 ? (
                <span className="text-[13px] text-gray-400 font-medium">No managers available.</span>
              ) : owners.map(o => {
                const active = stagedOwner.includes(o);
                return (
                  <button
                    key={o}
                    onClick={() => toggle(stagedOwner, o, setStagedOwner)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left text-[13.5px] font-bold transition-all ${
                      active
                        ? "bg-[#E5F1FF] dark:bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]"
                        : "bg-white dark:bg-[#1C1C22] border-[#E5E5EA] dark:border-[#2A2A31] text-gray-800 dark:text-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span>{o}</span>
                    {active && <Check size={15} />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Panel Footer */}
        <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2A2A31] shrink-0 flex items-center gap-4 bg-gray-50/50 dark:bg-[#111116]/50">
          <button
            onClick={resetFilter}
            className="flex-1 py-3 bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] hover:bg-gray-50 text-gray-800 dark:text-gray-200 text-[13px] font-bold rounded-xl transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={applyFilter}
            className="flex-1 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13px] font-bold rounded-xl shadow-sm transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* ── Action Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        
        {/* Left Side: Search + Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, clients..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-full text-[13px] font-medium outline-none transition-colors placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20"
            />
          </div>

          <button
            onClick={openFilter}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all ${
              activeFilterCount > 0
                ? "bg-[#E5F1FF] dark:bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]"
                : "bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            <Filter size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Side: View Mode + Create Project */}
        <div className="flex items-center gap-3">
          
          {/* Toggle list/grid */}
          <div className="bg-[#F2F2F7] dark:bg-[#1C1C22] p-0.5 rounded-[10px] flex items-center shadow-inner">
            <button
              onClick={() => setViewMode("table")}
              className={`h-8 px-3 rounded-[8px] flex items-center gap-1.5 text-[12px] font-bold transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#2A2A31] text-[#007AFF] shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-white"
              }`}
            >
              <LayoutList size={14} />
              List
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`h-8 px-3 rounded-[8px] flex items-center gap-1.5 text-[12px] font-bold transition-all ${
                viewMode === "card"
                  ? "bg-white dark:bg-[#2A2A31] text-[#007AFF] shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-white"
              }`}
            >
              <LayoutGrid size={14} />
              Grid
            </button>
          </div>

          {/* Create Project Button */}
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-6 py-2 bg-[#007AFF] text-white text-[13px] font-semibold rounded-[10px] shadow-sm hover:bg-[#0062CC] transition-colors"
          >
            <Plus size={16} />
            Setup Project
          </button>
        </div>
      </div>

      {/* ── Card View ──────────────────────────────── */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          {paged.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[14px] text-gray-400 font-medium bg-white dark:bg-[#1C1C22] border border-[#F2F2F7] dark:border-[#2A2A31] rounded-[16px]">
              No projects found.
            </div>
          ) : paged.map(p => {
            const cat = categoryStyle[p.category as ProjectCategory];
            const stat = statusStyle[p.status];
            return (
              <div 
                key={p.id} 
                onClick={() => router.push(`/projects/${p.id}`)}
                className="bg-white dark:bg-[#1C1C22] border border-[#F2F2F7] dark:border-[#2A2A31] rounded-[16px] p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col gap-3 group relative overflow-hidden cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
                      style={{ backgroundColor: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).color }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{p.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEdit(p)}
                      title="Edit"
                      className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-500 hover:text-gray-900"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(p.id, p.name)}
                      title="Delete"
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                  <span>Client: <span className="font-bold text-gray-800 dark:text-gray-200">{p.client}</span></span>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <div className="flex items-center justify-between text-[11.5px] font-bold">
                    <span style={{ color: cat?.text || "#4338CA" }} className="flex items-center gap-1">
                      <span>{cat?.icon}</span> {p.category}
                    </span>
                    <span className="text-gray-900 dark:text-white">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${p.progress}%`,
                        backgroundColor: p.progress === 100 ? "#34C759" : "#007AFF" 
                      }} 
                    />
                  </div>
                </div>

                {/* Dates / Financials card footer */}
                <div className="pt-2.5 mt-1 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Financials</span>
                    <span className="text-[12.5px] font-black text-gray-900 dark:text-white">{p.financials}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Status</span>
                    <span className="text-[12px] font-extrabold flex items-center gap-1.5" style={{ color: stat?.text }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stat?.dot }} />
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table View ─────────────────────────────── */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-[#1C1C22] border border-[#F2F2F7] dark:border-[#2A2A31] rounded-[16px] overflow-hidden">
          <div className="w-full overflow-x-auto page-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F2F2F7] dark:border-[#2A2A31] bg-gray-50/50 dark:bg-[#111116]/20">
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Project Details</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Client</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Owner / Manager</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Status</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Start Date</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">End Date</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Financials</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[14px] text-gray-400 font-medium">
                      No projects found.
                    </td>
                  </tr>
                ) : paged.map((p) => {
                  const stat = statusStyle[p.status];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {/* Project */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-9 w-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                            style={{ backgroundColor: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).color }}
                          >
                            {getInitials(p.name)}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">{p.name}</p>
                            <p className="text-[12px] font-medium text-gray-400 mt-0.5">{p.code}</p>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{p.client}</span>
                      </td>

                      {/* Owner */}
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: p.ownerColor }}>{p.owner}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className="text-[13px] font-bold flex items-center gap-1.5"
                          style={{ color: stat?.text }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stat?.dot }} />
                          {p.status}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="px-5 py-4 text-[13px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{p.startDate}</td>

                      {/* End Date */}
                      <td className="px-5 py-4 text-[13px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{p.endDate}</td>

                      {/* Financials */}
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">{p.financials}</p>
                        <p className="text-[11px] font-semibold text-[#F97316] mt-0.5">Profit: {p.profit}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}
                            title="Edit"
                            className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-[8px] transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id, p.name); }}
                            title="Delete"
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[8px] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────── */}
      <div className="flex items-center justify-between mt-4 px-1">
        {/* Count */}
        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
          Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} projects
        </span>

        {/* Pages + size */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3),
            Math.max(4, page + 1)
          ).map(pg => (
            <button
              key={pg}
              onClick={() => setPage(pg)}
              className={`h-8 w-8 flex items-center justify-center rounded-[8px] text-[13px] font-bold transition-colors ${
                pg === page
                  ? "bg-[#007AFF] text-white shadow-sm"
                  : "bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/40"
              }`}
            >
              {pg}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>

          {/* Page size */}
          <div className="relative ml-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="appearance-none bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[8px] pl-3 pr-7 py-1.5 text-[12px] font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Create / Edit Project Side Panel Drawer ── */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20`}
            onClick={handleClosePanel}
          />

          {/* Sidebar Panel Drawer */}
          <div 
            className={`fixed inset-y-0 right-0 z-[10000] w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 shrink-0 border-b border-gray-100 dark:border-[#2C2C35]">
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Project Details" : "Create New Project"}
              </h2>
              <button 
                onClick={handleClosePanel}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 page-scrollbar">
              
              {/* Project Name */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-2.5">Project Name *</h3>
                <input
                  type="text"
                  placeholder="Enter Project Name"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
              </div>

              {/* Project Classification */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-2.5">Project Classification *</h3>
                <div className="relative">
                  <select
                    value={formClassification}
                    onChange={e => setFormClassification(e.target.value as any)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent appearance-none cursor-pointer"
                  >
                    <option value="Internal Project">Internal Project</option>
                    <option value="External Project">External Project</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Project Category / Type (Dynamic Select) */}
              <div className="flex flex-col gap-2 relative" ref={categorySelectRef}>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Project Category *</h3>
                
                {categorySearchOpen ? (
                  <div className="w-full relative">
                    <input 
                      type="text"
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      placeholder={formCategory ? formCategory : "Type category..."}
                      className="w-full h-[52px] px-4 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#007AFF] dark:border-[#007AFF] rounded-[14px] text-[13.5px] font-bold outline-none transition-colors shadow-sm shadow-[#007AFF]/10 pr-10 animate-in fade-in duration-200"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ChevronDown 
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategorySearchOpen(false);
                      }}
                    />
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      setCategorySearchOpen(true);
                      setCategorySearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-transparent hover:border-[#007AFF] dark:hover:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors`}
                  >
                    <span className="text-[13.5px] font-bold truncate">
                      {formCategory || "Select a category..."}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
                  </button>
                )}

                {categorySearchOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="p-4 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50 absolute top-[85px] left-0 right-0"
                  >
                    <div className="max-h-[160px] overflow-y-auto page-scrollbar flex flex-col gap-1">
                      {(() => {
                        const defaultCategories = ["Construction", "Marine", "Tech", "Finance", "Design"];
                        const allCategories = Array.from(
                          new Set([
                            ...defaultCategories,
                            ...projects
                              .map((p: any) => p.category)
                              .filter((t: any) => typeof t === "string" && t.trim() !== "")
                          ])
                        );
                        const catQuery = categorySearchQuery.toLowerCase().trim();
                        const filteredCategories = allCategories.filter(cat =>
                          cat.toLowerCase().includes(catQuery)
                        );
                        const showAddCategoryOption = categorySearchQuery.trim() !== "" && !allCategories.some(cat => cat.toLowerCase() === categorySearchQuery.trim().toLowerCase());

                        return (
                          <>
                            {filteredCategories.map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFormCategory(cat);
                                  setCategorySearchOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                                  formCategory === cat 
                                    ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold' 
                                    : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <span className="text-[12.5px] font-bold leading-tight">{cat}</span>
                                {formCategory === cat && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
                              </button>
                            ))}
                            
                            {showAddCategoryOption && (
                              <button
                                key="add-new-category"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const newCat = categorySearchQuery.trim();
                                  setFormCategory(newCat);
                                  setCategorySearchOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[12.5px] font-bold text-[#007AFF] hover:bg-[#007AFF]/5 transition-colors"
                              >
                                <Plus size={14} /> Add &quot;{categorySearchQuery.trim()}&quot;
                              </button>
                            )}

                            {filteredCategories.length === 0 && !showAddCategoryOption && (
                              <span className="text-[12px] text-gray-400 py-3 text-center">No categories matching</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Project ID */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-2.5">Project ID *</h3>
                <input
                  type="text"
                  placeholder="Enter Project ID"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
              </div>

              {/* Project Manager */}
              {(() => {
                const selectedManager = employees.find(emp => emp.name === formOwner) || (formOwner ? { name: formOwner, id: "legacy-manager" } : null);
                return (
                  <div className="flex flex-col gap-2 relative" ref={managerSelectRef}>
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Project Manager *</h3>
                    
                    {managerSearchOpen ? (
                      <div className="w-full relative">
                        <input 
                          type="text"
                          value={managerSearchQuery}
                          onChange={(e) => setManagerSearchQuery(e.target.value)}
                          placeholder={selectedManager ? selectedManager.name : "Type name or Employee ID..."}
                          className="w-full h-[52px] px-4 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#007AFF] dark:border-[#007AFF] rounded-[14px] text-[13.5px] font-bold outline-none transition-colors shadow-sm shadow-[#007AFF]/10 pr-10 animate-in fade-in duration-200"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ChevronDown 
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setManagerSearchOpen(false);
                          }}
                        />
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation();
                          setManagerSearchOpen(true);
                          setManagerSearchQuery("");
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 ${selectedManager ? "bg-white" : "bg-gray-50"} dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF] dark:hover:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors`}
                      >
                        {selectedManager ? (
                          <div className="flex items-center gap-3">
                            {selectedManager.avatar_url ? (
                              <img 
                                src={selectedManager.avatar_url} 
                                alt={selectedManager.name}
                                className="h-6 w-6 rounded-full object-cover shrink-0 shadow-sm"
                              />
                            ) : (
                              <div 
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm"
                                style={{ 
                                  backgroundColor: getAvatarColor(selectedManager.name).bg, 
                                  color: getAvatarColor(selectedManager.name).color 
                                }}
                              >
                                {getInitials(selectedManager.name)}
                              </div>
                            )}
                            <span className="text-[13.5px] font-bold truncate max-w-[180px]">
                              {selectedManager.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[13.5px] font-medium text-gray-400">Select an employee...</span>
                        )}
                        <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
                      </button>
                    )}

                    {managerSearchOpen && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="p-4 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50 absolute top-[85px] left-0 right-0"
                      >
                        {/* List */}
                        <div className="max-h-[160px] overflow-y-auto page-scrollbar flex flex-col gap-1">
                          {(() => {
                            const query = managerSearchQuery.toLowerCase().trim();
                            const filtered = employees.filter(emp => {
                              if ((emp.role || "").toLowerCase() !== "admin") return false;
                              if (query === "") return true;
                              const nameMatch = (emp.name || "").toLowerCase().includes(query);
                              const idMatch = (emp.emp_id || "").toLowerCase().includes(query);
                              return nameMatch || idMatch;
                            });
                            const displayed = filtered.slice(0, 10);

                            return (
                              <>
                                {displayed.map(emp => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setFormOwner(emp.name);
                                      setManagerSearchOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                                      formOwner === emp.name 
                                        ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold' 
                                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {emp.avatar_url ? (
                                        <img 
                                          src={emp.avatar_url} 
                                          alt={emp.name}
                                          className="h-6 w-6 rounded-full object-cover shrink-0 shadow-sm"
                                        />
                                      ) : (
                                        <div 
                                          className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm"
                                          style={{ 
                                            backgroundColor: getAvatarColor(emp.name).bg, 
                                            color: getAvatarColor(emp.name).color 
                                          }}
                                        >
                                          {getInitials(emp.name)}
                                        </div>
                                      )}
                                      <div className="flex flex-col">
                                        <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white leading-tight">
                                          {emp.name}
                                        </span>
                                        {emp.emp_id && (
                                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                            {emp.emp_id}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {formOwner === emp.name && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
                                  </button>
                                ))}
                                {filtered.length === 0 && (
                                  <span className="text-[12px] text-gray-400 py-3 text-center">No matching employees</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}



              {/* Start & End Date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-2.5">Start Date *</h3>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                {/* End Date */}
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-2.5">End Date *</h3>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-[#2C2C35] bg-[#F8F9FA] dark:bg-[#1C1C1E] flex flex-col gap-3 shrink-0">
              {modalError && (
                <div className="text-[12px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-3.5 py-2 rounded-[10px] border border-red-100 dark:border-red-900/30">
                  {modalError}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClosePanel}
                  className="flex-1 py-3 bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] hover:bg-gray-50 text-gray-800 dark:text-gray-200 text-[13.5px] font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProject}
                  disabled={saving}
                  className="flex-1 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13.5px] font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      {isEditing ? "Save Changes" : "Create Project"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Setup Confirmation Popup Modal */}
      {showSetupConfirm && createdProjectDetails && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2A2A31] w-full max-w-[460px] rounded-3xl shadow-2xl p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-300 text-left">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[#E5F1FF] dark:bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-1.5">Project Draft Created</h2>
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed px-4">
                  Your project draft was successfully saved. Would you like to proceed with the comprehensive Singapore setup wizard?
                </p>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-[#F8F9FA] dark:bg-[#121217] rounded-2xl p-4 border border-gray-100/50 dark:border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-gray-200/40 dark:border-white/5">
                <span className="text-gray-500 font-medium">Project Name</span>
                <span className="text-gray-900 dark:text-white font-bold max-w-[220px] truncate">{createdProjectDetails.name}</span>
              </div>
              <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-gray-200/40 dark:border-white/5">
                <span className="text-gray-500 font-medium">Project ID</span>
                <span className="text-gray-900 dark:text-white font-bold">{createdProjectDetails.code}</span>
              </div>
              <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-gray-200/40 dark:border-white/5">
                <span className="text-gray-500 font-medium">Client Company</span>
                <span className="text-gray-900 dark:text-white font-bold max-w-[220px] truncate">{createdProjectDetails.client}</span>
              </div>
              <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-gray-200/40 dark:border-white/5">
                <span className="text-gray-500 font-medium">Project Manager</span>
                <span className="text-gray-900 dark:text-white font-bold">{createdProjectDetails.owner}</span>
              </div>
              <div className="flex justify-between items-center text-[12.5px] py-1">
                <span className="text-gray-500 font-medium">Timeline</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {createdProjectDetails.startDate || "-"} to {createdProjectDetails.endDate || "-"}
                </span>
              </div>
            </div>

            {/* Actions Symmetrical Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSetupConfirm(false);
                  setIsModalOpen(false);
                  onRefresh();
                }}
                className="flex-1 py-3.5 bg-gray-50 dark:bg-[#2C2C35] hover:bg-gray-100 dark:hover:bg-[#3A3A45] border border-gray-200/50 dark:border-transparent text-gray-800 dark:text-gray-200 text-[13.5px] font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <X size={16} strokeWidth={2.5} />
                Keep Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSetupConfirm(false);
                  setIsModalOpen(false);
                  router.push(`/projects/setup?id=${createdProjectDetails.id}`);
                }}
                className="flex-1 py-3.5 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13.5px] font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Continue Setup
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
