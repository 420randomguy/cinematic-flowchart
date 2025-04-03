"use client"

import type React from "react"
import Image from "next/image"
import { Upload } from "lucide-react"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchart } from "@/contexts/FlowchartContext"

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
export function NodeContent({
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
  const { handleInputInteraction } = useFlowchart()
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  // Get content to display - prioritize sourceNodeContent if available
  const displayContent = textContent || data.sourceNodeContent || (typeof data.content === "string" ? data.content : "")

  return (
    <div className="space-y-1.5">
      <div
        className="relative bg-black rounded-sm overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          aspectRatio: "16/9",
          maxHeight: isGenerated || isSubmitting ? "150px" : "auto",
        }}
      >
        {isSubmitting ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[9px] text-gray-400 p-2 text-center">Generating {data.category}...</div>
          </div>
        ) : data.category === "image" || data.category.includes("image") ? (
          isGenerated ? (
            <img
              src={imageUrl || data.imageUrl || "/sample-image.png"}
              alt="Generated content"
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-black/30 p-2 overflow-auto"
              {...interactiveProps}
            >
              <div className="text-[9px] text-yellow-300/90 font-mono tracking-wide text-center" {...interactiveProps}>
                {displayContent
                  ? displayContent.substring(0, 50) + (displayContent.length > 50 ? "..." : "")
                  : "Connect prompt node"}
              </div>
            </div>
          )
        ) : data.category === "video" ? (
          showVideo ? (
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
            <div className="w-full h-full flex items-center justify-center">
              {imageUrl || data.imageUrl ? (
                <img
                  src={imageUrl || data.imageUrl || "/placeholder.svg"}
                  alt="Source image"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-[9px] text-gray-400 p-2 overflow-hidden max-h-[150px] transition-all duration-300 ease-in-out flex flex-col items-center gap-2">
                  <span>Connect image node</span>
                </div>
              )}
            </div>
          )
        ) : (
          <div
            ref={dropRef}
            className={`w-full h-full flex items-center justify-center cursor-pointer ${
              isDragging ? "bg-gray-800/50 border-2 border-dashed border-yellow-300/50" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            {...interactiveProps}
          >
            {imageUrl || data.imageUrl ? (
              <img
                src={imageUrl || data.imageUrl || "/placeholder.svg"}
                alt="Source image"
                className="object-cover w-full h-full"
              />
            ) : (
              handleClick && (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-2 p-2"
                  onClick={handleClick}
                  {...interactiveProps}
                >
                  <Upload className="h-4 w-4 text-gray-500" />
                  <div className="text-[9px] text-gray-400 text-center">
                    Click to select from library or drag and drop
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {data.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
            {data.caption}
          </div>
        )}

        {data.category === "video" && textContent && (
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
            {textContent.substring(0, 50) + (textContent.length > 50 ? "..." : "")}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}

