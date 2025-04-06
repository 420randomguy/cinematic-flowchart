"use client"

import { memo, useEffect, useMemo, useCallback } from "react"
import { BaseNodeContainer } from "@/components/core/BaseNodeContainer"
import { NodeHeaderSection } from "@/components/nodes/sections/NodeHeaderSection"
import { OutputSection } from "@/components/nodes/sections/OutputSection"
import { SettingsSection } from "@/components/nodes/sections/SettingsSection"
import { ActionsSection } from "@/components/nodes/sections/ActionsSection"
import { SubmitButton } from "@/components/ui/submit-button"
import { TextPreview } from "@/components/ui/text-preview"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import type { NodeProps } from "reactflow"
import type { ImageToImageNodeData } from "@/types/node-types"
import { useReactFlow } from "reactflow"

// Create stable selector outside of the component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput

function ImageToImageNode({ data, isConnectable, id }: NodeProps<ImageToImageNodeData>) {
  // Use the store with stable selector
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting);
    },
    [setIsInteractingWithInput]
  );

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    seed,
    strength,
    setStrength,
    isSubmitting,
    isGenerated,
    timeRemaining,
    handleSubmitToggle,
    selectedModelId,
    handleModelChange,
  } = useNodeState({
    id,
    data,
    initialModelId: "flux-dev",
  })

  // Use the node connections hook to get connected image
  const { imageUrl, connectedImageNodes, textContent } = useNodeConnections({ id })

  // Use the image handling hook
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
  } = useImageHandling({
    id,
    data,
    handleInputInteraction,
  })

  // Check if a text node is connected
  const hasConnectedTextNode = !!textContent

  // Check if an image node is connected
  const hasConnectedImageNode = connectedImageNodes.length > 0

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

  return (
    <>
      <BaseNodeContainer id={id} data={data} nodeType="image-to-image" isConnectable={isConnectable}>
        <NodeHeaderSection
          title={data.title || "IMAGE-TO-IMAGE"}
          type="image-to-image"
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

        {/* Output section with image */}
        <OutputSection
          title="GENERATED IMAGE"
          imageUrl={imageUrl || data.imageUrl}
          isDragging={isDragging}
          handleDragOver={hasConnectedImageNode ? undefined : handleDragOver}
          handleDragLeave={hasConnectedImageNode ? undefined : handleDragLeave}
          handleDrop={hasConnectedImageNode ? undefined : handleDrop}
          handleClick={hasConnectedImageNode ? undefined : handleClick}
          isSubmitting={isSubmitting}
          isGenerated={isGenerated}
          requiresImageInput={!imageUrl && !data.imageUrl}
        />

        {/* Text preview */}
        <TextPreview
          text={textContent}
          nodeId={id}
          maxLength={100}
          showIfEmpty={true}
          emptyText="Connect text node"
          isConnected={hasConnectedTextNode}
          className="mt-2 border-t border-gray-800/30 pt-2"
        />

        {/* Settings section */}
        <SettingsSection
          quality={quality}
          setQuality={setQuality}
          seed={seed}
          strength={strength}
          setStrength={setStrength}
          showSizeSelector={true}
        />

        {/* Actions section */}
        <ActionsSection imageUrl={imageUrl || data.imageUrl} />
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

export default memo(ImageToImageNode)

