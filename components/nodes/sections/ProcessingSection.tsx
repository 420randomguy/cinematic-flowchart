"use client"

import { memo, type ReactNode } from "react"
import { SubmitButton } from "@/components/ui/submit-button"

interface ProcessingSectionProps {
  children: ReactNode
  className?: string
  title?: string
  isSubmitting?: boolean
  isGenerated?: boolean
  timeRemaining?: number
  onSubmit?: () => void
  showSubmitButton?: boolean
}

function ProcessingSectionComponent({
  children,
  className = "",
  title,
  isSubmitting = false,
  isGenerated = false,
  timeRemaining,
  onSubmit,
  showSubmitButton = false,
}: ProcessingSectionProps) {
  return (
    <div className={`border-t border-gray-800/50 pt-2 pb-1 ${className}`}>
      {title && <div className="text-[9px] uppercase text-gray-500 tracking-wide mb-1.5">{title}</div>}

      {showSubmitButton && onSubmit && (
        <SubmitButton
          isSubmitting={isSubmitting}
          isGenerated={isGenerated}
          onClick={onSubmit}
          timeRemaining={timeRemaining}
        />
      )}

      {children}
    </div>
  )
}

export const ProcessingSection = memo(ProcessingSectionComponent)

