import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface CompanyProfile {
  id: string
  name?: string
  company_name?: string
  logo_url?: string
  branch_location?: string
  [key: string]: any
}

interface CompanyState {
  company: CompanyProfile | null
  isLoading: boolean
  fetchCompany: (userId: string, email?: string) => Promise<void>
  setCompany: (company: CompanyProfile | null) => void
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  isLoading: false,
  setCompany: (company) => set({ company }),
  fetchCompany: async (userId: string, email?: string) => {
    set({ isLoading: true })
    try {
      let companyId = null
      
      const { data: employee } = await supabase
        .from('employees')
        .select('company_id')
        .eq('user_id', userId)
        .maybeSingle()
        
      if (employee?.company_id) {
        companyId = employee.company_id
      } else {
        const compOrConditions = [`super_admin_id.eq.${userId}`]
        if (email) compOrConditions.push(`login_email.eq.${email}`)
        const { data: adminComp } = await supabase
          .from('companies')
          .select('id')
          .or(compOrConditions.join(','))
          .maybeSingle()
        if (adminComp) companyId = adminComp.id
      }

      if (companyId) {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle()
          
        if (comp) {
          set({ company: comp })
        }
      }
    } catch (error) {
      console.error('Failed to fetch company:', error)
    } finally {
      set({ isLoading: false })
    }
  }
}))
