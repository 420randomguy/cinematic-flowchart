"use client"

import type React from "react"
import Image from "next/image"
import { Upload } from "lucide-react"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { memo, useMemo } from "react"
import { TextInput } from "@/components/ui/text-input"

interface NodeContentProps {
  data: any
  isSubmitting?: boolean
  isGenerated?: boolean
  showVideo?: boolean
  sourceImageUrl?: string | null
  outputImageUrl?: string | null
  sourceNodeContent?: string | null
  isDragging?: boolean
  isOutputNode?: boolean
  dropRef?: React.RefObject<HTMLDivElement>
  handleDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  handleClick?: () => void
  children?: React.ReactNode
}

/**
 * Simplified node content component focused only on image upload/display
 * Text and source preview handling is managed by the VisualMirror component
 */
function NodeContentComponent({
  data,
  isSubmitting = false,
  isGenerated = false,
  showVideo = false,
  sourceImageUrl,
  outputImageUrl,
  sourceNodeContent,
  isDragging = false,
  isOutputNode,
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

  // Determine node types for conditional rendering
  const isImageUploadNode = useMemo(
    // Only the input "image" node should show the upload UI, not any output nodes
    () => data?.category === "image" && !data?.category?.includes("-to-"),
    [data?.category],
  );
  const isVideoOutputNode = useMemo(
    () => data?.category === "image-to-video" || data?.category === "text-to-video",
    [data?.category],
  );
  
  // Use the isOutputNode prop if provided, otherwise compute it
  const isOutputNodeType = isOutputNode !== undefined ? isOutputNode : useMemo(
    () => data?.category?.includes("-to-"),
    [data?.category],
  );

  // *** Centralized Display Logic v2 (without sourceImageUrl) ***
  const renderContent = () => {
    if (isSubmitting) {
      return <div className="text-[9px] text-gray-400 p-2 text-center">Generating...</div>;
    }
    if (isGenerated) {
      if (isVideoOutputNode) {
        return <Image src={outputImageUrl || "/akira-animation.gif"} alt="Generated video" layout="fill" objectFit="cover" />;
      } else {
        return <img src={outputImageUrl || "/sample-image.png"} alt="Generated content" className="object-cover w-full h-full" />;
      }
    }
    if (isImageUploadNode) {
      if (outputImageUrl || data?.imageUrl) {
         // Use outputImageUrl or data.imageUrl, preferring outputImageUrl if both exist
         const displayImageUrl = outputImageUrl || data?.imageUrl;
         return (
           <div className="relative w-full h-full min-h-[80px] flex items-center justify-center">
             <img 
               src={displayImageUrl} 
               alt="Uploaded content"
               className="object-cover max-w-full max-h-full" 
             />
           </div>
         );
      } else {
         // No image, show upload prompt
         return (
           <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center p-6">
             <Upload className="h-5 w-5 mb-2 text-gray-500" />
             <div className="text-[9px] text-gray-500 text-center">Click to select or drag image</div>
           </div>
         );
      }
    }
    // For text nodes, we don't render anything here - TextNode component will handle it
    if (data?.category === "text") {
      return null;
    }
    
    // For nodes that should show previews of inputs
    if (isOutputNode) {
      const hasImageUrl = !!sourceImageUrl;
      
      return (
        <div className="w-full flex flex-col gap-2">
          {/* Image input preview - only show actual image, placeholder now in VisualMirror */}
          {hasImageUrl && (
            <div className="w-full min-h-[80px] flex flex-col items-center justify-center">
              <img 
                src={sourceImageUrl} 
                alt="Source content" 
                className="object-cover max-w-full max-h-full" 
              />
            </div>
          )}
          
          {/* Text input preview - truncated to 25 chars */}
          {sourceNodeContent && (
            <div className="px-6 pb-2 node-text-preview">
              {sourceNodeContent.length > 25 
                ? sourceNodeContent.substring(0, 25) + "..." 
                : sourceNodeContent}
            </div>
          )}
        </div>
      );
    }
    
    // Default empty state for any other node types
    return (
      <div className="min-h-[80px]"></div>
    );
  };

  return (
    <div className="node-content-container">
      <div
        className={`relative bg-black/30 overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center ${data?.category === "text" ? "node-content-text" : ""}`}
      >
        {renderContent()} {/* Render the determined content */}

        {/* Caption (Rendered regardless of state) */} 
        {data?.caption && (
           <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
             {data.caption}
           </div>
         )}
      </div>

      {/* Children are rendered outside the main content area */} 
      {children}
    </div>
  )
}

// Simple memoization to prevent unnecessary re-renders
export const NodeContent = memo(NodeContentComponent, (prevProps, nextProps) => {
  return (
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.isGenerated === nextProps.isGenerated &&
    prevProps.showVideo === nextProps.showVideo &&
    prevProps.outputImageUrl === nextProps.outputImageUrl &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isOutputNode === nextProps.isOutputNode &&
    prevProps.data?.category === nextProps.data?.category &&
    prevProps.data?.caption === nextProps.data?.caption
  )
})

