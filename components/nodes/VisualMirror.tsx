"use client"

import { memo } from "react"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { Upload } from "lucide-react"

interface VisualMirrorProps {
  nodeId: string
  type?: "image" | "text" | "both" // Type prop to control what content to show
}

// Core VisualMirror component for different content types
function VisualMirrorComponent({ nodeId, type = "both" }: VisualMirrorProps) {
  // Get content from the visual mirror store
  const { visibleContent } = useVisualMirrorStore()
  const visualData = visibleContent[nodeId]

  // Determine what to show
  const showImage = type === "both" || type === "image"
  const showText = type === "both" || type === "text"
  
  // Return appropriate content based on type, even if both are missing
  if (type === "image") {
    // Image-only rendering
    if (!visualData || !visualData.imageUrl) {
      return (
        <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center">
          <Upload className="h-5 w-5 mb-2 text-gray-500" />
          <div className="text-[9px] text-gray-500 text-center">Connect image node</div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-full overflow-hidden">
        <img 
          src={visualData.imageUrl} 
          alt="Preview" 
          className="object-cover w-full h-full" 
        />
      </div>
    );
  }
  
  if (type === "text") {
    // Text-only rendering - only render if text exists
    if (!visualData || !visualData.text) {
      return null;
    }
    
    return (
      <div className="block w-full p-2 text-yellow-300 text-[9px] font-mono break-words text-left bg-black/30 border border-yellow-900/30">
        {visualData.text}
      </div>
    );
  }
  
  // Combined rendering for "both" type
  return (
    <div className="visual-mirror pointer-events-none w-full h-full">
      {visualData && visualData.text && (
        <div className="block w-full p-2 text-yellow-300 text-[9px] font-mono break-words text-left bg-black/30 border border-yellow-900/30">
          {visualData.text}
        </div>
      )}
      
      {visualData && visualData.imageUrl ? (
        <div className="w-full h-full overflow-hidden">
          <img 
            src={visualData.imageUrl} 
            alt="Preview" 
            className="object-cover w-full h-full" 
          />
        </div>
      ) : (
        <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center">
          <Upload className="h-5 w-5 mb-2 text-gray-500" />
          <div className="text-[9px] text-gray-500 text-center">Connect image node</div>
        </div>
      )}
    </div>
  );
}

// Image-only variant - positioned to replace NodeContent
export const VisualMirrorImage = memo(({ nodeId }: { nodeId: string }) => (
  <div className="w-full h-full">
    <VisualMirrorComponent nodeId={nodeId} type="image" />
  </div>
))
VisualMirrorImage.displayName = "VisualMirrorImage"

// Text-only variant - for displaying the 25 char preview
export const VisualMirrorText = memo(({ nodeId }: { nodeId: string }) => (
  <div className="px-2 pb-2 node-text-preview">
    <VisualMirrorComponent nodeId={nodeId} type="text" />
  </div>
))
VisualMirrorText.displayName = "VisualMirrorText"

// Original full version - absolute positioned (retained for backward compatibility)
export const VisualMirror = memo((props: VisualMirrorProps) => (
  <div className="absolute inset-0 z-10">
    <VisualMirrorComponent {...props} />
  </div>
))
VisualMirror.displayName = "VisualMirror" 