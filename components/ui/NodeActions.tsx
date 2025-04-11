"use client"

import { memo, useRef, useCallback, useEffect } from "react"
import { Maximize2, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import Image from "next/image"
import type { NodeActionsProps } from "@/types/node-props"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

function NodeActionsComponent({ imageUrl, showVideo = false, className = "", nodeId }: NodeActionsProps) {
  // Use the store directly for better performance
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  // Get image from VisualMirrorStore
  const { visibleContent } = useVisualMirrorStore()
  const visualData = nodeId ? visibleContent[nodeId] || {} : {}
  
  // Use VisualMirror image URL if available, fallback to prop
  const effectiveImageUrl = visualData.imageUrl || imageUrl

  // Track dialog state to prevent unnecessary renders
  const dialogOpenRef = useRef(false)

  // Cache the image URL to prevent unnecessary re-renders
  const imageUrlRef = useRef(effectiveImageUrl)

  // Track if an image is available to avoid unnecessary condition checks
  const hasImageRef = useRef(!!effectiveImageUrl)

  // Update the refs when the prop changes - only if they've actually changed
  useEffect(() => {
    if (effectiveImageUrl !== imageUrlRef.current) {
      imageUrlRef.current = effectiveImageUrl
      hasImageRef.current = !!effectiveImageUrl
    }
  }, [effectiveImageUrl])

  // Memoized handlers to prevent recreation on each render
  const handleDialogChange = useCallback((open: boolean) => {
    dialogOpenRef.current = open
  }, [])

  const handleDownload = useCallback(() => {
    // Only proceed if we have an image URL
    if (!hasImageRef.current || !imageUrlRef.current) return

    try {
      // Create a temporary link element
      const link = document.createElement("a")
      link.href = imageUrlRef.current
      link.download = `image_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading image:", error)
    }
  }, [])

  return (
    <div className={`flex justify-end items-center pt-1.5 ${className}`}>
      <div className="flex gap-1">
        <Dialog onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500" {...interactiveProps}>
              <Maximize2 className="h-2.5 w-2.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-3xl">
            <VisuallyHidden>
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription>Full size preview of the selected image</DialogDescription>
            </VisuallyHidden>
            <div className="aspect-video w-full overflow-hidden">
              {showVideo ? (
                <Image
                  src="/akira-animation.gif"
                  alt="Generated video fullscreen"
                  width={1200}
                  height={675}
                  className="object-contain w-full h-full"
                  loading="lazy"
                />
              ) : imageUrlRef.current ? (
                <img
                  src={imageUrlRef.current || "/placeholder.svg"}
                  alt="Preview fullscreen"
                  className="object-contain w-full h-full"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No image available</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <button
          className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500"
          disabled={!hasImageRef.current}
          {...interactiveProps}
          onClick={handleDownload}
        >
          <Download className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  )
}

// Use a simple but effective comparison function
function arePropsEqual(prevProps: NodeActionsProps, nextProps: NodeActionsProps) {
  return (
    prevProps.className === nextProps.className &&
    prevProps.showVideo === nextProps.showVideo &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.nodeId === nextProps.nodeId
  )
}

// Use memo with our custom comparison function
export const NodeActions = memo(NodeActionsComponent, arePropsEqual)

