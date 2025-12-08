'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

// Types
interface Family {
  _id: string
  name: string
  email?: string
  phone?: string
  memberCount?: number
  openBalance?: number
  [key: string]: any
}

// API Functions
async function fetchFamilies(): Promise<Family[]> {
  const token = localStorage.getItem('token')
  const res = await fetch('/api/kasa/families', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error('Failed to fetch families')
  return res.json()
}

async function fetchFamily(id: string): Promise<Family> {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/kasa/families/${id}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error('Failed to fetch family')
  const data = await res.json()
  return data.family
}

async function createFamily(family: Partial<Family>): Promise<Family> {
  const token = localStorage.getItem('token')
  const res = await fetch('/api/kasa/families', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(family)
  })
  if (!res.ok) throw new Error('Failed to create family')
  const data = await res.json()
  return data.family
}

async function updateFamily({ id, data }: { id: string, data: Partial<Family> }): Promise<Family> {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/kasa/families/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update family')
  const result = await res.json()
  return result.family
}

async function deleteFamily(id: string): Promise<void> {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/kasa/families/${id}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error('Failed to delete family')
}

// Hooks
export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: fetchFamilies,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useFamily(id: string | null) {
  return useQuery({
    queryKey: ['family', id],
    queryFn: () => fetchFamily(id!),
    enabled: !!id, // Only fetch if id exists
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useCreateFamily() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: createFamily,
    // Optimistic update
    onMutate: async (newFamily) => {
      await queryClient.cancelQueries({ queryKey: ['families'] })
      
      const previousFamilies = queryClient.getQueryData<Family[]>(['families'])
      
      // Optimistically update cache
      if (previousFamilies) {
        queryClient.setQueryData<Family[]>(['families'], (old) => [
          ...(old || []),
          { ...newFamily, _id: 'temp-' + Date.now() } as Family
        ])
      }
      
      return { previousFamilies }
    },
    onError: (err, newFamily, context) => {
      // Rollback on error
      if (context?.previousFamilies) {
        queryClient.setQueryData(['families'], context.previousFamilies)
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['families'] })
      queryClient.setQueryData(['family', data._id], data)
    },
  })
}

export function useUpdateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateFamily,
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['family', id] })
      await queryClient.cancelQueries({ queryKey: ['families'] })
      
      const previousFamily = queryClient.getQueryData<Family>(['family', id])
      const previousFamilies = queryClient.getQueryData<Family[]>(['families'])
      
      // Optimistically update single family
      if (previousFamily) {
        queryClient.setQueryData<Family>(['family', id], { ...previousFamily, ...data })
      }
      
      // Optimistically update families list
      if (previousFamilies) {
        queryClient.setQueryData<Family[]>(['families'], (old) =>
          (old || []).map(f => f._id === id ? { ...f, ...data } : f)
        )
      }
      
      return { previousFamily, previousFamilies }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousFamily) {
        queryClient.setQueryData(['family', id], context.previousFamily)
      }
      if (context?.previousFamilies) {
        queryClient.setQueryData(['families'], context.previousFamilies)
      }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['family', id], data)
      queryClient.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export function useDeleteFamily() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: deleteFamily,
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['families'] })
      
      const previousFamilies = queryClient.getQueryData<Family[]>(['families'])
      
      // Optimistically remove from list
      if (previousFamilies) {
        queryClient.setQueryData<Family[]>(['families'], (old) =>
          (old || []).filter(f => f._id !== id)
        )
      }
      
      return { previousFamilies }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousFamilies) {
        queryClient.setQueryData(['families'], context.previousFamilies)
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['family', id] })
      queryClient.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

// Prefetch helpers
export function usePrefetchFamily() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['family', id],
      queryFn: () => fetchFamily(id),
      staleTime: 1 * 60 * 1000,
    })
  }
}
