"use client"

import { memo, useEffect, useMemo, useCallback, useState, useRef } from "react"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import type { NodeProps } from "reactflow"
import type { ImageToImageNodeData } from "@/types/node-types"
import { useReactFlow } from "reactflow"
import { VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// Create stable selector outside of the component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput
const getNodeSelector = (state: any) => state.getNode

function ImageToImageNode({ data, isConnectable, id }: NodeProps<ImageToImageNodeData>) {
  // Use the store with stable selector
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  const getNode = useFlowchartStore(getNodeSelector)
  const { showContent, clearContent } = useVisualMirrorStore()
  
  // Reference for drag-and-drop
  const dropRef = useRef<HTMLDivElement>(null)
  
  // State for dialog
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [savedImages, setSavedImages] = useState([]) // Default to empty array
  const [isDragging, setIsDragging] = useState(false)

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
    numbers,
    setNumbers,
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

  // Use image handling hooks
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
    handleInputInteraction
  })

  // Determine the text content to display directly from props.data
  const textToDisplay = (data as any).sourceNodeContent || data.content || ""

  // Determine if we have a source image to use
  const sourceImageUrlToDisplay = data.sourceImageUrl || data.imageUrl || null
  
  // Set or update visual mirror content
  useEffect(() => {
    if (textToDisplay) {
      showContent(id, { text: textToDisplay })
    }
    
    if (sourceImageUrlToDisplay) {
      showContent(id, { imageUrl: sourceImageUrlToDisplay })
    }
    
    // Show placeholder or actual image when generated
    if (isGenerated && !isSubmitting) {
      showContent(id, { imageUrl: data.imageUrl || "/sample-image.png" })
    }
    
    return () => {
      clearContent(id)
    }
  }, [id, textToDisplay, sourceImageUrlToDisplay, isGenerated, isSubmitting, data.imageUrl, showContent, clearContent])

  // The output image URL when generated
  const outputImageUrl = data.imageUrl || null

  // Check if input requirements are met
  const hasValidImage = !!sourceImageUrlToDisplay;
  const isSubmitDisabled = !hasValidImage;

  return (
    <>
      <div className="relative" onMouseDown={() => setIsInteractingWithInput(false)}>
        <BaseNode
          id={id}
          data={{
            ...data,
            content: textToDisplay,
            sourceImageUrl: sourceImageUrlToDisplay,
            showImage: true,
          }}
          nodeType="image-to-image"
          title={data.title || "IMAGE-TO-IMAGE"}
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
            category: "image-to-image",
            handleDragOver,
            handleDragLeave,
            handleDrop,
            handleClick,
            dropRef,
            isDragging
          }}
          settingsProps={{
            slider: quality,
            setQuality,
            numbers,
            setNumbers,
            selectedModelId,
            modelSettings,
            handleModelChange,
            handleSettingsChange,
          }}
        >
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

