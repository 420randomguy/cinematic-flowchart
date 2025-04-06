"use client"

import { memo, useState, useCallback } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"

function TextToImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    seed,
    selectedModelId,
    modelSettings,
    handleModelChange,
    handleSettingsChange,
    handleSubmitToggle: originalHandleSubmitToggle,
  } = useNodeState({
    id,
    data,
  })

  // Create a submit handler that updates local state
  const handleSubmitToggle = useCallback(() => {
    if (isSubmitting) {
      setIsSubmitting(false)
      setTimeRemaining(5)
    } else if (isGenerated) {
      // Handle regeneration
      setIsSubmitting(true)
      setIsGenerated(false)

      // Simulate generation process
      let time = 5
      const interval = setInterval(() => {
        time--
        setTimeRemaining(time)

        if (time <= 0) {
          clearInterval(interval)
          setIsSubmitting(false)
          setIsGenerated(true)
        }
      }, 1000)
    } else {
      // Handle initial generation
      setIsSubmitting(true)

      // Simulate generation process
      let time = 5
      const interval = setInterval(() => {
        time--
        setTimeRemaining(time)

        if (time <= 0) {
          clearInterval(interval)
          setIsSubmitting(false)
          setIsGenerated(true)
        }
      }, 1000)
    }

    // Call the original handler if it exists
    if (originalHandleSubmitToggle) {
      originalHandleSubmitToggle()
    }
  }, [isSubmitting, isGenerated, originalHandleSubmitToggle])

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
      }}
    />
  )
}

export default memo(TextToImageNode)

