"use client"

import { memo, useState, useCallback, useEffect, useRef } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// Create stable selector outside component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput

function ImageToVideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  const { showContent, clearContent } = useVisualMirrorStore()
  
  // Reference for drag-and-drop
  const dropRef = useRef<HTMLDivElement>(null)
  
  // Local state for image handling
  const [isDragging, setIsDragging] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [savedImages] = useState([]) // Default to empty array since VideoNodeData doesn't have savedImages

  // Create handler for input interaction
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

  // Use our consolidated image handling hook
  const {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleFileUpload,
    selectImage,
  } = useImageHandling({
    id,
    data,
    handleInputInteraction,
  })

  // Determine text-based content to display (if connected to a text node)
  const textToDisplay = data.sourceNodeContent || data.content || ""

  // Determine image-based source to display (if uploaded or connected)
  const sourceImageUrlToDisplay = data.sourceImageUrl || data.imageUrl || null
  
  // Set or update visual mirror content
  useEffect(() => {
    if (textToDisplay) {
      showContent(id, { text: textToDisplay })
    }
    
    if (sourceImageUrlToDisplay) {
      showContent(id, { imageUrl: sourceImageUrlToDisplay })
    }
    
    if (data.videoUrl) {
      showContent(id, { imageUrl: data.videoUrl })
    }
    
    return () => {
      clearContent(id)
    }
  }, [id, textToDisplay, sourceImageUrlToDisplay, data.videoUrl, showContent, clearContent])

  // This node outputs a video
  const outputVideoUrl = data.videoUrl || "/akira-animation.gif" // Use a placeholder if none available

  // Update data object with video URL when generated
  if (isGenerated && !isSubmitting) {
    data.videoUrl = outputVideoUrl;
  }

  // Check if input requirements are met
  const hasValidImage = !!sourceImageUrlToDisplay;
  const isSubmitDisabled = !hasValidImage;

  return (
    <div className="relative" onMouseDown={() => setIsInteractingWithInput(false)}>
      <BaseNode
        id={id}
        data={{
          ...data,
          content: textToDisplay,
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

