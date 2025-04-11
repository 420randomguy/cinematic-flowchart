"use client"

import { memo, useRef, useCallback, useEffect } from "react"
import { Maximize2, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { VisualMirrorRender } from "@/components/nodes/VisualMirror"

interface ActionsSectionProps {
  imageUrl?: string | null
  showVideo?: boolean
  className?: string
  title?: string
  nodeId: string
}

function ActionsSectionComponent({ imageUrl, showVideo = false, className = "", title, nodeId }: ActionsSectionProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  // Use refs to prevent unnecessary rerenders for mutable state
  const dialogOpenRef = useRef(false)
  const imageUrlRef = useRef(imageUrl)

  // Update ref when imageUrl changes
  useEffect(() => {
    imageUrlRef.current = imageUrl
  }, [imageUrl])

  // Memoize handlers to prevent recreation on each render
  const handleDialogChange = useCallback((open: boolean) => {
    dialogOpenRef.current = open
  }, [])

  const handleDownload = useCallback(() => {
    // Only proceed if we have an image URL
    if (!imageUrlRef.current) return

    // Create a temporary link element
    const link = document.createElement("a")
    link.href = imageUrlRef.current
    link.download = `image_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Extract onClick from interactiveProps to avoid conflict
  const { onClick: _ignoredClick, ...safeInteractiveProps } = interactiveProps

  return (
    <div className={`pt-2 pb-1 ${className}`}>
      {title && <div className="text-[9px] uppercase text-gray-500 tracking-wide mb-1.5">{title}</div>}

      <div className="flex justify-end items-center">
        <div className="flex gap-1">
          <Dialog onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500" {...safeInteractiveProps}>
                <Maximize2 className="h-2.5 w-2.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-[90vw] max-h-[90vh] w-auto h-auto">
              <DialogTitle className="sr-only">
                {showVideo ? "Video Preview" : "Image Preview"}
              </DialogTitle>
              <div className="w-full h-full overflow-hidden">
                <VisualMirrorRender 
                  nodeId={nodeId} 
                  isSubmitting={false}
                  showCompletionBadge={false}
                  showControls={true}
                  isFullscreen={true}
                />
              </div>
            </DialogContent>
          </Dialog>
          <button
            className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500"
            onClick={handleDownload}
            disabled={!imageUrlRef.current}
            {...safeInteractiveProps}
          >
            <Download className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const ActionsSection = memo(ActionsSectionComponent)

