'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import ProgressIndicator from './ProgressIndicator'
import Modal from './Modal'

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  skipable?: boolean
}

interface OnboardingWizardProps {
  steps: OnboardingStep[]
  onComplete: () => void
  onSkip?: () => void
  storageKey?: string
}

export default function OnboardingWizard({
  steps,
  onComplete,
  onSkip,
  storageKey = 'onboarding-completed',
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(storageKey)
    if (completed === 'true') {
      return
    }

    // Show onboarding after a short delay
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [storageKey])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setCompletedSteps(new Set([...completedSteps, steps[currentStep].id]))
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    setIsOpen(false)
    setCompletedSteps(new Set(steps.map((s) => s.id)))
    onComplete()
  }

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleComplete}
      size="lg"
      showCloseButton={false}
      className="onboarding-modal"
    >
      <div className="p-6">
        {/* Progress Indicator */}
        <div className="mb-6">
          <ProgressIndicator
            steps={steps.map((s) => ({ id: s.id, label: s.title }))}
            currentStep={currentStep}
          />
        </div>

        {/* Step Content */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {currentStepData.description}
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            {currentStepData.content}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {currentStepData.skipable && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Skip tutorial
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Get Started
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

