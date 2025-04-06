"use client"

import { memo, useCallback, useState, useEffect, useMemo } from "react"
import type { NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { BaseNodeContainer } from "@/components/core/BaseNodeContainer"
import { NodeHeaderSection } from "@/components/nodes/sections/NodeHeaderSection"
import { OutputSection } from "@/components/nodes/sections/OutputSection"
import { SettingsSection } from "@/components/nodes/sections/SettingsSection"
import { ActionsSection } from "@/components/nodes/sections/ActionsSection"
import { SubmitButton } from "@/components/ui/submit-button"
import { TextPreview } from "@/components/ui/text-preview"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { useImageHandling } from "@/hooks/useImageHandling"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useReactFlow } from "reactflow"
import { useNodeState } from "@/hooks/useNodeState"
import { NodeContent } from "@/components/nodes/NodeContent"

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
  const { textContent, imageUrl, connectedImageNodes } = useNodeConnections({ id })

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

  // Add state for video generation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [quality, setQuality] = useState(data.quality || 80)
  const [selectedModelId, setSelectedModelId] = useState(data.modelId || "wan-pro")
  const [modelSettings, setModelSettings] = useState(data.modelSettings || {})
  const [seed, setSeed] = useState(data.seed || 42)

  // Check if an image node is connected
  const hasConnectedImageNode = connectedImageNodes.length > 0

  // Check if text content is available
  const hasTextContent = !!textContent

  // Get ReactFlow utilities
  const { getNodes, setNodes } = useReactFlow()

  // Update the node when connected image changes
  useEffect(() => {
    if (connectedImageNodes.length > 0) {
      const sourceNodeId = connectedImageNodes[0]
      const nodes = getNodes()
      const sourceNode = nodes.find((n) => n.id === sourceNodeId)

      if (sourceNode?.data?.imageUrl && sourceNode.data.imageUrl !== data.imageUrl) {
        // Update this node's image URL directly
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    imageUrl: sourceNode.data.imageUrl,
                  },
                }
              : node,
          ),
        )
      }
    }
  }, [connectedImageNodes, id, getNodes, setNodes, data.imageUrl])

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

  // Determine if we should show the video
  const showVideo = isGenerated || data.showVideo || false

  return (
    <>
      <BaseNodeContainer id={id} data={data} nodeType="image-to-video" isConnectable={isConnectable}>
        <NodeHeaderSection
          title={data.title || "IMAGE-TO-VIDEO"}
          type="image-to-video"
          modelId={selectedModelId}
          onModelChange={handleModelChange}
        />

        {/* Submit button */}
        <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
          <SubmitButton
            isSubmitting={isSubmitting}
            isGenerated={isGenerated}
            onClick={handleSubmitToggle}
            timeRemaining={timeRemaining}
          />
        </div>

        {/* Output section with image/video */}
        <OutputSection
          title="VIDEO OUTPUT"
          imageUrl={data.imageUrl}
          showVideo={true}
          isDragging={isDragging}
          handleDragOver={isDragging ? handleDragOver : undefined}
          handleDragLeave={isDragging ? handleDragLeave : undefined}
          handleDrop={isDragging ? handleDrop : undefined}
          handleClick={handleClick}
          isGenerated={isGenerated}
          isSubmitting={isSubmitting}
        />

        {/* Text preview */}
        <TextPreview
          text={textContent}
          nodeId={id}
          maxLength={100}
          showIfEmpty={true}
          emptyText="Connect text node"
          isConnected={hasTextContent}
          className="mt-2 border-t border-gray-800/30 pt-2"
        />

        {/* Settings section */}
        <SettingsSection quality={quality} setQuality={setQuality} seed={seed} showSizeSelector={true} />

        {/* Actions section */}
        <ActionsSection imageUrl={imageUrl || data.imageUrl} showVideo={showVideo} />
      </BaseNodeContainer>

      {/* Image selector dialog */}
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

