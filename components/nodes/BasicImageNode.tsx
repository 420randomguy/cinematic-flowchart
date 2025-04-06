"use client"

import { memo, useCallback } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useFlowchart } from "@/contexts/FlowchartContext"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useMemoizedNodeProps } from "@/hooks/useMemoizedNodeProps"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"

/**
 * BasicImageNode Component
 *
 * A node component for displaying images
 */
function BasicImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const { handleInputInteraction } = useFlowchart()
  const { nodeProps } = useMemoizedNodeProps(id, data)

  // Use the image handling hook for image selection and upload
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
  } = useImageHandling({ id, data })

  // Memoized click handler
  const handleDebugClick = useCallback(() => {
    setShowImageSelector(true)
  }, [setShowImageSelector])

  return (
    <>
      <BaseNode
        id={id}
        data={data}
        nodeType="image"
        title={nodeProps.title || "IMAGE"}
        showTargetHandle={true}
        isConnectable={isConnectable}
        contentProps={{
          imageUrl: data.imageUrl,
          isDragging,
          dropRef,
          handleDragOver,
          handleDragLeave,
          handleDrop,
          handleClick: handleDebugClick,
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

export default memo(BasicImageNode, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.data.title === nextProps.data.title &&
    prevProps.data.imageUrl === nextProps.data.imageUrl &&
    prevProps.data.showImage === nextProps.data.showImage
  )
})

