'use client'

import { CheckIcon } from '@heroicons/react/24/solid'

interface Step {
  id: string
  label: string
  description?: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export default function ProgressIndicator({
  steps,
  currentStep,
  className = '',
}: ProgressIndicatorProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isPending = index > currentStep

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${
                      isCompleted
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all ${
                    isCompleted
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

