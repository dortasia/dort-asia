"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, Search, Filter, Check, Eye, ChevronDown, Clock, AlertCircle, FileText, UserCircle, Briefcase, Sparkles, Calendar, Send, TrendingUp, TrendingDown, Clock3 } from "lucide-react";
import { useAppStore } from "@/store";

interface NotifyOverlayProps {
  onClose: () => void;
}

type Group = { id: number; name: string; memberIds: string[] };

export default function NotifyOverlay({ onClose }: NotifyOverlayProps) {
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const companyProfile = cachedSidebar?.companyProfile;
  const cachedEmployees = useAppStore((s) => s.cachedEmployees) || [];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedDesignationIds, setSelectedDesignationIds] = useState<number[]>([]);
  const [isCompanySelected, setIsCompanySelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'Company' | 'Departments' | 'Roles' | 'Designations' | 'Individuals' | 'Groups'>('Company');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Clocked In' | 'Offline'>('All');

  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [heading, setHeading] = useState("Your Clock out time is within 30min away");
  const [subHeading, setSubHeading] = useState("Please complete your tasks and clock out on time.");

  // Derived Categories
  const uniqueDepartments = useMemo(() => {
    const depts = new Map<string, number>();
    cachedEmployees.forEach(e => depts.set(e.department || 'Other', (depts.get(e.department || 'Other') || 0) + 1));
    return Array.from(depts.entries()).map(([name, count], i) => ({ id: i, name, count }));
  }, [cachedEmployees]);

  const uniqueRoles = useMemo(() => {
    const roles = new Map<string, number>();
    cachedEmployees.forEach(e => roles.set(e.role || 'Other', (roles.get(e.role || 'Other') || 0) + 1));
    return Array.from(roles.entries()).map(([name, count], i) => ({ id: i, name, count }));
  }, [cachedEmployees]);

  const uniqueDesignations = useMemo(() => {
    const desigs = new Map<string, number>();
    cachedEmployees.forEach(e => {
      const d = e.designation || e.role || 'Other';
      desigs.set(d, (desigs.get(d) || 0) + 1);
    });
    return Array.from(desigs.entries()).map(([name, count], i) => ({ id: i, name, count }));
  }, [cachedEmployees]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleCategorySelect = (id: number, type: 'Dept' | 'Role' | 'Designation' | 'Group') => {
    if (type === 'Dept') setSelectedDeptIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (type === 'Role') setSelectedRoleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (type === 'Designation') setSelectedDesignationIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (type === 'Group') setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: Date.now(),
      name: newGroupName.trim(),
      memberIds: selectedIds,
    };
    setGroups((prev) => [...prev, newGroup]);
    setIsCreatingGroup(false);
    setNewGroupName("");
  };

  const handleQuickTemplate = (title: string, desc: string) => {
    setHeading(title);
    setSubHeading(desc);
  };

  const clearAllSelections = () => {
    setSelectedIds([]);
    setSelectedGroupIds([]);
    setSelectedDeptIds([]);
    setSelectedRoleIds([]);
    setSelectedDesignationIds([]);
    setIsCompanySelected(false);
  };

  // Filtered Data based on Search and Filter Status
  const q = searchQuery.toLowerCase();
  
  const filteredEmployees = useMemo(() => {
    return cachedEmployees.filter((emp, idx) => {
      const isClockedIn = emp.id.charCodeAt(0) % 2 === 0 || idx % 3 === 0;
      
      const matchesSearch = emp.name.toLowerCase().includes(q) || (emp.role && emp.role.toLowerCase().includes(q));
      
      const matchesFilter = filterStatus === 'All' 
        ? true 
        : filterStatus === 'Clocked In' 
          ? isClockedIn 
          : !isClockedIn;

      return matchesSearch && matchesFilter;
    });
  }, [cachedEmployees, q, filterStatus]);

  const filteredDepts = uniqueDepartments.filter(d => d.name.toLowerCase().includes(q));
  const filteredRoles = uniqueRoles.filter(r => r.name.toLowerCase().includes(q));
  const filteredDesignations = uniqueDesignations.filter(d => d.name.toLowerCase().includes(q));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(q));

  const totalSelections = selectedIds.length + selectedGroupIds.length + selectedDeptIds.length + selectedRoleIds.length + selectedDesignationIds.length + (isCompanySelected ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0B0B0F] overflow-y-auto page-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-8 pt-8 pb-6 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight uppercase">NOTIFY</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Send notifications to your employees</p>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 text-[14px] font-semibold text-[#007AFF] hover:bg-[#E5F1FF] dark:hover:bg-[#0A84FF]/15 px-3 py-2 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <main className="flex-1 px-8 pb-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Top 3 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Column 1: Select Recipients */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] flex flex-col h-[700px] overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-[#2C2C35]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">1. Select Recipients</h2>
                  {selectedIds.length > 1 && !isCreatingGroup && (
                    <button
                      onClick={() => { setIsCreatingGroup(true); setActiveTab('Groups'); }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5F1FF] text-[#007AFF] hover:bg-[#cce4ff] text-[11px] font-bold transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Create Group
                    </button>
                  )}
                </div>
                <div className="bg-[#E5F1FF] dark:bg-[#0A84FF]/15 text-[#007AFF] px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0">
                  Selected : <span className="font-bold">{totalSelections} Items</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-5 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-transparent focus:border-gray-200 dark:focus:border-[#2C2C35] rounded-xl text-[13px] font-medium placeholder:text-gray-400 outline-none transition-colors" 
                  />
                </div>
                
                {/* Filter Button & Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`h-[42px] w-[42px] shrink-0 rounded-xl flex items-center justify-center transition-colors border ${filterStatus !== 'All' ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2A2A31] border-transparent'}`}
                  >
                    <Filter className="h-4 w-4" />
                  </button>

                  {isFilterOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1C1C1E] rounded-[16px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] py-2 z-50">
                      <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status Filter</div>
                      {(['All', 'Clocked In', 'Offline'] as const).map(status => (
                        <button 
                          key={status}
                          onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-[13px] font-semibold flex items-center justify-between ${filterStatus === status ? "text-[#007AFF] bg-[#E5F1FF] dark:bg-[#0A84FF]/10" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                        >
                          {status}
                          {filterStatus === status && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['Company', 'Departments', 'Roles', 'Designations', 'Individuals', 'Groups'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors border ${activeTab === tab ? "bg-[#007AFF] text-white border-[#007AFF]" : "bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#2C2C35] hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className="flex flex-col gap-1">
                {/* ── COMPANY ── */}
                {activeTab === 'Company' && (
                  (!q || (companyProfile?.name || "Entire Company").toLowerCase().includes(q)) ? (
                    <div onClick={() => setIsCompanySelected(!isCompanySelected)} className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-colors ${isCompanySelected ? "bg-[#FAFAFC] dark:bg-white/5 border border-blue-500/20" : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"}`}>
                      <div className={`h-5 w-5 shrink-0 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${isCompanySelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E]"}`}>
                        {isCompanySelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </div>
                      <div className="w-12 h-12 rounded-full ring-2 ring-blue-100 ring-offset-1 shrink-0 overflow-hidden bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center font-bold text-[14px]">
                        {companyProfile?.logoUrl ? <img src={companyProfile.logoUrl} alt="Company" className="w-full h-full object-cover" /> : companyProfile?.initials || "Co"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">{companyProfile?.name || "Entire Company"}</h3>
                        <p className="text-[12px] text-gray-500 font-medium mt-1">Notify everyone in the organization</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-400 text-center py-8">No matching company result</p>
                  )
                )}

                {/* ── DEPARTMENTS ── */}
                {activeTab === 'Departments' && (
                  filteredDepts.length > 0 ? filteredDepts.map(dept => {
                    const isSelected = selectedDeptIds.includes(dept.id);
                    return (
                      <div key={dept.id} onClick={() => toggleCategorySelect(dept.id, 'Dept')} className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-colors ${isSelected ? "bg-[#FAFAFC] dark:bg-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                        <div className={`h-5 w-5 shrink-0 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E]"}`}>
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </div>
                        <div className="w-10 h-10 rounded-[12px] bg-[#E5F1FF] dark:bg-[#0A84FF]/15 text-[#007AFF] shrink-0 flex items-center justify-center text-[16px]">
                          🏢
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{dept.name}</h3>
                          <p className="text-[12px] text-blue-500 font-medium truncate">{dept.count} Members</p>
                        </div>
                      </div>
                    )
                  }) : <p className="text-[13px] text-gray-400 text-center py-8">No departments found</p>
                )}

                {/* ── ROLES ── */}
                {activeTab === 'Roles' && (
                  filteredRoles.length > 0 ? filteredRoles.map(role => {
                    const isSelected = selectedRoleIds.includes(role.id);
                    return (
                      <div key={role.id} onClick={() => toggleCategorySelect(role.id, 'Role')} className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-colors ${isSelected ? "bg-[#FAFAFC] dark:bg-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                        <div className={`h-5 w-5 shrink-0 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E]"}`}>
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </div>
                        <div className="w-10 h-10 rounded-[12px] bg-[#FFF2DF] dark:bg-[#FF9500]/15 text-[#FF9500] shrink-0 flex items-center justify-center text-[16px]">
                          🛡️
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{role.name}</h3>
                          <p className="text-[12px] text-orange-500 font-medium truncate">{role.count} Members</p>
                        </div>
                      </div>
                    )
                  }) : <p className="text-[13px] text-gray-400 text-center py-8">No roles found</p>
                )}

                {/* ── DESIGNATIONS ── */}
                {activeTab === 'Designations' && (
                  filteredDesignations.length > 0 ? filteredDesignations.map(desig => {
                    const isSelected = selectedDesignationIds.includes(desig.id);
                    return (
                      <div key={desig.id} onClick={() => toggleCategorySelect(desig.id, 'Designation')} className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-colors ${isSelected ? "bg-[#FAFAFC] dark:bg-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                        <div className={`h-5 w-5 shrink-0 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E]"}`}>
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </div>
                        <div className="w-10 h-10 rounded-[12px] bg-[#E8FAF0] dark:bg-[#34C759]/15 text-[#34C759] shrink-0 flex items-center justify-center text-[16px]">
                          ⭐
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{desig.name}</h3>
                          <p className="text-[12px] text-green-600 font-medium truncate">{desig.count} Members</p>
                        </div>
                      </div>
                    )
                  }) : <p className="text-[13px] text-gray-400 text-center py-8">No designations found</p>
                )}

                {/* ── INDIVIDUALS ── */}
                {activeTab === 'Individuals' && (
                  filteredEmployees.length > 0 ? filteredEmployees.map((emp, idx) => {
                    const isSelected = selectedIds.includes(emp.id);
                    const isClockedIn = emp.id.charCodeAt(0) % 2 === 0 || idx % 3 === 0;

                    return (
                      <div key={emp.id} onClick={() => toggleSelect(emp.id)} className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-colors ${isSelected ? "bg-[#FAFAFC] dark:bg-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                        <div className={`h-5 w-5 shrink-0 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E]"}`}>
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </div>
                        
                        <div className="relative shrink-0">
                          <div className="h-[42px] w-[42px] rounded-full flex items-center justify-center font-bold text-[14px] overflow-hidden" style={{ backgroundColor: emp.bg || "#E5F1FF", color: emp.color || "#007AFF" }}>
                            {emp.initials}
                          </div>
                          {isClockedIn && <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-[#34C759] border-[2.5px] border-white dark:border-[#121217] rounded-full" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{emp.name}</h3>
                          <p className="text-[12px] text-gray-500 font-medium truncate">{emp.role}</p>
                        </div>

                        <div className={`text-[11px] font-semibold shrink-0 ${isClockedIn ? "text-[#34C759]" : "text-gray-400"}`}>
                          {isClockedIn ? "Clocked In" : "Offline"}
                        </div>
                      </div>
                    );
                  }) : <p className="text-[13px] text-gray-400 text-center py-8">No individuals found matching your criteria</p>
                )}

                {/* ── GROUPS ── */}
                {activeTab === 'Groups' && (
                  isCreatingGroup ? (
                    <div className="flex flex-col gap-4 p-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">New Group · {selectedIds.length} members</h3>
                        <button onClick={() => { setIsCreatingGroup(false); setNewGroupName(""); }} className="text-gray-400 hover:text-gray-600 text-[12px] font-medium">Cancel</button>
                      </div>
                      <input type="text" placeholder="Group Name…" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} autoFocus className="w-full px-4 py-3 rounded-[14px] border border-gray-200 dark:border-[#2C2C35] text-[13px] font-semibold outline-none focus:border-[#007AFF] bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white placeholder:text-gray-400 transition-colors" />
                      <button onClick={createGroup} disabled={!newGroupName.trim()} className="w-full py-3 rounded-[14px] bg-[#007AFF] text-white text-[13px] font-bold hover:bg-[#0062CC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Save Group</button>
                    </div>
                  ) : (
                    filteredGroups.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-[13px] font-semibold text-gray-500">{q ? "No matching groups" : "No groups yet"}</p>
                        {!q && <p className="text-[12px] text-gray-400 mt-1">Select individuals and tap Create Group.</p>}
                      </div>
                    ) : (
                      filteredGroups.map(group => {
                        const isSelected = selectedGroupIds.includes(group.id);
                        return (
                          <div key={group.id} onClick={() => toggleCategorySelect(group.id, 'Group')} className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-colors ${isSelected ? "bg-[#FAFAFC] dark:bg-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                            <div className={`h-5 w-5 shrink-0 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E]"}`}>
                              {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                            </div>
                            <div className="w-10 h-10 rounded-[12px] bg-[#F8F9FA] dark:bg-[#2C2C35] shrink-0 flex items-center justify-center text-[16px]">
                              👥
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{group.name}</h3>
                              <p className="text-[12px] text-blue-500 font-medium truncate">{group.memberIds.length} members</p>
                            </div>
                          </div>
                        )
                      })
                    )
                  )
                )}

              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-[#2C2C35] flex items-center justify-between bg-[#F8F9FA] dark:bg-[#1A1A1E]">
              <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">{totalSelections}</strong> items selected</span>
              <button onClick={clearAllSelections} className="text-[13px] font-bold text-[#007AFF] hover:underline">Clear All</button>
            </div>
          </section>

          {/* Column 2: Configure Message */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] p-6 flex flex-col h-[700px] order-2">
            <h2 className="text-[16px] font-bold text-gray-900 dark:text-white mb-6">2. Configure Message</h2>

            <div className="flex-1 flex flex-col gap-5 overflow-y-auto page-scrollbar pr-2 -mr-2">
              
              {/* Heading */}
              <div>
                <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 block mb-2">Heading</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={heading}
                    onChange={(e) => setHeading(e.target.value.substring(0, 50))}
                    className="w-full px-4 py-3 bg-white dark:bg-[#1C1C1E] border-[0.5px] border-gray-300 dark:border-[#2C2C35] rounded-[14px] text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-400">{heading.length}/50</span>
                    <Check className="h-3.5 w-3.5 text-[#34C759]" strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* Sub Heading */}
              <div>
                <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 block mb-2">Sub Heading <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <textarea 
                    value={subHeading}
                    onChange={(e) => setSubHeading(e.target.value.substring(0, 150))}
                    className="w-full px-4 py-3 bg-white dark:bg-[#1C1C1E] border-[0.5px] border-gray-300 dark:border-[#2C2C35] rounded-[14px] text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all pr-16 resize-none h-[100px]"
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-400">{subHeading.length}/150</span>
                    <Check className="h-3.5 w-3.5 text-[#34C759]" strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">Quick Templates</span>
                  <button className="text-[12px] font-bold text-[#007AFF] hover:underline">View all</button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => handleQuickTemplate("Clock Out Reminder", "Don't forget to complete your daily logs and clock out before you leave.")} className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-[#007AFF]/30 bg-[#E5F1FF] dark:bg-[#0A84FF]/10 text-[#007AFF] text-[12px] font-bold transition-all hover:bg-[#cce4ff] dark:hover:bg-[#0A84FF]/20 text-left">
                    <Clock className="h-4 w-4 shrink-0" /> <span className="truncate">Clock Out Reminder</span>
                  </button>
                  <button onClick={() => handleQuickTemplate("Attendance Missing", "Your attendance for today has not been marked. Please update it in the portal.")} className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300 text-[12px] font-semibold transition-all hover:bg-gray-50 dark:hover:bg-white/5 text-left">
                    <UserCircle className="h-4 w-4 shrink-0" /> <span className="truncate">Attendance Missing</span>
                  </button>
                  <button onClick={() => handleQuickTemplate("Meeting Alert", "Your scheduled team meeting is starting in 15 minutes. Join via the link.")} className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300 text-[12px] font-semibold transition-all hover:bg-gray-50 dark:hover:bg-white/5 text-left">
                    <Calendar className="h-4 w-4 shrink-0" /> <span className="truncate">Meeting Alert</span>
                  </button>
                  <button onClick={() => handleQuickTemplate("Payroll Notification", "Your payslip for this month has been generated and is ready to view.")} className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300 text-[12px] font-semibold transition-all hover:bg-gray-50 dark:hover:bg-white/5 text-left">
                    <Briefcase className="h-4 w-4 shrink-0" /> <span className="truncate">Payroll Notification</span>
                  </button>
                </div>
              </div>

              {/* Add Personalization */}
              <div>
                <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 block mb-3">Add Personalization</span>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 text-[12px] font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Employee Name <ChevronDown className="h-3 w-3" />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 text-[12px] font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Department <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Smart Suggestion */}
              <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[16px] p-4 flex items-center justify-between border border-gray-100 dark:border-[#2C2C35]">
                <div className="flex gap-3 items-center">
                  <div className="h-8 w-8 rounded-full bg-[#E5F1FF] dark:bg-[#0A84FF]/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-[#007AFF]" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Smart Suggestion</h4>
                    <p className="text-[12px] text-gray-500 font-medium">This message is good to go! 👍</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#007AFF] bg-white dark:bg-[#121217] border-[0.5px] border-gray-300 dark:border-[#2C2C35] px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-[#1C1C1E] transition-colors">
                  <Sparkles className="h-3.5 w-3.5" /> Improve with AI
                </button>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100 dark:border-[#2C2C35]">
              <button className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#1C1C1E] border-[0.5px] border-gray-300 dark:border-[#2C2C35] rounded-[16px] py-3 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2C2C35] transition-colors group">
                <div className="flex items-center gap-2 mb-0.5">
                  <Calendar className="h-4 w-4 text-[#007AFF] group-hover:scale-110 transition-transform" />
                  <span className="text-[14px] font-bold">Schedule Push</span>
                </div>
                <span className="text-[11px] font-medium text-gray-500">Choose date & time</span>
              </button>
              
              <button className="flex-1 flex flex-col items-center justify-center bg-[#007AFF] hover:bg-[#0062CC] rounded-[16px] py-3 text-white transition-colors group border border-transparent">
                <div className="flex items-center gap-2 mb-0.5">
                  <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[14px] font-bold">Quick Push</span>
                </div>
                <span className="text-[11px] font-medium text-white/80">Send Notification Now</span>
              </button>
            </div>
          </section>

          {/* Column 3: Notification Preview (SVG Based) */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] flex flex-col h-[700px] relative overflow-hidden order-3">
            <div className="p-6 pb-2 flex items-center justify-between z-10 shrink-0">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">3. Notification Preview</h2>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#2C2C35] text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Eye className="h-3.5 w-3.5 text-[#007AFF]" />
                Preview <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* SVG iPhone Mockup Container */}
            <div className="flex-1 w-full overflow-hidden flex flex-col items-center justify-start pt-2 px-4 relative">
              <div className="relative w-full max-w-[400px] mx-auto mt-2">
                {/* SVG Phone frame - automatically scales */}
                <img src="/Mobile.svg" alt="Phone Mockup" className="w-full h-auto block drop-shadow-2xl object-contain" />

                {/* Overlay Area mapping to phone screen */}
                <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ padding: "15% 6.5% 6.5% 6.5%" }}>
                  
                  {/* Dynamic Time & Date */}
                  <div className="text-center">
                    <p className="text-transparent bg-clip-text bg-gradient-to-b from-white/100 to-white/70 text-[14px] sm:text-[16px] font-medium leading-none drop-shadow-sm">
                      {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(/,/g, "")}
                    </p>
                    <p className="text-transparent bg-clip-text bg-gradient-to-b from-white/100 to-white/50 font-semibold leading-none mt-1 sm:mt-1.5 tracking-tight drop-shadow-lg text-[60px] sm:text-[76px] xl:text-[84px]">
                      {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/ AM| PM/i, "")}
                    </p>
                  </div>

                  {/* Margin to push notification slightly below the clock */}
                  <div className="mt-8 sm:mt-12" />

                  {/* Notification Card (Glassmorphism) */}
                  <div className="bg-white/30 dark:bg-[#1C1C1E]/60 backdrop-blur-[24px] backdrop-saturate-150 rounded-[22px] p-3.5 sm:p-4 flex gap-3 border-[0.5px] border-white/40 dark:border-white/10 mb-8 sm:mb-10 mx-1 relative overflow-hidden transition-all duration-500 pointer-events-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/10 via-transparent to-transparent opacity-80 pointer-events-none" />
                    
                    <div className="relative z-10 shrink-0 bg-white rounded-xl w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                      <img src="/Icons/VertexLogo.svg" alt="Logo" className="w-5 h-5 object-contain" />
                    </div>
                    
                    <div className="flex-1 min-w-0 relative z-10 pt-0.5">
                      <div className="flex justify-between items-start mb-0.5 gap-2">
                        <span className="text-[13px] sm:text-[14px] font-bold text-gray-900 dark:text-white leading-tight drop-shadow-sm break-words">
                          {heading || "Notification Heading"}
                        </span>
                        <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium shrink-0 pt-0.5">now</span>
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-[12px] sm:text-[13px] text-gray-800 dark:text-gray-200 leading-[1.35] pb-0.5 break-words">
                          {subHeading || "Notification details will appear here..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </section>

        </div>

        {/* Notification Overview */}
        <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] p-6 flex flex-col mt-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Notification Overview</h2>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#2C2C35] text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] transition-colors">
                <Calendar className="h-3.5 w-3.5" />
                Today <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <button className="flex items-center gap-1 text-[13px] font-bold text-[#007AFF] hover:underline">
              View Reports <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stat 1 */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[14px] bg-[#E5F1FF] dark:bg-[#0A84FF]/15 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Sent Today</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">1,248</span>
                  <div className="flex items-center gap-1 text-[#34C759] text-[11px] font-bold pb-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>18.5% <span className="text-gray-400 font-medium">vs yesterday</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-4 md:border-l border-gray-100 dark:border-[#2C2C35] md:pl-6">
              <div className="h-12 w-12 rounded-[14px] bg-[#E8FAF0] dark:bg-[#34C759]/15 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-[#34C759]" strokeWidth={3} />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Delivered</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">98.6%</span>
                  <div className="flex items-center gap-1 text-[#34C759] text-[11px] font-bold pb-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>2.3% <span className="text-gray-400 font-medium">vs yesterday</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-4 md:border-l border-gray-100 dark:border-[#2C2C35] md:pl-6">
              <div className="h-12 w-12 rounded-[14px] bg-[#FFF2DF] dark:bg-[#FF9500]/15 flex items-center justify-center shrink-0">
                <Clock3 className="h-5 w-5 text-[#FF9500]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Scheduled</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">36</span>
                  <div className="flex items-center gap-1 text-gray-400 text-[11px] font-medium pb-0.5">
                    <span>Upcoming notifications</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-4 md:border-l border-gray-100 dark:border-[#2C2C35] md:pl-6">
              <div className="h-12 w-12 rounded-[14px] bg-[#FFF1F1] dark:bg-[#FF3B30]/15 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-[#FF3B30]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Failed</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">12</span>
                  <div className="flex items-center gap-1 text-[#FF3B30] text-[11px] font-bold pb-0.5">
                    <TrendingDown className="h-3 w-3" />
                    <span>3.2% <span className="text-gray-400 font-medium">vs yesterday</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notification History */}
        <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] overflow-hidden flex flex-col mt-2">
          <div className="p-6 border-b border-gray-100 dark:border-[#2C2C35] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Notification History</h2>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Recent notifications and their statuses</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input type="text" placeholder="Search history..." className="pl-9 pr-4 py-2 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-transparent focus:border-gray-200 dark:focus:border-[#2C2C35] rounded-[12px] text-[12px] font-medium placeholder:text-gray-400 outline-none w-[200px]" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] transition-colors">
                <Filter className="h-3.5 w-3.5" /> Filter
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] dark:bg-[#1C1C1E]/50 border-b border-gray-100 dark:border-[#2C2C35]">
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2C2C35]">
                {/* Row 1 */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#E5F1FF] dark:bg-[#0A84FF]/15 text-[#007AFF] flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white">Clock Out Reminder</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-[250px]">Don't forget to complete your daily logs...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2C2C35] px-2 py-0.5 rounded-md">Entire Company</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-white">Today, 5:30 PM</p>
                    <p className="text-[11px] text-gray-500">Scheduled</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FFF2DF] dark:bg-[#FF9500]/15 text-[#FF9500] text-[11px] font-bold">
                      <Clock3 className="h-3 w-3" /> Scheduled
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#007AFF] text-[12px] font-bold hover:underline">View Details</button>
                  </td>
                </tr>
                
                {/* Row 2 */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#E8FAF0] dark:bg-[#34C759]/15 text-[#34C759] flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white">Townhall Meeting</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-[250px]">Join us for the monthly company townhall...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2C2C35] px-2 py-0.5 rounded-md">120 People</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-white">Today, 10:00 AM</p>
                    <p className="text-[11px] text-gray-500">Sent</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#E8FAF0] dark:bg-[#34C759]/15 text-[#34C759] text-[11px] font-bold">
                      <Check className="h-3 w-3" strokeWidth={3} /> Delivered
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#007AFF] text-[12px] font-bold hover:underline">View Details</button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#FFF1F1] dark:bg-[#FF3B30]/15 text-[#FF3B30] flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white">System Maintenance</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-[250px]">HR portal will be down for 2 hours...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2C2C35] px-2 py-0.5 rounded-md">IT Department</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-white">Yesterday, 11:30 PM</p>
                    <p className="text-[11px] text-gray-500">Failed</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FFF1F1] dark:bg-[#FF3B30]/15 text-[#FF3B30] text-[11px] font-bold">
                      <AlertCircle className="h-3 w-3" /> Failed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#007AFF] text-[12px] font-bold hover:underline">Retry</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-[#2C2C35] flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1A1A1E]">
            <button className="text-[12px] font-bold text-[#007AFF] hover:underline">View All History</button>
          </div>
        </section>

      </main>
    </div>
  );
}
