'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Lazy load heavy components
export const LazyAdvancedAnalytics = dynamic(
  () => import('./AdvancedAnalytics'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false 
  }
)

export const LazyFinancialForecasting = dynamic(
  () => import('./FinancialForecasting'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false 
  }
)

export const LazyCampaignBuilder = dynamic(
  () => import('./CampaignBuilder'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false 
  }
)

export const LazyVisualWorkflowBuilder = dynamic(
  () => import('./VisualWorkflowBuilder'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false 
  }
)

export const LazyEmailComposer = dynamic(
  () => import('./EmailComposer'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false 
  }
)

export const LazySMSComposer = dynamic(
  () => import('./SMSComposer'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false 
  }
)

export const LazyChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
)

// Generic lazy loader with loading state
export function lazyLoad<T = {}>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  LoadingComponent?: ComponentType
) {
  return dynamic(importFunc, {
    loading: LoadingComponent ? () => <LoadingComponent /> : undefined,
    ssr: false,
  })
}

