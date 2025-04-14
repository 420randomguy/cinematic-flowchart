"use client"

import { memo, useState, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { VisualMirrorText, VisualMirrorImage } from "@/components/nodes/VisualMirror"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

function TextToVideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
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

  // Determine the text content to display directly from props.data
  const textToDisplay = data.sourceNodeContent || data.content || ""
  
  // Set or update visual mirror content
  useEffect(() => {
    if (textToDisplay) {
      showContent(id, { text: textToDisplay })
    }
    
    // Show placeholder or actual video
    if (isGenerated && !isSubmitting) {
      showContent(id, { imageUrl: data.videoUrl || "/akira-animation.gif" })
    }
    
    return () => {
      clearContent(id)
    }
  }, [id, textToDisplay, isGenerated, isSubmitting, data.videoUrl, showContent, clearContent])
  
  // This node outputs a video
  const outputVideoUrl = data.videoUrl || "/akira-animation.gif" // Use a placeholder video if none available

  // Update data object with video URL when generated
  if (isGenerated && !isSubmitting) {
    data.videoUrl = outputVideoUrl;
  }

  // Check if input requirements are met
  const hasValidText = !!textToDisplay;

  // Update submit button disabled state based on connections
  const isSubmitDisabled = !hasValidText;

  return (
    <div className="relative" onMouseDown={() => setIsInteractingWithInput(false)}>
      <BaseNode
        id={id}
        data={{
          ...data,
          // Pass the determined source content down to BaseNode
          sourceNodeContent: textToDisplay,
          showImage: true,
        }}
        nodeType="text-to-video"
        title={data.title || "TEXT-TO-VIDEO"}
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
          category: "text-to-video"
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
          <div className="relative w-full h-full flex items-center justify-center">
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

export default memo(TextToVideoNode)

