"use client"

import type React from "react"

import { memo, type ReactNode } from "react"
import Image from "next/image"
import { Upload, ImageOff } from "lucide-react"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"

interface OutputSectionProps {
  children?: ReactNode
  className?: string
  title?: string
  isSubmitting?: boolean
  isGenerated?: boolean
  showVideo?: boolean
  imageUrl?: string | null
  category?: string
  isDragging?: boolean
  handleClick?: () => void
  handleDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  requiresImageInput?: boolean
  data?: { caption?: string } // Added data prop
}

function OutputSectionComponent({
  children,
  className = "",
  title,
  isSubmitting = false,
  isGenerated = false,
  showVideo = false,
  imageUrl,
  category = "content",
  isDragging = false,
  handleClick,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  requiresImageInput = false,
  data, // Destructure data prop
}: OutputSectionProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  return (
    <div className={`pt-2 pb-1 ${className}`}>
      {title && <div className="text-[9px] uppercase text-gray-500 tracking-wide mb-1.5">{title}</div>}

      <div
        className={`relative bg-black rounded-sm overflow-hidden transition-all duration-300 ease-in-out ${
          isDragging ? "bg-gray-800/50 border-2 border-dashed border-yellow-300/50" : ""
        } ${handleClick && !requiresImageInput ? "cursor-pointer" : ""}`}
        style={{
          aspectRatio: "16/9",
          maxHeight: isGenerated || isSubmitting ? "150px" : "auto",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={requiresImageInput ? undefined : handleClick}
        {...(handleClick && !requiresImageInput ? interactiveProps : {})}
      >
        {isSubmitting ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[9px] text-gray-400 p-2 text-center">Generating {category}...</div>
          </div>
        ) : isGenerated ? (
          <>
            {showVideo ? (
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
                src={imageUrl || "/sample-image.png"}
                alt="Generated content"
                className="object-cover w-full h-full"
              />
            )}
          </>
        ) : (
          <>
            {imageUrl ? (
              <img src={imageUrl || "/placeholder.svg"} alt="Source image" className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                {requiresImageInput ? (
                  <>
                    <ImageOff className="h-4 w-4 text-gray-500" />
                    <div className="text-[9px] text-gray-400 text-center">Connect image node</div>
                  </>
                ) : handleClick ? (
                  <>
                    <Upload className="h-4 w-4 text-gray-500" />
                    <div className="text-[9px] text-gray-400 text-center">
                      Click to select from library or drag and drop
                    </div>
                  </>
                ) : (
                  <div className="text-[9px] text-gray-400 text-center">
                    {category === "video" ? "Video will appear here" : "Image will appear here"}
                  </div>
                )}
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

export const OutputSection = memo(OutputSectionComponent)

