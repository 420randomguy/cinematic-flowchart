"use client"

import { memo, useState, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useMemoizedNodeProps } from "@/hooks/useMemoizedNodeProps"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { useReactFlow } from "reactflow"

function ImageToVideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  
  // Get ReactFlow utilities
  const { getNodes, setNodes } = useReactFlow()

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

  // Determine the content to display directly from props.data
  const textToDisplay = data.sourceNodeContent || data.content || ""
  const imageUrlToDisplay = data.sourceImageUrl || data.imageUrl || null

  // Log the final content being used for rendering this cycle
  console.log(`[ImageToVideoNode:RENDER] ${id} Rendering with image: "${imageUrlToDisplay}", text: "${textToDisplay}" (from props.data)`)

  // Determine validity based on the final display values
  const hasValidImages = !!imageUrlToDisplay
  const hasValidText = !!textToDisplay

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        // Pass the store-managed source data down
        sourceImageUrl: imageUrlToDisplay,
        sourceNodeContent: textToDisplay,
        // Pass the *output* video URL (if generated)
        // videoUrl: data.videoUrl // Assuming VideoNodeData has videoUrl for output
      }}
      nodeType="image-to-video"
      title={nodeProps.title || "IMAGE-TO-VIDEO"}
      showSourceHandle={true}
      showTargetHandle={true}
      targetHandleIds={["text", "image"]}
      isConnectable={isConnectable}
      modelId={selectedModelId}
      onModelChange={handleModelChange}
      contentProps={{
        imageUrl: imageUrlToDisplay,
        showImage: hasValidImages,
        textContent: textToDisplay,
        category: "image-to-video",
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

export default memo(ImageToVideoNode)

