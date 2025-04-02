"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useFlowchart } from "@/contexts/FlowchartContext"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  // Get the handleInputInteraction function from context
  const { handleInputInteraction } = useFlowchart()

  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prevent-node-drag",
        className,
      )}
      ref={ref}
      // Add event handlers to prevent node dragging and enable copy/paste
      onMouseEnter={() => handleInputInteraction(true)}
      onMouseLeave={() => handleInputInteraction(false)}
      onFocus={() => handleInputInteraction(true)}
      onBlur={() => handleInputInteraction(false)}
      onMouseDown={(e) => {
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onCopy={(e) => e.stopPropagation()}
      onCut={(e) => e.stopPropagation()}
      onPaste={(e) => e.stopPropagation()}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }

