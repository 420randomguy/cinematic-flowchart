"use client"

import type React from "react"
import Image from "next/image"
import { Upload, ImageOff } from "lucide-react"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { memo, useMemo } from "react"

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
 * No text handling - that's done directly in BaseNode now
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
    () => data?.category === "image" || data?.category === "image-to-image" || data?.category === "image-to-video",
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

  // Determine if we have source preview data
  const hasSourcePreviewData = !!sourceNodeContent || !!sourceImageUrl;

  // *** Centralized Display Logic v2 ***
  const renderContent = () => {
    // Debug log for image rendering
    console.log(`[NodeContent] Rendering node with:`, {
      isImageUploadNode,
      outputImageUrl,
      dataImageUrl: data?.imageUrl,
      sourceImageUrl,
      category: data?.category
    });
    
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
    if (sourceImageUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 relative">
          <img src={sourceImageUrl} alt="Source Preview" className="object-contain max-w-full max-h-[120px]" />
          {/* Add clickable area if handleClick is provided */}
          {handleClick && (
            <div 
              className="absolute top-1/4 left-1/4 w-1/2 h-1/2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event from bubbling to node drag
                handleClick();
              }}
            />
          )}
        </div>
      );
    }
    if (isImageUploadNode) {
      if (outputImageUrl || data?.imageUrl) {
         // Use outputImageUrl or data.imageUrl, preferring outputImageUrl if both exist
         const displayImageUrl = outputImageUrl || data?.imageUrl;
         return (
           <div className="relative w-full h-full">
             <img src={displayImageUrl} alt="Node Image" className="object-cover w-full h-full" />
             {/* Add an overlay div that creates a 50% central clickable area */}
             {handleClick && (
               <div 
                 className="absolute top-1/4 left-1/4 w-1/2 h-1/2 cursor-pointer"
                 onClick={(e) => {
                   e.stopPropagation(); // Prevent event from bubbling to node drag
                   handleClick();
                 }}
               />
             )}
           </div>
         );
      } else {
         return (
           <div 
             ref={dropRef} 
             onDragOver={handleDragOver} 
             onDragLeave={handleDragLeave} 
             onDrop={handleDrop} 
             onClick={handleClick} 
             className={`w-full h-full flex flex-col items-center justify-center gap-1 p-2 ${isDragging ? "bg-gray-800/50 border-2 border-dashed border-yellow-300/50" : ""} ${handleClick ? "cursor-pointer" : ""}`}
            >
             <Upload className="h-4 w-4 text-gray-500" />
             <div className="text-[9px] text-gray-400 text-center">
               {handleClick ? "Click to select or drag image" : "Connect image node"} 
             </div>
           </div>
         );
      }
    } else {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
           <div className="text-[9px] text-gray-400 text-center">
             {isVideoOutputNode ? "Video input needed" : "Image input needed"}
           </div>
        </div>
      );
    }
  };

  // Render Text section (for any node with sourceNodeContent)
  const renderTextSection = () => {
    if (sourceNodeContent) {
      return (
        <div className="mt-1 w-full">
          <div className="w-full flex flex-col items-center justify-center gap-1 p-2 bg-black/30 rounded-sm">
            <div className="text-[9px] text-gray-400 text-center">
              {isOutputNodeType ? "Connected Text" : "Text Preview"}
            </div>
            <div className="text-[10px] text-green-400 font-mono w-full tracking-tight leading-tight max-h-12 overflow-y-auto text-center break-words">
              {sourceNodeContent}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-1.5 node-content-container">
      <div
        className="relative bg-black/30 rounded-sm overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center"
        style={{
          aspectRatio: "16/9",
          minHeight: "80px", // Ensure minimum height
        }}
      >
        {renderContent()} {/* Render the determined content */} 

        {/* Caption (Rendered regardless of state) */} 
        {data?.caption && (
           <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
             {data.caption}
           </div>
         )}
      </div>

      {/* Text Section (for any node with sourceNodeContent) */}
      {renderTextSection()}

      {/* Children are rendered outside the main content area */} 
      {children}
    </div>
  )
}

// Simple memoization to prevent unnecessary re-renders
export const NodeContent = memo(NodeContentComponent, (prevProps, nextProps) => {
  // Added debugging logs to trace the memoization
  if (prevProps.sourceNodeContent !== nextProps.sourceNodeContent) {
    console.log(`[NodeContent Memo] Re-rendering due to sourceNodeContent change: 
      prev: "${prevProps.sourceNodeContent?.substring(0, 20)}", 
      next: "${nextProps.sourceNodeContent?.substring(0, 20)}"`);
    return false; // Different, should re-render
  }
  
  // Also check for image URL changes
  if (prevProps.data?.imageUrl !== nextProps.data?.imageUrl) {
    console.log(`[NodeContent Memo] Re-rendering due to imageUrl change:
      prev: "${prevProps.data?.imageUrl}", 
      next: "${nextProps.data?.imageUrl}"`);
    return false; // Different, should re-render
  }

  return (
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.isGenerated === nextProps.isGenerated &&
    prevProps.showVideo === nextProps.showVideo &&
    prevProps.outputImageUrl === nextProps.outputImageUrl &&
    prevProps.sourceImageUrl === nextProps.sourceImageUrl &&
    prevProps.sourceNodeContent === nextProps.sourceNodeContent &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isOutputNode === nextProps.isOutputNode &&
    prevProps.data?.category === nextProps.data?.category &&
    prevProps.data?.caption === nextProps.data?.caption
  )
})

