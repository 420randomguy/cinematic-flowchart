"use client"

import { memo, useState, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// REMOVED event detail structure
// interface FlowchartContentUpdateDetail { ... }
// interface FlowchartImageUpdateDetail { ... }

function TextToImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const { showContent, clearContent } = useVisualMirrorStore()
  
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
    negativePrompt,
    handleNegativePromptChange,
    loraUrls,
    handleLoraUrlsChange,
  } = useNodeState({
    id,
    data,
    initialModelId: "flux-dev",
  })
  
  // Determine the text content to display
  const textToDisplay = data.sourceNodeContent || data.content || ""
  
  // Set or update visual mirror content
  useEffect(() => {
    if (textToDisplay) {
      showContent(id, { text: textToDisplay })
    }
    
    // Show placeholder or actual image
    if (isGenerated && !isSubmitting) {
      showContent(id, { imageUrl: data.imageUrl || "/sample-image.png" })
    }
    
    return () => {
      clearContent(id)
    }
  }, [id, textToDisplay, isGenerated, isSubmitting, data.imageUrl, showContent, clearContent])
  
  // The output image URL
  const outputImageUrl = data.imageUrl || null
  
  // Optional source image URL, used for potential connections
  const sourceImageUrlToDisplay = data.sourceImageUrl || null

  // Check if input requirements are met
  const hasConnectedText = !!textToDisplay;
  
  // Update submit button disabled state based on connections
  const isSubmitDisabled = !hasConnectedText;

  return (
    <div className="relative" onMouseDown={() => setIsInteractingWithInput(false)}>
      <BaseNode
        id={id}
        data={{
          ...data,
          // Remove the props that are causing issues
          imageUrl: outputImageUrl,
        }}
        nodeType="text-to-image"
        title={data.title || "TEXT-TO-IMAGE"}
        showSourceHandle={true}
        showTargetHandle={true}
        targetHandleIds={["text"]}
        isConnectable={isConnectable}
        modelId={selectedModelId}
        onModelChange={handleModelChange}
        contentProps={{
          isSubmitting,
          isGenerated,
          timeRemaining,
          handleSubmitToggle,
          disabled: isSubmitDisabled,
          category: "text-to-image"
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
          negativePrompt,
          onNegativePromptChange: handleNegativePromptChange,
          loraUrls,
          onLoraUrlsChange: handleLoraUrlsChange,
        }}
      >
        {isSubmitting ? (
          <div className="text-[9px] text-gray-400 p-2 text-center">Generating...</div>
        ) : (
          <div className="relative w-full h-full">
            {/* VisualMirrorImage removed as requested */}
          </div>
        )}

        {/* Text content for non-generated state */}
        {!isSubmitting && !isGenerated && (
          <VisualMirrorText nodeId={id} />
        )}
      </BaseNode>
    </div>
  )
}

export default memo(TextToImageNode)

