"use client"

import type React from "react"

import Image from "next/image"
import { useState, useCallback, useRef, useContext } from "react"
import type { NodeContentProps } from "@/types"
import { Upload, ImageIcon } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"

export function NodeContent({ data, isSubmitting, isGenerated, showVideo, children }: NodeContentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  // Use the image library context to access saved images
  const { savedImages, addImage } = useContext(ImageLibraryContext)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = () => {
            const imageUrl = reader.result as string

            // Save the image to the library
            addImage(imageUrl)

            // Update the node data
            if (data.onImageUpload) {
              data.onImageUpload(file, imageUrl)
            }
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [data, addImage],
  )

  const handleClick = useCallback(() => {
    if (!isGenerated && !isSubmitting && !data.imageUrl) {
      setShowImageSelector(true)
    }
  }, [isGenerated, isSubmitting, data.imageUrl])

  const selectImage = useCallback(
    (imageUrl: string) => {
      // Update the node data with the selected image
      if (data.onImageSelect) {
        data.onImageSelect(imageUrl)
      }
      setShowImageSelector(false)
    },
    [data],
  )

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = () => {
            const imageUrl = reader.result as string

            // Save the image to the library
            addImage(imageUrl)

            // Update the node data
            if (data.onImageSelect) {
              data.onImageSelect(imageUrl)
            }
          }
          reader.readAsDataURL(file)
        }
      }
      setShowImageSelector(false)
    },
    [data, addImage],
  )

  // Get content to display - prioritize sourceNodeContent if available
  const displayContent = data.sourceNodeContent || (typeof data.content === "string" ? data.content : "")

  return (
    <div className="space-y-1.5">
      <div
        className="relative bg-black rounded-sm overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          aspectRatio: "16/9",
          maxHeight: isGenerated || isSubmitting ? "150px" : "auto",
        }}
      >
        {isSubmitting ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[9px] text-gray-400 p-2 text-center">Generating {data.category}...</div>
          </div>
        ) : data.category === "image" ? (
          isGenerated ? (
            <img
              src={data.imageUrl || "/sample-image.png"}
              alt="Generated content"
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-black/30 p-2 overflow-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <div
                className="text-[9px] text-yellow-300/90 mt-3 mb-1 font-mono tracking-wide border-t border-gray-800/50 pt-2 line-clamp-2"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
              >
                {displayContent || "Waiting for connected prompt..."}
              </div>
            </div>
          )
        ) : (
          <div
            ref={dropRef}
            className={`w-full h-full flex items-center justify-center cursor-pointer ${
              isDragging ? "bg-gray-800/50 border-2 border-dashed border-yellow-300/50" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            {isGenerated && showVideo ? (
              <Image
                src="/akira-animation.gif"
                alt="Generated content"
                width={260}
                height={150}
                className="object-cover w-full h-full"
              />
            ) : data.imageUrl ? (
              <img
                src={data.imageUrl || "/placeholder.svg"}
                alt="Source image"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-[9px] text-gray-400 p-2 overflow-hidden max-h-[150px] transition-all duration-300 ease-in-out flex flex-col items-center gap-2">
                <Upload className="h-4 w-4 text-gray-500" />
                <span>Click to select or drag and drop new image</span>
              </div>
            )}
          </div>
        )}

        {data.caption && (isGenerated || data.imageUrl) && (
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
            {data.caption}
          </div>
        )}
      </div>

      {children}

      {/* Image selector dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="bg-black border border-gray-800 p-4 max-w-md">
          <h3 className="text-sm font-medium text-white mb-3">Select an image</h3>

          {savedImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {savedImages.map((img, index) => (
                <div
                  key={index}
                  className="aspect-video bg-gray-900 rounded overflow-hidden cursor-pointer hover:ring-1 hover:ring-yellow-300/50"
                  onClick={() => selectImage(img)}
                >
                  <img
                    src={img || "/placeholder.svg"}
                    alt={`Saved image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm mb-3">No saved images yet</div>
          )}

          <label className="mt-3 p-3 border border-dashed border-gray-700 rounded flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-800/30">
            <ImageIcon className="h-5 w-5 text-gray-500" />
            <span className="text-xs text-gray-400">Upload a new image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </DialogContent>
      </Dialog>
    </div>
  )
}

