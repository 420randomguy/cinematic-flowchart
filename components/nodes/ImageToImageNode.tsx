"use client"

import type React from "react"

import { memo, useState, useRef, useContext, useCallback } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import Image from "next/image"
import { Slider } from "@/components/ui/slider"
import { Maximize2, Download, Upload, ImageIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ImageNodeData } from "@/types"
import { useNodeActions } from "@/hooks/useNodeActions"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"

/**
 * ImageToImageNode Component
 *
 * A node component for image-to-image generation using flux-lora model
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The ImageToImageNode component
 */
function ImageToImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  // Fixed model to flux-lora
  const MODEL_ID = "flux-lora"

  const [quality, setQuality] = useState(80)
  const [strength, setStrength] = useState(70) // Image-to-image strength parameter
  const [isDragging, setIsDragging] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const { savedImages, addImage } = useContext(ImageLibraryContext)
  const { setNodes } = useReactFlow()

  const { isSubmitting, timeRemaining, showResult, isGenerated, isNewNode, handleSubmitToggle } = useNodeActions({
    id,
    data,
  })

  // Handle image upload from drag and drop
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
            const updatedData = {
              ...data,
              imageUrl: imageUrl,
              imageFile: file,
            }

            // Update the node in ReactFlow
            setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [data, id, setNodes, addImage],
  )

  const handleClick = useCallback(() => {
    setShowImageSelector(true)
  }, [])

  const selectImage = useCallback(
    (imageUrl: string) => {
      // Update the node data with the selected image
      const updatedData = {
        ...data,
        imageUrl: imageUrl,
      }

      // Update the node in ReactFlow
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
      setShowImageSelector(false)
    },
    [data, id, setNodes],
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
            const updatedData = {
              ...data,
              imageUrl: imageUrl,
              imageFile: file,
            }

            // Update the node in ReactFlow
            setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
          }
          reader.readAsDataURL(file)
        }
      }
      setShowImageSelector(false)
    },
    [data, id, setNodes, addImage],
  )

  // Check if we have a source image
  const hasSourceImage = !!data.imageUrl

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        IMAGE-TO-IMAGE
      </div>

      <div className="absolute -top-2 right-2 z-20">
        <div className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0 flex items-center justify-center">
          FLUX LORA
        </div>
      </div>

      <div className="font-bold text-[10px] mb-0.5 text-gray-400 tracking-wide uppercase">{data.title}</div>

      {/* Only input handle, no output handle for image nodes */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-1.5 h-1.5 bg-gray-600 border-gray-600"
        style={{ top: "50%", left: -8 }}
      />

      {/* Submit button */}
      <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
        <Button
          onClick={handleSubmitToggle}
          variant="outline"
          size="sm"
          disabled={!hasSourceImage}
          className={`px-2 py-0.5 h-auto text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
            !hasSourceImage
              ? "bg-gray-800/30 border-gray-700/50 text-gray-500"
              : isSubmitting
                ? "bg-gray-700/90 border-gray-600 text-gray-300"
                : isGenerated
                  ? "bg-gray-800/80 border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70"
                  : "bg-gray-800/80 border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70"
          }`}
        >
          {isSubmitting ? "Cancel" : isGenerated ? "Regenerate" : "Submit"}
        </Button>

        {isSubmitting && (
          <div className="text-[9px] text-gray-500 tracking-wide">
            Est. time: {Math.floor(timeRemaining / 60)}:{timeRemaining % 60 < 10 ? "0" : ""}
            {timeRemaining % 60}
          </div>
        )}
      </div>

      {/* Source image section */}
      <div className="space-y-1.5">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide flex items-center gap-1">
          <span>Source Image</span>
          <span className="text-yellow-300/90">*</span>
          <span className="text-gray-400 normal-case italic">(required)</span>
        </div>

        <div
          className="relative bg-black rounded-sm overflow-hidden transition-all duration-300 ease-in-out"
          style={{ aspectRatio: "16/9" }}
        >
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
            {data.imageUrl ? (
              <img
                src={data.imageUrl || "/placeholder.svg"}
                alt="Source image"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-[9px] text-gray-400 p-2 overflow-hidden max-h-[150px] transition-all duration-300 ease-in-out flex flex-col items-center gap-2">
                <Upload className="h-4 w-4 text-gray-500" />
                <span>Click to select or drag and drop source image</span>
              </div>
            )}
          </div>
        </div>

        {/* Output image section */}
        {isGenerated && (
          <div className="mt-3 space-y-1.5">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">Output Image</div>
            <div className="relative aspect-video bg-black rounded-sm overflow-hidden">
              <img
                src={data.outputImageUrl || "/sample-image.png"}
                alt="Generated content"
                className="object-cover w-full h-full"
              />
              {data.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
                  {data.caption}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings section */}
        <div className="space-y-1 pt-1 border-t border-gray-800/50">
          {/* Quality slider */}
          <div className="flex justify-between items-center">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">QUALITY</div>
            <div className="text-[9px] text-gray-400">{quality}</div>
          </div>
          <Slider
            value={[quality]}
            min={1}
            max={100}
            step={1}
            onValueChange={(value) => setQuality(value[0])}
            className="w-full h-1.5"
          />

          {/* Strength slider (specific to image-to-image) */}
          <div className="flex justify-between items-center pt-1">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">STRENGTH</div>
            <div className="text-[9px] text-gray-400">{strength}%</div>
          </div>
          <Slider
            value={[strength]}
            min={1}
            max={100}
            step={1}
            onValueChange={(value) => setStrength(value[0])}
            className="w-full h-1.5"
          />

          {/* Seed */}
          <div className="flex justify-between items-center pt-1">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">SEED</div>
            <div className="text-[9px] text-gray-400 font-mono">{data.seed || "416838458"}</div>
          </div>

          {/* Size selector */}
          <div className="flex justify-between items-center pt-1">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">SIZE</div>
            <Select defaultValue="1:1">
              <SelectTrigger className="h-5 w-[60px] bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0">
                <SelectValue placeholder="1:1" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-[9px] p-0 rounded-sm">
                <SelectItem value="16:9" className="text-[9px] py-1 px-2 text-gray-300">
                  16:9
                </SelectItem>
                <SelectItem value="9:16" className="text-[9px] py-1 px-2 text-gray-300">
                  9:16
                </SelectItem>
                <SelectItem value="3:4" className="text-[9px] py-1 px-2 text-gray-300">
                  3:4
                </SelectItem>
                <SelectItem value="4:3" className="text-[9px] py-1 px-2 text-gray-300">
                  4:3
                </SelectItem>
                <SelectItem value="1:1" className="text-[9px] py-1 px-2 text-gray-300">
                  1:1
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional prompt text */}
          {data.content && (
            <div className="text-[9px] text-yellow-300/90 mt-3 mb-1 font-mono tracking-wide border-t border-gray-800/50 pt-2 line-clamp-2">
              {typeof data.content === "string"
                ? data.content.substring(0, 100) + (data.content.length > 100 ? "..." : "")
                : ""}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end items-center pt-1.5">
            <div className="flex gap-1">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500">
                    <Maximize2 className="h-2.5 w-2.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-3xl">
                  <div className="aspect-video w-full overflow-hidden">
                    <Image
                      src={data.imageUrl || data.outputImageUrl || "/sample-image.png"}
                      alt="Preview fullscreen"
                      width={1200}
                      height={675}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </DialogContent>
              </Dialog>
              <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500">
                <Download className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

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

export default memo(ImageToImageNode)

