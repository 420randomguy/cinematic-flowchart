"use client"

import { memo, useEffect, useMemo, useCallback, useState } from "react"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import type { NodeProps } from "reactflow"
import type { ImageToImageNodeData } from "@/types/node-types"
import { useReactFlow } from "reactflow"
import { VisualMirror, VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// Create stable selector outside of the component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput

function ImageToImageNode({ data, isConnectable, id }: NodeProps<ImageToImageNodeData>) {
  // Use the store with stable selector
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  
  // Get functions from the visual mirror store
  const { showContent, clearContent } = useVisualMirrorStore()
  
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting);
    },
    [setIsInteractingWithInput]
  );

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    seed,
    strength,
    setStrength,
    isSubmitting,
    isGenerated,
    timeRemaining,
    handleSubmitToggle,
    selectedModelId,
    handleModelChange,
    modelSettings,
    handleSettingsChange,
  } = useNodeState({
    id,
    data,
    initialModelId: "flux-dev",
  })

  // Use the image handling hook
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
  } = useImageHandling({
    id,
    data,
    handleInputInteraction,
  })

  // Check if an image node is connected (use props.data)
  const hasConnectedSourceImage = !!data.sourceImageUrl

  // Determine the image URL to *display* as the source, directly from props.data
  const sourceImageUrlToDisplay = data.sourceImageUrl || data.imageUrl || null
  
  // Determine the text content to display directly from props.data
  const textContentToDisplay = data.sourceNodeContent || data.content || ""
  // This node *outputs* an image, stored in data.outputImageUrl or data.imageUrl
  const outputImageUrl = data.outputImageUrl || data.imageUrl // Check type definition

  // Update the visual mirror store when data changes
  useEffect(() => {
    // Check if we have required data for this node
    const hasValidData = !!textContentToDisplay || !!sourceImageUrlToDisplay
    
    if (hasValidData) {
      // Update visual mirror with current content
      showContent(id, {
        text: textContentToDisplay,
        imageUrl: sourceImageUrlToDisplay || undefined
      })
    } else {
      // Clear visual mirror if no valid data
      clearContent(id)
    }
  }, [id, textContentToDisplay, sourceImageUrlToDisplay, showContent, clearContent])

  // Get ReactFlow utilities
  const { getNodes, setNodes } = useReactFlow()

  // Define target handles
  const targetHandleIds = useMemo(() => ["image", "text", "lora"], [])

  return (
    <>
      <div className="relative">
        <BaseNode
          id={id}
          data={{
            ...data,
            // Pass the store-managed source data down
            sourceImageUrl: sourceImageUrlToDisplay,
            sourceNodeContent: textContentToDisplay,
            // Pass the output image URL
            imageUrl: outputImageUrl, // Ensure this is the OUTPUT image property
          }}
          nodeType="image-to-image"
          title={data.title || "IMAGE-TO-IMAGE"}
          showSourceHandle={true} // Image nodes usually have an image output
          showTargetHandle={true}
          targetHandleIds={targetHandleIds}
          isConnectable={isConnectable}
          modelId={selectedModelId}
          onModelChange={handleModelChange}
          contentProps={{
            // Remove these props as we're replacing NodeContent with VisualMirror
            isSubmitting,
            isGenerated,
            timeRemaining,
            handleSubmitToggle,
            category: "image-to-image"
          }}
          settingsProps={{
            quality,
            setQuality,
            seed,
            strength,
            setStrength,
            selectedModelId,
            modelSettings,
            handleSettingsChange,
          }}
          actionsProps={{
            // Actions relate to the *output* image
            imageUrl: outputImageUrl,
          }}
        >
          {/* Add VisualMirrorImage inside BaseNode within NodeContent */}
          {isSubmitting ? (
            <div className="text-[9px] text-gray-400 p-2 text-center">Generating...</div>
          ) : isGenerated ? (
            <div className="relative w-full h-full">
              <img 
                src={outputImageUrl || "/sample-image.png"} 
                alt="Generated content" 
                className="object-cover w-full h-full" 
              />
            </div>
          ) : (
            <div className="visual-mirror-wrapper">
              <VisualMirrorImage nodeId={id} />
            </div>
          )}

          {/* Text content positioned OUTSIDE of NodeContent as a separate element */}
          {!isSubmitting && !isGenerated && (
            <VisualMirrorText nodeId={id} />
          )}
        </BaseNode>
      </div>
      
      {/* Image selector dialog remains outside BaseNode */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        onSelectImage={selectImage}
        onFileUpload={handleFileUpload}
        handleInputInteraction={handleInputInteraction}
        savedImages={savedImages}
      />
    </>
  )
}

export default memo(ImageToImageNode)

