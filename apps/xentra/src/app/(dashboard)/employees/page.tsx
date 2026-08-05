"use client";

import React, { useState, useEffect } from 'react';
import EmployeeTableRenderer from './EmployeeTableRenderer';
import { useAppStore, CachedEmployee } from '@/store';
import { createClient } from '@/utils/supabase/client';
import HeaderSearchBar from "@/components/HeaderSearchBar";

import { getAvatarColor, getInitials } from "@/utils/avatarColor";

export default function EmployeesPage() {
  const cachedEmployees = useAppStore((s) => s.cachedEmployees);
  const setCachedEmployees = useAppStore((s) => s.setCachedEmployees);

  // Hydrate from cache instantly, then refresh in background
  const [employees, setEmployees] = useState<CachedEmployee[]>(cachedEmployees ?? []);
  const [loading, setLoading] = useState(!cachedEmployees);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const supabase = createClient();
        // Wait for auth session to be ready (needed for RLS)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Resolve the correct company_id
        let resolvedCompanyId = user.id; // fallback
        const { data: curEmp } = await supabase
          .from('employees')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (curEmp?.company_id) {
          resolvedCompanyId = curEmp.company_id;
        } else {
          const { data: adminComp } = await supabase
            .from('companies')
            .select('id')
            .eq('super_admin_id', user.id)
            .maybeSingle();
          if (adminComp?.id) {
            resolvedCompanyId = adminComp.id;
          }
        }

        const { data, error } = await supabase
          .from('employees')
          .select('*, departments!fk_employees_department(department_name)')
          .eq('company_id', resolvedCompanyId)
          .order('name', { ascending: true });

        if (error) {
          console.error('Failed to fetch employees:', error.message);
          setLoading(false);
          return;
        }

        const mapped: CachedEmployee[] = (data || []).map((emp: any) => {
          const { bg: color, tint: bg } = getAvatarColor(emp.name);
          const deptName = emp.departments?.department_name || "General";
          const isComplete = !!(emp.emp_id && emp.department_id);
          return {
            id: emp.id,
            name: emp.name,
            role: emp.role || "Employee",
            designation: emp.designation || emp.role || "Employee",
            empId: emp.emp_id,
            department: deptName,
            email: emp.email,
            mobile: emp.mobile || "-",
            jobType: emp.job_type || "Full Time",
            initials: getInitials(emp.name),
            isComplete,
            color,
            bg,
            date_of_birth: emp.date_of_birth,
            created_at: emp.date_of_joining || emp.created_at,
            avatar_url: emp.avatar_url || null,
            rawData: emp
          };
        });

        setEmployees(mapped);
        setCachedEmployees(mapped);
      } catch (err) {
        console.error('Employee fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">
      <header className="flex items-center justify-between p-4 font-sf">
        <div>
          <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight font-sans">Employees</h1>
          <p className="text-[14px] text-[#6B7280] dark:text-gray-400 font-medium mt-0.5 font-sf">Overview of Employees data</p>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 p-4 pt-0">
        <div className="min-h-[500px] flex flex-col">
          {loading && employees.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-3 border-[var(--user-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <EmployeeTableRenderer employees={employees} />
          )}
        </div>
      </main>
    </div>
  );
}
