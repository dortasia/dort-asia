"use client";

import React, { useState, useEffect } from "react";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import ProjectStats from "./ProjectStats";
import ProjectTabs from "./ProjectTabs";
import { createClient } from "@/utils/supabase/client";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    document.title = "Project Management | HRMS";
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Resolve company_id
      let { data: comp } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user.id)
        .maybeSingle();

      if (!comp) {
        const { data: emp } = await supabase
          .from('employees')
          .select('company_id')
          .eq('email', user.email)
          .maybeSingle();
        if (emp) {
          const { data: compEmp } = await supabase
            .from('company_settings')
            .select('*')
            .eq('company_id', emp.company_id)
            .maybeSingle();
          comp = compEmp;
        }
      }

      if (comp) {
        setCompanySettings(comp);

        // Load projects from the `projects` table
        const { data: dbProjects } = await supabase
          .from('projects')
          .select('*')
          .eq('company_id', comp.company_id)
          .order('created_at', { ascending: false });

        // Map DB snake_case columns → UI shape
        const mapped = (dbProjects || []).map((p: any) => ({
          id: p.id,
          code: p.project_code,
          name: p.project_name,
          image: p.image || '🏗️',
          client: p.client_company || (p.classification === 'Internal Project' ? 'Internal' : 'External'),
          clientInitials: (p.client_company || '').slice(0, 2).toUpperCase() || '--',
          clientCompany: p.client_company || '',
          owner: p.owner || 'Project Manager',
          ownerColor: '#007AFF',
          ownerBg: '#E5F1FF',
          category: p.project_type || 'Construction',
          status: p.project_status === 'On Process' ? 'Active' : p.project_status === 'Completed' ? 'Completed' : 'On Hold',
          startDate: p.start_date || '',
          endDate: p.end_date || '',
          progress: p.progress || 0,
          financials: p.financials || `S$ ${Number(p.client_billing_rate || 0).toFixed(2)}`,
          profit: p.profit || 'S$ 0.00',
          classification: p.classification || 'Internal Project',
          is_draft: p.is_draft || false,
          // Pass full DB row fields for edit mode
          ...p,
        }));

        const getProjectCode = (compName: string) => {
          const clean = compName.replace(/[^a-zA-Z\s]/g, '');
          const words = clean.split(/\s+/).filter(Boolean);
          let prefix = 'DA';
          if (words.length >= 2) {
            prefix = (words[0][0] + words[1][0]).toUpperCase();
          } else if (words.length === 1) {
            prefix = (words[0][0] + (words[0][1] || 'A')).toUpperCase();
          }
          return `${prefix}0001PRJ26`;
        };

        const targetCode = getProjectCode(comp.company_name || 'Dort Asia');
        const defaultManager = 'Super Admin';

        // Prepend the static "Company Expenditure" default project (in-memory only)
        const defaultProject = {
          id: 'default-project',
          code: targetCode,
          name: 'Company Expenditure',
          image: '🏢',
          client: '',
          clientInitials: '',
          clientCompany: '',
          owner: defaultManager,
          ownerColor: '#007AFF',
          ownerBg: '#E5F1FF',
          category: 'Tech',
          status: 'Active',
          startDate: '',
          endDate: '',
          progress: 100,
          financials: 'S$ 0.00',
          profit: 'S$ 0.00',
        };

        const allProjects = [defaultProject, ...mapped];
        setProjects(allProjects);
      }
    } catch (e) {
      console.error('Load projects error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">
      {/* Header — identical structure to Employees / Attendance pages */}
      <header className="flex items-center justify-between px-6 py-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-[0.04em] uppercase">
            Projects
          </h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">
            Overview of all company projects
          </p>
        </div>
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 pb-8 flex flex-col gap-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF] border-t-transparent"></div>
          </div>
        ) : (
          <>
            <ProjectStats projects={projects} />
            <ProjectTabs 
              projects={projects} 
              companySettings={companySettings} 
              onRefresh={loadProjects} 
            />
          </>
        )}
      </main>
    </div>
  );
}
