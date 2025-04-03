"use client"

import type { SubmitButtonProps } from "@/types"
import { Button } from "@/components/ui/button"
import { createInteractiveProps } from "@/lib/utils/node-interaction"

export function SubmitButton({
  isSubmitting,
  isGenerated,
  onClick,
  timeRemaining,
  disabled = false,
  handleInputInteraction,
}: SubmitButtonProps & { handleInputInteraction?: (isInteracting?: boolean) => void }) {
  const interactiveProps = handleInputInteraction ? createInteractiveProps(handleInputInteraction) : {}

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  return (
    <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="outline"
        size="sm"
        className={`px-2 py-0.5 h-auto text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
          disabled
            ? "bg-gray-800/30 border-gray-700/50 text-gray-500"
            : isSubmitting
              ? "bg-gray-700/90 border-gray-600 text-gray-300"
              : isGenerated
                ? "bg-gray-800/80 border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70"
                : "bg-gray-800/80 border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70"
        }`}
        {...interactiveProps}
      >
        {isSubmitting ? "Cancel" : isGenerated ? "Regenerate" : "Submit"}
      </Button>

      {isSubmitting && timeRemaining !== undefined && (
        <div className="text-[9px] text-gray-500 tracking-wide">Est. time: {formatTimeRemaining(timeRemaining)}</div>
      )}
    </div>
  )
}

