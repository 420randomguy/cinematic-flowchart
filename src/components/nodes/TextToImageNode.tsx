"use client"

import { memo } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types/node-types"
import { BaseNode } from "@/components/core/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useModelSelector } from "@/hooks/useModelSelector"

function TextToImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
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
    modelSettings,
    handleModelChange,
    handleSettingsChange,
  } = useNodeState({
    id,
    data,
    initialModelId: "flux-dev",
  })

  // Use the model selector hook for model-specific functionality
  const { availableModels } = useModelSelector({
    category: "text-to-image",
    initialModelId: selectedModelId,
    onModelChange: (modelId, settings) => {
      handleModelChange(modelId)
      handleSettingsChange(settings)
    },
  })

  // Get text content from connected nodes or data
  const textContent = data.sourceNodeContent || data.content || ""

  return (
    <BaseNode
      id={id}
      data={data}
      nodeType="text-to-image"
      title={data.title || "TEXT-TO-IMAGE"}
      showSourceHandle={true}
      showTargetHandle={true}
      targetHandleIds={["text", "lora"]}
      isConnectable={isConnectable}
      modelId={selectedModelId}
      onModelChange={handleModelChange}
      contentProps={{
        imageUrl: data.imageUrl,
        textContent: textContent,
        category: "text-to-image",
        isSubmitting,
        isGenerated,
        timeRemaining,
        handleSubmitToggle,
      }}
      settingsProps={{
        quality,
        setQuality,
        seed,
        selectedModelId,
        modelSettings,
        handleModelChange,
        handleSettingsChange,
        handleSubmitToggle,
      }}
      actionsProps={{
        imageUrl: data.imageUrl,
        showVideo: false,
      }}
    />
  )
}

export default memo(TextToImageNode)

