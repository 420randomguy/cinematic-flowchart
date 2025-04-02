"use client"

import type React from "react"

import { memo, useState, useRef, useContext, useCallback } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import Image from "next/image"
import { Slider } from "@/components/ui/slider"
import { Maximize2, Download, Upload, ImageIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import type { VideoNodeData } from "@/types"
import { useNodeActions } from "@/hooks/useNodeActions"
import { useModelSettings } from "@/hooks/useModelSettings"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"
import { getVideoModels } from "@/lib/utils/schema-loader"

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
  const { setNodes } = useReactFlow()

  const { isSubmitting, timeRemaining, showResult, isGenerated, isNewNode, handleSubmitToggle } = useNodeActions({
    id,
    data,
  })

  const { selectedModelId, modelSettings, handleModelChange, handleSettingsChange, selectedModel } = useModelSettings(
    data.modelId || "wan-pro",
    data.modelSettings,
    data.onModelChange,
  )

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

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        VIDEO
      </div>

      <div className="absolute -top-2 right-2 z-20">
        <Select value={selectedModelId} onValueChange={handleModelChange}>
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

      {/* Only input handle, no output handle for video nodes */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-1.5 h-1.5 bg-gray-600 border-gray-600"
        style={{ top: "50%", left: -8 }}
      />

      {/* Use standard Button instead of SubmitButton */}
      <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
        <Button
          onClick={handleSubmitToggle}
          variant="outline"
          size="sm"
          className={`px-2 py-0.5 h-auto text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
            isSubmitting
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

      {data.showImage && (
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
                {isGenerated && showResult ? (
                  <Image
                    src="/akira-animation.gif"
                    alt="Generated video"
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
            />

            <div className="flex justify-between items-center pt-1">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">SEED</div>
              <div className="text-[9px] text-gray-400 font-mono">{data.seed || "416838458"}</div>
            </div>

            {/* Dynamic model settings */}
            <div className="pt-2">
              {data?.content && (
                <div className="text-[9px] text-gray-300 mb-3 font-mono tracking-wide border-b border-gray-800/50 pb-2 line-clamp-2">
                  {typeof data.content === "string"
                    ? data.content.substring(0, 100) + (data.content.length > 100 ? "..." : "")
                    : ""}
                </div>
              )}

              <div className="space-y-2">
                {selectedModel &&
                  Object.entries(selectedModel.settings || {}).map(([key, setting]) => {
                    // For array settings (enum types)
                    if (Array.isArray(setting)) {
                      // Special case for boolean settings
                      if (setting.length === 2 && typeof setting[0] === "boolean") {
                        return (
                          <div key={key} className="flex items-center justify-between pt-1">
                            <div className="text-[9px] uppercase text-gray-500 tracking-wide">
                              {key.replace(/_/g, " ")}
                            </div>
                            <Switch
                              checked={modelSettings[key] === true}
                              onCheckedChange={(checked) => handleSettingChange(key, checked)}
                              className="data-[state=checked]:bg-gray-600"
                            />
                          </div>
                        )
                      }

                      // For string enum settings
                      return (
                        <div key={key} className="flex justify-between items-center pt-1">
                          <div className="text-[9px] uppercase text-gray-500 tracking-wide">
                            {key.replace(/_/g, " ")}
                          </div>
                          <Select
                            value={String(modelSettings[key] || setting[0])}
                            onValueChange={(value) => handleSettingChange(key, value)}
                          >
                            <SelectTrigger className="h-5 w-[80px] bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0">
                              <SelectValue placeholder={String(setting[0])} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800 text-[9px] p-0 rounded-sm">
                              {setting.map((option) => (
                                <SelectItem
                                  key={String(option)}
                                  value={String(option)}
                                  className="text-[9px] py-1 px-2 text-gray-300"
                                >
                                  {String(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    }
                    // For integer settings
                    else if (typeof setting === "object" && setting.type === "integer") {
                      return (
                        <div key={key} className="space-y-1 pt-1">
                          <div className="flex justify-between items-center">
                            <div className="text-[9px] uppercase text-gray-500 tracking-wide">
                              {key.replace(/_/g, " ")}
                            </div>
                            <div className="text-[9px] text-gray-400">{modelSettings[key] || setting.default}</div>
                          </div>
                          <Slider
                            value={[modelSettings[key] || setting.default]}
                            min={setting.min}
                            max={setting.max}
                            step={1}
                            onValueChange={(value) => handleSettingChange(key, value[0])}
                            className="w-full h-1.5"
                          />
                        </div>
                      )
                    }

                    return null
                  })}
              </div>
            </div>

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
                      {data.imageUrl ? (
                        <img
                          src={data.imageUrl || "/placeholder.svg"}
                          alt="Custom uploaded fullscreen"
                          className="object-contain w-full h-full"
                        />
                      ) : showResult ? (
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
                <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500">
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

