"use client"

import { memo } from "react"
import { Position, type NodeProps } from "reactflow"
import { Upload } from "lucide-react"
import type { ImageNodeData } from "@/types"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { SourceHandle, TargetHandle } from "@/components/shared/NodeHandles"
import { NodeHeader } from "@/components/ui/NodeHeader"
import { NodeSettings } from "@/components/ui/NodeSettings"
import { NodeActions } from "@/components/ui/NodeActions"
import { SubmitButton } from "@/components/ui/SubmitButton"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchart } from "@/contexts/FlowchartContext"
import { createInteractiveProps } from "@/lib/utils/node-interaction"

/**
 * ImageNode Component
 *
 * A node component for image generation
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The ImageNode component
 */
function ImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const { handleInputInteraction } = useFlowchart()
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    seed,
    isNewNode,
    isSubmitting,
    timeRemaining,
    isGenerated,
    selectedModelId,
    handleSubmitToggle,
    handleModelChange,
    sourceNodeContent,
  } = useNodeState({
    id,
    data,
    initialModelId: "flux-dev",
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

  // Debug function to ensure click is working
  const handleDebugClick = () => {
    console.log("Image clicked, opening selector")
    setShowImageSelector(true)
  }

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      {/* Node header with type label and model selector */}
      <NodeHeader title={data.title} type="text-to-image" modelId={selectedModelId} onModelChange={handleModelChange} />

      {/* Input handle */}
      <TargetHandle position={Position.Left} id="image-input" isConnectable={isConnectable} />

      {/* Output handle - only visible when image is generated */}
      {isGenerated && <SourceHandle position={Position.Right} isConnectable={isConnectable} />}

      {/* Submit button */}
      <SubmitButton
        isSubmitting={isSubmitting}
        isGenerated={isGenerated}
        onClick={handleSubmitToggle}
        timeRemaining={timeRemaining}
        handleInputInteraction={handleInputInteraction}
      />

      {data.showImage && (
        <>
          {/* Custom image upload area */}
          <div className="space-y-1.5">
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
              {isSubmitting ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-[9px] text-gray-400 p-2 text-center">Generating image...</div>
                </div>
              ) : (
                <>
                  {data.imageUrl ? (
                    // When we have an image, show it but keep it clickable for replacement
                    <div className="relative w-full h-full">
                      <img
                        src={data.imageUrl || "/sample-image.png"}
                        alt="Generated content"
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
                      <div className="text-[9px] text-gray-400 text-center">
                        Click to select from library or drag and drop
                      </div>
                      {sourceNodeContent && (
                        <div className="text-[9px] text-yellow-300/90 font-mono tracking-wide text-center mt-2">
                          {sourceNodeContent.substring(0, 50) + (sourceNodeContent.length > 50 ? "..." : "")}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {data.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
                  {data.caption}
                </div>
              )}
            </div>
          </div>

          {/* Node settings with quality, seed, and size */}
          <NodeSettings quality={quality} setQuality={setQuality} seed={seed} />

          {/* Node actions with fullscreen and download buttons */}
          <NodeActions imageUrl={data.imageUrl} />
        </>
      )}

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

export default memo(ImageNode)

