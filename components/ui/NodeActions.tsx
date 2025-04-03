"use client"

import { Maximize2, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchart } from "@/contexts/FlowchartContext"
import Image from "next/image"

interface NodeActionsProps {
  imageUrl?: string | null
  showVideo?: boolean
  className?: string
}

/**
 * Reusable node actions component for fullscreen and download buttons
 */
export function NodeActions({ imageUrl, showVideo = false, className = "" }: NodeActionsProps) {
  const { handleInputInteraction } = useFlowchart()
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  return (
    <div className={`flex justify-end items-center pt-1.5 ${className}`}>
      <div className="flex gap-1">
        <Dialog>
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
                />
              ) : imageUrl ? (
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Preview fullscreen"
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No image available</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500" {...interactiveProps}>
          <Download className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  )
}

