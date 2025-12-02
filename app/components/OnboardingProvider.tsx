'use client'

import { useState, useEffect } from 'react'
import OnboardingWizard from './OnboardingWizard'

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem('onboarding_completed')
    const user = localStorage.getItem('user')
    
    if (!onboardingCompleted && user) {
      // Check with API
      const token = localStorage.getItem('token')
      fetch('/api/kasa/onboarding/status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (!data.completed) {
            setShowOnboarding(true)
          }
        })
        .catch(() => {
          // If API fails, check localStorage
          if (!onboardingCompleted) {
            setShowOnboarding(true)
          }
        })
    }
  }, [])

  const handleComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem('onboarding_completed', 'true')
  }

  const handleSkip = () => {
    setShowOnboarding(false)
    localStorage.setItem('onboarding_completed', 'true')
  }

  return (
    <>
      {children}
      <OnboardingWizard
        isOpen={showOnboarding}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </>
  )
}

