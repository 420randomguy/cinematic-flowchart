"use client"

import { memo, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types/node-types"
import { BaseNode } from "@/components/core/BaseNode"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useNodeState } from "@/hooks/useNodeState"

function ImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting)
    },
    [setIsInteractingWithInput],
  )

  // Use our consolidated hooks
  const { nodeProps } = useNodeState({ id, data })
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

  // Memoized click handler
  const handleImageClick = useCallback(() => {
    setShowImageSelector(true)
  }, [setShowImageSelector])

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
          handleClick: handleImageClick,
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

