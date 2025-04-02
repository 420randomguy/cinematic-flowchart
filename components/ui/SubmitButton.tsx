"use client"

import type { SubmitButtonProps } from "@/types"

export function SubmitButton({ isSubmitting, isGenerated, onClick, timeRemaining }: SubmitButtonProps) {
  return (
    <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
      <button
        onClick={onClick}
        className={`px-2 py-0.5 rounded-sm text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
          isSubmitting
            ? "bg-gray-700/90 border border-gray-600 text-gray-300" // In progress state
            : isGenerated
              ? "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Completed state with yellow accent for regenerate
              : "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Default state with yellow accent
        }`}
      >
        {isSubmitting ? "Cancel" : isGenerated ? "Regenerate" : "Submit"}
      </button>

      {isSubmitting && timeRemaining !== undefined && (
        <div className="text-[9px] text-gray-500 tracking-wide">
          Est. time: {Math.floor(timeRemaining / 60)}:{timeRemaining % 60 < 10 ? "0" : ""}
          {timeRemaining % 60}
        </div>
      )}
    </div>
  )
}

