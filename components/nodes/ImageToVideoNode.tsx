"use client"

import { memo, useState, useCallback } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorUpdate } from "@/hooks/useVisualMirrorUpdate"

// Create stable selector outside component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput

function ImageToVideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    seed,
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
    initialModelId: "wan-pro",
  })

  // Use the visual mirror update hook to sync node data with the store
  useVisualMirrorUpdate(id, data, isSubmitting)

  // Use the image handling hook
  const {
    isDragging,
    dropRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
  } = useImageHandling({
    id,
    data,
    handleInputInteraction: (isInteracting) => setIsInteractingWithInput(isInteracting),
  })

  // Determine the text content to display directly from props.data
  const textToDisplay = data.sourceNodeContent || data.content || ""
  
  // Determine the image URL to display as the source
  const sourceImageUrlToDisplay = data.sourceImageUrl || data.imageUrl || null
  
  // This node outputs a video
  const outputVideoUrl = data.videoUrl || "/akira-animation.gif" // Use a placeholder video if none available

  // Update data object with video URL when generated
  if (isGenerated && !isSubmitting) {
    data.videoUrl = outputVideoUrl;
  }

  // Check if input requirements are met
  const hasValidText = !!textToDisplay;
  const hasValidImages = !!sourceImageUrlToDisplay;
  
  // Update submit button disabled state based on connections
  const isSubmitDisabled = !hasValidText || !hasValidImages;

  return (
    <div className="relative" onMouseDown={() => setIsInteractingWithInput(false)}>
      <BaseNode
        id={id}
        data={{
          ...data,
          sourceNodeContent: textToDisplay,
          sourceImageUrl: sourceImageUrlToDisplay,
          showImage: true,
        }}
        nodeType="image-to-video"
        title={data.title || "IMAGE-TO-VIDEO"}
        showSourceHandle={true}
        showTargetHandle={true}
        targetHandleIds={["text", "image"]}
        isConnectable={isConnectable}
        modelId={selectedModelId}
        onModelChange={handleModelChange}
        contentProps={{
          isSubmitting,
          isGenerated,
          timeRemaining,
          handleSubmitToggle,
          disabled: isSubmitDisabled,
          category: "image-to-video",
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
          selectedModelId,
          modelSettings,
          handleSettingsChange,
        }}
      >
        {isSubmitting ? (
          <div className="text-[9px] text-gray-400 p-2 text-center">Generating...</div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* VisualMirrorImage removed from here to avoid duplication */}
          </div>
        )}

        {/* Text content positioned OUTSIDE of NodeContent as a separate element */}
        {!isSubmitting && !isGenerated && (
          <VisualMirrorText nodeId={id} />
        )}
      </BaseNode>
    </div>
  )
}

export default memo(ImageToVideoNode)

