"use client"

import { memo, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useMemoizedNodeProps } from "@/hooks/useMemoizedNodeProps"
import { useConnectionStore } from "@/store/useConnectionStore"

function ImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const updateNodeImageUrl = useConnectionStore((state) => state.updateNodeImageUrl)

  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting)
    },
    [setIsInteractingWithInput],
  )

  // Use our consolidated hook
  const { nodeProps } = useMemoizedNodeProps(id, data)
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

  // Add this useEffect to register the image URL with the connection store
  // Update the connection store with the image URL when it changes
  useEffect(() => {
    if (data.imageUrl) {
      // Register the image URL with the connection store
      updateNodeImageUrl(id, data.imageUrl)
    }
  }, [id, data.imageUrl, updateNodeImageUrl])

  useEffect(() => {
    if (dropRef?.current && document.querySelector(`[data-node-id="${id}"] .node-content-container`)) {
      dropRef.current = document.querySelector(`[data-node-id="${id}"] .node-content-container`)
    }
  }, [id, dropRef])

  return (
    <>
      <BaseNode
        id={id}
        data={data}
        nodeType="image"
        title={nodeProps.title || "IMAGE"}
        showSourceHandle={true}
        showTargetHandle={false}
        isConnectable={isConnectable}
        contentProps={{
          imageUrl: data.imageUrl,
          isDragging,
          // Don't pass dropRef directly in the props object to avoid serialization
          // Instead, it will be accessed via the ref on the component itself
          handleDragOver,
          handleDragLeave,
          handleDrop,
          handleClick: handleClick,
          isSubmitting: false, // Add required props
          isGenerated: false, // Add required props
        }}
        actionsProps={{
          imageUrl: data.imageUrl,
        }}
      />

      {/* Image selector dialog */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        savedImages={savedImages}
        onSelectImage={selectImage}
        onFileUpload={handleFileUpload}
        handleInputInteraction={handleInputInteraction}
      />
    </>
  )
}

export default memo(ImageNode)

