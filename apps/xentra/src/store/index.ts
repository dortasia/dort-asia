import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

// ── Cached sidebar types ──
export interface CachedUserProfile {
  name: string;
  title: string;
  avatar: string;
  avatarUrl: string;
}

export interface CachedCompanyProfile {
  name: string;
  location: string;
  logoUrl: string;
  initials: string;
}

export interface CachedTeamPerson {
  name: string;
  initials: string;
  avatarUrl: string;
  isCurrentUser?: boolean;
}

export interface CachedRoleBucket {
  role: string;
  members: CachedTeamPerson[];
}

export interface CachedSidebarData {
  userProfile: CachedUserProfile;
  companyProfile: CachedCompanyProfile;
  isSuperAdmin: boolean;
  roleBuckets: CachedRoleBucket[];
  totalTeamCount: number;
  previewMembers: CachedTeamPerson[];
  attendanceBadge?: number;
}

// ── Cached employees type ──
export interface CachedEmployee {
  id: string;
  name: string;
  role: string;
  designation?: string;
  empId: string | null;
  department: string;
  email: string;
  mobile: string;
  jobType: string;
  initials: string;
  isComplete: boolean;
  color: string;
  bg: string;
  date_of_birth?: string;
  created_at?: string;
  rawData?: any;
}

interface AppState {
  user: unknown | null;
  setUser: (user: unknown | null) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;

  // ── Cache fields ──
  cachedSidebar: CachedSidebarData | null;
  cacheTimestamp: number | null;
  setCachedSidebar: (data: CachedSidebarData) => void;
  cachedEmployees: CachedEmployee[] | null;
  setCachedEmployees: (data: CachedEmployee[]) => void;
  clearCache: () => void;

  // ── UI States ──
  isSamOpen: boolean;
  setSamOpen: (isOpen: boolean) => void;
  isSpotlightOpen: boolean;
  setSpotlightOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
      accentColor: "#007AFF",
      setAccentColor: (color) => set({ accentColor: color }),

      // ── Cache defaults ──
      cachedSidebar: null,
      cacheTimestamp: null,
      setCachedSidebar: (data) =>
        set({ cachedSidebar: data, cacheTimestamp: Date.now() }),
      cachedEmployees: null,
      setCachedEmployees: (data) => set({ cachedEmployees: data }),
      clearCache: () =>
        set({ 
          cachedSidebar: null, 
          cacheTimestamp: null, 
          cachedEmployees: null,
        }),

      // ── UI States ──
      isSamOpen: false,
      setSamOpen: (isOpen) => set({ isSamOpen: isOpen }),
      isSpotlightOpen: false,
      setSpotlightOpen: (isOpen) => set({ isSpotlightOpen: isOpen }),
    }),
    {
      name: "hrms-store-v3",
      /** Avoid SSR HTML vs first client paint mismatch (persist reads localStorage on client only after rehydrate). */
      skipHydration: true,
      partialize: (state) => ({
        accentColor: state.accentColor,
        theme: state.theme,
        cachedSidebar: state.cachedSidebar,
        cacheTimestamp: state.cacheTimestamp,
        cachedEmployees: state.cachedEmployees,
      }),
    }
  )
);
