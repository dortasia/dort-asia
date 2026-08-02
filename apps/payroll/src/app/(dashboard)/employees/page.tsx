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

        const { data, error } = await supabase
          .from('employees')
          .select('*, departments!employees_department_id_fkey(name)')
          .eq('company_id', user.id)
          .order('name', { ascending: true });

        if (error) {
          console.error('Failed to fetch employees:', error.message);
          setLoading(false);
          return;
        }

        const mapped: CachedEmployee[] = (data || []).map((emp: any) => {
          const { bg: color, tint: bg } = getAvatarColor(emp.name);
          const deptName = emp.departments?.name || "General";
          const isComplete = !!(emp.emp_id && emp.department_id);
          return {
            id: emp.id,
            name: emp.name,
            role: emp.role || "Employee",
            designation: emp.job_role || emp.role || "Employee",
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
      <header className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight uppercase">
            PEOPLE
          </h1>
          <p className="text-[14px] text-gray-400 font-medium mt-1">
            Overview of People data
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-6 pb-8">
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
