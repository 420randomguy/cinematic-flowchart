"use client"

import type React from "react"
import { ImageIcon } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { createInteractiveProps } from "@/lib/utils/node-interaction"

interface ImageSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  savedImages: string[]
  onSelectImage: (imageUrl: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleInputInteraction: (isInteracting?: boolean) => void
}

export default function ImageSelectorDialog({
  open,
  onOpenChange,
  savedImages,
  onSelectImage,
  onFileUpload,
  handleInputInteraction,
}: ImageSelectorDialogProps) {
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border border-gray-800 p-4 max-w-md">
        <h3 className="text-sm font-medium text-white mb-3">Select an image</h3>

        {savedImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 mb-3 max-h-[300px] overflow-y-auto p-1">
            {savedImages.map((img, index) => (
              <div
                key={index}
                className="aspect-video bg-gray-900 rounded overflow-hidden cursor-pointer hover:ring-1 hover:ring-yellow-300/50 group relative"
                onClick={() => onSelectImage(img)}
                {...interactiveProps}
              >
                <img
                  src={img || "/placeholder.svg"}
                  alt={`Saved image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <div className="text-[9px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Select this image
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm mb-3 py-4">
            <div className="mb-2">No saved images yet</div>
            <div className="text-xs text-gray-500">Upload an image to start your library</div>
          </div>
        )}

        <label
          className="mt-3 p-3 border border-dashed border-gray-700 rounded flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-800/30"
          {...interactiveProps}
        >
          <ImageIcon className="h-5 w-5 text-gray-500" />
          <span className="text-xs text-gray-400">Upload a new image</span>
          <input type="file" accept="image/*" className="hidden" onChange={onFileUpload} {...interactiveProps} />
        </label>
      </DialogContent>
    </Dialog>
  )
}

