"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { memo, useState, useRef, useContext, useCallback, useEffect } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import Image from "next/image"
import { Slider } from "@/components/ui/slider"
import { Maximize2, Download, ImageIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { VideoNodeData } from "@/types"
import { useNodeActions } from "@/hooks/useNodeActions"
import { useModelSettings } from "@/hooks/useModelSettings"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"
import { getVideoModels } from "@/lib/utils/schema-loader"
import { useFlowchart } from "@/contexts/FlowchartContext"
import ModelSelector from "@/components/ui/ModelSelector"

/**
 * VideoNode Component
 *
 * A node component for video generation that uses schema-based model configuration
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The VideoNode component
 */
function VideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  const [quality, setQuality] = useState(80)
  const [isDragging, setIsDragging] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const { savedImages, addImage } = useContext(ImageLibraryContext)
  const { setNodes, getNodes, getNode, getEdges } = useReactFlow()
  const { handleInputInteraction } = useFlowchart()

  const [connectedTextNode, setConnectedTextNode] = useState<string | null>(null)
  const [connectedImageNode, setConnectedImageNode] = useState<string | null>(null)
  const [textPreview, setTextPreview] = useState<string>("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { isSubmitting, timeRemaining, showResult, isGenerated, isNewNode, handleSubmitToggle } = useNodeActions({
    id,
    data,
  })

  const { selectedModelId, modelSettings, handleModelChange, handleSettingsChange, selectedModel } = useModelSettings(
    data.modelId || "wan-pro",
    data.modelSettings,
    data.onModelChange,
  )

  const [seed, setSeed] = useState(data.seed || Math.floor(Math.random() * 1000000))
  const [showVideo, setShowVideo] = useState(false)
  const videoGenerated = showResult && data.videoUrl

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

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
    if (!isGenerated && !isSubmitting && !data.imageUrl) {
      setShowImageSelector(true)
    }
  }, [isGenerated, isSubmitting, data.imageUrl])

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

  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    handleSettingsChange({ ...modelSettings, [key]: value })
  }

  // Get content to display - prioritize sourceNodeContent if available
  const displayContent = data.sourceNodeContent || (typeof data.content === "string" ? data.content : "")

  useEffect(() => {
    const edges = getEdges()

    // Find connected text node
    const textEdge = edges.find((edge) => edge.target === id && edge.targetHandle === "video-text-input")

    if (textEdge) {
      const textNode = getNode(textEdge.source)
      if (textNode && textNode.type === "analysis") {
        setConnectedTextNode(textEdge.source)
        const textContent = textNode.data?.content || ""
        setTextPreview(textContent.length > 25 ? textContent.substring(0, 25) + "..." : textContent)
      }
    } else {
      setConnectedTextNode(null)
      setTextPreview("")
    }

    // Find connected image node - check for both specific handle and any connection from image nodes
    const imageEdge = edges.find(
      (edge) =>
        (edge.target === id && edge.targetHandle === "video-image-input") ||
        (edge.target === id && !edge.targetHandle && getNode(edge.source)?.type?.includes("image")),
    )

    if (imageEdge) {
      const imageNode = getNode(imageEdge.source)
      if (
        imageNode &&
        (imageNode.type === "image" || imageNode.type === "text-to-image" || imageNode.type.includes("image"))
      ) {
        setConnectedImageNode(imageEdge.source)
        const imageUrl = imageNode.data?.imageUrl || null
        setImagePreview(imageUrl)
        console.log("Connected image node found:", imageNode.id, imageNode.type, imageUrl)
      }
    } else {
      setConnectedImageNode(null)
      setImagePreview(null)
    }
  }, [getEdges, getNode, id, data._lastUpdated])

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        VIDEO
      </div>

      <div className="absolute -top-2 right-2 z-20">
        <Select
          value={selectedModelId}
          onValueChange={handleModelChange}
          onMouseEnter={() => handleInputInteraction(true)}
          onMouseLeave={() => handleInputInteraction(false)}
          onFocus={() => handleInputInteraction(true)}
          onBlur={() => handleInputInteraction(false)}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <SelectTrigger className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-[9px] p-0 rounded-sm">
            {getVideoModels().map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
              >
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="font-bold text-[10px] mb-0.5 text-gray-400 tracking-wide uppercase">{data.title}</div>

      {/* Single visual input handle that works for both text and image inputs */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-1.5 h-1.5 bg-gray-600 border-gray-600"
        style={{ top: "25%", left: -8 }}
      />

      {/* Hidden handles for actual connection logic - these are invisible but functional */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="opacity-0 pointer-events-none"
        style={{ top: "25%", left: -8 }}
        id="video-text-input"
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="opacity-0 pointer-events-none"
        style={{ top: "25%", left: -8 }}
        id="video-image-input"
      />

      {/* Submit button */}
      <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
        <button
          onClick={handleSubmitToggle}
          className={`px-2 py-0.5 rounded-sm text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
            isSubmitting
              ? "bg-gray-700/90 border border-gray-600 text-gray-300" // In progress state
              : videoGenerated
                ? "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Completed state with yellow accent for regenerate
                : "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Default state with yellow accent
          }`}
        >
          {isSubmitting ? "Cancel" : videoGenerated ? "Regenerate" : "Submit"}
        </button>

        {isSubmitting && (
          <div className="text-[9px] text-gray-500 tracking-wide">Est. time: {formatTimeRemaining(timeRemaining)}</div>
        )}
      </div>

      {data.showImage && (
        <div className="space-y-1.5">
          <div className="relative aspect-video bg-black rounded-sm overflow-hidden">
            {showVideo ? (
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src="/akira-animation.gif"
                  alt="Generated video"
                  width={260}
                  height={150}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <>
                {imagePreview ? (
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Connected image"
                    className="object-cover w-full h-full"
                  />
                ) : data.imageUrl ? (
                  <img
                    src={data.imageUrl || "/placeholder.svg"}
                    alt="Custom uploaded image"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/30">
                    <div className="text-[9px] text-yellow-300/90 font-mono tracking-wide text-center">
                      Connect Image node
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
              {connectedTextNode && textPreview ? textPreview : "Connect Prompt node"}
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-gray-800/50">
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
              onMouseEnter={() => handleInputInteraction(true)}
              onMouseLeave={() => handleInputInteraction(false)}
              onFocus={() => handleInputInteraction(true)}
              onBlur={() => handleInputInteraction(false)}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onMouseMove={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />

            <div className="flex justify-between items-center pt-1">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">SEED</div>
              <div className="text-[9px] text-gray-400 font-mono">{seed}</div>
            </div>

            {/* Dynamic model selector and settings */}
            <ModelSelector
              selectedModelId={selectedModelId}
              onModelChange={handleModelChange}
              settings={modelSettings}
              onSettingsChange={handleSettingsChange}
              className="pt-2"
              data={data}
            />

            <div className="flex justify-end items-center pt-1.5">
              <div className="flex gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500"
                      onMouseEnter={() => handleInputInteraction(true)}
                      onMouseLeave={() => handleInputInteraction(false)}
                      onFocus={() => handleInputInteraction(true)}
                      onBlur={() => handleInputInteraction(false)}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.nativeEvent.stopImmediatePropagation()
                      }}
                    >
                      <Maximize2 className="h-2.5 w-2.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-3xl">
                    <div className="aspect-video w-full overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Connected image fullscreen"
                          className="object-contain w-full h-full"
                        />
                      ) : data.imageUrl ? (
                        <img
                          src={data.imageUrl || "/placeholder.svg"}
                          alt="Custom uploaded fullscreen"
                          className="object-contain w-full h-full"
                        />
                      ) : showVideo ? (
                        <Image
                          src="/akira-animation.gif"
                          alt="Generated video fullscreen"
                          width={1200}
                          height={675}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <Image
                          src="/sample-image.png"
                          alt="Preview fullscreen"
                          width={1200}
                          height={675}
                          className="object-contain w-full h-full"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <button
                  className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500"
                  onMouseEnter={() => handleInputInteraction(true)}
                  onMouseLeave={() => handleInputInteraction(false)}
                  onFocus={() => handleInputInteraction(true)}
                  onBlur={() => handleInputInteraction(false)}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.nativeEvent.stopImmediatePropagation()
                  }}
                >
                  <Download className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default memo(VideoNode)

