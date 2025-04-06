"use client"

import { memo, useRef, useCallback, useEffect } from "react"
import { Maximize2, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import Image from "next/image"
import { useFlowchartStore } from "@/store/useFlowchartStore"

interface ActionsSectionProps {
  imageUrl?: string | null
  showVideo?: boolean
  className?: string
  title?: string
}

function ActionsSectionComponent({ imageUrl, showVideo = false, className = "", title }: ActionsSectionProps) {
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

  return (
    <div className={`pt-2 pb-1 ${className}`}>
      {title && <div className="text-[9px] uppercase text-gray-500 tracking-wide mb-1.5">{title}</div>}

      <div className="flex justify-end items-center">
        <div className="flex gap-1">
          <Dialog onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500" {...interactiveProps}>
                <Maximize2 className="h-2.5 w-2.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-3xl">
              <div className="aspect-video w-full overflow-hidden">
                {showVideo ? (
                  <Image
                    src="/akira-animation.gif"
                    alt="Generated video fullscreen"
                    width={1200}
                    height={675}
                    className="object-contain w-full h-full"
                    priority={false}
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
            onClick={handleDownload}
            disabled={!imageUrlRef.current}
            {...interactiveProps}
          >
            <Download className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const ActionsSection = memo(ActionsSectionComponent)

