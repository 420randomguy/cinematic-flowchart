"use client"

import { memo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"

interface NodeHeaderSectionProps {
  title: string
  type: string
  modelId?: string
  onModelChange?: (modelId: string) => void
  className?: string
}

function NodeHeaderSectionComponent({ title, type, modelId, onModelChange, className = "" }: NodeHeaderSectionProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  return (
    <div className={`relative mb-2 ${className}`}>
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        {type.toUpperCase()}
      </div>

      {modelId && onModelChange && (
        <div className="absolute -top-2 right-2 z-20">
          <Select value={modelId} onValueChange={onModelChange}>
            <SelectTrigger
              className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0"
              {...interactiveProps}
            >
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-[9px] p-0 rounded-sm">
              <SelectItem
                value="flux-dev"
                className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                {...interactiveProps}
              >
                Flux Dev
              </SelectItem>
              <SelectItem
                value="wan-pro"
                className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                {...interactiveProps}
              >
                WAN Pro
              </SelectItem>
              <SelectItem
                value="kling-1.6"
                className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                {...interactiveProps}
              >
                Kling 1.6
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conditionally render the title only if it differs from the type */}
      {title.toUpperCase() !== type.toUpperCase() && (
        <div className="font-bold text-[10px] text-gray-400 tracking-wide uppercase mt-1.5">{title}</div>
      )}
    </div>
  )
}

export const NodeHeaderSection = memo(NodeHeaderSectionComponent)

