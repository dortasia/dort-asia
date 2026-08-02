"use client"

import React, { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children, initialUser }: { children: React.ReactNode, initialUser?: any }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // If we have an initialUser from the Server Component, use it immediately
    if (initialUser) {
      setUser(initialUser)
      setLoading(false)
      useCompanyStore.getState().fetchCompany(initialUser.id, initialUser.email || undefined)
    }

    const initAuth = async () => {
      if (!initialUser) {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Map supabase user to our UserProfile interface
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || '',
          role: session.user.user_metadata?.role || 'admin',
          avatarUrl: session.user.user_metadata?.avatar_url || '',
        })
        useCompanyStore.getState().fetchCompany(session.user.id, session.user.email || undefined)
      } else {
        setUser(null)
      }
      setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || '',
          role: session.user.user_metadata?.role || 'admin',
          avatarUrl: session.user.user_metadata?.avatar_url || '',
        })
        useCompanyStore.getState().fetchCompany(session.user.id, session.user.email || undefined)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return <>{children}</>
}
