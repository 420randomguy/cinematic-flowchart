"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface AssetViewerProps {
  src: string
  alt: string
  title?: string
  onClose: () => void
}

export default function AssetViewer({ src, alt, title, onClose }: AssetViewerProps) {
  // Determine if this is a video by checking the file extension
  const isVideo = useMemo(() => {
    const extension = src?.split('.')?.pop()?.toLowerCase()
    return extension === 'mp4' || extension === 'webm' || extension === 'mov' || 
           extension === 'gif' || src?.includes('testvideo')
  }, [src])

  return (
    <div className="relative w-full h-full bg-black/95 node-gradient overflow-hidden rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-50 bg-black/70 rounded-full p-1 text-white hover:bg-black"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        <VisuallyHidden>Close</VisuallyHidden>
      </Button>

      <div className="flex items-center justify-center h-full">
        {isVideo ? (
          <div className="aspect-video max-h-[85vh] max-w-[90vw] w-auto h-auto">
            <video 
              src={src} 
              className="object-contain w-full h-full"
              controls
              autoPlay
              loop
              controlsList="nodownload"
            />
          </div>
        ) : (
          <img 
            src={src || "/placeholder.svg"} 
            alt={alt} 
            className="max-h-[85vh] max-w-[90vw] object-contain" 
          />
        )}
      </div>
    </div>
  )
}

