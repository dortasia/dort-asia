"use client";

import { useState, useEffect } from "react";

export interface AdminStatus {
  isAdmin: boolean;
  role: "SUPER_ADMIN" | "ADMIN" | null;
  email: string | null;
  isLoading: boolean;
}

export function useAdminStatus(): AdminStatus {
  const [status, setStatus] = useState<AdminStatus>({
    isAdmin: false,
    role: null,
    email: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/check", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStatus({
              isAdmin: Boolean(data.isAdmin),
              role: data.role || null,
              email: data.email || null,
              isLoading: false,
            });
          }
        } else {
          if (isMounted) {
            setStatus({ isAdmin: false, role: null, email: null, isLoading: false });
          }
        }
      } catch {
        if (isMounted) {
          setStatus({ isAdmin: false, role: null, email: null, isLoading: false });
        }
      }
    }

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  return status;
}
