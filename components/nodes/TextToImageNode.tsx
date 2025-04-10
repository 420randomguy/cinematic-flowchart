"use client"

import { memo, useState, useCallback } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorUpdate } from "@/hooks/useVisualMirrorUpdate"

// REMOVED event detail structure
// interface FlowchartContentUpdateDetail { ... }
// interface FlowchartImageUpdateDetail { ... }

function TextToImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
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
    initialModelId: "flux-dev",
  })
  
  // Use the visual mirror update hook to sync node data with the store
  useVisualMirrorUpdate(id, data, isSubmitting)
  
  // Get connected node content directly from props (updated by store)
  // const { textContent: connectedTextContentViaHook } = useNodeConnections({ id })
  
  // REMOVED Initialization effect
  // useEffect(() => { ... }, [...])

  // REMOVED Effect for handling real-time updates via events
  // useEffect(() => { ... }, [id])

  // Determine the text content to display directly from props.data
  const textToDisplay = data.sourceNodeContent || data.content || ""
  
  // This node *outputs* an image, stored in data.imageUrl
  const outputImageUrl = data.imageUrl
  
  // Update data object with output image URL when generated
  if (isGenerated && outputImageUrl && !isSubmitting) {
    data.imageUrl = outputImageUrl;
  }

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

