"use client"

import type React from "react"

import type { SubmitButtonProps } from "@/types"
import { Button } from "@/components/ui/button"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"

export function SubmitButton({
  disabled = false,
  handleInputInteraction,
  nodeId,
}: Omit<SubmitButtonProps, 'isSubmitting' | 'isGenerated' | 'onClick' | 'timeRemaining'>) {
  // Get the store function if handleInputInteraction isn't provided
  const storeHandleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const createRenderNode = useFlowchartStore((state) => state.createRenderNode)
  const inputHandler = handleInputInteraction || storeHandleInputInteraction
  
  // Create interactive props but remove onClick to avoid collision
  const { onClick: _ignoredOnClick, ...safeInteractiveProps } = createInteractiveProps(inputHandler)

  // Handle button click with proper event propagation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Create a render node if this is an output node with a nodeId
    if (nodeId) {
      createRenderNode(nodeId)
    }
  }

  return (
    <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant="outline"
        size="sm"
        className={`px-2 py-0.5 h-auto text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
          disabled
            ? "bg-gray-800/30 border-gray-700/50 text-gray-500"
            : "bg-gray-800/80 border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70"
        }`}
        {...safeInteractiveProps}
      >
        Submit
      </Button>
    </div>
  )
}

