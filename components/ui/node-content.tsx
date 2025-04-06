"use client"

import type React from "react"
import Image from "next/image"
import { Upload, ImageOff } from "lucide-react"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { memo, useMemo, useRef } from "react"
import { useMemoization } from "@/hooks/useMemoization"

interface NodeContentProps {
  data: any
  isSubmitting: boolean
  isGenerated: boolean
  showVideo?: boolean
  imageUrl?: string | null
  textContent?: string
  isDragging?: boolean
  dropRef?: React.RefObject<HTMLDivElement>
  handleDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  handleClick?: () => void
  children?: React.ReactNode
}

/**
 * Reusable node content component for displaying images, videos, and text
 */
function NodeContentComponent({
  data,
  isSubmitting,
  isGenerated,
  showVideo = false,
  imageUrl,
  textContent,
  isDragging = false,
  dropRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleClick,
  children,
}: NodeContentProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  // Cache previous content to avoid unnecessary re-renders
  const contentRef = useRef<string>("")

  // Get content to display - prioritize sourceNodeContent if available
  // Determine if this is an image-based node

  // Determine if this node requires an image input

  // Determine if this is a video-based node
  const isVideoNode = useMemo(
    () => data.category === "image-to-video" || data.category === "text-to-video",
    [data.category],
  )

  // Determine if this is a text-to-image node

  // Add useCallback for event handlers

  // Use useMemo for derived values
  const nodeCategory = useMemo(() => {
    return data.category || "unknown"
  }, [data.category])

  const isImageNode = useMemo(
    () => nodeCategory === "image" || nodeCategory === "image-to-image" || nodeCategory === "image-to-video",
    [nodeCategory],
  )

  const requiresImageInput = useMemo(
    () => data.category === "image-to-image" || data.category === "image-to-video",
    [data.category],
  )

  return (
    <div className="space-y-1.5 node-content-container">
      <div
        className="relative bg-black rounded-sm overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          aspectRatio: "16/9",
          maxHeight: isGenerated || isSubmitting ? "150px" : "auto",
        }}
      >
        {isSubmitting ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[9px] text-gray-400 p-2 text-center">Generating {data?.category || "content"}...</div>
          </div>
        ) : isGenerated ? (
          // Show generated content based on node type
          <>
            {showVideo && isVideoNode ? (
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src="/akira-animation.gif"
                  alt="Generated video"
                  width={260}
                  height={150}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <img
                src={imageUrl || data?.imageUrl || "/sample-image.png"}
                alt="Generated content"
                className="object-cover w-full h-full"
              />
            )}
          </>
        ) : (
          // Show placeholder or upload area based on node type
          <>
            {imageUrl || data?.imageUrl ? (
              // If we have an image URL, display it
              <img
                src={imageUrl || data?.imageUrl || "/placeholder.svg"}
                alt="Source image"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                {requiresImageInput ? (
                  // Show "Connect image node" message when requiresImageInput is true
                  <>
                    <ImageOff className="h-4 w-4 text-gray-500" />
                    <div className="text-[9px] text-gray-400 text-center">Connect image node</div>
                  </>
                ) : handleClick ? (
                  // Show upload UI when handleClick is provided
                  <>
                    <Upload className="h-4 w-4 text-gray-500" />
                    <div className="text-[9px] text-gray-400 text-center">
                      Click to select from library or drag and drop
                    </div>
                  </>
                ) : (
                  // Default message
                  <div className="text-[9px] text-gray-400 text-center">
                    {isVideoNode ? "Video will appear here" : "Image will appear here"}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Caption display at the bottom */}
        {data.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
            {data.caption}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}

// Use our optimized memoization system
export const NodeContent = memo(NodeContentComponent, (prevProps, nextProps) => {
  // Use the memoization hook to get the comparison function
  const { nodeContentComparison } = useMemoization()
  return nodeContentComparison(prevProps, nextProps)
})

