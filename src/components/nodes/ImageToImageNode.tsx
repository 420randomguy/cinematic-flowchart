"use client"

import { memo } from "react"
import type { NodeProps } from "reactflow"
import type { ImageToImageNodeData } from "@/types/node-types"
import { BaseNode } from "@/components/core/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useCallback } from "react"

function ImageToImageNode({ data, isConnectable, id }: NodeProps<ImageToImageNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting)
    },
    [setIsInteractingWithInput],
  )

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
    modelSettings,
    handleModelChange,
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

  // Get text content from connected nodes or data
  const textContent = data.sourceNodeContent || data.content || ""

  return (
    <>
      <BaseNode
        id={id}
        data={data}
        nodeType="image-to-image"
        title={data.title || "IMAGE-TO-IMAGE"}
        showSourceHandle={true}
        showTargetHandle={true}
        targetHandleIds={["text", "image", "lora"]}
        isConnectable={isConnectable}
        modelId={selectedModelId}
        onModelChange={handleModelChange}
        contentProps={{
          imageUrl: data.imageUrl,
          textContent: textContent,
          isDragging,
          handleDragOver,
          handleDragLeave,
          handleDrop,
          handleClick,
          category: "image-to-image",
          isSubmitting,
          isGenerated,
          timeRemaining,
          handleSubmitToggle,
          dropRef,
        }}
        settingsProps={{
          quality,
          setQuality,
          seed,
          strength,
          setStrength,
          selectedModelId,
          modelSettings,
          handleModelChange,
          handleSettingsChange,
          handleSubmitToggle,
        }}
        actionsProps={{
          imageUrl: data.imageUrl || data.outputImageUrl,
          showVideo: false,
        }}
      />

      {/* Image selector dialog */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        savedImages={savedImages}
        onSelectImage={selectImage}
        onFileUpload={handleFileUpload}
        handleInputInteraction={handleInputInteraction}
      />
    </>
  )
}

export default memo(ImageToImageNode)

