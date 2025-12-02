'use client'

import { useState } from 'react'
import AtRiskFamilies from '@/app/components/AtRiskFamilies'
import { useRouter } from 'next/navigation'

export default function PaymentInsightsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Payment Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze payment patterns and identify families that may need attention
          </p>
        </div>

        <AtRiskFamilies
          onFamilyClick={(familyId) => {
            router.push(`/families/${familyId}`)
          }}
        />
      </div>
    </div>
  )
}

