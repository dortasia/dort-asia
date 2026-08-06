import React from 'react'

interface PageContainerProps {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageContainer({
  title,
  description,
  action,
  children,
  className = '',
}: PageContainerProps) {
  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
