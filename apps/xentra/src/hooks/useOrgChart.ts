"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { buildOrgTree, OrgEmployee, OrgNode } from "@/lib/orgChartUtils";

export interface CompanyInfo {
  name: string;
  logo: string | null;
}

interface UseOrgChartResult {
  root: OrgNode | null;
  employees: OrgEmployee[];
  company: CompanyInfo | null;
  loading: boolean;
  error: string | null;
  hasManagerId: boolean;
  refresh: () => void;
}

export function useOrgChart(): UseOrgChartResult {
  const supabase = createClient();
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasManagerId, setHasManagerId] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not authenticated"); setLoading(false); return; }

      // Get company_id
      const { data: me } = await supabase
        .from("employees")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const companyId = me?.company_id;

      // Fetch company settings + employees in parallel
      const [empRes, companyRes] = await Promise.all([
        (() => {
          let q = supabase
            .from("employees")
            .select("*, departments!fk_employees_department(department_name)")
            .order("name", { ascending: true });
          if (companyId) q = q.eq("company_id", companyId);
          return q;
        })(),
        supabase
          .from("company_settings")
          .select("company_name, logo_url")
          .eq("company_id", user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (empRes.error) { setError(empRes.error.message); setLoading(false); return; }

      const rows = empRes.data ?? [];

      // Detect optional columns from first row
      const firstRow = rows[0] ?? {};
      const _hasManagerId = "manager_id" in firstRow;
      const _hasStatus    = "status" in firstRow;
      const _hasAvatarUrl = "avatar_url" in firstRow;
      const _hasIsHead    = "is_head" in firstRow;

      const mapped: OrgEmployee[] = rows.map((row: any) => ({
        id: row.id,
        full_name: row.name ?? row.full_name ?? "",
        role: row.role ?? row.designation ?? "",
        department: row.departments?.department_name ?? "",
        profile_image: _hasAvatarUrl ? (row.avatar_url ?? null) : null,
        manager_id: _hasManagerId ? (row.manager_id ?? null) : null,
        status: _hasStatus ? (row.status ?? "active") : "active",
        company_id: row.company_id ?? "",
        is_head: _hasIsHead ? (row.is_head ?? false) : false,
        email: row.email ?? "",
        mobile: row.mobile ?? "",
      }));

      // Company info
      const cs = companyRes.data;
      setCompany(cs ? { name: cs.company_name ?? "Organization", logo: cs.logo_url ?? null } : null);

      setHasManagerId(_hasManagerId);
      setEmployees(mapped);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [tick]);

  const root = useMemo(() => {
    if (employees.length === 0) return null;
    return buildOrgTree(employees);
  }, [employees]);

  return { root, employees, company, loading, error, hasManagerId, refresh };
}
