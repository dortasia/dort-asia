"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, Search, Filter, Check, ChevronDown, Clock, AlertCircle, FileText, UserCircle, Briefcase, Sparkles, Calendar, Send, TrendingUp, TrendingDown, Clock3, Image as ImageIcon, MapPin, AlignLeft, Users, Building2, Eye } from "lucide-react";
import { useAppStore } from "@/store";

interface EventsOverlayProps {
  onClose: () => void;
}

type Group = { id: number; name: string; memberIds: string[] };

export default function EventsOverlay({ onClose }: EventsOverlayProps) {
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const companyProfile = cachedSidebar?.companyProfile;
  const userProfile = cachedSidebar?.userProfile;
  const cachedEmployees = useAppStore((s) => s.cachedEmployees) || [];

  // -----------------------------------------------------
  // COLUMN 1: Select Audience State
  // -----------------------------------------------------
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedDesignationIds, setSelectedDesignationIds] = useState<number[]>([]);
  const [isCompanySelected, setIsCompanySelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'Company' | 'Departments' | 'Roles' | 'Designations' | 'Individuals' | 'Groups'>('Company');

  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Clocked In' | 'Offline'>('All');

  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

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

  const clearAllSelections = () => {
    setSelectedIds([]);
    setSelectedGroupIds([]);
    setSelectedDeptIds([]);
    setSelectedRoleIds([]);
    setSelectedDesignationIds([]);
    setIsCompanySelected(false);
  };

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

  // -----------------------------------------------------
  // Form State
  // -----------------------------------------------------
  const [eventTitle, setEventTitle] = useState("Annual Team Strategy Meeting");
  const [eventType, setEventType] = useState("Meeting");
  const [startDate, setStartDate] = useState("2024-05-24");
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState("2024-05-24");
  const [endTime, setEndTime] = useState("11:00");
  const [venue, setVenue] = useState("Conference Room A, Head Office");
  const [description, setDescription] = useState("Join us for a strategy discussion and planning for the upcoming quarter. Your insights and ideas matter!");
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0B0B0F] overflow-y-auto page-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-8 pt-8 pb-6 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight uppercase">EVENTS</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Create, manage and schedule events across your organization</p>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 text-[14px] font-semibold text-[#007AFF] hover:bg-[#E5F1FF] dark:hover:bg-[#0A84FF]/15 px-3 py-2 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <main className="flex-1 px-8 pb-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Top 3 Columns: Reordered -> 1. Audience, 2. Details, 3. Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.3fr_1.1fr] gap-6">
          
          {/* Column 1: Select Audience */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] flex flex-col h-[700px] overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-[#2C2C35]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">1. Select Audience</h2>
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
                        <p className="text-[12px] text-gray-500 font-medium mt-1">Include everyone in the organization</p>
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

          {/* Column 2: Event Details */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-200 dark:border-[#2C2C35] flex flex-col h-[700px] overflow-hidden shadow-sm">
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-[#2C2C35] shrink-0">
               <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">2. Event Details</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 page-scrollbar">
              {/* Title */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">Event Title <span className="text-red-500">*</span></label>
                <div className="relative">
                   <input type="text" value={eventTitle} onChange={e=>setEventTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[13px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF]" />
                   <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#34C759]" strokeWidth={3} />
                </div>
              </div>
              
              {/* Type */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">Event Type</label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center"><Calendar className="w-3.5 h-3.5" /></div>
                   <select value={eventType} onChange={e=>setEventType(e.target.value)} className="w-full pl-11 pr-8 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[13px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF] appearance-none">
                     <option>Meeting</option>
                     <option>Workshop</option>
                     <option>Celebration</option>
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Start Date & Time */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">Start Date & Time <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[12px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF] [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div className="relative w-[150px]">
                     <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full pl-8 pr-2 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[12px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF] [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">End Date & Time <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[12px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF] [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div className="relative w-[150px]">
                     <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full pl-8 pr-2 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[12px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF] [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">Venue / Location <span className="text-red-500">*</span></label>
                <div className="relative">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input type="text" value={venue} onChange={e=>setVenue(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[13px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF]" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="text-red-500">*</span></label>
                <div className="border border-gray-200 dark:border-[#2C2C35] rounded-xl overflow-hidden bg-[#F8F9FA] dark:bg-[#1C1C1E]">
                   {/* Toolbar mockup */}
                   <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1A1A1E]">
                     {['B','I','U'].map(v => <button key={v} className="w-7 h-7 flex items-center justify-center font-serif font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded">{v}</button>)}
                     <div className="w-px h-4 bg-gray-300 mx-1" />
                     <button className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded"><AlignLeft className="w-4 h-4" /></button>
                   </div>
                   <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-4 h-[100px] text-[13px] font-medium text-gray-900 dark:text-white outline-none bg-transparent resize-none page-scrollbar" />
                </div>
              </div>

              {/* Repeat */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">Repeat</label>
                <div className="relative">
                   <select className="w-full px-4 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-xl text-[13px] font-semibold text-gray-900 dark:text-white outline-none focus:border-[#007AFF] appearance-none">
                      <option>Does not repeat</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-4">
                 <div className="flex-1 flex items-center justify-between p-3.5 border border-gray-200 dark:border-[#2C2C35] rounded-xl bg-[#F8F9FA] dark:bg-[#1C1C1E]">
                   <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                     <Calendar className="w-4 h-4 text-gray-400" /> Add to Company Calendar
                   </div>
                   <div onClick={() => setAddToCalendar(!addToCalendar)} className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${addToCalendar ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${addToCalendar ? 'translate-x-4' : 'translate-x-0'}`} />
                   </div>
                 </div>
                 <div className="flex-1 flex items-center justify-between p-3.5 border border-gray-200 dark:border-[#2C2C35] rounded-xl bg-[#F8F9FA] dark:bg-[#1C1C1E]">
                   <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                     <Send className="w-4 h-4 text-gray-400" /> In-App Notification
                   </div>
                   <div onClick={() => setSendNotification(!sendNotification)} className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${sendNotification ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${sendNotification ? 'translate-x-4' : 'translate-x-0'}`} />
                   </div>
                 </div>
              </div>

            </div>

            <div className="p-5 border-t border-gray-100 dark:border-[#2C2C35] bg-white dark:bg-[#121217] flex gap-3 shrink-0">
               <button className="flex-[0.8] py-3 rounded-xl border border-[#007AFF] text-[#007AFF] text-[13px] font-bold hover:bg-[#E5F1FF] dark:hover:bg-[#0A84FF]/10 transition-colors flex items-center justify-center gap-2">
                 <FileText className="w-4 h-4" /> Schedule
               </button>
               <button className="flex-1 py-3 rounded-xl bg-[#007AFF] text-white text-[13px] font-bold hover:bg-[#0062CC] transition-colors flex items-center justify-center gap-2 shadow-[0_4px_12px_rgb(0,122,255,0.3)]">
                 <Send className="w-4 h-4" /> Publish Event
               </button>
            </div>
          </section>

          {/* Column 3: Event Preview */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-200 dark:border-[#2C2C35] flex flex-col h-[700px] overflow-hidden shadow-sm">
            <div className="p-6 pb-0 border-b border-gray-100 dark:border-[#2C2C35] shrink-0">
               <h2 className="text-[16px] font-bold text-gray-900 dark:text-white mb-4">3. Event Preview</h2>
               <div className="flex items-center gap-6">
                  {(['Preview']).map(tab => (
                    <button key={tab} className={`pb-3 text-[13px] font-bold border-b-[2.5px] transition-colors ${tab === 'Preview' ? "border-[#007AFF] text-[#007AFF]" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}>
                      {tab}
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-[#F8F9FA] dark:bg-[#0B0B0F] flex flex-col items-center">
               <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-[#2C2C35] w-full max-w-[420px]">
                  {/* Banner Area */}
                  <div className="bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] p-6 text-white relative overflow-hidden h-[160px]">
                    {/* Decorative Elements */}
                    <div className="absolute top-4 right-4 h-16 w-16 opacity-30 bg-white blur-2xl rounded-full" />
                    <div className="absolute -bottom-8 -right-8 h-32 w-32 opacity-20 bg-blue-400 blur-2xl rounded-full" />
                    <div className="absolute top-1/2 right-10 -translate-y-1/2 flex items-center justify-center opacity-80">
                       <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_8px_yellow]" />
                       <div className="w-1 h-1 bg-white rounded-full absolute -top-4 left-4 shadow-[0_0_4px_white]" />
                       <div className="w-2 h-2 bg-blue-300 rounded-full absolute bottom-4 right-6 shadow-[0_0_6px_blue]" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col justify-center h-full pt-2">
                       <h3 className="text-[20px] font-bold mb-3 leading-tight text-white drop-shadow-sm">{eventTitle || "Event Title"}</h3>
                       <div className="flex items-center gap-4 text-white/80 text-[12px] font-medium">
                         <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {eventType || "Event Type"}</span>
                         <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 60 min</span>
                       </div>
                    </div>
                  </div>

                  {/* Info Card overlaps banner slightly */}
                  <div className="bg-white dark:bg-[#121217] mx-5 -mt-6 rounded-xl shadow-md border border-gray-100 dark:border-[#2C2C35] p-4 relative z-20 flex gap-4">
                     <div className="flex flex-col items-center justify-center shrink-0 pr-4 border-r border-gray-100 dark:border-[#2C2C35]">
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MAY</span>
                       <span className="text-[28px] font-bold text-gray-900 dark:text-white leading-none my-1">24</span>
                       <span className="text-[10px] font-bold text-gray-500 uppercase">FRI</span>
                     </div>
                     <div className="flex flex-col justify-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                       <p className="text-[13px] font-bold text-gray-900 dark:text-white">Friday, 24 May 2024</p>
                       <p className="flex items-center gap-2 text-gray-500"><Clock className="w-3.5 h-3.5 text-[#007AFF]" /> 10:00 AM – 11:00 AM</p>
                       <p className="flex items-center gap-2 text-gray-500"><MapPin className="w-3.5 h-3.5 text-[#007AFF]" /> {venue || "Venue"}</p>
                     </div>
                  </div>

                  <div className="p-6 pt-5">
                     <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                       {description || "Description will appear here..."}
                     </p>
                     
                     <div className="border-t border-gray-100 dark:border-[#2C2C35] pt-4">
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Organized By</p>
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center font-bold text-[14px]">
                           {userProfile?.name ? userProfile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                         </div>
                         <div>
                           <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-none mb-1">{userProfile?.name || "User"}</p>
                           <p className="text-[12px] font-medium text-gray-500">{userProfile?.title || "Employee"}</p>
                         </div>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          </section>

        </div>

        {/* Event Overview */}
        <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] p-6 flex flex-col mt-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Event Overview</h2>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#2C2C35] text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] transition-colors">
                <Calendar className="h-3.5 w-3.5" />
                This Month <ChevronDown className="h-3.5 w-3.5" />
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
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Events Created</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">42</span>
                  <div className="flex items-center gap-1 text-[#34C759] text-[11px] font-bold pb-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>12% <span className="text-gray-400 font-medium">vs last month</span></span>
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
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Total Attendees</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">1,248</span>
                  <div className="flex items-center gap-1 text-[#34C759] text-[11px] font-bold pb-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>8.5% <span className="text-gray-400 font-medium">vs last month</span></span>
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
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Upcoming</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">12</span>
                  <div className="flex items-center gap-1 text-gray-400 text-[11px] font-medium pb-0.5">
                    <span>Events Scheduled</span>
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
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Declined</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">18</span>
                  <div className="flex items-center gap-1 text-[#FF3B30] text-[11px] font-bold pb-0.5">
                    <TrendingDown className="h-3 w-3" />
                    <span>3.2% <span className="text-gray-400 font-medium">vs last month</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event History */}
        <section className="bg-white dark:bg-[#121217] rounded-[24px] border-[0.5px] border-gray-300 dark:border-[#2C2C35] overflow-hidden flex flex-col mt-2">
          <div className="p-6 border-b border-gray-100 dark:border-[#2C2C35] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Event History</h2>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Recent events and their statuses</p>
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
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Audience</th>
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
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white">Annual Strategy Meeting</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-[250px]">Join us for a strategy discussion...</p>
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
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white">Townhall Meeting</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-[250px]">Monthly company townhall...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2C2C35] px-2 py-0.5 rounded-md">120 People</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-white">22 May, 10:00 AM</p>
                    <p className="text-[11px] text-gray-500">Completed</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#E8FAF0] dark:bg-[#34C759]/15 text-[#34C759] text-[11px] font-bold">
                      <Check className="h-3 w-3" strokeWidth={3} /> Completed
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
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white">Product Launch</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-[250px]">New HR portal launch event...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2C2C35] px-2 py-0.5 rounded-md">IT Department</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-white">20 May, 11:30 AM</p>
                    <p className="text-[11px] text-gray-500">Cancelled</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FFF1F1] dark:bg-[#FF3B30]/15 text-[#FF3B30] text-[11px] font-bold">
                      <AlertCircle className="h-3 w-3" /> Cancelled
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#007AFF] text-[12px] font-bold hover:underline">Reschedule</button>
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
