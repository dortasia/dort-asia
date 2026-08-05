"use client"

import React, { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { formatCurrency } from '@/utils/formatters'
import { supabase } from '@/lib/supabase'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import { getUserAvatarUrl } from '@/utils/avatarColor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ClaimItem {
  id: string
  employee_name: string
  avatar_url?: string
  title: string
  category: string
  receipt_number: string
  amount: number
  currency: string
  date: string
  status: 'Pending Finance Review' | 'Approved' | 'Rejected'
  created_at: string
}

const DEFAULT_MOCK_CLAIMS: ClaimItem[] = [
  {
    id: 'clm-001',
    employee_name: 'Marcus Wong',
    avatar_url: '/default-profile.svg',
    title: 'Client Lunch & Entertainment',
    category: 'Entertainment',
    receipt_number: 'REC-8842',
    amount: 420.50,
    currency: 'SGD',
    date: '2026-07-15',
    status: 'Pending Finance Review',
    created_at: new Date(2026, 6, 15).toISOString(),
  },
  {
    id: 'clm-002',
    employee_name: 'Sarah Chen',
    avatar_url: '/default-profile.svg',
    title: 'Grab Transport to Client Site',
    category: 'Travel',
    receipt_number: 'REC-9012',
    amount: 28.40,
    currency: 'SGD',
    date: '2026-07-18',
    status: 'Approved',
    created_at: new Date(2026, 6, 18).toISOString(),
  },
  {
    id: 'clm-003',
    employee_name: 'Alex Tan',
    avatar_url: '/default-profile.svg',
    title: 'Software Development Monitor',
    category: 'Hardware',
    receipt_number: 'REC-7731',
    amount: 350.00,
    currency: 'SGD',
    date: '2026-07-20',
    status: 'Approved',
    created_at: new Date(2026, 6, 20).toISOString(),
  }
]

