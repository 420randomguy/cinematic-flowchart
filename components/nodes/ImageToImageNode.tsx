"use client"

import { memo, useEffect, useMemo, useCallback } from "react"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import type { NodeProps } from "reactflow"
import type { ImageToImageNodeData } from "@/types/node-types"
import { useReactFlow } from "reactflow"

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

  // Use the node connections hook to get connected image and text
  const { imageUrl: connectedImageUrl, connectedImageNodes, textContent } = useNodeConnections({ id })

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

  // Check if an image node is connected
  const hasConnectedImageNode = connectedImageNodes.length > 0
  
  // Determine the image URL to use (connected or internal)
  const displayImageUrl = useMemo(() => connectedImageUrl || data.imageUrl, [connectedImageUrl, data.imageUrl])

  // Get ReactFlow utilities
  const { getNodes, setNodes } = useReactFlow()

  // Define target handles
  const targetHandleIds = useMemo(() => ["image", "text", "lora"], [])

  return (
    <>
      <BaseNode
        id={id}
        data={data}
        nodeType="image-to-image"
        title={data.title || "IMAGE-TO-IMAGE"}
        showSourceHandle={true} // Image nodes usually have an image output
        showTargetHandle={true}
        targetHandleIds={targetHandleIds}
        isConnectable={isConnectable}
        modelId={selectedModelId}
        onModelChange={handleModelChange}
        connectedPreviewUrl={connectedImageUrl}
        contentProps={{
          imageUrl: connectedImageUrl,
          fallbackImageUrl: data.imageUrl,
          textContent: textContent,
          category: "image-to-image",
          isSubmitting,
          isGenerated,
          timeRemaining,
          handleSubmitToggle,
          isDragging: hasConnectedImageNode ? undefined : isDragging,
          dropRef: hasConnectedImageNode ? undefined : dropRef,
          handleDragOver: hasConnectedImageNode ? undefined : handleDragOver,
          handleDragLeave: hasConnectedImageNode ? undefined : handleDragLeave,
          handleDrop: hasConnectedImageNode ? undefined : handleDrop,
          handleClick: hasConnectedImageNode ? undefined : handleClick,
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
          imageUrl: displayImageUrl,
        }}
      />
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

