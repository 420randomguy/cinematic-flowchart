"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageViewerProps {
  src: string
  alt: string
  title?: string
  onClose: () => void
}

export default function ImageViewer({ src, alt, title, onClose }: ImageViewerProps) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 bg-black/70 rounded-full p-1 text-white hover:bg-black"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>

      {title && <div className="text-sm text-white p-3 bg-black/80 absolute top-0 left-0 right-0">{title}</div>}

      <div className="flex items-center justify-center h-[80vh]">
        <img src={src || "/placeholder.svg"} alt={alt} className="max-h-[80vh] max-w-[90vw] object-contain" />
      </div>
    </div>
  )
}

