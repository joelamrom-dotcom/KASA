'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Payment {
  _id: string
  familyId: string
  amount: number
  date: string
  method: string
  status: string
  notes?: string
  [key: string]: any
}

const PAYMENTS_QUERY_KEY = ['payments']

// Fetch all payments
export function usePayments() {
  return useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: async (): Promise<Payment[]> => {
      const res = await fetch('/api/kasa/payments')
      if (!res.ok) {
        throw new Error('Failed to fetch payments')
      }
      return res.json()
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  })
}

// Fetch single payment by ID
export function usePayment(id: string) {
  return useQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, id],
    queryFn: async (): Promise<Payment> => {
      const res = await fetch(`/api/kasa/payments/${id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch payment')
      }
      return res.json()
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

// Create payment with optimistic updates
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Payment>): Promise<Payment> => {
      const res = await fetch('/api/kasa/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error('Failed to create payment')
      }
      return res.json()
    },
    onMutate: async (newPayment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PAYMENTS_QUERY_KEY })
      
      // Snapshot previous value
      const previousPayments = queryClient.getQueryData<Payment[]>(PAYMENTS_QUERY_KEY)
      
      // Optimistically update to the new value
      if (previousPayments) {
        queryClient.setQueryData<Payment[]>(PAYMENTS_QUERY_KEY, (old) => [
          ...(old || []),
          { ...newPayment, _id: `temp-${Date.now()}` } as Payment,
        ])
      }
      
      return { previousPayments }
    },
    onError: (err, newPayment, context) => {
      // Rollback on error
      if (context?.previousPayments) {
        queryClient.setQueryData(PAYMENTS_QUERY_KEY, context.previousPayments)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
    },
  })
}

// Update payment with optimistic updates
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Payment> }): Promise<Payment> => {
      const res = await fetch(`/api/kasa/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error('Failed to update payment')
      }
      return res.json()
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PAYMENTS_QUERY_KEY })
      
      const previousPayments = queryClient.getQueryData<Payment[]>(PAYMENTS_QUERY_KEY)
      
      if (previousPayments) {
        queryClient.setQueryData<Payment[]>(PAYMENTS_QUERY_KEY, (old) =>
          (old || []).map((payment) =>
            payment._id === id ? { ...payment, ...data } : payment
          )
        )
      }
      
      return { previousPayments }
    },
    onError: (err, variables, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(PAYMENTS_QUERY_KEY, context.previousPayments)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
    },
  })
}

// Delete payment with optimistic updates
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/kasa/payments/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete payment')
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PAYMENTS_QUERY_KEY })
      
      const previousPayments = queryClient.getQueryData<Payment[]>(PAYMENTS_QUERY_KEY)
      
      if (previousPayments) {
        queryClient.setQueryData<Payment[]>(PAYMENTS_QUERY_KEY, (old) =>
          (old || []).filter((payment) => payment._id !== id)
        )
      }
      
      return { previousPayments }
    },
    onError: (err, id, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(PAYMENTS_QUERY_KEY, context.previousPayments)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
    },
  })
}

// Prefetch payment details on hover
export function usePrefetchPayment() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: [...PAYMENTS_QUERY_KEY, id],
      queryFn: async (): Promise<Payment> => {
        const res = await fetch(`/api/kasa/payments/${id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch payment')
        }
        return res.json()
      },
      staleTime: 30000,
    })
  }
}
