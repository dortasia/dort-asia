import { create } from 'zustand'
import { UserRole, SYSTEM_ROLES } from '@/config/constants'
import { hasPermission, Permission } from '@/config/permissions'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
  department?: string
  jobTitle?: string
  designation?: string
  phone?: string
}

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  login: (user: UserProfile) => void
  logout: () => Promise<void>
  can: (permission: Permission) => boolean
}

const mockDefaultUser: UserProfile = {
  id: 'usr_mock_01',
  email: 'alex.tan@xentra.io',
  fullName: 'Alex Tan',
  role: SYSTEM_ROLES.SUPER_ADMIN,
  avatarUrl: '',
  department: 'People Operations',
  jobTitle: 'VP of Human Resources',
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore sign out errors
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
    
    // Redirect to landing project
    const currentOrigin = window.location.origin
    window.location.href = `${env.VITE_LANDING_URL}/login?logout=true&redirect=${encodeURIComponent(currentOrigin)}`
  },
  can: (permission: Permission) => {
    const user = get().user
    if (!user) return false
    return hasPermission(user.role, permission)
  },
}))
