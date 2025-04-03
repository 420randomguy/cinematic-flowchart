"use client"

import { memo } from "react"
import { Position, type NodeProps } from "reactflow"
import { Upload } from "lucide-react"
import type { ImageNodeData } from "@/types"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { TargetHandle } from "@/components/shared/NodeHandles"
import { NodeHeader } from "@/components/ui/NodeHeader"
import { NodeSettings } from "@/components/ui/NodeSettings"
import { NodeActions } from "@/components/ui/NodeActions"
import { SubmitButton } from "@/components/ui/SubmitButton"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchart } from "@/contexts/FlowchartContext"
import { createInteractiveProps } from "@/lib/utils/node-interaction"

/**
 * ImageToImageNode Component
 *
 * A node component for image-to-image generation using flux-lora model
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The ImageToImageNode component
 */
function ImageToImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const { handleInputInteraction } = useFlowchart()
  const interactiveProps = createInteractiveProps(handleInputInteraction)
  const MODEL_ID = "flux-lora" // Fixed model for image-to-image

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    strength,
    setStrength,
    seed,
    isNewNode,
    isSubmitting,
    timeRemaining,
    isGenerated,
    handleSubmitToggle,
    sourceNodeContent,
  } = useNodeState({
    id,
    data,
    initialStrength: 70,
  })

  // Use the image handling hook for image selection and upload
  const {
    isDragging,
    showImageSelector,
    setShowImageSelector,
    dropRef,
    savedImages,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    selectImage,
    handleFileUpload,
  } = useImageHandling({ id, data })

  // Check if we have a source image
  const hasSourceImage = !!data.imageUrl

  // Debug function to ensure click is working
  const handleDebugClick = () => {
    console.log("Image clicked, opening selector")
    setShowImageSelector(true)
  }

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      {/* Node header with type label and fixed model */}
      <NodeHeader title={data.title} type="image-to-image" />
      <div className="absolute -top-2 right-2 z-20">
        <div className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0 flex items-center justify-center">
          FLUX LORA
        </div>
      </div>

      {/* Input handle */}
      <TargetHandle position={Position.Left} isConnectable={isConnectable} />

      {/* Submit button */}
      <SubmitButton
        isSubmitting={isSubmitting}
        isGenerated={isGenerated}
        onClick={handleSubmitToggle}
        timeRemaining={timeRemaining}
        disabled={!hasSourceImage}
        handleInputInteraction={handleInputInteraction}
      />

      {/* Source image section */}
      <div className="space-y-1.5">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide flex items-center gap-1">
          <span>Source Image</span>
          <span className="text-yellow-300/90">*</span>
          <span className="text-gray-400 normal-case italic">(required)</span>
        </div>

        {/* Image upload area */}
        <div
          ref={dropRef}
          className={`relative aspect-video bg-black rounded-sm overflow-hidden cursor-pointer ${
            isDragging ? "bg-gray-800/50 border-2 border-dashed border-yellow-300/50" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDebugClick} // Direct click handler without interactiveProps
        >
          {data.imageUrl ? (
            // When we have an image, show it but keep it clickable for replacement
            <div className="relative w-full h-full">
              <img
                src={data.imageUrl || "/placeholder.svg"}
                alt="Source image"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="text-[9px] text-white text-center">Click to replace image</div>
              </div>
            </div>
          ) : (
            // When no image, show the upload prompt
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
              <Upload className="h-4 w-4 text-gray-500" />
              <div className="text-[9px] text-gray-400 text-center">Click to select from library or drag and drop</div>
            </div>
          )}
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

        {/* Node settings with quality, strength, seed, and size */}
        <NodeSettings
          quality={quality}
          setQuality={setQuality}
          seed={seed}
          strength={strength}
          setStrength={setStrength}
          defaultSize="1:1"
          content={sourceNodeContent || data.content}
        />

        {/* Node actions with fullscreen and download buttons */}
        <NodeActions imageUrl={data.imageUrl || data.outputImageUrl} />
      </div>

      {/* Image selector dialog */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        savedImages={savedImages}
        onSelectImage={selectImage}
        onFileUpload={handleFileUpload}
        handleInputInteraction={handleInputInteraction}
      />
    </div>
  )
}

export default memo(ImageToImageNode)

