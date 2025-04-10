"use client"

import { memo, useState, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useMemoizedNodeProps } from "@/hooks/useMemoizedNodeProps"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { useReactFlow } from "reactflow"
import { VisualMirror, VisualMirrorImage, VisualMirrorText } from "@/components/nodes/VisualMirror"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import Image from "next/image"

function ImageToVideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  
  // Get the showContent function from Visual Mirror store
  const { showContent, clearContent } = useVisualMirrorStore()
  
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
  const outputVideoUrl = data.videoUrl || "/akira-animation.gif"

  // Log the final content being used for rendering this cycle
  console.log(`[ImageToVideoNode:RENDER] ${id} Rendering with image: "${imageUrlToDisplay}", text: "${textToDisplay}" (from props.data)`)

  // Determine validity based on the final display values
  const hasValidImages = !!imageUrlToDisplay
  const hasValidText = !!textToDisplay

  // Update the visual mirror store when data changes
  useEffect(() => {
    // Check if we have required data for this node
    const hasValidData = !!textToDisplay || !!imageUrlToDisplay
    
    if (hasValidData) {
      // Update visual mirror with current content
      showContent(id, {
        text: textToDisplay,
        imageUrl: imageUrlToDisplay || undefined
      })
    } else {
      // Clear visual mirror if no valid data
      clearContent(id)
    }
  }, [id, textToDisplay, imageUrlToDisplay, showContent, clearContent])

  return (
    <div className="relative">
      <BaseNode
        id={id}
        data={{
          ...data,
          // Pass the store-managed source data down
          sourceImageUrl: imageUrlToDisplay,
          sourceNodeContent: textToDisplay,
          // Pass the *output* video URL (if generated)
          videoUrl: outputVideoUrl
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
          isSubmitting,
          isGenerated,
          timeRemaining,
          handleSubmitToggle,
          category: "image-to-video",
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
          videoUrl: outputVideoUrl,
        }}
      >
        {/* Add VisualMirrorImage inside BaseNode within NodeContent */}
        {isSubmitting ? (
          <div className="text-[9px] text-gray-400 p-2 text-center">Generating...</div>
        ) : isGenerated ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image 
              src={outputVideoUrl} 
              alt="Generated video" 
              width={260} 
              height={146} 
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="visual-mirror-wrapper">
            <VisualMirrorImage nodeId={id} />
          </div>
        )}

        {/* Text content positioned OUTSIDE of NodeContent as a separate element */}
        {!isSubmitting && !isGenerated && (
          <VisualMirrorText nodeId={id} />
        )}
      </BaseNode>
      
      {/* Remove the original VisualMirror that's causing duplication */}
    </div>
  )
}

export default memo(ImageToVideoNode)

