"use client"

import { memo, useCallback, useState, useEffect, useMemo } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { useImageHandling } from "@/hooks/useImageHandling"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useReactFlow } from "reactflow"

// Create stable selector outside the component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput

function ImageToVideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  // Use the store with stable selector
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting)
    },
    [setIsInteractingWithInput],
  )

  // Use node connections hook to get connected content
  const { textContent, imageUrl: connectedImageUrl, connectedImageNodes } = useNodeConnections({ id })

  // Use image handling hook
  const {
    isDragging,
    showImageSelector,
    setShowImageSelector,
    dropRef,
    savedImages,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    selectImage,
    handleFileUpload,
  } = useImageHandling({ id, data, handleInputInteraction })

  // State for video generation, model selection, etc.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [quality, setQuality] = useState(data.quality || 80)
  const [selectedModelId, setSelectedModelId] = useState(data.modelId || "wan-pro")
  const [modelSettings, setModelSettings] = useState(data.modelSettings || {})
  const [seed, setSeed] = useState(data.seed || 42)

  // Check if an image node is connected
  const hasConnectedImageNode = connectedImageNodes.length > 0
  
  // Determine the image URL to use (connected or internal)
  const displayImageUrl = useMemo(() => connectedImageUrl || data.imageUrl, [connectedImageUrl, data.imageUrl])

  // Get ReactFlow utilities
  const { getNodes, setNodes } = useReactFlow()

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
      setIsSubmitting(true)
      setIsGenerated(false)
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
      setIsSubmitting(true)
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

  // Determine if we should show the video in NodeContent/Actions
  const showVideo = isGenerated || data.showVideo || false

  // Define target handles
  const targetHandleIds = useMemo(() => ["image", "text", "lora"], [])

  return (
    <>
      <BaseNode
        id={id}
        data={data}
        nodeType="image-to-video"
        title={data.title || "IMAGE-TO-VIDEO"}
        showSourceHandle={true} // Video nodes likely have a video/data output
        showTargetHandle={true}
        targetHandleIds={targetHandleIds}
        isConnectable={isConnectable}
        modelId={selectedModelId}
        onModelChange={handleModelChange}
        contentProps={{
          imageUrl: connectedImageUrl,
          fallbackImageUrl: data.imageUrl,
          textContent: textContent,
          category: "image-to-video",
          isSubmitting,
          isGenerated,
          showVideo,
          timeRemaining,
          handleSubmitToggle,
          isDragging: hasConnectedImageNode ? undefined : isDragging,
          dropRef: hasConnectedImageNode ? undefined : dropRef,
          handleDragOver: hasConnectedImageNode ? undefined : handleDragOver,
          handleDragLeave: hasConnectedImageNode ? undefined : handleDragLeave,
          handleDrop: hasConnectedImageNode ? undefined : handleDrop,
          handleClick: hasConnectedImageNode ? undefined : handleClick,
        }}
        settingsProps={{
          quality,
          setQuality,
          seed,
          selectedModelId,
          modelSettings,
          handleSettingsChange,
        }}
        actionsProps={{
          imageUrl: displayImageUrl,
          showVideo,
        }}
      />

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

export default memo(ImageToVideoNode)

