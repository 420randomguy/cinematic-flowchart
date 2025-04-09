"use client"

import { memo } from "react"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

interface VisualMirrorProps {
  nodeId: string
}

// Simple component that just displays mirrored content from the store
function VisualMirrorComponent({ nodeId }: VisualMirrorProps) {
  // Get content from the visual mirror store
  const { visibleContent } = useVisualMirrorStore()
  const visualData = visibleContent[nodeId]

  // If no content is available for this node, show nothing
  if (!visualData) return null

  return (
    <div className="visual-mirror absolute inset-0 z-10 pointer-events-none">
      {visualData.text && (
        <div className="block w-full p-2 text-green-500 text-xs font-mono break-words text-center bg-black/30 border border-green-900/30">
          {visualData.text}
        </div>
      )}
      {visualData.imageUrl && (
        <div className="relative bg-black/30 rounded-sm overflow-hidden aspect-video flex items-center justify-center">
          <img 
            src={visualData.imageUrl} 
            alt="Preview" 
            className="object-contain w-full h-auto max-h-[140px]" 
          />
        </div>
      )}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export const VisualMirror = memo(VisualMirrorComponent) 