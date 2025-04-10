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
  nodeId?: string
}

function ProcessingSectionComponent({
  children,
  className = "",
  title,
  showSubmitButton = false,
  nodeId,
}: ProcessingSectionProps) {
  return (
    <div className={`border-t border-gray-800/50 pt-2 pb-1 ${className}`}>
      {title && <div className="text-[9px] uppercase text-gray-500 tracking-wide mb-1.5">{title}</div>}

      {showSubmitButton && nodeId && (
        <SubmitButton nodeId={nodeId} />
      )}

      {children}
    </div>
  )
}

export const ProcessingSection = memo(ProcessingSectionComponent)
ProcessingSection.displayName = "ProcessingSection"

