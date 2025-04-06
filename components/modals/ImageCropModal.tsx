"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"

/**
 * ImageCropModal Props
 *
 * @property {string} imageUrl - URL of the image to crop
 * @property {Function} onComplete - Function called when cropping is complete
 * @property {Function} onCancel - Function called when cropping is cancelled
 */
interface ImageCropModalProps {
  imageUrl: string
  onComplete: (croppedImageUrl: string, aspectRatio: string) => void
  onCancel: () => void
}

/**
 * ImageCropModal Component
 *
 * Modal for cropping images to specific aspect ratios
 */
export default function ImageCropModal({ imageUrl, onComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const [aspectRatio, setAspectRatio] = useState<string>("16:9")
  const imgRef = useRef<HTMLImageElement>(null)
  const [isOpen, setIsOpen] = useState(true)

  // Set aspect ratio based on selection
  useEffect(() => {
    let ratio: number
    switch (aspectRatio) {
      case "16:9":
        ratio = 16 / 9
        break
      case "9:16":
        ratio = 9 / 16
        break
      case "1:1":
        ratio = 1
        break
      default:
        ratio = 16 / 9
    }

    setCrop((prev) => ({
      ...prev,
      aspect: ratio,
    }))
  }, [aspectRatio])

  const handleAspectRatioChange = (value: string) => {
    setAspectRatio(value)
  }

  const getCroppedImg = useCallback(() => {
    if (!imgRef.current || !completedCrop) return

    const image = imgRef.current
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return
    }

    const pixelRatio = window.devicePixelRatio

    canvas.width = completedCrop.width * scaleX * pixelRatio
    canvas.height = completedCrop.height * scaleY * pixelRatio

    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = "high"

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY

    ctx.drawImage(
      image,
      cropX,
      cropY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    )

    return canvas.toDataURL("image/jpeg")
  }, [completedCrop])

  const handleComplete = () => {
    const croppedImageUrl = getCroppedImg()
    if (croppedImageUrl) {
      onComplete(croppedImageUrl, aspectRatio)

      // If we have a node ID in the crop image data, update that node
      const cropImageData = useFlowchartStore.getState().cropImage
      if (cropImageData?.nodeId) {
        // Update the node with the cropped image
        useFlowchartStore.getState().setNodes((nodes) =>
          nodes.map((node) =>
            node.id === cropImageData.nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    imageUrl: croppedImageUrl,
                  },
                }
              : node,
          ),
        )

        // Also save the image to the library
        useImageLibraryStore.getState().addAsset({
          url: croppedImageUrl,
          type: "image",
          title: "Cropped Image",
        })
      }

      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    onCancel()
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-black border border-gray-800 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Crop Image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-300">Select aspect ratio:</div>
            <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
              <SelectTrigger className="w-[100px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="16:9" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
                <SelectItem value="1:1">1:1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative bg-black/50 rounded-md overflow-hidden flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio === "16:9" ? 16 / 9 : aspectRatio === "9:16" ? 9 / 16 : 1}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                src={imageUrl || "/placeholder.svg"}
                alt="Crop preview"
                className="max-h-[60vh] object-contain"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="bg-transparent text-white border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleComplete} className="bg-gray-700 hover:bg-gray-600 text-white">
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

