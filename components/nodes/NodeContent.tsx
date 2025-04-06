"use client"

import type React from "react"
import Image from "next/image"
import { Upload, ImageOff } from "lucide-react"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { memo, useMemo, useRef } from "react"

interface NodeContentProps {
  data: any
  isSubmitting?: boolean
  isGenerated?: boolean
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
  isSubmitting = false,
  isGenerated = false,
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
  const displayContent = useMemo(() => {
    const content = textContent || data?.sourceNodeContent || (typeof data?.content === "string" ? data.content : "")
    if (content !== contentRef.current) {
      contentRef.current = content
    }
    return contentRef.current
  }, [textContent, data?.sourceNodeContent, data?.content])

  // Determine if this is an image-based node
  const isImageNode = useMemo(
    () => data?.category === "image" || data?.category === "image-to-image" || data?.category === "image-to-video",
    [data?.category],
  )

  // Determine if this node requires an image input
  const requiresImageInput = useMemo(
    () => data?.category === "image-to-image" || data?.category === "image-to-video",
    [data?.category],
  )

  // Determine if this is a video-based node
  const isVideoNode = useMemo(
    () => data?.category === "image-to-video" || data?.category === "text-to-video",
    [data?.category],
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
            {isImageNode ? (
              // For image-based nodes, show image upload area or connected image
              <div
                ref={dropRef}
                className={`w-full h-full flex items-center justify-center ${
                  isDragging ? "bg-gray-800/50 border-2 border-dashed border-yellow-300/50" : ""
                } ${handleClick ? "cursor-pointer" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                {...(handleClick ? interactiveProps : {})}
              >
                {imageUrl || data?.imageUrl ? (
                  <img
                    src={imageUrl || data?.imageUrl || "/placeholder.svg"}
                    alt="Source image"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                    {handleClick ? (
                      <>
                        <Upload className="h-4 w-4 text-gray-500" />
                        <div className="text-[9px] text-gray-400 text-center">
                          Click to select from library or drag and drop
                        </div>
                      </>
                    ) : requiresImageInput ? (
                      <>
                        <ImageOff className="h-4 w-4 text-gray-500" />
                        <div className="text-[9px] text-gray-400 text-center">Connect image node</div>
                      </>
                    ) : (
                      <div className="text-[9px] text-gray-400 text-center">Image will appear here</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // For text-based nodes, show empty area or text preview
              <div className="w-full h-full flex items-center justify-center bg-black/30 p-2">
                <div className="text-[9px] text-gray-400 text-center">
                  {isVideoNode ? "Video will appear here" : "Image will appear here"}
                </div>
              </div>
            )}
          </>
        )}

        {/* Caption display at the bottom */}
        {data?.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
            {data.caption}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}

// Simple memoization to prevent unnecessary re-renders
export const NodeContent = memo(NodeContentComponent, (prevProps, nextProps) => {
  // Compare only the props that affect rendering
  return (
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.isGenerated === nextProps.isGenerated &&
    prevProps.showVideo === nextProps.showVideo &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.data?.category === nextProps.data?.category &&
    prevProps.data?.caption === nextProps.data?.caption
  )
})

