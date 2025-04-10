"use client"

import { memo, useCallback, useState, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useMemoizedNodeProps } from "@/hooks/useMemoizedNodeProps"
import { useNodeConnections } from "@/hooks/useNodeConnections"

function TextToVideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting)
    },
    [setIsInteractingWithInput],
  )

  const { nodeProps } = useMemoizedNodeProps(id, data)
  
  // Add state for text-to-video generation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [quality, setQuality] = useState(data.quality || 80)
  const [selectedModelId, setSelectedModelId] = useState(data.modelId || "wan-pro")
  const [modelSettings, setModelSettings] = useState(data.modelSettings || {})
  const [seed] = useState(data.seed || Math.floor(Math.random() * 1000000000).toString())

  // Add handlers
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
  }, [])

  const handleSettingsChange = useCallback((settings: Record<string, any>) => {
    setModelSettings(settings)
  }, [])

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
  }, [isSubmitting, isGenerated])

  // Determine the text to display directly from props.data
  const textToDisplay = data.sourceNodeContent || data.content || ""

  // Log the final text being used for rendering this cycle
  console.log(`[TextToVideoNode:RENDER] ${id} Rendering with text: "${textToDisplay}" (from props.data)`)

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        // Pass the store-managed source content down to BaseNode
        sourceNodeContent: textToDisplay,
        // This node primarily uses text input, sourceImageUrl might be irrelevant unless connected?
        // sourceImageUrl: data.sourceImageUrl // Keep if Image handle is possible
      }}
      nodeType="text-to-video"
      title={nodeProps.title || "TEXT-TO-VIDEO"}
      showSourceHandle={true}
      showTargetHandle={true}
      targetHandleIds={["text"]}
      isConnectable={isConnectable}
      modelId={selectedModelId}
      onModelChange={handleModelChange}
      contentProps={{
        showVideo: data.showVideo || false,
        // Pass text down for NodeContent
        textContent: textToDisplay,
        category: "text-to-video",
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
      }}
      actionsProps={{
        showVideo: data.showVideo || false,
      }}
    />
  )
}

export default memo(TextToVideoNode)

