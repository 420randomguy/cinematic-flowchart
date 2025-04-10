"use client"

import { memo, useEffect, useMemo, useCallback, useState } from "react"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import type { NodeProps } from "reactflow"
import type { ImageToImageNodeData } from "@/types/node-types"
import { useReactFlow } from "reactflow"
import { VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useVisualMirrorUpdate } from "@/hooks/useVisualMirrorUpdate"

// Create stable selector outside of the component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput

function ImageToImageNode({ data, isConnectable, id }: NodeProps<ImageToImageNodeData>) {
  // Use the store with stable selector
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  
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

  // Use the visual mirror update hook to sync node data with the store
  useVisualMirrorUpdate(id, data, isSubmitting)

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

  // Determine the image URL to *display* as the source, directly from props.data
  const sourceImageUrlToDisplay = data.sourceImageUrl || data.imageUrl || null
  
  // Determine the text content to display directly from props.data
  const textContentToDisplay = data.sourceNodeContent || data.content || ""
  
  // This node *outputs* an image, stored in data.outputImageUrl or data.imageUrl
  const outputImageUrl = data.outputImageUrl || data.imageUrl // Check type definition

  // Update data object with output image URL when generated
  if (isGenerated && outputImageUrl && !isSubmitting) {
    data.imageUrl = outputImageUrl;
  }

  // Define target handles
  const targetHandleIds = useMemo(() => ["image", "text", "lora"], [])

  // Check if input requirements are met
  const hasConnectedText = !!textContentToDisplay;
  const hasConnectedSourceImage = !!sourceImageUrlToDisplay;
  
  // Update submit button disabled state based on connections
  const isSubmitDisabled = !hasConnectedText || !hasConnectedSourceImage;

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
            isSubmitting,
            isGenerated,
            timeRemaining,
            handleSubmitToggle,
            category: "image-to-image",
            disabled: isSubmitDisabled,
            handleDragOver,
            handleDragLeave,
            handleDrop,
            handleClick,
            dropRef,
            isDragging
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
        >
          {/* Add VisualMirrorImage inside BaseNode within NodeContent */}
          {isSubmitting ? (
            <div className="text-[9px] text-gray-400 p-2 text-center">Generating...</div>
          ) : (
            <div className="relative w-full h-full">
              {/* VisualMirrorImage removed from here to avoid duplication */}
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

