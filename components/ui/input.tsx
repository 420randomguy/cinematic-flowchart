"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
// Update import to use Zustand store
import { useFlowchartStore } from "@/store/useFlowchartStore"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  // Get the setIsInteractingWithInput function from Zustand store
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)

  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-800 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      ref={ref}
      // Add event handlers to prevent node dragging and enable copy/paste
      onMouseEnter={() => setIsInteractingWithInput(true)}
      onMouseLeave={() => setIsInteractingWithInput(false)}
      onFocus={() => setIsInteractingWithInput(true)}
      onBlur={() => setIsInteractingWithInput(false)}
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

