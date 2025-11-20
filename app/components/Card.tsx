'use client'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  headerActions?: React.ReactNode
  footer?: React.ReactNode
  hover?: boolean
  className?: string
  onClick?: () => void
}

export default function Card({
  children,
  title,
  subtitle,
  headerActions,
  footer,
  hover = false,
  className = '',
  onClick,
}: CardProps) {
  const baseClasses = `
    bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
    ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `

  return (
    <div className={baseClasses} onClick={onClick}>
      {(title || subtitle || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {headerActions && <div className="ml-4">{headerActions}</div>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {footer}
        </div>
      )}
    </div>
  )
}

