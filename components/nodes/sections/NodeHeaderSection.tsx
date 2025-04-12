"use client"

import { memo, useCallback, useEffect, useState } from "react"
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
  
  // Track the current model ID locally to ensure UI updates
  const [currentModelId, setCurrentModelId] = useState(modelId)
  
  // Update local state when prop changes
  useEffect(() => {
    setCurrentModelId(modelId)
  }, [modelId])

  // Enhanced model change handler
  const handleModelChange = useCallback((value: string) => {
    // Update local state
    setCurrentModelId(value)
    
    // Call the parent component handler
    if (onModelChange) {
      onModelChange(value)
      
      // Debug log to verify the change
      console.log(`[NodeHeaderSection] Model changed to: ${value}`)
    }
  }, [onModelChange])

  // Check if this is a video-related node
  const isVideoNode = type.includes("video")
  // Check if this is an image-related node
  const isImageNode = type.includes("image") && !isVideoNode

  return (
    <div className={`relative mb-2 ${className}`}>
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        {type.toUpperCase()}
      </div>

      {currentModelId && onModelChange && (
        <div className="absolute -top-2 right-2 z-20">
          <Select value={currentModelId} onValueChange={handleModelChange}>
            <SelectTrigger
              className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0"
              {...interactiveProps}
            >
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-[9px] p-0 rounded-sm">
              {/* Show only Flux Dev for image nodes */}
              {isImageNode && (
                <SelectItem
                  value="flux-dev"
                  className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                  {...interactiveProps}
                >
                  Flux Dev
                </SelectItem>
              )}
              
              {/* Show video models for video nodes */}
              {isVideoNode && (
                <>
                  <SelectItem
                    value="wan-2.1"
                    className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                    {...interactiveProps}
                  >
                    Wan 2.1
                  </SelectItem>
                  <SelectItem
                    value="wan-2.1-lora"
                    className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                    {...interactiveProps}
                  >
                    Wan 2.1 Lora
                  </SelectItem>
                  <SelectItem
                    value="wan-pro"
                    className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                    {...interactiveProps}
                  >
                    Wan Pro
                  </SelectItem>
                  <SelectItem
                    value="veo2"
                    className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                    {...interactiveProps}
                  >
                    Veo2
                  </SelectItem>
                  <SelectItem
                    value="kling-1.6"
                    className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                    {...interactiveProps}
                  >
                    Klingai
                  </SelectItem>
                </>
              )}
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