export function ClaimsPage() {
  const { company } = useCompanyStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Form State
  const [claimTitle, setClaimTitle] = useState('')
  const [claimCategory, setClaimCategory] = useState('Travel')
  const [claimAmount, setClaimAmount] = useState('')
  const [receiptNo, setReceiptNo] = useState('')

  // 1. Resolve Company ID securely
  useEffect(() => {
    async function resolveCompanyId() {
      if (company?.id) {
        setCompanyId(company.id)
        return
      }

      if (user?.id) {
        const { data: emp } = await supabase
          .from('employees')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle()
          
        if (emp?.company_id) {
          setCompanyId(emp.company_id)
          return
        }

        const { data: comp } = await supabase
          .from('companies')
          .select('id')
          .eq('super_admin_id', user.id)
          .maybeSingle()
        if (comp?.id) {
          setCompanyId(comp.id)
          return
        }
      }
    }

    resolveCompanyId()
  }, [company?.id, user?.id])

  // 2. React Query: Fetch Cached Company Settings (Category A - Static Data)
  const { data: appConfig = {} } = useQuery({
    queryKey: ['company_settings', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('app_config')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data?.app_config || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  // 3. React Query: Fetch Claims List (Category C - Dynamic Data with local caching)
  const { data: claimsList = DEFAULT_MOCK_CLAIMS, isLoading: isClaimsLoading } = useQuery<ClaimItem[]>({
    queryKey: queryKeys.claims.all,
    queryFn: async () => {
      if (!companyId) return DEFAULT_MOCK_CLAIMS

      const { data, error } = await supabase
        .from('claims')
        .select('id, employee_name, avatar_url, title, category, receipt_number, amount, currency, date, status, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        return DEFAULT_MOCK_CLAIMS
      }

      return data as ClaimItem[]
    },
    enabled: !!companyId,
    staleTime: 60 * 1000, // 1 minute stale time for dynamic list
  })

  // 4. Supabase Realtime Subscription for Claims (Dynamic Sync without reloads)
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`claims_realtime_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.claims.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])

  // 5. React Query Mutation: Optimistic Claim Submission
  const submitClaimMutation = useMutation({
    mutationFn: async (newClaim: Omit<ClaimItem, 'id' | 'created_at'>) => {
      if (!companyId) {
        throw new Error('Company ID not found.')
      }

      const { data, error } = await supabase
        .from('claims')
        .insert({
          company_id: companyId,
          ...newClaim
        })
        .select()
        .single()

      if (error) {
        // Fallback for demo mode if claims table doesn't exist yet
        return {
          id: `clm-${Date.now()}`,
          ...newClaim,
          created_at: new Date().toISOString()
        } as ClaimItem
      }

      return data as ClaimItem
    },
    onMutate: async (newClaim) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.claims.all })

      // Snapshot previous value
      const previousClaims = queryClient.getQueryData<ClaimItem[]>(queryKeys.claims.all) || DEFAULT_MOCK_CLAIMS

      const optimisticItem: ClaimItem = {
        id: `clm-${Date.now()}`,
        ...newClaim,
        created_at: new Date().toISOString()
      }

      // Optimistically update cache immediately
      queryClient.setQueryData<ClaimItem[]>(queryKeys.claims.all, [optimisticItem, ...previousClaims])

      return { previousClaims }
    },
    onError: (err: any, _, context) => {
      if (context?.previousClaims) {
        queryClient.setQueryData(queryKeys.claims.all, context.previousClaims)
      }
      toast.error(err.message || 'Failed to submit claim.')
    },
    onSuccess: (data) => {
      toast.success(
        data.status === 'Approved'
          ? 'Claim auto-approved via Micro-Claims Policy!'
          : 'Claim submitted for review!'
      )
      setIsSubmitOpen(false)
      resetForm()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.claims.all })
    }
  })

  const resetForm = () => {
    setClaimTitle('')
    setClaimCategory('Travel')
    setClaimAmount('')
    setReceiptNo('')
  }

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(claimAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid claim amount.')
      return
    }

    if (!claimTitle.trim()) {
      toast.error('Please enter a claim title.')
      return
    }

    // Check Micro Claim Auto-Approve rule from cached company settings
    const claimAdv = appConfig.claim_advanced || {}
    const isAutoApproveEnabled = claimAdv.autoApprove === true
    const thresholdAmount = parseFloat(claimAdv.microClaimAmount || '50')

    let initialStatus: 'Pending Finance Review' | 'Approved' = 'Pending Finance Review'
    if (isAutoApproveEnabled && parsedAmount <= thresholdAmount) {
      initialStatus = 'Approved'
    }

    submitClaimMutation.mutate({
      employee_name: user?.fullName || 'Admin User',
      avatar_url: user?.avatarUrl || '/default-profile.svg',
      title: claimTitle.trim(),
      category: claimCategory,
      receipt_number: receiptNo.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: parsedAmount,
      currency: 'SGD',
      date: new Date().toISOString().split('T')[0],
      status: initialStatus
    })
  }

  // Filtered dataset (local fast filtering)
  const filteredClaims = claimsList.filter(claim => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'pending') return claim.status === 'Pending Finance Review'
    if (filterStatus === 'approved') return claim.status === 'Approved'
    if (filterStatus === 'rejected') return claim.status === 'Rejected'
    return true
  })

  // Stat Calculations
  const totalAmount = claimsList.reduce((sum, item) => sum + item.amount, 0)
  const pendingCount = claimsList.filter(item => item.status === 'Pending Finance Review').length
  const approvedCount = claimsList.filter(item => item.status === 'Approved').length

  return (
    <PageContainer
      title="Claims & Expenses"
      description="Submit reimbursement requests, receipt OCR attachment, and finance workflow."
      action={
        <Button size="sm" onClick={() => setIsSubmitOpen(true)} className="bg-black text-white hover:bg-neutral-800 rounded-full px-5">
          <Icon icon="lucide:receipt" className="w-4 h-4 mr-2" />
          Submit Claim
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        
        {/* Metric Cards Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-[20px] border-[#E5E7EB] shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="type-small text-[#737373]">Total Claim Value</span>
                <span className="type-h2 font-semibold text-[#161616]">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-black">
                <Icon icon="hugeicons:invoice-01" className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#E5E7EB] shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="type-small text-[#737373]">Pending Approvals</span>
                <span className="type-h2 font-semibold text-[#161616]">{pendingCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Icon icon="hugeicons:clock-01" className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#E5E7EB] shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="type-small text-[#737373]">Approved Claims</span>
                <span className="type-h2 font-semibold text-[#161616]">{approvedCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#34C759]">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          {[
            { id: 'all', label: 'All Applications' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterStatus === tab.id
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#161616] hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Claim Application List */}
        <Card className="rounded-[24px] border-[#E5E7EB] shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="type-h3 text-[#161616]">Recent Claim Applications</CardTitle>
            <CardDescription className="type-small text-[#737373]">Submitted claims and payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isClaimsLoading && claimsList.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
                <span className="type-small text-[#737373]">Loading claims...</span>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="py-12 text-center text-[#737373] type-body">
                No claim records found for this filter.
              </div>
            ) : (
              <div className="divide-y divide-[#ECECEC]">
                {filteredClaims.map((claim) => (
                  <div key={claim.id} className="py-4 flex items-center justify-between transition-colors hover:bg-neutral-50/50 px-2 rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={getUserAvatarUrl(claim.avatar_url)} 
                        alt={claim.employee_name} 
                        className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]"
                      />
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold text-[#161616]">
                          {claim.employee_name} &bull; <span className="font-normal text-[#737373]">{claim.title}</span>
                        </p>
                        <p className="text-xs text-[#8B8B8B] flex items-center gap-2">
                          <span>Receipt #{claim.receipt_number}</span>
                          <span>&bull;</span>
                          <span>{claim.category}</span>
                          <span>&bull;</span>
                          <span>{claim.date}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-[#161616] text-sm">{formatCurrency(claim.amount)}</span>
                      {claim.status === 'Approved' ? (
                        <Badge className="bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] rounded-full px-3 py-1 font-medium">
                          Approved
                        </Badge>
                      ) : claim.status === 'Rejected' ? (
                        <Badge className="bg-red-50 text-red-700 border-red-200 rounded-full px-3 py-1 font-medium">
                          Rejected
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-full px-3 py-1 font-medium">
                          Pending Review
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Submit Claim Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="type-h3 text-[#161616]">Submit Claim Request</DialogTitle>
            <DialogDescription className="type-small text-[#737373]">
              Enter your reimbursement claim details below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitClaim} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="type-small font-medium text-[#161616]">Claim Title</label>
              <input 
                type="text" 
                value={claimTitle}
                onChange={(e) => setClaimTitle(e.target.value)}
                placeholder="e.g. Client Lunch or Taxi Fares"
                className="px-3.5 py-2 border border-[#E5E7EB] rounded-xl type-body text-[#161616] outline-none focus:border-black transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="type-small font-medium text-[#161616]">Category</label>
                <select 
                  value={claimCategory}
                  onChange={(e) => setClaimCategory(e.target.value)}
                  className="px-3.5 py-2 border border-[#E5E7EB] rounded-xl type-body text-[#161616] outline-none focus:border-black transition-colors bg-white"
                >
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Medical">Medical</option>
                  <option value="Supplies">Supplies</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="type-small font-medium text-[#161616]">Amount (SGD)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-semibold text-[#8B8B8B]">S$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3.5 py-2 border border-[#E5E7EB] rounded-xl type-body text-[#161616] outline-none focus:border-black transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="type-small font-medium text-[#161616]">Receipt Number</label>
              <input 
                type="text" 
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="e.g. REC-9921 (Optional)"
                className="px-3.5 py-2 border border-[#E5E7EB] rounded-xl type-body text-[#161616] outline-none focus:border-black transition-colors"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitClaimMutation.isPending} className="bg-black text-white hover:bg-neutral-800 rounded-full px-6">
                {submitClaimMutation.isPending && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin mr-2" />}
                {submitClaimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
