"use client"

import { memo } from "react"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { Upload } from "lucide-react"

interface VisualMirrorProps {
  nodeId: string
  type?: "image" | "text" | "both" // Type prop to control what content to show
  textLimit?: number // Optional limit for text characters
  hidePrompt?: boolean // New prop to optionally hide the empty state prompt
}

// Core VisualMirror component for different content types
function VisualMirrorComponent({ nodeId, type = "both", textLimit, hidePrompt = false }: VisualMirrorProps) {
  // Get content from the visual mirror store
  const { visibleContent } = useVisualMirrorStore()
  const visualData = visibleContent[nodeId] || {}
  
  // If text limit is provided, apply it
  const displayText = textLimit && visualData.text 
    ? visualData.text.substring(0, textLimit) 
    : visualData.text

  // Image-only rendering
  if (type === "image") {
    return visualData.imageUrl ? (
      <div className="w-full h-full overflow-hidden">
        <img 
          src={visualData.imageUrl} 
          alt="Preview" 
          className="object-cover w-full h-full" 
        />
      </div>
    ) : (
      <div className={`w-full h-full min-h-[80px] flex flex-col items-center justify-center ${hidePrompt ? 'invisible' : ''}`}>
        <Upload className="h-5 w-5 mb-2 text-gray-500" />
        <div className="text-[9px] text-gray-500 text-center">Connect image node</div>
      </div>
    );
  }
  
  // Text-only rendering
  if (type === "text") {
    return (
      <div className="block w-full p-2 relative text-[9px] font-mono text-left bg-black/30 border border-yellow-900/30 overflow-hidden">
        {visualData.text ? (
          <div className="text-yellow-300 whitespace-nowrap overflow-hidden">
            {displayText}
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-black/30 pointer-events-none"></div>
          </div>
        ) : (
          <div className="text-gray-500">Prompt text...</div>
        )}
      </div>
    );
  }
  
  // Combined rendering for "both" type
  return (
    <div className="visual-mirror pointer-events-none w-full h-full">
      {/* Text section */}
      <div className="block w-full p-2 relative text-[9px] font-mono text-left bg-black/30 border border-yellow-900/30 overflow-hidden">
        {visualData.text ? (
          <div className="text-yellow-300 whitespace-nowrap overflow-hidden">
            {displayText}
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-black/30 pointer-events-none"></div>
          </div>
        ) : (
          <div className="text-gray-500">Prompt text...</div>
        )}
      </div>
      
      {/* Image section */}
      {visualData.imageUrl ? (
        <div className="w-full h-full overflow-hidden">
          <img 
            src={visualData.imageUrl} 
            alt="Preview" 
            className="object-cover w-full h-full" 
          />
        </div>
      ) : (
        <div className={`w-full h-full min-h-[80px] flex flex-col items-center justify-center ${hidePrompt ? 'invisible' : ''}`}>
          <Upload className="h-5 w-5 mb-2 text-gray-500" />
          <div className="text-[9px] text-gray-500 text-center">Connect image node</div>
        </div>
      )}
    </div>
  );
}

// Image-only variant - positioned to replace NodeContent
export const VisualMirrorImage = memo(({ nodeId, hidePrompt = false }: { nodeId: string, hidePrompt?: boolean }) => (
  <div className="w-full h-full">
    <VisualMirrorComponent nodeId={nodeId} type="image" hidePrompt={hidePrompt} />
  </div>
))
VisualMirrorImage.displayName = "VisualMirrorImage"

// Text-only variant - for displaying the 25 char preview
export const VisualMirrorText = memo(({ nodeId }: { nodeId: string }) => {
  return (
    <div className="px-2 pb-2 node-text-preview">
      <VisualMirrorComponent 
        nodeId={nodeId} 
        type="text"
        textLimit={25}
      />
    </div>
  )
})
VisualMirrorText.displayName = "VisualMirrorText"

// Render node variant - for displaying generation progress and results
export const VisualMirrorRender = memo(({ 
  nodeId, 
  isSubmitting = false, 
  timeRemaining = 0,
  showCompletionBadge = false
}: { 
  nodeId: string, 
  isSubmitting?: boolean, 
  timeRemaining?: number,
  showCompletionBadge?: boolean
}) => {
  return (
    <div className="relative w-full h-full">
      {isSubmitting ? (
        <div className="flex flex-col items-center justify-center p-4 min-h-[120px]">
          <div className="text-[11px] text-gray-400 text-center mb-3">Generating...</div>
          <div className="text-[10px] text-gray-500 text-center mb-2">Est. time: {timeRemaining}s</div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-600/50 transition-all duration-1000 ease-linear" 
              style={{ width: `${(5 - timeRemaining) * 20}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center p-2 min-h-[120px]">
          <VisualMirrorImage nodeId={nodeId} hidePrompt={true} />
          {showCompletionBadge && (
            <div className="absolute bottom-1 right-1 text-[8px] text-yellow-300 bg-black/50 px-1 rounded">
              Render Complete
            </div>
          )}
        </div>
      )}
    </div>
  )
})
VisualMirrorRender.displayName = "VisualMirrorRender"

// Original full version - absolute positioned (retained for backward compatibility)
export const VisualMirror = memo((props: VisualMirrorProps) => (
  <div className="absolute inset-0 z-10">
    <VisualMirrorComponent {...props} />
  </div>
))
VisualMirror.displayName = "VisualMirror" 