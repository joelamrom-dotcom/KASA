'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XMarkIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ReactNode
  optional?: boolean
}

interface OnboardingWizardProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
}

export default function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'USD',
    language: 'en',
    notifications: true,
    theme: 'light',
  })

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Kasa!',
      description: 'Let\'s get you set up in just a few steps.',
      component: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to Your Dashboard</h3>
            <p className="text-gray-600">
              We'll help you configure your account and get started with the platform.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Tell us a bit about yourself.',
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              value={userData.firstName}
              onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              value={userData.lastName}
              onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              value={userData.organizationName}
              onChange={(e) => setUserData({ ...userData, organizationName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Your Organization"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Customize your experience.',
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={userData.timezone}
              onChange={(e) => setUserData({ ...userData, timezone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Asia/Jerusalem">Israel Time (IST)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={userData.language}
              onChange={(e) => setUserData({ ...userData, language: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="en">English</option>
              <option value="he">Hebrew (עברית)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={userData.theme}
              onChange={(e) => setUserData({ ...userData, theme: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={userData.notifications}
              onChange={(e) => setUserData({ ...userData, notifications: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="notifications" className="ml-2 text-sm">
              Enable email notifications
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'features',
      title: 'Explore Features',
      description: 'Discover what you can do with Kasa.',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">📊 Analytics</h4>
              <p className="text-sm text-gray-600">Track your financial data and insights</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">💳 Payments</h4>
              <p className="text-sm text-gray-600">Manage payments and invoices</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">👥 Families</h4>
              <p className="text-sm text-gray-600">Organize family information</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">📅 Calendar</h4>
              <p className="text-sm text-gray-600">Schedule and track events</p>
            </div>
          </div>
        </div>
      ),
      optional: true,
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Your account is ready to use.',
      component: (
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Welcome to Kasa!</h3>
          <p className="text-gray-600">
            You're ready to start managing your business. Explore the dashboard to get started.
          </p>
        </div>
      ),
    },
  ]

  const handleNext = async () => {
    const current = steps[currentStep]
    
    // Mark step as completed
    setCompletedSteps(new Set([...completedSteps, current.id]))
    
    // Save user data if it's the profile step
    if (current.id === 'profile' && userData.firstName && userData.lastName) {
      try {
        const token = localStorage.getItem('token')
        await fetch('/api/kasa/onboarding/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(userData),
        })
      } catch (error) {
        console.error('Error saving onboarding data:', error)
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/kasa/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      
      // Store in localStorage
      localStorage.setItem('onboarding_completed', 'true')
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      onComplete()
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={() => {}} disableBackdropClick disableEscapeKey>
      <div className="p-6 max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 flex items-center ${
                index < steps.length - 1 ? 'mr-2' : ''
              }`}
            >
              <div
                className={`flex-1 h-1 rounded ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
              <div
                className={`ml-2 h-6 w-6 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-blue-600 text-white'
                    : index === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-600 mb-6">{steps[currentStep].description}</p>
          <div>{steps[currentStep].component}</div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {steps[currentStep].optional && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
